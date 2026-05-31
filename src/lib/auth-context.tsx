"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { User, Role } from "./types"
import { DEMO_USERS, seedIfNeeded } from "./data-store"
import { supabase, isSupabaseConfigured } from "./supabase"

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  bypassLogin: (email: string) => Promise<{ success: boolean }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  bypassLogin: async () => ({ success: false }),
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch profiles table info for Supabase User
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
      // If profile not found in table, mock a default profile matching role keywords
      const role: Role = email.toLowerCase().includes("admin") ? "admin" : "parent"
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

  // Restore session on mount + seed data
  useEffect(() => {
    seedIfNeeded()
    
    if (!isSupabaseConfigured()) {
      // Local fallback
      try {
        const raw = localStorage.getItem("hk_user")
        if (raw) setUser(JSON.parse(raw))
      } catch { /* empty */ }
      setLoading(false)
      return
    }

    // Supabase active session restore
    let active = true
    async function restoreSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!active) return

        if (!error && session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email || "")
          if (active) setUser(profile)
        }
      } catch (err) {
        console.error("Supabase restore session error:", err)
      } finally {
        if (active) setLoading(false)
      }
    }

    restoreSession()

    // Listen to Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email || "")
        if (active) setUser(profile)
      } else {
        if (active) setUser(null)
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
        let { data, error } = await supabase.auth.signInWithPassword({
          email: normalised,
          password: password,
        })

        // Auto-signup fallback for demo users if credentials not found
        if (error && (error.message.toLowerCase().includes("invalid") || error.status === 400)) {
          const isDemo = normalised === "admin@school.com" || normalised === "parent@school.com"
          if (isDemo) {
            const role = normalised.includes("admin") ? "admin" : "parent"
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: normalised,
              password: password,
              options: {
                data: {
                  name: role === "admin" ? "Principal Sunita" : "Priya Sharma",
                  role: role,
                }
              }
            })

            if (!signUpError) {
              // Attempt to sign in again after automatic registration
              const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
                email: normalised,
                password: password,
              })
              if (!signInErr && signInData.user) {
                const profile = await fetchProfile(signInData.user.id, signInData.user.email || "")
                setUser(profile)
                return { success: true }
              } else if (signInErr) {
                return {
                  success: false,
                  error: "Demo account created! If email confirmation is enabled in your Supabase Auth provider settings, please check your inbox to confirm or disable 'Confirm email' in the Supabase Dashboard."
                }
              }
            } else {
              return { success: false, error: `${error.message} (Auto-signup failed: ${signUpError.message})` }
            }
          }
        }

        if (error) {
          return { success: false, error: error.message }
        }
        if (data.user) {
          const profile = await fetchProfile(data.user.id, data.user.email || "")
          setUser(profile)
          return { success: true }
        }
      } catch (err: any) {
        return { success: false, error: err.message || "An authentication error occurred." }
      }
    }

    // Match demo users or infer role from email (localStorage fallback)
    let matched = DEMO_USERS.find((u) => u.email === normalised)

    if (!matched) {
      let role: Role = "parent"
      if (normalised.includes("admin")) role = "admin"

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

  const logout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.error("Supabase signout error:", err)
      }
    }
    setUser(null)
    localStorage.removeItem("hk_user")
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, bypassLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
