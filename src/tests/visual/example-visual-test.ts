#!/usr/bin/env tsx
/**
 * Example Visual Test with Warning System
 * 
 * This demonstrates the new visual-first testing approach
 * Always shows a warning before opening browser windows
 */

import { chromium, Browser, Page } from 'playwright';
import { showVisualTestWarning } from './visual-test-warning.js';

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:5173';

async function runVisualTest() {
  let browser: Browser | null = null;
  let page: Page | null = null; // Declare page here to make it accessible in catch block

  try {
    // ALWAYS show warning first in visual mode
    await showVisualTestWarning({
      agentName: 'Tamy',
      agentRole: 'Expert Playtest Agent',
      testDescription: 'Comprehensive gameplay verification',
      resolution: { width: 1920, height: 1080 }, // HD for detailed testing
      estimatedDuration: '~2 minutes'
    });

    // Launch browser in VISUAL mode
    browser = await chromium.launch({
      headless: false, // Visual mode - Chris wants to watch!
      args: [
        '--window-size=1920,1080',
        '--window-position=100,100' // Position window nicely
      ]
    });

    page = await browser.newPage({ // Assign to the declared page variable
      viewport: { width: 1920, height: 1080 }
    });

    console.log('\n📍 Navigating to game...');
    await page.goto(`${TARGET_URL}?agent=true`); // Skip splash screens
    
    // Wait for game to load
    await page.waitForFunction(() => {
      return document.body.textContent?.includes('🤖');
    }, { timeout: 10000 });

    console.log('✅ Game loaded successfully!');

    // Take initial screenshot
    await page.screenshot({ 
      path: './visual-test-results/game-initial.png',
      fullPage: false 
    });
    console.log('📸 Screenshot: game-initial.png');

    // Test player movement
    console.log('\n🎮 Testing player movement...');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: './visual-test-results/after-movement.png' 
    });
    console.log('📸 Screenshot: after-movement.png');

    // Test inventory
    console.log('\n📦 Testing inventory system...');
    await page.keyboard.press('i');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: './visual-test-results/inventory-open.png' 
    });
    console.log('📸 Screenshot: inventory-open.png');

    // Test quest journal
    console.log('\n📜 Testing quest journal...');
    await page.keyboard.press('Escape'); // Close inventory
    await page.waitForTimeout(500);
    await page.keyboard.press('j');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: './visual-test-results/quest-journal.png' 
    });
    console.log('📸 Screenshot: quest-journal.png');

    console.log('\n✨ Visual test completed successfully!');
    console.log('Check ./visual-test-results/ for screenshots');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    
    // Try to capture error screenshot using the existing 'page' variable
    if (browser && page) { // Ensure both browser and page were successfully created
      await page.screenshot({ 
        path: './visual-test-results/error-state.png' 
      });
      console.log('📸 Error screenshot saved: error-state.png');
    }
    
    throw error;
  } finally {
    if (browser) {
      console.log('\n🔚 Closing browser...');
      await browser.close();
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runVisualTest().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runVisualTest };