# Tales of Claude - AI Adventure Game

You are building a 2D adventure game using emojis and ASCII art. This is a field test for Delegate - use it for EVERYTHING!

## Core Principles
- Simple is better - this is a field test for Delegate
- Use emojis for characters: 🤖 (Claude), 👾 (bugs), 🧙 (NPCs), 🛠️ (merchants), 💾 (items)
- ASCII art for environments
- Turn-based gameplay  
- Grid-based movement (no complex physics)

## Development Workflow
Use Delegate for ALL code generation:
1. Generate ONE file at a time (not entire systems)
2. ALWAYS use write_to to save files (zero tokens!)
3. Build iteratively - models first, then game logic, then UI
4. Use the compile-fix loop when TypeScript complains

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

## Current Status
Starting fresh - no code yet! Begin with project setup, then models, then core engine.

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