This script leverages Playwright's capabilities to automate browser interactions, capture various outputs, and generate a structured report.

**Before you run:**

1.  **Install Playwright:**
    ```bash
    npm init -y
    npm install playwright @types/node ts-node typescript
    npx playwright install
    ```
2.  **Create a dummy game server (if you don't have one):**
    Save the following as `server.js` in the same directory:
    ```javascript
    const express = require('express');
    const path = require('path');
    const app = express();
    const port = 5174;

    app.use(express.static(path.join(__dirname, 'public')));

    app.listen(port, () => {
        console.log(`Dummy game server running at http://localhost:${port}`);
        console.log(`Serving files from ${path.join(__dirname, 'public')}`);
    });
    ```
    Then create a `public` directory and inside it, an `index.html` file:
    ```html
    <!-- public/index.html -->
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dummy Game</title>
        <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #282c34; color: white; margin: 0; }
            .game-container { text-align: center; background-color: #3a404c; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }
            #game-status { margin-top: 20px; font-size: 1.2em; }
            #test-results { margin-top: 20px; text-align: left; background-color: #21252b; padding: 15px; border-radius: 5px; }
            .test-passed { color: #4CAF50; }
            .test-failed { color: #f44336; }
        </style>
    </head>
    <body>
        <div class="game-container">
            <h1>My Awesome Dummy Game</h1>
            <p>Loading game assets...</p>
            <div id="game-status">Game is loading...</div>
            <div id="test-results"></div>
        </div>

        <script>
            // Simulate game loading
            setTimeout(() => {
                document.getElementById('game-status').innerText = 'Game Loaded! Ready to play.';
                window.gameLoaded = true; // Signal that the game is ready
                console.log('Game has finished loading.');
            }, 3000); // Simulate a 3-second load time

            // Automated tests function
            window.runAutomatedTests = async () => {
                const resultsDiv = document.getElementById('test-results');
                resultsDiv.innerHTML = '<h2>Automated Test Results:</h2>';
                let allTestsPassed = true;
                const tests = [];

                const runTest = (name, func) => {
                    try {
                        func();
                        resultsDiv.innerHTML += `<p class="test-passed">✅ ${name}: Passed</p>`;
                        tests.push({ name, passed: true, message: 'Passed' });
                    } catch (e) {
                        resultsDiv.innerHTML += `<p class="test-failed">❌ ${name}: Failed - ${e.message}</p>`;
                        tests.push({ name, passed: false, message: e.message });
                        allTestsPassed = false;
                    }
                };

                console.log('Running automated tests...');

                runTest('Game status element exists', () => {
                    const status = document.getElementById('game-status');
                    if (!status) throw new Error('Game status element not found');
                });

                runTest('GameLoaded flag is true', () => {
                    if (!window.gameLoaded) throw new Error('window.gameLoaded is not true');
                });

                // Simulate an async test
                await new Promise(resolve => setTimeout(resolve, 500)); // Small delay

                runTest('Basic arithmetic check', () => {
                    if (1 + 1 !== 2) throw new Error('Math is broken!');
                });

                // Simulate a failing test
                runTest('Failing test example', () => {
                    // if (true) throw new Error('This test is designed to fail!');
                });

                console.log('Automated tests finished.');
                return {
                    overallPassed: allTestsPassed,
                    totalTests: tests.length,
                    passedTests: tests.filter(t => t.passed).length,
                    failedTests: tests.filter(t => !t.passed).length,
                    details: tests
                };
            };
        </script>
    </body>
    </html>
    ```
    Install `express` for the dummy server: `npm install express`.
    Start the dummy server: `node server.js`.

3.  **Run the Playwright script:**
    ```bash
    npx ts-node playwright-test-runner.ts
    ```

---

**`playwright-test-runner.ts`**

```typescript
import { chromium, Browser, Page, ConsoleMessage, Request, Response } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration ---
const TARGET_URL = 'http://localhost:5174';
const OUTPUT_DIR = 'test-results';
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, 'screenshots');
const REPORT_FILE = path.join(OUTPUT_DIR, 'report.json');
const HTML_REPORT_FILE = path.join(OUTPUT_DIR, 'report.html');
const NAVIGATION_TIMEOUT = 60000; // 60 seconds for navigation and initial load
const GAME_LOAD_TIMEOUT = 15000; // Additional 15 seconds to wait for game-specific elements/flags

// --- Type Definitions for Report ---
interface AutomatedTestResult {
    overallPassed: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    details: Array<{ name: string; passed: boolean; message: string }>;
}

interface Report {
    timestamp: string;
    url: string;
    status: 'success' | 'failure' | 'error';
    durationMs: number;
    consoleLogs: string[];
    errors: string[];
    automatedTestResults: AutomatedTestResult | null;
    screenshots: string[];
}

// --- Global Report Object ---
let currentReport: Report = {
    timestamp: new Date().toISOString(),
    url: TARGET_URL,
    status: 'error', // Default to error, updated based on execution
    durationMs: 0,
    consoleLogs: [],
    errors: [],
    automatedTestResults: null,
    screenshots: [],
};

// --- Helper Functions ---

/** Ensures a directory exists, creating it if necessary. */
async function ensureDirExists(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

/** Takes a screenshot and adds its path to the report. */
async function takeScreenshot(page: Page, name: string): Promise<void> {
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    try {
        await page.screenshot({ path: filePath, fullPage: true });
        currentReport.screenshots.push(filePath);
        console.log(`Screenshot taken: ${filePath}`);
    } catch (error: any) {
        console.error(`Failed to take screenshot ${name}: ${error.message}`);
        currentReport.errors.push(`Failed to take screenshot ${name}: ${error.message}`);
    }
}

/** Generates and saves the JSON and HTML reports. */
async function generateReport(): Promise<void> {
    // Save JSON report
    fs.writeFileSync(REPORT_FILE, JSON.stringify(currentReport, null, 2));
    console.log(`JSON report saved to ${REPORT_FILE}`);

    // Generate HTML report
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Playwright Test Report</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; background-color: #f4f4f4; color: #333; }
                .container { max-width: 960px; margin: auto; background: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
                h1 { color: #0056b3; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                h2 { color: #0056b3; margin-top: 25px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                .status { font-weight: bold; padding: 6px 12px; border-radius: 5px; display: inline-block; margin-top: 5px; }
                .status.success { background-color: #d4edda; color: #155724; }
                .status.failure { background-color: #f8d7da; color: #721c24; }
                .status.error { background-color: #ffeeba; color: #856404; }
                pre { background: #eee; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
                .screenshot-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; margin-top: 15px; }
                .screenshot-gallery img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 5px; cursor: pointer; transition: transform 0.2s ease-in-out; }
                .screenshot-gallery img:hover { transform: scale(1.02); }
                ul { list-style-type: none; padding: 0; }
                li { margin-bottom: 8px; }
                .error-item { color: #dc3545; font-weight: bold; }
                .console-log-item { color: #6c757d; }
                .test-detail-passed { color: #28a745; }
                .test-detail-failed { color: #dc3545; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Playwright Test Report</h1>
                <p><strong>Timestamp:</strong> ${currentReport.timestamp}</p>
                <p><strong>Target URL:</strong> <a href="${currentReport.url}" target="_blank">${currentReport.url}</a></p>
                <p><strong>Duration:</strong> ${(currentReport.durationMs / 1000).toFixed(2)} seconds</p>
                <p><strong>Overall Status:</strong> <span class="status ${currentReport.status}">${currentReport.status.toUpperCase()}</span></p>

                <h2>Automated Test Results</h2>
                ${currentReport.automatedTestResults ? `
                    <p><strong>Overall Passed:</strong> <span class="status ${currentReport.automatedTestResults.overallPassed ? 'success' : 'failure'}">${currentReport.automatedTestResults.overallPassed ? 'YES' : 'NO'}</span></p>
                    <p><strong>Total Tests:</strong> ${currentReport.automatedTestResults.totalTests}</p>
                    <p><strong>Passed Tests:</strong> ${currentReport.automatedTestResults.passedTests}</p>
                    <p><strong>Failed Tests:</strong> ${currentReport.automatedTestResults.failedTests}</p>
                    <h3>Individual Test Details:</h3>
                    <ul>
                        ${currentReport.automatedTestResults.details.map(test => `
                            <li class="${test.passed ? 'test-detail-passed' : 'test-detail-failed'}">
                                ${test.passed ? '✅' : '❌'} <strong>${test.name}:</strong> ${test.message}
                            </li>
                        `).join('')}
                    </ul>
                ` : '<p>No automated test results captured.</p>'}

                <h2>Errors</h2>
                ${currentReport.errors.length > 0 ? `
                    <ul>
                        ${currentReport.errors.map(err => `<li class="error-item">${err}</li>`).join('')}
                    </ul>
                ` : '<p>No errors reported.</p>'}

                <h2>Console Logs</h2>
                ${currentReport.consoleLogs.length > 0 ? `
                    <ul>
                        ${currentReport.consoleLogs.map(log => `<li class="console-log-item">${log}</li>`).join('')}
                    </ul>
                ` : '<p>No console logs captured.</p>'}

                <h2>Screenshots</h2>
                <div class="screenshot-gallery">
                    ${currentReport.screenshots.map(screenshot => `
                        <a href="${path.relative(OUTPUT_DIR, screenshot)}" target="_blank">
                            <img src="${path.relative(OUTPUT_DIR, screenshot)}" alt="${path.basename(screenshot)}">
                        </a>
                    `).join('')}
                </div>
            </div>
        </body>
        </html>
    `;

    fs.writeFileSync(HTML_REPORT_FILE, htmlContent);
    console.log(`HTML report saved to ${HTML_REPORT_FILE}`);
}

// --- Main Test Runner Function ---
async function runTests(): Promise<void> {
    const startTime = Date.now();
    let browser: Browser | null = null;

    await ensureDirExists(SCREENSHOT_DIR);

    try {
        // 1. Launch browser (headless by default for CI/CD)
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        // 4. Capture console logs and errors
        page.on('console', (msg: ConsoleMessage) => {
            const text = `[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`;
            currentReport.consoleLogs.push(text);
            // console.log(text); // Uncomment to see all console logs in real-time
        });

        page.on('pageerror', (err: Error) => {
            const errorText = `[PAGE ERROR] ${err.message}`;
            currentReport.errors.push(errorText);
            console.error(errorText);
        });

        // Optional: Capture network requests/responses for debugging
        // page.on('request', (request: Request) => console.log(`>> ${request.method()} ${request.url()}`));
        // page.on('response', (response: Response) => console.log(`<< ${response.status()} ${response.url()}`));

        console.log(`Navigating to ${TARGET_URL}...`);
        await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: NAVIGATION_TIMEOUT });
        await takeScreenshot(page, 'after_initial_navigation');

        // 2. Wait for the game to load
        // This is crucial. A robust way is to wait for a specific element or a JS flag.
        // Assuming the game sets `window.gameLoaded = true;` when ready.
        console.log('Waiting for game to fully load (checking window.gameLoaded flag)...');
        await page.waitForFunction('window.gameLoaded === true', { timeout: GAME_LOAD_TIMEOUT });
        console.log('Game reported as loaded.');
        await takeScreenshot(page, 'game_fully_loaded');

        // 3. Run automated tests by injecting JavaScript
        console.log('Injecting and running automated tests via window.runAutomatedTests()...');
        const automatedTestResults: AutomatedTestResult | null = await page.evaluate(async () => {
            // Ensure window.runAutomatedTests exists before calling
            if (typeof (window as any).runAutomatedTests === 'function') {
                try {
                    const result = await (window as any).runAutomatedTests();
                    return result;
                } catch (e: any) {
                    console.error('Error during window.runAutomatedTests execution:', e);
                    return {
                        overallPassed: false,
                        totalTests: 0,
                        passedTests: 0,
                        failedTests: 0,
                        details: [{ name: 'Script Execution', passed: false, message: `Error: ${e.message}` }]
                    };
                }
            } else {
                console.error('window.runAutomatedTests() function not found on the page.');
                return {
                    overallPassed: false,
                    totalTests: 0,
                    passedTests: 0,
                    failedTests: 0,
                    details: [{ name: 'Function Check', passed: false, message: 'window.runAutomatedTests() not found.' }]
                };
            }
        });

        currentReport.automatedTestResults = automatedTestResults;
        console.log('Automated test results captured.');
        if (automatedTestResults) {
            console.log(`Overall Automated Tests Passed: ${automatedTestResults.overallPassed}`);
            if (!automatedTestResults.overallPassed) {
                currentReport.errors.push('Automated tests reported overall failure.');
            }
        } else {
            currentReport.errors.push('Failed to get automated test results from page.');
        }

        await takeScreenshot(page, 'after_automated_tests');

        // Determine overall status
        if (currentReport.errors.length === 0 && automatedTestResults?.overallPassed) {
            currentReport.status = 'success';
        } else {
            currentReport.status = 'failure';
        }

    } catch (error: any) {
        console.error('A critical error occurred during the test run:', error);
        currentReport.errors.push(`Critical test runner error: ${error.message}`);
        currentReport.status = 'error'; // Indicate a runner error, not just test failure
    } finally {
        if (browser) {
            await browser.close();
            console.log('Browser closed.');
        }
        currentReport.durationMs = Date.now() - startTime;
        await generateReport();
        console.log(`\n--- Test Run Summary ---`);
        console.log(`Status: ${currentReport.status.toUpperCase()}`);
        console.log(`Report available at: ${path.resolve(HTML_REPORT_FILE)}`);
        console.log(`Screenshots in: ${path.resolve(SCREENSHOT_DIR)}`);

        // Exit with appropriate code for CI/CD
        process.exit(currentReport.status === 'success' ? 0 : 1);
    }
}

// --- Execute the tests ---
runTests();
```