import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envStr = fs.readFileSync('.env.local', 'utf8')
const env = {}
envStr.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) env[match[1]] = match[2].replace(/['"]+/g, '').trim()
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY']

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupTestUsers() {
  console.log("Creating Admin Test User...")
  const { data: adminAuth, error: adminErr } = await supabase.auth.admin.createUser({
    email: 'test_admin@demo.com',
    password: 'TestPassword123!',
    email_confirm: true,
    user_metadata: { name: 'Test Admin' }
  })
  
  if (!adminErr) {
    await supabase.from('profiles').upsert({
      id: adminAuth.user.id,
      email: 'test_admin@demo.com',
      name: 'Test Admin',
      role: 'admin'
    })
    console.log("Admin created successfully.")
  } else if (adminErr.message.includes('already registered')) {
    console.log("Admin already exists.")
    const { data } = await supabase.from('profiles').select('id').eq('email', 'test_admin@demo.com').single()
    if (data) await supabase.from('profiles').update({ role: 'admin' }).eq('id', data.id)
  }

  console.log("Creating Parent Test User...")
  const { data: parentAuth, error: parentErr } = await supabase.auth.admin.createUser({
    email: 'test_parent@demo.com',
    password: 'TestPassword123!',
    email_confirm: true,
    user_metadata: { name: 'Test Parent' }
  })

  if (!parentErr) {
    await supabase.from('profiles').upsert({
      id: parentAuth.user.id,
      email: 'test_parent@demo.com',
      name: 'Test Parent',
      role: 'parent'
    })
    console.log("Parent created successfully.")
  } else if (parentErr.message.includes('already registered')) {
    console.log("Parent already exists.")
    const { data } = await supabase.from('profiles').select('id').eq('email', 'test_parent@demo.com').single()
    if (data) await supabase.from('profiles').update({ role: 'parent' }).eq('id', data.id)
  }
}

setupTestUsers().then(() => console.log("Done."))
