const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000/admin/verifications', { waitUntil: 'networkidle2' });
  
  // Click the 'Property Intelligence' tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tab = btns.find(b => b.textContent.includes('Property Intelligence'));
    if (tab) tab.click();
  });
  
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
