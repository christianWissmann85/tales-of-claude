import { chromium } from 'playwright';

/**
 * Comprehensive UI hotkey test with full debugging
 */
async function testUIHotkeysComprehensive() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1280,720']
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  // Capture all console messages
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('VICTOR DEBUG') || text.includes('dispatching') || text.includes('TOGGLE_')) {
      console.log('🔍', text);
    }
  });

  console.log('🎮 Starting Comprehensive UI Hotkey Test...\n');

  try {
    await page.goto('http://localhost:5173?agent=true');
    await page.waitForTimeout(3000);

    console.log('✅ Game loaded successfully\n');

    // Test each hotkey with full state checking
    const hotkeys = [
      { key: 'i', name: 'Inventory', stateKey: 'showInventory', selector: '[class*="inventory"], [class*="Inventory"]' },
      { key: 'q', name: 'Quest Journal', stateKey: 'showQuestLog', selector: '[class*="questJournal"], [class*="QuestJournal"], [class*="questLog"], [class*="QuestLog"]' },
      { key: 'c', name: 'Character Screen', stateKey: 'showCharacterScreen', selector: '[class*="characterScreen"], [class*="CharacterScreen"]' },
      { key: 'f', name: 'Faction Status', stateKey: 'showFactionStatus', selector: '[class*="factionStatus"], [class*="FactionStatus"]' }
    ];

    for (const hotkey of hotkeys) {
      console.log(`\n🔑 Testing ${hotkey.name} (${hotkey.key.toUpperCase()})...`);
      
      // Clear console logs
      consoleLogs.length = 0;
      
      // Press the key
      await page.keyboard.press(hotkey.key);
      await page.waitForTimeout(200);
      
      // Check state
      const state = await page.evaluate((stateKey) => {
        const gameState = (window as any).__gameState;
        return {
          [stateKey]: gameState?.[stateKey],
          allStates: {
            showInventory: gameState?.showInventory,
            showQuestLog: gameState?.showQuestLog,
            showCharacterScreen: gameState?.showCharacterScreen,
            showFactionStatus: gameState?.showFactionStatus
          }
        };
      }, hotkey.stateKey);
      
      // Check DOM element
      const element = await page.$(hotkey.selector);
      
      // Report results
      console.log(`  State ${hotkey.stateKey}: ${state[hotkey.stateKey]}`);
      console.log(`  DOM element found: ${!!element}`);
      console.log(`  All UI states:`, JSON.stringify(state.allStates, null, 2));
      
      // Check for dispatch in logs
      const dispatchLog = consoleLogs.find(log => log.includes(`TOGGLE_${hotkey.stateKey.replace('show', '').toUpperCase()}`));
      if (dispatchLog) {
        console.log(`  ✅ Dispatch action found`);
      } else {
        console.log(`  ❌ No dispatch action found`);
      }
      
      // Close if opened
      if (state[hotkey.stateKey] || element) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
      }
      
      await page.waitForTimeout(300); // Wait between tests
    }
    
    // Test rapid switching
    console.log('\n\n🔥 Testing rapid UI switching...');
    console.log('Opening Inventory...');
    await page.keyboard.press('i');
    await page.waitForTimeout(150);
    
    console.log('Switching to Quest Journal...');
    await page.keyboard.press('q');
    await page.waitForTimeout(150);
    
    const finalState = await page.evaluate(() => {
      const gameState = (window as any).__gameState;
      return {
        showInventory: gameState?.showInventory,
        showQuestLog: gameState?.showQuestLog
      };
    });
    
    console.log('Final states:', finalState);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    console.log('\n\n🛑 Test complete. Browser will remain open for 15 seconds...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

// Run the test
testUIHotkeysComprehensive().catch(console.error);