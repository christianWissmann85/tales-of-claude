#!/usr/bin/env tsx
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Simple automated playtest that agents can run
const TARGET_URL = 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, 'playtest-results');

interface PlaytestResult {
  timestamp: string;
  duration: number;
  steps: StepResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

interface StepResult {
  name: string;
  action: string;
  success: boolean;
  screenshot?: string;
  error?: string;
  observations?: string[];
}

// Basic playtest sequence
const PLAYTEST_STEPS = [
  {
    name: 'Game loads successfully',
    action: 'Navigate to game',
    execute: async (page: Page) => {
      await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.gameBoard', { timeout: 10000 });
    },
    observe: async (page: Page) => {
      const observations = [];
      
      // Check if game board is visible
      const gameBoard = await page.$('.gameBoard');
      if (gameBoard) observations.push('Game board is visible');
      
      // Check for player sprite
      const player = await page.$('.game-cell:has-text("🤖")');
      if (player) observations.push('Player character (🤖) is visible');
      
      return observations;
    }
  },
  {
    name: 'Player can move',
    action: 'Press arrow keys',
    execute: async (page: Page) => {
      // Try to move in each direction
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(200);
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(200);
    },
    observe: async (page: Page) => {
      const observations = [];
      observations.push('Movement keys pressed successfully');
      
      // Check if player is still visible
      const player = await page.$('.game-cell:has-text("🤖")');
      if (player) observations.push('Player still visible after movement');
      
      return observations;
    }
  },
  {
    name: 'Inventory opens',
    action: 'Press I key',
    execute: async (page: Page) => {
      await page.keyboard.press('i');
      await page.waitForTimeout(500);
    },
    observe: async (page: Page) => {
      const observations = [];
      
      // Check for inventory panel
      const inventory = await page.$('[data-testid="inventory"]');
      if (inventory) {
        observations.push('Inventory panel opened');
        
        // Check for inventory items
        const items = await page.$$('[data-testid="inventory-item"]');
        observations.push(`Found ${items.length} items in inventory`);
      } else {
        observations.push('Inventory panel not found');
      }
      
      return observations;
    }
  },
  {
    name: 'Quest journal opens',
    action: 'Press J key',
    execute: async (page: Page) => {
      // Close inventory first
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      
      await page.keyboard.press('j');
      await page.waitForTimeout(500);
    },
    observe: async (page: Page) => {
      const observations = [];
      
      // Check for quest panel
      const questPanel = await page.$('[data-testid="quest-journal"]');
      if (questPanel) {
        observations.push('Quest journal opened');
        
        // Check for quests
        const quests = await page.$$('[data-testid="quest-item"]');
        observations.push(`Found ${quests.length} quests`);
      } else {
        observations.push('Quest journal not found');
      }
      
      return observations;
    }
  },
  {
    name: 'NPC interaction',
    action: 'Find and click NPC',
    execute: async (page: Page) => {
      // Close any open panels
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      
      // Find an NPC
      const npc = await page.$('[data-entity-type="npc"]');
      if (npc) {
        await npc.click();
        await page.waitForTimeout(500);
      } else {
        throw new Error('No NPC found on screen');
      }
    },
    observe: async (page: Page) => {
      const observations = [];
      
      // Check for dialogue
      const dialogue = await page.$('[data-testid="dialogue-box"]');
      if (dialogue) {
        observations.push('Dialogue box appeared');
        
        // Check dialogue content
        const text = await dialogue.textContent();
        if (text) observations.push(`Dialogue text length: ${text.length} characters`);
      } else {
        observations.push('No dialogue box found');
      }
      
      return observations;
    }
  }
];

async function ensureResultsDir(): Promise<void> {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

async function takeScreenshot(page: Page, stepName: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${stepName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.png`;
  const filepath = path.join(RESULTS_DIR, filename);
  
  await page.screenshot({ path: filepath, fullPage: false });
  return filepath;
}

async function runPlaytest(): Promise<PlaytestResult> {
  const startTime = Date.now();
  const result: PlaytestResult = {
    timestamp: new Date().toISOString(),
    duration: 0,
    steps: [],
    summary: { total: 0, passed: 0, failed: 0 }
  };

  let browser: Browser | null = null;

  try {
    await ensureResultsDir();
    
    console.log('🎮 Starting automated playtest...\n');
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 }
    });

    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Run each test step
    for (const step of PLAYTEST_STEPS) {
      console.log(`📋 ${step.name}...`);
      const stepResult: StepResult = {
        name: step.name,
        action: step.action,
        success: false
      };

      try {
        // Execute the step
        await step.execute(page);
        
        // Make observations
        if (step.observe) {
          stepResult.observations = await step.observe(page);
        }
        
        // Take screenshot
        stepResult.screenshot = await takeScreenshot(page, step.name);
        
        stepResult.success = true;
        console.log(`   ✅ Success`);
        if (stepResult.observations) {
          stepResult.observations.forEach(obs => console.log(`      - ${obs}`));
        }
        
      } catch (error: any) {
        stepResult.success = false;
        stepResult.error = error.message;
        console.log(`   ❌ Failed: ${error.message}`);
        
        // Still try to take a screenshot
        try {
          stepResult.screenshot = await takeScreenshot(page, `${step.name}-error`);
        } catch {}
      }

      result.steps.push(stepResult);
    }

    // Check for console errors
    if (consoleErrors.length > 0) {
      console.log('\n⚠️  Console errors detected:');
      consoleErrors.forEach(err => console.log(`   - ${err}`));
    }

  } catch (error: any) {
    console.error('💥 Fatal error:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Calculate summary
  result.duration = Date.now() - startTime;
  result.summary.total = result.steps.length;
  result.summary.passed = result.steps.filter(s => s.success).length;
  result.summary.failed = result.steps.filter(s => !s.success).length;

  return result;
}

async function generateReport(result: PlaytestResult): Promise<void> {
  const reportPath = path.join(RESULTS_DIR, 'playtest-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  
  console.log('\n📊 Playtest Report:');
  console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);
  console.log(`   Total steps: ${result.summary.total}`);
  console.log(`   Passed: ${result.summary.passed}`);
  console.log(`   Failed: ${result.summary.failed}`);
  console.log(`\n   Full report: ${reportPath}`);
  console.log(`   Screenshots: ${RESULTS_DIR}/`);
}

// Main execution
async function main() {
  try {
    const result = await runPlaytest();
    await generateReport(result);
    
    if (result.summary.failed > 0) {
      console.log('\n❌ Playtest completed with failures');
      process.exit(1);
    } else {
      console.log('\n✅ All playtest steps passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n💥 Playtest failed to complete');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runPlaytest };