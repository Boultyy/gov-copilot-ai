
import { supabaseAdmin } from "./src/integrations/supabase/client.server";

async function runAudit() {
  const schemeIds = [
    '9db6c25d-a491-496f-b091-4b62dca59ee7', 
    'dcce1243-5af1-4bfe-9b24-c8b8c01133dc', 
    '9570efdf-c860-413e-9bba-6adbfb2bd0de', 
    'f8c2539e-6ca9-429b-b844-434db291a664', 
    'e91c8ae3-45a2-443d-b043-70c8377a0c5d', 
    'ca74e521-36de-41cd-a603-f6c04b7f8788'
  ];

  for (const id of schemeIds) {
    const { data: scheme } = await supabaseAdmin.from('schemes').select('*').eq('id', id).single();
    if (!scheme) continue;

    let sourceName = scheme.source_name;
    let officialSource = scheme.official_source;
    const appUrl = scheme.application_url || '';

    if (appUrl.includes('pmvishwakarma.gov.in')) {
      sourceName = 'PM Vishwakarma Official Portal';
      officialSource = 'https://pmvishwakarma.gov.in/';
    } else if (appUrl.includes('pmkisan.gov.in')) {
      sourceName = 'PM-KISAN Official Portal';
      officialSource = 'https://pmkisan.gov.in/';
    } else if (appUrl.includes('karnataka.gov.in')) {
      sourceName = 'Karnataka State Portal';
      officialSource = 'https://karnataka.gov.in/education';
    } else if (appUrl.includes('pmaymis.gov.in')) {
      sourceName = 'PMAY-MIS Portal';
      officialSource = 'https://pmaymis.gov.in/';
    } else if (appUrl.includes('jansuraksha.gov.in')) {
      sourceName = 'Jan Suraksha Portal';
      officialSource = 'https://jansuraksha.gov.in/';
    } else if (appUrl.includes('enps.nsdl.com')) {
      sourceName = 'eNPS NSDL Portal';
      officialSource = 'https://enps.nsdl.com/';
    }

    await supabaseAdmin.from('schemes').update({
      verification_status: 'pending_verification',
      source_name: sourceName,
      source_type: 'official government website',
      official_source: officialSource
    } as any).eq('id', id);
  }
  console.log('Audit update complete');
}

runAudit();
