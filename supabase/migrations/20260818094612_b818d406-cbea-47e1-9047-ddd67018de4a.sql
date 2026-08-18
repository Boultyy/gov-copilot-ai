ALTER TABLE public.schemes
  ADD COLUMN IF NOT EXISTS exclusions text,
  ADD COLUMN IF NOT EXISTS launch_date text,
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS source_content text,
  ADD COLUMN IF NOT EXISTS source_last_checked timestamptz;

UPDATE public.schemes SET
  ministry = 'Ministry of Agriculture and Farmers Welfare',
  department = 'Department of Agriculture and Farmers Welfare',
  category = 'Agriculture',
  government_level = 'Central',
  official_name = 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
  objective = 'To supplement the financial needs of land-holding farmer families for procuring various inputs related to agriculture and allied activities as well as domestic needs.',
  description = 'PM-KISAN is a Central Sector Scheme providing income support to all land-holding farmer families in the country, subject to the scheme exclusion criteria. The fund is transferred directly to the beneficiaries'' bank accounts.',
  benefits = 'Income support of Rs. 6,000 per year, released in three equal instalments of Rs. 2,000 every four months, transferred directly (DBT) to the beneficiary''s bank account.',
  eligibility_summary = 'All land-holding farmer families, having cultivable land holding in their names, subject to the scheme guidelines and the exclusion criteria.',
  exclusions = 'Institutional land holders; farmer families holding constitutional posts; serving or retired officers and employees of Central/State Government Ministries, Offices, Departments, PSUs and autonomous bodies (excluding Multi Tasking Staff / Class IV / Group D employees); all superannuated/retired pensioners with a monthly pension of Rs. 10,000 or more (excluding Multi Tasking Staff / Class IV / Group D); all persons who paid income tax in the last assessment year; professionals such as doctors, engineers, lawyers, chartered accountants and architects registered with professional bodies and carrying out profession by undertaking practices.',
  application_process = 'Farmers can register through the Farmers Corner on the PM-KISAN official portal (New Farmer Registration), through Common Service Centres (CSC), or through the State/UT nodal officers and local revenue officials (Patwari). e-KYC is mandatory for registered farmers. Beneficiary Status and Beneficiary List can be checked in the Farmers Corner of the official portal.',
  launch_date = 'Operational with effect from 1 December 2018',
  official_source = 'PM-KISAN Official Portal (Department of Agriculture and Farmers Welfare)',
  source_url = 'https://pmkisan.gov.in/',
  source_name = 'PM-KISAN Official Portal',
  last_verified_at = now()
WHERE id = '7a596cab-a9fc-409a-bf7b-42bd1c87969d';

UPDATE public.schemes SET source_url = 'https://pmvishwakarma.gov.in/', source_name = 'PM Vishwakarma Official Portal'
WHERE id = '9db6c25d-a491-496f-b091-4b62dca59ee7' AND source_url IS NULL;