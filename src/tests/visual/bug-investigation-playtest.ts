#!/usr/bin/env tsx
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Bug investigation playtest for Chris's reported issues
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, 'bug-investigation-results');

interface BugTestResult {
  bugName: string;
  description: string;
  reproduced: boolean;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  steps: string[];
  screenshots: string[];
  observations: string[];
  error?: string;
}

// Chris's reported bugs to investigate
const BUG_TESTS = [
  {
    name: 'Binary Forest Claude Disappears',
    description: 'Claude disappears when entering Binary Forest',
    severity: 'Critical' as const,
    test: async (page: Page): Promise<BugTestResult> => {
      const result: BugTestResult = {
        bugName: 'Binary Forest Claude Disappears',
        description: 'Claude disappears when entering Binary Forest',
        reproduced: false,
        severity: 'Critical',
        steps: [],
        screenshots: [],
        observations: []
      };

      try {
        // Step 1: Navigate to Binary Forest from Terminal Town
        result.steps.push('Starting in Terminal Town');
        const initialScreenshot = await takeScreenshot(page, 'binary-forest-bug-1-initial');
        result.screenshots.push(initialScreenshot);

        // Check initial Claude visibility
        const claudeVisibleInitial = await page.evaluate(() => 
          document.body.textContent?.includes('🤖')
        );
        result.observations.push(`Claude visible in Terminal Town: ${claudeVisibleInitial}`);

        // Move to the right edge to find Binary Forest entrance
        result.steps.push('Moving east to find Binary Forest entrance');
        for (let i = 0; i < 20; i++) {
          await page.keyboard.down('ArrowRight');
          await page.waitForTimeout(50);
          await page.keyboard.up('ArrowRight');
          await page.waitForTimeout(100);
          
          // Check if we're in Binary Forest
          const inBinaryForest = await page.evaluate(() => 
            document.body.textContent?.includes('Binary Forest')
          );
          
          if (inBinaryForest) {
            result.steps.push(`Entered Binary Forest after ${i + 1} steps`);
            break;
          }
        }

        // Take screenshot in Binary Forest
        await page.waitForTimeout(500); // Let the map fully load
        const binaryForestScreenshot = await takeScreenshot(page, 'binary-forest-bug-2-in-forest');
        result.screenshots.push(binaryForestScreenshot);

        // Check Claude visibility in Binary Forest
        const claudeVisibleInForest = await page.evaluate(() => 
          document.body.textContent?.includes('🤖')
        );
        const inBinaryForest = await page.evaluate(() => 
          document.body.textContent?.includes('Binary Forest')
        );

        result.observations.push(`In Binary Forest: ${inBinaryForest}`);
        result.observations.push(`Claude visible in Binary Forest: ${claudeVisibleInForest}`);

        if (inBinaryForest && !claudeVisibleInForest) {
          result.reproduced = true;
          result.observations.push('BUG REPRODUCED: Claude disappeared in Binary Forest!');
        }

      } catch (error: any) {
        result.error = error.message;
      }

      return result;
    }
  },
  {
    name: 'Dialogue Not Working',
    description: 'Dialogue system not functioning properly',
    severity: 'High' as const,
    test: async (page: Page): Promise<BugTestResult> => {
      const result: BugTestResult = {
        bugName: 'Dialogue Not Working',
        description: 'Dialogue system not functioning properly',
        reproduced: false,
        severity: 'High',
        steps: [],
        screenshots: [],
        observations: []
      };

      try {
        result.steps.push('Looking for NPCs to interact with');
        
        // Find NPCs by common emojis
        const npcEmojis = ['🧙', '👨‍💻', '🤴', '👸', '🧝', '🧚', '🦾', '🛡️', '⚔️', '🎓', '📚', '🐱'];
        const npcPresent = await page.evaluate((emojis) => {
          const text = document.body.textContent || '';
          return emojis.find(emoji => text.includes(emoji));
        }, npcEmojis);

        if (npcPresent) {
          result.observations.push(`Found NPC: ${npcPresent}`);
          
          // Take pre-interaction screenshot
          const preDialogueScreenshot = await takeScreenshot(page, 'dialogue-bug-1-pre-interaction');
          result.screenshots.push(preDialogueScreenshot);

          // Try multiple interaction methods
          result.steps.push('Attempting Space key interaction');
          await page.keyboard.down('Space');
          await page.waitForTimeout(100);
          await page.keyboard.up('Space');
          await page.waitForTimeout(500);

          // Check for dialogue
          const hasDialogueSpace = await page.evaluate(() => {
            const text = document.body.textContent || '';
            return text.includes('says:') || text.includes('"') || 
                   text.includes('Hello') || text.includes('Welcome');
          });

          if (!hasDialogueSpace) {
            result.steps.push('Space key failed, trying Enter key');
            await page.keyboard.down('Enter');
            await page.waitForTimeout(100);
            await page.keyboard.up('Enter');
            await page.waitForTimeout(500);
          }

          // Check for dialogue again
          const hasDialogue = await page.evaluate(() => {
            const text = document.body.textContent || '';
            return text.includes('says:') || text.includes('"') || 
                   text.includes('Hello') || text.includes('Welcome');
          });

          const postDialogueScreenshot = await takeScreenshot(page, 'dialogue-bug-2-post-interaction');
          result.screenshots.push(postDialogueScreenshot);

          result.observations.push(`Dialogue appeared: ${hasDialogue}`);
          
          if (!hasDialogue) {
            result.reproduced = true;
            result.observations.push('BUG REPRODUCED: No dialogue appeared after NPC interaction!');
          }

          // Test dialogue progression
          if (hasDialogue) {
            result.steps.push('Testing dialogue progression');
            await page.keyboard.down('Space');
            await page.waitForTimeout(100);
            await page.keyboard.up('Space');
            await page.waitForTimeout(300);
            
            const dialogueScreenshot = await takeScreenshot(page, 'dialogue-bug-3-progression');
            result.screenshots.push(dialogueScreenshot);
          }
        } else {
          result.observations.push('No NPCs found to test dialogue');
        }

      } catch (error: any) {
        result.error = error.message;
      }

      return result;
    }
  },
  {
    name: 'Quest Panel Weird Rendering',
    description: 'Quest panel has rendering issues',
    severity: 'Medium' as const,
    test: async (page: Page): Promise<BugTestResult> => {
      const result: BugTestResult = {
        bugName: 'Quest Panel Weird Rendering',
        description: 'Quest panel has rendering issues',
        reproduced: false,
        severity: 'Medium',
        steps: [],
        screenshots: [],
        observations: []
      };

      try {
        result.steps.push('Opening quest journal with J key');
        
        // Take pre-quest screenshot
        const preQuestScreenshot = await takeScreenshot(page, 'quest-panel-bug-1-pre-open');
        result.screenshots.push(preQuestScreenshot);

        // Open quest journal
        await page.keyboard.down('j');
        await page.waitForTimeout(100);
        await page.keyboard.up('j');
        await page.waitForTimeout(500);

        // Take quest panel screenshot
        const questOpenScreenshot = await takeScreenshot(page, 'quest-panel-bug-2-open');
        result.screenshots.push(questOpenScreenshot);

        // Check for rendering issues
        const questPanelInfo = await page.evaluate(() => {
          // Look for quest-related elements
          const elements = Array.from(document.querySelectorAll('*'));
          const questElements = elements.filter(el => 
            el.textContent?.includes('Quest') || 
            el.textContent?.includes('Objective')
          );

          const overlapping: any[] = [];
          const zIndexIssues: any[] = [];
          
          questElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const styles = window.getComputedStyle(el);
            
            // Check for z-index issues
            if (styles.zIndex && parseInt(styles.zIndex) < 0) {
              zIndexIssues.push('Negative z-index detected');
            }
            
            // Check for overlapping
            if (rect.width === 0 || rect.height === 0) {
              overlapping.push('Zero-size element detected');
            }
          });

          return {
            questElementCount: questElements.length,
            issues: [...overlapping, ...zIndexIssues]
          };
        });

        result.observations.push(`Quest elements found: ${questPanelInfo.questElementCount}`);
        if (questPanelInfo.issues.length > 0) {
          result.reproduced = true;
          result.observations.push('BUG REPRODUCED: Quest panel rendering issues detected!');
          questPanelInfo.issues.forEach(issue => result.observations.push(`- ${issue}`));
        }

        // Test closing and reopening
        result.steps.push('Testing quest panel close/reopen');
        await page.keyboard.down('Escape');
        await page.waitForTimeout(100);
        await page.keyboard.up('Escape');
        await page.waitForTimeout(300);
        
        await page.keyboard.down('j');
        await page.waitForTimeout(100);
        await page.keyboard.up('j');
        await page.waitForTimeout(300);

        const questReopenScreenshot = await takeScreenshot(page, 'quest-panel-bug-3-reopen');
        result.screenshots.push(questReopenScreenshot);

      } catch (error: any) {
        result.error = error.message;
      }

      return result;
    }
  },
  {
    name: 'Status Bar Doubled',
    description: 'Status bar appears twice on screen',
    severity: 'Medium' as const,
    test: async (page: Page): Promise<BugTestResult> => {
      const result: BugTestResult = {
        bugName: 'Status Bar Doubled',
        description: 'Status bar appears twice on screen',
        reproduced: false,
        severity: 'Medium',
        steps: [],
        screenshots: [],
        observations: []
      };

      try {
        result.steps.push('Checking for duplicate status bars');
        
        // Take screenshot of current state
        const statusBarScreenshot = await takeScreenshot(page, 'status-bar-bug-1-initial');
        result.screenshots.push(statusBarScreenshot);

        // Check for duplicate HP/MP/status elements
        const statusBarInfo = await page.evaluate(() => {
          const text = document.body.textContent || '';
          const hpMatches = (text.match(/HP:/g) || []).length;
          const mpMatches = (text.match(/MP:/g) || []).length;
          const levelMatches = (text.match(/Level:/g) || []).length;
          const expMatches = (text.match(/EXP:/g) || []).length;

          // Also check for duplicate elements with same content
          const elements = Array.from(document.querySelectorAll('*'));
          const statusElements = elements.filter(el => {
            const content = el.textContent || '';
            return content.includes('HP:') || content.includes('MP:') || 
                   content.includes('Level:') || content.includes('EXP:');
          });

          return {
            hpCount: hpMatches,
            mpCount: mpMatches,
            levelCount: levelMatches,
            expCount: expMatches,
            statusElementCount: statusElements.length
          };
        });

        result.observations.push(`HP indicators: ${statusBarInfo.hpCount}`);
        result.observations.push(`MP indicators: ${statusBarInfo.mpCount}`);
        result.observations.push(`Level indicators: ${statusBarInfo.levelCount}`);
        result.observations.push(`Status elements: ${statusBarInfo.statusElementCount}`);

        if (statusBarInfo.hpCount > 1 || statusBarInfo.mpCount > 1 || 
            statusBarInfo.levelCount > 1 || statusBarInfo.expCount > 1) {
          result.reproduced = true;
          result.observations.push('BUG REPRODUCED: Duplicate status bar elements detected!');
        }

        // Test with UI panels open
        result.steps.push('Testing status bar with inventory open');
        await page.keyboard.down('i');
        await page.waitForTimeout(100);
        await page.keyboard.up('i');
        await page.waitForTimeout(300);

        const statusBarWithUIScreenshot = await takeScreenshot(page, 'status-bar-bug-2-with-ui');
        result.screenshots.push(statusBarWithUIScreenshot);

      } catch (error: any) {
        result.error = error.message;
      }

      return result;
    }
  },
  {
    name: 'Popup Notes Shift Game Up',
    description: 'Popup notifications cause the game view to shift upward',
    severity: 'High' as const,
    test: async (page: Page): Promise<BugTestResult> => {
      const result: BugTestResult = {
        bugName: 'Popup Notes Shift Game Up',
        description: 'Popup notifications cause the game view to shift upward',
        reproduced: false,
        severity: 'High',
        steps: [],
        screenshots: [],
        observations: []
      };

      try {
        result.steps.push('Recording initial game position');
        
        // Get initial game board position
        const initialPosition = await page.evaluate(() => {
          const gameElement = document.querySelector('.game-board') || 
                             document.querySelector('[class*="game"]') ||
                             document.querySelector('main') ||
                             document.body.firstElementChild;
          
          if (gameElement) {
            const rect = gameElement.getBoundingClientRect();
            return { top: rect.top, left: rect.left };
          }
          return null;
        });

        const prePopupScreenshot = await takeScreenshot(page, 'popup-shift-bug-1-initial');
        result.screenshots.push(prePopupScreenshot);

        result.observations.push(`Initial game position: ${JSON.stringify(initialPosition)}`);

        // Trigger actions that might cause popups
        result.steps.push('Triggering potential popup events');
        
        // Try picking up an item (if any)
        await page.keyboard.down('Space');
        await page.waitForTimeout(100);
        await page.keyboard.up('Space');
        await page.waitForTimeout(500);

        // Try opening and closing inventory (might trigger notifications)
        await page.keyboard.down('i');
        await page.waitForTimeout(100);
        await page.keyboard.up('i');
        await page.waitForTimeout(300);
        
        await page.keyboard.down('Escape');
        await page.waitForTimeout(100);
        await page.keyboard.up('Escape');
        await page.waitForTimeout(500);

        // Check for position shift
        const afterPopupPosition = await page.evaluate(() => {
          const gameElement = document.querySelector('.game-board') || 
                             document.querySelector('[class*="game"]') ||
                             document.querySelector('main') ||
                             document.body.firstElementChild;
          
          if (gameElement) {
            const rect = gameElement.getBoundingClientRect();
            return { top: rect.top, left: rect.left };
          }
          return null;
        });

        const postPopupScreenshot = await takeScreenshot(page, 'popup-shift-bug-2-after-popup');
        result.screenshots.push(postPopupScreenshot);

        result.observations.push(`After popup position: ${JSON.stringify(afterPopupPosition)}`);

        if (initialPosition && afterPopupPosition) {
          const shifted = initialPosition.top !== afterPopupPosition.top || 
                         initialPosition.left !== afterPopupPosition.left;
          
          if (shifted) {
            result.reproduced = true;
            result.observations.push('BUG REPRODUCED: Game position shifted after popup!');
            result.observations.push(`Vertical shift: ${afterPopupPosition.top - initialPosition.top}px`);
            result.observations.push(`Horizontal shift: ${afterPopupPosition.left - initialPosition.left}px`);
          }
        }

        // Look for any popup/notification elements
        const popupInfo = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          const popupElements = elements.filter(el => {
            const classes = el.className?.toString() || '';
            const id = el.id || '';
            return classes.includes('popup') || classes.includes('notification') || 
                   classes.includes('toast') || classes.includes('alert') ||
                   id.includes('popup') || id.includes('notification');
          });

          return {
            popupCount: popupElements.length,
            popupClasses: popupElements.map(el => el.className).filter(Boolean)
          };
        });

        result.observations.push(`Popup elements found: ${popupInfo.popupCount}`);
        if (popupInfo.popupClasses.length > 0) {
          result.observations.push(`Popup classes: ${popupInfo.popupClasses.join(', ')}`);
        }

      } catch (error: any) {
        result.error = error.message;
      }

      return result;
    }
  }
];

