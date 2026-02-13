const { chromium } = require('playwright');

const themes = ['party', 'ocean', 'sunset', 'forest'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  for (const theme of themes) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2
    });
    
    const page = await context.newPage();
    
    // Go to the auction page
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Set localStorage to simulate registration and theme
    await page.evaluate((themeName) => {
      localStorage.setItem('bidder_id', 'demo-user-123');
      localStorage.setItem('bidder_name', 'John Smith');
      localStorage.setItem('auction_theme', themeName);
    }, theme);
    
    // Reload to apply
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // Take screenshot
    await page.screenshot({ path: `/tmp/auction-theme-${theme}.png`, fullPage: true });
    
    console.log(`Captured ${theme} theme`);
    await context.close();
  }
  
  // Also capture admin page
  const adminContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2
  });
  const adminPage = await adminContext.newPage();
  await adminPage.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
  await adminPage.waitForTimeout(1000);
  await adminPage.screenshot({ path: '/tmp/auction-admin.png' });
  console.log('Captured admin page');
  
  await browser.close();
  console.log('All screenshots saved!');
})();
