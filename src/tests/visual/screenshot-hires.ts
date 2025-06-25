#!/usr/bin/env tsx
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Enhanced screenshot tool with high-resolution support
const TARGET_URL = 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, 'temp');

interface ScreenshotOptions {
  name?: string;
  fullPage?: boolean;
  waitFor?: string | number;
  action?: string; // Single action string with comma-separated commands
  width?: number;
  height?: number;
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
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage({
      viewport: { 
        width: options.width || 1024, 
        height: options.height || 768, 
      },
    });

    console.log(`📍 Navigating to ${TARGET_URL}...`);
    console.log(`📐 Resolution: ${options.width || 1024}x${options.height || 768}`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

    // Wait for game to load
    await page.waitForFunction(() => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    }, { timeout: 10000 });
    
    await page.waitForTimeout(2000);
    console.log('✅ Game loaded');

    // Execute action sequence if specified
    if (options.action) {
      console.log('🎮 Executing action sequence...');
      const actions = options.action.split(',');
      
      for (const action of actions) {
        const trimmedAction = action.trim();
        
        if (trimmedAction.startsWith('wait:')) {
          const ms = parseInt(trimmedAction.substring(5));
          console.log(`  ⏱️  Waiting ${ms}ms...`);
          await page.waitForTimeout(ms);
        } else if (trimmedAction.startsWith('press:')) {
          const key = trimmedAction.substring(6);
          console.log(`  ⌨️  Pressing ${key}...`);
          await page.keyboard.press(key);
          await page.waitForTimeout(500);
        } else if (trimmedAction.startsWith('click:')) {
          const selector = trimmedAction.substring(6);
          console.log(`  🖱️  Clicking ${selector}...`);
          try {
            await page.click(selector, { timeout: 5000 });
          } catch (e) {
            console.log(`  ⚠️  Could not find selector: ${selector}`);
          }
          await page.waitForTimeout(500);
        }
      }
    }

    // Capture screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: filepath, 
      fullPage: options.fullPage || false,
      animations: 'disabled',
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
🎮 Tales of Claude - High-Res Screenshot Tool

Usage:
  npx tsx screenshot-hires.ts --name <name> --width <width> --height <height> --action "<actions>"

Options:
  --name <name>        Name for the screenshot file
  --width <pixels>     Viewport width (default: 1024)
  --height <pixels>    Viewport height (default: 768)
  --action "<actions>" Comma-separated action sequence

Actions:
  wait:<ms>       Wait for milliseconds
  press:<key>     Press keyboard key (e.g., Enter, Space, i)
  click:<selector> Click element

Examples:
  # Skip splash and opening, then capture game
  npx tsx screenshot-hires.ts --name game-ui --width 1024 --height 768 --action "wait:2000,press:Enter,wait:2000,press:Space,wait:3000"
  
  # Open inventory
  npx tsx screenshot-hires.ts --name inventory --action "press:i,wait:1000"
`);
    return;
  }

  const options: ScreenshotOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--name':
        options.name = args[++i];
        break;
      case '--width':
        options.width = parseInt(args[++i]);
        break;
      case '--height':
        options.height = parseInt(args[++i]);
        break;
      case '--action':
        options.action = args[++i];
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

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}