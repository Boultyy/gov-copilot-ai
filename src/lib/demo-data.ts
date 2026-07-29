export type Citation = {
  doc: string;
  page: number;
  snippet: string;
};

export type ChatTurn = {
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
};

export const demoDocuments = [
  { name: "Rural_Housing_Scheme_2024.pdf", size: "2.4 MB", pages: 48, status: "Indexed" },
  { name: "Tender_Notice_PWD_1187.docx", size: "612 KB", pages: 12, status: "Indexed" },
  { name: "Budget_Allocation_FY25.pdf", size: "5.1 MB", pages: 96, status: "Indexed" },
];

export const documentQA: Record<string, ChatTurn> = {
  default: {
    role: "assistant",
    text: "Based on the indexed documents, the eligibility for the Rural Housing Scheme 2024 requires an annual household income below ₹3,00,000, no pucca house owned in the last 20 years, and a valid Aadhaar-linked bank account. Applications are processed by the Block Development Officer within 30 working days.",
    citations: [
      {
        doc: "Rural_Housing_Scheme_2024.pdf",
        page: 12,
        snippet:
          "Clause 4.2 — Applicant household income shall not exceed ₹3,00,000 per annum as certified by the competent revenue authority.",
      },
      {
        doc: "Rural_Housing_Scheme_2024.pdf",
        page: 19,
        snippet:
          "Clause 7.1 — The Block Development Officer shall dispose of every complete application within thirty (30) working days.",
      },
      {
        doc: "Budget_Allocation_FY25.pdf",
        page: 41,
        snippet:
          "Head 2216-03 — ₹1,240 crore earmarked for rural housing subsidy disbursal during FY 2024-25.",
      },
    ],
  },
};

export const suggestedDocQuestions = [
  "What is the eligibility criteria for the housing scheme?",
  "Summarise the tender evaluation process",
  "How much budget is allocated for FY25?",
  "List the penalty clauses in the tender notice",
];

export type ServiceProcedure = {
  id: string;
  name: string;
  department: string;
  timeline: string;
  fee: string;
  steps: { title: string; detail: string; days: string }[];
  documents: string[];
  checklist: string[];
};

