# Enemy Respawn Fix Report

## Issue Summary
Chris reported that enemies were disappearing in normal mode but persisting better in agent mode (?agent=true), with respawning being "a bit off".

## Root Cause Analysis

### The Problem
1. **Premature Enemy Removal**: When a player encountered an enemy, the `checkForEnemyEncounter` method would:
   - Start the battle with `START_BATTLE`
   - Immediately remove the enemy from state with `REMOVE_ENEMY`

2. **Double Removal**: When the battle ended, `END_BATTLE` would try to remove the enemy again:
   - Filter out defeated enemies from the state
   - This prevented the PatrolSystem from tracking and respawning them

3. **Broken Respawn Loop**: The PatrolSystem could only respawn enemies that existed in the game state, but defeated enemies were completely removed.

### Why Agent Mode Seemed Different
The perceived difference between normal and agent mode was likely due to:
- Agent mode skipping splash/intro screens, leading to different timing
- Different player movement patterns in testing
- The issue affecting all modes equally, but being more noticeable in certain play patterns

## The Fix

### 1. Modified Enemy Encounter Logic
```typescript
// Before: Removed enemy immediately on encounter
this._dispatch({ type: 'START_BATTLE', payload: { enemies: [enemy] } });
this._dispatch({ type: 'REMOVE_ENEMY', payload: { enemyId: enemy.id } }); // REMOVED THIS

// After: Only starts battle, lets PatrolSystem handle visibility
this._dispatch({ type: 'START_BATTLE', payload: { enemies: [enemy] } });
```

### 2. Updated Battle End Logic
```typescript
// Before: Filtered out defeated enemies
newState.enemies = state.enemies.filter(e => !defeatedEnemyIds.includes(e.id));

// After: Keeps enemies in state for respawning
newState.enemies = state.enemies;
```

### 3. Enhanced Enemy Visibility Logic
Added logic to hide enemies that are:
- Currently in battle
- In RESPAWNING state (defeated, waiting to respawn)

```typescript
// Skip enemies that are currently in battle
const enemiesInBattle = this._currentGameState.battle ? 
  this._currentGameState.battle.enemies.map(e => e.id) : [];

if (enemiesInBattle.includes(enemy.id)) {
  return; // Don't show on map
}
```

## How Enemy Respawning Now Works

1. **Enemy Encounter**: Enemy starts battle but remains in game state
2. **During Battle**: Enemy is hidden from the map (not shown visually)
3. **Battle Victory**: Enemy is marked as defeated in PatrolSystem
4. **Respawn Timer**: 
   - Day: 2 minutes
   - Night: 1.5 minutes (25% faster)
5. **Respawn**: Enemy reappears at original position with full health

## Testing
Created a test script at `src/tests/test-enemy-respawn.ts` to verify:
- Enemies remain in state after defeat
- Defeated enemies are marked as RESPAWNING
- Respawn timers work correctly
- Enemies reappear after the timer expires

## Benefits
1. **Consistent Behavior**: Enemy respawning now works the same in all modes
2. **Proper State Management**: Enemies are tracked throughout their lifecycle
3. **No Data Loss**: Original enemy data is preserved for accurate respawning
4. **Better Performance**: No unnecessary state removals and re-additions

## Notes for Chris
- Enemies will now consistently respawn after being defeated
- The respawn time is 2 minutes during day, 1.5 minutes at night
- Boss enemies (Segfault Sovereign) never respawn
- You can adjust respawn times in `PatrolSystem.ts` line 596 if needed