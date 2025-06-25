#!/usr/bin/env tsx
import { chromium, Browser, Page } from 'playwright';

// Focused test to diagnose keyboard input issues
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:5173';

async function testKeyboardInput() {
  console.log('🔍 Testing keyboard input handling...\n');
  
  let browser: Browser | null = null;
  
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    });
    
    // Enable verbose console logging
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Navigate with agent mode
    console.log('1. Loading game...');
    await page.goto(`${TARGET_URL}?agent=true`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.body.textContent?.includes('🤖'), { timeout: 10000 });
    console.log('   ✅ Game loaded\n');
    
    // Test 1: Check if keyboard hook is attached
    console.log('2. Checking keyboard hook...');
    const hasKeyboardHook = await page.evaluate(() => {
      // Check if window has any keydown listeners
      const listeners = (window as any).getEventListeners ? (window as any).getEventListeners(window) : null;
      return listeners ? !!listeners.keydown : 'Cannot check listeners';
    });
    console.log(`   Keyboard hook check: ${hasKeyboardHook}\n`);
    
    // Test 2: Inject debug logging into GameEngine
    console.log('3. Injecting debug logging...');
    await page.evaluate(() => {
      // Try to find the game engine instance
      const debugInterval = setInterval(() => {
        console.log('[DEBUG] Checking for GameEngine...');
      }, 1000);
      
      // Store interval ID for cleanup
      (window as any).debugInterval = debugInterval;
    });
    
    // Test 3: Simulate keyboard events with different methods
    console.log('4. Testing keyboard input methods...\n');
    
    // Method 1: Playwright keyboard API
    console.log('   Method 1: page.keyboard.press()');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    
    // Method 2: Dispatching keyboard events
    console.log('   Method 2: dispatchEvent()');
    await page.evaluate(() => {
      const event = new KeyboardEvent('keydown', {
        code: 'ArrowRight',
        key: 'ArrowRight',
        keyCode: 39,
        which: 39,
        bubbles: true,
      });
      window.dispatchEvent(event);
      console.log('[DEBUG] Dispatched ArrowRight keydown event');
    });
    await page.waitForTimeout(500);
    
    // Method 3: Focus on document body first
    console.log('   Method 3: Focus body + keyboard press');
    await page.evaluate(() => {
      document.body.focus();
      console.log('[DEBUG] Focused on document.body');
    });
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    
    // Test 4: Check if UI keys work
    console.log('\n5. Testing UI keys...');
    console.log('   Pressing "i" for inventory...');
    await page.keyboard.press('i');
    await page.waitForTimeout(500);
    
    const hasInventory = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.includes('Inventory') || text.includes('Equipment');
    });
    console.log(`   Inventory opened: ${hasInventory ? '✅' : '❌'}\n`);
    
    // Test 5: Check player position
    console.log('6. Checking player position...');
    const playerData = await page.evaluate(() => {
      // Find player emoji
      const cells = document.querySelectorAll('*');
      let playerCell = null;
      for (let i = 0; i < cells.length; i++) {
        if (cells[i].textContent === '🤖') {
          playerCell = cells[i];
          break;
        }
      }
      
      if (playerCell) {
        const rect = playerCell.getBoundingClientRect();
        // Try to find position info in the game state
        const positionText = Array.from(document.querySelectorAll('*'))
          .find(el => el.textContent?.includes('Position:'))?.textContent;
        
        return {
          found: true,
          bounds: { x: rect.left, y: rect.top },
          positionText,
        };
      }
      return { found: false };
    });
    
    console.log(`   Player found: ${playerData.found ? '✅' : '❌'}`);
    if (playerData.found) {
      console.log(`   Player screen position: (${playerData.bounds ? playerData.bounds.x : 0}, ${playerData.bounds ? playerData.bounds.y : 0})`);
      if (playerData.positionText) {
        console.log(`   ${playerData.positionText}`);
      }
    }
    
    // Test 6: Check for any error messages
    console.log('\n7. Checking for error messages...');
    const errorMessages = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const errors = [];
      if (text.includes('Error')) { errors.push('Found "Error" in page'); }
      if (text.includes('Failed')) { errors.push('Found "Failed" in page'); }
      if (text.includes('Cannot')) { errors.push('Found "Cannot" in page'); }
      return errors;
    });
    
    if (errorMessages.length > 0) {
      console.log('   ⚠️ Potential errors found:');
      errorMessages.forEach(err => console.log(`      - ${err}`));
    } else {
      console.log('   ✅ No error messages found');
    }
    
    // Cleanup
    await page.evaluate(() => {
      if ((window as any).debugInterval) {
        clearInterval((window as any).debugInterval);
      }
    });
    
  } catch (error: any) {
    console.error('💥 Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  console.log('\n🔍 Keyboard input test complete\n');
}

// Run the test
testKeyboardInput();