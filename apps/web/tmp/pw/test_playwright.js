const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('response', async response => {
        const url = response.url();
        if (url.includes('api.weble.net')) {
            console.log('API Call:', url);
        }
    });

    console.log("Navigating to Revu...");
    await page.goto('https://www.revu.net/campaigns?type=local&category=&page=2', { waitUntil: 'load' });
    console.log("Waiting 3s...");
    await new Promise(r => setTimeout(r, 3000));
    await browser.close();
})();