export const services: ServiceProcedure[] = [
  {
    id: "income-certificate",
    name: "Income Certificate",
    department: "Revenue Department",
    timeline: "7 working days",
    fee: "₹30",
    steps: [
      {
        title: "Submit online application",
        detail: "Apply on the State e-District portal with Aadhaar e-KYC verification.",
        days: "Day 1",
      },
      {
        title: "Document verification",
        detail: "Village Revenue Officer verifies income proof and residence records.",
        days: "Day 2-4",
      },
      {
        title: "Field inquiry",
        detail: "Tahsildar office conducts inquiry and records findings in the case file.",
        days: "Day 5",
      },
      {
        title: "Digital signature & issue",
        detail: "Certificate digitally signed and pushed to DigiLocker.",
        days: "Day 6-7",
      },
    ],
    documents: [
      "Aadhaar card (self-attested)",
      "Ration card / residence proof",
      "Salary slip or self-declaration of income",
      "Passport size photograph",
      "Previous year ITR (if applicable)",
    ],
    checklist: [
      "Aadhaar linked with active mobile number",
      "Self-declaration signed by applicant",
      "Application fee paid online",
      "Ward member attestation obtained",
    ],
  },
  {
    id: "trade-license",
    name: "Trade License (Municipal)",
    department: "Urban Local Body",
    timeline: "15 working days",
    fee: "₹1,200 - ₹8,000",
    steps: [
      {
        title: "Register business on ULB portal",
        detail: "Create a business profile with GSTIN and premises details.",
        days: "Day 1",
      },
      {
        title: "Upload premises documents",
        detail: "Attach rent agreement / ownership proof and occupancy certificate.",
        days: "Day 2-3",
      },
      {
        title: "Health & fire inspection",
        detail: "Sanitary inspector and fire officer conduct a joint site inspection.",
        days: "Day 4-9",
      },
      {
        title: "Fee assessment & payment",
        detail: "Fee computed on trade category and carpet area, paid online.",
        days: "Day 10-12",
      },
      {
        title: "License issue",
        detail: "Commissioner approves and issues QR-verifiable license.",
        days: "Day 13-15",
      },
    ],
    documents: [
      "GST registration certificate",
      "Property tax receipt / rent agreement",
      "NOC from fire department",
      "Identity proof of proprietor",
      "Layout plan of premises",
    ],
    checklist: [
      "Premises falls under permitted land use",
      "Fire NOC valid for current year",
      "Property tax dues cleared",
      "Trade category correctly selected",
    ],
  },
  {
    id: "land-mutation",
    name: "Land Record Mutation",
    department: "Revenue & Survey",
    timeline: "30 working days",
    fee: "₹500",
    steps: [
      {
        title: "File mutation request",
        detail: "Submit registered sale deed with mutation form at the Tahsil office.",
        days: "Day 1-2",
      },
      {
        title: "Public notice",
        detail: "Notice published for objections from interested parties.",
        days: "Day 3-17",
      },
      {
        title: "Hearing & verification",
        detail: "Revenue officer conducts hearing and verifies encumbrance certificate.",
        days: "Day 18-25",
      },
      {
        title: "Record update",
        detail: "Record of Rights updated and new khata number generated.",
        days: "Day 26-30",
      },
    ],
    documents: [
      "Registered sale deed",
      "Encumbrance certificate (13 years)",
      "Latest land tax receipt",
      "Aadhaar of buyer and seller",
      "Death certificate & legal heir certificate (for inheritance)",
    ],
    checklist: [
      "Sale deed registered at sub-registrar office",
      "No pending litigation on the survey number",
      "Land tax paid up to current year",
      "Objection period closed without dispute",
    ],
  },
  {
    id: "birth-certificate",
    name: "Birth Certificate",
    department: "Municipal Health Dept.",
    timeline: "5 working days",
    fee: "₹20",
    steps: [
      {
        title: "Hospital event reporting",
        detail: "Hospital pushes birth event to Civil Registration System.",
        days: "Day 1",
      },
      {
        title: "Parent detail confirmation",
        detail: "Applicant confirms spelling, address and parent Aadhaar details.",
        days: "Day 2",
      },
      {
        title: "Registrar approval",
        detail: "Registrar of Births & Deaths validates and signs the record.",
        days: "Day 3-4",
      },
      {
        title: "Download certificate",
        detail: "Certificate available on DigiLocker and ULB portal.",
        days: "Day 5",
      },
    ],
    documents: [
      "Hospital discharge summary",
      "Parents' Aadhaar cards",
      "Marriage certificate of parents",
      "Address proof",
    ],
    checklist: [
      "Birth reported within 21 days",
      "Child name finalised",
      "Parent Aadhaar seeded",
    ],
  },
  {
    id: "pension-scheme",
    name: "Old Age Pension Enrolment",
    department: "Social Welfare Dept.",
    timeline: "21 working days",
    fee: "Free",
    steps: [
      {
        title: "Application at Gram Panchayat",
        detail: "Submit form with age and income proof at Panchayat / Ward office.",
        days: "Day 1-3",
      },
      {
        title: "Eligibility screening",
        detail: "Welfare officer verifies BPL status and age above 60 years.",
        days: "Day 4-10",
      },
      {
        title: "Sanction order",
        detail: "District Social Welfare Officer issues sanction order.",
        days: "Day 11-17",
      },
      {
        title: "DBT activation",
        detail: "Monthly pension credited via Direct Benefit Transfer.",
        days: "Day 18-21",
      },
    ],
    documents: [
      "Age proof (Aadhaar / school certificate)",
      "BPL ration card",
      "Bank passbook first page",
      "Recent photograph",
    ],
    checklist: [
      "Applicant aged 60 years or above",
      "No other pension being drawn",
      "Bank account Aadhaar seeded for DBT",
    ],
  },
];

export type ConflictRow = {
  severity: "high" | "medium" | "low";
  clause: string;
  docA: string;
  docB: string;
  issue: string;
  recommendation: string;
};

export const conflicts: ConflictRow[] = [
  {
    severity: "high",
    clause: "Clause 4.2 — Income Ceiling",
    docA: "Annual household income limit ₹3,00,000",
    docB: "Annual household income limit ₹2,50,000",
    issue: "Contradictory eligibility thresholds across the two policies.",
    recommendation: "Harmonise to the revised ₹3,00,000 ceiling notified in G.O. 118/2024.",
  },
  {
    severity: "high",
    clause: "Clause 9.1 — Grievance Timeline",
    docA: "Redressal within 30 days",
    docB: "Redressal within 45 days",
    issue: "Timeline conflict violates the Citizen Charter commitment of 30 days.",
    recommendation: "Adopt 30-day timeline and amend the subordinate policy.",
  },
  {
    severity: "medium",
    clause: "Clause 6.4 — Beneficiary Verification",
    docA: "Aadhaar e-KYC mandatory",
    docB: "Aadhaar optional, any photo ID accepted",
    issue: "Inconsistent KYC standard weakens audit trail.",
    recommendation: "Mandate Aadhaar e-KYC with a documented exception route.",
  },
  {
    severity: "low",
    clause: "Annexure II — Fee Schedule",
    docA: "Processing fee ₹30",
    docB: "Processing fee not specified",
    issue: "Fee schedule missing in the second document.",
    recommendation: "Insert the standard fee annexure for consistency.",
  },
];

