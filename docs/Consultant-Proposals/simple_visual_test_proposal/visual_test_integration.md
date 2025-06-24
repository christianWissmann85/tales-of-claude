# Simple Visual Testing for Claude Code Agents

## Overview

This lightweight visual testing solution lets Claude Code agents take screenshots and analyze them **without** the complexity of full Puppeteer/Playwright automation.

## Quick Setup

1. **Install minimal dependencies:**
```bash
npm install --save-dev puppeteer-core tsx
```

2. **Add the scripts to your existing package.json:**
```json
{
  "scripts": {
    "visual-test": "tsx simple-screenshot.ts",
    "visual-analyze": "tsx visual-analyzer.ts"
  }
}
```

3. **That's it!** No Chrome downloads, no complex configuration.

## How Agents Use It

### Simple Screenshot
Agents can run this command to get a screenshot + analysis prompt:
```bash
npm run visual-test
```

This outputs:
- Screenshot saved to `./visual-tests/game-current-[timestamp].png`
- Analysis prompt for the agent to examine the image

### Specific Game States
```bash
npm run visual-test menu          # Screenshot of main menu
npm run visual-test gameplay      # Screenshot during gameplay  
npm run visual-test battle        # Screenshot during combat
```

### Full Visual Suite
```bash
npm run visual-analyze suite
```

This takes multiple screenshots and generates a comprehensive analysis report.

## Integration with Existing Tests

Add visual testing to your current test workflow in `TESTING.md`:

### In Browser Console Tests
```javascript
// In automated-playtester.ts
private async testWithVisualCapture(testName: string): Promise<void> {
    await this.runTest(testName, async () => {
        // Run your existing test logic
        await this.performGameActions();
        
        // Take visual snapshot for agent analysis
        await this.executeConsoleScript(`
            window.visualTestHelper?.capture('${testName}');
        `);
        
        // Continue with assertions
        assert(gameState.isCorrect, 'Game state should be correct');
    });
}
```

### In Node.js Tests
```typescript
// Add to node-test-runner.ts
import { AgentVisualTester } from '../visual-analyzer';

await runTest('Visual Integration Test', async () => {
    // Start dev server
    const server = startDevServer();
    
    // Wait for ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Agent takes screenshot and analyzes
    await AgentVisualTester.integrationTest();
    
    // Continue with regular tests
    server.close();
});
```

## Agent Workflow

1. **Agent runs visual test:**
   ```bash
   npm run visual-test gameplay
   ```

2. **Agent analyzes the screenshot file:**
   - Checks for visual bugs
   - Verifies UI alignment
   - Looks for missing elements
   - Reports issues found

3. **Agent can take action based on findings:**
   - Create bug reports
   - Update test expectations
   - Suggest fixes to developer

## Benefits

✅ **No complex setup** - Uses existing Chrome installation  
✅ **Runs headlessly** - No windows pop up during development  
✅ **Fast execution** - Takes ~2-3 seconds per screenshot  
✅ **Agent-friendly** - Simple command-line interface  
✅ **Integrates easily** - Works with existing test suite  
✅ **No rabbit holes** - Focused only on screenshots, not automation  

## Fallback Strategy

If Puppeteer fails (Chrome not found), the tool automatically falls back to:
- **macOS**: Uses built-in `screencapture` with Safari
- **Linux**: Uses `xvfb` + `chromium-browser` 
- **Windows**: Graceful error with instructions

## Example Agent Usage

```bash
# Agent command sequence:
npm run dev &                    # Start game server
sleep 5                         # Wait for server
npm run visual-test menu        # Take menu screenshot
npm run visual-test gameplay    # Take gameplay screenshot
npm run visual-analyze suite    # Full analysis report

# Agent then examines the generated images and reports findings
```

This gives you **visual feedback without the complexity** - exactly what you needed! 🎯