# 🧪 Tales of Claude Testing Guide

*Visual-first testing approach for watching AI agents play the game*

## 🎮 Quick Start - Visual Testing (Default)

### WARNING: Visual tests will open browser windows!
When running visual tests, you'll see a warning before windows appear:

```
🎮 VISUAL TEST STARTING IN 3... 2... 1...
Agent: [Name] ([Role])
Testing: [What they're testing]
Resolution: 1280x720
Duration: ~30 seconds
```

### Basic Visual Playtest
```bash
# Start the game server first
npm run dev

# Run visual playtest (opens browser window)
npx tsx src/tests/visual/simple-playtest.ts
```

### High-Resolution Testing (For Chris's 4K Setup!)
```bash
# 1080p HD test
npx tsx src/tests/visual/screenshot-hires.ts --resolution=1920x1080

# 4K Ultra HD test (for your GTX 4070 Super!)
npx tsx src/tests/visual/screenshot-hires.ts --resolution=3840x2160
```

## 🤖 Testing Modes

### 1. Visual Mode (Preferred for Critical Fixes)
- **When to use**: Bug fixes, new features, playtesting
- **Benefit**: Watch the AI play in real-time
- **Warning**: Always shows 3-second countdown
- **Default resolution**: 1280x720
- **Max resolution**: 3840x2160 (4K)

### 2. Headless Mode (For Routine Tests)
- **When to use**: CI/CD, background testing, parallel work
- **Benefit**: No windows, runs silently
- **Command**: Add `--headless` flag to any visual test

### 3. Entertainment Mode (For Fun!)
- **When to use**: Showing off to friends, recording demos
- **Resolution**: Always max (4K if available)
- **Special**: Includes commentary and slow-motion moments

## 📊 Test Types

### Logic Tests (Always Headless)
```bash
# Run all unit tests - no windows!
npx tsx src/tests/node-test-runner.ts
```

### Visual Integration Tests
```bash
# Basic visual test with warning
npx tsx src/tests/visual/simple-playtest.ts

# Quick screenshot capture
npx tsx src/tests/visual/quick-screenshot.ts

# Full playthrough test
npx tsx src/tests/visual/bug-investigation-playtest.ts
```

### Type Checking
```bash
# TypeScript validation - no visual component
npm run type-check
```

## ⚠️ Visual Test Warnings

All visual tests now display a countdown warning:

```typescript
console.log('🎮 VISUAL TEST STARTING IN 3... 2... 1...');
console.log(`Agent: ${agentName} (${agentRole})`);
console.log(`Testing: ${testDescription}`);
console.log(`Resolution: ${width}x${height}`);
console.log(`Duration: ~${estimatedTime}`);

// 3 second delay before window opens
await new Promise(resolve => setTimeout(resolve, 3000));
```

## 🖥️ Resolution Guidelines

### Standard Resolutions
- **720p (1280x720)**: Default, fast, good for most tests
- **1080p (1920x1080)**: Detailed testing, UI verification
- **1440p (2560x1440)**: High-detail visual checks
- **4K (3840x2160)**: Ultimate quality for Chris's setup!

### Setting Custom Resolution
```bash
# Via environment variable
RESOLUTION=1920x1080 npx tsx src/tests/visual/simple-playtest.ts

# Via command line flag
npx tsx src/tests/visual/screenshot-tool.ts --width=2560 --height=1440
```

## 🎯 Agent Testing Workflow

### For Critical Bug Fixes
1. **Always use visual mode**
2. **Watch the 3-second warning**
3. **Observe the AI play**
4. **Take screenshots at key moments**
5. **Document what you see**

### For Routine Testing
1. **Use headless mode**
2. **Run in background**
3. **Check logs for errors**
4. **Only go visual if issues found**

### For Playtesting
1. **Maximum resolution**
2. **Visual mode always**
3. **Record interesting moments**
4. **Share with the team!**

## 📝 Writing Visual Tests

### Basic Template
```typescript
// Always include warning system
async function runVisualTest() {
  // Show warning
  console.log('🎮 VISUAL TEST STARTING IN 3... 2... 1...');
  console.log(`Agent: ${process.env.AGENT_NAME || 'Unknown'}`);
  console.log(`Testing: Game mechanics verification`);
  console.log(`Resolution: 1280x720`);
  console.log(`Duration: ~45 seconds`);
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Launch browser
  const browser = await chromium.launch({
    headless: false, // Visual mode!
    args: ['--window-size=1280,720']
  });
  
  // Your test logic here...
}
```

## 🔧 Test Infrastructure

### Available Visual Test Scripts
- `simple-playtest.ts` - Basic gameplay verification
- `screenshot-hires.ts` - High-resolution captures
- `bug-investigation-playtest.ts` - Deep bug hunting
- `test-movement-fix.ts` - Movement system testing
- `edge-case-bug-hunt.ts` - Finding rare bugs

### Test Results Location
```
src/tests/visual/playtest-results/
├── screenshots/          # Visual captures
├── playtest-report.json  # Test results
└── error-logs/          # Debug information
```

## 🚨 Common Issues

### "No warning before window opened!"
- Update your test to include the warning system
- Use the template above

### "Resolution too high for my screen"
- Default is 1280x720
- Adjust with --resolution flag
- Headless mode supports any resolution

### "Test running in background, can't see it"
- Check if --headless flag is set
- Remove flag for visual mode
- Verify browser launch settings

## 💡 Best Practices

1. **Always warn before visual tests**
2. **Default to 720p for speed**
3. **Use 4K only for special captures**
4. **Run headless for CI/CD**
5. **Document what the AI sees**
6. **Take screenshots of bugs**
7. **Share interesting playtests**

## 🎬 Special Features

### Slow Motion Mode
```bash
# Watch critical moments in slow motion
SLOW_MOTION=500 npx tsx src/tests/visual/simple-playtest.ts
```

### Video Recording
```bash
# Record the entire playtest
RECORD_VIDEO=true npx tsx src/tests/visual/simple-playtest.ts
```

### Commentary Mode
```bash
# AI narrates what it's doing
COMMENTARY=true npx tsx src/tests/visual/simple-playtest.ts
```

## 📚 Further Reading

- [Test Running Guide](docs/TEST_RUNNING_GUIDE.md) - Detailed test documentation
- [Visual Test Integration](docs/Consultant-Proposals/simple_visual_test_proposal/visual_test_integration.md)
- [Agent Manual](REVOLUTION/06-claude-task-agent-manual-v2.md) - Testing section

---

*Remember: Chris wants to watch his AI children play his game! Make it visual, make it fun, make it informative!*

*Test infrastructure maintained by Martin (Test Runner Specialist)*
*Visual testing revolution implemented: 2025-06-25*