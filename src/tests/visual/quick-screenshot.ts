import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

async function takeScreenshot() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Navigating to game...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Click start button
    console.log('Clicking start...');
    await page.waitForSelector('button', { timeout: 5000 });
    await page.click('button');
    await new Promise(r => setTimeout(r, 1000));
    
    // Skip intro
    console.log('Skipping intro...');
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Space');
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Wait for game board
    await new Promise(r => setTimeout(r, 2000));
    
    // Take screenshot
    const screenshotDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    console.log('Taking screenshot of new UI...');
    await page.screenshot({
      path: path.join(screenshotDir, 'new-ui-layout.png'),
      fullPage: true
    });
    
    console.log('Screenshot saved!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshot();