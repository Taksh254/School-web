const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/['"]+/g, '').trim();
});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: authData, error: authErr } = await sb.auth.signInWithPassword({
    email: 'parent@demo.com',
    password: 'ParentPass2026!'
  });
  console.log('Login:', authData.user ? 'Success' : 'Failed', authErr);

  if (authData.user) {
    const { data, error } = await sb
      .from('profiles')
      .select('name, role, child_id')
      .eq('id', authData.user.id)
      .maybeSingle();
    
    console.log('Profile from client:', data, error);

    const { data: students, error: stdErr } = await sb
      .from('students')
      .select('*')
      .or(`parent_id.eq.${authData.user.id},parent_email.eq.parent@demo.com`);
    
    console.log('Students from client:', students?.length, stdErr);
  }
}
check();
