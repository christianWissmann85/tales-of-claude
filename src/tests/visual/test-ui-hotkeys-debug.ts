import { chromium } from 'playwright';

/**
 * Test UI hotkey functionality with console debugging
 */
async function testUIHotkeysDebug() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1280,720'],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  // Listen to console messages
  page.on('console', msg => {
    if (msg.text().includes('VICTOR DEBUG')) {
      console.log('🔍 DEBUG:', msg.text());
    }
  });

  console.log('🎮 Starting UI Hotkey Debug Test...');

  try {
    // Navigate to the game with agent mode
    await page.goto('http://localhost:5173?agent=true');
    await page.waitForTimeout(2000);

    console.log('📍 Game loading...');

    // Wait for game board
    await page.waitForSelector('[class*="gameBoard"]', { timeout: 5000 });
    console.log('✅ Game started successfully');

    // Test Q key with debug
    console.log('\n🔑 Testing Quest Journal hotkey (Q) with debug...');
    await page.keyboard.press('q');
    await page.waitForTimeout(1000);
    
    // Check game state through console
    const questLogState = await page.evaluate(() => {
      const gameState = (window as any).__gameState;
      return gameState?.showQuestLog;
    });
    
    console.log(`Quest Log state after Q press: ${questLogState}`);
    
    // Test C key with debug
    console.log('\n🔑 Testing Character Screen hotkey (C) with debug...');
    await page.keyboard.press('c');
    await page.waitForTimeout(1000);
    
    const characterScreenState = await page.evaluate(() => {
      const gameState = (window as any).__gameState;
      return gameState?.showCharacterScreen;
    });
    
    console.log(`Character Screen state after C press: ${characterScreenState}`);
    
    // Test F key with debug
    console.log('\n🔑 Testing Faction Status hotkey (F) with debug...');
    await page.keyboard.press('f');
    await page.waitForTimeout(1000);
    
    const factionStatusState = await page.evaluate(() => {
      const gameState = (window as any).__gameState;
      return gameState?.showFactionStatus;
    });
    
    console.log(`Faction Status state after F press: ${factionStatusState}`);
    
    // Check if keyboard input is being received
    const engineExists = await page.evaluate(() => {
      const engine = (window as any).__gameEngine;
      return engine !== null && engine !== undefined;
    });
    
    console.log(`\nGame Engine exists: ${engineExists}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🛑 Test finished. Browser will remain open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Run the test
testUIHotkeysDebug().catch(console.error);