# Field Test Report: Patricia - Emergency Viewport Fix

**Agent**: Patricia (UI Panel Specialist)
**Date**: 2025-06-25
**Task**: Fix collapsed game viewport and React Hooks error
**Status**: ✅ CRITICAL ISSUES RESOLVED

## Summary
Responded to emergency call - main game viewport had collapsed to single line and agent mode showed black screen with React Hooks errors. Successfully diagnosed and fixed multiple issues to restore full game functionality.

## Issues Identified

### 1. React Hooks Order Violation (CRITICAL)
- **Problem**: Early return statement at line 135 AFTER hooks were called
- **Impact**: React Hooks error causing black screen
- **Solution**: Moved all hooks (useState, useRef, useMemo) before any conditional returns

### 2. Missing CSS Classes
- **Problem**: `fpsCounter` and `asciiToggle` classes referenced but not defined
- **Impact**: Potential layout issues with FPS counter
- **Solution**: Added complete CSS definitions with proper styling

### 3. Wrong CSS Class Reference
- **Problem**: MapGrid using `styles.mapGridContainer` which doesn't exist
- **Impact**: Map grid layout broken
- **Solution**: Changed to use correct `styles.mapContainer` and `styles.grid`

### 4. Multiple Dev Servers
- **Problem**: Ports 5173-5175 all occupied by stale processes
- **Impact**: Confusion about which server to connect to
- **Solution**: Killed all processes, fresh start on port 5176

## Technical Details

### React Hooks Fix
```typescript
// BEFORE (BROKEN):
const GameBoard = () => {
  const { state } = useGameContext();
  // ... more hooks ...
  
  if (state.loading) return <Loading />; // WRONG! Conditional return before all hooks
  
  const inventory = useMemo(...); // This hook wouldn't be called consistently
}

// AFTER (FIXED):
const GameBoard = () => {
  const { state } = useGameContext();
  const inventory = useMemo(...); // All hooks called first
  // ... all other hooks ...
  
  if (state.loading) return <Loading />; // Conditional returns AFTER all hooks
}
```

### CSS Additions
- Added `.fpsCounter` with absolute positioning
- Added `.asciiToggle` button styling
- Both styled to match existing UI theme

## Verification
- ✅ Game viewport displays full map area
- ✅ No React errors in console
- ✅ Both human and agent modes working
- ✅ FPS counter and ASCII toggle visible
- ✅ All UI panels in correct positions

## Lessons Learned
1. **React Hooks are strict**: Never put conditional returns before hooks
2. **CSS class names must match**: Always verify both sides
3. **Check server ports**: Multiple servers can cause phantom issues
4. **Emergency fixes need speed**: Diagnose fast, fix precisely

## Time Invested
- Diagnosis: 10 minutes
- Implementation: 5 minutes
- Verification: 5 minutes
- Total: 20 minutes

## Recommendations
1. Add ESLint rule for React Hooks to catch these errors
2. Consider CSS modules type checking
3. Add server port management to dev scripts
4. Keep emergency response protocols ready

## For Future Agents
- Always check React Hooks order first for black screens
- Use correct port when taking screenshots
- Verify CSS classes exist before using them
- Kill stale servers before debugging "mysterious" issues

---

*"When the viewport collapses, check your hooks!" - Patricia*