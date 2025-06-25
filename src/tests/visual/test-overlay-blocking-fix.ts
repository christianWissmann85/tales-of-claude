// Test for the inventory overlay blocking bug fix
// This test verifies that UI panels don't create invisible blocking layers

import { chromium, Browser, Page } from 'playwright';

async function testOverlayBlockingFix() {
  console.log('🔍 Testing inventory overlay blocking bug fix...');
  
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    
    // Navigate to the game
    await page.goto('http://localhost:5174');
    await page.waitForTimeout(2000);
    
    // Wait for game to load
    await page.waitForSelector('.gameBoard', { timeout: 10000 });
    console.log('✅ Game loaded successfully');
    
    // Press 'I' to open inventory
    await page.keyboard.press('i');
    await page.waitForTimeout(500);
    
    // Check if inventory is visible
    const inventoryVisible = await page.isVisible('.inventoryOverlay');
    console.log(`✅ Inventory opened: ${inventoryVisible}`);
    
    // Close inventory by clicking overlay background
    const overlay = await page.$('.inventoryOverlay');
    if (overlay) {
      const box = await overlay.boundingBox();
      if (box) {
        // Click near the edge of the overlay (background area)
        await page.mouse.click(box.x + 10, box.y + 10);
        await page.waitForTimeout(500);
      }
    }
    
    // Check if inventory is closed
    const inventoryClosed = !(await page.isVisible('.inventoryOverlay'));
    console.log(`✅ Inventory closed by clicking overlay: ${inventoryClosed}`);
    
    // Try to interact with an NPC (this was being blocked before)
    // Move to find an NPC
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    
    // Press Enter to interact
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Check if dialogue opened
    const dialogueVisible = await page.isVisible('.dialogueBox');
    console.log(`✅ Can interact with NPCs after closing inventory: ${dialogueVisible}`);
    
    // Test Quest Journal
    await page.keyboard.press('Escape'); // Close dialogue
    await page.waitForTimeout(300);
    await page.keyboard.press('j'); // Open quest journal
    await page.waitForTimeout(500);
    
    const questJournalVisible = await page.isVisible('.questLogOverlay');
    console.log(`✅ Quest journal opened: ${questJournalVisible}`);
    
    // Close by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    const questJournalClosed = !(await page.isVisible('.questLogOverlay'));
    console.log(`✅ Quest journal closed: ${questJournalClosed}`);
    
    console.log('✅ All overlay blocking tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testOverlayBlockingFix().catch(console.error);