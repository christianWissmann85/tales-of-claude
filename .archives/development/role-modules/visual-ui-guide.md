# Visual/UI Guide - Tales of Claude
*UI/Visual agent essentials in ~1,500 tokens*

## Visual Hierarchy (Critical!)

### The Problem Chris Keeps Mentioning
"It's clunky" = Visual hierarchy is broken

**Current Issues**:
1. Emoji overlap on maps
2. Text hard to read  
3. Buttons don't look clickable
4. No clear focus path

**Solutions**:
```css
/* Layer system */
.mapTile { z-index: 1; }
.mapEntity { z-index: 2; }  
.player { z-index: 3; }
.ui-overlay { z-index: 100; }

/* Visual weight */
.primary-action { 
  font-weight: bold;
  font-size: 1.2em;
  border: 2px solid;
}
```

## Screenshot First!

**ALWAYS** capture current state:
```bash
# In browser console
# 1. Set up view
# 2. Press Cmd+Shift+4 (Mac) or use screenshot tool
# 3. Save to test-reports/screenshots/
# 4. Read with Read tool to verify
```

Chris learns visually - show, don't describe!

## Component Structure

### Key Files
```
src/components/
├── GameBoard/
│   ├── GameBoard.tsx        # Main game view
│   ├── GameBoard.module.css # Critical styles
│   └── MapGrid.tsx          # Tile rendering
├── Battle/
│   ├── Battle.module.css    # Combat UI
│   └── BattleAnimations.ts  # Visual effects
└── UI/
    ├── Button.tsx           # Reusable components
    └── Panel.module.css     # UI containers
```

### CSS Module Pattern
```css
/* Component.module.css */
.container {
  /* Scoped automatically */
}

/* Global overrides in index.css only */
```

## Emoji Rendering

### Map Tiles
```typescript
// MapGrid.tsx patterns
const TILE_DISPLAY = {
  grass: '🌱',
  tree: '🌲',
  // Size matters!
  fontSize: '24px', // Minimum for clarity
}
```

### Overlap Prevention
```css
.mapTile {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden; /* Prevent bleed */
}
```

## Responsive Design

### Breakpoints
```css
/* Mobile first */
.gameBoard { 
  grid-template-columns: repeat(10, 1fr);
}

@media (min-width: 768px) {
  .gameBoard {
    grid-template-columns: repeat(15, 1fr);
  }
}

@media (min-width: 1024px) {
  .gameBoard {
    grid-template-columns: repeat(20, 1fr);
    /* BIGGER MAPS! */
  }
}
```

## Color & Contrast

### Accessibility
```css
/* Minimum contrast ratios */
.text-on-dark {
  color: #ffffff;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

.interactive:hover {
  /* Clear state change */
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
```

## Animation Guidelines

### Performance-Safe
```css
/* GPU-accelerated only */
.animated {
  transform: translateX(0);
  will-change: transform;
}

/* Avoid */
.bad { left: 0; } /* Triggers reflow */
```

### Game Feel
```css
/* Snappy response */
.button {
  transition: all 0.1s ease-out;
}

/* Smooth movement */
.player {
  transition: transform 0.2s ease-in-out;
}
```

## Common UI Patterns

### Status Bars
```tsx
<div className={styles.healthBar}>
  <div 
    className={styles.healthFill}
    style={{ width: `${(hp/maxHp) * 100}%` }}
  />
</div>
```

### Floating Text
```css
.damageNumber {
  position: absolute;
  animation: floatUp 1s ease-out forwards;
}

@keyframes floatUp {
  to { 
    transform: translateY(-30px);
    opacity: 0;
  }
}
```

## Testing Visual Changes

1. **Before/After Screenshots**
2. **Multiple viewports** (mobile/tablet/desktop)
3. **Different game states** (battle/exploration/menu)
4. **Get Chris's feedback** early!

## Field Report References

Must-reads:
- `marie-visual-clarity-specialist-*.md`
- `sonia-color-harmony-expert-*.md` 
- `nolan-visual-enhancement-*.md`

## Quick Tips

- **Simplicity > Complexity** for Chris
- **Contrast is king** for readability
- **Test on actual gameplay**, not in isolation
- **Performance matters** - 60fps or bust
- **Screenshot everything** for Chris

---
*"Great UI is invisible until you need it"*