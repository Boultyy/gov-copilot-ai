import { supabaseAdmin } from './src/integrations/supabase/client.server';

async function finalize() {
  console.log('Finalizing publication of DBT records...');
  
  const { count, error } = await supabaseAdmin
    .from('schemes')
    .update({ 
      verification_status: 'verified',
      description: 'Official scheme listing from Direct Benefit Transfer Bharat. Detailed eligibility and benefit information is available from the official source.'
    })
    .eq('source_name', 'Direct Benefit Transfer Bharat')
    .eq('government_level', 'Central')
    .eq('active_status', true)
    .eq('verification_status', 'pending_verification');

  if (error) {
    console.error('Final update failed:', error);
  } else {
    console.log(`Successfully moved records to verified status.`);
  }

  const { data: final } = await supabaseAdmin
    .from('schemes')
    .select('verification_status, active_status', { count: 'exact' });
    
  console.log('--- DB STATE ---');
  console.log('Total:', final?.length);
  console.log('Verified:', final?.filter(r => r.verification_status === 'verified').length);
  console.log('Active & Verified:', final?.filter(r => r.verification_status === 'verified' && r.active_status === true).length);
}

finalize().catch(console.error);
