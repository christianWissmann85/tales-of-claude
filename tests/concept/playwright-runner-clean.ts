import { chromium, Browser, Page, ConsoleMessage } from 'playwright';
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
const currentReport: Report = {
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
    } catch (error) {
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
            if (typeof (window as unknown as { runAutomatedTests?: () => unknown }).runAutomatedTests === 'function') {
                try {
                    const result = await (window as unknown as { runAutomatedTests?: () => unknown }).runAutomatedTests?.();
                    return result;
                } catch (e) {
                    console.error('Error during window.runAutomatedTests execution:', e);
                    return {
                        overallPassed: false,
                        totalTests: 0,
                        passedTests: 0,
                        failedTests: 0,
                        details: [{ name: 'Script Execution', passed: false, message: `Error: ${e.message}` }],
                    };
                }
            } else {
                console.error('window.runAutomatedTests() function not found on the page.');
                return {
                    overallPassed: false,
                    totalTests: 0,
                    passedTests: 0,
                    failedTests: 0,
                    details: [{ name: 'Function Check', passed: false, message: 'window.runAutomatedTests() not found.' }],
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

    } catch (error) {
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
        console.log('\n--- Test Run Summary ---');
        console.log(`Status: ${currentReport.status.toUpperCase()}`);
        console.log(`Report available at: ${path.resolve(HTML_REPORT_FILE)}`);
        console.log(`Screenshots in: ${path.resolve(SCREENSHOT_DIR)}`);

        // Exit with appropriate code for CI/CD
        process.exit(currentReport.status === 'success' ? 0 : 1);
    }
}

// --- Execute the tests ---
runTests();
