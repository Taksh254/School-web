const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/['"]+/g, '').trim();
});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await sb.from('students').select('*').eq('id', '2178c3ea-ad36-42cb-9187-e5c316425bb9');
  console.log('Student by ID:', data, error);
  
  const { data: byEmail, error: byEmailErr } = await sb.from('students').select('*').eq('parent_email', 'parent@demo.com');
  console.log('Student by Email:', byEmail, byEmailErr);

  const { data: prof, error: profErr } = await sb.from('profiles').select('*').eq('email', 'parent@demo.com');
  console.log('Profile:', prof, profErr);
}
check();
