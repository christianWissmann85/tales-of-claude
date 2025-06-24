#!/usr/bin/env tsx
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Simple screenshot tool for agents to capture game state
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
}

async function ensureTempDir(): Promise<void> {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

async function captureScreenshot(options: ScreenshotOptions = {}): Promise<string> {
  let browser: Browser | null = null;
  
  try {
    await ensureTempDir();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = options.name || `screenshot-${timestamp}`;
    const filepath = path.join(TEMP_DIR, `${filename}.png`);

    console.log('🚀 Launching browser...');
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage({
      viewport: { 
        width: options.width || 1280, 
        height: options.height || 720 
      }
    });

    const targetUrl = options.url || TARGET_URL;
    console.log(`📍 Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    // Wait for game to load - wait for React app to mount
    await page.waitForFunction(() => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    }, { timeout: 30000 });
    
    // Extra wait for agent mode to fully initialize
    if (targetUrl.includes('agent=true') || targetUrl.includes('nosplash=true')) {
      await page.waitForTimeout(3000); // Give agent mode time to skip phases
    } else {
      await page.waitForTimeout(2000); // Normal wait
    }
    console.log('✅ Game loaded');

    // Wait for additional condition if specified
    if (options.waitFor) {
      if (typeof options.waitFor === 'string') {
        console.log(`⏳ Waiting for selector: ${options.waitFor}`);
        await page.waitForSelector(options.waitFor, { timeout: 5000 });
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
          await page.waitForTimeout(300);
        } else if (action.startsWith('click:')) {
          const selector = action.substring(6);
          console.log(`  - Clicking: ${selector}`);
          await page.click(selector);
          await page.waitForTimeout(300);
        } else if (action.startsWith('wait:')) {
          const ms = parseInt(action.substring(5));
          console.log(`  - Waiting: ${ms}ms`);
          await page.waitForTimeout(ms);
        }
      }
    }

    // Capture screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: filepath, 
      fullPage: options.fullPage || false,
      animations: 'disabled'
    });

    console.log(`✅ Screenshot saved: ${filepath}`);
    return filepath;

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Command-line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
🎮 Tales of Claude - Screenshot Tool

Usage:
  npx tsx screenshot-tool.ts [options]

Options:
  --name <name>      Name for the screenshot file
  --full-page        Capture full page (default: viewport only)
  --wait <selector>  Wait for CSS selector before screenshot
  --wait-ms <ms>     Wait for milliseconds before screenshot
  --action <action>  Execute action before screenshot
  --width <pixels>   Viewport width (default: 1280)
  --height <pixels>  Viewport height (default: 720)
  --url <url>        Override URL (for agent mode)

Actions:
  key:<key>          Press keyboard key (e.g., key:i for inventory)
  click:<selector>   Click element matching selector
  wait:<ms>          Wait for milliseconds

Examples:
  # Basic screenshot
  npx tsx screenshot-tool.ts

  # Screenshot with inventory open
  npx tsx screenshot-tool.ts --name inventory --action key:i

  # Agent mode - skip splash screens
  npx tsx screenshot-tool.ts --name game-view --url "http://localhost:5173/?agent=true"

  # High resolution agent mode
  npx tsx screenshot-tool.ts --name hd-game --width 1920 --height 1080 --url "http://localhost:5173/?agent=true"

  # Multiple actions
  npx tsx screenshot-tool.ts --action key:Escape --action key:j --name quest-journal
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