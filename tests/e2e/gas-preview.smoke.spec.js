import { expect, test } from '@playwright/test';

test.describe('GAS preview smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('home screen renders quotation flow controls', async ({ page }) => {
    await expect(page).toHaveTitle('Cotizador Lodge - Rebuild');
    await expect(page.getByRole('heading', { name: 'Quotation Flow' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Quotation' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Select Client' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buscar cotizacion' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Load Quotation' })).toBeVisible();
  });

  test('sandbox-only database editor stays hidden in gas preview runtime', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Edit Database' });
    await expect(button).toBeHidden();
  });

  test('start quotation opens client selector with entries', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Quotation' }).click();

    const clientHeading = page.getByRole('heading', { name: 'Select Client' });
    await expect(clientHeading).toBeVisible();

    const searchBox = page.getByPlaceholder('Search by name/rut/email');
    await expect(searchBox).toBeVisible();

    const clientButtons = page.locator('button').filter({ has: page.locator('strong') });
    await expect(clientButtons.first()).toBeVisible();
    expect(await clientButtons.count()).toBeGreaterThan(0);
  });

  test('selecting a client advances to quotation configuration', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Quotation' }).click();
    await expect(page.getByRole('heading', { name: 'Select Client' })).toBeVisible();

    const firstClient = page.locator('button').filter({ has: page.locator('strong') }).first();
    await firstClient.click();

    await expect(page.getByRole('heading', { name: 'Select Client' })).not.toBeVisible();
  });

  test('health endpoint responds OK', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.mode).toBe('local-gas');
    expect(typeof body.dbFilePath).toBe('string');
  });

  test('no console errors on initial load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toEqual([]);
  });
});
