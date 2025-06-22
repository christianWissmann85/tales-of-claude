# Task Agent Action Plan for Tales of Claude

## Priority 1: Critical Fixes (Deploy First)
### Task Agent 1: Dungeon Key System Fix
**Mission**: Implement key-based door unlocking system
**Files to create/modify**:
- `src/components/GameEngine/GameEngine.tsx` (update interaction logic)
- `src/engine/InteractionSystem.ts` (new file for door unlocking)
- `src/types/global.types.ts` (add door/key types)

**Instructions**: "Fix the locked door blocking progression in Debug Dungeon. The Boss Key item already exists. Create an interaction system that checks for keys when player tries to walk through locked doors. Update the tile to 'floor' when unlocked."

**Time**: 1 hour

---

## Priority 2: Core Features (Deploy in Order)

### Task Agent 2: Character Screen Implementation
**Mission**: Create character screen with equipment display
**Files to create**:
- `src/components/CharacterScreen/CharacterScreen.tsx`
- `src/components/CharacterScreen/CharacterScreen.module.css`
- Update `src/hooks/useKeyboard.ts` (add 'C' key)
- Update `src/components/GameBoard/GameBoard.tsx` (render screen)

**Instructions**: "Create a character screen that shows player stats, equipped items (weapon/armor/accessory slots), and current status effects. Make it toggle with 'C' key. Use ASCII art borders."

**Time**: 2 hours

### Task Agent 3: Intro Sequence System
**Mission**: Build splash screen and opening cutscene
**Files to create**:
- `src/components/IntroSequence/IntroSequence.tsx`
- `src/components/IntroSequence/IntroSequence.module.css`
- `src/scenes/OpeningScene.tsx`
- Update `src/context/GameContext.tsx` (add intro state)

**Instructions**: "Create a skippable intro sequence with ASCII art splash screen and opening story. Player can skip with Space/Enter. Show Claude booting up in the digital world."

**Time**: 2 hours

### Task Agent 4: Battle Visual Enhancement
**Mission**: Add ASCII art to battle scenes
**Files to create**:
- `src/components/Battle/BattleVisuals.tsx`
- `src/assets/battleBackgrounds.ts`
- Update `src/components/Battle/Battle.tsx`

**Instructions**: "Create ASCII art battle backgrounds and enemy sprites. Add attack animations using CSS. Create different backgrounds for different areas (dungeon, forest, etc)."

**Time**: 3 hours

---

## Priority 3: Enhancement Features

### Task Agent 5: Talent System Core
**Mission**: Implement talent/skill progression system
**Files to create**:
- `src/models/TalentTree.ts`
- `src/components/TalentScreen/TalentScreen.tsx`
- `src/components/TalentScreen/TalentScreen.module.css`
- Update `src/models/Player.ts` (add talent points)

**Instructions**: "Create a talent system where players spend points to upgrade abilities. Each ability has 3 tiers. Add talent points on level up. Create visual tree layout."

**Time**: 3 hours

### Task Agent 6: Inventory Overhaul
**Mission**: Separate equipment from consumables
**Files to modify**:
- `src/components/Inventory/Inventory.tsx` (add tabs)
- `src/components/Inventory/Inventory.module.css`
- Create `src/components/Equipment/Equipment.tsx`

**Instructions**: "Split inventory into tabs: Consumables, Equipment, Key Items, Quest Items. Add sorting and better visual organization. Show item descriptions on hover."

**Time**: 2 hours

### Task Agent 7: Visual Feedback System
**Mission**: Add damage numbers and status indicators
**Files to create**:
- `src/components/DamageNumbers/DamageNumbers.tsx`
- `src/components/StatusIndicators/StatusIndicators.tsx`
- `src/hooks/useVisualEffects.ts`

**Instructions**: "Create floating damage numbers in battles. Add status effect icons above entities. Create health/energy bar animations. Add screen shake for critical hits."

**Time**: 2 hours

---

## Deployment Strategy

1. **Sequential Deployment**: Deploy Task Agents one at a time
2. **Testing Between**: Run `npm run dev` and test each feature
3. **Type Check**: Run `npm run type-check` after each agent
4. **Commit Often**: Git commit after each successful feature

## Total Estimated Time: 15 hours (with AI assistance)

## Key Success Factors
- Each agent has ONE clear objective
- All file paths are absolute
- Context files are attached for consistency
- Use `write_to` for all file generation
- Test incrementally