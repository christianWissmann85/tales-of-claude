import { chromium } from 'playwright';

async function testMapTransitions() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Inject console log capture
  await page.addInitScript(() => {
    (window as any).__consoleLogs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      (window as any).__consoleLogs.push(args.join(' '));
      originalLog(...args);
    };
  });
  
  await page.goto('http://localhost:5175');
  await page.waitForTimeout(3000);
  
  // Click start game
  const startButton = page.locator('button:has-text("Start Game")');
  if (await startButton.isVisible()) {
    await startButton.click();
    await page.waitForTimeout(2000);
  }
  
  // Wait for game state to be available
  await page.waitForFunction(() => (window as any).__gameState?.currentMap?.id, { timeout: 10000 });
  
  // Move to exit position (19, 7)
  console.log('Moving to exit...');
  
  // Move down 5 times (from y=2 to y=7)
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(150);
  }
  
  // Move right 18 times (from x=1 to x=19)
  for (let i = 0; i < 18; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
  }
  
  // Get console logs before transition
  const logsBefore = await page.evaluate(() => (window as any).__consoleLogs);
  console.log('Logs before transition:', logsBefore.filter((log: any) => log.includes('MapLoader') || log.includes('GameEngine')));
  
  // Try to transition
  console.log('Attempting transition...');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(2000);
  
  // Get console logs after transition
  const logsAfter = await page.evaluate(() => (window as any).__consoleLogs);
  console.log('Logs after transition:', logsAfter.filter((log: any) => log.includes('MapLoader') || log.includes('GameEngine')));
  
  // Check current map
  const gameState = await page.evaluate(() => {
    const state = (window as any).__gameState;
    if (!state) return null;
    return {
      mapId: state.currentMap?.id,
      mapName: state.currentMap?.name,
      playerPos: state.player?.position,
      mapExits: state.currentMap?.exits?.length
    };
  });
  console.log('Game state:', gameState);
  
  await page.waitForTimeout(5000); // Keep open to see result
  await browser.close();
}

testMapTransitions().catch(console.error);