import puppeteer from 'puppeteer';

async function findGameSelectors() {
  console.log('🔍 Finding game selectors...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate and start game
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Press Enter to start
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Press Space to skip intro
    await page.keyboard.press('Space');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find all class names that might be game-related
    const classNames = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const classes = new Set<string>();
      
      allElements.forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(cls => {
            if (cls && cls.trim()) classes.add(cls);
          });
        }
      });
      
      return Array.from(classes).sort();
    });
    
    console.log('\n📋 All class names found:');
    classNames.forEach(cls => console.log(`  .${cls}`));
    
    // Look for specific game elements
    const gameElements = await page.evaluate(() => {
      const results: Record<string, any> = {};
      
      // Find main game container
      const gameContainer = document.querySelector('[class*="gameContainer"]');
      results.gameContainer = gameContainer ? gameContainer.className : null;
      
      // Find main layout
      const mainLayout = document.querySelector('[class*="mainLayout"]');
      results.mainLayout = mainLayout ? mainLayout.className : null;
      
      // Find canvas or game board area
      const canvas = document.querySelector('canvas');
      results.hasCanvas = !!canvas;
      
      // Find the main game area (might be a div with tiles)
      const tilesContainer = document.querySelector('[class*="tiles"], [class*="board"], [class*="game-area"], [class*="gameArea"]');
      results.tilesContainer = tilesContainer ? tilesContainer.className : null;
      
      // Find by content - look for water emojis
      const allDivs = Array.from(document.querySelectorAll('div'));
      const waterDiv = allDivs.find(div => div.textContent?.includes('💧') || div.textContent?.includes('🌊'));
      results.waterContainer = waterDiv ? waterDiv.className : null;
      results.waterContainerParent = waterDiv?.parentElement ? waterDiv.parentElement.className : null;
      
      // Find wizard emoji (Claude)
      const wizardDiv = allDivs.find(div => div.textContent?.includes('🧙'));
      results.playerContainer = wizardDiv ? wizardDiv.className : null;
      
      return results;
    });
    
    console.log('\n🎮 Game elements found:');
    Object.entries(gameElements).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // Try to find the actual game board by structure
    const gameStructure = await page.evaluate(() => {
      // Look for a container with many child divs (likely tiles)
      const containers = Array.from(document.querySelectorAll('div'));
      
      for (const container of containers) {
        const children = container.children;
        // Game board likely has many tiles (20+ children)
        if (children.length > 20) {
          const firstChildText = children[0]?.textContent || '';
          // Check if children contain game emojis
          if (firstChildText.includes('💧') || firstChildText.includes('🌊') || 
              firstChildText.includes('🏠') || firstChildText.includes('🧙')) {
            return {
              className: container.className,
              childCount: children.length,
              parentClassName: container.parentElement?.className,
              id: container.id || 'no-id',
              selector: container.className ? `.${container.className.split(' ')[0]}` : null
            };
          }
        }
      }
      return null;
    });
    
    console.log('\n🎯 Likely game board structure:');
    console.log(gameStructure);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

findGameSelectors().catch(console.error);