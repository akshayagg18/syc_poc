import { test, expect } from 'playwright/test';

const frame = (page) => page.frameLocator('iframe[title="SYC Divorce Navigator"]');
/** The Singpass screen lists every applicant record; open one and continue as that person. */
async function chooseIdentity(app, caseId = '10') {
  await app.getByRole('button', { name: /Log (in with|masuk dengan) Singpass/ }).click();
  const card = app.locator(`.flow-id-card[data-case="${caseId}"]`);
  await card.locator('summary').click();
  await card.getByRole('button', { name: /^(Select|Pilih)/ }).click();
}
const liveButton = (app, label) => app.locator('#chatBox button.live:not([disabled])').filter({ hasText: label });
const clickContinue = (app) => app.locator('#chatBox button.live:not([disabled])').filter({ hasText: /^Continue$/ }).last().click();
async function enterFiling(app, caseId = '10') {
  await chooseIdentity(app, caseId);
  await app.getByRole('button', { name: 'Start a divorce application' }).click();
  await app.getByRole('radio', { name: /SYC Companion/ }).check();
  await app.getByRole('button', { name: 'Submit' }).click();
}

async function reachMarriage(page, caseId = '10', suffix = '') {
  await page.goto(`/?case=${caseId}${suffix}`);
  const app = frame(page);
  await enterFiling(app, caseId);
  await expect(app.getByText(/retrieved your Marriage Counselling Programme record/)).toBeVisible();
  await expect(app.getByText(/within the required six-month period/)).toHaveCount(0);
  await expect(app.getByText('Valid until', { exact: true })).toHaveCount(0);
  await clickContinue(app);
  await app.getByRole('button', { name: 'Yes, I consent.' }).click();
  await app.getByRole('button', { name: 'Confirm Personal Details' }).click();
  await app.getByRole('button', { name: 'Confirm Additional Details' }).click();
  await clickContinue(app);
  await expect(app.locator('#flow-marriage-file')).toBeVisible();
  return app;
}

async function finishMarriage(app, caseId) {
  await app.locator('#flow-marriage-file').setInputFiles(
    `docs/Scenario ${caseId}/Scenario${caseId}_ROMM_1.jpeg`,
  );
  await expect(app.getByText(/certificate details match the retrieved ROMM record/)).toBeVisible();
  await clickContinue(app);
  await app.getByRole('button', { name: 'No', exact: true }).click();
  await app.locator('.ground-card', { hasText: 'Fasakh' }).click();
  await app.getByRole('button', { name: 'Cruelty' }).click();
}

test('expired MCP blocks filing before consent', async ({ page }) => {
  await page.goto('/?case=1&eligibility=expired');
  const app = frame(page);
  await enterFiling(app, '1');
  await expect(app.getByText('We are unable to continue with this application yet')).toBeVisible();
  await expect(app.getByRole('button', { name: 'Yes, I consent.' })).toHaveCount(0);
  await expect(app.getByText('Risk indicator')).toBeVisible();
  await expect(app.getByText('Domestic Violence', { exact: true })).toBeVisible();
  await expect(app.getByText(/within the required six-month period/)).toHaveCount(0);
});

test('consent sources use one visual theme and chat bubbles fit their content', async ({ page }) => {
  await page.goto('/?case=10');
  const app = frame(page);
  await enterFiling(app);
  await clickContinue(app);
  await expect(app.locator('.consent-source')).toHaveCount(4);

  const presentation = await app.locator('#chatBox').evaluate((box) => {
    const sources = [...box.querySelectorAll('.consent-source')];
    const shortWrap = document.createElement('div');
    shortWrap.innerHTML = '<div class="ai-bubble">Thank you.</div>';
    box.appendChild(shortWrap);
    const shortBubble = shortWrap.querySelector('.ai-bubble');
    const longBubble = [...box.querySelectorAll('.ai-bubble')].find((item) => item !== shortBubble);
    return {
      backgrounds: new Set(sources.map((item) => getComputedStyle(item).backgroundColor)).size,
      borders: new Set(sources.map((item) => getComputedStyle(item).borderColor)).size,
      shortBubbleWidth: shortBubble.getBoundingClientRect().width,
      longBubbleWidth: longBubble.getBoundingClientRect().width,
    };
  });
  expect(presentation.backgrounds).toBe(1);
  expect(presentation.borders).toBe(1);
  expect(presentation.shortBubbleWidth).toBeLessThan(presentation.longBubbleWidth);
});

