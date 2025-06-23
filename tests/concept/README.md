# Experimental Test Concepts

This directory contains experimental test implementations using Puppeteer and Playwright that were explored during development. These files are kept for reference but are not part of the active test suite.

## Why These Are Experimental

1. **Chrome Dependencies**: Both Puppeteer and Playwright require Chrome/Chromium installation which adds complexity to the development environment.

2. **Complexity vs Value**: For Tales of Claude, the custom Node.js test runner with mocked environment provides sufficient testing coverage without the overhead of browser automation.

3. **Performance**: The Node.js tests run much faster and provide better isolation for unit testing game logic.

## Files in This Directory

- `puppeteer-runner-clean.ts` - Clean implementation of Puppeteer test runner
- `simple-puppeteer-runner.ts` - Simplified Puppeteer approach
- `playwright-test-runner.ts` - Playwright-based test runner attempt
- `playwright-runner-clean.ts` - Clean Playwright implementation
- `run-puppeteer-tests.ts` - Script to run Puppeteer tests
- `run-browser-tests.ts` - Generic browser test runner

## Current Testing Approach

The active test suite uses:
1. **Unit Tests** (`tests/unit/node-test-runner.ts`) - Fast, isolated tests for game logic
2. **Browser Console Tests** (`tests/browser/automated-playtester.ts`) - Interactive tests that run in the browser console

These provide comprehensive coverage without requiring additional browser automation dependencies.

## Future Considerations

These experimental implementations may be useful if:
- Cross-browser testing becomes critical
- Visual regression testing is needed
- Complex user journey automation is required
- CI/CD pipeline requires headless browser testing

For now, the simpler approach serves the project's needs effectively.