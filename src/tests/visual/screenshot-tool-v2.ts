#!/usr/bin/env tsx
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Improved screenshot tool with better error handling and reliability
const TARGET_URL = 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, 'temp');

interface ScreenshotOptions {
  name?: string;
  fullPage?: boolean;
  waitFor?: string | number;
  actions?: string[]; // Series of keyboard/mouse actions
  width?: number;    // Custom viewport width
  height?: number;   // Custom viewport height
  url?: string;      // Override URL (for agent mode)
  debug?: boolean;   // Enable debug mode
}

async function ensureTempDir(): Promise<void> {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

async function waitForGameReady(page: Page, debug: boolean = false): Promise<void> {
  if (debug) console.log('🔍 Debug: Waiting for game to be ready...');
  
  // Strategy 1: Wait for root element with content
  try {
    await page.waitForFunction(() => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    }, { timeout: 20000 });
    if (debug) console.log('✅ Debug: Root element found with children');
  } catch (e) {
    if (debug) console.log('⚠️ Debug: Root element check timed out, trying alternative...');
  }
  
  // Strategy 2: Wait for game-specific element (more reliable)
  try {
    // Try to find game board or any game-specific element
    await page.waitForSelector('.game-board, .splash-screen, .game-container, [class*="GameBoard"], [class*="SplashScreen"]', { 
      timeout: 20000,
      state: 'visible'
    });
    if (debug) console.log('✅ Debug: Game-specific element found');
  } catch (e) {
    if (debug) console.log('⚠️ Debug: Game element check failed, continuing anyway...');
  }
  
  // Strategy 3: Check for any visible content
  try {
    await page.waitForFunction(() => {
      const body = document.body;
      return body && body.innerText && body.innerText.trim().length > 0;
    }, { timeout: 10000 });
    if (debug) console.log('✅ Debug: Page has visible text content');
  } catch (e) {
    if (debug) console.log('⚠️ Debug: Text content check failed');
  }
}

