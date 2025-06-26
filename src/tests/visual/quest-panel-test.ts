// Quest Panel Visual Test
// This test captures the quest panel UI to identify zero-size element issues

import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';
import { join } from 'path';

const SCREENSHOT_DIR = join(process.cwd(), 'src/tests/visual/quest-panel-screenshots');

async function testQuestPanel() {
  console.log('🔍 Starting Quest Panel Visual Test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to the game
    console.log('📍 Navigating to game...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for game to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Press Enter to start the game
    console.log('🎮 Starting game...');
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Take initial screenshot
    await page.screenshot({
      path: join(SCREENSHOT_DIR, 'game-loaded.png') as `${string}.png`,
      fullPage: true
    });
    console.log('✅ Game loaded screenshot captured');
    
    // Press Q to open quest journal
    console.log('📜 Opening quest journal (Q key)...');
    await page.keyboard.press('KeyQ');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take quest journal screenshot
    await page.screenshot({
      path: join(SCREENSHOT_DIR, 'quest-journal-open.png') as `${string}.png`,
      fullPage: true
    });
    console.log('✅ Quest journal screenshot captured');
    
    // Inspect for zero-size elements
    console.log('🔍 Inspecting for zero-size elements...');
    const zeroSizeElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const zeroSize: any[] = [];
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        
        // Check if element should be visible but has zero size
        if (styles.display !== 'none' && 
            styles.visibility !== 'hidden' &&
            el.classList.length > 0 &&
            (rect.width === 0 || rect.height === 0)) {
          
          // Skip elements that are intentionally zero-size (like borders)
          if (!el.classList.toString().includes('border')) {
            zeroSize.push({
              classes: Array.from(el.classList).join(' '),
              tagName: el.tagName,
              width: rect.width,
              height: rect.height,
              display: styles.display,
              position: styles.position,
              innerHTML: el.innerHTML.substring(0, 50)
            });
          }
        }
      });
      
      return zeroSize as any[];
    });
    
    if (zeroSizeElements.length > 0) {
      console.log('⚠️  Found zero-size elements:');
      zeroSizeElements.forEach(el => {
        console.log(`  - ${el.tagName}.${el.classes}: ${el.width}x${el.height} (${el.display}, ${el.position})`);
        if (el.innerHTML) {
          console.log(`    Content: "${el.innerHTML}..."`);
        }
      });
    } else {
      console.log('✅ No zero-size elements found!');
    }
    
    // Check specific quest panel elements
    const questPanelInfo = await page.evaluate(() => {
      const questLog = document.querySelector('[class*="questLog"]');
      const questList = document.querySelector('[class*="questList"]');
      const questDetails = document.querySelector('[class*="questDetails"]');
      
      const getElementInfo = (el: Element | null, name: string) => {
        if (!el) return { name, found: false };
        
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        
        return {
          name,
          found: true,
          width: rect.width,
          height: rect.height,
          display: styles.display,
          visibility: styles.visibility,
          overflow: styles.overflow,
          classes: el.className
        };
      };
      
      return {
        questLog: getElementInfo(questLog, 'Quest Log Container'),
        questList: getElementInfo(questList, 'Quest List'),
        questDetails: getElementInfo(questDetails, 'Quest Details')
      };
    });
    
    console.log('\n📊 Quest Panel Component Analysis:');
    Object.values(questPanelInfo).forEach((info: any) => {
      if (info.found) {
        console.log(`\n${info.name}:`);
        console.log(`  Size: ${info.width}x${info.height}`);
        console.log(`  Display: ${info.display}`);
        console.log(`  Visibility: ${info.visibility}`);
        console.log(`  Overflow: ${info.overflow}`);
        console.log(`  Classes: ${info.classes}`);
        
        if (info.width === 0 || info.height === 0) {
          console.log('  ⚠️  ZERO SIZE DETECTED!');
        }
      } else {
        console.log(`\n${info.name}: NOT FOUND`);
      }
    });
    
    // Write results to JSON
    const results = {
      timestamp: new Date().toISOString(),
      zeroSizeElements,
      questPanelInfo,
      screenshots: {
        gameLoaded: join(SCREENSHOT_DIR, 'game-loaded.png'),
        questJournal: join(SCREENSHOT_DIR, 'quest-journal-open.png')
      }
    };
    
    writeFileSync(
      join(SCREENSHOT_DIR, 'quest-panel-analysis.json'),
      JSON.stringify(results, null, 2)
    );
    
    console.log('\n✅ Test complete! Results saved to quest-panel-analysis.json');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testQuestPanel().catch(console.error);