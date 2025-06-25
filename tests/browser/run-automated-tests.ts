// src/tests/run-automated-tests.ts
// Simple script to run automated playtester

import { AutomatedPlaytester } from './automated-playtester';

// This function will be attached to the window for easy access
function runAutomatedTests() {
    console.log('Starting automated playtester...');
    
    const config = {
        debugMode: true,
        testSpeed: 'fast' as const,
        fullRun: true,
        resetGameBeforeRun: true,
    };
    
    const playtester = new AutomatedPlaytester(config);
    
    // Run all test suites
    playtester.start().then(() => {
        console.log('Automated testing complete!');
    }).catch(error => {
        console.error('Automated testing failed:', error);
    });
}

// Attach to window for browser console access
(window as any).runAutomatedTests = runAutomatedTests;

// Also export for module usage
export { runAutomatedTests };