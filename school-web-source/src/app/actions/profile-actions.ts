"use server"

import { supabase } from "@/lib/supabase"
import { UserProfile, UserActivity } from "@/lib/types"

/**
 * Get a single profile by ID. If no ID is provided, it tries to get the current user's profile.
 */
export async function getProfile(userId?: string): Promise<UserProfile | { error: string }> {
  try {
    let targetId = userId
    if (!targetId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) return { error: "Not authenticated" }
      targetId = user.id
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetId)
      .single()

    if (error) throw error
    return data as UserProfile
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * Get all profiles (Admin only)
 */
export async function getAllProfiles(): Promise<UserProfile[] | { error: string }> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("name")

    if (error) throw error
    return data as UserProfile[]
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * Update profile data
 */
export async function updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile | { error: string }> {
  try {
    const { data: updated, error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error
    
    // Log activity
    await logUserActivity(userId, "Updated profile information")
    
    return updated as UserProfile
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * Log user activity
 */
export async function logUserActivity(userId: string, action: string, device: string = "Web Browser"): Promise<void> {
  try {
    await supabase.from("user_activity").insert([{ user_id: userId, action, device }])
  } catch (e) {
    console.error("Failed to log activity:", e)
  }
}

/**
 * Get user activity
 */
export async function getUserActivity(userId: string): Promise<UserActivity[] | { error: string }> {
  try {
    const { data, error } = await supabase
      .from("user_activity")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) throw error
    return data as UserActivity[]
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * Toggle Account Status (Admin)
 */
export async function toggleAccountStatus(userId: string, isActive: boolean): Promise<{ success: boolean } | { error: string }> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: isActive })
      .eq("id", userId)

    if (error) throw error
    
    await logUserActivity(userId, `Account ${isActive ? "activated" : "deactivated"} by Admin`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
