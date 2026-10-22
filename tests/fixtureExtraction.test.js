import test from 'node:test';
import assert from 'node:assert/strict';
import { extractFixture } from '../src/lib/fixtureExtraction.js';

const files = (...names) => names.map((name) => ({ name }));

test('unknown upload fails without extraction data', async () => {
  await assert.rejects(() => extractFixture({ scenarioId: '4', section: 'children', files: files('random.pdf') }), /not supported/);
});

test('Scenario 9 requires both handwritten pages', async () => {
  await assert.rejects(() => extractFixture({ scenarioId: '9', section: 'property', files: files('Form 13_Page 1.jpg') }), /two pages/);
  const result = await extractFixture({ scenarioId: '9', section: 'property', files: files('Form 13_Page 1.jpg', 'Form 13_Page 2.jpg') });
  assert.equal(result.address, '82 Canberra Road');
});

test('Scenario 10 requires Forms 13 and 14 together', async () => {
  await assert.rejects(() => extractFixture({ scenarioId: '10', section: 'property', files: files('Scenario10_Form13.docx') }), /both Form 13 and Form 14/);
  const result = await extractFixture({ scenarioId: '10', section: 'property', files: files('Scenario10_Form13.docx', 'Scenario10_Form14.docx') });
  assert.match(result.arrangement, /Option 5/);
  assert.match(result.timeframe, /6 months/);
});

test('corrected recovery fixtures return reconciled values', async () => {
  const children = await extractFixture({ scenarioId: '4', section: 'children', files: files('scenario4-parenting-plan-corrected.pdf') });
  const property = await extractFixture({ scenarioId: '9', section: 'property', files: files('scenario9-form13-corrected.pdf') });
  assert.deepEqual(children.planChildren, ['Haziq Bin Zulkifli', 'Aisyah Binte Zulkifli']);
  assert.equal(property.address, '18 Tampines Street 42, #05-118, Singapore 529201');
});
