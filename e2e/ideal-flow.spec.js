import { test, expect } from 'playwright/test';

test('runs the supplied ideal flow in the initial red theme', async ({ page }) => {
  await page.goto('/');
  const app = page.frameLocator('iframe[title="SYC Divorce Navigator"]');

  await expect(app.getByText('Access your court services')).toBeVisible();
  await expect(app.getByRole('button', { name: /Scenario|POC|Presenter/i })).toHaveCount(0);

  await app.getByRole('button', { name: 'Log in with Singpass' }).click();
  await app.getByRole('button', { name: 'Start a divorce application' }).click();
  await app.getByRole('button', { name: 'Continue with Aisha' }).click();

  await expect(app.getByText('Assalamu alaikum. Welcome to the Divorce Navigator.')).toBeVisible({ timeout: 5_000 });
  await expect(app.locator('.top-bar')).toHaveCSS('background-color', 'rgb(102, 13, 7)');
  await expect(app.locator('.chat-avatar')).toHaveCSS('background-color', 'rgb(243, 182, 174)');

  await app.getByRole('button', { name: 'Divorce', exact: true }).click();
  await expect(app.getByText('Are you filing as a Litigant-in-Person')).toBeVisible({ timeout: 3_000 });
  await app.getByRole('button', { name: /representing myself/ }).click();
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
  await app.getByRole('button', { name: 'Teruskan dengan Aisha' }).click();
  await expect(app.getByText('Assalamualaikum. Selamat datang ke Panduan Perceraian.')).toBeVisible({ timeout: 5_000 });
  await expect(app.locator('.top-step').first()).toHaveText('Semak ID');
});