async function ensureResultsDir(): Promise<void> {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(RESULTS_DIR, filename);
  
  await page.screenshot({ path: filepath, fullPage: false });
  return filepath;
}

async function runBugInvestigation(): Promise<void> {
  const startTime = Date.now();
  const results: BugTestResult[] = [];
  
  let browser: Browser | null = null;

  try {
    await ensureResultsDir();
    
    console.log('🐛 Starting Bug Investigation Playtest...\n');
    console.log('Testing bugs reported by Chris:\n');
    
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    for (const bugTest of BUG_TESTS) {
      console.log(`\n🔍 Testing: ${bugTest.name}`);
      console.log(`   Severity: ${bugTest.severity}`);
      
      const page = await browser.newPage({
        viewport: { width: 1280, height: 720 }
      });

      // Navigate to game with agent flag
      await page.goto(`${TARGET_URL}?agent=true`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => {
        return document.body.textContent?.includes('🤖');
      }, { timeout: 10000 });

      // Run the bug test
      const result = await bugTest.test(page);
      results.push(result);

      // Report results
      console.log(`   Reproduced: ${result.reproduced ? '✅ YES' : '❌ NO'}`);
      if (result.observations.length > 0) {
        console.log('   Observations:');
        result.observations.forEach(obs => console.log(`     - ${obs}`));
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }

      await page.close();
    }

  } catch (error: any) {
    console.error('💥 Fatal error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Generate comprehensive report
  const duration = Date.now() - startTime;
  const report = {
    timestamp: new Date().toISOString(),
    duration,
    bugs: results,
    summary: {
      total: results.length,
      reproduced: results.filter(r => r.reproduced).length,
      notReproduced: results.filter(r => !r.reproduced).length,
      critical: results.filter(r => r.severity === 'Critical' && r.reproduced).length,
      high: results.filter(r => r.severity === 'High' && r.reproduced).length,
      medium: results.filter(r => r.severity === 'Medium' && r.reproduced).length,
      low: results.filter(r => r.severity === 'Low' && r.reproduced).length
    }
  };

  // Save report
  const reportPath = path.join(RESULTS_DIR, 'bug-investigation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 BUG INVESTIGATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
  console.log(`\nBugs Tested: ${report.summary.total}`);
  console.log(`Bugs Reproduced: ${report.summary.reproduced}`);
  console.log(`Bugs Not Reproduced: ${report.summary.notReproduced}`);
  
  console.log('\nBy Severity:');
  console.log(`  Critical: ${report.summary.critical} reproduced`);
  console.log(`  High: ${report.summary.high} reproduced`);
  console.log(`  Medium: ${report.summary.medium} reproduced`);
  console.log(`  Low: ${report.summary.low} reproduced`);

  console.log('\nReproduced Bugs:');
  results.filter(r => r.reproduced).forEach(bug => {
    console.log(`  - ${bug.bugName} (${bug.severity})`);
  });

  console.log(`\nFull report: ${reportPath}`);
  console.log(`Screenshots: ${RESULTS_DIR}/`);
}

// Main execution
async function main() {
  try {
    await runBugInvestigation();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Bug investigation failed');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runBugInvestigation };