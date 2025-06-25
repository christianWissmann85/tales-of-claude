import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Configuration
const TARGET_URL = 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VISUAL_TEST_DIR = path.join(__dirname);
const BASELINE_DIR = path.join(VISUAL_TEST_DIR, 'baselines');
const SCREENSHOT_DIR = path.join(VISUAL_TEST_DIR, 'screenshots');
const DIFF_DIR = path.join(VISUAL_TEST_DIR, 'diffs');
const REPORT_FILE = path.join(VISUAL_TEST_DIR, 'visual-test-report.html');

// Test scenarios
interface TestScenario {
  name: string;
  description: string;
  action?: (page: Page) => Promise<void>;
  waitFor?: string | number; // CSS selector or milliseconds to wait
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'initial-load',
    description: 'Initial game load state',
    waitFor: '.gameBoard',
  },
  {
    name: 'main-menu',
    description: 'Main menu display',
    waitFor: 1000,
  },
  {
    name: 'game-board-town',
    description: 'Terminal Town map view',
    action: async (page) => {
      // Wait for game to fully load
      await page.waitForSelector('.gameBoard', { timeout: 5000 });
    },
  },
  {
    name: 'inventory-open',
    description: 'Inventory panel opened',
    action: async (page) => {
      await page.keyboard.press('i');
      await page.waitForTimeout(500);
    },
  },
  {
    name: 'quest-journal',
    description: 'Quest journal view',
    action: async (page) => {
      await page.keyboard.press('j');
      await page.waitForTimeout(500);
    },
  },
  {
    name: 'dialogue-npc',
    description: 'NPC dialogue interaction',
    action: async (page) => {
      // Close any open panels first
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      
      // Find and click on an NPC (assuming they have a specific class)
      const npc = await page.$('[data-entity-type="npc"]');
      if (npc) {
        await npc.click();
        await page.waitForTimeout(500);
      }
    },
  },
];

