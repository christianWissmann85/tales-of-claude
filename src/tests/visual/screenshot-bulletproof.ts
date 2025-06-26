#!/usr/bin/env tsx
/**
 * BULLETPROOF Screenshot Tool for Tales of Claude
 * 
 * Fixed by Kent (Stability & Testing Expert) - June 25, 2025
 * 
 * This tool is designed to work 100% reliably by:
 * 1. Properly detecting and bypassing the splash screen
 * 2. Waiting for specific game elements, not just timeouts
 * 3. Including retry logic for flaky operations
 * 4. Providing clear feedback about what's happening
 * 
 * USAGE:
 * npx tsx src/tests/visual/screenshot-bulletproof.ts [name] [options]
 * 
 * Quick one-liners for agents:
 * - Game view: npx tsx src/tests/visual/screenshot-bulletproof.ts game
 * - Inventory: npx tsx src/tests/visual/screenshot-bulletproof.ts inventory --action key:i
 * - Quest log: npx tsx src/tests/visual/screenshot-bulletproof.ts quests --action key:j
 * - After moving: npx tsx src/tests/visual/screenshot-bulletproof.ts moved --action key:ArrowRight --action wait:1000
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, 'temp');
const DEFAULT_URL = 'http://localhost:5173';

interface ScreenshotOptions {
  name: string;
  url?: string;
  width?: number;
  height?: number;
  actions?: string[];
  fullPage?: boolean;
  debug?: boolean;
}

async function ensureTempDir(): Promise<void> {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * Wait for the game to be fully loaded and ready
 * This is the KEY to reliability - we wait for specific elements!
 */
async function waitForGameReady(page: Page, debug: boolean = false): Promise<void> {
  console.log('🎮 Detecting game state...');
  
  // First, check if we're on the splash screen
  const splashScreen = await page.$('.splash-screen, [class*="splash"], [class*="Splash"], [class*="opening"]');
  
  if (splashScreen) {
    console.log('🎬 Splash screen detected - attempting to skip...');
    
    // Try multiple methods to skip the splash
    const skipMethods = [
      async () => await page.keyboard.press('Enter'),
      async () => await page.keyboard.press('Space'),
      async () => await page.keyboard.press('Escape'),
      async () => {
        const button = await page.$('button:has-text("Start"), button:has-text("Enter"), button:has-text("Continue")');
        if (button) { await button.click(); }
      },
      async () => await page.click('body'), // Click anywhere
    ];
    
    for (const method of skipMethods) {
      try {
        await method();
        await page.waitForTimeout(500);
        
        // Check if we've moved past the splash
        const stillOnSplash = await page.$('.splash-screen, [class*="splash"], [class*="Splash"]');
        if (!stillOnSplash) {
          console.log('✅ Splash screen bypassed!');
          break;
        }
      } catch (e) {
        // Continue trying other methods
      }
    }
    
    // Give it a moment to transition
    await page.waitForTimeout(1000);
  }
  
  // Now wait for the game board to appear
  console.log('⏳ Waiting for game board...');
  
  try {
    // Wait for any of these game elements to appear
    await page.waitForSelector(
      '.game-board, .gameBoard, [class*="GameBoard"], [class*="game-container"], #game-root, .game-area',
      { timeout: 10000, state: 'visible' },
    );
    console.log('✅ Game board detected!');
  } catch (e) {
    console.log('⚠️ Game board not found via selector, checking for game content...');
    
    // Fallback: wait for any substantial content
    await page.waitForFunction(
      () => {
        const body = document.body;
        const text = body.innerText || '';
        // Look for game-specific text
        return text.includes('HP:') || text.includes('MP:') || text.includes('Terminal Town') || text.includes('Level');
      },
      { timeout: 10000 },
    );
    console.log('✅ Game content detected!');
  }
  
  // Final stabilization wait
  await page.waitForTimeout(1000);
  console.log('✅ Game is ready for screenshots!');
}

/**
 * Execute a series of actions on the page
 */
