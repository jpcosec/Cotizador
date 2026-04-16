import { expect, test } from '@playwright/test';

test.describe('GAS App Local Persistence', () => {
  test.use({ baseURL: 'http://localhost:8082' });

  test('should save and find quotation in the UI list', async ({ page }) => {
    await page.goto('/');

    // 1. Select Client
    await page.getByRole('button', { name: 'Select Client' }).click({ force: true });
    
    // Wait for modal and select client "test1"
    const clientModal = page.locator('.modal-overlay').filter({ hasText: 'Select Client' });
    await page.waitForFunction(() => {
      const el = document.querySelector('.modal-overlay');
      return el && window.getComputedStyle(el).display !== 'none';
    });
    
    const clientName = "test1";
    await clientModal.locator('.client-item').filter({ hasText: clientName }).click();
    
    // Verify client is selected
    await expect(page.locator('.global-context-title')).toContainText(clientName);

    // 2. Add an item
    const firstCategory = page.locator('.category-card').first();
    await firstCategory.locator('.category-head').click();
    const firstItem = firstCategory.locator('.mini-card').first();
    const itemName = await firstItem.locator('h5').textContent();
    await firstItem.getByRole('button', { name: 'Ship to basket' }).click();
    
    await expect(page.locator('.workspace .main')).toContainText(itemName);

    // 3. Save
    await page.getByRole('button', { name: 'Save Quotation' }).click({ force: true });
    
    // Wait for "Quotation Saved" and get ID
    await expect(page.locator('h2')).toContainText('Quotation Saved', { timeout: 10000 });
    const quotationIdLabel = page.locator('.panel:has-text("Quotation ID") strong');
    const quotationId = (await quotationIdLabel.textContent()).trim();
    console.log(`Saved ID: ${quotationId}`);

    // 4. Verify in SEARCH UI (the "browser way" of checking persistence)
    await page.getByRole('button', { name: 'Go Home' }).click({ force: true });
    await page.getByRole('button', { name: 'Buscar cotizacion' }).click({ force: true });
    
    const searchModal = page.locator('.modal-overlay').filter({ hasText: 'Buscar cotizacion' });
    await page.waitForFunction(() => {
      const overlays = Array.from(document.querySelectorAll('.modal-overlay'));
      const visible = overlays.find(el => el.textContent.includes('Buscar cotizacion') && window.getComputedStyle(el).display !== 'none');
      return !!visible;
    });

    // Search for our specific ID
    await searchModal.locator('input[placeholder*="Buscar"]').fill(quotationId);
    
    // Verify it appears in the list
    const resultItem = searchModal.locator('.quotation-item').filter({ hasText: quotationId });
    await expect(resultItem).toBeVisible({ timeout: 10000 });
    await expect(resultItem).toContainText(clientName);

    // 5. Load it back
    await resultItem.click();
    
    // Final verification that we are back in workspace with our data
    await expect(page.locator('.global-context-title')).toContainText(clientName);
    await expect(page.locator('.workspace .main')).toContainText(itemName);
  });
});
