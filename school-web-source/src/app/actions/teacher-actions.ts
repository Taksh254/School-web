"use server"

import { supabase } from "@/lib/supabase"
import { Teacher, TeacherSalary, TeacherAttendance, TeacherLeave, TeacherDocument, AdminTeacherNote } from "@/lib/types"

// ── Teacher CRUD ──────────────────────────────────────────────

export async function getTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase.from("teachers").select("*").order("full_name")
  if (error) {
    console.error("Error fetching teachers:", error)
    return []
  }
  return data as Teacher[]
}

export async function getTeacher(id: string): Promise<Teacher | null> {
  const { data, error } = await supabase.from("teachers").select("*").eq("id", id).single()
  if (error) {
    console.error("Error fetching teacher:", error)
    return null
  }
  return data as Teacher
}

export async function addTeacher(teacherData: Omit<Teacher, "id" | "created_at" | "updated_at">): Promise<Teacher | { error: string }> {
  const { data, error } = await supabase.from("teachers").insert([teacherData]).select().single()
  if (error) {
    console.error("Error adding teacher:", error)
    return { error: error.message }
  }
  return data as Teacher
}

export async function updateTeacher(id: string, teacherData: Partial<Teacher>): Promise<Teacher | { error: string }> {
  const { data, error } = await supabase.from("teachers").update(teacherData).eq("id", id).select().single()
  if (error) {
    console.error("Error updating teacher:", error)
    return { error: error.message }
  }
  return data as Teacher
}

export async function deleteTeacher(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("teachers").delete().eq("id", id)
  if (error) {
    console.error("Error deleting teacher:", error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

// ── Teacher Salary ────────────────────────────────────────────

export async function getTeacherSalaries(teacherId: string): Promise<TeacherSalary[]> {
  const { data, error } = await supabase.from("teacher_salary").select("*").eq("teacher_id", teacherId).order("month_year", { ascending: false })
  if (error) {
    console.error("Error fetching teacher salaries:", error)
    return []
  }
  return data as TeacherSalary[]
}

export async function addTeacherSalary(salaryData: Omit<TeacherSalary, "id" | "created_at">): Promise<TeacherSalary | { error: string }> {
  const { data, error } = await supabase.from("teacher_salary").insert([salaryData]).select().single()
  if (error) {
    console.error("Error adding teacher salary:", error)
    return { error: error.message }
  }
  return data as TeacherSalary
}

// ── Teacher Attendance ────────────────────────────────────────

export async function getTeacherAttendance(teacherId: string): Promise<TeacherAttendance[]> {
  const { data, error } = await supabase.from("teacher_attendance").select("*").eq("teacher_id", teacherId).order("date", { ascending: false })
  if (error) {
    console.error("Error fetching teacher attendance:", error)
    return []
  }
  return data as TeacherAttendance[]
}

export async function addTeacherAttendance(attendanceData: Omit<TeacherAttendance, "id">): Promise<TeacherAttendance | { error: string }> {
  const { data, error } = await supabase.from("teacher_attendance").insert([attendanceData]).select().single()
  if (error) {
    console.error("Error adding teacher attendance:", error)
    return { error: error.message }
  }
  return data as TeacherAttendance
}

// ── Teacher Leave ─────────────────────────────────────────────

export async function getTeacherLeaves(teacherId?: string): Promise<TeacherLeave[]> {
  let query = supabase.from("teacher_leave").select("*").order("start_date", { ascending: false })
  if (teacherId) {
    query = query.eq("teacher_id", teacherId)
  }
  const { data, error } = await query
  if (error) {
    console.error("Error fetching teacher leaves:", error)
    return []
  }
  return data as TeacherLeave[]
}

export async function addTeacherLeave(leaveData: Omit<TeacherLeave, "id" | "applied_on">): Promise<TeacherLeave | { error: string }> {
  const { data, error } = await supabase.from("teacher_leave").insert([leaveData]).select().single()
  if (error) {
    console.error("Error adding teacher leave:", error)
    return { error: error.message }
  }
  return data as TeacherLeave
}

export async function updateTeacherLeaveStatus(id: string, status: TeacherLeave["status"]): Promise<TeacherLeave | { error: string }> {
  const { data, error } = await supabase.from("teacher_leave").update({ status }).eq("id", id).select().single()
  if (error) {
    console.error("Error updating teacher leave:", error)
    return { error: error.message }
  }
  return data as TeacherLeave
}

// ── Teacher Documents ─────────────────────────────────────────

export async function getTeacherDocuments(teacherId: string): Promise<TeacherDocument[]> {
  const { data, error } = await supabase.from("teacher_documents").select("*").eq("teacher_id", teacherId).order("uploaded_at", { ascending: false })
  if (error) {
    console.error("Error fetching teacher documents:", error)
    return []
  }
  return data as TeacherDocument[]
}

export async function addTeacherDocument(docData: Omit<TeacherDocument, "id" | "uploaded_at">): Promise<TeacherDocument | { error: string }> {
  const { data, error } = await supabase.from("teacher_documents").insert([docData]).select().single()
  if (error) {
    console.error("Error adding teacher document:", error)
    return { error: error.message }
  }
  return data as TeacherDocument
}

// ── Teacher Notes ─────────────────────────────────────────────

export async function getTeacherNotes(teacherId: string): Promise<AdminTeacherNote[]> {
  const { data, error } = await supabase.from("teacher_notes").select("*").eq("teacher_id", teacherId).order("date", { ascending: false })
  if (error) { console.error("Error fetching teacher notes:", error); return [] }
  return data as AdminTeacherNote[]
}

export async function addTeacherNote(noteData: Omit<AdminTeacherNote, "id" | "date">): Promise<AdminTeacherNote | { error: string }> {
  const { data, error } = await supabase.from("teacher_notes").insert([noteData]).select().single()
  if (error) {
    console.error("Error adding teacher note:", error)
    return { error: error.message }
  }
  return data as AdminTeacherNote
}
