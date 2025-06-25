// Test script for map transitions
import { test, expect, Page } from '@playwright/test';
import { setupGame, takeScreenshot } from './visual-test-utils';

test.describe('Map Transition Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await setupGame(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should transition from Terminal Town to Binary Forest', async () => {
    console.log('Starting map transition test...');
    
    // Wait for game to fully load
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await takeScreenshot(page, 'initial-state');
    
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
    
    // Take screenshot at exit position
    await takeScreenshot(page, 'at-exit-position');
    
    // Try to move onto the exit
    console.log('Attempting to trigger exit...');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1000);
    
    // Take screenshot after transition attempt
    await takeScreenshot(page, 'after-transition-attempt');
    
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
  });
});