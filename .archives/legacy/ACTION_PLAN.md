# Action Plan - Tales of Claude Development

## Your Setup Steps

### 1. Create New Repository
```bash
# Create and navigate to new repo
mkdir ~/repos/Tales-of-Claude
cd ~/repos/Tales-of-Claude
git init

# Copy the provided files
# Copy CLAUDE.md, GAME_DESIGN.md, and TECH_SPEC.md to the root
```

### 2. Open Claude Code
```bash
# In the Tales-of-Claude directory
claude
```

### 3. Initial Commands for Claude

Start with project setup:
```
Let's set up Tales of Claude! Please:
1. Use Delegate to create package.json with React, TypeScript, and Vite
2. Use Delegate to create tsconfig.json with strict TypeScript settings
3. Use Delegate to create vite.config.ts for our build setup
4. Use Delegate to create .eslintrc.json and .prettierrc for code quality
```

Then create the folder structure:
```
Create the project structure:
1. Use Delegate to create the directory structure from TECH_SPEC.md
2. Use Delegate to create a simple README.md
```

### 4. Start Building Core Systems

Begin with models:
```
Let's create the game models:
1. Use Delegate to create src/types/global.types.ts with all our TypeScript interfaces
2. Use Delegate to create src/models/Player.ts with the Player class
3. Use Delegate to create src/models/Map.ts for the game world
```

Move to the engine:
```
Build the game engine:
1. Use Delegate to create src/engine/GameEngine.ts with the core game loop
2. Use Delegate to create src/engine/MovementSystem.ts for player movement
3. Use Delegate to create src/hooks/useKeyboard.ts for input handling
```

Create initial components:
```
Create the React components:
1. Use Delegate to create src/components/GameBoard/GameBoard.tsx for the main game view
2. Use Delegate to create src/components/StatusBar/StatusBar.tsx for HP/Energy display
3. Use Delegate to create src/App.tsx to tie it all together
```

### 5. The Compile-Fix Loop

After generating files:
```
Let's get it running:
1. Run npm install
2. Run npm run dev
3. If there are TypeScript errors, use Delegate to fix them
4. If ESLint complains, use Delegate to fix those too
```

Example fix cycle:
```
I see TypeScript errors in the build output. Please:
1. Use Delegate to fix the type errors in src/models/Player.ts
2. Use Delegate to fix the import errors in src/App.tsx
```

### 6. Iterative Development

Add features one at a time:
```
Let's add player movement:
1. Use Delegate to enhance MovementSystem.ts with collision detection
2. Use Delegate to create src/assets/maps/terminalTown.ts with our first map
3. Test movement, fix any issues
```

```
Now let's add the combat system:
1. Use Delegate to create src/engine/CombatSystem.ts
2. Use Delegate to create src/components/Battle/Battle.tsx
3. Use Delegate to create src/models/Enemy.ts
```

## Key Principles

### 1. One File at a Time
❌ "Create the entire combat system"
✅ "Create src/engine/CombatSystem.ts with basic turn management"

### 2. Always Use write_to
Every Delegate command should end with writing to disk:
```
Use Delegate to create src/models/Item.ts for game items
[Claude will use write_to: "src/models/Item.ts"]
```

### 3. Context Building
Pass previous files as context:
```
Use Delegate to create src/components/Inventory/Inventory.tsx 
using the Item model we just created
```

### 4. Embrace the Errors
TypeScript and ESLint errors are GOOD - they test Delegate's fix capabilities:
```
The build is failing with type errors. Use Delegate to read the
error output and fix src/engine/GameEngine.ts
```

## Development Milestones

### Milestone 1: "Hello Claude" (Day 1-2)
- [ ] Project setup complete
- [ ] Basic rendering working
- [ ] Player appears on screen
- [ ] Can move around empty map

### Milestone 2: "World Building" (Day 3-5)
- [ ] Terminal Town map complete
- [ ] NPCs you can talk to
- [ ] Basic dialogue system
- [ ] Map transitions working

### Milestone 3: "Battle Ready" (Day 6-8)
- [ ] Combat system implemented
- [ ] First enemy type working
- [ ] Player can win/lose battles
- [ ] Experience and leveling

### Milestone 4: "Content Time" (Day 9-12)
- [ ] Multiple maps created
- [ ] Items and inventory
- [ ] Save/load system
- [ ] First boss battle

### Milestone 5: "Polish" (Day 13-14)
- [ ] Sound effects (if time)
- [ ] Victory conditions
- [ ] Bug fixes
- [ ] Final touches

## Common Issues & Solutions

### TypeScript Errors
```
Solution: Copy error output to errors.txt, then:
"Use Delegate to fix the TypeScript errors in [file], here's the error output"
```

### Module Not Found
```
Solution: Check imports and file paths:
"Use Delegate to fix the import errors in [file]"
```

### React Hook Errors
```
Solution: Rules of Hooks violations:
"Use Delegate to fix the React hooks error in [component]"
```

### Performance Issues
```
Solution: Optimize rendering:
"Use Delegate to add React.memo to GameBoard component"
```

## Success Metrics

1. **Delegate Usage**: 100+ successful file generations
2. **Token Savings**: Track how many tokens saved with write_to
3. **Fix Success Rate**: How well Delegate handles TypeScript errors
4. **Development Speed**: Complete game in 2 weeks
5. **Fun Factor**: Is it actually playable and enjoyable?

## Tips for Maximum Success

1. **Start your day with `npm run check`** - Find all TypeScript errors
2. **Commit often** - Each working feature should be a commit
3. **Test frequently** - Run the game after each major addition
4. **Keep notes** - Document what works well with Delegate
5. **Have fun** - Add easter eggs, jokes, whatever makes you smile!

## Remember

This is a field test for Delegate. The goal is to:
- Generate an entire game using AI
- Save massive amounts of tokens
- Test the compile-fix loop thoroughly
- Have fun while doing it!

Every error is an opportunity to test Delegate's capabilities. Every file generated is tokens saved. Let's build something awesome! 🎮🤖

---

**Pro tip**: Keep this ACTION_PLAN.md open in a split screen while developing. It's your roadmap to success!