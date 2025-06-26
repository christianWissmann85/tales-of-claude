// Quick test to verify quest panel fix
import puppeteer from 'puppeteer';

async function testQuestPanelFix() {
  console.log('🔍 Testing Quest Panel Fix...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to the game
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start game
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Skip opening scene if present
    await page.keyboard.press('Space');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Open quest journal
    console.log('📜 Opening quest journal...');
    await page.keyboard.press('KeyQ');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot
    await page.screenshot({
      path: 'quest-panel-fixed.png',
      fullPage: true
    });
    
    // Check for quest panel elements
    const questPanelInfo = await page.evaluate(() => {
      const container = document.querySelector('[class*="questLogContainer"]');
      const questList = document.querySelector('[class*="questList"]');
      const questDetails = document.querySelector('[class*="questDetails"]');
      const content = document.querySelector('[class*="content"]');
      
      const getInfo = (el: Element | null, name: string) => {
        if (!el) return { name, found: false };
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        return {
          name,
          found: true,
          width: rect.width,
          height: rect.height,
          visible: rect.width > 0 && rect.height > 0,
          display: styles.display,
          minHeight: styles.minHeight
        };
      };
      
      return {
        container: getInfo(container, 'Container'),
        content: getInfo(content, 'Content'),
        questList: getInfo(questList, 'Quest List'),
        questDetails: getInfo(questDetails, 'Quest Details')
      };
    });
    
    console.log('\n📊 Quest Panel Analysis:');
    Object.values(questPanelInfo).forEach((info: any) => {
      if (info.found) {
        console.log(`\n${info.name}:`);
        console.log(`  Size: ${info.width}x${info.height}`);
        console.log(`  Visible: ${info.visible ? '✅' : '❌'}`);
        console.log(`  Display: ${info.display}`);
        console.log(`  Min Height: ${info.minHeight}`);
      } else {
        console.log(`\n${info.name}: NOT FOUND ❌`);
      }
    });
    
    console.log('\n✅ Test complete! Check quest-panel-fixed.png');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('\n👀 Browser will stay open for manual inspection...');
    console.log('Press Ctrl+C to close');
  }
}

testQuestPanelFix().catch(console.error);