/**
 * Verification script: confirm that parent provisioning is working correctly.
 * Run with: npx ts-node verify-parent-linking.ts
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://qqdtxohdafpqgcnnndcu.supabase.co"
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZHR4b2hkYWZwcWdjbm5uZGN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE2MTUzNSwiZXhwIjoyMDk1NzM3NTM1fQ.dHb7glRNxJMz-VutqjtBPgsuSp6XZ1cuBE9_nAW199k"

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function run() {
  console.log("==========================================")
  console.log(" PARENT ACCOUNT PROVISIONING VERIFICATION")
  console.log("==========================================\n")

  // 1. Fetch all students with parent_email
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, name, parent_email, parent_id, parent_name")
    .not("parent_email", "is", null)
    .order("name")

  if (studentsError) {
    console.error("❌ Error fetching students:", studentsError.message)
    return
  }

  console.log(`Found ${students.length} students with parent emails:\n`)

  let allLinked = true

  for (const student of students) {
    const hasParentId = !!student.parent_id

    if (hasParentId) {
      // Verify the parent_id points to a real profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, role, must_change_password")
        .eq("id", student.parent_id)
        .maybeSingle()

      if (profile) {
        console.log(`✅ ${student.name}`)
        console.log(`   parent_email : ${student.parent_email}`)
        console.log(`   parent_id    : ${student.parent_id}`)
        console.log(`   profile role : ${profile.role}`)
        console.log(`   must_change  : ${profile.must_change_password}`)
        console.log()
      } else {
        console.log(`⚠️  ${student.name}`)
        console.log(`   parent_id set (${student.parent_id}) but NO profile found!`)
        console.log()
        allLinked = false
      }
    } else {
      console.log(`❌ ${student.name}`)
      console.log(`   parent_email : ${student.parent_email}`)
      console.log(`   parent_id    : NOT SET`)
      console.log()
      allLinked = false
    }
  }

  // 2. Check all parent profiles
  const { data: parentProfiles } = await supabase
    .from("profiles")
    .select("id, email, role, must_change_password, child_id")
    .eq("role", "parent")
    .order("email")

  console.log(`\n==========================================`)
  console.log(` PARENT PROFILES (${parentProfiles?.length ?? 0} total)`)
  console.log(`==========================================\n`)

  for (const p of (parentProfiles ?? [])) {
    const linkedStudent = students.find(s => s.parent_id === p.id)
    console.log(`📧 ${p.email}`)
    console.log(`   profile.id       : ${p.id}`)
    console.log(`   profile.child_id : ${p.child_id ?? "null"}`)
    console.log(`   linked student   : ${linkedStudent ? linkedStudent.name : "⚠️ NOT LINKED"}`)
    console.log(`   must_change_pass : ${p.must_change_password}`)
    console.log()
  }

  console.log(`==========================================`)
  console.log(allLinked ? "✅ All students are fully linked to parent accounts!" : "⚠️  Some students are missing parent_id. Run the provisioning flow or SQL migration.")
  console.log(`==========================================`)
}

run().catch(console.error)
