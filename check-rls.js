const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/['"]+/g, '').trim();
});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await sb.from('profiles').select('*').limit(1);
  console.log('Profiles ServiceRole:', data?.length, error);

  // Instead of querying pg_policies (which requires psql or rpc), let's just see if Anon can select
  const sbAnon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // login as parent
  const { data: authData } = await sbAnon.auth.signInWithPassword({ email: 'parent@demo.com', password: 'ParentPass2026!' });
  if (authData.user) {
    const { data: pData, error: pErr } = await sbAnon.from('profiles').select('*').eq('id', authData.user.id);
    console.log('Profiles Anon:', pData, pErr);
  } else {
    console.log('Login failed');
  }
}
check();