// Utility functions
async function ensureDirectories(): Promise<void> {
  [BASELINE_DIR, SCREENSHOT_DIR, DIFF_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

async function takeScreenshot(page: Page, name: string, isBaseline: boolean = false): Promise<string> {
  const dir = isBaseline ? BASELINE_DIR : SCREENSHOT_DIR;
  const filePath = path.join(dir, `${name}.png`);
  
  await page.screenshot({ 
    path: filePath, 
    fullPage: false, // Focus on viewport for consistency
    animations: 'disabled', // Disable animations for stable screenshots
  });
  
  return filePath;
}

async function compareImages(baseline: string, current: string, diff: string): Promise<number> {
  try {
    // Use pixelmatch via npx for image comparison
    const command = `npx pixelmatch "${baseline}" "${current}" "${diff}" --threshold 0.1`;
    const result = execSync(command, { encoding: 'utf8' });
    return parseInt(result) || 0;
  } catch (error: any) {
    // pixelmatch returns non-zero exit code when differences found
    if (error.stdout) {
      return parseInt(error.stdout) || -1;
    }
    throw error;
  }
}

interface TestResult {
  scenario: string;
  description: string;
  baseline: string;
  current: string;
  diff?: string;
  pixelDifference: number;
  passed: boolean;
  error?: string;
}

async function runVisualTests(updateBaselines: boolean = false): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let browser: Browser | null = null;

  try {
    await ensureDirectories();
    
    console.log('🚀 Starting visual tests...');
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    });

    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });

    console.log(`📍 Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

    // Run each test scenario
    for (const scenario of TEST_SCENARIOS) {
      console.log(`📸 Testing: ${scenario.name} - ${scenario.description}`);
      
      try {
        // Execute scenario action if defined
        if (scenario.action) {
          await scenario.action(page);
        }

        // Wait for specified condition
        if (scenario.waitFor) {
          if (typeof scenario.waitFor === 'string') {
            await page.waitForSelector(scenario.waitFor, { timeout: 5000 });
          } else {
            await page.waitForTimeout(scenario.waitFor);
          }
        }

        // Take screenshot
        const screenshotPath = await takeScreenshot(page, scenario.name, false);
        const baselinePath = path.join(BASELINE_DIR, `${scenario.name}.png`);

        if (updateBaselines || !fs.existsSync(baselinePath)) {
          // Create or update baseline
          fs.copyFileSync(screenshotPath, baselinePath);
          console.log(`  ✅ Baseline ${updateBaselines ? 'updated' : 'created'} for ${scenario.name}`);
          
          results.push({
            scenario: scenario.name,
            description: scenario.description,
            baseline: baselinePath,
            current: screenshotPath,
            pixelDifference: 0,
            passed: true,
          });
        } else {
          // Compare with baseline
          const diffPath = path.join(DIFF_DIR, `${scenario.name}-diff.png`);
          const pixelDiff = await compareImages(baselinePath, screenshotPath, diffPath);
          
          const passed = pixelDiff === 0;
          console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'} - ${pixelDiff} pixels different`);

          results.push({
            scenario: scenario.name,
            description: scenario.description,
            baseline: baselinePath,
            current: screenshotPath,
            diff: passed ? undefined : diffPath,
            pixelDifference: pixelDiff,
            passed,
          });
        }

        // Reset state between tests
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);

      } catch (error: any) {
        console.error(`  ❌ ERROR in ${scenario.name}: ${error.message}`);
        results.push({
          scenario: scenario.name,
          description: scenario.description,
          baseline: path.join(BASELINE_DIR, `${scenario.name}.png`),
          current: path.join(SCREENSHOT_DIR, `${scenario.name}.png`),
          pixelDifference: -1,
          passed: false,
          error: error.message,
        });
      }
    }

  } catch (error: any) {
    console.error('Fatal error during visual tests:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return results;
}

async function generateHTMLReport(results: TestResult[]): Promise<void> {
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const timestamp = new Date().toLocaleString();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Test Report - Tales of Claude</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 30px;
        }
        h1 {
            color: #2d3748;
            margin-bottom: 10px;
        }
        .summary {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f7fafc;
            border-radius: 6px;
        }
        .summary-item {
            flex: 1;
            text-align: center;
        }
        .summary-item .count {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .passed { color: #48bb78; }
        .failed { color: #f56565; }
        .total { color: #4299e1; }
        
        .test-result {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            background: #fff;
        }
        .test-result.failed {
            border-color: #feb2b2;
            background: #fff5f5;
        }
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .test-name {
            font-size: 1.2em;
            font-weight: bold;
        }
        .test-status {
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.9em;
        }
        .status-passed {
            background: #c6f6d5;
            color: #22543d;
        }
        .status-failed {
            background: #fed7d7;
            color: #742a2a;
        }
        .test-description {
            color: #718096;
            margin-bottom: 10px;
        }
        .pixel-diff {
            color: #e53e3e;
            font-weight: bold;
        }
        .images {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 15px;
        }
        .image-container {
            text-align: center;
        }
        .image-container img {
            max-width: 100%;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .image-container img:hover {
            transform: scale(1.02);
        }
        .image-label {
            margin-top: 5px;
            font-weight: bold;
            color: #4a5568;
        }
        .actions {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        .button {
            display: inline-block;
            padding: 8px 16px;
            margin-right: 10px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
            cursor: pointer;
            border: none;
            font-size: 14px;
        }
        .button-approve {
            background: #48bb78;
            color: white;
        }
        .button-approve:hover {
            background: #38a169;
        }
        .button-reject {
            background: #f56565;
            color: white;
        }
        .button-reject:hover {
            background: #e53e3e;
        }
        .timestamp {
            color: #718096;
            font-size: 0.9em;
        }
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.9);
        }
        .modal-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            max-width: 90%;
            max-height: 90%;
        }
        .modal-content img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .close {
            position: absolute;
            top: 20px;
            right: 40px;
            color: #f1f1f1;
            font-size: 40px;
            font-weight: bold;
            cursor: pointer;
        }
        .close:hover {
            color: #bbb;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Visual Test Report - Tales of Claude</h1>
        <p class="timestamp">Generated: ${timestamp}</p>
        
        <div class="summary">
            <div class="summary-item">
                <div class="count total">${results.length}</div>
                <div>Total Tests</div>
            </div>
            <div class="summary-item">
                <div class="count passed">${passedCount}</div>
                <div>Passed</div>
            </div>
            <div class="summary-item">
                <div class="count failed">${failedCount}</div>
                <div>Failed</div>
            </div>
        </div>

        ${results.map(result => `
            <div class="test-result ${result.passed ? '' : 'failed'}">
                <div class="test-header">
                    <div>
                        <div class="test-name">${result.scenario}</div>
                        <div class="test-description">${result.description}</div>
                        ${!result.passed && result.pixelDifference > 0 ? 
                            `<div class="pixel-diff">${result.pixelDifference} pixels different</div>` : ''}
                        ${result.error ? `<div class="pixel-diff">Error: ${result.error}</div>` : ''}
                    </div>
                    <div class="test-status ${result.passed ? 'status-passed' : 'status-failed'}">
                        ${result.passed ? 'PASSED' : 'FAILED'}
                    </div>
                </div>
                
                <div class="images">
                    <div class="image-container">
                        <img src="${path.relative(VISUAL_TEST_DIR, result.baseline)}" 
                             alt="Baseline" 
                             onclick="openModal(this.src)">
                        <div class="image-label">Baseline</div>
                    </div>
                    <div class="image-container">
                        <img src="${path.relative(VISUAL_TEST_DIR, result.current)}" 
                             alt="Current" 
                             onclick="openModal(this.src)">
                        <div class="image-label">Current</div>
                    </div>
                    ${result.diff ? `
                        <div class="image-container">
                            <img src="${path.relative(VISUAL_TEST_DIR, result.diff)}" 
                                 alt="Difference" 
                                 onclick="openModal(this.src)">
                            <div class="image-label">Difference</div>
                        </div>
                    ` : ''}
                </div>
                
                ${!result.passed ? `
                    <div class="actions">
                        <button class="button button-approve" 
                                onclick="approveChange('${result.scenario}')">
                            ✅ Approve Change
                        </button>
                        <button class="button button-reject">
                            ❌ Reject (Fix Required)
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>

    <div id="imageModal" class="modal" onclick="closeModal()">
        <span class="close">&times;</span>
        <div class="modal-content">
            <img id="modalImg" src="">
        </div>
    </div>

    <script>
        function openModal(src) {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImg');
            modal.style.display = 'block';
            modalImg.src = src;
        }

        function closeModal() {
            document.getElementById('imageModal').style.display = 'none';
        }

        function approveChange(scenario) {
            if (confirm('Approve this visual change and update the baseline?')) {
                // In a real implementation, this would call a backend endpoint
                alert('Baseline update approved for: ' + scenario + '\\n\\nRun: npm run visual-test:update');
            }
        }

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    </script>
</body>
</html>`;

  fs.writeFileSync(REPORT_FILE, html);
  console.log(`\n📊 Report generated: ${REPORT_FILE}`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const updateBaselines = args.includes('--update-baselines');

  try {
    console.log('🎮 Tales of Claude - Visual Testing Framework');
    console.log('============================================\n');

    if (updateBaselines) {
      console.log('⚠️  Running in UPDATE BASELINES mode\n');
    }

    const results = await runVisualTests(updateBaselines);
    await generateHTMLReport(results);

    const failedTests = results.filter(r => !r.passed);
    
    console.log('\n📈 Summary:');
    console.log(`   Total: ${results.length}`);
    console.log(`   Passed: ${results.length - failedTests.length}`);
    console.log(`   Failed: ${failedTests.length}`);

    if (failedTests.length > 0) {
      console.log('\n❌ Failed tests:');
      failedTests.forEach(test => {
        console.log(`   - ${test.scenario}: ${test.pixelDifference} pixels different`);
      });
      process.exit(1);
    } else {
      console.log('\n✅ All visual tests passed!');
      process.exit(0);
    }

  } catch (error: any) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runVisualTests, generateHTMLReport };