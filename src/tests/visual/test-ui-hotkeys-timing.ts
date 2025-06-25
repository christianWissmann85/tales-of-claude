import { chromium } from 'playwright';

/**
 * Test UI hotkey functionality with proper timing
 */
async function testUIHotkeysTiming() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1280,720']
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  // Listen to all console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('VICTOR DEBUG') || text.includes('dispatching')) {
      console.log('🔍 Console:', text);
    }
  });

  console.log('🎮 Starting UI Hotkey Timing Test...');

  try {
    await page.goto('http://localhost:5173?agent=true');
    await page.waitForTimeout(3000); // Longer initial wait

    console.log('✅ Game loaded');

    // Test I key first (known to work)
    console.log('\n🔑 Testing Inventory (I) - Control test...');
    await page.keyboard.press('i');
    await page.waitForTimeout(1000);
    
    let inventory = await page.$('[class*="inventory"], [class*="Inventory"]');
    console.log(`Inventory visible: ${!!inventory}`);
    
    if (inventory) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500); // Wait for cooldown
    }

    // Test Q key with extra wait
    console.log('\n🔑 Testing Quest Journal (Q) with 500ms cooldown wait...');
    await page.waitForTimeout(500); // Extra cooldown wait
    await page.keyboard.press('q');
    await page.waitForTimeout(1000);
    
    let questJournal = await page.$('[class*="questJournal"], [class*="QuestJournal"], [class*="questLog"], [class*="QuestLog"]');
    console.log(`Quest Journal visible: ${!!questJournal}`);
    
    // Check state directly
    const questState = await page.evaluate(() => (window as any).__gameState?.showQuestLog);
    console.log(`Quest Log state: ${questState}`);
    
    if (questJournal || questState) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Test with lowercase and uppercase
    console.log('\n🔑 Testing Quest Journal with shift+Q...');
    await page.waitForTimeout(500);
    await page.keyboard.press('Shift+Q');
    await page.waitForTimeout(1000);
    
    questJournal = await page.$('[class*="questJournal"], [class*="QuestJournal"], [class*="questLog"], [class*="QuestLog"]');
    console.log(`Quest Journal visible after Shift+Q: ${!!questJournal}`);

    // Try pressing Q multiple times
    console.log('\n🔑 Testing Q key multiple times...');
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(400);
      console.log(`  Attempt ${i + 1}...`);
      await page.keyboard.press('q');
      await page.waitForTimeout(600);
      
      const state = await page.evaluate(() => (window as any).__gameState?.showQuestLog);
      console.log(`  Quest Log state: ${state}`);
      
      if (state) break;
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🛑 Test finished. Browser will remain open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Run the test
testUIHotkeysTiming().catch(console.error);