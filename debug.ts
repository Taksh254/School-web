import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://qqdtxohdafpqgcnnndcu.supabase.co"
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZHR4b2hkYWZwcWdjbm5uZGN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE2MTUzNSwiZXhwIjoyMDk1NzM3NTM1fQ.dHb7glRNxJMz-VutqjtBPgsuSp6XZ1cuBE9_nAW199k"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function run() {
  console.log("==================================================")
  console.log("DEBUG SCRIPT - Parent Student Relationship")
  console.log("==================================================")

  console.log("\n--- 1. Fetching first 3 Parent Users from auth.users ---")
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
  if (usersError) {
    console.error("Error fetching users:", usersError)
    return
  }
  
  // Find users that are parents (by looking at their profile, or we just grab all profiles)
  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*").eq("role", "parent").limit(3)
  if (profilesError) {
    console.error("Error fetching profiles:", profilesError)
    return
  }

  for (const profile of profiles) {
    console.log("\n==================================================")
    console.log(`Analyzing Parent: ${profile.email}`)
    console.log("==================================================")
    
    // 1. Profile Data
    console.log("[Profile Table Data]")
    console.log(JSON.stringify(profile, null, 2))
    
    // 2. Auth User Data
    const authUser = usersData.users.find(u => u.id === profile.id)
    console.log("\n[Auth User Data]")
    if (authUser) {
      console.log(`auth.uid(): ${authUser.id}`)
      console.log(`auth.email(): ${authUser.email}`)
    } else {
      console.log("⚠️ NO AUTH USER FOUND FOR THIS PROFILE")
    }

    // 3. Students Table Lookup
    console.log("\n[Student Lookup]")
    console.log(`Querying students table where parent_id = ${profile.id} OR parent_email = ${profile.email}`)
    
    const { data: studentsById, error: err1 } = await supabase.from("students").select("*").eq("parent_id", profile.id)
    if (err1) console.error("Error querying by parent_id:", err1)
    console.log(`> Students matched by parent_id (${profile.id}): ${studentsById?.length}`)
    if (studentsById?.length) console.log(JSON.stringify(studentsById, null, 2))
      
    const { data: studentsByEmail, error: err2 } = await supabase.from("students").select("*").eq("parent_email", profile.email)
    if (err2) console.error("Error querying by parent_email:", err2)
    console.log(`> Students matched by parent_email (${profile.email}): ${studentsByEmail?.length}`)
    if (studentsByEmail?.length) console.log(JSON.stringify(studentsByEmail, null, 2))
      
    // What about child_id on the profile?
    if (profile.child_id) {
      const { data: studentByChildId } = await supabase.from("students").select("*").eq("id", profile.child_id)
      console.log(`> Students matched by profile.child_id (${profile.child_id}): ${studentByChildId?.length}`)
      if (studentByChildId?.length) console.log(JSON.stringify(studentByChildId, null, 2))
    }
  }
}

run()
