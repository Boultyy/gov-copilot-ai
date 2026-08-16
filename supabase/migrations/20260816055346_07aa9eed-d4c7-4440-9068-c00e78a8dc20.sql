-- Add category and target_audience to schemes
ALTER TABLE public.schemes ADD COLUMN category TEXT;
ALTER TABLE public.schemes ADD COLUMN target_audience TEXT;

-- Add application_url and application_process to schemes
ALTER TABLE public.schemes ADD COLUMN application_url TEXT;
ALTER TABLE public.schemes ADD COLUMN application_process TEXT;

-- Ensure constraints are in place for scheme_requirements
-- The existing migration already has requirement_type CHECK (requirement_type IN ('document', 'eligibility'))
-- which covers "eligibility information" and "required documents" as structured data.

-- Add index for filtering
CREATE INDEX idx_schemes_type ON public.schemes(type);
CREATE INDEX idx_schemes_category ON public.schemes(category);
CREATE INDEX idx_schemes_state ON public.schemes(state_or_ut);

-- Insert some verified seed data (Indian Government Schemes)
INSERT INTO public.schemes (
    name, 
    department, 
    ministry, 
    description, 
    benefits, 
    eligibility_summary, 
    application_process, 
    application_url, 
    official_source, 
    source_url, 
    type, 
    category,
    target_audience,
    verification_status
) VALUES 
(
    'PM Surya Ghar: Muft Bijli Yojana', 
    'Ministry of New & Renewable Energy', 
    'Ministry of New & Renewable Energy', 
    'A central scheme to provide free electricity to households in India by subsidizing the installation of rooftop solar panels.',
    'Up to 300 units of free electricity monthly; Subsidy of Rs. 30,000/- per kW up to 2 kW and Rs. 18,000/- per kW for additional capacity up to 3 kW.',
    'Applicant must be an Indian citizen; Must own a house with a suitable roof for solar installation; Must have a valid electricity connection.',
    'Apply through the National Portal for Rooftop Solar. Register, apply for feasibility, get installation from empaneled vendors, and apply for subsidy after net-metering.',
    'https://pmsuryaghar.gov.in/',
    'National Portal PM Surya Ghar',
    'https://pmsuryaghar.gov.in/',
    'Central',
    'Energy',
    'Households',
    'verified'
),
(
    'Ayushman Bharat PM-JAY', 
    'National Health Authority', 
    'Ministry of Health and Family Welfare', 
    'The world’s largest health insurance/ assurance scheme fully financed by the government.',
    'Cover of Rs. 5 lakhs per family per year for secondary and tertiary care hospitalization across public and private empaneled hospitals.',
    'Identified by the SECC 2011 database based on occupational and deprivation criteria in rural and urban areas respectively.',
    'Verify eligibility on the PM-JAY portal or at any Common Service Centre (CSC). Generate Ayushman Card to avail benefits.',
    'https://mera.pmjay.gov.in/',
    'National Health Authority',
    'https://pmjay.gov.in/',
    'Central',
    'Health',
    'Low-income families',
    'verified'
);

-- Seed requirements for the above schemes
WITH solar_scheme AS (SELECT id FROM public.schemes WHERE name = 'PM Surya Ghar: Muft Bijli Yojana' LIMIT 1)
INSERT INTO public.scheme_requirements (scheme_id, requirement_type, description)
SELECT solar_scheme.id, 'document', d FROM solar_scheme, (VALUES ('Electricity Bill'), ('Identity Proof'), ('Address Proof'), ('Roof Ownership Proof')) AS docs(d);

WITH health_scheme AS (SELECT id FROM public.schemes WHERE name = 'Ayushman Bharat PM-JAY' LIMIT 1)
INSERT INTO public.scheme_requirements (scheme_id, requirement_type, description)
SELECT health_scheme.id, 'document', d FROM health_scheme, (VALUES ('Aadhaar Card'), ('Ration Card'), ('Identity Proof')) AS docs(d);
