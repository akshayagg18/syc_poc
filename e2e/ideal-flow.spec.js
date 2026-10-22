import { test, expect } from 'playwright/test';

test('runs the supplied ideal flow in the initial red theme', async ({ page }) => {
  await page.goto('/');
  const app = page.frameLocator('iframe[title="SYC Divorce Navigator"]');

  await expect(app.getByText('Access your court services')).toBeVisible();
  await expect(app.getByRole('button', { name: /Scenario|POC|Presenter/i })).toHaveCount(0);

  await app.getByRole('button', { name: 'Log in with Singpass' }).click();
  await app.getByRole('button', { name: 'Start a divorce application' }).click();
  await expect(app.getByRole('radio', { name: /e-Services/ })).toBeVisible();
  await expect(app.getByRole('radio', { name: /SYC Companion/ })).toBeVisible();
  await app.getByRole('radio', { name: /SYC Companion/ }).check();
  await app.getByRole('button', { name: 'Submit' }).click();

  await expect(app.getByText(/Welcome to SYC Companion/)).toBeVisible({ timeout: 5_000 });
  await expect(app.locator('.top-bar')).toHaveCSS('background-color', 'rgb(102, 13, 7)');
  await expect(app.locator('.chat-avatar')).toHaveCSS('background-color', 'rgb(243, 182, 174)');

  await expect(app.getByText(/Litigant-in-Person/)).toHaveCount(0);
  await expect(app.getByText(/retrieved your Marriage Counselling Programme record/)).toBeVisible({ timeout: 3_000 });
  await app.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(app.getByText(/formal consent/)).toBeVisible({ timeout: 3_000 });
  await app.getByRole('button', { name: 'Yes, I consent.' }).click();
  await expect(app.getByText('I found these personal details. Please check them.')).toBeVisible({ timeout: 3_000 });
  await expect(app.locator('#f_p_name')).toHaveText('Amin Bin Zainal');
  await expect(app.locator('#f_d_name')).toHaveText('Nadia Binte Fauzi');
});

test('preserves the Bahasa Melayu restart behavior from the reference flow', async ({ page }) => {
  await page.goto('/');
  const app = page.frameLocator('iframe[title="SYC Divorce Navigator"]');
  await app.locator('#flow-followup').getByRole('button', { name: 'BM' }).click();
  await app.getByRole('button', { name: 'Log masuk dengan Singpass' }).click();
  await app.getByRole('button', { name: 'Mulakan permohonan perceraian' }).click();
  await app.getByRole('radio', { name: /SYC Companion/ }).check();
  await app.getByRole('button', { name: 'Hantar' }).click();
  await expect(app.getByText(/Selamat datang ke SYC Companion/)).toBeVisible({ timeout: 5_000 });
  await expect(app.locator('.top-step').first()).toHaveText('Semak ID');
});

test('offers a standard e-Services handoff without entering the Companion chat', async ({ page }) => {
  await page.goto('/');
  const app = page.frameLocator('iframe[title="SYC Divorce Navigator"]');
  await app.getByRole('button', { name: 'Log in with Singpass' }).click();
  await app.getByRole('button', { name: 'Start a divorce application' }).click();
  await app.getByRole('radio', { name: /e-Services/ }).check();
  await app.getByRole('button', { name: 'Submit' }).click();
  await expect(app.getByText('Standard online filing selected')).toBeVisible();
  await expect(app.getByText(/Welcome to SYC Companion/)).toHaveCount(0);
});
