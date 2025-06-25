import puppeteer from 'puppeteer';

async function checkVisualIntegration() {
  console.log('🎨 Visual Integration Test Starting...\n');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 800 });
  
  // Capture console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Capture uncaught exceptions
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });
  
  try {
    // Test 1: Load the game
    console.log('Test 1: Loading game...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for game initialization
    
    // Check for game board
    const gameBoard = await page.$('.game-board, [class*="gameBoard"]');
    if (!gameBoard) {
      console.error('❌ Game board not found!');
    } else {
      console.log('✅ Game board loaded');
    }
    
    // Test 2: Check floor tile test page
    console.log('\nTest 2: Loading floor tile test page...');
    await page.goto('http://localhost:5173?test=floor-tiles', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const floorTestContainer = await page.$('[class*="container"]');
    if (!floorTestContainer) {
      console.error('❌ Floor tile test page not loaded!');
    } else {
      console.log('✅ Floor tile test page loaded');
      
      // Check for color adjustments
      const hasBrightnessControl = await page.$('input[type="range"]');
      if (hasBrightnessControl) {
        console.log('✅ Color adjustment controls present');
      }
    }
    
    // Test 3: Check main game visual elements
    console.log('\nTest 3: Checking main game visual elements...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Skip splash screen if present
    const startButton = await page.$('button');
    if (startButton) {
      await startButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Check for grid cells
    const gridCells = await page.$$('[class*="gridCell"]');
    console.log(`✅ Found ${gridCells.length} grid cells`);
    
    // Check for background colors on floor tiles
    const cellsWithBgColor = await page.evaluate(() => {
      const cells = document.querySelectorAll('[class*="gridCell"]');
      let count = 0;
      cells.forEach(cell => {
        const style = window.getComputedStyle(cell as HTMLElement);
        if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') {
          count++;
        }
      });
      return count;
    });
    
    if (cellsWithBgColor > 0) {
      console.log(`✅ Floor tiles using background colors: ${cellsWithBgColor} cells`);
    } else {
      console.log('⚠️  No floor tiles with background colors detected');
    }
    
    // Test 4: Check for player visibility
    console.log('\nTest 4: Checking player visibility...');
    const playerEmoji = await page.$eval('[class*="gridCell"]', () => {
      const cells = document.querySelectorAll('[class*="gridCell"]');
      for (const cell of cells) {
        if (cell.textContent === '🤖') {
          return true;
        }
      }
      return false;
    }).catch(() => false);
    
    if (playerEmoji) {
      console.log('✅ Player (🤖) is visible');
    } else {
      console.log('⚠️  Player not visible (might be in intro/splash)');
    }
    
    // Test 5: Check for console errors
    console.log('\nTest 5: Checking for console errors...');
    if (consoleErrors.length > 0) {
      console.error('❌ Console errors found:');
      consoleErrors.forEach(err => console.error(`   - ${err}`));
    } else {
      console.log('✅ No console errors');
    }
    
    if (pageErrors.length > 0) {
      console.error('❌ Page errors found:');
      pageErrors.forEach(err => console.error(`   - ${err}`));
    } else {
      console.log('✅ No page errors');
    }
    
    // Test 6: Check CSS Grid for multi-tile support
    console.log('\nTest 6: Checking CSS Grid implementation...');
    const hasGridContainer = await page.evaluate(() => {
      const container = document.querySelector('[class*="mapGridContainer"]');
      if (!container) { return false; }
      const style = window.getComputedStyle(container as HTMLElement);
      return style.display === 'grid';
    });
    
    if (hasGridContainer) {
      console.log('✅ CSS Grid container found (multi-tile ready)');
    } else {
      console.log('⚠️  CSS Grid not detected');
    }
    
    // Test 7: Check for NaN issues
    console.log('\nTest 7: Checking for NaN in data attributes...');
    const nanElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-map-x], [data-map-y]');
      let nanCount = 0;
      elements.forEach(el => {
        const x = el.getAttribute('data-map-x');
        const y = el.getAttribute('data-map-y');
        if (x === 'NaN' || y === 'NaN') {
          nanCount++;
        }
      });
      return nanCount;
    });
    
    if (nanElements > 0) {
      console.error(`❌ Found ${nanElements} elements with NaN coordinates`);
    } else {
      console.log('✅ No NaN issues in coordinates');
    }
    
    // Summary
    console.log('\n📊 Visual Integration Test Summary:');
    console.log('===================================');
    const issues = [];
    
    if (consoleErrors.length > 0) { issues.push(`${consoleErrors.length} console errors`); }
    if (pageErrors.length > 0) { issues.push(`${pageErrors.length} page errors`); }
    if (nanElements > 0) { issues.push(`${nanElements} NaN coordinates`); }
    if (cellsWithBgColor === 0) { issues.push('No floor background colors'); }
    
    if (issues.length === 0) {
      console.log('✅ All visual systems working correctly!');
    } else {
      console.log('⚠️  Issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
checkVisualIntegration().catch(console.error);