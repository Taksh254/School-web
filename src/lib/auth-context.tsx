"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { User, Role } from "./types"
import { DEMO_USERS, seedIfNeeded } from "./data-store"
import { supabase, isSupabaseConfigured } from "./supabase"

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
  logout: () => Promise<void>
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
  logout: async () => {},
})

// Auto-create profile helper
async function ensureProfile(userId: string, email: string, name: string, role: Role) {
  try {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
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
  } catch (err) {
    console.error("Profile creation error:", err)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionDebug, setSessionDebug] = useState(defaultDebug)

  const fetchProfile = useCallback(async (userId: string, email: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, role, child_id")
        .eq("id", userId)
        .maybeSingle()

      if (!error && data) {
        return {
          id: userId,
          email: email,
          name: data.name || "School User",
          role: data.role as Role,
          childId: data.child_id || undefined,
        }
      }

      // Infer role from email if no profile
      const role: Role = email?.toLowerCase().includes("admin") ? "admin" : "parent"
      return {
        id: userId,
        email,
        name: role === "admin" ? "Admin User" : "Parent User",
        role,
        childId: role === "parent" ? "s1" : undefined,
      }
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    seedIfNeeded()

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
      setLoading(false)
      return
    }

    let active = true

    async function restoreSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!active) return

        if (!error && session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email || "")
          if (active) {
            setUser(profile)
            const pid = profile?.id ?? session.user.id
            const pemail = profile?.email ?? session.user.email ?? null
            const prole = profile?.role ?? null
            setSessionDebug({
              hasSession: true,
              userId: pid,
              email: pemail,
              role: prole,
              provider: "supabase",
            })
          }
        } else {
          if (active) setSessionDebug((d) => ({ ...d, hasSession: false, provider: "none" }))
        }
      } catch (err) {
        console.error("Session restore error:", err)
      } finally {
        if (active) setLoading(false)
      }
    }

    restoreSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email || "")
        if (active) {
          setUser(profile)
          setSessionDebug({
            hasSession: true,
            userId: profile?.id || session.user.id,
            email: profile?.email || session.user.email || null,
            role: profile?.role || null,
            provider: "supabase",
          })
        }
      } else {
        if (active) {
          setUser(null)
          setSessionDebug({ hasSession: false, userId: null, email: null, role: null, provider: "none" })
        }
      }
      if (active) setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
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
            // Auto-signup for demo users
            const isDemo = normalised === "admin@school.com" || normalised === "parent@school.com"
            if (isDemo) {
              const role = normalised.includes("admin") ? "admin" : "parent"
              const { error: signUpError } = await supabase.auth.signUp({
                email: normalised,
                password,
                options: { data: { name: role === "admin" ? "Principal Sunita" : "Priya Sharma", role } },
              })

              if (signUpError) {
                return { success: false, error: `Auto-signup failed: ${signUpError.message}` }
              }

              // Sign in again after auto-signup
              const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
                email: normalised,
                password,
              })

              if (signInErr) {
                return {
                  success: false,
                  error: "Account created! If email confirmation is enabled, please check your inbox. Otherwise, disable 'Confirm email' in Supabase Auth settings.",
                }
              }

              if (signInData.user) {
                const profile = await fetchProfile(signInData.user.id, signInData.user.email || "")
                setUser(profile)
                return { success: true }
              }
            }
          }

          // Map common error messages
          const msg = error.message.toLowerCase()
          if (msg.includes("invalid login credentials") || msg.includes("invalid email")) {
            return { success: false, error: "Invalid email or password. Please try again." }
          }
          if (msg.includes("email not confirmed")) {
            return { success: false, error: "Please confirm your email address before logging in. Check your inbox." }
          }
          if (msg.includes("rate limit")) {
            return { success: false, error: "Too many login attempts. Please wait a moment and try again." }
          }
          return { success: false, error: error.message }
        }

        if (data.user) {
          const profile = await fetchProfile(data.user.id, data.user.email || "")
          setUser(profile)
          return { success: true }
        }

        return { success: false, error: "Login failed. No user data returned." }
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

    if (!matched) {
      const role: Role = normalised.includes("admin") ? "admin" : "parent"
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
    const normalised = email.toLowerCase().trim()
    const matched = DEMO_USERS.find((u) => u.email === normalised) || {
      id: "u-bypass",
      email: normalised,
      name: normalised.includes("admin") ? "Admin" : "Parent",
      role: (normalised.includes("admin") ? "admin" : "parent") as Role,
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
    setUser(newUser)
    localStorage.setItem("hk_user", JSON.stringify(newUser))
    return { success: true }
  }, [fetchProfile])

  const logout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.error("Supabase signout error:", err)
      }
    }
    setUser(null)
    setSessionDebug({ hasSession: false, userId: null, email: null, role: null, provider: "none" })
    localStorage.removeItem("hk_user")
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, sessionDebug, login, bypassLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
