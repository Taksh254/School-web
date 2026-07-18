import { createClient } from '@supabase/supabase-js'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables!")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function changeRole(email, role) {
  const { data: profile, error: searchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()

  if (searchError) {
    console.error(`Error finding profile for ${email}:`, searchError.message)
    process.exit(1)
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', profile.id)

  if (updateError) {
    console.error(`Error updating profile for ${email}:`, updateError.message)
    process.exit(1)
  }

  console.log(`Success! Updated ${email} to role: ${role}`)
}

const email = process.argv[2]
const role = process.argv[3] || 'parent'

if (!email) {
  console.log("Usage: node change_role.js <email> [role]")
  console.log("Example: node change_role.js myemail@gmail.com parent")
  process.exit(1)
}

changeRole(email, role)
