"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { User, Role } from "./types"
import { supabase, isSupabaseConfigured } from "./supabase"
import { useRouter } from "next/navigation"

// ── Types ──────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null
  loading: boolean
  mustChangePassword: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  /** @deprecated Bypass login has been removed for security. This is a no-op stub. */
  bypassLogin: (email: string) => Promise<{ success: boolean }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  mustChangePassword: false,
  login: async () => ({ success: false }),
  bypassLogin: async () => ({ success: false }),
  register: async () => ({ success: false }),
  loginWithGoogle: async () => ({ success: false }),
  logout: async () => {},
  forgotPassword: async () => ({ success: false }),
  updatePassword: async () => ({ success: false }),
})

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Fetches the user profile from the `profiles` table.
 * Role comes exclusively from the database — never from email pattern matching.
 */
async function fetchProfileFromDb(userId: string, emailFallback: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("name, role, child_id, must_change_password")
      .eq("id", userId)
      .maybeSingle()

    if (!error && data) {
      return {
        id: userId,
        email: emailFallback,
        name: data.name || "School User",
        role: data.role as Role,
        childId: data.child_id || undefined,
      }
    }

    // Profile row missing — return minimal object; middleware will enforce access.
    return {
      id: userId,
      email: emailFallback,
      name: "School User",
      role: "parent",
      childId: undefined,
    }
  } catch {
    return null
  }
}

/**
 * Ensures a profile row exists for the user. Creates one if absent.
 * Role is provided by the caller (sourced from DB or defaults to "parent").
 * Never writes "admin" unless the DB already says so or the server explicitly
 * grants it via the service-role-key provisioning flow.
 */
async function ensureProfile(userId: string, email: string, name: string, role: Role) {
  try {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle()

    if (!existing) {
      await supabase.from("profiles").insert({
        id: userId,
        email,
        name,
        role,
      })
    }
    // Do NOT update role on every login — role changes are done by admin via service key only.
  } catch {
    // Non-fatal — session is still valid even if profile write fails.
  }
}

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  // ── Init: validate Supabase session on mount ────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    let active = true

    async function init() {
      try {
        // getUser() validates the JWT server-side (unlike getSession() which is local-only)
        const { data: { user: sbUser }, error } = await supabase.auth.getUser()

        if (!active) return

        if (!error && sbUser) {
          const email = sbUser.email?.trim().toLowerCase() || ""
          const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split("@")[0] || "School User"

          const profile = await fetchProfileFromDb(sbUser.id, email)
          if (profile) {
            // Check must_change_password flag
            const { data: profileData } = await supabase
              .from("profiles")
              .select("must_change_password")
              .eq("id", sbUser.id)
              .maybeSingle()
            if (active) {
              setMustChangePassword(profileData?.must_change_password || false)
              setUser(profile)
            }
            await ensureProfile(sbUser.id, email, name, profile.role)
          } else {
            if (active) setUser(null)
          }
        } else {
          // No valid Supabase session — clear user state
          if (active) setUser(null)
        }
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    init()

    // Subscribe to future auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // INITIAL_SESSION is handled by init() above
      if (event === "INITIAL_SESSION") return

      if (event === "SIGNED_OUT") {
        if (active) {
          setUser(null)
          setMustChangePassword(false)
        }
        return
      }

      if (session?.user) {
        const sbUser = session.user
        const email = sbUser.email?.trim().toLowerCase() || ""
        const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || "School User"

        const profile = await fetchProfileFromDb(sbUser.id, email)
        if (active && profile) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("must_change_password")
            .eq("id", sbUser.id)
            .maybeSingle()
          setMustChangePassword(profileData?.must_change_password || false)
          setUser(profile)
          await ensureProfile(sbUser.id, email, name, profile.role)
        }
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // ── login ───────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: "Authentication service is not configured." }
    }

    const normalised = email.toLowerCase().trim()
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalised,
        password,
      })

      if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes("email not confirmed")) {
          return { success: false, error: "Please confirm your email address before logging in." }
        }
        if (msg.includes("rate limit") || error.status === 429) {
          return { success: false, error: "Too many login attempts. Please wait and try again." }
        }
        // Generic — do not leak whether the email exists
        return { success: false, error: "Invalid email or password." }
      }

      if (data.user) {
        const profile = await fetchProfileFromDb(data.user.id, data.user.email || "")
        const { data: profileData } = await supabase
          .from("profiles")
          .select("must_change_password")
          .eq("id", data.user.id)
          .maybeSingle()
        setMustChangePassword(profileData?.must_change_password || false)
        setUser(profile)
        return { success: true }
      }

      return { success: false, error: "Login failed. Please try again." }
    } catch (err: any) {
      return { success: false, error: err?.message || "A connection error occurred." }
    }
  }, [])

  // ── bypassLogin — SECURITY: removed, no-op stub ─────────────────────────
  const bypassLogin = useCallback(async (_email: string) => {
    // bypassLogin has been permanently removed for security reasons.
    // All authentication must go through Supabase.
    if (process.env.NODE_ENV === "development") {
      console.warn("[auth] bypassLogin() has been removed. Use Supabase credentials.")
    }
    return { success: false }
  }, [])

  // ── register ────────────────────────────────────────────────────────────
  const register = useCallback(async (name: string, email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: "Authentication service is not configured." }
    }

    const normalised = email.toLowerCase().trim()
    if (!name || !normalised || !password) {
      return { success: false, error: "All fields are required." }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalised,
        password,
        options: { data: { name, role: "parent" } },
      })

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          return { success: false, error: "An account with this email already exists." }
        }
        return { success: false, error: error.message }
      }

      if (data.user) {
        await ensureProfile(data.user.id, normalised, name, "parent")
        return {
          success: true,
          error: data.user.identities?.length === 0
            ? "Account created! Check your email inbox to confirm your address."
            : undefined,
        }
      }

      return { success: false, error: "Registration failed. Please try again." }
    } catch (err: any) {
      return { success: false, error: err?.message || "Registration failed." }
    }
  }, [])

  // ── loginWithGoogle ──────────────────────────────────────────────────────
  const loginWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: "Google login is not available." }
    }
    try {
      const redirectTo = `${window.location.origin}/auth/callback`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, queryParams: { prompt: "select_account" } },
      })
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || "OAuth connection failed." }
    }
  }, [])

  // ── forgotPassword ───────────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured()) {
      // Return success to prevent email enumeration
      return { success: true }
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      })
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || "An error occurred." }
    }
  }, [])

  // ── updatePassword ───────────────────────────────────────────────────────
  const updatePassword = useCallback(async (password: string) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: "Authentication service is not configured." }
    }
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return { success: false, error: error.message }
      setMustChangePassword(false)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || "An error occurred." }
    }
  }, [])

  // ── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setUser(null)
    setMustChangePassword(false)
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut({ scope: "local" })
      } catch {
        // Ignore sign-out errors — we've already cleared local state.
      }
    }
    window.location.href = "/login"
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      mustChangePassword,
      login,
      bypassLogin,
      register,
      loginWithGoogle,
      logout,
      forgotPassword,
      updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
