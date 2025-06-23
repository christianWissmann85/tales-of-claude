# Visual Test Integration Plan

## Quick Start Implementation

### 1. Add to package.json scripts
```json
"scripts": {
  "visual:quick": "tsx simple_visual_test_proposal/simple_visual_test.ts",
  "visual:menu": "tsx simple_visual_test_proposal/simple_visual_test.ts menu",
  "visual:game": "tsx simple_visual_test_proposal/simple_visual_test.ts gameplay",
  "visual:battle": "tsx simple_visual_test_proposal/simple_visual_test.ts battle",
  "visual:analyze": "tsx simple_visual_test_proposal/visual_analyzer.ts",
  "visual:suite": "tsx simple_visual_test_proposal/visual_analyzer.ts suite"
}
```

### 2. Create .gitignore entry
```
visual-tests/
visual-checks/
```

### 3. Add to TESTING.md
```markdown
## Visual Testing (Quick Checks)

For rapid visual verification without full automation:

```bash
# Take a quick screenshot
npm run visual:quick

# Specific game states
npm run visual:menu
npm run visual:game
npm run visual:battle

# Run visual test suite
npm run visual:suite
```

Use visual tests when:
- Debugging UI issues quickly
- Verifying visual state for Chris
- Getting a "sanity check" on game appearance
- You need visual evidence without full automation

DO NOT use for:
- Comprehensive regression testing (use Puppeteer)
- Performance testing
- Complex interaction testing
```

### 4. Auto-cleanup Script
Create `scripts/cleanup-visual-tests.js`:
```javascript
const fs = require('fs');
const path = require('path');

const VISUAL_DIR = './visual-tests';
const MAX_AGE_DAYS = 3;

// Cleanup old screenshots
if (fs.existsSync(VISUAL_DIR)) {
  const files = fs.readdirSync(VISUAL_DIR);
  const now = Date.now();
  
  files.forEach(file => {
    const filePath = path.join(VISUAL_DIR, file);
    const stats = fs.statSync(filePath);
    const age = (now - stats.mtime) / (1000 * 60 * 60 * 24);
    
    if (age > MAX_AGE_DAYS) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up: ${file}`);
    }
  });
}
```

### 5. Usage Guidelines for Agents

#### When to Use Visual Tests:
- Quick debugging: "Let me see what's happening"
- Communicating with Chris: "Here's what the bug looks like"
- Sanity checks: "Does the UI look correct after my changes?"
- Visual regression: "Did my fix break the layout?"

#### When NOT to Use:
- Full test coverage (use existing test suite)
- Performance testing
- Complex user journeys
- CI/CD pipeline (stick with Puppeteer)

### 6. Example Agent Workflow
```bash
# Agent fixing a UI bug
npm run dev &
sleep 5

# Take before screenshot
npm run visual:game
# Output: visual-tests/game-gameplay-2025-06-23T16-30-00.png

# Make fixes to UI code...

# Take after screenshot
npm run visual:game
# Output: visual-tests/game-gameplay-2025-06-23T16-35-00.png

# Analyze both screenshots
# Report findings to Team Lead
```

## Integration Priority: MEDIUM

- Not urgent but valuable addition
- Implement when an agent has 30 minutes free
- Test with 2-3 real scenarios first
- Gather feedback before full adoption