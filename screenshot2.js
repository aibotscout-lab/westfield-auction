const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });
  
  const page = await context.newPage();
  
  // Go to the auction page (fresh - will show registration)
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  
  // Take screenshot of registration
  await page.screenshot({ path: '/tmp/auction-v2-registration.png', fullPage: true });
  
  await browser.close();
  console.log('Screenshot saved!');
})();
