import { chromium, Browser, Page } from 'playwright';

async function testMapTransitions() {
    let browser: Browser | undefined;
    let page: Page | undefined;
    
    try {
        browser = await chromium.launch();
        page = await browser.newPage();
        
        // Navigate to the game URL. Assuming it runs on localhost:3000
        // This replaces the functionality of setupGame which would typically load the page.
        await page.goto('http://localhost:3000');

        console.log('Starting map transition test...');
        
        // Wait for game to fully load
        await page.waitForTimeout(3000);
        
        // takeScreenshot(page, 'initial-state'); // Commented out as visual-test-utils is not available
        
        // Move player to the right edge where the exit should be
        // Terminal Town is 20 wide, player starts at (1,2), exit is at (19,7)
        // So we need to move right 18 times and down 5 times
        
        console.log('Moving player to exit...');
        
        // Move down 5 times
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('ArrowDown');
          await page.waitForTimeout(200);
        }
        
        // Move right 18 times
        for (let i = 0; i < 18; i++) {
          await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(200);
        }
        
        // takeScreenshot(page, 'at-exit-position'); // Commented out
        
        // Try to move onto the exit
        console.log('Attempting to trigger exit...');
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(1000);
        
        // takeScreenshot(page, 'after-transition-attempt'); // Commented out
        
        // Check console logs
        const consoleLogs = await page.evaluate(() => {
          return (window as any).__consoleLogs || [];
        });
        
        console.log('Console logs:', consoleLogs);
        
        // Check if we're in Binary Forest
        const mapName = await page.locator('.map-name').textContent().catch(() => null);
        console.log('Current map name:', mapName);
        
        // Check player position
        const playerPos = await page.evaluate(() => {
          const gameState = (window as any).__gameState;
          return gameState?.player?.position || null;
        });
        console.log('Player position:', playerPos);

        // Add a simple check to indicate success or failure based on map name
        if (mapName === 'Binary Forest') {
            console.log('SUCCESS: Transition to Binary Forest confirmed!');
        } else {
            console.error('FAILURE: Map transition did not result in Binary Forest. Current map:', mapName);
        }
        
    } catch (error) {
        console.error('An error occurred during the test:', error);
    } finally {
        if (page) await page.close();
        if (browser) await browser.close();
    }
}

// Run the test
testMapTransitions();