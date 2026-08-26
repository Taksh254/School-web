import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qqdtxohdafpqgcnnndcu.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZHR4b2hkYWZwcWdjbm5uZGN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE2MTUzNSwiZXhwIjoyMDk1NzM3NTM1fQ.dHb7glRNxJMz-VutqjtBPgsuSp6XZ1cuBE9_nAW199k'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function provisionTeacher({ email, password, fullName, teacherId, department, designation }) {
  console.log(`\n⏳ Provisioning Teacher Account: ${fullName} (${email})...`)

  // 1. Create or update user in Supabase Auth
  const { data: userList } = await supabase.auth.admin.listUsers()
  const existingUser = userList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

  let userId;
  if (existingUser) {
    console.log(`ℹ️ Auth user already exists (${existingUser.id}), updating password...`)
    const { data: updatedUser, error: updateAuthErr } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        password: password,
        user_metadata: { full_name: fullName, name: fullName },
        email_confirm: true
      }
    )
    if (updateAuthErr) {
      console.error(`❌ Error updating auth user:`, updateAuthErr.message)
      return
    }
    userId = existingUser.id
  } else {
    const { data: newUser, error: createAuthErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, name: fullName }
    })
    if (createAuthErr) {
      console.error(`❌ Error creating auth user:`, createAuthErr.message)
      return
    }
    userId = newUser.user.id
    console.log(`✓ Auth user created with ID: ${userId}`)
  }

  // 2. Ensure profile exists with role = 'teacher'
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: email.toLowerCase(),
      name: fullName,
      role: 'teacher'
    }, { onConflict: 'id' })

  if (profileErr) {
    console.error(`❌ Error updating profile:`, profileErr.message)
    return
  }
  console.log(`✓ Profile updated with role: 'teacher'`)

  // 3. Ensure teachers table record exists
  const { data: existingTeacher } = await supabase
    .from('teachers')
    .select('id, full_name')
    .ilike('email', email)
    .maybeSingle()

  let teacherRecordId;
  if (existingTeacher) {
    teacherRecordId = existingTeacher.id
    await supabase
      .from('teachers')
      .update({
        full_name: fullName,
        designation: designation || 'Class Teacher',
        department: department || 'Primary',
        status: 'Active'
      })
      .eq('id', existingTeacher.id)
    console.log(`✓ Updated existing teacher record (${existingTeacher.id})`)
  } else {
    const { data: newTeacher, error: teacherErr } = await supabase
      .from('teachers')
      .insert({
        teacher_id: teacherId || `TCH-${Math.floor(100 + Math.random() * 900)}`,
        full_name: fullName,
        gender: 'Female',
        dob: '1990-05-15',
        phone: '+91 98765 00000',
        email: email.toLowerCase(),
        address: 'Tiny Mind Play School Campus',
        qualification: 'B.Ed, Early Childhood Care & Education',
        designation: designation || 'Class Teacher',
        department: department || 'Primary',
        status: 'Active',
        emergency_contact: '+91 98765 00001',
        employment_type: 'Full Time'
      })
      .select()
      .single()

    if (teacherErr) {
      console.warn(`⚠️ Note on teachers table:`, teacherErr.message)
    } else if (newTeacher) {
      teacherRecordId = newTeacher.id
      console.log(`✓ Created new teacher record (${newTeacher.id})`)
    }
  }

  // 4. Link students assigned to this teacher name with teacher_id
  if (teacherRecordId) {
    const { data: linkedStudents, error: linkErr } = await supabase
      .from('students')
      .update({ teacher_id: teacherRecordId })
      .ilike('teacher', `%${fullName.split(' ')[1] || fullName}%`)
      .select('id, name, program, section')

    if (!linkErr && linkedStudents && linkedStudents.length > 0) {
      console.log(`✓ Linked ${linkedStudents.length} student(s) to ${fullName}:`)
      linkedStudents.forEach(s => console.log(`   - ${s.name} (${s.program} Sec ${s.section})`))
    }
  }

  console.log(`\n🎉 Credentials Ready!`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`👤 Name:     ${fullName}`)
  console.log(`📧 Email:    ${email}`)
  console.log(`🔑 Password: ${password}`)
  console.log(`🌐 Role:     teacher`)
  console.log(`🚪 Portal:   /login (Select 'Teacher / Admin' Tab)`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length >= 2) {
    const [email, password, fullName, department, designation] = args
    await provisionTeacher({
      email,
      password,
      fullName: fullName || email.split('@')[0],
      department: department || 'Primary',
      designation: designation || 'Class Teacher'
    })
    return
  }

  // Default teachers to provision
  const defaultTeachers = [
    {
      email: 'anita@tinymind.com',
      password: 'Teacher@123',
      fullName: 'Ms. Anita Desai',
      teacherId: 'TCH-001',
      department: 'Nursery & LKG',
      designation: 'Senior Lead Teacher'
    },
    {
      email: 'priya@tinymind.com',
      password: 'Teacher@123',
      fullName: 'Ms. Priya Kapoor',
      teacherId: 'TCH-002',
      department: 'Play Group',
      designation: 'Play Group Teacher'
    },
    {
      email: 'neha@tinymind.com',
      password: 'Teacher@123',
      fullName: 'Mrs. Neha Sharma',
      teacherId: 'TCH-003',
      department: 'Nursery A',
      designation: 'Class Teacher'
    },
    {
      email: 'rohan@tinymind.com',
      password: 'Teacher@123',
      fullName: 'Mr. Rohan Joshi',
      teacherId: 'TCH-004',
      department: 'UKG',
      designation: 'UKG Lead Teacher'
    }
  ]

  console.log(`🚀 Provisioning default school teachers...`)
  for (const t of defaultTeachers) {
    await provisionTeacher(t)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
