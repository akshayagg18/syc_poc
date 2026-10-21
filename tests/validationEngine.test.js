import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_RULE_CONFIG, RULE_CODES, scenarioById } from '../src/data/scenarios.js';
import { acknowledgeFinding, evaluateCase, hasOpenError, hasUnacknowledgedWarning, identitiesMatchByNric } from '../src/lib/validationEngine.js';

const s4Original = { planChildren: ['Haziq Bin Zulkifli', 'Aisyah Binte Zulkifli'] };
const s4Corrected = { planChildren: ['Aisyah Binte Zulkifli'] };

test('Scenario 4 produces both discrepancies as warnings by default', () => {
  const scenario = scenarioById('4');
  const findings = evaluateCase({ scenario, caseData: { children: scenario.children.os }, extraction: { children: s4Original }, ruleConfig: DEFAULT_RULE_CONFIG });
  assert.deepEqual(findings.map((item) => item.ruleCode).sort(), [RULE_CODES.CHILD_MCP_OS, RULE_CODES.CHILD_RELIEF_PLAN].sort());
  assert.ok(findings.every((item) => item.severity === 'warning'));
  assert.equal(hasUnacknowledgedWarning(findings, 4), true);
});

test('a rule configured as error blocks and cannot be acknowledged', () => {
  const scenario = scenarioById('4');
  const config = { ...DEFAULT_RULE_CONFIG, [RULE_CODES.CHILD_MCP_OS]: 'error' };
  const findings = evaluateCase({ scenario, caseData: { children: scenario.children.os }, extraction: { children: s4Original }, ruleConfig: config });
  const target = findings.find((item) => item.ruleCode === RULE_CODES.CHILD_MCP_OS);
  assert.equal(target.severity, 'error');
  assert.equal(hasOpenError(findings, 4), true);
  assert.equal(acknowledgeFinding(findings, target.id).find((item) => item.id === target.id).status, 'open');
});

test('warning acknowledgement changes status and allows the warning gate', () => {
  const scenario = scenarioById('4');
  const findings = evaluateCase({ scenario, caseData: { children: scenario.children.os }, extraction: { children: s4Original }, ruleConfig: DEFAULT_RULE_CONFIG });
  const acknowledged = findings.reduce((items, finding) => acknowledgeFinding(items, finding.id), findings);
  assert.equal(hasUnacknowledgedWarning(acknowledged, 4), false);
});

test('corrected Scenario 4 OS children and plan resolve both findings', () => {
  const scenario = scenarioById('4');
  const findings = evaluateCase({ scenario, caseData: { children: ['Aisyah Binte Zulkifli'] }, extraction: { children: s4Corrected }, ruleConfig: DEFAULT_RULE_CONFIG });
  assert.deepEqual(findings, []);
});

test('Scenario 9 wrong address is blocking and corrected address resolves it', () => {
  const scenario = scenarioById('9');
  const wrong = evaluateCase({ scenario, caseData: {}, extraction: { property: { address: '82 Canberra Road' } }, ruleConfig: DEFAULT_RULE_CONFIG });
  assert.equal(wrong.length, 1);
  assert.equal(wrong[0].severity, 'error');
  assert.equal(hasOpenError(wrong, 5), true);
  const corrected = evaluateCase({ scenario, caseData: {}, extraction: { property: { address: '18 Tampines Street 42, #05-118, Singapore 529201' } }, ruleConfig: DEFAULT_RULE_CONFIG });
  assert.deepEqual(corrected, []);
});

test('Scenario 10 is a no-finding false-positive control', () => {
  const scenario = scenarioById('10');
  const findings = evaluateCase({ scenario, caseData: {}, extraction: { property: { address: scenario.property.hdbAddress } }, ruleConfig: DEFAULT_RULE_CONFIG });
  assert.deepEqual(findings, []);
});

test('Scenario 1 identity reconciliation uses NRIC, not name spelling', () => {
  assert.equal(identitiesMatchByNric(
    { name: 'Muhammad Farid Bin Hassan', nric: 'S9123456B' },
    { name: 'Muhammad Farid Bin Karim', nric: 's9123456b' },
  ), true);
});