test('marriage certificate is required and the OS preview has no edit controls', async ({ page }) => {
  const app = await reachMarriage(page, '10');
  await expect(app.locator('#flow-marriage-file')).not.toHaveAttribute('multiple');
  await expect(app.locator('#formPanel input, #formPanel select, #formPanel textarea')).toHaveCount(0);
  await app.locator('#inputBox').fill('continue');
  await app.locator('#inputBox').press('Enter');
  await expect(app.getByText('Please upload the marriage certificate before continuing.')).toBeVisible();
  await expect(app.locator('#f_m_cert')).not.toBeEmpty();
});

test('OS and Aisha containers stay within their panels on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 760 });
  const app = await reachMarriage(page, '10');
  const overflow = await app.locator('body').evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    form: document.querySelector('#formPanel').scrollWidth - document.querySelector('#formPanel').clientWidth,
    chat: document.querySelector('#chatBox').scrollWidth - document.querySelector('#chatBox').clientWidth,
  }));
  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.form).toBeLessThanOrEqual(1);
  expect(overflow.chat).toBeLessThanOrEqual(1);
});

test('unknown document does not create an extraction result', async ({ page }) => {
  const app = await reachMarriage(page, '10');
  await app.locator('#flow-marriage-file').setInputFiles({
    name: 'unrecognized-certificate.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n'),
  });
  await expect(app.getByText(/does not appear to be the marriage certificate for the current application/)).toBeVisible();
  await expect(app.getByText(/certificate details match the retrieved ROMM record/)).toHaveCount(0);
});

test('saved draft resumes with the same case and read-only OS details', async ({ page }) => {
  const app = await reachMarriage(page, '10');
  await expect(app.locator('#f_p_name')).toHaveText('Amin Bin Zainal');
  await app.getByRole('button', { name: 'Dashboard' }).click();
  await expect(app.getByText('Ongoing filing')).toBeVisible();
  await page.reload();
  await expect(app.getByText('Ongoing filing')).toBeVisible();
  await app.getByRole('button', { name: 'Continue filing' }).click();
  await expect(app.locator('#flow-marriage-file')).toBeVisible();
  await expect(app.locator('#f_p_name')).toHaveText('Amin Bin Zainal');
  await expect(app.locator('#formPanel input, #formPanel select, #formPanel textarea')).toHaveCount(0);
});

test('Restart clears the saved chat and returns to the beginning', async ({ page }) => {
  const app = await reachMarriage(page, '10');
  await expect(app.locator('#chatBox .ai-bubble')).not.toHaveCount(0);

  page.once('dialog', (dialog) => dialog.dismiss());
  await app.locator('#flow-restart').click();
  await expect(app.locator('#flow-marriage-file')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await app.locator('#flow-restart').click();
  await expect(app.getByText('Access your court services')).toBeVisible();
  await expect(app.locator('#chatBox .ai-bubble')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('syc_filing_v5_10'))).toBeNull();

  await page.reload();
  await expect(app.getByText('Access your court services')).toBeVisible();
});

test('Scenario 9 warns about the handwritten address and requires confirmation to continue', async ({ page }) => {
  const app = await reachMarriage(page, '9');
  await finishMarriage(app, '9');
  await clickContinue(app);
  await app.locator('#flow-property-file').setInputFiles([
    'docs/Scenario 9/Form 13_page 1.jpg', 'docs/Scenario 9/Form 13_page 2.jpg',
  ]);
  await expect(app.getByText('The Property Plan address differs from the records')).toBeVisible();
  await expect(app.getByText('82 Canberra Road').first()).toBeVisible();
  await app.getByRole('button', { name: 'Ignore and continue' }).click();
  await liveButton(app, 'Review and re-upload').click();
  await expect(app.getByText('The Property Plan address differs from the records')).toBeVisible();
  await liveButton(app, 'Ignore and continue').click();
  await liveButton(app, 'Continue with current information').click();
  await expect(app.getByText(/How would you like the property arrangement/)).toBeVisible();
});

test('Scenario 9 corrected Property Plan resolves the warning', async ({ page }) => {
  const app = await reachMarriage(page, '9');
  await finishMarriage(app, '9');
  await clickContinue(app);
  await app.locator('#flow-property-file').setInputFiles([
    'docs/Scenario 9/Form 13_page 1.jpg', 'docs/Scenario 9/Form 13_page 2.jpg',
  ]);
  await expect(app.getByText('The Property Plan address differs from the records')).toBeVisible();
  await app.locator('#flow-property-file').setInputFiles('resources/scenario9-form13-corrected.pdf');
  await expect(app.getByText(/How would you like the property arrangement/)).toBeVisible();
  await expect(app.locator('#chatBox button.live:not([disabled])').filter({ hasText: 'Ignore and continue' })).toHaveCount(0);
});

