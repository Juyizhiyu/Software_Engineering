const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const app = require('../backend-node/app');
const db = require('../backend-node/config/db');

function listen(appInstance) {
    return new Promise(resolve => {
        const server = appInstance.listen(0, () => resolve(server));
    });
}

function close(server) {
    return new Promise((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
    });
}

async function checkViewport(page, baseUrl, viewport, expectMobileHeader) {
    await page.setViewportSize(viewport);
    await page.goto(`${baseUrl}/decision-analysis`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="decision-analysis-page"]', { timeout: 15000 });
    await page.waitForSelector('[data-testid="decision-metrics"]', { timeout: 15000 });

    const title = await page.locator('text=决策分析').first().isVisible();
    assert.equal(title, true, 'decision page title should be visible');

    const mobileHeaderVisible = await page.locator('.app-mobile-header').isVisible().catch(() => false);
    assert.equal(mobileHeaderVisible, expectMobileHeader);

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    assert.equal(hasHorizontalOverflow, false, 'page should not overflow horizontally');

    if (expectMobileHeader) {
        await page.getByLabel('打开导航').click();
        await page.waitForSelector('.app-sidebar--mobile', { timeout: 5000 });
        const mobileDecisionNavVisible = await page.locator('.app-sidebar--mobile').getByText('决策分析').isVisible();
        assert.equal(mobileDecisionNavVisible, true, 'mobile drawer should include decision nav item');
    }
}

async function main() {
    const server = await listen(app);
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;
    const browser = await chromium.launch();

    try {
        const page = await browser.newPage();
        await page.addInitScript(() => {
            localStorage.setItem('token', 'responsive-test-token');
            localStorage.setItem('userName', 'Responsive Tester');
            localStorage.setItem('userRole', 'admin');
        });

        await checkViewport(page, baseUrl, { width: 1366, height: 900 }, false);
        await checkViewport(page, baseUrl, { width: 390, height: 844 }, true);

        console.log('Responsive decision analysis check passed.');
    } finally {
        await browser.close();
        await close(server);
        await db.end();
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
