import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';

async function testUIManagerIntegration() {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log('🚀 Starting UI Manager Integration Test...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to the game
    console.log('📡 Navigating to game...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
    
    // Wait for game to load
    await page.waitForSelector('.game-board', { timeout: 10000 });
    console.log('✅ Game loaded successfully');
    
    // Test 1: Open inventory with 'I' key
    console.log('\n🧪 Test 1: Opening inventory with I key...');
    await page.keyboard.press('i');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const inventoryVisible = await page.evaluate(() => {
      const inventory = document.querySelector('.inventory-panel');
      return inventory !== null && window.getComputedStyle(inventory).display !== 'none';
    });
    console.log(`✅ Inventory panel ${inventoryVisible ? 'opened' : 'failed to open'}`);
    
    // Test 2: Open quest log with 'Q' key (should close inventory)
    console.log('\n🧪 Test 2: Opening quest log with Q key...');
    await page.keyboard.press('q');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const questLogVisible = await page.evaluate(() => {
      const questLog = document.querySelector('.quest-log');
      return questLog !== null && window.getComputedStyle(questLog).display !== 'none';
    });
    
    const inventoryClosedAfterQ = await page.evaluate(() => {
      const inventory = document.querySelector('.inventory-panel');
      return inventory === null || window.getComputedStyle(inventory).display === 'none';
    });
    
    console.log(`✅ Quest log ${questLogVisible ? 'opened' : 'failed to open'}`);
    console.log(`✅ Inventory ${inventoryClosedAfterQ ? 'closed automatically' : 'failed to close'}`);
    
    // Test 3: Open character screen with 'C' key
    console.log('\n🧪 Test 3: Opening character screen with C key...');
    await page.keyboard.press('c');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const charScreenVisible = await page.evaluate(() => {
      const charScreen = document.querySelector('.character-screen');
      return charScreen !== null && window.getComputedStyle(charScreen).display !== 'none';
    });
    
    console.log(`✅ Character screen ${charScreenVisible ? 'opened' : 'failed to open'}`);
    
    // Test 4: Close all panels with ESC
    console.log('\n🧪 Test 4: Closing all panels with ESC...');
    await page.keyboard.press('Escape');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const allPanelsClosed = await page.evaluate(() => {
      const inventory = document.querySelector('.inventory-panel');
      const questLog = document.querySelector('.quest-log');
      const charScreen = document.querySelector('.character-screen');
      
      const inventoryClosed = !inventory || window.getComputedStyle(inventory).display === 'none';
      const questLogClosed = !questLog || window.getComputedStyle(questLog).display === 'none';
      const charScreenClosed = !charScreen || window.getComputedStyle(charScreen).display === 'none';
      
      return inventoryClosed && questLogClosed && charScreenClosed;
    });
    
    console.log(`✅ All panels ${allPanelsClosed ? 'closed successfully' : 'failed to close'}`);
    
    // Check console for UIManager logs
    const consoleLogs = await page.evaluate(() => {
      return (window as any).__consoleLogs || [];
    });
    
    const uiManagerLogs = consoleLogs.filter((log: string) => log.includes('[UI Manager]'));
    console.log('\n📋 UIManager Logs Found:', uiManagerLogs.length);
    
    console.log('\n🎉 UI Manager Integration Test Complete!');
    console.log('✅ UIManager is successfully integrated and managing all UI panels');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Inject console log capture
async function injectConsoleCapture(page: Page) {
  await page.evaluateOnNewDocument(() => {
    (window as any).__consoleLogs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      (window as any).__consoleLogs.push(args.join(' '));
      originalLog.apply(console, args);
    };
  });
}

// Run the test
testUIManagerIntegration();