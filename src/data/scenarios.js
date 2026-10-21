export const RULE_CODES = {
  CHILD_MCP_OS: 'children.mcp_os_count_mismatch',
  CHILD_RELIEF_PLAN: 'children.relief_plan_mismatch',
  PROPERTY_ADDRESS: 'property.address_mismatch',
};

export const DEFAULT_RULE_CONFIG = {
  [RULE_CODES.CHILD_MCP_OS]: 'warning',
  [RULE_CODES.CHILD_RELIEF_PLAN]: 'warning',
  [RULE_CODES.PROPERTY_ADDRESS]: 'error',
};

export const RULE_LABELS = {
  [RULE_CODES.CHILD_MCP_OS]: 'MCP and OS child count mismatch',
  [RULE_CODES.CHILD_RELIEF_PLAN]: 'Relief claim and Parenting Plan mismatch',
  [RULE_CODES.PROPERTY_ADDRESS]: 'Property address mismatch',
};

const common = {
  occupation: { plaintiff: 'Operations Executive', defendant: 'Technical Officer' },
  education: { plaintiff: "Bachelor's Degree", defendant: 'Polytechnic Diploma' },
  salary: { plaintiff: 'SGD 5,800/mth', defendant: 'SGD 6,200/mth' },
  maintenance: { child: 'SGD 800/mth', self: 'SGD 500/mth' },
  bankruptcy: 'None declared',
};

export const SCENARIOS = {
  '1': {
    id: '1',
    title: 'Safety-risk indicator',
    summary: 'MCP eligibility passes, while abuse notes and an existing PPO trigger a high-risk assessment.',
    expected: 'Proceed with filing and surface a non-blocking high-risk action.',
    person: {
      plaintiff: { name: 'Nur Aisyah Binte Rahman', nric: 'S9012345A', dob: '14 June 1990', citizenship: 'Singapore Citizen' },
      defendant: { name: 'Muhammad Farid Bin Karim', nric: 'S9123456B', dob: '8 September 1991', citizenship: 'Singapore Citizen' },
    },
    mcp: { status: 'Completed', completionDate: '15 August 2025', validUntil: '15 February 2026', children: [] },
    marriage: { certNo: '458721', date: '5 July 2023', venue: 'Ahmad Mosque', wali: 'Ahmad Bin Arifin', mahr: 'SGD 12,356', source: 'ROMM' },
    ground: { type: 'Fasakh — cruelty', note: 'Abuse in the home was declared during counselling.', source: 'OS declaration' },
    risk: {
      level: 'high',
      title: 'Safety support may be required',
      message: 'An abuse indicator and an active Personal Protection Order were found. Filing may continue, and a separate risk assessment should be completed.',
      ppo: 'PPO-2025-001234 · valid until 14 August 2027',
    },
    children: { registry: [], os: [], relief: [] },
    property: null,
    uploads: { children: false, property: false },
    ...common,
  },
  '4': {
    id: '4',
    title: 'Children discrepancy',
    summary: 'MCP and relief cover one child, while the OS and Parenting Plan contain two.',
    expected: 'Name the affected child, compare sources, and request confirmation.',
    person: {
      plaintiff: { name: 'Zulkifli Bin Rashid', nric: 'S9678901G', dob: '19 March 1996', citizenship: 'Singapore Citizen' },
      defendant: { name: 'Norlina Binte Salim', nric: 'S9789012H', dob: '24 August 1997', citizenship: 'Singapore Citizen' },
    },
    mcp: { status: 'Completed', completionDate: '2 December 2025', validUntil: '2 June 2026', children: ['Aisyah Binte Zulkifli'] },
    marriage: { certNo: '890456', date: '12 October 2015', venue: 'Ahmad Mosque', wali: 'Ahmad Bin Arifin', mahr: 'SGD 12,356', source: 'ROMM' },
    ground: { type: 'Talak', note: 'No safety indicator recorded.', source: 'OS declaration' },
    children: {
      registry: [
        { name: 'Haziq Bin Zulkifli', birthCert: 'T15123456A', age: 11, gender: 'Male', relationship: 'Not from current marriage' },
        { name: 'Aisyah Binte Zulkifli', birthCert: 'T18123456B', age: 8, gender: 'Female', relationship: 'Child of current marriage' },
      ],
      os: ['Haziq Bin Zulkifli', 'Aisyah Binte Zulkifli'],
      relief: ['Aisyah Binte Zulkifli'],
    },
    property: null,
    uploads: { children: true, property: false },
    ...common,
  },
  '9': {
    id: '9',
    title: 'Property-address mismatch',
    summary: 'A handwritten Form 13 names a different property from the HDB and OS records.',
    expected: 'Block progression until a corrected Property Plan is uploaded.',
    person: {
      plaintiff: { name: 'Taufiq Bin Sallehin', nric: 'S8678901S', dob: '17 May 1986', citizenship: 'Singapore Citizen' },
      defendant: { name: 'Husna Binte Karim', nric: 'S8789012T', dob: '29 November 1987', citizenship: 'Singapore Citizen' },
    },
    mcp: { status: 'Completed', completionDate: '8 January 2026', validUntil: '8 July 2026', children: [] },
    marriage: { certNo: '902345', date: '22 November 2024', venue: 'Masjid Al-Istiqamah', wali: 'Muhammad Bin Abdul Rahman', mahr: 'SGD 2,500', source: 'ROMM' },
    ground: { type: 'Talak', note: 'No safety indicator recorded.', source: 'OS declaration' },
    children: { registry: [], os: [], relief: [] },
    property: {
      hdbAddress: '18 Tampines Street 42, #05-118, Singapore 529201',
      osAddress: '18 Tampines Street 42, #05-118, Singapore 529201',
      type: '4-room', holding: 'Joint tenancy', value: 'SGD 610,000', loan: 'SGD 238,000',
      owners: ['Taufiq Bin Sallehin', 'Husna Binte Karim'],
    },
    uploads: { children: false, property: true },
    ...common,
  },
  '10': {
    id: '10',
    title: 'All records match',
    summary: 'MCP, OS, ROMM, HDB, CPF, Form 13 and Form 14 all agree.',
    expected: 'Proceed without a discrepancy warning.',
    person: {
      plaintiff: { name: 'Amin Bin Zainal', nric: 'S8890123U', dob: '9 January 1988', citizenship: 'Singapore Citizen' },
      defendant: { name: 'Nadia Binte Fauzi', nric: 'S8991234V', dob: '23 February 1989', citizenship: 'Singapore Citizen' },
    },
    mcp: { status: 'Completed', completionDate: '1 January 2026', validUntil: '1 July 2026', children: [] },
    marriage: { certNo: '458721', date: '12 June 2015', venue: 'Ahmad Mosque', wali: 'Ahmad Bin Arifin', mahr: 'SGD 12,356', source: 'ROMM' },
    ground: { type: 'Talak', note: 'No safety indicator recorded.', source: 'OS declaration' },
    children: { registry: [], os: [], relief: [] },
    property: {
      hdbAddress: '44 Simei Street 1, #07-22, Singapore 520044',
      osAddress: '44 Simei Street 1, #07-22, Singapore 520044',
      type: '4-room', holding: 'Joint tenancy', value: 'SGD 620,000', loan: 'SGD 255,000',
      owners: ['Amin Bin Zainal', 'Nadia Binte Fauzi'],
      cpf: { plaintiffOA: 'SGD 18,340', defendantOA: 'SGD 14,780' },
    },
    uploads: { children: false, property: true },
    ...common,
  },
};

export function scenarioById(id) {
  return SCENARIOS[String(id)] || SCENARIOS['10'];
}

