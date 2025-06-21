# Tales of Claude - AI Adventure Game

You are building a 2D adventure game using emojis and ASCII art. This is a field test for Delegate - use it for EVERYTHING!

## Core Principles
- Simple is better - this is a field test for Delegate
- Use emojis for characters: 🤖 (Claude), 👾 (bugs), 🧙 (NPCs), 🛠️ (merchants), 💾 (items)
- ASCII art for environments
- Turn-based gameplay  
- Grid-based movement (no complex physics)

## Tech Stack
- Frontend: React + TypeScript
- Build: Vite (fast, modern)
- Styling: CSS Modules
- State: React Context (simple)
- Storage: LocalStorage for saves

## File Naming Convention
- Components: PascalCase (GameBoard.tsx)
- Utilities: camelCase (movePlayer.ts)
- Types: PascalCase with .types.ts (Player.types.ts)
- Tests: .test.ts suffix

## Key Commands You'll Need
```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run check    # TypeScript type checking
npm run lint     # ESLint checking
```

## Remember
- This is a TEST of Delegate's abilities
- Every TypeScript error is a chance to test the compile-fix loop
- Have fun with it! Add puns, easter eggs, whatever makes you smile 🎮

---

## 🎮 Current Status
We have a WORKING GAME with COMBAT! Movement, NPCs, dialogue, and battles all work!

## 🚀 Delegate Mastery Guide

### The Golden Rules (Learned Through Experience)
1. **One file at a time** - This is THE rule. Never try to generate multiple files.
2. **Always use write_to** - NEVER read content if you're going to save it. Zero tokens!
3. **Context files are your friend** - Attach 2-4 relevant files for best results
4. **Trust the compile-fix loop** - TypeScript errors are opportunities, not problems

### Delegate Workflow That Works
```bash
# The magic formula:
1. Generate file with gemini-2.5-flash
2. write_to immediately (zero tokens!)
3. Run type-check
4. If errors: save to errors.txt and delegate fix
5. Repeat until TypeScript is happy
```

### Model Selection Wisdom
- **gemini-2.5-flash**: Your workhorse! Fast, reliable, perfect for 99% of tasks
- **gemini-2.5-pro**: Only for complex architectural decisions
- **claude models**: Save for when you need precise instruction following

### Lessons Learned
1. **The GameEngine lifecycle bug**: Always check useEffect dependencies!
2. **Import paths matter**: ../assets vs ../../assets can break everything
3. **TypeScript is your friend**: Every error caught saves 10 minutes of debugging
4. **Debug with console.log**: When movement stops, log everything

### Tips & Tricks
- Generate → write_to → test → fix (in that order, always)
- When debugging, add console.logs via Delegate
- CSS modules need type declarations (css-modules.d.ts)
- Always check browser console when things don't work

## 📋 Next Session Game Plan

### Session 2: Combat System ✅ COMPLETE!
```
✅ Created Enemy model class with 4 enemy types
✅ Built BattleSystem engine with turn-based combat
✅ Created Battle scene component with full UI
✅ Wired up enemy encounters on the map
✅ Implemented player abilities (Debug, Refactor, Compile, Analyze)
✅ Tested the compile-fix loop with battle logic
```

### Session 2 Lessons Learned:
- Small edits → Claude handles directly
- Big files/rewrites → Delegate is perfect
- Always tell Delegate to create "complete file"
- Code fences need manual cleanup (worth it for token savings!)
- Battle system needs polish but core mechanics work!

### Session 3: Items & Inventory
```
1. Create Item model
2. Create Inventory component
3. Add items to maps
4. Implement item pickup
5. Create inventory UI
6. Connect items to battle system
```

### Session 4: Save System & Map Expansion
```
1. Implement LocalStorage save
2. Make Compiler Cat actually save the game
3. Create Binary Forest map
4. Add map transitions
5. Create more NPCs
```

## 🛠️ Technical Improvements Needed
- Remove debug console.logs from GameEngine
- Add .gitignore for node_modules
- Consider state persistence between sessions
- Add loading screen for initial render

## 🎯 Development Strategy
1. Keep using Delegate for EVERYTHING
2. Maintain the one-file-at-a-time discipline  
3. Let TypeScript guide us (errors = free consulting)
4. Test frequently in the browser
5. Commit after each major feature

## 📊 Session Stats

### Session 1:
- Time: ~2 hours
- Files created: 37
- Tokens saved: ~77,000
- Result: Working game with movement, NPCs, dialogue

### Session 2:
- Time: ~2 hours
- Files created/modified: 8
- Tokens saved: ~60,000+
- Result: Full combat system with enemies, abilities, and battles!

## 🤝 The Human-AI Dynamic
- Human: Vision, testing, debugging, decisions
- AI (me): Rapid implementation via Delegate
- Delegate: The bridge that makes it all possible

Remember: We're not just building a game, we're pioneering a new way of developing software through true Human-AI collaboration!