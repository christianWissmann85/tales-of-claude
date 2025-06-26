# Bug Fixer Guide - Tales of Claude
*Everything a bug-fixing agent needs in ~1,500 tokens*

## Common Issues & Solutions

### 1. Type Errors
**Pattern**: "Property 'X' does not exist on type 'Y'"
```typescript
// Problem: Missing interface properties
// Solution: Check models/*.ts for interface definitions
// Quick fix: Add property with optional chaining
item?.property || defaultValue
```

### 2. UI Rendering Issues
**Floor Tile Problem** (Solved by Ivan)
```typescript
// Problem: Black tiles covering game
// Solution: GameBoard.module.css
.floorTile { 
  background-color: ''; // Empty string!
  opacity: 0.5;
}
```

### 3. State Management
**Pattern**: React Context issues
```typescript
// Always check GameContext.tsx first
// Common: Missing provider wrap
<GameProvider>
  <App />
</GameProvider>
```

### 4. Save/Load Bugs
**LocalStorage quirks**
```typescript
// Problem: Circular references
// Solution: Custom replacer
JSON.stringify(state, (key, value) => {
  if (key === 'circularRef') return undefined;
  return value;
});
```

## Debugging Workflow

1. **Reproduce First**
   ```bash
   npm run dev
   # Navigate to issue
   # Open console (F12)
   ```

2. **Check Type Errors**
   ```bash
   npm run type-check > type-errors.txt
   # Attach to delegate!
   ```

3. **Find Related Code**
   ```bash
   # Use ripgrep, not grep!
   rg "error keyword" src/
   ```

4. **Check Recent Fixes**
   ```bash
   ls -la .claude/field-test-reports/*fix*.md | tail -5
   ```

## Tools & Commands

### Essential Debugging
```bash
# Browser console commands
window.gameEngine.getState()  # Current game state
window.runAutomatedTests()    # Quick test suite

# File analysis
rg -A5 -B5 "problem area" src/  # Context search
npm run type-check              # Full type analysis
```

### Token-Efficient Fixes
```typescript
// Use MultiEdit for multiple changes
MultiEdit({
  file_path: "/path/to/file.ts",
  edits: [
    { old_string: "bug1", new_string: "fix1" },
    { old_string: "bug2", new_string: "fix2" }
  ]
})
```

## Known Issues Database

### Combat System
- **Damage calculation**: Check `CombatSystem.ts:calculateDamage()`
- **Turn order**: See `Battle.tsx:processTurn()`
- **Status effects**: `models/StatusEffect.ts`

### Inventory
- **Item stacking**: `Inventory.ts:addItem()` 
- **Equipment slots**: `Player.ts:equipItem()`
- **Save corruption**: Always test save/load after changes

### UI/Visual
- **Z-index conflicts**: Check CSS modules
- **Responsive breaks**: Test at 768px, 1024px
- **Animation glitches**: `transition` vs `animation`

## Field Report References

Essential reads for context:
- `victor-critical-bug-specialist-*.md` - Emergency fixes
- `ivan-floor-tile-specialist-*.md` - UI debugging mastery
- `james-type-check-cleanup-*.md` - TypeScript patterns

## Quick Wins

1. **Clear error first**: Type errors block everything
2. **Test immediately**: One fix might break another
3. **Document pattern**: If it's tricky, others will hit it
4. **Use delegate smartly**: Attach errors + working examples

## Remember
- Chris wants it FIXED, not explained
- Test the fix in-game, not just in theory
- Other agents depend on stability
- Every bug is a chance to strengthen the system

---
*"Bugs fear those who understand them"*