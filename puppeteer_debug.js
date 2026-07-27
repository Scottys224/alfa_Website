const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => {
        console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    await page.goto('http://localhost:51409', { waitUntil: 'networkidle0' });
    
    console.log("Page loaded. Clicking English...");
    
    // Accept cookies if needed
    try {
        await page.click('#cookie-save-settings');
        await page.waitForTimeout(500);
    } catch(e) {}

    // Click English
    await page.evaluate(() => {
        doGTranslate('fr|en');
    });

    await page.waitForTimeout(3000);
    
    const html = await page.evaluate(() => document.getElementById('google_translate_element2').innerHTML);
    console.log("HTML of GTranslate element:", html);
    
    await browser.close();
})();
