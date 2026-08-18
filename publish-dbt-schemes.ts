
import { supabaseAdmin } from './src/integrations/supabase/client.server';

async function publishSchemes() {
  console.log('Auditing and publishing DBT Bharat schemes...');
  
  // Audit first
  const { data: auditData, error: auditError } = await supabaseAdmin
    .from('schemes')
    .select('verification_status, source_name, name, government_level, official_source, active_status');
    
  if (auditError) {
    console.error('Audit failed:', auditError);
    return;
  }
  
  const dbtRecords = auditData.filter(r => r.source_name === 'Direct Benefit Transfer Bharat');
  const validDbtRecords = dbtRecords.filter(r => 
    r.name && 
    r.government_level === 'Central' && 
    r.official_source && 
    r.active_status === true &&
    r.verification_status === 'pending_verification'
  );
  
  console.log(`Found ${dbtRecords.length} DBT records.`);
  console.log(`Found ${validDbtRecords.length} records ready for publication.`);

  if (validDbtRecords.length > 0) {
    const { data, error } = await supabaseAdmin
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
      console.error('Update failed:', error);
    } else {
      console.log(`Successfully published ${validDbtRecords.length} records.`);
    }
  }

  // Final count
  const { data: finalData } = await supabaseAdmin
    .from('schemes')
    .select('verification_status, government_level, active_status');
    
  console.log('--- FINAL DATABASE STATE ---');
  console.log('Total:', finalData?.length);
  console.log('Verified:', finalData?.filter(r => r.verification_status === 'verified').length);
  console.log('Pending:', finalData?.filter(r => r.verification_status === 'pending_verification').length);
  console.log('Central:', finalData?.filter(r => r.government_level === 'Central').length);
}

publishSchemes().catch(console.error);
