const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });
  
  const page = await context.newPage();
  
  // Go to the auction page
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  // Set localStorage to simulate registration
  await page.evaluate(() => {
    localStorage.setItem('bidder_id', 'demo-user-123');
    localStorage.setItem('bidder_name', 'John Smith');
  });
  
  // Reload to show items
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Take screenshot of items view
  await page.screenshot({ path: '/tmp/auction-items.png', fullPage: true });
  
  // Click on first item to open bid modal
  const bidButton = await page.locator('button:has-text("Place Bid")').first();
  if (bidButton) {
    await bidButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/auction-bid-modal.png' });
  }
  
  await browser.close();
  console.log('Screenshots saved!');
})();