test('Scenario 4 checks custody and care and control for each child', async ({ page }) => {
  const app = await reachMarriage(page, '4');
  await finishMarriage(app, '4');
  await clickContinue(app);
  for (let index = 0; index < 2; index += 1) {
    await app.locator('#chatBox button.live:not([disabled])').filter({ hasText: /^Joint custody$/ }).click();
    await app.locator('#chatBox button.live:not([disabled])').filter({ hasText: /^Care and control to Plaintiff$/ }).click();
  }
  await expect(app.locator('#flow-children-file')).toBeVisible();
  await app.locator('#flow-children-file').setInputFiles('docs/Scenario 4/Scenario4_Form11_PP.docx');
  await expect(app.getByText('Children in MCP and the application differ')).toBeVisible();
  await expect(app.getByText('Parenting Plan and relief claim differ')).toBeVisible();
  await expect(app.getByRole('button', { name: 'Correct application details' })).toHaveCount(0);
  await app.locator('#flow-children-file').setInputFiles('resources/scenario4-parenting-plan-corrected.pdf');
  await expect(app.locator('.flow-warning:not(.flow-warning-resolved)', { hasText: 'Parenting Plan and relief claim differ' }).last()).toBeVisible();
  await expect(app.locator('.flow-warning:not(.flow-warning-resolved)', { hasText: 'Children in MCP and the application differ' })).toBeVisible();
  await expect(app.locator('#f_children_list')).toContainText('Aisyah Binte Zulkifli');
  await expect(app.locator('#f_children_list')).toContainText('Haziq Bin Zulkifli');
  await expect(app.getByText(/Originating Summons has not been changed/).last()).toBeVisible();
  await liveButton(app, 'Ignore and continue').click();
  await liveButton(app, 'Continue with current information').click();
  await expect(app.getByText(/No matrimonial property is recorded/)).toBeVisible();
});

