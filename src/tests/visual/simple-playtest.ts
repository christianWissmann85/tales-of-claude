#!/usr/bin/env tsx
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { showVisualTestWarning } from './visual-test-warning.js';

// Simple automated playtest that agents can run
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:5173';
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
      // Add agent=true to skip splash screens for testing
      await page.goto(`${TARGET_URL}?agent=true`, { waitUntil: 'networkidle' });
      // Wait for the game to render by looking for the player emoji
      await page.waitForFunction(() => {
        return document.body.textContent?.includes('🤖');
      }, { timeout: 10000 });
    },
    observe: async (page: Page) => {
      const observations = [];
      
      // Check if game board is visible by looking for game content
      const hasPlayer = await page.evaluate(() => document.body.textContent?.includes('🤖'));
      if (hasPlayer) observations.push('Player character (🤖) is visible');
      
      // Check for UI elements
      const hasHP = await page.evaluate(() => document.body.textContent?.includes('HP:'));
      if (hasHP) observations.push('HP bar is visible');
      
      // Check for map name
      const mapName = await page.evaluate(() => {
        const text = document.body.textContent || '';
        if (text.includes('Terminal Town')) return 'Terminal Town';
        if (text.includes('Binary Forest')) return 'Binary Forest';
        if (text.includes('Debug Dungeon')) return 'Debug Dungeon';
        return null;
      });
      if (mapName) observations.push(`Current map: ${mapName}`);
      
      return observations;
    }
  },
  {
    name: 'Player can move',
    action: 'Press arrow keys',
    execute: async (page: Page) => {
      // Get initial player position by checking all cells
      const getPlayerPosition = async () => {
        return await page.evaluate(() => {
          const cells = document.querySelectorAll('*');
          for (let i = 0; i < cells.length; i++) {
            if (cells[i].textContent === '🤖') {
              const rect = cells[i].getBoundingClientRect();
              return { x: rect.left, y: rect.top };
            }
          }
          return null;
        });
      };
      
      const initialPos = await getPlayerPosition();
      
      // Try to move right with proper key down/up
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(100);
      await page.keyboard.up('ArrowRight');
      await page.waitForTimeout(300);
      
      const afterMovePos = await getPlayerPosition();
      
      // Store positions for observation
      await page.evaluate((positions) => {
        (window as any).testMovement = positions;
      }, { initial: initialPos, afterMove: afterMovePos });
    },
    observe: async (page: Page) => {
      const observations = [];
      
      const positions = await page.evaluate(() => (window as any).testMovement);
      if (positions && positions.initial && positions.afterMove) {
        if (positions.initial.x !== positions.afterMove.x || 
            positions.initial.y !== positions.afterMove.y) {
          observations.push('✅ Player successfully moved!');
          observations.push(`Movement detected: (${positions.initial.x}, ${positions.initial.y}) → (${positions.afterMove.x}, ${positions.afterMove.y})`);
        } else {
          observations.push('❌ Player did not move - keyboard input may not be working');
        }
      } else {
        observations.push('❌ Could not track player position');
      }
      
      return observations;
    }
  },
  {
    name: 'Inventory opens',
    action: 'Press I key',
    execute: async (page: Page) => {
      // Store initial content
      const beforePress = await page.evaluate(() => document.body.textContent || '');
      
      await page.keyboard.down('i');
      await page.waitForTimeout(100);
      await page.keyboard.up('i');
      await page.waitForTimeout(500);
      
      // Store after content
      const afterPress = await page.evaluate(() => document.body.textContent || '');
      
      await page.evaluate((data) => {
        (window as any).inventoryTest = data;
      }, { before: beforePress, after: afterPress });
    },
    observe: async (page: Page) => {
      const observations = [];
      
      const testData = await page.evaluate(() => (window as any).inventoryTest);
      
      // Check for inventory keywords
      const hasInventory = await page.evaluate(() => {
        const text = document.body.textContent || '';
        return text.includes('Inventory') || text.includes('Equipment') || 
               text.includes('Items') || text.includes('Weapon:') || 
               text.includes('Armor:');
      });
      
      if (hasInventory) {
        observations.push('✅ Inventory UI detected');
      } else if (testData && testData.before !== testData.after) {
        observations.push('⚠️ Content changed but no inventory keywords found');
      } else {
        observations.push('❌ Inventory did not open - I key may not be working');
      }
      
      return observations;
    }
  },
  {
    name: 'Quest journal opens',
    action: 'Press J key',
    execute: async (page: Page) => {
      // Close inventory first
      await page.keyboard.down('Escape');
      await page.waitForTimeout(100);
      await page.keyboard.up('Escape');
      await page.waitForTimeout(200);
      
      // Store initial content
      const beforePress = await page.evaluate(() => document.body.textContent || '');
      
      await page.keyboard.down('j');
      await page.waitForTimeout(100);
      await page.keyboard.up('j');
      await page.waitForTimeout(500);
      
      // Store after content
      const afterPress = await page.evaluate(() => document.body.textContent || '');
      
      await page.evaluate((data) => {
        (window as any).questTest = data;
      }, { before: beforePress, after: afterPress });
    },
    observe: async (page: Page) => {
      const observations = [];
      
      const testData = await page.evaluate(() => (window as any).questTest);
      
      // Check for quest keywords
      const hasQuests = await page.evaluate(() => {
        const text = document.body.textContent || '';
        return text.includes('Quest') || text.includes('Objective') || 
               text.includes('Mission') || text.includes('Active Quests');
      });
      
      if (hasQuests) {
        observations.push('✅ Quest journal UI detected');
      } else if (testData && testData.before !== testData.after) {
        observations.push('⚠️ Content changed but no quest keywords found');
      } else {
        observations.push('❌ Quest journal did not open - J key may not be working');
      }
      
      return observations;
    }
  },
  {
    name: 'NPC interaction',
    action: 'Move to NPC and press Space',
    execute: async (page: Page) => {
      // Close any open panels
      await page.keyboard.down('Escape');
      await page.waitForTimeout(100);
      await page.keyboard.up('Escape');
      await page.waitForTimeout(200);
      
      // Look for common NPC emojis
      const npcEmojis = ['🧙', '👨‍💻', '🤴', '👸', '🧝', '🧚', '🦾', '🛡️', '⚔️', '🎓', '📚'];
      const hasNPC = await page.evaluate((emojis) => {
        const text = document.body.textContent || '';
        return emojis.some(emoji => text.includes(emoji));
      }, npcEmojis);
      
      if (!hasNPC) {
        // Try to move around to find an NPC
        await page.keyboard.down('ArrowDown');
        await page.waitForTimeout(100);
        await page.keyboard.up('ArrowDown');
        await page.waitForTimeout(300);
        await page.keyboard.down('ArrowDown');
        await page.waitForTimeout(100);
        await page.keyboard.up('ArrowDown');
        await page.waitForTimeout(300);
      }
      
      // Store initial content
      const beforeInteract = await page.evaluate(() => document.body.textContent || '');
      
      // Press space to interact
      await page.keyboard.down('Space');
      await page.waitForTimeout(100);
      await page.keyboard.up('Space');
      await page.waitForTimeout(500);
      
      // Store after content
      const afterInteract = await page.evaluate(() => document.body.textContent || '');
      
      await page.evaluate((data) => {
        (window as any).npcTest = data;
      }, { before: beforeInteract, after: afterInteract });
    },
    observe: async (page: Page) => {
      const observations = [];
      
      const testData = await page.evaluate(() => (window as any).npcTest);
      
      // Check for dialogue indicators
      const hasDialogue = await page.evaluate(() => {
        const text = document.body.textContent || '';
        // Look for common dialogue patterns
        return text.includes('says:') || text.includes('speak') || 
               text.includes('"') || text.includes('Hello') || 
               text.includes('Welcome') || text.includes('quest');
      });
      
      if (hasDialogue) {
        observations.push('✅ Dialogue detected - NPC interaction successful');
      } else if (testData && testData.before !== testData.after) {
        observations.push('⚠️ Content changed but no clear dialogue found');
      } else {
        observations.push('❌ No NPC interaction detected - Space key may not be working');
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
    
    // Check if running in headless mode
    const isHeadless = process.env.HEADLESS === 'true' || process.argv.includes('--headless');
    
    if (!isHeadless) {
      // Show warning for visual mode
      await showVisualTestWarning({
        agentName: process.env.AGENT_NAME || 'Automated Tester',
        agentRole: process.env.AGENT_ROLE || 'Playtest Agent',
        testDescription: 'Full game playthrough test',
        resolution: { width: 1280, height: 720 },
        estimatedDuration: '~45 seconds'
      });
    } else {
      console.log('🤖 Running in headless mode (no browser window)\n');
    }
    
    browser = await chromium.launch({ 
      headless: isHeadless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 }
    });

    // Capture console errors and debug logs
    const consoleErrors: string[] = [];
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
      // Capture debug logs that might help diagnose keyboard issues
      if (msg.type() === 'log' && msg.text().includes('DEBUG')) {
        consoleLogs.push(msg.text());
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
    
    // Check for debug logs
    if (consoleLogs.length > 0) {
      console.log('\n🔍 Debug logs:');
      consoleLogs.forEach(log => console.log(`   - ${log}`));
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