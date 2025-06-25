import { chromium } from 'playwright';

/**
 * Focused test on Q key
 */
async function testQKeyFocus() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1280,720']
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  // Capture ALL console messages
  page.on('console', msg => {
    console.log('Console:', msg.text());
  });

  console.log('🎮 Testing Q Key Focus\n');

  await page.goto('http://localhost:5173?agent=true');
  await page.waitForTimeout(3000);

  console.log('✅ Game loaded\n');
  
  // Inject a helper to monitor the game loop
  await page.evaluate(() => {
    const gameEngine = (window as any).__gameEngine;
    if (gameEngine) {
      // Override _processInput to add logging
      const original = gameEngine._processInput.bind(gameEngine);
      let callCount = 0;
      gameEngine._processInput = function() {
        if (this._pressedKeys && this._pressedKeys.has('KeyQ')) {
          callCount++;
          if (callCount <= 5) {
            console.log(`[INJECTED] _processInput called with Q pressed (call #${callCount})`);
          }
        }
        return original();
      };
    }
  });

  console.log('Pressing Q in 1 second...');
  await page.waitForTimeout(1000);
  
  // Press and release Q
  await page.keyboard.down('q');
  await page.waitForTimeout(100);
  await page.keyboard.up('q');
  
  await page.waitForTimeout(1000);
  
  // Check final state
  const state = await page.evaluate(() => {
    const gameState = (window as any).__gameState;
    return {
      showQuestLog: gameState?.showQuestLog,
      showInventory: gameState?.showInventory
    };
  });
  
  console.log('\nFinal state:', state);
  
  await page.waitForTimeout(5000);
  await browser.close();
}

// Run the test
testQKeyFocus().catch(console.error);