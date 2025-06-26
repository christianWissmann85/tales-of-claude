import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function checkUIKeys() {
  console.log('🔍 Checking UI hotkeys...');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser to see what happens
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate and start game
    await page.goto('http://localhost:5173');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.keyboard.press('Space');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const screenshotDir = path.join(process.cwd(), 'src/tests/visual/screenshots');
    
    // Test each key
    const keys = [
      { key: 'q', name: 'quest', expectedSelector: '[class*="quest"]' },
      { key: 'i', name: 'inventory', expectedSelector: '[class*="inventory"]' },
      { key: 'c', name: 'character', expectedSelector: '[class*="character"]' },
      { key: 's', name: 'save', expectedSelector: '[class*="save"]' },
    ];
    
    for (const { key, name, expectedSelector } of keys) {
      console.log(`\n📋 Testing ${key.toUpperCase()} key (${name})...`);
      
      // Press the key
      await page.keyboard.press(key);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Take screenshot
      const screenshotPath = path.join(screenshotDir, `ui-${name}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`  📸 Screenshot: ${screenshotPath}`);
      
      // Check what's visible
      const foundElement = await page.$(expectedSelector);
      console.log(`  Element found: ${foundElement ? '✓' : '✗'}`);
      
      // Find any modal or overlay
      const modalSelectors = [
        '[class*="modal"]',
        '[class*="overlay"]',
        '[class*="dialog"]',
        '[class*="popup"]',
        '[class*="window"]',
        `[class*="${name}"]`
      ];
      
      for (const selector of modalSelectors) {
        const modal = await page.$(selector);
        if (modal) {
          const className = await modal.evaluate(el => el.className);
          console.log(`  Found ${selector}: ${className}`);
        }
      }
      
      // Press Escape to close (if it opened)
      await page.keyboard.press('Escape');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Wait for user to see results
    console.log('\n✅ Test complete. Browser will stay open for 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

checkUIKeys().catch(console.error);