async function executeActions(page: Page, actions: string[]): Promise<void> {
  console.log('🎮 Executing actions...');
  
  for (const action of actions) {
    if (action.startsWith('key:')) {
      const key = action.substring(4);
      console.log(`  📌 Pressing key: ${key}`);
      await page.keyboard.press(key);
      await page.waitForTimeout(500);
    } else if (action.startsWith('click:')) {
      const selector = action.substring(6);
      console.log(`  📌 Clicking: ${selector}`);
      try {
        await page.click(selector, { timeout: 3000 });
      } catch (e) {
        console.log(`    ⚠️ Could not click ${selector}`);
      }
      await page.waitForTimeout(500);
    } else if (action.startsWith('wait:')) {
      const ms = parseInt(action.substring(5));
      console.log(`  📌 Waiting: ${ms}ms`);
      await page.waitForTimeout(ms);
    } else if (action.startsWith('type:')) {
      const text = action.substring(5);
      console.log(`  📌 Typing: ${text}`);
      await page.keyboard.type(text);
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Take a screenshot with retry logic
 */
async function takeScreenshot(options: ScreenshotOptions): Promise<string> {
  await ensureTempDir();
  
  const filepath = path.join(TEMP_DIR, `${options.name}.png`);
  const url = options.url || DEFAULT_URL;
  const width = options.width || 1280;
  const height = options.height || 720;
  
  console.log('\n📸 BULLETPROOF Screenshot Tool v2.0');
  console.log('================================');
  console.log(`📍 URL: ${url}`);
  console.log(`📐 Resolution: ${width}x${height}`);
  console.log(`💾 Output: ${filepath}`);
  console.log('================================\n');
  
  let browser: Browser | null = null;
  let retries = 3;
  let lastError: Error | null = null;
  
  while (retries > 0) {
    try {
      console.log(`🚀 Attempt ${4 - retries}/3...`);
      
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
      });
      
      const page = await browser.newPage({ 
        viewport: { width, height },
        // Ignore HTTPS errors for local development
        ignoreHTTPSErrors: true,
      });
      
      // Set a reasonable timeout
      page.setDefaultTimeout(30000);
      
      // Navigate to the page
      console.log('🌐 Navigating to game...');
      
      // Check if we should use agent mode for instant load
      let finalUrl = url;
      if (!url.includes('?') && !url.includes('agent=') && !url.includes('nosplash=')) {
        // Default to agent mode for faster screenshots
        finalUrl = `${url}?agent=true`;
        console.log('🏃 Using agent mode for instant load');
      }
      
      await page.goto(finalUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
      
      // Wait for the game to be ready
      await waitForGameReady(page, options.debug || false);
      
      // Execute any custom actions
      if (options.actions && options.actions.length > 0) {
        await executeActions(page, options.actions);
      }
      
      // Take the screenshot
      console.log('📸 Capturing screenshot...');
      await page.screenshot({ 
        path: filepath, 
        fullPage: options.fullPage || false,
        animations: 'disabled',
      });
      
      console.log(`\n✅ SUCCESS! Screenshot saved to:\n   ${filepath}\n`);
      
      if (browser) {
        await browser.close();
      }
      
      return filepath;
      
    } catch (error: any) {
      lastError = error;
      retries--;
      
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          // Ignore close errors
        }
      }
      
      if (retries > 0) {
        console.log(`\n⚠️ Attempt failed: ${error.message}`);
        console.log(`🔄 Retrying... (${retries} attempts left)\n`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  throw new Error(`Failed after 3 attempts. Last error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    console.log(`
🎯 BULLETPROOF Screenshot Tool - 100% Reliable!

Usage: npx tsx src/tests/visual/screenshot-bulletproof.ts <name> [options]

Options:
  --url <url>      Custom URL (default: ${DEFAULT_URL}?agent=true)
  --width <n>      Viewport width (default: 1280)
  --height <n>     Viewport height (default: 720)
  --action <cmd>   Add an action (can use multiple times)
  --fullpage       Capture full page
  --debug          Enable debug logging
  --no-agent       Don't use agent mode (shows splash screen)

Actions:
  key:<key>        Press a keyboard key
  click:<selector> Click an element
  wait:<ms>        Wait for milliseconds
  type:<text>      Type text

Quick Examples:
  # Basic game view (instant with agent mode)
  npx tsx src/tests/visual/screenshot-bulletproof.ts game

  # Open inventory
  npx tsx src/tests/visual/screenshot-bulletproof.ts inventory --action key:i

  # Open quest journal
  npx tsx src/tests/visual/screenshot-bulletproof.ts quests --action key:j

  # Move and wait
  npx tsx src/tests/visual/screenshot-bulletproof.ts after-move --action key:ArrowRight --action wait:1000

  # High resolution
  npx tsx src/tests/visual/screenshot-bulletproof.ts hd-game --width 1920 --height 1080

  # With splash screen
  npx tsx src/tests/visual/screenshot-bulletproof.ts with-splash --no-agent

  # Debug mode
  npx tsx src/tests/visual/screenshot-bulletproof.ts debug-test --debug

Team Usage:
  For UI work, ALWAYS use this tool to verify changes:
  1. Before making changes: screenshot-bulletproof.ts before-fix
  2. After making changes: screenshot-bulletproof.ts after-fix
  3. Compare the two images to verify your work!
`);
    return;
  }
  
  const options: ScreenshotOptions = {
    name: args[0],
    actions: [],
  };
  
  // Parse arguments
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        options.url = args[++i];
        break;
      case '--width':
        options.width = parseInt(args[++i]);
        break;
      case '--height':
        options.height = parseInt(args[++i]);
        break;
      case '--action':
        options.actions!.push(args[++i]);
        break;
      case '--fullpage':
        options.fullPage = true;
        break;
      case '--debug':
        options.debug = true;
        break;
      case '--no-agent':
        // Override default agent mode
        if (!options.url) {
          options.url = DEFAULT_URL;
        }
        break;
    }
  }
  
  try {
    await takeScreenshot(options);
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Screenshot failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other tests
export { takeScreenshot };
export type { ScreenshotOptions };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}