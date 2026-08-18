import { supabase } from './src/integrations/supabase/client';

async function verify() {
  console.log('Testing public/anonymous visibility...');
  const { data, count, error } = await supabase
    .from('schemes')
    .select('id, name', { count: 'exact' })
    .eq('verification_status', 'verified')
    .eq('active_status', true)
    .limit(10);
    
  if (error) {
    console.error('Public fetch failed:', error);
  } else {
    console.log(`Publicly visible schemes: ${count}`);
    if (data && data.length > 0) {
      console.log('Sample public records:');
      data.forEach(s => console.log(` - ${s.name}`));
    }
  }
}

verify().catch(console.error);
