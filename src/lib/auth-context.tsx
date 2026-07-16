"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { User, Role } from "./types"
import { supabase, isSupabaseConfigured } from "./supabase"
import { useRouter } from "next/navigation"

// ── Types ──────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null
  loading: boolean

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>

  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,

  login: async () => ({ success: false }),

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
 * Returns null if no profile row exists or on any error.
 * A null return means the user is authenticated in Supabase Auth but has no
 * application profile — treat as unauthenticated at the application level.
 */
async function fetchProfileFromDb(userId: string, emailFallback: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("name, role, child_id")
      .eq("id", userId)
      .maybeSingle()

    if (error) {
      console.error("[auth] fetchProfileFromDb error:", error.message)
      return null
    }

    if (!data) {
      // No profile row — user exists in Supabase Auth but has no application
      // record. Do NOT fabricate a role. Return null so the caller treats this
      // user as unauthenticated at the application level.
      console.warn(`[auth] No profile row for user ${userId} (${emailFallback}). Treating as unauthenticated.`)
      return null
    }

    return {
      id: userId,
      email: emailFallback,
      name: data.name || "School User",
      role: data.role as Role,
      childId: data.child_id || undefined,
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


  // ── Init: resolve session from onAuthStateChange ───────────────────────
  //
  // ARCHITECTURE NOTE — why onAuthStateChange drives init (not getUser):
  //
  // The middleware validates the JWT server-side on every request before the
  // page is served. By the time this component mounts, the session is already
  // authenticated. We only need to read the locally-cached token.
  //
  // Using getUser() here creates a race condition under React Strict Mode:
  // Strict Mode intentionally mounts → unmounts → remounts every effect.
  // The cleanup calls subscription.unsubscribe(), which cancels the global
  // auto-refresh timer on the supabase-js singleton. The concurrent getUser()
  // network call may complete after cleanup, causing the second mount's init
  // to race against the first mount's in-flight result.
  //
  // The correct pattern: let onAuthStateChange with INITIAL_SESSION be the
  // single authoritative source of session state on mount. This is synchronous
  // (reads localStorage), cannot race, and the Supabase team documents this
  // as the correct client-side pattern when middleware handles server validation.
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    let active = true

    // Subscribe — INITIAL_SESSION fires synchronously on subscribe if a
    // valid local session exists; TOKEN_REFRESHED / SIGNED_IN / SIGNED_OUT
    // handle all subsequent state transitions.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return

      if (event === "INITIAL_SESSION") {
        // Session is present — hydrate the profile from DB.
        if (session?.user) {
          const sbUser = session.user
          const email = sbUser.email?.trim().toLowerCase() || ""
          const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split("@")[0] || "School User"

          try {
            let profile = await fetchProfileFromDb(sbUser.id, email)
            if (!active) return
            if (!profile) {
              // Auto-provision a parent profile if missing (e.g., Google OAuth)
              await ensureProfile(sbUser.id, email, name, "parent")
              profile = await fetchProfileFromDb(sbUser.id, email)
            }
            if (profile) {
              setUser(profile)
            } else {
              setUser(null)
            }
          } catch {
            setUser(null)
          } finally {
            setLoading(false)
          }
        } else {
          // No session in storage — user is not authenticated.
          setUser(null)
          setLoading(false)
        }
        return
      }

      if (event === "SIGNED_OUT") {
        setUser(null)
        return
      }

      // SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED — update profile from DB.
      if (session?.user) {
        const sbUser = session.user
        const email = sbUser.email?.trim().toLowerCase() || ""
        const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || "School User"

        try {
          let profile = await fetchProfileFromDb(sbUser.id, email)
          if (!active) return
          if (!profile) {
            await ensureProfile(sbUser.id, email, name, "parent")
            profile = await fetchProfileFromDb(sbUser.id, email)
          }
          if (!profile) return
          setUser(profile)
        } catch {
          // Non-fatal DB error — do not clear the session
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
        const email = data.user.email?.trim().toLowerCase() || ""
        const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split("@")[0] || "School User"
        let profile = await fetchProfileFromDb(data.user.id, email)
        
        if (!profile) {
          await ensureProfile(data.user.id, email, name, "parent")
          profile = await fetchProfileFromDb(data.user.id, email)
        }

        setUser(profile)
        return { success: true }
      }

      return { success: false, error: "Login failed. Please try again." }
    } catch (err: any) {
      return { success: false, error: err?.message || "A connection error occurred." }
    }
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
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || "An error occurred." }
    }
  }, [])

  // ── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setUser(null)
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

      login,

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
