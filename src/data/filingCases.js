import { scenarioById } from './scenarios.js';

const pad = (value) => String(value).padStart(2, '0');
const displayDate = (date) => new Intl.DateTimeFormat('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);

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
      reason: id === '1' ? 'Abuse in the home' : source.ground.note,
    },
    highRisk: /abuse|violence|cruelty|harm/i.test(id === '1' ? 'Abuse in the home' : source.ground.note),
    sessionId: `${id}${expired ? '-expired' : ''}`,
    marriageDocument: {
      front: `scenario${id}_romm_1`,
      back: `scenario${id}_romm_2`,
    },
  };
}
