import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function debugPageLoad() {
  console.log('🔍 Starting debug page load test...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Collect console messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      console.log('Browser console:', text);
    });
    
    // Collect page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      const errorMsg = error.toString();
      pageErrors.push(errorMsg);
      console.error('Page error:', errorMsg);
    });
    
    // Collect failed requests
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      const failure = `${request.failure()?.errorText} ${request.url()}`;
      failedRequests.push(failure);
      console.error('Request failed:', failure);
    });
    
    // Track all requests to find 404s
    const notFoundRequests: string[] = [];
    page.on('response', response => {
      if (response.status() === 404) {
        const url = response.url();
        notFoundRequests.push(url);
        console.error('404 Not Found:', url);
      }
    });
    
    console.log('📡 Navigating to http://localhost:5173...');
    
    // Navigate with detailed error catching
    try {
      const response = await page.goto('http://localhost:5173', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      console.log(`Response status: ${response?.status()}`);
      console.log(`Response URL: ${response?.url()}`);
      
      // Wait a bit for any dynamic content
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (navError) {
      console.error('Navigation error:', navError);
    }
    
    // Take screenshot
    const screenshotDir = path.join(process.cwd(), 'src/tests/visual/screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    const screenshotPath = path.join(screenshotDir, 'debug-loading.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);
    
    // Get page content
    const pageTitle = await page.title();
    console.log(`Page title: "${pageTitle}"`);
    
    // Check for specific elements
    const elements = {
      body: await page.$('body') !== null,
      gameBoard: await page.$('.game-board') !== null,
      gameContainer: await page.$('.game-container') !== null,
      canvas: await page.$('canvas') !== null,
      loading: await page.$('.loading') !== null,
      error: await page.$('.error') !== null,
      button: await page.$('button') !== null,
      titleScreen: await page.$('[class*="logo"]') !== null,
      anyClickable: await page.$$('button, a, [onclick], [role="button"]').then(els => els.length),
    };
    
    console.log('\n🔍 Element presence check:');
    Object.entries(elements).forEach(([name, exists]) => {
      console.log(`  ${name}: ${exists ? '✓' : '✗'}`);
    });
    
    // Try pressing Enter to start the game
    console.log('\n⌨️ Pressing ENTER to start game...');
    try {
      await page.keyboard.press('Enter');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if game board appeared after Enter
      const gameBoardAfterEnter = await page.$('.game-board') !== null;
      console.log(`Game board after Enter: ${gameBoardAfterEnter ? '✓' : '✗'}`);
      
      // Take another screenshot after Enter
      const screenshotPath2 = path.join(screenshotDir, 'debug-after-enter.png');
      await page.screenshot({ path: screenshotPath2, fullPage: true });
      console.log(`📸 Post-Enter screenshot saved to: ${screenshotPath2}`);
      
      // Now press Space to skip intro
      console.log('\n⌨️ Pressing SPACE to skip intro...');
      await page.keyboard.press('Space');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if game board appeared after Space
      const gameBoardAfterSpace = await page.$('.game-board') !== null;
      console.log(`Game board after Space: ${gameBoardAfterSpace ? '✓' : '✗'}`);
      
      // Take final screenshot
      const screenshotPath3 = path.join(screenshotDir, 'debug-game-loaded.png');
      await page.screenshot({ path: screenshotPath3, fullPage: true });
      console.log(`📸 Game loaded screenshot saved to: ${screenshotPath3}`);
      
    } catch (enterError) {
      console.error('Enter key error:', enterError);
    }
    
    // Get body HTML structure (first 500 chars)
    const bodyHTML = await page.evaluate(() => {
      const body = document.body;
      return body ? body.innerHTML.substring(0, 500) : 'No body element';
    });
    console.log('\n📄 Body HTML preview:');
    console.log(bodyHTML);
    
    // Get all text content on page
    const textContent = await page.evaluate(() => {
      return document.body?.innerText || 'No text content';
    });
    console.log('\n📝 Page text content:');
    console.log(textContent.substring(0, 200));
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`Console logs: ${consoleLogs.length}`);
    console.log(`Page errors: ${pageErrors.length}`);
    console.log(`Failed requests: ${failedRequests.length}`);
    console.log(`404 requests: ${notFoundRequests.length}`);
    
    if (pageErrors.length > 0) {
      console.log('\n❌ Page Errors:');
      pageErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    if (failedRequests.length > 0) {
      console.log('\n❌ Failed Requests:');
      failedRequests.forEach((req, i) => console.log(`  ${i + 1}. ${req}`));
    }
    
    if (notFoundRequests.length > 0) {
      console.log('\n❌ 404 Not Found Requests:');
      notFoundRequests.forEach((req, i) => console.log(`  ${i + 1}. ${req}`));
    }
    
    if (consoleLogs.length > 0) {
      console.log('\n📋 All Console Logs:');
      consoleLogs.forEach((log, i) => console.log(`  ${i + 1}. ${log}`));
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Debug test complete');
  }
}

// Run the debug test
debugPageLoad().catch(console.error);