test('Scenario 10 proceeds without discrepancy through agreement and payment', async ({ page }) => {
  const app = await reachMarriage(page, '10');
  await finishMarriage(app, '10');
  await clickContinue(app);
  await expect(app.getByText('CPF OA balances')).toBeVisible();
  await app.locator('#flow-property-file').setInputFiles([
    'docs/Scenario 10/Scenario10_Form13.docx',
    'docs/Scenario 10/Scenario10_Form14.docx',
  ]);
  await expect(app.getByText(/How would you like the property arrangement/)).toBeVisible();
  await expect(app.getByText('The Property Plan address differs from the records')).toHaveCount(0);
  await app.getByRole('button', { name: /Transfer Defendant's share to Plaintiff/ }).click();
  await app.getByRole('button', { name: 'Confirm Maintenance' }).click();
  await app.getByRole('button', { name: 'No — None declared' }).click();
  await app.locator('#flow-declaration').check();
  await app.locator('#flow-submit').click();
  await expect(app.getByText(/Please confirm how you will receive documents/)).toBeVisible();
  await app.locator('#flow-agreement').check();
  await app.getByRole('button', { name: 'Continue to payment' }).click();
  await expect(app.getByText(/Review the filing fees/)).toBeVisible();
  await app.locator('#flow-followup').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(app.getByText('Application steps completed')).toBeVisible();
});

test('choosing any ground marks the Grounds for Divorce section complete', async ({ page }) => {
  const app = await reachMarriage(page, '4');
  await expect(app.locator('#secn_3')).not.toHaveClass(/done/);
  await finishMarriage(app, '4'); // Fasakh — not the Talak path that already ticked itself
  await expect(app.locator('#secn_3')).toHaveClass(/done/);
  await expect(app.locator('.journey-step[data-section="sec_grounds"]')).toHaveClass(/is-done/);
});

test('the divider resizes the Originating Summons and assistant panels', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const app = await reachMarriage(page, '10');
  const handle = app.locator('#splitHandle');
  const before = (await app.locator('.chat-panel').boundingBox()).width;
  const box = await handle.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 180, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  const after = (await app.locator('.chat-panel').boundingBox()).width;
  expect(after).toBeGreaterThan(before + 120);
});

test('a marriage certificate without the required details is rejected', async ({ page }) => {
  const app = await reachMarriage(page, '10');
  // Page 2 carries the taklik and the two names, but no venue, date or certificate number.
  await app.locator('#flow-marriage-file').setInputFiles('docs/Scenario 10/Scenario10_ROMM_2.jpeg');
  await expect(app.getByText(/could not find everything a valid document has to show/)).toBeVisible();
  for (const field of ['Venue', 'Marriage Date', 'Certificate No']) {
    await expect(app.getByText(new RegExp(field, 'i')).first()).toBeVisible();
  }
  await expect(app.locator('#chatBox').getByText(/certificate details match/)).toHaveCount(0);

  await app.locator('#flow-marriage-file').setInputFiles('docs/Scenario 10/Scenario10_ROMM_1.jpeg');
  await expect(app.getByText(/certificate details match the retrieved ROMM record/)).toBeVisible();
});

test('re-uploading a matching document replaces the verdict instead of repeating it', async ({ page }) => {
  const app = await reachMarriage(page, '10');
  await app.locator('#flow-marriage-file').setInputFiles('docs/Scenario 10/Scenario10_ROMM_1.jpeg');
  await expect(app.getByText(/certificate details match the retrieved ROMM record/)).toBeVisible();

  await app.locator('#flow-marriage-file').setInputFiles('docs/Scenario 10/Scenario10_ROMM_1.jpeg');
  await expect(app.getByText(/certificate details match the retrieved ROMM record/)).toHaveCount(1);
  await expect(liveButton(app, 'Continue')).toHaveCount(1);
});

test('acknowledged discrepancies are named in the summary, not shown as ids', async ({ page }) => {
  const app = await reachMarriage(page, '9');
  await finishMarriage(app, '9');
  await clickContinue(app);
  await app.locator('#flow-property-file').setInputFiles([
    'docs/Scenario 9/Form 13_page 1.jpg', 'docs/Scenario 9/Form 13_page 2.jpg',
  ]);
  await liveButton(app, 'Ignore and continue').click();
  await liveButton(app, 'Continue with current information').click();
  await app.getByRole('button', { name: /Transfer Defendant's share to Plaintiff/ }).click();
  await app.getByRole('button', { name: 'Confirm Maintenance' }).click();
  await app.getByRole('button', { name: 'No — None declared' }).click();

  const summary = app.locator('.preview-doc');
  await expect(summary).toContainText('The Property Plan address differs from the records');
  await expect(summary).not.toContainText('property.address_mismatch');
  await expect(app.locator('#flow-submit')).toHaveText('Submit');
});

test('the Singpass screen offers every applicant record and drives the filing', async ({ page }) => {
  await page.goto('/');
  const app = frame(page);
  await app.getByRole('button', { name: 'Log in with Singpass' }).click();
  await expect(app.locator('.flow-id-card')).toHaveCount(4);

  const card = app.locator('.flow-id-card[data-case="4"]');
  await expect(card).toContainText('Zulkifli Bin Rashid');
  await card.locator('summary').click();
  // The expanded record shows what will be written into the Originating Summons.
  await expect(card).toContainText('Norlina Binte Salim');
  await expect(card).toContainText('890456');
  await expect(card).toContainText('Haziq Bin Zulkifli');
  await expect(card).toContainText('Aisyah Binte Zulkifli');
  await expect(card).toContainText('Children Related Issues');

  await card.getByRole('button', { name: /^Select/ }).click();
  await expect(app.getByText('Welcome, Zulkifli Bin Rashid')).toBeVisible();

  await app.getByRole('button', { name: 'Start a divorce application' }).click();
  await app.getByRole('radio', { name: /SYC Companion/ }).check();
  await app.getByRole('button', { name: 'Submit' }).click();
  await clickContinue(app);
  await app.getByRole('button', { name: 'Yes, I consent.' }).click();
  await expect(app.locator('#f_p_name')).toHaveText('Zulkifli Bin Rashid');
  await expect(app.locator('#f_d_name')).toHaveText('Norlina Binte Salim');
});

test('the scales of justice mark appears on every header', async ({ page }) => {
  await page.goto('/?case=10');
  const app = frame(page);
  await expect(app.locator('.flow-followup-header .court-mark svg')).toBeVisible();
  await enterFiling(app, '10');
  await expect(app.locator('.top-logo .court-mark svg')).toBeVisible();
  await app.locator('#flow-followup').waitFor({ state: 'detached' });
  await expect(app.locator('.top-logo .court-mark svg')).toBeVisible();
});
