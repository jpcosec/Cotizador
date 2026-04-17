import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 1200 });
  
  console.log('Opening app...');
  await page.goto('http://localhost:8082/');
  
  console.log('Selecting client...');
  await page.click("button:has-text('Select Client')");
  await page.click(".client-item:has-text('test1')");
  
  console.log('Waiting for workspace...');
  await page.waitForSelector('.workspace');
  
  console.log('Adding item...');
  await page.click(".category-head >> nth=0");
  await page.waitForTimeout(2000);
  await page.click("button[aria-label='Ship to basket'] >> nth=0");
  await page.waitForTimeout(3000);
  
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'verify_ui.png', fullPage: true });
  
  await browser.close();
  console.log('Done. Check verify_ui.png');
})();
