import { RULE_CODES } from '../data/scenarios.js';

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const sameSet = (a = [], b = []) => {
  const left = [...a].map(normalize).sort();
  const right = [...b].map(normalize).sort();
  return left.length === right.length && left.every((value, index) => value === right[index]);
};

function finding(ruleCode, section, config, title, message, comparisons) {
  return {
    id: `${ruleCode}:${section}`,
    ruleCode,
    section,
    severity: config[ruleCode] || 'warning',
    title,
    message,
    comparisons,
    status: 'open',
  };
}

export function evaluateCase({ scenario, caseData, extraction, ruleConfig, priorFindings = [] }) {
  const findings = [];

  if (scenario.id === '4' && extraction.children) {
    const mcpChildren = scenario.mcp.children || [];
    const osChildren = caseData.children || [];
    if (!sameSet(mcpChildren, osChildren)) {
      findings.push(finding(
        RULE_CODES.CHILD_MCP_OS,
        4,
        ruleConfig,
        'Children declared across records do not match',
        'Haziq appears in this application but was not declared in the MCP record and is marked as not from the current marriage.',
        [
          { source: 'MCP record', value: mcpChildren.join(', ') || 'No children declared' },
          { source: 'OS children section', value: osChildren.join(', ') || 'No children selected' },
        ],
      ));
    }
    const relief = scenario.children.relief || [];
    const plan = extraction.children.planChildren || [];
    if (!sameSet(relief, plan)) {
      findings.push(finding(
        RULE_CODES.CHILD_RELIEF_PLAN,
        4,
        ruleConfig,
        'Parenting Plan does not match the relief claim',
        'The uploaded Parenting Plan covers two children, while relief is claimed for Aisyah only.',
        [
          { source: 'Relief claim', value: relief.join(', ') || 'None' },
          { source: 'Uploaded Form 11', value: plan.join(', ') || 'None' },
        ],
      ));
    }
  }

  if (scenario.property && extraction.property?.address) {
    const planAddress = extraction.property.address;
    if (normalize(planAddress) !== normalize(scenario.property.hdbAddress) ||
        normalize(planAddress) !== normalize(scenario.property.osAddress)) {
      findings.push(finding(
        RULE_CODES.PROPERTY_ADDRESS,
        5,
        ruleConfig,
        'Uploaded Property Plan refers to a different property',
        'The address extracted from the uploaded Form 13 does not match the authoritative HDB and OS records.',
        [
          { source: 'HDB record', value: scenario.property.hdbAddress },
          { source: 'OS Case Statement', value: scenario.property.osAddress },
          { source: 'Uploaded Form 13', value: planAddress },
        ],
      ));
    }
  }

  const previous = new Map(priorFindings.map((item) => [item.id, item]));
  return findings.map((item) => {
    const old = previous.get(item.id);
    return old?.status === 'acknowledged' && item.severity === 'warning'
      ? { ...item, status: 'acknowledged' }
      : item;
  });
}

export function hasOpenError(findings, section) {
  return findings.some((item) => item.section === section && item.severity === 'error' && item.status === 'open');
}

export function hasUnacknowledgedWarning(findings, section) {
  return findings.some((item) => item.section === section && item.severity === 'warning' && item.status === 'open');
}

export function acknowledgeFinding(findings, id) {
  return findings.map((item) => item.id === id && item.severity === 'warning'
    ? { ...item, status: 'acknowledged' }
    : item);
}

export function identitiesMatchByNric(a, b) {
  return Boolean(a?.nric && b?.nric && normalize(a.nric) === normalize(b.nric));
}

