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
  parentLogin: (admissionNo: string, password: string) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }>

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
  parentLogin: async () => ({ success: false }),

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
 * Checks for an active cookie-based parent session from /api/parent-session.
 */
async function fetchParentSession(): Promise<User | null> {
  try {
    const res = await fetch("/api/parent-session", { cache: "no-store" })
    if (!res.ok) return null
    const data = await res.json()
    if (data.authenticated && data.user) {
      return data.user as User
    }
    return null
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


  // ── Init: resolve session from onAuthStateChange or parent cookie ─────────
  useEffect(() => {
    let active = true

    const initParentFallback = async () => {
      const parentUser = await fetchParentSession()
      if (!active) return
      if (parentUser) {
        setUser(parentUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    if (!isSupabaseConfigured()) {
      initParentFallback()
      return
    }

    // Subscribe — INITIAL_SESSION fires synchronously on subscribe if a
    // valid local session exists; TOKEN_REFRESHED / SIGNED_IN / SIGNED_OUT
    // handle all subsequent state transitions.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return

      if (event === "INITIAL_SESSION") {
        // Session is present in Supabase Auth — hydrate the profile from DB.
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
          // No Supabase Auth session — check for parent cookie session
          await initParentFallback()
        }
        return
      }

      if (event === "SIGNED_OUT") {
        const parentUser = await fetchParentSession()
        if (!active) return
        setUser(parentUser)
        setLoading(false)
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

  // ── parentLogin ─────────────────────────────────────────────────────────
  const parentLogin = useCallback(async (admissionNo: string, password: string) => {
    try {
      const res = await fetch("/api/parent-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admissionNo, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        return { success: false, error: json.error || "Login failed" }
      }

      // Populate user state immediately from parent session
      const parentUser = await fetchParentSession()
      if (parentUser) {
        setUser(parentUser)
      }

      return { success: true, mustChangePassword: json.mustChangePassword }
    } catch (err: any) {
      return { success: false, error: err?.message || "A connection error occurred." }
    }
  }, [])


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
    // If user is a cookie-authenticated parent, use /api/parent-change-password
    if (user?.role === "parent") {
      try {
        const res = await fetch("/api/parent-change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword: password }),
        })
        const json = await res.json()
        if (!res.ok) {
          return { success: false, error: json.error || "Failed to update password." }
        }
        return { success: true }
      } catch (err: any) {
        return { success: false, error: err?.message || "An error occurred." }
      }
    }

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
  }, [user?.role])

  // ── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setUser(null)
    // Clear parent session cookie by calling a logout endpoint or directly
    try {
      await fetch("/api/parent-logout", { method: "POST" })
    } catch {
      // Ignore
    }
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
      parentLogin,

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
