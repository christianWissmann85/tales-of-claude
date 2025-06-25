import { chromium } from 'playwright';

/**
 * Test each UI hotkey in isolation with page reloads
 */
async function testUIHotkeysIsolated() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1280,720']
  });

  console.log('🎮 Testing UI Hotkeys in Isolation...\n');

  const testHotkey = async (key: string, name: string, stateKey: string) => {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    // Capture console
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('dispatching TOGGLE_')) {
        console.log('  ✅ Dispatch triggered:', text);
      }
    });

    try {
      console.log(`\n🔑 Testing ${name} (${key.toUpperCase()}) with fresh page...`);
      
      await page.goto('http://localhost:5173?agent=true');
      await page.waitForTimeout(3000);
      
      // Press the key as first action
      await page.keyboard.press(key);
      await page.waitForTimeout(500);
      
      // Check state
      const state = await page.evaluate((stateKey) => {
        const gameState = (window as any).__gameState;
        return gameState?.[stateKey];
      }, stateKey);
      
      console.log(`  ${stateKey}: ${state}`);
      console.log(`  Result: ${state ? '✅ SUCCESS' : '❌ FAILED'}`);
      
    } catch (error: any) {
      console.error('Test failed:', error.message || error);
    } finally {
      await page.close();
    }
  };

  // Test each hotkey
  await testHotkey('i', 'Inventory', 'showInventory');
  await testHotkey('q', 'Quest Journal', 'showQuestLog');
  await testHotkey('c', 'Character Screen', 'showCharacterScreen');
  await testHotkey('f', 'Faction Status', 'showFactionStatus');

  console.log('\n✨ Test complete!');
  await browser.close();
}

// Run the test
testUIHotkeysIsolated().catch(console.error);