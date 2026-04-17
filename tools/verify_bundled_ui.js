import { chromium } from '@playwright/test';

(async () => {
  console.log('--- START BUNDLED UI VERIFICATION ---');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 1000 });
  
  try {
    console.log('1. Loading bundled app at http://localhost:8082...');
    await page.goto('http://localhost:8082/', { waitUntil: 'networkidle' });

    console.log('2. Selecting client to enter workspace...');
    await page.click("button:has-text('Select Client')");
    await page.click(".client-item:has-text('test1')");
    await page.waitForSelector('.workspace');

    console.log('3. Verifying Tab Switcher presence...');
    const timelineTab = await page.locator('button:has-text("Timeline")');
    const listTab = await page.locator('button:has-text("Item List")');
    
    if (await timelineTab.count() === 0 || await listTab.count() === 0) {
      throw new Error('FAIL: Tabs not found in Bundled UI');
    }
    console.log('   OK: Tabs found.');

    console.log('4. Verifying Timeline Grid visibility...');
    const grid = await page.locator('.tl-grid');
    if (!await grid.isVisible()) {
      throw new Error('FAIL: Timeline Grid not visible');
    }
    console.log('   OK: Timeline Grid visible.');

    console.log('5. Testing Tab Switching...');
    await listTab.click();
    await page.waitForTimeout(500);
    const detailsHeader = await page.locator('h3:has-text("Item Details")');
    if (!await detailsHeader.isVisible()) {
        throw new Error('FAIL: Item List section not visible after clicking tab');
    }
    console.log('   OK: Successfully switched to List tab.');

    console.log('6. Taking final screenshot...');
    await page.screenshot({ path: 'bundled_verification.png' });
    console.log('--- SUCCESS: Bundled UI is correct ---');

  } catch (err) {
    console.error('--- VERIFICATION FAILED ---');
    console.error(err.message);
    await page.screenshot({ path: 'failed_bundled_verification.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
