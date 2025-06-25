import { chromium } from 'playwright';

/**
 * Test UI hotkey functionality
 * Verifies that I, Q, C, F keys open their respective panels
 */
async function testUIHotkeys() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1280,720']
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  console.log('🎮 Starting UI Hotkey Test...');

  try {
    // Navigate to the game with agent mode to skip splash
    await page.goto('http://localhost:5173?agent=true');
    await page.waitForTimeout(2000);

    console.log('📍 Game loading in agent mode (skipping splash)...');

    // Wait for game board with better selector
    const gameBoard = await page.waitForSelector('.gameBoard', { timeout: 5000 }).catch(() => null);
    if (!gameBoard) {
      // Try alternate selectors
      const gameBoardAlt = await page.$('[class*="gameBoard"]');
      if (!gameBoardAlt) {
        throw new Error('Game board not found - game may not have started properly');
      }
    }

    console.log('✅ Game started successfully');

    // Test Inventory (I key)
    console.log('\n🔑 Testing Inventory hotkey (I)...');
    await page.keyboard.press('i');
    await page.waitForTimeout(500);
    
    const inventory = await page.$('[class*="inventory"]');
    if (inventory) {
      console.log('✅ Inventory opened with I key');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('❌ Inventory failed to open with I key');
    }

    // Test Quest Journal (Q key)
    console.log('\n🔑 Testing Quest Journal hotkey (Q)...');
    await page.keyboard.press('q');
    await page.waitForTimeout(500);
    
    const questJournal = await page.$('[class*="questJournal"], [class*="QuestJournal"]');
    if (questJournal) {
      console.log('✅ Quest Journal opened with Q key');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('❌ Quest Journal failed to open with Q key');
    }

    // Test Character Screen (C key)
    console.log('\n🔑 Testing Character Screen hotkey (C)...');
    await page.keyboard.press('c');
    await page.waitForTimeout(500);
    
    const characterScreen = await page.$('[class*="characterScreen"], [class*="CharacterScreen"]');
    if (characterScreen) {
      console.log('✅ Character Screen opened with C key');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('❌ Character Screen failed to open with C key');
    }

    // Test Faction Status (F key)
    console.log('\n🔑 Testing Faction Status hotkey (F)...');
    await page.keyboard.press('f');
    await page.waitForTimeout(500);
    
    const factionStatus = await page.$('[class*="factionStatus"], [class*="FactionStatus"]');
    if (factionStatus) {
      console.log('✅ Faction Status opened with F key');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('❌ Faction Status failed to open with F key');
    }

    // Test ESC closes all panels
    console.log('\n🔑 Testing ESC key functionality...');
    await page.keyboard.press('i'); // Open inventory
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    
    const inventoryAfterEsc = await page.$('.inventory');
    if (!inventoryAfterEsc) {
      console.log('✅ ESC successfully closed the panel');
    } else {
      console.log('❌ ESC failed to close the panel');
    }

    console.log('\n✨ UI Hotkey test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🛑 Test finished. Browser will remain open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the test
testUIHotkeys().catch(console.error);