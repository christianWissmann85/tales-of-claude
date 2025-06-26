# 🎮 Visual Testing Quick Reference Card

## 🚨 NEW! BULLETPROOF Screenshot Tool (100% Reliable!)

### One-Line Commands That ALWAYS Work:
```bash
# Basic game screenshot (instant with agent mode)
npx tsx src/tests/visual/screenshot-bulletproof.ts my-screenshot

# Open inventory
npx tsx src/tests/visual/screenshot-bulletproof.ts inventory --action key:i

# Open quest journal  
npx tsx src/tests/visual/screenshot-bulletproof.ts quests --action key:j

# Move player
npx tsx src/tests/visual/screenshot-bulletproof.ts after-move --action key:ArrowRight
```

**Why it's bulletproof:**
- ✅ Auto-detects and bypasses splash screen
- ✅ Waits for game elements, not just timers
- ✅ 3 retry attempts built-in
- ✅ Clear error messages
- ✅ Works EVERY time!

---

## Always Show Warning First!
```typescript
await showVisualTestWarning({
  agentName: 'Your Name',
  agentRole: 'Your Role',
  testDescription: 'What you're testing',
  resolution: { width: 1280, height: 720 },
  estimatedDuration: '~30 seconds'
});
```

## Command Cheat Sheet

### Visual Mode (Default)
```bash
# Standard resolution (720p)
npx tsx src/tests/visual/simple-playtest.ts

# HD testing (1080p)
npx tsx src/tests/visual/simple-playtest.ts
RESOLUTION=1920x1080 npx tsx src/tests/visual/any-test.ts

# 4K glory mode!
npx tsx src/tests/visual/screenshot-hires.ts --resolution=3840x2160
```

### Headless Mode (When Needed)
```bash
# Add --headless flag
npx tsx src/tests/visual/simple-playtest.ts --headless

# Or use environment variable
HEADLESS=true npx tsx src/tests/visual/simple-playtest.ts
```

## Fun Modes

```bash
# Slow motion
SLOW_MOTION=500 npx tsx src/tests/visual/simple-playtest.ts

# With commentary
COMMENTARY=true npx tsx src/tests/visual/simple-playtest.ts

# Record video
RECORD_VIDEO=true npx tsx src/tests/visual/simple-playtest.ts
```

## Resolution Guide

| Resolution | Use Case | Chris's Take |
|------------|----------|--------------|
| 1280x720   | Quick tests, standard verification | "Fast and good enough" |
| 1920x1080  | UI testing, detailed checks | "My preferred resolution" |
| 2560x1440  | High-detail verification | "When it needs to be crisp" |
| 3840x2160  | Showing off, final demos | "My 4070 Super loves this!" |

## Warning Countdown

**MANDATORY** for all visual tests:
1. 🎮 Show warning message
2. ⏰ 3-second countdown
3. 🚀 Launch browser
4. 📸 Take screenshots
5. 📝 Document findings

## Remember

- **Visual First**: Default to visual unless you need headless
- **Warn Always**: 3-second warning is non-negotiable  
- **High Res for Chris**: He has the hardware, use it!
- **Document Everything**: Screenshots tell the story
- **Have Fun**: It's a game - enjoy testing it!

---
*Quick reference by Martin, Test Runner Specialist*
*"If Chris can't see it, it didn't happen!"*