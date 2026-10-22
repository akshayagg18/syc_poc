import { scenarioById } from './scenarios.js';

const pad = (value) => String(value).padStart(2, '0');
const displayDate = (date) => new Intl.DateTimeFormat('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);

export const MCP_REASONS = Object.freeze([
  'Addiction (Substance abuse)',
  'Children Related Issues',
  'Desertion by spouse for more than 3 months',
  'Domestic Violence',
  'Extra Marital Affairs/Infidelity',
  'Financial problem',
  'Health Issues (chronic illness)',
  'Incarceration/Imprisonment',
  'Mental Illness',
  'Parents/Parents-In-Law',
  'Personality differences',
  'Religion Related Issues',
  'Sex related matters',
  'Other factors affecting marriage (please specify)',
]);

const MCP_REASON_BY_CASE = Object.freeze({
  '1': 'Domestic Violence',
  '4': 'Children Related Issues',
  '9': 'Extra Marital Affairs/Infidelity',
  '10': 'Financial problem',
});

const HIGH_RISK_MCP_REASONS = new Set([
  'Addiction (Substance abuse)',
  'Domestic Violence',
]);

/** Applicant records are chosen before the applicant interface is mounted. */
export function getFilingCase(search = '', now = new Date()) {
  const params = new URLSearchParams(search);
  const requested = params.get('case');
  const id = ['1', '4', '9', '10'].includes(requested) ? requested : '10';
  const source = scenarioById(id);
  const expired = id === '1' && params.get('eligibility') === 'expired';
  const completed = new Date(now);
  completed.setMonth(completed.getMonth() - (expired ? 8 : 2));
  const validUntil = new Date(completed);
  validUntil.setMonth(validUntil.getMonth() + 6);
  const mcpReason = MCP_REASON_BY_CASE[id];

  return {
    ...source,
    caseRef: `SYC/OS/${now.getFullYear()}/${pad(id)}/018742`,
    filingDate: displayDate(now),
    mcp: {
      ...source.mcp,
      number: `MCP/${now.getFullYear()}/${pad(id)}0892`,
      completionDate: displayDate(completed),
      validUntil: displayDate(validUntil),
      eligible: now <= validUntil,
      reason: mcpReason,
    },
    highRisk: HIGH_RISK_MCP_REASONS.has(mcpReason),
    sessionId: `${id}${expired ? '-expired' : ''}`,
    marriageDocument: {
      front: `scenario${id}_romm_1`,
      back: `scenario${id}_romm_2`,
    },
  };
}
