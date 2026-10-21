const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const names = (files) => Array.from(files || []).map((file) => file.name.toLowerCase());

function includesAny(fileNames, fragments) {
  return fragments.some((fragment) => fileNames.some((name) => name.includes(fragment)));
}

export async function extractFixture({ scenarioId, section, files }) {
  const fileNames = names(files);
  await delay(850);

  if (!fileNames.length) throw new Error('Choose at least one supporting document.');

  if (section === 'children' && String(scenarioId) === '4') {
    if (includesAny(fileNames, ['scenario4-parenting-plan-corrected'])) {
      return {
        fixtureId: 'scenario4-parenting-corrected',
        documentType: 'Form 11 — Agreed Parenting Plan',
        planChildren: ['Aisyah Binte Zulkifli'],
        currentResidence: '31 Sengkang East Way with the Defendant',
        proposedResidence: '765 Pasir Ris Street 71 with the Plaintiff',
        caregiver: 'Plaintiff after divorce',
        education: 'Continue at current school',
        custody: 'Joint custody',
        careControl: 'Plaintiff',
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
        fixtureId: 'scenario9-property-corrected',
        documentType: 'Form 13 — Agreed Matrimonial Property Plan',
        address: '18 Tampines Street 42, #05-118, Singapore 529201',
        holding: 'Joint tenancy',
        flatType: '4-room',
        arrangement: "Defendant's share transferred to Plaintiff",
        defendantAgreement: 'Signed',
      };
    }
    const hasPage1 = includesAny(fileNames, ['form 13_page 1']);
    const hasPage2 = includesAny(fileNames, ['form 13_page 2']);
    if (hasPage1 && hasPage2) {
      return {
        fixtureId: 'scenario9-property-original',
        documentType: 'Handwritten Form 13 — Agreed Matrimonial Property Plan',
        address: '82 Canberra Road',
        holding: 'Joint tenancy',
        flatType: '4-room',
        arrangement: "Defendant's share transferred to Plaintiff",
        defendantAgreement: 'Signed before a Commissioner for Oaths',
      };
    }
    if (hasPage1 || hasPage2) throw new Error('The handwritten Form 13 has two pages. Select both photographed pages together.');
  }

  if (section === 'property' && String(scenarioId) === '10') {
    const has13 = includesAny(fileNames, ['scenario10_form13']);
    const has14 = includesAny(fileNames, ['scenario10_form14']);
    if (has13 && has14) {
      return {
        fixtureId: 'scenario10-property-complete',
        documentType: 'Forms 13 and 14 — Agreed Matrimonial Property Plan',
        address: '44 Simei Street 1, #07-22, Singapore 520044',
        holding: 'Joint tenancy',
        flatType: '4-room',
        arrangement: "Option 5 — Defendant's share transferred to Plaintiff",
        consideration: 'No cash consideration',
        cpfRefund: "Defendant's CPF monies used for the flat",
        mortgage: 'Plaintiff bears 100% · SGD 255,000',
        fees: 'Plaintiff bears 100%',
        timeframe: 'Within 6 months of the court order',
        defendantAgreement: 'Confirmed',
      };
    }
    if (has13 || has14) throw new Error('Scenario 10 requires both Form 13 and Form 14. Select both files together.');
  }

  throw new Error('This file is not supported by the selected demo scenario. Choose the matching document from docs/ or resources/.');
}

