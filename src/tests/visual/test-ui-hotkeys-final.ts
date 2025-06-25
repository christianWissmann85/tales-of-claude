import { chromium } from 'playwright';

/**
 * Final UI hotkey test with proper wait conditions
 */
async function testUIHotkeysFinal() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1280,720']
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  console.log('🎮 FINAL UI Hotkey Test\n');

  try {
    await page.goto('http://localhost:5173?agent=true');
    await page.waitForTimeout(3000);
    console.log('✅ Game loaded successfully\n');

    // Test each hotkey with proper waits - using partial class matches for CSS modules
    const tests = [
      { key: 'i', name: 'Inventory', selector: '[class*="inventoryOverlay"]' },
      { key: 'q', name: 'Quest Journal', selector: '[class*="questLogOverlay"]' },
      { key: 'c', name: 'Character Screen', selector: '[class*="characterScreen"]' },
      { key: 'f', name: 'Faction Status', selector: '[class*="factionStatus"]' }
    ];

    for (const test of tests) {
      console.log(`🔑 Testing ${test.name} (${test.key.toUpperCase()})...`);
      
      // Press key
      await page.keyboard.press(test.key);
      
      // Wait for element to appear with a reasonable timeout
      try {
        await page.waitForSelector(test.selector, { timeout: 2000 });
        console.log(`  ✅ ${test.name} opened successfully!`);
        
        // Close it
        await page.keyboard.press('Escape');
        await page.waitForSelector(test.selector, { state: 'hidden', timeout: 1000 });
        console.log(`  ✅ ESC closed the panel`);
      } catch (e) {
        console.log(`  ❌ ${test.name} failed to open`);
      }
      
      // Wait between tests
      await page.waitForTimeout(500);
    }

    // Test rapid switching
    console.log('\n🔥 Testing rapid switching...');
    await page.keyboard.press('i');
    await page.waitForSelector('[class*="inventoryOverlay"]', { timeout: 1000 });
    console.log('  ✅ Inventory opened');
    
    await page.keyboard.press('q');
    await page.waitForSelector('[class*="questLogOverlay"]', { timeout: 1000 });
    await page.waitForSelector('[class*="inventoryOverlay"]', { state: 'hidden', timeout: 1000 });
    console.log('  ✅ Switched to Quest Journal (Inventory closed)');

    console.log('\n✨ All tests completed!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the test
testUIHotkeysFinal().catch(console.error);