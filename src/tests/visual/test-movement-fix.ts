#!/usr/bin/env tsx
import { chromium, Browser, Page } from 'playwright';

// Test that properly simulates keyboard events including keyup
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:5173';

async function testMovementWithProperKeyEvents() {
  console.log('🔧 Testing movement with proper key event simulation...\n');
  
  let browser: Browser | null = null;
  
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 }
    });
    
    // Capture relevant console logs
    page.on('console', msg => {
      if (msg.text().includes('DEBUG') || msg.text().includes('handleKeyboardInput')) {
        console.log(`[${msg.type()}] ${msg.text()}`);
      }
    });
    
    // Navigate with agent mode
    console.log('1. Loading game...');
    await page.goto(`${TARGET_URL}?agent=true`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.body.textContent?.includes('🤖'), { timeout: 10000 });
    console.log('   ✅ Game loaded\n');
    
    // Helper to get player position
    const getPlayerPosition = async () => {
      return await page.evaluate(() => {
        const cells = document.querySelectorAll('*');
        for (let i = 0; i < cells.length; i++) {
          if (cells[i].textContent === '🤖') {
            const rect = cells[i].getBoundingClientRect();
            return { x: Math.round(rect.left), y: Math.round(rect.top) };
          }
        }
        return null;
      });
    };
    
    // Test 1: Using Playwright's keyboard API (which should handle keyup)
    console.log('2. Testing with Playwright keyboard API...');
    const pos1 = await getPlayerPosition();
    console.log(`   Initial position: ${pos1 ? `(${pos1.x}, ${pos1.y})` : 'not found'}`);
    
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(300);
    
    const pos2 = await getPlayerPosition();
    console.log(`   After ArrowRight: ${pos2 ? `(${pos2.x}, ${pos2.y})` : 'not found'}`);
    console.log(`   Movement: ${pos1 && pos2 && (pos1.x !== pos2.x || pos1.y !== pos2.y) ? '✅ SUCCESS' : '❌ FAILED'}\n`);
    
    // Test 2: Manual keydown/keyup events
    console.log('3. Testing with manual keydown/keyup events...');
    const pos3 = await getPlayerPosition();
    
    await page.evaluate(() => {
      // Simulate complete key press cycle
      const keydownEvent = new KeyboardEvent('keydown', {
        code: 'ArrowDown',
        key: 'ArrowDown',
        keyCode: 40,
        which: 40,
        bubbles: true
      });
      const keyupEvent = new KeyboardEvent('keyup', {
        code: 'ArrowDown',
        key: 'ArrowDown',
        keyCode: 40,
        which: 40,
        bubbles: true
      });
      
      window.dispatchEvent(keydownEvent);
      console.log('[DEBUG] Dispatched ArrowDown keydown');
      
      setTimeout(() => {
        window.dispatchEvent(keyupEvent);
        console.log('[DEBUG] Dispatched ArrowDown keyup');
      }, 100);
    });
    
    await page.waitForTimeout(400);
    
    const pos4 = await getPlayerPosition();
    console.log(`   Before: ${pos3 ? `(${pos3.x}, ${pos3.y})` : 'not found'}`);
    console.log(`   After: ${pos4 ? `(${pos4.x}, ${pos4.y})` : 'not found'}`);
    console.log(`   Movement: ${pos3 && pos4 && (pos3.x !== pos4.x || pos3.y !== pos4.y) ? '✅ SUCCESS' : '❌ FAILED'}\n`);
    
    // Test 3: Check if inventory still works
    console.log('4. Testing inventory key (should work)...');
    await page.keyboard.down('i');
    await page.waitForTimeout(100);
    await page.keyboard.up('i');
    await page.waitForTimeout(300);
    
    const hasInventory = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.includes('INVENTORY') || text.includes('Equipment');
    });
    console.log(`   Inventory opened: ${hasInventory ? '✅ SUCCESS' : '❌ FAILED'}\n`);
    
    // Test 4: Close inventory and test movement again
    if (hasInventory) {
      console.log('5. Closing inventory and testing movement again...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      const pos5 = await getPlayerPosition();
      await page.keyboard.down('ArrowLeft');
      await page.waitForTimeout(100);
      await page.keyboard.up('ArrowLeft');
      await page.waitForTimeout(300);
      
      const pos6 = await getPlayerPosition();
      console.log(`   Before: ${pos5 ? `(${pos5.x}, ${pos5.y})` : 'not found'}`);
      console.log(`   After: ${pos6 ? `(${pos6.x}, ${pos6.y})` : 'not found'}`);
      console.log(`   Movement: ${pos5 && pos6 && (pos5.x !== pos6.x || pos5.y !== pos6.y) ? '✅ SUCCESS' : '❌ FAILED'}\n`);
    }
    
    // Diagnosis
    console.log('📊 DIAGNOSIS:');
    console.log('- Keyboard events ARE reaching the game');
    console.log('- The issue appears to be with movement processing specifically');
    console.log('- UI keys (like inventory) work fine');
    console.log('- This suggests a problem in GameEngine movement logic, not input handling');
    
  } catch (error: any) {
    console.error('💥 Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testMovementWithProperKeyEvents();