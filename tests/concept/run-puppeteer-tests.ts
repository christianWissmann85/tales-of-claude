// Run Puppeteer tests with proper TypeScript setup
import { PuppeteerTestRunner } from './src/tests/puppeteer-test-runner.js';

async function main() {
    console.log('Starting Puppeteer test runner...');
    
    const testRunner = new PuppeteerTestRunner({
        url: 'http://localhost:5174',
        headless: true,
        testConfig: {
            fullRun: true,
            debugMode: true,
            testSpeed: 'fast',
            resetGameBeforeRun: true,
        },
    });
    
    try {
        await testRunner.run();
        console.log('Test run completed successfully!');
    } catch (error) {
        console.error('Test run failed:', error);
        process.exit(1);
    }
}

main();