export const missingClauses = [
  "Data protection and citizen consent clause (DPDP Act, 2023)",
  "Grievance escalation matrix with appellate authority",
  "Third-party audit and social audit provision",
  "Force majeure and scheme suspension clause",
];

export const complianceChecks = [
  { name: "RTI Act, 2005 disclosure obligations", status: "pass" },
  { name: "DPDP Act, 2023 consent framework", status: "fail" },
  { name: "GFR 2017 procurement norms", status: "pass" },
  { name: "Citizen Charter service timelines", status: "warn" },
  { name: "Accessibility (RPwD Act, 2016)", status: "warn" },
];

export const kpis = [
  { label: "Pending Cases", value: "12,480", delta: "-8.2%", trend: "down", hint: "vs last month" },
  { label: "Grievances Resolved", value: "9,132", delta: "+14.6%", trend: "up", hint: "this quarter" },
  { label: "Avg. Disposal Time", value: "11.4 days", delta: "-2.1 days", trend: "down", hint: "target 12 days" },
  { label: "Budget Utilisation", value: "68.4%", delta: "+5.3%", trend: "up", hint: "FY 2024-25" },
];

export const casesByMonth = [
  { month: "Jan", filed: 3200, disposed: 2800 },
  { month: "Feb", filed: 3600, disposed: 3100 },
  { month: "Mar", filed: 4100, disposed: 3900 },
  { month: "Apr", filed: 3800, disposed: 4000 },
  { month: "May", filed: 4300, disposed: 4200 },
  { month: "Jun", filed: 4000, disposed: 4400 },
];

export const grievanceByDept = [
  { dept: "Revenue", count: 1820 },
  { dept: "Municipal", count: 1490 },
  { dept: "Power", count: 1120 },
  { dept: "Water", count: 940 },
  { dept: "Transport", count: 610 },
];

export const grievanceStatus = [
  { name: "Resolved", value: 62 },
  { name: "In Progress", value: 24 },
  { name: "Escalated", value: 9 },
  { name: "Reopened", value: 5 },
];

export const aiInsights = [
  {
    title: "Revenue Department is the bottleneck",
    body: "Land mutation cases contribute 38% of all pending files. Adding two verification officers at Tahsil-3 could cut backlog by ~22% in 6 weeks.",
    tag: "Capacity",
  },
  {
    title: "Grievance spike detected in Ward 14",
    body: "Water supply complaints rose 61% in 14 days, correlating with pipeline maintenance work order WO-2291.",
    tag: "Anomaly",
  },
  {
    title: "Budget under-utilisation risk",
    body: "Head 2216-03 is at 41% utilisation with 4 months left. Recommend accelerating subsidy disbursal in 3 districts.",
    tag: "Finance",
  },
];

export const recentActivity = [
  { who: "Tahsildar, Zone 2", what: "Approved 42 income certificate applications", when: "12 min ago" },
  { who: "AI Copilot", what: "Flagged 3 policy conflicts in Draft Housing Rules 2025", when: "40 min ago" },
  { who: "Grievance Cell", what: "Escalated complaint GRV-88214 to Appellate Authority", when: "1 hr ago" },
  { who: "PWD Section Officer", what: "Published tender notice PWD/1187/2025", when: "2 hrs ago" },
  { who: "District Collector", what: "Signed office order regarding monsoon preparedness", when: "5 hrs ago" },
];

export type DraftType = {
  id: string;
  label: string;
  description: string;
  sample: string;
};

