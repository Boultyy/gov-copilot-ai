
import { supabaseAdmin } from './src/integrations/supabase/client.server';

async function checkRLS() {
  console.log('Checking RLS policies for public access...');
  
  const { data: policies, error: policiesError } = await supabaseAdmin.rpc('get_policies', { table_name: 'schemes' });
  
  if (policiesError) {
    // If RPC doesn't exist, try raw query
    const { data: rawPolicies, error: rawError } = await supabaseAdmin.from('pg_policies').select('*').eq('tablename', 'schemes');
    console.log('Policies:', rawError ? 'Could not fetch' : rawPolicies);
  } else {
    console.log('Policies:', policies);
  }

  // Check counts via service role (admin)
  const { data: adminData } = await supabaseAdmin
    .from('schemes')
    .select('id', { count: 'exact', head: true })
    .eq('verification_status', 'verified')
    .eq('active_status', true);
    
  console.log(`Admin sees ${adminData?.length || 0} verified active schemes.`);

  // Verify the 'Allow read for anon' policy exists in migrations
}

checkRLS().catch(console.error);
