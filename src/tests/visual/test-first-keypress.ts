import { chromium } from 'playwright';

/**
 * Test first keypress without any prior interactions
 */
async function testFirstKeypress() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1280,720'],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  // Capture console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('VICTOR DEBUG') || text.includes('dispatching')) {
      console.log('🔍', text);
    }
  });

  console.log('🎮 Testing first keypress scenario...\n');

  try {
    await page.goto('http://localhost:5173?agent=true');
    await page.waitForTimeout(3000);

    console.log('✅ Game loaded\n');

    // Test Q as the VERY FIRST key press
    console.log('🔑 Pressing Q as first key (no prior interactions)...');
    await page.keyboard.press('q');
    await page.waitForTimeout(500);
    
    const qState = await page.evaluate(() => {
      const gameState = (window as any).__gameState;
      return gameState?.showQuestLog;
    });
    
    console.log(`Quest Log opened: ${qState}`);

    // Close and wait
    if (qState) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }

    // Now test C
    console.log('\n🔑 Testing C key...');
    await page.keyboard.press('c');
    await page.waitForTimeout(500);
    
    const cState = await page.evaluate(() => {
      const gameState = (window as any).__gameState;
      return gameState?.showCharacterScreen;
    });
    
    console.log(`Character Screen opened: ${cState}`);

    // Close and wait
    if (cState) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }

    // Now test F
    console.log('\n🔑 Testing F key...');
    await page.keyboard.press('f');
    await page.waitForTimeout(500);
    
    const fState = await page.evaluate(() => {
      const gameState = (window as any).__gameState;
      return gameState?.showFactionStatus;
    });
    
    console.log(`Faction Status opened: ${fState}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🛑 Test complete. Browser remains open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Run the test
testFirstKeypress().catch(console.error);