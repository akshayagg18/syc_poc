import { scenarioById } from '../data/scenarios.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const names = (files) => Array.from(files || []).map((file) => file.name.toLowerCase());

function includesAny(fileNames, fragments) {
  return fragments.some((fragment) => fileNames.some((name) => name.includes(fragment)));
}

export async function extractFixture({ scenarioId, section, files }) {
  const fileNames = names(files);
  const scenario = scenarioById(scenarioId);
  await delay(850);

  if (!fileNames.length) throw new Error('Choose at least one supporting document.');

  if (section === 'children' && String(scenarioId) === '4') {
    if (includesAny(fileNames, ['scenario4-parenting-plan-corrected'])) {
      return {
        fixtureId: 'scenario4-parenting-corrected',
        documentType: 'Form 11 — Agreed Parenting Plan',
        planChildren: ['Haziq Bin Zulkifli', 'Aisyah Binte Zulkifli'],
        currentResidence: '31 Sengkang East Way with the Defendant',
        proposedResidence: '765 Pasir Ris Street 71 with the Plaintiff',
        caregiver: 'Plaintiff after divorce',
        education: 'Both children continue at their current schools',
        custody: 'Joint custody for both children',
        careControl: 'Plaintiff for both children',
        access: 'Reasonable weekend and school-holiday access to Defendant',
        defendantAgreement: 'Confirmed',
      };
    }
    if (includesAny(fileNames, ['scenario4_form11_pp'])) {
      return {
        fixtureId: 'scenario4-parenting-original',
        documentType: 'Form 11 — Agreed Parenting Plan',
        planChildren: ['Haziq Bin Zulkifli', 'Aisyah Binte Zulkifli'],
        currentResidence: '31 Sengkang East Way with the Defendant',
        proposedResidence: '765 Pasir Ris Street 71 with the Plaintiff',
        caregiver: 'Plaintiff after divorce',
        education: 'Both children continue at their current schools',
        custody: 'Joint custody for both children',
        careControl: 'Plaintiff',
        access: 'Reasonable weekend and school-holiday access to Defendant',
        defendantAgreement: 'Signed on 10 January 2026',
      };
    }
  }

  if (section === 'property' && String(scenarioId) === '9') {
    if (includesAny(fileNames, ['scenario9-form13-corrected'])) {
      return {
        ...scenario.property.plan,
        fixtureId: 'scenario9-property-corrected',
        documentType: 'Form 13 — Corrected Agreed Matrimonial Property Plan',
        address: scenario.property.hdbAddress,
      };
    }
    const hasPage1 = includesAny(fileNames, ['form 13_page 1']);
    const hasPage2 = includesAny(fileNames, ['form 13_page 2']);
    if (hasPage1 && hasPage2) {
      return {
        ...scenario.property.plan,
        fixtureId: 'scenario9-property-original',
      };
    }
    if (hasPage1 || hasPage2) throw new Error('The handwritten Form 13 has two pages. Select both photographed pages together.');
  }

  if (section === 'property' && String(scenarioId) === '10') {
    const has13 = includesAny(fileNames, ['scenario10_form13']);
    const has14 = includesAny(fileNames, ['scenario10_form14']);
    if (has13 && has14) {
      return {
        ...scenario.property.plan,
        fixtureId: 'scenario10-property-complete',
      };
    }
    if (has13 || has14) throw new Error('Scenario 10 requires both Form 13 and Form 14. Select both files together.');
  }

  throw new Error('This file is not supported by the selected demo scenario. Choose the matching document from docs/ or resources/.');
}

