import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// --- Constants ---
const TARGET_URL = 'http://localhost:5174';
const SCREENSHOTS_DIR = 'test-screenshots';
const REPORTS_DIR = 'test-reports';
const AUTOMATED_PLAYTESTER_PATH = './src/tests/automated-playtester.ts'; // Path to the injected script
const NAVIGATION_TIMEOUT_MS = 30000; // 30 seconds
const TEST_EXECUTION_TIMEOUT_MS = 60000; // 60 seconds for automated tests to complete

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Interfaces for Report Data ---
interface ConsoleLog {
    type: string;
    text: string;
}

interface PageError {
    message: string;
    stack?: string;
}

interface TestResult {
    testName: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message?: string;
    screenshotName?: string;
}

interface AutomatedTestReport {
    success: boolean;
    results: TestResult[];
    logs: string[]; // Logs specifically from the injected script
}

// --- Helper Functions ---

/**
 * Ensures a directory exists.
 */
function ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
}

/**
 * Takes a screenshot of the current page.
 */
async function takeScreenshot(page: Page, name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(__dirname, SCREENSHOTS_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`Screenshot saved: ${filepath}`);
    return filename; // Return just the filename for the report
}

/**
 * Generates the HTML report.
 */
function generateReport(
    timestamp: string,
    targetUrl: string,
    consoleLogs: ConsoleLog[],
    pageErrors: PageError[],
    automatedTestReport: AutomatedTestReport | null,
    screenshots: string[],
    runnerError: string | null
): string {
    const reportFilePath = path.join(__dirname, REPORTS_DIR, `report-${timestamp}.html`);

    let testSummary = '';
    let testDetails = '';
    let overallStatus = 'UNKNOWN';

    if (runnerError) {
        overallStatus = 'FAILED (Runner Error)';
        testSummary = `<p class="status-fail">Test Runner encountered a critical error.</p>`;
        testDetails = `<pre class="error-block">${runnerError}</pre>`;
    } else if (automatedTestReport) {
        overallStatus = automatedTestReport.success ? 'PASSED' : 'FAILED';
        testSummary = `<p class="status-${automatedTestReport.success ? 'pass' : 'fail'}">Automated Tests: ${overallStatus}</p>`;
        testDetails = `
            <h3>Automated Test Results:</h3>
            <ul class="test-results">
                ${automatedTestReport.results.map(r => `
                    <li class="test-item status-${r.status.toLowerCase()}">
                        <strong>${r.testName}:</strong> ${r.status}
                        ${r.message ? `<p class="test-message">${r.message}</p>` : ''}
                    </li>
                `).join('')}
            </ul>
            <h3>Injected Script Console Logs:</h3>
            <pre class="log-block">${automatedTestReport.logs.join('\n') || 'No logs from injected script.'}</pre>
        `;
    } else {
        overallStatus = 'FAILED (No Automated Test Report)';
        testSummary = `<p class="status-fail">Automated tests did not run or failed to report results.</p>`;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Puppeteer Test Report - ${timestamp}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f4; color: #333; }
                .container { max-width: 900px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                h2 { color: #555; margin-top: 25px; }
                pre { background-color: #eee; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
                .log-block { background-color: #e8f0fe; border-left: 4px solid #2196F3; }
                .error-block { background-color: #ffebee; border-left: 4px solid #F44336; color: #D32F2F; }
                .screenshot-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 20px; }
                .screenshot-item { border: 1px solid #ddd; padding: 10px; border-radius: 5px; text-align: center; background-color: #fff; }
                .screenshot-item img { max-width: 100%; height: auto; border-radius: 3px; }
                .status-pass { color: #4CAF50; font-weight: bold; }
                .status-fail { color: #F44336; font-weight: bold; }
                .status-skip { color: #FFC107; font-weight: bold; }
                .test-results { list-style: none; padding: 0; }
                .test-item { margin-bottom: 10px; padding: 10px; border-radius: 5px; }
                .test-item.status-pass { background-color: #e8f5e9; border-left: 4px solid #4CAF50; }
                .test-item.status-fail { background-color: #ffebee; border-left: 4px solid #F44336; }
                .test-item.status-skip { background-color: #fffde7; border-left: 4px solid #FFC107; }
                .test-message { font-style: italic; color: #666; margin-top: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Puppeteer Test Report</h1>
                <p><strong>Date & Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Target URL:</strong> <a href="${targetUrl}">${targetUrl}</a></p>
                <p><strong>Overall Status:</strong> <span class="status-${overallStatus.includes('PASSED') ? 'pass' : 'fail'}">${overallStatus}</span></p>

                ${testSummary}
                ${testDetails}

                <h2>Captured Console Logs:</h2>
                <pre class="log-block">${consoleLogs.map(log => `[${log.type.toUpperCase()}] ${log.text}`).join('\n') || 'No console logs captured.'}</pre>

                <h2>Captured Page Errors:</h2>
                <pre class="error-block">${pageErrors.map(err => `Error: ${err.message}\nStack: ${err.stack || 'N/A'}`).join('\n\n') || 'No page errors captured.'}</pre>

                <h2>Screenshots:</h2>
                <div class="screenshot-gallery">
                    ${screenshots.length > 0 ? screenshots.map(filename => `
                        <div class="screenshot-item">
                            <a href="../${SCREENSHOTS_DIR}/${filename}" target="_blank">
                                <img src="../${SCREENSHOTS_DIR}/${filename}" alt="${filename}">
                                <p>${filename}</p>
                            </a>
                        </div>
                    `).join('') : '<p>No screenshots taken.</p>'}
                </div>
            </div>
        </body>
        </html>
    `;

    fs.writeFileSync(reportFilePath, htmlContent);
    console.log(`HTML report generated: ${reportFilePath}`);
}

// --- Main Test Runner Function ---
async function runTests() {
    let browser: Browser | null = null;
    let page: Page | null = null;
    const consoleLogs: ConsoleLog[] = [];
    const pageErrors: PageError[] = [];
    const screenshots: string[] = [];
    let automatedTestReport: AutomatedTestReport | null = null;
    let runnerError: string | null = null;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    console.log('--- Starting Puppeteer Test Runner ---');

    // Ensure output directories exist
    ensureDirectoryExists(path.join(__dirname, SCREENSHOTS_DIR));
    ensureDirectoryExists(path.join(__dirname, REPORTS_DIR));

    try {
        // 1. Launch Puppeteer
        console.log('Launching browser...');
        browser = await puppeteer.launch({
            headless: 'new', // Use the new headless mode
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Recommended for CI/Docker
        });
        page = await browser.newPage();

        // Set a default timeout for all page operations
        page.setDefaultTimeout(NAVIGATION_TIMEOUT_MS);

        // 2. Capture console logs
        page.on('console', msg => {
            const logEntry: ConsoleLog = { type: msg.type(), text: msg.text() };
            consoleLogs.push(logEntry);
            console.log(`[Browser Console - ${msg.type().toUpperCase()}] ${msg.text()}`);
        });

        // 3. Capture page errors (e.g., unhandled exceptions in the browser)
        page.on('pageerror', err => {
            const errorEntry: PageError = { message: err.message, stack: err.stack };
            pageErrors.push(errorEntry);
            console.error(`[Browser Page Error] ${err.message}`);
        });

        // Capture general browser errors (e.g., network issues)
        page.on('error', err => {
            const errorEntry: PageError = { message: `Browser Error: ${err.message}`, stack: err.stack };
            pageErrors.push(errorEntry);
            console.error(`[Browser Error] ${err.message}`);
        });

        // 4. Navigate to the target URL
        console.log(`Navigating to ${TARGET_URL}...`);
        await page.goto(TARGET_URL, { waitUntil: 'networkidle0', timeout: NAVIGATION_TIMEOUT_MS });
        console.log('Navigation complete.');

        // 5. Take initial screenshot
        screenshots.push(await takeScreenshot(page, 'initial-load'));

        // 6. Inject and run AutomatedPlaytester code
        console.log(`Injecting automated playtester from ${AUTOMATED_PLAYTESTER_PATH}...`);
        const playtesterCode = fs.readFileSync(path.join(__dirname, AUTOMATED_PLAYTESTER_PATH), 'utf8');

        // Inject the script directly into the page's context
        // This assumes the script defines a global function like `window.runAutomatedTests`
        await page.evaluate(playtesterCode);
        console.log('Automated playtester code injected.');

        // Run the automated tests and capture their report
        console.log('Running automated tests...');
        automatedTestReport = await page.evaluate(async () => {
            // This code runs inside the browser context
            if (typeof (window as any).runAutomatedTests === 'function') {
                return await (window as any).runAutomatedTests();
            }
            throw new Error('window.runAutomatedTests function not found after injection.');
        }, { timeout: TEST_EXECUTION_TIMEOUT_MS }); // Set timeout for the evaluation itself

        console.log('Automated tests finished.');
        screenshots.push(await takeScreenshot(page, 'after-tests'));

    } catch (error: any) {
        console.error(`\n!!! Test Runner Error: ${error.message}`);
        runnerError = error.message;
        if (error.stack) {
            runnerError += `\nStack: ${error.stack}`;
        }
        // Attempt to take a screenshot on error
        if (page) {
            try {
                screenshots.push(await takeScreenshot(page, 'error-state'));
            } catch (screenshotError: any) {
                console.error(`Failed to take error screenshot: ${screenshotError.message}`);
            }
        }
    } finally {
        // 7. Close the browser
        if (browser) {
            console.log('Closing browser...');
            await browser.close();
            console.log('Browser closed.');
        }

        // 8. Generate report
        console.log('Generating final report...');
        generateReport(
            timestamp,
            TARGET_URL,
            consoleLogs,
            pageErrors,
            automatedTestReport,
            screenshots,
            runnerError
        );
        console.log('--- Test Runner Finished ---');

        // Exit with appropriate status code
        if (runnerError || (automatedTestReport && !automatedTestReport.success)) {
            process.exit(1); // Indicate failure
        } else {
            process.exit(0); // Indicate success
        }
    }
}

// Execute the main function
runTests();
