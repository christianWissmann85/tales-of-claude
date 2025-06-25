import { chromium } from 'playwright';

/**
 * Manual test - keep browser open for manual testing
 */
async function testManualHotkeys() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1280,720']
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  // Capture all console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('TOGGLE_') || text.includes('GameContext')) {
      console.log('🔍', text);
    }
  });

  console.log('🎮 Manual Hotkey Test\n');
  console.log('Loading game...');

  await page.goto('http://localhost:5173?agent=true');
  await page.waitForTimeout(3000);

  console.log('\n✅ Game loaded!');
  console.log('\n📋 Instructions:');
  console.log('  - Press I for Inventory (should work)');
  console.log('  - Press Q for Quest Journal');
  console.log('  - Press C for Character Screen');
  console.log('  - Press F for Faction Status');
  console.log('  - Press ESC to close panels');
  console.log('\nWatch the console for dispatch messages.');
  console.log('\nThe browser will stay open for 2 minutes for testing...');

  // Keep browser open for manual testing
  await page.waitForTimeout(120000);
  await browser.close();
}

// Run the test
testManualHotkeys().catch(console.error);