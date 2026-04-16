import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.resolve(process.cwd(), 'data/db.json');

test.describe('Quotation Save and Load', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the full quotation flow sandbox
    await page.goto('/step-04-quotation');
  });

  test('should create, save and reload a quotation', async ({ page }) => {
    // Debug helper to log Alpine state
    const logState = async (label) => {
      const state = await page.evaluate(() => {
        const el = document.querySelector('.quotation-shell');
        return el?.__x?.$data || (typeof Alpine !== 'undefined' ? Alpine.$data(el) : 'No data');
      });
      console.log(`[STATE] ${label}:`, JSON.stringify(state, null, 2));
    };

    await logState('Initial');

    // 1. Click Select Client
    console.log('Clicking Select Client...');
    await page.getByRole('button', { name: 'Select Client' }).click({ force: true });
    
    // Wait for modal to be visible via Alpine state if possible, or style
    await page.waitForFunction(() => {
      const el = document.querySelector('.modal-overlay');
      return el && window.getComputedStyle(el).display !== 'none';
    }, { timeout: 10000 });

    await logState('Modal Open');
    
    const clientModal = page.locator('.modal-overlay').filter({ hasText: 'Select Client' });
    const firstClient = clientModal.locator('.client-item').first();
    const clientName = await firstClient.locator('strong').textContent();
    await firstClient.click();
    
    // Verify client selected and we are in basket stage
    await expect(page.locator('.global-context-title')).toContainText(clientName);

    // 3. Add an item from catalog
    // Expand first category
    const firstCategory = page.locator('.category-card').first();
    await firstCategory.locator('.category-head').click();
    
    // Click "Add" (Ship) on the first item in the category
    const firstItem = firstCategory.locator('.mini-card').first();
    const itemName = await firstItem.locator('h5').textContent();
    await firstItem.getByRole('button', { name: 'Ship to basket' }).click();

    // Verify item in basket
    // The basket uses a different layout, we check by text
    await expect(page.locator('.workspace .main')).toContainText(itemName);

    // 4. Save Quotation
    console.log('Saving quotation...');
    await page.getByRole('button', { name: 'Save Quotation' }).click({ force: true });

    // Verify saved stage directly (since the playground saveQuotation helper does both steps)
    await expect(page.locator('h2')).toContainText('Quotation Saved');
    await logState('Saved Stage');
    
    const quotationIdLabel = page.locator('.panel:has-text("Quotation ID") strong');
    await expect(quotationIdLabel).toBeVisible();
    const quotationId = (await quotationIdLabel.textContent()).trim();
    console.log(`Saved Quotation ID: ${quotationId}`);
    expect(quotationId).not.toBe('-');
    expect(quotationId).not.toBe('');

    // 5. Verify data/db.json exists and contains the quotation
    // Since we are running in the same environment, we can check the file system
    expect(fs.existsSync(DB_PATH)).toBe(true);
    const dbContent = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    expect(dbContent.COTIZACIONES).toBeDefined();
    const savedQuo = dbContent.COTIZACIONES.find(q => q.ID_Cotizacion === quotationId);
    expect(savedQuo).toBeDefined();

    // 6. Reload the quotation
    await page.getByRole('button', { name: 'Go Home' }).click({ force: true });
    await page.locator('input[placeholder*="Quotation ID"]').fill(quotationId);
    await page.getByRole('button', { name: 'Load Quotation' }).click({ force: true });
    
    // Verify we are back in the workspace with the correct client and item
    await expect(page.locator('.global-context-title')).toContainText(clientName);
    await expect(page.locator('.basket-list')).toContainText(itemName);
  });
});
