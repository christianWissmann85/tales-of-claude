#!/usr/bin/env tsx
/**
 * Reliable Screenshot Tool for Tales of Claude
 * 
 * This is a simplified, ultra-reliable version focused on what works.
 * Based on Marcus's testing infrastructure fixes.
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, 'temp');

interface ScreenshotOptions {
  name: string;
  url?: string;
  width?: number;
  height?: number;
  actions?: string[];
  timeout?: number;
}

async function ensureTempDir(): Promise<void> {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

async function takeScreenshot(options: ScreenshotOptions): Promise<string> {
  await ensureTempDir();
  
  const filepath = path.join(TEMP_DIR, `${options.name}.png`);
  const url = options.url || 'http://localhost:5173/?agent=true'; // Default to agent mode
  const width = options.width || 1024;
  const height = options.height || 768;
  const timeout = options.timeout || 60000;
  
  console.log('🚀 Starting reliable screenshot...');
  console.log(`📍 URL: ${url}`);
  console.log(`📐 Size: ${width}x${height}`);
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage({ viewport: { width, height } });
    page.setDefaultTimeout(timeout);
    
    // Simple navigation - just go to the page
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Fixed wait times that work reliably
    if (url.includes('agent=true') || url.includes('nosplash=true')) {
      console.log('⏳ Agent mode: waiting 5 seconds...');
      await page.waitForTimeout(5000);
    } else {
      console.log('⏳ Standard mode: waiting 8 seconds...');
      await page.waitForTimeout(8000);
    }
    
    // Execute any actions
    if (options.actions) {
      for (const action of options.actions) {
        if (action.startsWith('key:')) {
          const key = action.substring(4);
          console.log(`🎮 Pressing ${key}`);
          await page.keyboard.press(key);
          await page.waitForTimeout(1000);
        } else if (action.startsWith('wait:')) {
          const ms = parseInt(action.substring(5));
          console.log(`⏳ Waiting ${ms}ms`);
          await page.waitForTimeout(ms);
        }
      }
    }
    
    // Take the screenshot
    await page.screenshot({ path: filepath, animations: 'disabled' });
    console.log(`✅ Screenshot saved: ${filepath}`);
    
    return filepath;
    
  } finally {
    await browser.close();
  }
}

// Quick CLI
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    console.log(`
🎯 Reliable Screenshot Tool

Usage: npx tsx screenshot-reliable.ts <name> [options]

Options:
  --url <url>     Custom URL (default: agent mode)
  --width <n>     Width (default: 1024)
  --height <n>    Height (default: 768)
  --key <key>     Press a key after load
  --wait <ms>     Additional wait time

Examples:
  # Basic (uses agent mode by default)
  npx tsx screenshot-reliable.ts my-screenshot

  # With custom size
  npx tsx screenshot-reliable.ts hd-view --width 1920 --height 1080

  # Open inventory
  npx tsx screenshot-reliable.ts inventory --key i

  # Multiple actions
  npx tsx screenshot-reliable.ts battle --key ArrowRight --wait 1000 --key Enter
`);
    return;
  }
  
  const options: ScreenshotOptions = {
    name: args[0],
    actions: [],
  };
  
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
      case '--key':
        options.actions!.push(`key:${args[++i]}`);
        break;
      case '--wait':
        options.actions!.push(`wait:${args[++i]}`);
        break;
    }
  }
  
  try {
    await takeScreenshot(options);
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

export { takeScreenshot };

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}