import test from 'node:test';
import assert from 'node:assert/strict';
import { getFilingCase, MCP_REASONS } from '../src/data/filingCases.js';

const now = new Date('2026-10-22T00:00:00Z');

test('every filing route uses an approved MCP reason and derives its risk indicator', () => {
  const expected = {
    '1': ['Domestic Violence', true],
    '4': ['Children Related Issues', false],
    '9': ['Extra Marital Affairs/Infidelity', false],
    '10': ['Financial problem', false],
  };

  for (const [id, [reason, highRisk]] of Object.entries(expected)) {
    const filing = getFilingCase(`?case=${id}`, now);
    assert.equal(filing.mcp.reason, reason);
    assert.equal(MCP_REASONS.includes(filing.mcp.reason), true);
    assert.equal(filing.highRisk, highRisk);
  }
});

test('MCP eligibility is determined from the six-month deadline', () => {
  assert.equal(getFilingCase('?case=1', now).mcp.eligible, true);
  assert.equal(getFilingCase('?case=1&eligibility=expired', now).mcp.eligible, false);
});

test('Scenario 9 and 10 property fixtures reflect the supplied evidence', () => {
  const scenario9 = getFilingCase('?case=9', now);
  assert.equal(scenario9.property.plan.address, '82 Canberra Road');
  assert.notEqual(scenario9.property.plan.address, scenario9.property.hdbAddress);

  const scenario10 = getFilingCase('?case=10', now);
  assert.equal(scenario10.property.plan.address, scenario10.property.hdbAddress);
  assert.equal(scenario10.property.plan.holding, scenario10.property.holding);
  assert.equal(scenario10.property.plan.flatType, scenario10.property.type);
  assert.match(scenario10.property.plan.arrangement, /Option 5/);
});
