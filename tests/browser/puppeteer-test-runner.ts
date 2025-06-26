
// src/tests/puppeteer-test-runner.ts

import puppeteer, { Browser, Page, ConsoleMessage } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
// Import the Playtester and its types from the sibling file
import { TestResult } from './automated-playtester';

// --- Constants ---
const GAME_URL = 'http://localhost:5174';
const SCREENSHOTS_DIR = 'test-screenshots';
const REPORTS_DIR = 'test-reports';
const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 720;
const GAME_LOAD_TIMEOUT_MS = 30000; // 30 seconds for page navigation and game object detection
const PLAYTESTER_INJECTION_TIMEOUT_MS = 10000; // 10 seconds for playtester code to be available

/**
 * Interface for capturing key performance metrics.
 */
interface PerformanceMetrics {
    navigationStart: number;
    domContentLoadedEventEnd: number;
    loadEventEnd: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    totalTime: number; // Total time from navigation start to metrics capture
}

/**
 * Interface for the structure of the final test report.
 */
interface ReportData {
    timestamp: string;
    url: string;
    browserInfo: string;
    viewport: { width: number; height: number; };
    overallStatus: 'PASS' | 'FAIL' | 'PARTIAL_PASS';
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    durationMs: number;
    consoleMessages: { type: string; text: string; }[];
    pageErrors: string[];
    performanceMetrics: PerformanceMetrics | null;
    testResults: TestResult[];
    screenshots: string[];
}

/**
 * PuppeteerTestRunner class orchestrates browser automation for game testing.
 * It launches a browser, navigates to the game, injects and runs the AutomatedPlaytester,
 * captures various outputs, and generates a detailed report.
 */
class PuppeteerTestRunner {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private consoleMessages: { type: string; text: string; }[] = [];
    private pageErrors: string[] = [];
    private testResults: TestResult[] = [];
    private screenshotsTaken: string[] = [];
    private performanceMetrics: PerformanceMetrics | null = null;
    private startTime: number = 0; // Timestamp for the start of the entire test run
    private playtesterCode: string = ''; // Stores the content of automated-playtester.ts for injection

    constructor() {
        this.ensureDirectoriesExist();
        this.loadPlaytesterCode();
    }

