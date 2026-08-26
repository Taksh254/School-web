"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import type { User, Role } from "./types"
import { supabase, isSupabaseConfigured } from "./supabase"

// ── Types ──────────────────────────────────────────────────────────────────

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthState {
  user: User | null
  loading: boolean
  authStatus: AuthStatus

  login: (email: string, password: string) => Promise<{ success: boolean; role?: Role; error?: string }>
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
  authStatus: "loading",

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
 * Fetches the user profile from the database (`profiles` or `teachers` table).
 * Role comes exclusively from the database records — never from email pattern matching.
 */
async function fetchProfileFromDb(userId: string, emailFallback: string): Promise<User | null> {
  try {
    const normalisedEmail = emailFallback.trim().toLowerCase()

    const { data, error } = await supabase
      .from("profiles")
      .select("name, role, child_id")
      .eq("id", userId)
      .maybeSingle()

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[auth] fetchProfileFromDb error:", error.message)
      }
      return null
    }

    if (data) {
      return {
        id: userId,
        email: normalisedEmail,
        name: data.name || "School User",
        role: data.role as Role,
        childId: data.child_id || undefined,
      }
    }

    // If not in profiles table, check teachers table
    const { data: teacherRow } = await supabase
      .from("teachers")
      .select("id, full_name")
      .ilike("email", normalisedEmail)
      .maybeSingle()

    if (teacherRow) {
      return {
        id: userId,
        email: normalisedEmail,
        name: teacherRow.full_name || "Teacher",
        role: "teacher" as Role,
      }
    }

    return null
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
  } catch {
    // Non-fatal
  }
}

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading")

  const loading = authStatus === "loading"

  // ── Init: single authoritative listener ───────────────────────────────────
  useEffect(() => {
    let active = true

    const initParentFallback = async () => {
      const parentUser = await fetchParentSession()
      if (!active) return
      if (parentUser) {
        setUser(parentUser)
        setAuthStatus("authenticated")
      } else {
        setUser(null)
        setAuthStatus("unauthenticated")
      }
    }

    if (!isSupabaseConfigured()) {
      initParentFallback()
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return

      if (event === "SIGNED_OUT") {
        setUser(null)
        setAuthStatus("unauthenticated")
        return
      }

      if (event === "INITIAL_SESSION") {
        if (session?.user) {
          const sbUser = session.user
          const email = sbUser.email?.trim().toLowerCase() || ""
          const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split("@")[0] || "School User"

          try {
            let profile = await fetchProfileFromDb(sbUser.id, email)
            if (!active) return
            if (!profile) {
              await ensureProfile(sbUser.id, email, name, "parent")
              profile = await fetchProfileFromDb(sbUser.id, email)
            }
            if (profile) {
              setUser(profile)
              setAuthStatus("authenticated")
            } else {
              setUser(null)
              setAuthStatus("unauthenticated")
            }
          } catch {
            if (active) {
              setUser(null)
              setAuthStatus("unauthenticated")
            }
          }
        } else {
          // No active Supabase session — check for parent cookie session
          await initParentFallback()
        }
        return
      }

      // SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED
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
          if (profile) {
            setUser(profile)
            setAuthStatus("authenticated")
          }
        } catch {
          // Non-fatal
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
        return { success: false, error: "Invalid email or password." }
      }

      if (data.user) {
        const userEmail = data.user.email?.trim().toLowerCase() || normalised
        const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name || userEmail.split("@")[0] || "School User"
        let profile = await fetchProfileFromDb(data.user.id, userEmail)
        
        if (!profile) {
          await ensureProfile(data.user.id, userEmail, name, "parent")
          profile = await fetchProfileFromDb(data.user.id, userEmail)
        }

        const resolvedUser = profile || {
          id: data.user.id,
          email: userEmail,
          name,
          role: "parent" as Role,
        }

        setUser(resolvedUser)
        setAuthStatus("authenticated")
        return { success: true, role: resolvedUser.role }
      }

      return { success: false, error: "Login failed. Please try again." }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "A connection error occurred." }
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
        setAuthStatus("authenticated")
      }

      return { success: true, mustChangePassword: json.mustChangePassword }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "A connection error occurred." }
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
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Registration failed." }
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
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "OAuth connection failed." }
    }
  }, [])

  // ── forgotPassword ───────────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { success: true }
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      })
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "An error occurred." }
    }
  }, [])

  // ── updatePassword ───────────────────────────────────────────────────────
  const updatePassword = useCallback(async (password: string) => {
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
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "An error occurred." }
      }
    }

    if (!isSupabaseConfigured()) {
      return { success: false, error: "Authentication service is not configured." }
    }
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "An error occurred." }
    }
  }, [user?.role])

  // ── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setUser(null)
    setAuthStatus("unauthenticated")

    try {
      await fetch("/api/parent-logout", { method: "POST" })
    } catch {
      // Non-fatal
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut()
      } catch {
        // Non-fatal
      }
    }

    window.location.href = "/login"
  }, [])

  const contextValue = useMemo(() => ({
    user,
    loading,
    authStatus,

    login,
    parentLogin,

    register,
    loginWithGoogle,
    logout,
    forgotPassword,
    updatePassword,
  }), [
    user,
    loading,
    authStatus,
    login,
    parentLogin,
    register,
    loginWithGoogle,
    logout,
    forgotPassword,
    updatePassword,
  ])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
