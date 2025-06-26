# 🧪 Test Running Guide

This guide explains how to run the test suite for Tales of Claude.

## Quick Start

### TypeScript Checking
```bash
npm run type-check
```
This ensures all TypeScript types are correct. Should show no errors.

### Node Tests (Game Logic)
```bash
npx tsx src/tests/node-test-runner.ts
```
Tests all game logic, models, and systems. Currently has 206 tests covering:
- Player mechanics
- Combat system
- Inventory management
- Quest system
- Save/load functionality
- Game engine
- And more!

### Browser Tests (Integration)
```bash
npx tsx src/tests/puppeteer-test-runner.ts
```
Tests the game in a real browser environment. Requires the dev server to be running.

### Visual Tests
```bash
# First start the dev server
npm run dev

# Then run visual tests
npx tsx src/tests/check-visual-integration.ts
```
Checks for visual issues, CSS problems, and UI rendering.

## Running Specific Tests

### Test Individual Components
```bash
# Just run player tests
npx tsx src/tests/node-test-runner.ts | grep -A 50 "Player Model Tests"

# Just run quest tests
npx tsx src/tests/node-test-runner.ts | grep -A 50 "Quest System Tests"
```

### Browser Console Tests
```bash
# Start dev server
npm run dev

# Open browser console at http://localhost:5173
# Run in console:
window.runAutomatedTests()
```

## Common Issues

### TypeScript Errors
- Run `npm run type-check` to see all errors
- Most common: outdated type definitions after UI changes
- Fix: Update test mocks to match current interfaces

### Test Failures
- QuestManager tests may fail due to API changes (serialize/deserialize removed)
- BattleSystem tests need updating for new turn-based API
- Status effect tests are commented out (methods moved)

### Browser Test Timeouts
- Ensure dev server is running on port 5173
- Use `?agent=true` URL parameter to skip splash screens
- Check that game loads properly before running tests

## Test Infrastructure Status

✅ **Working Well:**
- All TypeScript errors fixed
- Node tests run successfully
- Test framework is fast and reliable

⚠️ **Needs Attention:**
- Some Quest/Battle tests are simplified due to API changes
- Status effect tests are commented out
- Could add more UI-specific tests

## Tips for Writing Tests

1. **Use the test helpers:**
   ```typescript
   testWithBeforeEach('description', () => {
     // Your test
   });
   ```

2. **Assert helpers available:**
   - `assertEqual(actual, expected, message)`
   - `assertTrue(condition, message)`
   - `assertFalse(condition, message)`
   - `assertDeepEqual(actual, expected, message)`

3. **Mock data is available:**
   - Check top of `node-test-runner.ts` for mock objects
   - Reuse existing mocks when possible

## Future Improvements

- Add more visual regression tests
- Create test coverage reports
- Add performance benchmarks
- Set up CI/CD test running

---

*Test infrastructure maintained by Oliver (Test Infrastructure Specialist)*
*Last updated: 2025-06-25*