export const draftTypes: DraftType[] = [
  {
    id: "official-letter",
    label: "Official Letter",
    description: "Inter-departmental correspondence",
    sample: `GOVERNMENT OF INDIA
OFFICE OF THE DISTRICT COLLECTOR
D.O. No. DC/REV/2025/1184                      Dated: 12 March 2025

To,
The Principal Secretary,
Department of Revenue,
State Secretariat.

Subject: Request for sanction of additional manpower for clearance of pending land mutation cases — reg.

Sir/Madam,

I invite kind reference to the review meeting held on 04 March 2025 regarding disposal of pending revenue cases in the district.

2. As on date, 4,742 land mutation applications are pending beyond the prescribed timeline of thirty (30) working days, of which 1,806 pertain to Tahsil-3. The primary constraint is the shortage of verification staff against the sanctioned strength.

3. It is therefore requested that sanction may kindly be accorded for deployment of two (02) Revenue Verification Officers on contract basis for a period of six (06) months, with an estimated financial implication of ₹9.60 lakh to be met from the district administrative head.

4. Early sanction will enable the district to bring pendency within the Citizen Charter timeline before the close of the financial year.

Yours faithfully,

(Signature)
District Collector`,
  },
  {
    id: "public-notice",
    label: "Public Notice",
    description: "Citizen-facing announcements",
    sample: `PUBLIC NOTICE
OFFICE OF THE MUNICIPAL COMMISSIONER
Notice No. MC/PWD/2025/77                      Dated: 12 March 2025

SUBJECT: TEMPORARY DISRUPTION OF WATER SUPPLY — WARDS 12 TO 16

The general public is hereby informed that maintenance work on the main distribution pipeline (Work Order WO-2291) will be undertaken from 18 March 2025 to 20 March 2025.

1. Water supply in Wards 12, 13, 14, 15 and 16 will remain suspended from 06:00 hrs to 18:00 hrs on the said dates.
2. Tanker supply will be arranged at 14 designated points; the location list is available on the municipal portal and at ward offices.
3. Residents are advised to store adequate water in advance and to avoid non-essential consumption during the period.
4. Complaints may be registered on the toll-free helpline 1800-XXX-XXXX or through the citizen grievance portal.

Inconvenience caused is sincerely regretted.

(Signature)
Municipal Commissioner`,
  },
  {
    id: "circular",
    label: "Circular",
    description: "Departmental instructions",
    sample: `CIRCULAR
DEPARTMENT OF SOCIAL WELFARE
Circular No. SW/DBT/2025/09                    Dated: 12 March 2025

Sub: Mandatory Aadhaar seeding of beneficiary bank accounts for Direct Benefit Transfer — instructions.

All District Social Welfare Officers are hereby informed that, with effect from 01 April 2025, disbursal of pension under the Old Age Pension Scheme shall be made exclusively through Aadhaar-seeded bank accounts.

The following instructions shall be strictly complied with:

(i) A ward-wise seeding status report shall be uploaded on the departmental dashboard by 25 March 2025.
(ii) Beneficiaries with unseeded accounts shall be contacted through the Panchayat Secretary and assisted at the nearest bank branch or CSC.
(iii) No beneficiary shall be removed from the roll solely on the ground of pending seeding; a documented exception route shall be maintained.
(iv) Monthly compliance shall be reviewed in the district video conference on the first Monday of every month.

This issues with the approval of the competent authority.

(Signature)
Director, Social Welfare`,
  },
  {
    id: "rti-reply",
    label: "RTI Reply",
    description: "Response under RTI Act, 2005",
    sample: `REPLY UNDER SECTION 7(1) OF THE RIGHT TO INFORMATION ACT, 2005

Office of the Public Information Officer
Reply No. PIO/RTI/2025/312                     Dated: 12 March 2025

To,
Shri/Smt. [Applicant Name]
[Address]

Ref: Your RTI application dated 18 February 2025, received on 20 February 2025.

Sir/Madam,

With reference to the above-cited application, the point-wise information is furnished as under:

Point 1: Total number of housing units sanctioned in the district during FY 2024-25.
Reply: 3,412 units were sanctioned. A district-wise annexure is enclosed as Annexure-A.

Point 2: Amount disbursed against the sanctioned units.
Reply: ₹214.6 crore has been disbursed as on 28 February 2025 under budget head 2216-03.

Point 3: Details of complaints received regarding the scheme.
Reply: 187 complaints were received, of which 164 stand disposed of. Information relating to the identity of complainants is exempted under Section 8(1)(j) of the Act.

If you are aggrieved by this reply, you may prefer an appeal under Section 19(1) before the First Appellate Authority, [Designation and Address], within thirty (30) days of receipt of this communication.

(Signature)
Public Information Officer`,
  },
  {
    id: "office-order",
    label: "Office Order",
    description: "Internal administrative orders",
    sample: `OFFICE ORDER
OFFICE OF THE DISTRICT COLLECTOR
Order No. DC/EST/2025/45                       Dated: 12 March 2025

In the interest of public service and with immediate effect, the following officers are hereby assigned monsoon preparedness duties for the district:

1. Shri A. Kumar, Deputy Collector — Nodal Officer, District Control Room (24x7 rostering).
2. Smt. R. Nair, Executive Engineer (PWD) — Desilting of storm water drains in all 22 wards.
3. Shri M. Sharma, District Health Officer — Pre-positioning of medical stores and vector control drives.

All officers named above shall submit a daily situation report to the District Control Room by 18:00 hrs commencing 01 June 2025. Any deviation shall be reported to the undersigned forthwith.

This order supersedes Office Order No. DC/EST/2024/61 dated 03 June 2024.

(Signature)
District Collector

Copy to: All Sub-Divisional Magistrates / Heads of Departments / Office file.`,
  },
];