    /**
     * Ensures that the necessary output directories (screenshots, reports) exist.
     * Creates them if they don't.
     */
    private ensureDirectoriesExist(): void {
        [SCREENSHOTS_DIR, REPORTS_DIR].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Created directory: ${dir}`);
            }
        });
    }

    /**
     * Loads the content of `automated-playtester.ts` into a string.
     * This content will be injected directly into the browser's context.
     * It also performs basic cleanup to make the TypeScript file runnable as plain JavaScript
     * within the browser's `eval` context.
     */
    private loadPlaytesterCode(): void {
        try {
            // Adjust path to reflect the new import structure for loading the file
            const playtesterFilePath = path.join(__dirname, './automated-playtester.ts');
            this.playtesterCode = fs.readFileSync(playtesterFilePath, 'utf8');

            // Remove TypeScript-specific syntax that would cause errors in plain JS eval
            // 1. Remove import/export statements
            this.playtesterCode = this.playtesterCode.replace(/^(import|export)\s+.*$/gm, '');
            // 2. Remove `declare global` blocks
            this.playtesterCode = this.playtesterCode.replace(/declare global\s*\{[^}]*\}\n/gs, '');
            // 3. Remove interface and type alias definitions
            this.playtesterCode = this.playtesterCode.replace(/^(interface|type)\s+[\w\d_]+\s*\{[^}]*\}\s*;/gm, '');
            // 4. Remove the final export statements for the class and types
            this.playtesterCode = this.playtesterCode.replace(/export\s*\{ AutomatedPlaytester \};/g, '');
            this.playtesterCode = this.playtesterCode.replace(/export\s*type\s*\{ TestConfig, GameState, TestResult, GameMapEntity \};/g, '');

            console.log('AutomatedPlaytester code loaded successfully for injection.');
        } catch (error) {
            console.error('Failed to load automated-playtester.ts:', error);
            process.exit(1); // Critical error: cannot proceed without the playtester code
        }
    }

    /**
     * Launches a new headless Chromium browser instance with predefined settings.
     * @returns {Promise<void>}
     * @throws {Error} If the browser fails to launch.
     */
    public async launchBrowser(): Promise<void> {
        console.log('Launching browser...');
        try {
            this.browser = await puppeteer.launch({
                headless: true, // Use headless mode for better performance and features
                args: [
                    '--no-sandbox', // Required for some environments (e.g., Docker, CI/CD)
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage', // Overcomes limited resource problems in some environments
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu', // Disable GPU hardware acceleration for consistency
                    `--window-size=${VIEWPORT_WIDTH},${VIEWPORT_HEIGHT}`, // Set initial window size
                ],
                defaultViewport: { // Set default viewport for new pages
                    width: VIEWPORT_WIDTH,
                    height: VIEWPORT_HEIGHT,
                },
            });
            this.page = await this.browser.newPage();
            console.log('Browser launched successfully.');
        } catch (error) {
            console.error('Failed to launch browser:', error);
            throw error; // Re-throw to be caught by the main function for graceful exit
        }
    }

    /**
     * Navigates the browser to the specified game URL and waits for the game to fully load,
     * indicated by the presence of `window.game` object.
     * @param {string} url The URL of the game to navigate to.
     * @returns {Promise<void>}
     * @throws {Error} If navigation fails or `window.game` is not detected within timeout.
     */
    public async navigateToGame(url: string): Promise<void> {
        if (!this.page) {
            throw new Error('Page not initialized. Call launchBrowser first.');
        }

        console.log(`Navigating to ${url}...`);
        this.startTime = Date.now(); // Record start time for overall duration
        try {
            // Navigate to the URL and wait until no more than 0 network connections for at least 500 ms
            await this.page.goto(url, { waitUntil: 'networkidle0', timeout: GAME_LOAD_TIMEOUT_MS });
            console.log('Page loaded. Waiting for window.game object...');

            // Wait for the window.game object to be available, which signifies the game is initialized
            await this.page.waitForFunction('window.game !== undefined && window.game !== null', {
                timeout: GAME_LOAD_TIMEOUT_MS,
            });
            console.log('window.game object detected. Game is ready.');

            await this.captureScreenshot('after_navigation');
            await this.capturePerformanceMetrics();

        } catch (error) {
            console.error(`Failed to navigate to game or game did not load: ${error}`);
            await this.captureScreenshot('navigation_failure'); // Capture screenshot on failure
            throw error;
        }
    }

    /**
     * Captures a screenshot of the current page and saves it to the `test-screenshots/` directory.
     * The filename includes a timestamp for uniqueness.
     * @param {string} name A descriptive name for the screenshot (e.g., 'after_tests', 'login_failure').
     * @returns {Promise<void>}
     */
    public async captureScreenshot(name: string): Promise<void> {
        if (!this.page) {
            console.warn('Cannot capture screenshot: Page not initialized.');
            return;
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Format: YYYY-MM-DDTHH-MM-SS-sssZ
        const filename = `${name}_${timestamp}.png`;
        const filepath = path.join(SCREENSHOTS_DIR, filename);
        try {
            await this.page.screenshot({ path: filepath as `${string}.png`, fullPage: true });
            this.screenshotsTaken.push(filename); // Store filename for report
            console.log(`Screenshot saved: ${filepath}`);
        } catch (error) {
            console.error(`Failed to capture screenshot ${filename}: ${error}`);
        }
    }

    /**
     * Sets up listeners to capture console messages (log, warn, error) and uncaught page errors
     * from the browser context. These are stored for inclusion in the final report.
     */
    public captureConsoleOutput(): void {
        if (!this.page) {
            console.warn('Cannot capture console output: Page not initialized.');
            return;
        }

        this.page.on('console', (msg: ConsoleMessage) => {
            this.consoleMessages.push({ type: msg.type(), text: msg.text() });
            // Optionally, log to Node.js console for real-time feedback
            // console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
        });

        this.page.on('pageerror', (error: Error) => {
            this.pageErrors.push(error.message);
            console.error(`[BROWSER PAGE ERROR] ${error.message}`);
        });

        console.log('Console output and page errors monitoring enabled.');
    }

    /**
     * Captures performance metrics from the browser's `window.performance.timing` and
     * `performance.getEntriesByType` APIs.
     * @returns {Promise<void>}
     */
    private async capturePerformanceMetrics(): Promise<void> {
        if (!this.page) {
            console.warn('Cannot capture performance metrics: Page not initialized.');
            return;
        }
        try {
            const metrics = await this.page.evaluate(() => {
                const performance = window.performance;
                const timing = performance.timing;
                const navigationStart = timing.navigationStart;

                // Calculate durations relative to navigationStart
                return {
                    navigationStart: navigationStart,
                    domContentLoadedEventEnd: timing.domContentLoadedEventEnd - navigationStart,
                    loadEventEnd: timing.loadEventEnd - navigationStart,
                    // Attempt to get FCP/LCP if available (might require specific browser versions or polyfills)
                    firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
                    largestContentfulPaint: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
                    totalTime: Date.now() - navigationStart, // Total time elapsed since navigation started
                };
            });
            this.performanceMetrics = metrics;
            console.log('Performance metrics captured.');
        } catch (error) {
            console.error(`Failed to capture performance metrics: ${error}`);
        }
    }

    /**
     * Injects the `AutomatedPlaytester` code into the browser page and then
     * executes its `start()` method to run the defined test suites.
     * Retrieves the test results from the playtester instance.
     * @returns {Promise<void>}
     * @throws {Error} If the playtester code cannot be injected or fails to run.
     */
    public async runTestSuite(): Promise<void> {
        if (!this.page) {
            throw new Error('Page not initialized. Cannot run test suite.');
        }

        console.log('Injecting AutomatedPlaytester into the page...');
        try {
            // Inject the playtester code directly into the page's context using page.evaluate.
            // This makes the AutomatedPlaytester class available in the browser's window scope.
            await this.page.evaluate((playtesterCode: string) => {
                 
                eval(playtesterCode); // Execute the playtester code string
            }, this.playtesterCode);

            // Wait for the AutomatedPlaytester class to be available in the window context
            await this.page.waitForFunction('typeof AutomatedPlaytester === "function"', {
                timeout: PLAYTESTER_INJECTION_TIMEOUT_MS,
            });
            console.log('AutomatedPlaytester injected successfully.');

            console.log('Executing AutomatedPlaytester tests...');
            // Execute the playtester's start method within the browser context and retrieve its results.
            this.testResults = await this.page.evaluate(async () => {
                // Instantiate the AutomatedPlaytester class now available on window
                const playtester = new (window as unknown as { AutomatedPlaytester: typeof AutomatedPlaytester }).AutomatedPlaytester({
                    debugMode: true, // Enable debug logs from the playtester itself
                    testSpeed: 'normal', // Configure test speed: 'fast', 'normal', or 'slow'
                    fullRun: true, // Run all available test suites
                    resetGameBeforeRun: true, // Reset game state before starting the full run
                });
                // Store the instance globally for potential debugging or partial result retrieval
                (window as unknown as { playtesterInstance?: typeof playtester }).playtesterInstance = playtester;
                await playtester.start();
                return playtester.results; // Return the collected test results
            });
            console.log('AutomatedPlaytester tests completed.');
            await this.captureScreenshot('after_tests'); // Screenshot after all tests are done

        } catch (error) {
            console.error(`Failed to run AutomatedPlaytester tests: ${error}`);
            await this.captureScreenshot('test_run_failure'); // Screenshot on test run failure
            // Attempt to retrieve any partial results if the playtester execution failed mid-way
            try {
                const partialResults = await this.page.evaluate(() => {
                    return (window as unknown as { playtesterInstance?: { results?: unknown[] } }).playtesterInstance?.results || [];
                });
                this.testResults = partialResults;
            } catch (e) {
                console.warn('Could not retrieve partial test results after failure.');
            }
            throw error; // Re-throw to be caught by the main function
        }
    }

    /**
     * Generates a detailed test report based on collected data (test results, console output,
     * page errors, performance metrics, and screenshots). The report is saved as a JSON file.
     * A summary is also printed to the console.
     * @returns {Promise<void>}
     */
    public async generateReport(): Promise<void> {
        console.log('Generating test report...');
        const endTime = Date.now();
        const durationMs = endTime - this.startTime;

        let passedTests = 0;
        let failedTests = 0;
        let skippedTests = 0;

        this.testResults.forEach(res => {
            if (res.status === 'PASS') { passedTests++; } else if (res.status === 'FAIL') { failedTests++; } else if (res.status === 'SKIP') { skippedTests++; }
        });

        // Determine overall status based on test outcomes
        const overallStatus: ReportData['overallStatus'] = failedTests > 0 ? 'FAIL' : (passedTests > 0 ? 'PASS' : 'PARTIAL_PASS');

        const reportData: ReportData = {
            timestamp: new Date().toISOString(),
            url: GAME_URL,
            browserInfo: this.browser ? await this.browser.version() : 'N/A',
            viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
            overallStatus: overallStatus,
            totalTests: this.testResults.length,
            passedTests: passedTests,
            failedTests: failedTests,
            skippedTests: skippedTests,
            durationMs: durationMs,
            consoleMessages: this.consoleMessages,
            pageErrors: this.pageErrors,
            performanceMetrics: this.performanceMetrics,
            testResults: this.testResults,
            screenshots: this.screenshotsTaken,
        };

        const reportFilename = `report_${reportData.timestamp.replace(/[:.]/g, '-')}.json`;
        const reportFilepath = path.join(REPORTS_DIR, reportFilename);

        // Write the detailed report data to a JSON file
        fs.writeFileSync(reportFilepath, JSON.stringify(reportData, null, 2), 'utf8');
        console.log(`Detailed report saved to: ${reportFilepath}`);

        // Print a concise summary to the console
        console.log('\n--- TEST RUN SUMMARY ---');
        console.log(`Overall Status: ${reportData.overallStatus}`);
        console.log(`Total Duration: ${(reportData.durationMs / 1000).toFixed(2)} seconds`);
        console.log(`Tests Run: ${reportData.totalTests}`);
        console.log(`Passed: ${reportData.passedTests} ✅`);
        console.log(`Failed: ${reportData.failedTests} ❌`);
        console.log(`Skipped: ${reportData.skippedTests} ⚠️`);
        if (reportData.pageErrors.length > 0) {
            console.error(`Page Errors: ${reportData.pageErrors.length}`);
            reportData.pageErrors.forEach(err => console.error(`  - ${err}`));
        }
        console.log('------------------------');
    }

    /**
     * Closes the browser instance. This method should always be called in a `finally` block
     * to ensure the browser is closed even if errors occur.
     * @returns {Promise<void>}
     */
    public async closeBrowser(): Promise<void> {
        if (this.browser) {
            console.log('Closing browser...');
            try {
                await this.browser.close();
                console.log('Browser closed.');
            } catch (error) {
                console.error('Failed to close browser:', error);
            } finally {
                this.browser = null;
                this.page = null;
            }
        }
    }
}

/**
 * Main function to orchestrate the entire test run.
 * It initializes the runner, executes the test steps, handles errors,
 * and ensures resources are properly cleaned up.
 */
async function main() {
    const runner = new PuppeteerTestRunner();
    let exitCode = 0; // Default exit code for success

    try {
        await runner.launchBrowser();
        runner.captureConsoleOutput(); // Start capturing console messages early
        await runner.navigateToGame(GAME_URL);
        await runner.runTestSuite();
    } catch (error) {
        console.error('An unhandled error occurred during the test run:', error);
        await runner.captureScreenshot('critical_failure'); // Capture screenshot on critical errors
        exitCode = 1; // Set exit code to indicate failure
    } finally {
        await runner.generateReport();
        await runner.closeBrowser();

        // Read the generated report to determine the final exit code
        try {
            const latestReportFile = fs.readdirSync(REPORTS_DIR)
                                     .filter(f => f.startsWith('report_') && f.endsWith('.json'))
                                     .sort() // Sort to get the most recent one (due to timestamp in name)
                                     .pop();

            if (latestReportFile) {
                const reportData: ReportData = JSON.parse(
                    fs.readFileSync(path.join(REPORTS_DIR, latestReportFile), 'utf8'),
                );
                if (reportData.overallStatus === 'FAIL') {
                    exitCode = 1; // Set exit code to 1 if any test failed
                }
            }
        } catch (reportError) {
            console.error('Failed to read generated report for exit code determination:', reportError);
            exitCode = 1; // Assume failure if report cannot be read
        }

        process.exit(exitCode); // Exit the process with the determined code
    }
}

// Run the main function when the script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
