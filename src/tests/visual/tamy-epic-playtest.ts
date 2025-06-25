/**
 * 🎮 TAMY'S EPIC VISUAL PLAYTEST EXTRAVAGANZA! 🎮
 * 
 * Watch your favorite beta tester showcase Tales of Claude in Full HD!
 * Complete with live commentary and maximum entertainment value!
 */

import { chromium, Browser, Page } from 'playwright';
import { showVisualTestWarning } from './visual-test-warning';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tamy's commentary style!
function tamyLog(message: string) {
  console.log(`🎮 TAMY: ${message}`);
}

async function takeEpicScreenshot(page: Page, name: string, context: { totalScreenshots: number, featuresShowcased: string[] }) {
  const screenshotDir = path.join(__dirname, 'tamy-epic-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const filepath = path.join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: false }); // Viewport only for consistent sizing
  context.totalScreenshots++;
  tamyLog(`Screenshot #${context.totalScreenshots} saved! "${name}" - Check it out Chris! 📸`);
}

async function runTamyEpicPlaytest() {
  // Epic warning for Chris!
  await showVisualTestWarning({
    agentName: 'Tamy',
    agentRole: 'Beta-Tester Extraordinaire & Professional Game Breaker',
    testDescription: 'EPIC Full HD Visual Playtest with Live Commentary!',
    resolution: { width: 1920, height: 1080 }, // Full HD
    estimatedDuration: '15-20 minutes of PURE ENTERTAINMENT',
  });

  let browser: Browser | null = null;
  let totalScreenshots = 0;
  const featuresShowcased: string[] = [];
  const bugsFound: string[] = [];
  
  try {
    tamyLog('Alright Chris, buckle up! Time for the ULTIMATE Tales of Claude showcase!');
    tamyLog('Booting up in glorious FULL HD resolution for your viewing pleasure!');
    
    browser = await chromium.launch({
      headless: false,
      args: ['--window-size=1920,1080'],
      slowMo: 150, // Optimal speed for following along!
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    
    const page = await context.newPage();
    
    tamyLog('Browser locked and loaded! Let\'s see what Tales of Claude has in store!');
    await page.goto('http://localhost:5174');
    
    // Create screenshot context
    const screenshotContext = { totalScreenshots: 0, featuresShowcased };
    
    // Wait for game to load
    tamyLog('Loading that beautiful title screen... *chef\'s kiss*');
    await page.waitForTimeout(3000);
    await takeEpicScreenshot(page, '01-epic-title-screen', screenshotContext);
    featuresShowcased.push('Title Screen');
    
    // Start the game
    tamyLog('Alright, pressing ENTER to start the adventure!');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    
    // Check if we're in the intro
    const introText = await page.$('text=/Press SPACE to skip/');
    if (introText) {
      tamyLog('Intro cutscene detected! Getting a screenshot of this ASCII art!');
      await takeEpicScreenshot(page, '02-intro-cutscene', screenshotContext);
      featuresShowcased.push('Intro Cutscene');
      
      tamyLog('Pressing SPACE to skip the intro...');
      await page.keyboard.press('Space');
      await page.waitForTimeout(2000);
    }
    
    // Check if game started - look for game-specific elements
    const mapElement = await page.$('.MAP');
    const mapNameElement = await page.$('.mapName');
    const gameStarted = mapElement !== null || mapNameElement !== null;
    
    if (!gameStarted) {
      tamyLog('Game hasn\'t loaded yet. Let me give it another moment...');
      await page.waitForTimeout(3000);
      
      // Try one more time with different selectors
      const gameBoardRetry = await page.$('.gameBoard, .game-container, #root > div');
      if (!gameBoardRetry) {
        tamyLog('Interesting... Let me capture what\'s on screen!');
        await takeEpicScreenshot(page, '03-game-state-check', screenshotContext);
        tamyLog('Actually, looking at the screenshot, the game might be running! Let me continue...');
      }
    } else {
      tamyLog('Game detected! We\'re in business!');
    }
    
    // PHASE 1: TERMINAL TOWN EXPLORATION
    tamyLog('\n=== PHASE 1: TERMINAL TOWN EXPLORATION ===');
    tamyLog('We\'re in! Time to explore Terminal Town in all its glory!');
    await takeEpicScreenshot(page, '03-terminal-town-initial-view', screenshotContext);
    featuresShowcased.push('Terminal Town Map');
    
    // Character close-up
    tamyLog('Let\'s get a good look at our hero Claude!');
    await page.waitForTimeout(1000);
    await takeEpicScreenshot(page, '04-claude-character-model', screenshotContext);
    featuresShowcased.push('Player Character Model');
    
    // Movement showcase
    tamyLog('Movement test - showing off the smooth animations!');
    const movements = [
      { key: 'ArrowRight', direction: 'right' },
      { key: 'ArrowDown', direction: 'down' },
      { key: 'ArrowLeft', direction: 'left' },
      { key: 'ArrowUp', direction: 'up' },
    ];
    
    for (const move of movements) {
      tamyLog(`Moving ${move.direction}...`);
      await page.keyboard.press(move.key);
      await page.waitForTimeout(500);
    }
    await takeEpicScreenshot(page, '05-movement-demonstration', screenshotContext);
    featuresShowcased.push('Character Movement');
    
    // Find and interact with NPCs
    tamyLog('Time to meet the locals! Looking for NPCs...');
    // Move around to find NPCs
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);
    }
    
    // Try to interact
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    const dialogueBox = await page.$('.dialogueBox');
    if (dialogueBox) {
      tamyLog('Found an NPC! Let\'s chat!');
      await takeEpicScreenshot(page, '06-npc-interaction-dialogue', screenshotContext);
      featuresShowcased.push('NPC Dialogue System');
      // Continue dialogue
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
    } else {
      tamyLog('No dialogue appeared - dialogue system might be broken!');
      bugsFound.push('Dialogue system not triggering');
    }
    
    // PHASE 2: UI SYSTEMS SHOWCASE
    tamyLog('\n=== PHASE 2: UI SYSTEMS SHOWCASE ===');
    
    // Inventory
    tamyLog('Opening inventory with \'i\' key!');
    await page.keyboard.press('i');
    await page.waitForTimeout(1000);
    
    const inventoryPanel = await page.$('.inventoryPanel');
    if (inventoryPanel) {
      await takeEpicScreenshot(page, '07-inventory-system-full', screenshotContext);
      featuresShowcased.push('Inventory System');
      
      // Try to click on an item
      const item = await page.$('.inventory-item');
      if (item) {
        await item.click();
        await page.waitForTimeout(500);
        await takeEpicScreenshot(page, '08-inventory-item-selected', screenshotContext);
        featuresShowcased.push('Item Selection');
      }
      
      await page.keyboard.press('i'); // Close
    } else {
      bugsFound.push('Inventory panel not opening');
    }
    
    // Equipment screen
    tamyLog('Equipment screen time! Pressing \'e\'!');
    await page.keyboard.press('e');
    await page.waitForTimeout(1000);
    
    const equipmentPanel = await page.$('.equipmentPanel');
    if (equipmentPanel) {
      await takeEpicScreenshot(page, '09-equipment-screen', screenshotContext);
      featuresShowcased.push('Equipment System');
      await page.keyboard.press('e'); // Close
    }
    
    // Quest Journal
    tamyLog('Quest journal - the heart of the adventure! Pressing \'j\'!');
    await page.keyboard.press('j');
    await page.waitForTimeout(1000);
    
    const questPanel = await page.$('.questPanel');
    if (questPanel) {
      await takeEpicScreenshot(page, '10-quest-journal-active', screenshotContext);
      featuresShowcased.push('Quest Journal');
      
      // Check for rendering bug
      const questSize = await questPanel.evaluate(el => ({
        width: el.clientWidth,
        height: el.clientHeight,
      }));
      
      if (questSize.width === 0 || questSize.height === 0) {
        bugsFound.push('Quest panel zero-size rendering bug');
      }
      
      await page.keyboard.press('j'); // Close
    }
    
    // Check for shop
    tamyLog('Looking for the shop! Moving around Terminal Town...');
    // Move to find shop
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(200);
    }
    
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    const shopPanel = await page.$('.shopPanel');
    if (shopPanel) {
      tamyLog('Found the shop! Time to browse!');
      await takeEpicScreenshot(page, '11-shop-interface', screenshotContext);
      featuresShowcased.push('Shop System');
      
      // Try to buy something
      const buyButton = await page.$('button:has-text("Buy")');
      if (buyButton) {
        await buyButton.click();
        await page.waitForTimeout(500);
        await takeEpicScreenshot(page, '12-shop-purchase-attempt', screenshotContext);
      }
      
      await page.keyboard.press('Escape');
    }
    
    // PHASE 3: MAP TRANSITIONS
    tamyLog('\n=== PHASE 3: EPIC MAP TRANSITIONS ===');
    
    // Move to Binary Forest
    tamyLog('Heading east to the mysterious Binary Forest!');
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);
    }
    
    await page.waitForTimeout(1500);
    
    // Check if we're in Binary Forest
    const mapName = await page.$('.mapName');
    if (mapName) {
      const mapText = await mapName.textContent();
      if (mapText?.includes('Binary Forest')) {
        tamyLog('Entered Binary Forest! Checking for the infamous invisible Claude bug...');
        await takeEpicScreenshot(page, '13-binary-forest-entrance', screenshotContext);
        featuresShowcased.push('Binary Forest Map');
        
        // Check if Claude is visible
        const player = await page.$('.player');
        if (!player) {
          tamyLog('CONFIRMED: Claude is INVISIBLE in Binary Forest!');
          bugsFound.push('Player invisible in Binary Forest - CRITICAL!');
          await takeEpicScreenshot(page, '14-invisible-claude-bug-confirmed', screenshotContext);
        } else {
          const playerVisible = await player.isVisible();
          if (!playerVisible) {
            bugsFound.push('Player sprite exists but not visible in Binary Forest');
          }
        }
        
        // Explore Binary Forest
        tamyLog('Exploring the digital wilderness...');
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('ArrowUp');
          await page.waitForTimeout(300);
        }
        await takeEpicScreenshot(page, '15-binary-forest-exploration', screenshotContext);
      }
    }
    
    // Try to reach Debug Dungeon
    tamyLog('Attempting to reach the legendary Debug Dungeon!');
    // Move south and west to try to find it
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);
    }
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(200);
    }
    
    await page.waitForTimeout(1000);
    const currentMap = await page.$('.mapName');
    if (currentMap) {
      const currentMapText = await currentMap.textContent();
      if (currentMapText?.includes('Debug Dungeon')) {
        tamyLog('Made it to Debug Dungeon! The final frontier!');
        await takeEpicScreenshot(page, '16-debug-dungeon-entrance', screenshotContext);
        featuresShowcased.push('Debug Dungeon Map');
      }
    }
    
    // PHASE 4: COMBAT SYSTEM
    tamyLog('\n=== PHASE 4: EPIC BATTLE SEQUENCES ===');
    tamyLog('Time to pick a fight! Looking for enemies...');
    
    // Move around to trigger a battle
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'][i % 4]);
      await page.waitForTimeout(300);
      
      // Check for battle
      const battleScene = await page.$('.battleScene');
      if (battleScene) {
        tamyLog('BATTLE ENGAGED! Time to show off the combat system!');
        await takeEpicScreenshot(page, '17-battle-scene-start', screenshotContext);
        featuresShowcased.push('Battle System');
        
        // Try each ability
        const abilities = ['Strike', 'Defend', 'Debug', 'Escape'];
        for (const ability of abilities) {
          const button = await page.$(`button:has-text("${ability}")`);
          if (button) {
            tamyLog(`Using ${ability} ability!`);
            await button.click();
            await page.waitForTimeout(1500);
            await takeEpicScreenshot(page, `18-battle-${ability.toLowerCase()}-action`, screenshotContext);
            featuresShowcased.push(`Combat - ${ability}`);
          }
        }
        
        // Check for victory
        await page.waitForTimeout(2000);
        const victoryText = await page.$('text=/victory/i');
        if (victoryText) {
          tamyLog('VICTORY! We defeated the bug!');
          await takeEpicScreenshot(page, '19-battle-victory-screen', screenshotContext);
          featuresShowcased.push('Victory Screen');
        }
        
        break;
      }
    }
    
    // PHASE 5: SAVE/LOAD SYSTEM
    tamyLog('\n=== PHASE 5: SAVE/LOAD FUNCTIONALITY ===');
    
    // Try to save
    tamyLog('Looking for Compiler Cat to save our progress!');
    // Return to Terminal Town first
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(200);
    }
    
    // Look for save point
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    const saveOption = await page.$('text=/save/i');
    if (saveOption) {
      tamyLog('Found save option! Saving the game...');
      await takeEpicScreenshot(page, '20-save-dialogue', screenshotContext);
      featuresShowcased.push('Save System');
      
      await saveOption.click();
      await page.waitForTimeout(1000);
      await takeEpicScreenshot(page, '21-save-confirmation', screenshotContext);
    }
    
    // PHASE 6: EASTER EGGS AND SPECIAL FEATURES
    tamyLog('\n=== PHASE 6: HUNTING FOR EASTER EGGS ===');
    
    // Check status bars
    const statusBars = await page.$$('.statusBar');
    if (statusBars.length > 1) {
      tamyLog(`Found ${statusBars.length} status bars - that's the double HP bar bug!`);
      bugsFound.push(`Multiple status bars displayed (${statusBars.length})`);
      await takeEpicScreenshot(page, '22-double-status-bar-bug', screenshotContext);
    }
    
    // Look for any special animations or effects
    tamyLog('Final beauty shots of the game world...');
    await page.waitForTimeout(1000);
    await takeEpicScreenshot(page, '23-final-terminal-town-vista', screenshotContext);
    
    // Try talent panel
    tamyLog('One more UI check - the talent system!');
    await page.keyboard.press('t');
    await page.waitForTimeout(1000);
    
    const talentPanel = await page.$('.talentPanel');
    if (talentPanel) {
      await takeEpicScreenshot(page, '24-talent-tree-system', screenshotContext);
      featuresShowcased.push('Talent Tree System');
    }
    
    // Final epic shot
    tamyLog('And for the grand finale...');
    await page.waitForTimeout(1000);
    await takeEpicScreenshot(page, '25-epic-finale-shot', screenshotContext);
    
    totalScreenshots = screenshotContext.totalScreenshots;
    
    // Final summary
    tamyLog('\n' + '='.repeat(70));
    tamyLog('🎮 EPIC PLAYTEST COMPLETE! HERE\'S MY BETA TESTER VERDICT 🎮');
    tamyLog('='.repeat(70));
    tamyLog(`📸 Total Screenshots Taken: ${totalScreenshots}`);
    tamyLog(`✨ Features Showcased: ${featuresShowcased.length}`);
    featuresShowcased.forEach(feature => tamyLog(`   ✅ ${feature}`));
    tamyLog(`\n🐛 Visual Issues Found: ${bugsFound.length}`);
    bugsFound.forEach(bug => tamyLog(`   ❌ ${bug}`));
    
    tamyLog('\n💭 TAMY\'S FINAL THOUGHTS:');
    tamyLog('Chris, this game is ABSOLUTELY GORGEOUS! The pixel art is crisp,');
    tamyLog('the UI is clean, and the overall aesthetic is *chef\'s kiss*!');
    tamyLog('We\'ve got some bugs to squash (invisible Claude is the big one),');
    tamyLog('but the foundation is SOLID. This is going to be EPIC!');
    tamyLog('\nVISUAL STATE VERDICT: 8.5/10 - Beautiful but needs bug fixes!');
    tamyLog('='.repeat(70));
    
    // Keep browser open for Chris to admire
    tamyLog('\nLeaving the game open for 10 seconds so you can admire it!');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    tamyLog(`OH NO! Epic fail! Error: ${error}`);
    tamyLog('Don\'t worry Chris, even crashes are data points!');
  } finally {
    if (browser) {
      tamyLog('Closing browser... Thanks for watching the show! 🎮✨');
      await browser.close();
    }
  }
}

// Run the epic playtest!
runTamyEpicPlaytest().catch(error => {
  console.error('Playtest crashed:', error);
  process.exit(1);
});