async function captureScreenshot(options: ScreenshotOptions = {}): Promise<string> {
  let browser: Browser | null = null;
  let attempt = 1;
  const maxAttempts = 2;
  
  while (attempt <= maxAttempts) {
    try {
      console.log(`\n📷 Screenshot attempt ${attempt}/${maxAttempts}`);
      await ensureTempDir();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = options.name || `screenshot-${timestamp}`;
      const filepath = path.join(TEMP_DIR, `${filename}.png`);

      console.log('🚀 Launching browser...');
      browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
      });
      
      const page = await browser.newPage({
        viewport: { 
          width: options.width || 1280, 
          height: options.height || 720 
        }
      });

      // Set a reasonable default timeout for all operations
      page.setDefaultTimeout(45000);

      const targetUrl = options.url || TARGET_URL;
      console.log(`📍 Navigating to ${targetUrl}...`);
      
      // Navigate with retry logic
      let navigationSuccess = false;
      let navRetries = 3;
      
      while (!navigationSuccess && navRetries > 0) {
        try {
          await page.goto(targetUrl, { 
            waitUntil: 'domcontentloaded', // Less strict than networkidle
            timeout: 30000
          });
          navigationSuccess = true;
          console.log('✅ Navigation successful');
        } catch (navError: any) {
          navRetries--;
          console.log(`⚠️ Navigation attempt failed, ${navRetries} retries left...`);
          if (navRetries === 0) throw navError;
          await page.waitForTimeout(2000);
        }
      }

      // Wait for game to be ready using multiple strategies
      await waitForGameReady(page, options.debug || false);
      
      // Extra wait for agent mode to fully initialize
      if (targetUrl.includes('agent=true') || targetUrl.includes('nosplash=true')) {
        console.log('🏃 Agent mode detected - waiting for auto-skip...');
        await page.waitForTimeout(4000); // Slightly less wait since we have better checks
      } else {
        console.log('⏳ Standard mode - waiting for initialization...');
        await page.waitForTimeout(2000);
      }
      console.log('✅ Game should be loaded');

      // Wait for additional condition if specified
      if (options.waitFor) {
        if (typeof options.waitFor === 'string') {
          console.log(`⏳ Waiting for selector: ${options.waitFor}`);
          try {
            await page.waitForSelector(options.waitFor, { timeout: 10000 });
          } catch (e) {
            console.log('⚠️ Selector not found, continuing anyway...');
          }
        } else {
          console.log(`⏳ Waiting ${options.waitFor}ms...`);
          await page.waitForTimeout(options.waitFor);
        }
      }

      // Execute actions if specified
      if (options.actions && options.actions.length > 0) {
        console.log('🎮 Executing actions...');
        for (const action of options.actions) {
          if (action.startsWith('key:')) {
            const key = action.substring(4);
            console.log(`  - Pressing key: ${key}`);
            await page.keyboard.press(key);
            await page.waitForTimeout(500); // Slightly longer wait between actions
          } else if (action.startsWith('click:')) {
            const selector = action.substring(6);
            console.log(`  - Clicking: ${selector}`);
            try {
              await page.click(selector, { timeout: 5000 });
            } catch (e) {
              console.log(`  ⚠️ Could not click ${selector}, continuing...`);
            }
            await page.waitForTimeout(500);
          } else if (action.startsWith('wait:')) {
            const ms = parseInt(action.substring(5));
            console.log(`  - Waiting: ${ms}ms`);
            await page.waitForTimeout(ms);
          } else if (action.startsWith('hover:')) {
            const selector = action.substring(6);
            console.log(`  - Hovering over: ${selector}`);
            try {
              await page.hover(selector, { timeout: 5000 });
            } catch (e) {
              console.log(`  ⚠️ Could not hover over ${selector}, continuing...`);
            }
            await page.waitForTimeout(500);
          }
        }
      }

      // Final stabilization wait
      await page.waitForTimeout(1000);

      // Capture screenshot
      console.log('📸 Taking screenshot...');
      await page.screenshot({ 
        path: filepath, 
        fullPage: options.fullPage || false,
        animations: 'disabled'
      });

      console.log(`✅ Screenshot saved: ${filepath}`);
      
      if (browser) {
        await browser.close();
      }
      
      return filepath;

    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (browser) {
        await browser.close();
        browser = null;
      }
      
      if (attempt === maxAttempts) {
        console.error('\n💥 All screenshot attempts failed!');
        console.error('\n🔧 Troubleshooting tips:');
        console.error('1. Make sure dev server is running: npm run dev');
        console.error('2. Check http://localhost:5173 in your browser');
        console.error('3. Try with --debug flag for more info');
        console.error('4. For agent mode, use: --url "http://localhost:5173/?agent=true"');
        throw error;
      }
      
      attempt++;
      console.log('🔄 Retrying...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // This should never be reached
  throw new Error('Screenshot failed after all attempts');
}

// Command-line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
🎮 Tales of Claude - Screenshot Tool v2 (Improved)

Usage:
  npx tsx screenshot-tool-v2.ts [options]

Options:
  --name <name>      Name for the screenshot file
  --full-page        Capture full page (default: viewport only)
  --wait <selector>  Wait for CSS selector before screenshot
  --wait-ms <ms>     Wait for milliseconds before screenshot
  --action <action>  Execute action before screenshot (can use multiple)
  --width <pixels>   Viewport width (default: 1280)
  --height <pixels>  Viewport height (default: 720)
  --url <url>        Override URL (for agent mode)
  --debug            Enable debug output

Actions:
  key:<key>          Press keyboard key (e.g., key:i for inventory)
  click:<selector>   Click element matching selector
  hover:<selector>   Hover over element
  wait:<ms>          Wait for milliseconds

Examples:
  # Basic screenshot
  npx tsx screenshot-tool-v2.ts

  # Screenshot with inventory open
  npx tsx screenshot-tool-v2.ts --name inventory --action key:i

  # Agent mode - skip splash screens (RECOMMENDED)
  npx tsx screenshot-tool-v2.ts --name game-view --url "http://localhost:5173/?agent=true"

  # High resolution agent mode
  npx tsx screenshot-tool-v2.ts --name hd-game --width 1920 --height 1080 --url "http://localhost:5173/?agent=true"

  # Multiple actions
  npx tsx screenshot-tool-v2.ts --action key:Escape --action key:j --name quest-journal

  # Debug mode for troubleshooting
  npx tsx screenshot-tool-v2.ts --debug --url "http://localhost:5173/?agent=true"

Troubleshooting:
  - Always use agent mode URL for reliable screenshots
  - Increase wait times if elements aren't ready
  - Use --debug to see what's happening
  - Check that dev server is running on port 5173
`);
    return;
  }

  const options: ScreenshotOptions = {
    actions: []
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--name':
        options.name = args[++i];
        break;
      case '--full-page':
        options.fullPage = true;
        break;
      case '--wait':
        options.waitFor = args[++i];
        break;
      case '--wait-ms':
        options.waitFor = parseInt(args[++i]);
        break;
      case '--action':
        options.actions!.push(args[++i]);
        break;
      case '--width':
        options.width = parseInt(args[++i]);
        break;
      case '--height':
        options.height = parseInt(args[++i]);
        break;
      case '--url':
        options.url = args[++i];
        break;
      case '--debug':
        options.debug = true;
        break;
    }
  }

  try {
    const filepath = await captureScreenshot(options);
    console.log('\n🎉 Success! Screenshot available at:');
    console.log(`   ${filepath}`);
  } catch (error) {
    console.error('\n💥 Screenshot failed!');
    process.exit(1);
  }
}

// Export for use in other scripts
export { captureScreenshot };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}