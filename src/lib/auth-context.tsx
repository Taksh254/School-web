"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { User, Role } from "./types"
import { inferRoleFromEmail } from "./types"
import { DEMO_USERS, seedIfNeeded } from "./data-store"
import { supabase, isSupabaseConfigured } from "./supabase"
import { useRouter } from "next/navigation"

interface AuthState {
  user: User | null
  loading: boolean
  sessionDebug: {
    hasSession: boolean
    userId: string | null
    email: string | null
    role: Role | null
    provider: string
  }
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  bypassLogin: (email: string) => Promise<{ success: boolean }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>
}

const defaultDebug: AuthState["sessionDebug"] = {
  hasSession: false,
  userId: null,
  email: null,
  role: null,
  provider: "none",
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  sessionDebug: defaultDebug,
  login: async () => ({ success: false }),
  bypassLogin: async () => ({ success: false }),
  register: async () => ({ success: false }),
  loginWithGoogle: async () => ({ success: false }),
  logout: async () => {},
  forgotPassword: async () => ({ success: false }),
  updatePassword: async () => ({ success: false }),
})

// Ensure profile exists with the correct role (upsert)
async function ensureProfile(userId: string, email: string, name: string, role: Role) {
  try {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle()

    if (existing) {
      // Update role if it differs from what we expect
      if (existing.role !== role) {
        await supabase.from("profiles").update({ email, name, role }).eq("id", userId)
        console.log(`[ensureProfile] Updated role for ${email}: ${existing.role} → ${role}`)
      }
    } else {
      await supabase.from("profiles").insert({
        id: userId,
        email,
        name,
        role,
      })
      console.log(`[ensureProfile] Created profile for ${email} with role ${role}`)
    }
  } catch (err) {
    console.error("Profile creation error:", err)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionDebug, setSessionDebug] = useState(defaultDebug)

  const fetchProfile = useCallback(async (userId: string, email: string): Promise<User | null> => {
    try {
      const normalizedEmail = email?.trim().toLowerCase() || ""
      const { data, error } = await supabase
        .from("profiles")
        .select("name, role, child_id")
        .eq("id", userId)
        .maybeSingle()

      if (!error && data) {
        return {
          id: userId,
          email: normalizedEmail,
          name: data.name || "School User",
          role: data.role as Role,
          childId: data.child_id || undefined,
        }
      }

      // Infer role from email if no profile
      const role: Role = inferRoleFromEmail(normalizedEmail)
      return {
        id: userId,
        email: normalizedEmail,
        name: role === "admin" ? "Admin User" : "Parent User",
        role,
        // Do NOT default childId — unlinked parents should see the "no student linked" state
        childId: undefined,
      }
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (loading) return

    if (user) {
      localStorage.setItem("hk_user", JSON.stringify(user))
      const isProd = process.env.NODE_ENV === "production"
      document.cookie = `hk_bypass_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax${isProd ? "; Secure" : ""}`
    } else {
      localStorage.removeItem("hk_user")
      document.cookie = "hk_bypass_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    }
  }, [user, loading])

  useEffect(() => {
    seedIfNeeded()

    let active = true
    let subscription: { unsubscribe: () => void } | null = null

    async function init() {
      // For non-Supabase mode, restore from localStorage immediately
      if (!isSupabaseConfigured()) {
        try {
          const raw = localStorage.getItem("hk_user")
          if (raw) {
            const parsed = JSON.parse(raw)
            setUser(parsed)
            setSessionDebug({
              hasSession: true,
              userId: parsed.id,
              email: parsed.email,
              role: parsed.role,
              provider: "localStorage",
            })
          }
        } catch { /* empty */ }
        if (active) setLoading(false)
        return
      }

      // Step 1: Check existing Supabase session first
      const { data: { session }, error } = await supabase.auth.getSession()

      if (!active) return

      if (!error && session?.user) {
        const email = session.user.email?.trim().toLowerCase() || ""
        const correctRole: Role = inferRoleFromEmail(email)
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split("@")[0] || "School User"
        await ensureProfile(session.user.id, email, name, correctRole)

        const profile = await fetchProfile(session.user.id, email)
        if (active && profile) {
          // Override role with correct value in case profile had stale data
          profile.role = correctRole
          setUser(profile)
          setSessionDebug({
            hasSession: true,
            userId: profile.id,
            email: profile.email,
            role: profile.role,
            provider: "supabase",
          })
          if (active) setLoading(false)
          return
        }
      }

      // Step 2: No Supabase session — try localStorage fallback in offline/demo mode OR dev mode
      const isDev = process.env.NODE_ENV === "development"
      if (!isSupabaseConfigured() || isDev) {
        try {
          const raw = localStorage.getItem("hk_user")
          if (raw) {
            const parsed = JSON.parse(raw)
            setUser(parsed)
            setSessionDebug({
              hasSession: true,
              userId: parsed.id,
              email: parsed.email,
              role: parsed.role,
              provider: "localStorage",
            })
          } else {
            setUser(null)
            setSessionDebug({ hasSession: false, userId: null, email: null, role: null, provider: "none" })
          }
        } catch {
          setUser(null)
          setSessionDebug({ hasSession: false, userId: null, email: null, role: null, provider: "none" })
        }
      } else {
        // Supabase IS configured, not in dev mode, and no session — user is genuinely logged out
        setUser(null)
        setSessionDebug({ hasSession: false, userId: null, email: null, role: null, provider: "none" })
      }

      if (active) setLoading(false)
    }

    init()

    if (!isSupabaseConfigured()) {
      return () => {
        active = false
      }
    }

    // Step 3: Subscribe to future auth state changes (login / logout / token refresh)
    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignore INITIAL_SESSION — already handled by init()
      if (event === "INITIAL_SESSION") return

      if (event === "SIGNED_OUT") {
        setUser(null)
        setSessionDebug({ hasSession: false, userId: null, email: null, role: null, provider: "none" })
        localStorage.removeItem("hk_user")
        return
      }

      if (session?.user) {
        const email = session.user.email?.trim().toLowerCase() || ""
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || "School User"
        const role = inferRoleFromEmail(email)

        await ensureProfile(session.user.id, email, name, role)

        const profile = await fetchProfile(session.user.id, email)
        if (active && profile) {
          profile.role = role
          setUser(profile)
          setSessionDebug({
            hasSession: true,
            userId: profile.id,
            email: profile.email,
            role: profile.role,
            provider: "supabase",
          })
        }
      } else {
        if (active) {
          try {
            const raw = localStorage.getItem("hk_user")
            if (raw) {
              const parsed = JSON.parse(raw)
              setUser(parsed)
              setSessionDebug({
                hasSession: true,
                userId: parsed.id,
                email: parsed.email,
                role: parsed.role,
                provider: "localStorage",
              })
            } else {
              setUser(null)
              setSessionDebug({ hasSession: false, userId: null, email: null, role: null, provider: "none" })
            }
          } catch {
            setUser(null)
            setSessionDebug({ hasSession: false, userId: null, email: null, role: null, provider: "none" })
          }
        }
      }
    })

    subscription = sub

    return () => {
      active = false
      subscription?.unsubscribe()
    }
  }, [fetchProfile])

  const login = useCallback(async (email: string, password: string) => {
    const normalised = email.toLowerCase().trim()

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalised,
          password,
        })

        if (error) {
          if (error.message.toLowerCase().includes("invalid") || error.status === 400) {
            // Auto-signup for all demo users
            const demoUser = DEMO_USERS.find((u) => u.email === normalised)
            if (demoUser) {
              const { error: signUpError } = await supabase.auth.signUp({
                email: normalised,
                password,
                options: { data: { name: demoUser.name, role: demoUser.role } },
              })

              if (!signUpError) {
                // Sign in again after auto-signup
                const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
                  email: normalised,
                  password,
                })

                if (!signInErr && signInData.user) {
                  const profile = await fetchProfile(signInData.user.id, signInData.user.email || "")
                  setUser(profile)
                  return { success: true }
                }

                // Even if sign-in fails (e.g., email confirmation), fall through to localStorage fallback
              }
              // If auto-signup fails, fall through to localStorage fallback below
            }
          }

          // Map common error messages
          const msg = error.message.toLowerCase()
          if (msg.includes("invalid login credentials") || msg.includes("invalid email")) {
            // Fall through to localStorage fallback instead of returning error
          } else if (msg.includes("email not confirmed")) {
            return { success: false, error: "Please confirm your email address before logging in. Check your inbox." }
          } else if (msg.includes("rate limit")) {
            return { success: false, error: "Too many login attempts. Please wait a moment and try again." }
          } else {
            // For other errors, still try localStorage fallback
            console.warn("Supabase login error, falling back to localStorage:", error.message)
          }
        } else if (data.user) {
          const profile = await fetchProfile(data.user.id, data.user.email || "")
          setUser(profile)
          return { success: true }
        } else {
          // No error but no user either - fall through to localStorage
        }
      } catch (err: any) {
        return { success: false, error: err?.message || "A connection error occurred. Check your Supabase configuration." }
      }
    }

    // LocalStorage fallback
    let matched = DEMO_USERS.find((u) => u.email === normalised)

    if (!matched) {
      const existing = localStorage.getItem("hk_registered_users")
      const registered: User[] = existing ? JSON.parse(existing) : []
      matched = registered.find((u) => u.email === normalised)
    }

    if (matched) {
      try {
        const passwordsRaw = localStorage.getItem("hk_mock_passwords")
        const passwords = passwordsRaw ? JSON.parse(passwordsRaw) : {}
        const savedPassword = passwords[normalised]
        if (savedPassword && savedPassword !== password) {
          return { success: false, error: "Invalid login credentials" }
        }
      } catch { /* empty */ }
    }

    if (!matched) {
      if (isSupabaseConfigured()) {
        return { success: false, error: "Invalid login credentials" }
      }
      const role = inferRoleFromEmail(normalised)
      matched = {
        id: "u-custom",
        email: normalised,
        name: role === "admin" ? "Admin" : "Parent",
        role,
        childId: role === "parent" ? "s1" : undefined,
      }
    }

    setUser(matched)
    localStorage.setItem("hk_user", JSON.stringify(matched))
    return { success: true }
  }, [fetchProfile])

  const bypassLogin = useCallback(async (email: string) => {
    // Bypass login is only available in development mode
    if (process.env.NODE_ENV !== 'development') {
      console.warn('[bypassLogin] Not available in production')
      return { success: false }
    }
    const normalised = email.toLowerCase().trim()
    const matched = DEMO_USERS.find((u) => u.email === normalised) || {
      id: "u-bypass",
      email: normalised,
      name: normalised.includes("admin") ? "Admin" : "Parent",
      role: inferRoleFromEmail(normalised),
      childId: normalised.includes("parent") ? "s1" : undefined,
    }
    setUser(matched)
    localStorage.setItem("hk_user", JSON.stringify(matched))
    return { success: true }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const normalised = email.toLowerCase().trim()
    if (!name || !normalised || !password) {
      return { success: false, error: "All fields are required" }
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: normalised,
          password,
          options: { data: { name, role: "parent" } },
        })

        if (error) {
          if (error.message.toLowerCase().includes("already registered")) {
            return { success: false, error: "An account with this email already exists. Please log in instead." }
          }
          return { success: false, error: error.message }
        }

        if (data.user) {
          // Auto-create profile
          await ensureProfile(data.user.id, normalised, name, "parent")

          const profile = await fetchProfile(data.user.id, normalised)
          if (profile) {
            setUser({ ...profile, name, role: "parent" })
            localStorage.setItem("hk_user", JSON.stringify({ ...profile, name, role: "parent" }))
          }

          return {
            success: true,
            error: data.user.identities?.length === 0
              ? "Account created! If email confirmation is enabled, please check your inbox."
              : undefined,
          }
        }
        return { success: false, error: "Registration failed. No user data returned." }
      } catch (err: any) {
        return { success: false, error: err?.message || "Registration failed. Check your Supabase configuration." }
      }
    }

    // LocalStorage fallback
    const existing = localStorage.getItem("hk_registered_users")
    const users: User[] = existing ? JSON.parse(existing) : []

    if (users.some((u) => u.email === normalised)) {
      return { success: false, error: "An account with this email already exists" }
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      email: normalised,
      name,
      role: "parent",
    }
    users.push(newUser)
    localStorage.setItem("hk_registered_users", JSON.stringify(users))

    try {
      const passwordsRaw = localStorage.getItem("hk_mock_passwords")
      const passwords = passwordsRaw ? JSON.parse(passwordsRaw) : {}
      passwords[normalised] = password
      localStorage.setItem("hk_mock_passwords", JSON.stringify(passwords))
    } catch { /* empty */ }

    setUser(newUser)
    localStorage.setItem("hk_user", JSON.stringify(newUser))
    return { success: true }
  }, [fetchProfile])

  const loginWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: "Supabase is not configured. Google login is only available in Supabase mode." }
    }
    try {
      // Always use the current browser origin so the redirect URL matches
      // both local dev (http://localhost:3000) and production automatically.
      const redirectTo = `${window.location.origin}/auth/callback`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        },
      })
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || "OAuth connection failed" }
    }
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    const normalised = email.toLowerCase().trim()

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(normalised, {
          redirectTo: `${window.location.origin}/login?mode=reset`,
        })
        if (error) {
          return { success: false, error: error.message }
        }
        return { success: true }
      } catch (err: any) {
        return { success: false, error: err?.message || "An error occurred" }
      }
    }

    // LocalStorage fallback mode
    const matched = DEMO_USERS.find((u) => u.email === normalised) || (() => {
      const existing = localStorage.getItem("hk_registered_users")
      const registered: User[] = existing ? JSON.parse(existing) : []
      return registered.find((u) => u.email === normalised)
    })()

    if (!matched) {
      return { success: false, error: "No account found with this email address" }
    }

    return { success: true }
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
          return { success: false, error: error.message }
        }
        return { success: true }
      } catch (err: any) {
        return { success: false, error: err?.message || "An error occurred" }
      }
    }

    // LocalStorage fallback mode
    let emailToUpdate = user?.email?.toLowerCase().trim()

    if (!emailToUpdate) {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search)
        emailToUpdate = params.get("email")?.toLowerCase().trim()
      }
    }

    if (!emailToUpdate) {
      return { success: false, error: "Unable to identify the user for password update" }
    }

    try {
      const passwordsRaw = localStorage.getItem("hk_mock_passwords")
      const passwords = passwordsRaw ? JSON.parse(passwordsRaw) : {}
      passwords[emailToUpdate] = password
      localStorage.setItem("hk_mock_passwords", JSON.stringify(passwords))
      return { success: true }
    } catch {
      return { success: false, error: "Failed to update password locally" }
    }
  }, [user])

  const logout = useCallback(async () => {
    setUser(null)
    setSessionDebug({ hasSession: false, userId: null, email: null, role: null, provider: "none" })
    localStorage.removeItem("hk_user")
    document.cookie = "hk_bypass_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.error("Supabase signout error:", err)
      }
    }
    window.location.href = "/login"
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, sessionDebug, login, bypassLogin, register, loginWithGoogle, logout, forgotPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
