# Core Essentials - Tales of Claude
*Everything you need to know in 755 tokens*

## Project Identity
**Tales of Claude**: 2D adventure game where Claude (🤖) battles bugs in the Code Realm. Built via Human-AI collaboration using REVOLUTION workflow.

## Key Facts
- **Platform**: React + TypeScript, Vite build
- **Testing**: Custom Node.js runner, 99.5% coverage
- **Save System**: LocalStorage via Compiler Cat
- **Maps**: Terminal Town, Binary Forest, Debug Dungeon
- **Context Limit**: 64k tokens - use wisely!

## Essential Commands
```bash
npm run dev          # Start dev server (port 5173)
npm run build        # Production build
npm run type-check   # TypeScript checking

# Testing
npx tsx src/tests/node-test-runner.ts      # Logic tests
npx tsx src/tests/puppeteer-test-runner.ts  # Browser tests
```

## Directory Structure
```
src/
├── components/     # React UI components
├── models/        # Game logic (Player, Combat, etc)
├── engine/        # Core systems (GameEngine.ts)
├── scenes/        # Battle, dialogue scenes
├── tests/         # Test suite
└── assets/       # Maps, dialogues JSON

.claude/          # Agent memories & reports
REVOLUTION/       # Workflow documentation
```

## Critical Rules (Chris's Law)
1. **BIGGER MAPS** - Chris mentions this constantly
2. **Test Everything** - Break = immediate fix
3. **Emoji Usage** - Game yes (🤖), reports no
4. **Delegate with write_to** - Saves massive tokens
5. **Read Reports First** - Learn from others' pain

## Token-Saving Patterns
```typescript
// GOOD: Use write_to
delegate_invoke({
  prompt: "Create character system",
  write_to: "src/models/Character.ts" // No tokens returned!
})

// BAD: Return content
const result = delegate_invoke({...}) // Burns tokens
```

## Where to Learn More
- **Your Diary**: `.claude/task-agents/[your-name]/diary.md`
- **Team Wisdom**: `REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md`
- **Field Reports**: `.claude/field-test-reports/`
- **Full Manual**: `REVOLUTION/06-claude-task-agent-manual-v2.md`

## Quick Reference
- **Segfault Sovereign**: Final boss
- **Compiler Cat**: Save point NPC
- **Binary Forest**: Where debugging gets recursive
- **Chris**: Human visionary (ADHD, needs summaries)
- **Annie**: AI Team Lead (never codes)

## Remember
"In the Code Realm, bugs are not enemies - they're opportunities for growth."

---
*Token count: ~755 (97.8% reduction from original 34,168!)*