Here's the Integration Guide for the discovered but unintegrated (or partially integrated) features in Tales of Claude, tailored for Chris and his team.

---

# Integration Guide for Hidden Features in Tales of Claude

## Overview
The codebase contains several fully or partially implemented features that were never fully connected to the main game loop or UI. This guide details how to activate, complete, and test these features, turning "integration breadcrumbs" into fully functional game mechanics.

This guide assumes you have a working development environment and familiarity with the existing codebase structure (React, TypeScript, GameEngine, GameContext).

## Quick Integration Checklist

### 1. PatrolSystem (Enemy AI Patrols)
- **Current state:** The `PatrolSystem` class is imported and instantiated in `GameEngine.ts`, and its `update` method is called within `GameEngine.updateEntities`. Enemies are initialized with patrol data. The `GameEngine` *does* dispatch `UPDATE_ENEMIES` with new positions. However, enemies might not visibly move or behave dynamically as expected due to subtle interactions or throttling.
- **What it does:** Enables enemies to follow predefined or dynamic patrol routes, detect the player, chase them, and respawn after defeat.
- **Integration steps with code examples:** The core integration is largely in place. The primary focus here is to ensure the `GameEngine` consistently reflects the `PatrolSystem`'s updates in the `GameState` and that the visual representation handles enemy movement smoothly.
- **Testing approach:** Observe enemy movement patterns, chase behavior, and respawn cycles.

### 2. UIManager (Advanced UI State Management)
- **Current state:** The `UIManager` class is imported in `GameEngine.ts` and *is* used for closing all UI panels when `Escape` is pressed (`UIManager.isAnyPanelOpen` and `UIManager.getCloseAllPanelsAction`). However, it is *not* used for opening individual panels via hotkeys (e.g., 'I' for Inventory).
- **What it does:** Provides a centralized, consistent way to manage UI panel visibility, ensuring only one modal panel is open at a time and handling z-index layering.
- **How to replace current UI handling:** Modify `GameEngine._processInput` to use `UIManager.getOpenPanelAction` for hotkey-triggered panel openings.
- **Migration path from current system:** Straightforward replacement of direct `dispatch({ type: 'TOGGLE_PANEL' })` with `UIManager` helper calls.

### 3. PuzzleSystem (Push Block Puzzles)
- **Current state:** The `PuzzleSystem.ts` file exists with core logic for managing puzzle states (register, get, update, save/load). However, the `debugDungeon.ts` map explicitly comments out `puzzleEntities` because they don't match the expected `(Enemy | NPC | Item)[]` type, indicating a fundamental type mismatch and lack of integration with the game's entity system.
- **What it does:** Provides a framework for Sokoban-style block pushing puzzles, switch sequence puzzles, and potentially other environmental interactions.
- **How to fix the type issues:** Define new entity types (e.g., `PushableBlock`, `PressurePlate`, `Switch`) that `GameMap` and `GameEngine` can recognize and interact with.
- **How to add to existing maps:** Re-integrate the `puzzleEntities` into `debugDungeon.ts` (and other maps) once their types are resolved and the `GameMap` can handle them.

### 4. Faction-Based Pricing
- **Current state:** The `applyFactionPricing` function is correctly imported and *already used* in `GameContext.tsx` when opening shops (e.g., for 'Bit Merchant' and 'Memory Merchant'). The ESLint report was slightly inaccurate here. The pricing logic is functional.
- **What it does:** Adjusts shop item prices based on the player's reputation with the NPC's faction.
- **How to enable in Shop component:** The pricing is already enabled. The next step is to *display* the player's reputation and the resulting price modifier directly within the `Shop.tsx` UI for player clarity.
- **Configuration examples:** The `FactionManager` handles reputation tiers and their effects.

### 5. Other Discoveries
- **Dead code that could be revived:** The `GameEngine._processInput` calls `_processInput` *twice* per frame (once in `_gameLoop` and once in `update`). This is redundant and should be fixed.
- **Planned features evident from imports:** The `TalentTree` in `Player.ts` and `GameContext.tsx` is initialized and saved, but its UI and actual gameplay effects might not be fully integrated or visible. This is beyond the scope of this guide but is a related "breadcrumb."

---

## Integration Patterns

### Pattern 1: Activating Dormant Systems (PatrolSystem, PuzzleSystem)

This pattern applies when a system class exists and is imported, but its functionality isn't fully realized in the game loop or its effects aren't consistently reflected in the `GameState`.

1.  **Finding where the system is imported/instantiated:**
    *   Look in `src/engine/GameEngine.ts` and `src/context/GameContext.tsx` for `import { SystemName } from './SystemName';`.
    *   Check the constructor of `GameEngine` or the `useEffect` hook in `GameContext.tsx` for `new SystemName(...)`.
    *   **Example (PatrolSystem):** `GameEngine.ts` already instantiates `_patrolSystem` in its constructor and `setGameState` when the map changes.

2.  **Connecting to game loop/dispatch:**
    *   Identify the `update` method of the system (e.g., `PatrolSystem.update`).
    *   Ensure it's called regularly within `GameEngine.update(deltaTime)`.
    *   Verify that any changes made by the system (e.g., new enemy positions, puzzle solved status) are translated into `GameAction` dispatches to update the `GameState`.
    *   **Example (PatrolSystem):** `GameEngine.updateEntities` already calls `this._patrolSystem.update(...)` and dispatches `UPDATE_ENEMIES`. The issue is likely the *fidelity* of these updates or the `Enemy` object structure.

3.  **Ensuring `GameState` reflects system changes:**
    *   The `GameContext` reducer must correctly process the dispatched actions and create *new* immutable state objects (e.g., `newPlayer = clonePlayer(state.player)` or `newEnemies = updatedEnemies.map(e => ({...e}))`).
    *   For `PatrolSystem`, ensure the `Enemy` objects in `GameState.enemies` are fully replaced or updated with the `PatrolSystem`'s `currentPosition` for each enemy.

4.  **Testing Integration:**
    *   Add console logs within the system's `update` method and the `GameEngine`'s dispatch calls to confirm frequency and data.
    *   Visually observe the game for the expected behavior.

### Pattern 2: Fixing Type Mismatches (PuzzleSystem Entities)

This pattern is crucial when data structures intended for a new system don't align with existing core game types, preventing their integration into the `GameState` and rendering.

1.  **Identify the conflicting types:**
    *   In `debugDungeon.ts`, `puzzleEntities` is `unknown[]` because its elements (`pushable_block`, `pressure_plate`, `switch`) don't conform to `Enemy | NPC | Item`.

2.  **Define new entity interfaces/classes:**
    *   Create `IPushableBlock`, `IPressurePlate`, `ISwitch` interfaces (or classes) in `src/types/global.types.ts` (or a new `src/types/puzzle.types.ts`). These should extend a base `IEntity` interface if one exists, or at least include `id` and `position`.
    *   **Example (`src/types/global.types.ts`):**
        ```typescript
        // Add to global.types.ts
        export interface PushableBlock extends Entity {
          type: 'pushable_block';
          puzzleId: string;
          // Add any other properties like 'isPushed' or 'weight'
        }

        export interface PressurePlate extends Entity {
          type: 'pressure_plate';
          puzzleId: string;
          isActive: boolean; // Whether something is on it
          // Add targetBlockId or other properties for linking
        }

        export interface GameMapEntity extends NPC, Enemy, Item, PushableBlock, PressurePlate {
          // This union type needs to be updated to include new puzzle entities
          // Or, better, define a base Entity interface and extend it.
        }
        ```

3.  **Update `GameMap` to recognize new types:**
    *   Modify `src/models/Map.ts` to include the new entity types in its `entities` array. This might involve updating the `IGameMap` interface and the `GameMap` class constructor.
    *   **Example (`src/models/Map.ts`):**
        ```typescript
        // In GameMap class, update constructor to filter/store new entities
        // Or, better, update the IGameMap interface to allow these types in its `entities` array.
        // The `entities` array in IGameMap (from global.types.ts) needs to be a union of ALL possible entity types.
        // For now, `debugDungeon.ts` casts to `unknown[]` and then `GameContext` filters.
        // The best approach is to define a base `Entity` interface and have all game objects extend it.
        // Then `IGameMap.entities` can be `Entity[]`.
        ```

4.  **Modify map data to use new types:**
    *   In `src/assets/maps/debugDungeon.ts`, replace `unknown[]` with the newly defined types and ensure the objects conform.
    *   **Example (`src/assets/maps/debugDungeon.ts`):**
        ```typescript
        // Before (commented out):
        // const puzzleEntities: unknown[] = [ ... ];

        // After (assuming new types are defined and GameMap can handle them):
        import { PushableBlock, PressurePlate, Switch } from '../../types/puzzle.types'; // Or global.types
        // ...
        const puzzleEntities: (PushableBlock | PressurePlate | Switch)[] = [
          { id: 'push_block_1', type: 'pushable_block', position: { x: 16, y: 14 }, puzzleId: 'block_puzzle' },
          // ... other puzzle entities
        ];
        // ...
        export const debugDungeonData: IGameMap = {
          // ...
          entities: [...npcs, ...enemies, ...items, ...puzzleEntities], // Include new entities
        };
        ```

5.  **Implement interaction logic in `GameEngine`:**
    *   Add methods to `GameEngine` (e.g., `processPushBlock`, `activateSwitch`) that interact with these new entities and update the `PuzzleSystem`.
    *   These methods would be called from `processMovement` or `checkInteractions`.

### Pattern 3: UI Integration (UIManager)

This pattern focuses on centralizing UI panel management for consistency and ease of use.

1.  **Identify current UI toggle logic:**
    *   In `GameEngine._processInput`, find lines like `this._dispatch({ type: 'TOGGLE_INVENTORY' });`.

2.  **Replace with `UIManager` calls:**
    *   Instead of direct `TOGGLE_` dispatches, use `UIManager.getOpenPanelAction(panelName)` or `UIManager.getCloseAllPanelsAction()`.
    *   Since `UIManager.getOpenPanelAction` returns an *array* of actions, you'll need to iterate and dispatch each one.
    *   **Example (`src/engine/GameEngine.ts` - in `_processInput`):**
        ```typescript
        // Before (for Inventory):
        // if (this._isAnyOfKeysPressed(this._pressedKeys, ['KeyI', 'i'])) {
        //   if (now - this._lastUITime > this._uiCooldown) {
        //     this._dispatch({ type: 'TOGGLE_INVENTORY' });
        //     this._lastUITime = now;
        //   }
        // }

        // After (for Inventory, Quest Log, Character Screen, Faction Status):
        // Note: UIManager.getOpenPanelAction returns an array of actions.
        // You need to dispatch each one.
        if (this._isAnyOfKeysPressed(this._pressedKeys, ['KeyI', 'i'])) {
          if (now - this._lastUITime > this._uiCooldown) {
            console.log('[UI Manager] I key pressed - opening Inventory');
            UIManager.getOpenPanelAction('inventory').forEach(action => this._dispatch(action));
            this._lastUITime = now;
          }
        }
        if (this._isAnyOfKeysPressed(this._pressedKeys, ['KeyQ', 'q'])) {
          if (now - this._lastUITime > this._uiCooldown) {
            console.log('[UI Manager] Q key pressed - opening Quest Log');
            UIManager.getOpenPanelAction('questLog').forEach(action => this._dispatch(action));
            this._lastUITime = now;
          }
        }
        if (this._isAnyOfKeysPressed(this._pressedKeys, ['KeyC', 'c'])) {
          if (now - this._lastUITime > this._uiCooldown) {
            console.log('[UI Manager] C key pressed - opening Character Screen');
            UIManager.getOpenPanelAction('characterScreen').forEach(action => this._dispatch(action));
            this._lastUITime = now;
          }
        }
        if (this._isAnyOfKeysPressed(this._pressedKeys, ['KeyF', 'f'])) {
          if (now - this._lastUITime > this._uiCooldown) {
            console.log('[UI Manager] F key pressed - opening Faction Status');
            UIManager.getOpenPanelAction('factionStatus').forEach(action => this._dispatch(action));
            this._lastUITime = now;
          }
        }
        // ESC key logic is already using UIManager, no change needed there.
        ```

3.  **Update help screens/documentation:**
    *   Ensure any in-game help or external documentation reflects the new centralized UI control.

---

## Code Examples

### 1. PatrolSystem (Enemy AI Patrols)

The core `PatrolSystem` integration is already present in `GameEngine.ts`. The primary "integration step" here is more about *verification* and *refinement* to ensure the visual representation of enemies accurately reflects their positions as managed by the `PatrolSystem`.

**Verification Point: `GameEngine.ts` - `updateEntities` method**

The current code already correctly updates enemy positions and dispatches `UPDATE_ENEMIES`. The key is that `updatedEnemy` is a *new object* with the `PatrolSystem`'s `newPosition`, ensuring immutability for React.

```typescript
// src/engine/GameEngine.ts (Excerpt from updateEntities method)

// ... (inside updateEntities)
    if (this._patrolSystem && !this._currentGameState.battle) {
      const now = performance.now();
      if (now - this._lastEnemyUpdateTime < this._enemyUpdateThrottle) {
        return; // Skip this update cycle if throttled
      }

      this._patrolSystem.update(deltaTime, this._currentGameState.player.position);

      const enemiesToRespawn = this._patrolSystem.getEnemiesToRespawn();

      const updatedEnemies: Enemy[] = [];
      let positionsChanged = false;

      // Get enemies currently in battle to exclude them from map updates
      const battle = this._currentGameState.battle;
      let enemiesInBattle: string[] = [];
      if (battle) {
        enemiesInBattle = battle.enemies.map((e: CombatEntity) => e.id);
      }

      this._currentGameState.enemies.forEach(enemy => {
        if (enemiesInBattle.includes(enemy.id)) {
          updatedEnemies.push(enemy); // Keep battle enemies as is
          return;
        }

        const patrolData = this._patrolSystem!.getEnemyData(enemy.id);
        if (patrolData && patrolData.state !== 'RESPAWNING') {
          const newPosition = patrolData.currentPosition;
          // Check if position actually changed before creating new object
          if (enemy.position.x !== newPosition.x || enemy.position.y !== newPosition.y) {
            const updatedEnemy = {
              ...enemy,
              position: { x: Math.round(newPosition.x), y: Math.round(newPosition.y) }, // Round for grid alignment
            };
            updatedEnemies.push(updatedEnemy);
            positionsChanged = true;
          } else {
            updatedEnemies.push(enemy); // No position change, add original enemy
          }
        } else if (patrolData && patrolData.state === 'RESPAWNING') {
          // Enemy is respawning, don't add it to visible enemies for now
        } else {
          updatedEnemies.push(enemy); // No patrol data, keep enemy as is
        }
      });

      // Add respawned enemies
      enemiesToRespawn.forEach(respawnedEnemy => {
        updatedEnemies.push(respawnedEnemy);
        positionsChanged = true; // Mark as changed since we're adding new enemies
      });

      if (positionsChanged) { // Only dispatch if there's a change
        this._updateDispatchCount++;
        this._lastEnemyUpdateTime = now;
        this._dispatch({
          type: 'UPDATE_ENEMIES',
          payload: { enemies: updatedEnemies },
        });
      }
    }
// ...
```
**Note on `Math.round`:** Added `Math.round` to `newPosition` when creating `updatedEnemy`. While `PatrolSystem` handles floating-point positions for smooth movement, the `GameEngine` and rendering typically operate on integer grid coordinates. Rounding ensures enemies snap to the grid for display. If sub-tile movement is desired, the rendering layer would need to interpret the float positions directly.

### 2. UIManager (Advanced UI State Management)

**Where to make changes:** `src/engine/GameEngine.ts`

**Before (Excerpt from `_processInput` in `GameEngine.ts`):**
```typescript
// src/engine/GameEngine.ts

// ...
    // Check for inventory toggle (i key)
    if (this._isAnyOfKeysPressed(this._pressedKeys, ['KeyI', 'i'])) {
      if (now - this._lastUITime > this._uiCooldown) {
        console.log('[VICTOR DEBUG] Inventory key pressed, dispatching TOGGLE_INVENTORY');
        this._dispatch({ type: 'TOGGLE_INVENTORY' });
        this._lastUITime = now;
      }
    }

    // Check for quest journal toggle (q key)
    if (this._isAnyOfKeysPressed(this._pressedKeys, ['KeyQ', 'q'])) {
      if (now - this._lastUITime > this._uiCooldown) {
        console.log('[VICTOR DEBUG] Quest key pressed, dispatching TOGGLE_QUEST_LOG');
        this._dispatch({ type: 'TOGGLE_QUEST_LOG' });
        this._lastUITime = now;
      }
    }
    // ... similar for KeyC, KeyF
```

**After (Modified `_processInput` in `GameEngine.ts`):**
```typescript
// src/engine/GameEngine.ts

// ...
    // Check for inventory toggle (i key)
    if (this._isAnyOfKeysPressed(this._pressedKeys, ['KeyI', 'i'])) {
      if (now - this._lastUITime > this._uiCooldown) {
        console.log('[UI Manager] I key pressed - opening Inventory');
        UIManager.getOpenPanelAction('inventory').forEach(action => this._dispatch(action));
        this._lastUITime = now;
      }
    }

    // Check for quest journal toggle (q key)
    if (this._isAnyOfKeysPressed(this._pressedKeys, ['KeyQ', 'q'])) {
      if (now - this._lastUITime > this._uiCooldown) {
        console.log('[UI Manager] Q key pressed - opening Quest Log');
        UIManager.getOpenPanelAction('questLog').forEach(action => this._dispatch(action));
        this._lastUITime = now;
      }
    }

    // Check for character screen toggle (c key)
    if (this._isAnyOfKeysPressed(this._pressedKeys, ['KeyC', 'c'])) {
      if (now - this._lastUITime > this._uiCooldown) {
        console.log('[UI Manager] C key pressed - opening Character Screen');
        UIManager.getOpenPanelAction('characterScreen').forEach(action => this._dispatch(action));
        this._lastUITime = now;
      }
    }

    // Check for faction screen toggle (f key)
    if (this._isAnyOfKeysPressed(this._pressedKeys, ['KeyF', 'f'])) {
      if (now - this._lastUITime > this._uiCooldown) {
        console.log('[UI Manager] F key pressed - opening Faction Status');
        UIManager.getOpenPanelAction('factionStatus').forEach(action => this._dispatch(action));
        this._lastUITime = now;
      }
    }
    // ESC key logic is already using UIManager, no change needed there.
// ...
```

### 3. PuzzleSystem (Push Block Puzzles)

This requires more foundational changes.

**Step 1: Define New Entity Types**
**Where to make changes:** `src/types/global.types.ts` (or create `src/types/puzzle.types.ts` and import)

```typescript
// src/types/global.types.ts (Add these interfaces)

// Extend a base Entity interface if you have one, otherwise ensure 'id' and 'position'
export interface PuzzleEntity extends Entity { // Assuming 'Entity' is a base interface with id and position
  puzzleId: string; // Links entity to a specific puzzle
}

export interface PushableBlock extends PuzzleEntity {
  type: 'pushable_block';
  // Add any specific properties for blocks, e.g., 'isPushed'
}

export interface PressurePlate extends PuzzleEntity {
  type: 'pressure_plate';
  isActive: boolean; // True if something is on it
  targetBlockId?: string; // Optional: link to a specific block
}

export interface Switch extends PuzzleEntity {
  type: 'switch';
  isOn: boolean;
  sequenceOrder?: number; // For sequence puzzles
}

// Update the union type for entities in GameMap (if it exists)
// Example:
// export type GameMapEntity = NPC | Enemy | Item | PushableBlock | PressurePlate | Switch;
// Make sure your GameMap class and GameState can handle these new types.
```

**Step 2: Update `debugDungeon.ts` to use new types**
**Where to make changes:** `src/assets/maps/debugDungeon.ts`

```typescript
// src/assets/maps/debugDungeon.ts

// Import new types
import { Tile, TileType, Exit, Enemy, NPC, NPCRole, Item, PushableBlock, PressurePlate, Switch } from '../../types/global.types'; // Or from puzzle.types.ts
import { Enemy as EnemyClass, EnemyVariant } from '../../models/Enemy';
import { Item as ItemClass, ItemVariant } from '../../models/Item';

// ... (rest of the map definition)

// Before (commented out puzzleEntities):
/*
const puzzleEntities: unknown[] = [
  // Push blocks for puzzle 1
  {
    id: 'push_block_1',
    type: 'pushable_block',
    position: { x: 16, y: 14 },
    puzzleId: 'block_puzzle',
  },
  // ...
];
*/

// After (re-add puzzleEntities with correct types):
const puzzleEntities: (PushableBlock | PressurePlate | Switch)[] = [
  // Push blocks for puzzle 1
  {
    id: 'push_block_1',
    type: 'pushable_block',
    position: { x: 16, y: 14 },
    puzzleId: 'block_puzzle',
  },
  {
    id: 'push_block_2',
    type: 'pushable_block',
    position: { x: 17, y: 15 },
    puzzleId: 'block_puzzle',
  },
  {
    id: 'push_block_3',
    type: 'pushable_block',
    position: { x: 18, y: 14 },
    puzzleId: 'block_puzzle',
  },
  // Pressure plates
  {
    id: 'pressure_plate_1',
    type: 'pressure_plate',
    position: { x: 17, y: 14 },
    puzzleId: 'block_puzzle',
    isActive: false, // Initial state
  },
  {
    id: 'pressure_plate_2',
    type: 'pressure_plate',
    position: { x: 16, y: 15 },
    puzzleId: 'block_puzzle',
    isActive: false,
  },
  {
    id: 'pressure_plate_3',
    type: 'pressure_plate',
    position: { x: 18, y: 16 },
    puzzleId: 'block_puzzle',
    isActive: false,
  },
  // Sequential switches
  {
    id: 'seq_switch_1',
    type: 'switch',
    position: { x: 2, y: 3 },
    sequenceOrder: 1,
    puzzleId: 'switch_puzzle',
    isOn: false, // Initial state
  },
  {
    id: 'seq_switch_2',
    type: 'switch',
    position: { x: 4, y: 3 },
    sequenceOrder: 2,
    puzzleId: 'switch_puzzle',
    isOn: false,
  },
  {
    id: 'seq_switch_3',
    type: 'switch',
    position: { x: 2, y: 5 },
    sequenceOrder: 3,
    puzzleId: 'switch_puzzle',
    isOn: false,
  },
  {
    id: 'seq_switch_4',
    type: 'switch',
    position: { x: 4, y: 5 },
    sequenceOrder: 4,
    puzzleId: 'switch_puzzle',
    isOn: false,
  },
  {
    id: 'seq_switch_5',
    type: 'switch',
    position: { x: 3, y: 4 },
    sequenceOrder: 5,
    puzzleId: 'switch_puzzle',
    isOn: false,
  },
];

// ...
export const debugDungeonData: IGameMap = {
  id: 'debugDungeon',
  name: 'Debug Dungeon',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  tiles: tiles,
  // Now include puzzle entities in the main entities array
  entities: [...npcs, ...enemies, ...items, ...puzzleEntities],
  exits: exits,
};
```

**Step 3: Integrate `PuzzleSystem` into `GameEngine`**
**Where to make changes:** `src/engine/GameEngine.ts`

```typescript
// src/engine/GameEngine.ts

// Add import
import { PuzzleSystem, PushBlockPuzzleState, SwitchSequencePuzzleState } from './PuzzleSystem';
import { PushableBlock, PressurePlate, Switch } from '../types/global.types'; // Or puzzle.types.ts

export class GameEngine {
  // ... existing properties
  private _puzzleSystem: PuzzleSystem; // Add puzzle system instance

  constructor(dispatch: React.Dispatch<GameAction>, initialState: GameState) {
    // ... existing constructor logic

    // Initialize Puzzle System
    this._puzzleSystem = new PuzzleSystem();
    // If loading a game, load puzzle state
    if (initialState.puzzleStates) {
      this._puzzleSystem.loadSaveData(initialState.puzzleStates);
    }
    // Register puzzles for the initial map
    if (initialState.currentMap) {
      this._registerMapPuzzles(initialState.currentMap);
    }
  }

  public setGameState(newState: GameState): void {
    // Check if map changed
    if (this._currentGameState.currentMap?.id !== newState.currentMap?.id) {
      // ... existing map change logic
      // Register puzzles for the new map
      if (newState.currentMap) {
        this._registerMapPuzzles(newState.currentMap);
      }
    }
    this._currentGameState = newState;
  }

  // New helper method to register puzzles from map entities
  private _registerMapPuzzles(map: GameMap): void {
    map.entities.forEach(entity => {
      if ('puzzleId' in entity) {
        if (entity.type === 'pushable_block') {
          const blocksInPuzzle = map.entities.filter(e => 'puzzleId' in e && e.puzzleId === entity.puzzleId && e.type === 'pushable_block') as PushableBlock[];
          const initialBlockPositions = blocksInPuzzle.map(b => ({ x: b.position.x, y: b.position.y }));
          const initialState: PushBlockPuzzleState = {
            type: 'pushBlock',
            blockPositions: initialBlockPositions,
            isSolved: false, // Puzzles start unsolved
          };
          this._puzzleSystem.registerPuzzle(map.id, entity.puzzleId, initialState);
        } else if (entity.type === 'switch') {
          const switchesInPuzzle = map.entities.filter(e => 'puzzleId' in e && e.puzzleId === entity.puzzleId && e.type === 'switch') as Switch[];
          const initialState: SwitchSequencePuzzleState = {
            type: 'switchSequence',
            activatedSequence: [],
            isSolved: false,
          };
          this._puzzleSystem.registerPuzzle(map.id, entity.puzzleId, initialState);
        }
        // Add more puzzle types as needed
      }
    });
  }

  // ... (inside processMovement method)
  public async processMovement(direction: Direction): Promise<void> {
    // ... existing movement logic

    // After calculating newX, newY, check for pushable blocks
    const targetPosition: Position = { x: newX, y: newY };
    const blockAtTarget = currentMap.entities.find(e =>
      'type' in e && e.type === 'pushable_block' && e.position.x === targetPosition.x && e.position.y === targetPosition.y
    ) as PushableBlock | undefined;

    if (blockAtTarget) {
      // Calculate where the block would move
      let blockNewX = blockAtTarget.position.x;
      let blockNewY = blockAtTarget.position.y;
      switch (direction) {
        case 'up': blockNewY--; break;
        case 'down': blockNewY++; break;
        case 'left': blockNewX--; break;
        case 'right': blockNewX++; break;
      }
      const blockNewPosition: Position = { x: blockNewX, y: blockNewY };

      // Check if block's new position is valid (within map, walkable, no other entities)
      const blockTargetTile = currentMap.tiles[blockNewY]?.[blockNewX];
      const isBlockTargetOccupied = currentMap.entities.some(e =>
        e.position.x === blockNewPosition.x && e.position.y === blockNewPosition.y && e.id !== blockAtTarget.id
      );

      if (blockTargetTile && blockTargetTile.walkable && !isBlockTargetOccupied) {
        // Move the block
        const puzzleState = this._puzzleSystem.getPuzzleState(currentMap.id, blockAtTarget.puzzleId);
        if (puzzleState && puzzleState.type === 'pushBlock') {
          const updatedBlockPositions = puzzleState.blockPositions.map((pos, idx) =>
            currentMap.entities[idx]?.id === blockAtTarget.id ? blockNewPosition : pos
          );
          const newPuzzleState: PushBlockPuzzleState = {
            ...puzzleState,
            blockPositions: updatedBlockPositions,
            // Add logic here to check if puzzle is solved based on new block positions
            isSolved: this._checkPushBlockPuzzleSolved(currentMap.id, blockAtTarget.puzzleId, updatedBlockPositions),
          };
          this._puzzleSystem.updatePuzzleState(currentMap.id, blockAtTarget.puzzleId, newPuzzleState);

          // Dispatch action to update the block's position in GameState
          // This requires a new action type, e.g., 'UPDATE_ENTITY_POSITION'
          this._dispatch({
            type: 'UPDATE_ENTITY_POSITION', // You'll need to define this action in GameContext
            payload: { entityId: blockAtTarget.id, newPosition: blockNewPosition }
          });

          // Allow player to move into the block's old position
          this._dispatch({ type: 'MOVE_PLAYER', payload: { direction } });
          return; // Block moved, player moved, done for this frame
        }
      } else {
        // Block cannot be moved, player cannot move
        this._dispatch({ type: 'SHOW_NOTIFICATION', payload: { message: 'Something is blocking the path!' } });
        return;
      }
    }

    // ... rest of processMovement (if no block, or block not moved)
  }

  // New helper for checking push block puzzle solution
  private _checkPushBlockPuzzleSolved(mapId: string, puzzleId: string, currentBlockPositions: Position[]): boolean {
    const map = this._currentGameState.currentMap;
    const pressurePlates = map.entities.filter(e =>
      'type' in e && e.type === 'pressure_plate' && e.puzzleId === puzzleId
    ) as PressurePlate[];

    if (pressurePlates.length === 0) return false; // No plates, no solution

    // Check if every pressure plate has a block on it
    return pressurePlates.every(plate =>
      currentBlockPositions.some(blockPos =>
        blockPos.x === plate.position.x && blockPos.y === plate.position.y
      )
    );
  }

  // ... (inside checkInteractions method)
  public checkInteractions(): void {
    // ... existing interaction logic

    // Check for Switch interactions
    const { player, currentMap } = this._currentGameState;
    const playerPos = player.position;
    const interactionRange: Position[] = [
      { x: playerPos.x, y: playerPos.y - 1 }, // Up
      { x: playerPos.x, y: playerPos.y + 1 }, // Down
      { x: playerPos.x - 1, y: playerPos.y }, // Left
      { x: playerPos.x + 1, y: playerPos.y }, // Right
    ];

    for (const pos of interactionRange) {
      const targetSwitch = currentMap.entities.find(e =>
        'type' in e && e.type === 'switch' && e.position.x === pos.x && e.position.y === pos.y
      ) as Switch | undefined;

      if (targetSwitch) {
        const puzzleState = this._puzzleSystem.getPuzzleState(currentMap.id, targetSwitch.puzzleId);
        if (puzzleState && puzzleState.type === 'switchSequence') {
          const newActivatedSequence = [...puzzleState.activatedSequence, targetSwitch.id];
          const newSwitchState: SwitchSequencePuzzleState = {
            ...puzzleState,
            activatedSequence: newActivatedSequence,
            isSolved: this._checkSwitchPuzzleSolved(currentMap.id, targetSwitch.puzzleId, newActivatedSequence),
          };
          this._puzzleSystem.updatePuzzleState(currentMap.id, targetSwitch.puzzleId, newSwitchState);

          // Dispatch action to update the switch's state (e.g., visual 'on' state)
          this._dispatch({
            type: 'UPDATE_ENTITY_STATE', // You'll need to define this action in GameContext
            payload: { entityId: targetSwitch.id, newState: { isOn: !targetSwitch.isOn } }
          });
          this._dispatch({ type: 'SHOW_NOTIFICATION', payload: { message: `Switch ${targetSwitch.id} activated!` } });
          return;
        }
      }
    }
    // ... rest of checkInteractions
  }

  // New helper for checking switch sequence puzzle solution
  private _checkSwitchPuzzleSolved(mapId: string, puzzleId: string, currentSequence: string[]): boolean {
    // This is a placeholder. You'd define the correct sequence for each puzzle.
    // Example: For 'switch_puzzle' in 'debugDungeon', the correct sequence might be:
    const correctSequence = ['seq_switch_1', 'seq_switch_3', 'seq_switch_5', 'seq_switch_2', 'seq_switch_4'];

    if (currentSequence.length !== correctSequence.length) {
      return false;
    }
    return currentSequence.every((id, index) => id === correctSequence[index]);
  }
}
```

**Step 4: Update `GameContext.tsx` to handle new entity updates and puzzle states**
**Where to make changes:** `src/context/GameContext.tsx`

```typescript
// src/context/GameContext.tsx

// Add PuzzleSystemSaveData to GameState interface
import { PuzzleSystemSaveData } from '../engine/PuzzleSystem'; // Import the type

interface GameState extends IGameState {
  // ... existing properties
  puzzleStates?: PuzzleSystemSaveData; // Add puzzle states to GameState
}

// Add new action types
type GameAction =
  // ... existing actions
  | { type: 'UPDATE_ENTITY_POSITION'; payload: { entityId: string; newPosition: Position } }
  | { type: 'UPDATE_ENTITY_STATE'; payload: { entityId: string; newState: Partial<any> } }; // Generic for now

// ... (inside gameReducer function)
case 'UPDATE_ENTITY_POSITION': {
  const { entityId, newPosition } = action.payload;
  const updatedEntities = state.currentMap.entities.map(entity => {
    if (entity.id === entityId) {
      return { ...entity, position: newPosition };
    }
    return entity;
  });
  // Create a new GameMap instance to ensure immutability
  const newMap = new GameMap({ ...state.currentMap, entities: updatedEntities });
  return { ...state, currentMap: newMap };
}

case 'UPDATE_ENTITY_STATE': {
  const { entityId, newState } = action.payload;
  const updatedEntities = state.currentMap.entities.map(entity => {
    if (entity.id === entityId) {
      return { ...entity, ...newState }; // Merge new state properties
    }
    return entity;
  });
  const newMap = new GameMap({ ...state.currentMap, entities: updatedEntities });
  return { ...state, currentMap: newMap };
}

case 'SAVE_GAME': {
  const questManager = QuestManager.getInstance();
  const factionManager = FactionManager.getInstance();
  // Ensure quests are initialized before saving
  if (questManager.allQuests.length === 0) {
    questManager.initializeQuests();
  }
  // Get puzzle system save data
  const puzzleSystem = (window as any).gameEngine._puzzleSystem; // Access via window.gameEngine
  const puzzleSaveData = puzzleSystem ? puzzleSystem.getSaveData() : {};

  const stateToSave = {
    ...state,
    questManagerState: questManager.saveState(),
    factionReputations: factionManager.serialize().factions, // Serialize factions
    puzzleStates: puzzleSaveData, // Include puzzle states
  };
  const saveSuccess = SaveGameService.saveGame(stateToSave as any);
  if (saveSuccess) {
    // ... notification
  } else {
    console.error('Failed to save game');
  }
  return state;
}

case 'LOAD_GAME': {
  const { savedState } = action.payload;
  // ... existing load logic for player, map, quests, factions

  // Load puzzle system state
  const puzzleSystem = (window as any).gameEngine._puzzleSystem; // Access via window.gameEngine
  if (puzzleSystem && savedState.puzzleStates) {
    puzzleSystem.loadSaveData(savedState.puzzleStates);
  }

  return {
    ...state,
    ...savedState,
    player: updatedPlayer,
    currentMap: savedState.currentMap || state.currentMap,
    puzzleStates: savedState.puzzleStates, // Ensure puzzleStates are in GameState
  };
}
```
**Important Note:** Accessing `(window as any).gameEngine._puzzleSystem` is a temporary workaround. A more robust solution would be to pass the `PuzzleSystem` instance directly to the reducer or manage it within the `GameContext` itself, similar to how `FactionManager` is handled.

### 4. Faction-Based Pricing

The `applyFactionPricing` function is already correctly used in `GameContext.tsx`. The integration here is about making the effect visible to the player.

**Where to make changes:** `src/context/GameContext.tsx` (already integrated) and `src/components/Shop/Shop.tsx` (for UI display).

**`GameContext.tsx` (Verification - already integrated):**
```typescript
// src/context/GameContext.tsx (Excerpt from DIALOGUE_CHOICE case)

// ...
      } else if (choiceAction === 'open_shop_bit_merchant') {
        const baseShopItems: ShopItem[] = [ /* ... items */ ];
        const bitMerchant = state.npcs.find(npc => npc.name === 'Bit Merchant');
        const shopItems = bitMerchant && bitMerchant.factionId
          ? applyFactionPricing(baseShopItems, bitMerchant, state.factionManager) // <--- ALREADY USED HERE!
          : baseShopItems;
        // ... dispatch OPEN_SHOP
      } else if (choiceAction === 'open_shop_memory_merchant') {
        const baseShopItems: ShopItem[] = [ /* ... items */ ];
        const memoryMerchant = state.npcs.find(npc => npc.name === 'Memory Merchant');
        const shopItems = memoryMerchant && memoryMerchant.factionId
          ? applyFactionPricing(baseShopItems, memoryMerchant, state.factionManager) // <--- ALREADY USED HERE!
          : baseShopItems;
        // ... dispatch OPEN_SHOP
      }
// ...
```

**`Shop.tsx` (To display faction reputation and price modifier):**
```typescript
// src/components/Shop/Shop.tsx

import React, { useState, useEffect, useRef } from 'react';
import styles from './Shop.module.css';
import { useGameContext } from '../../context/GameContext';
import { useKeyboard } from '../../hooks/useKeyboard';
import { ShopItem, Item, ShopState, NPC } from '../../types/global.types'; // Import NPC type

// ... (rest of the component)

const Shop: React.FC = () => {
    const { state, dispatch } = useGameContext();
    const shopState = state.shopState;
    const playerGold = state.player.gold;
    const playerInventory = state.player.inventory;
    const factionManager = state.factionManager; // Get faction manager from state
    const npcs = state.npcs; // Get NPCs from state to find the current merchant

    if (!shopState) {
        return null;
    }

    const { npcName, items: shopItems } = shopState;

    // Find the actual NPC object for the current shop
    const currentMerchant = npcs.find(npc => npc.id === shopState.npcId);
    const merchantFactionId = currentMerchant?.factionId;
    const playerReputationTier = merchantFactionId ? factionManager.getReputationTier(merchantFactionId) : 'N/A';

    // Determine price modifier text for display
    let priceModifierText = '';
    if (merchantFactionId) {
        switch (playerReputationTier) {
            case 'Allied': priceModifierText = 'Prices: -20% (Allied)'; break;
            case 'Hostile': priceModifierText = 'Prices: +20% (Hostile)'; break;
            case 'Friendly': priceModifierText = 'Prices: Normal (Friendly)'; break;
            case 'Unfriendly': priceModifierText = 'Prices: Normal (Unfriendly)'; break;
            case 'Neutral': priceModifierText = 'Prices: Normal (Neutral)'; break;
            default: priceModifierText = 'Prices: Normal'; break;
        }
    }

    // ... (rest of the component logic)

    return (
        <div className={styles.shopContainer}>
            <div className={styles.borderTop}>┌{borderString}┐</div>
            <div className={styles.contentWrapper}>
                <div className={styles.borderLeft}>│</div>
                <div className={styles.mainContent}>
                    <div className={styles.npcName}>{npcName}</div>
                    {merchantFactionId && (
                        <div className={styles.factionInfo}>
                            Reputation with {currentMerchant?.factionId}: <span className={styles[playerReputationTier.toLowerCase()]}>{playerReputationTier}</span> ({priceModifierText})
                        </div>
                    )}
                    <div className={styles.panels}>
                        {/* ... Buy Panel and Sell Panel */}
                    </div>
                    <div className={styles.playerInfo}>
                        <div className={styles.gold}>Gold: {playerGold}G</div>
                        <div className={styles.controls}>
                            [Tab] Switch Panel | [Arrows] Navigate | [Enter/Space] Buy/Sell | [Esc] Close
                        </div>
                    </div>
                </div>
                <div className={styles.borderRight}>│</div>
            </div>
            <div className={styles.borderBottom}>└{borderString}┘</div>
        </div>
    );
};

export default Shop;
```
**Add CSS for reputation tiers (e.g., `Shop.module.css`):**
```css
/* src/components/Shop/Shop.module.css */

.factionInfo {
    text-align: center;
    margin-bottom: 10px;
    font-size: 0.9em;
    color: var(--text-color-light);
}

.allied {
    color: var(--color-green); /* Define this in your global CSS variables */
    font-weight: bold;
}

.friendly {
    color: var(--color-blue);
}

.neutral {
    color: var(--text-color);
}

.unfriendly {
    color: var(--color-orange);
}

.hostile {
    color: var(--color-red);
    font-weight: bold;
}
```

---

## Risk Assessment

### General Risks
*   **Introducing new bugs:** Any code modification carries this risk.
*   **Performance degradation:** Especially with new AI or complex puzzle logic running every frame.
*   **Save/Load compatibility:** Changes to `GameState` structure (like adding `puzzleStates`) require careful handling during save/load to prevent breaking old saves or corrupting new ones.

### Feature-Specific Risks

#### 1. PatrolSystem (Enemy AI Patrols)
*   **What might break:**
    *   Enemies getting stuck on obstacles or each other.
    *   Performance issues if too many enemies are actively patrolling/chasing.
    *   Inconsistent enemy positions between `PatrolSystem`'s internal state and `GameState`.
    *   Respawn logic not working as intended (enemies not reappearing or appearing in wrong places).
*   **How to test safely:**
    *   Start with a single enemy on a simple map.
    *   Add console logs in `PatrolSystem.update` to track enemy positions and states.
    *   Monitor FPS and dispatch frequency in `GameEngine`.
    *   Test combat with patrolling enemies to ensure smooth transitions to/from battle.
    *   Test defeating enemies and waiting for respawn.
*   **Rollback procedures:** Revert changes to `GameEngine.ts` and `PatrolSystem.ts`.

#### 2. UIManager (Advanced UI State Management)
*   **What might break:**
    *   UI panels not opening or closing correctly.
    *   Multiple panels opening simultaneously (though `UIManager` is designed to prevent this).
    *   Keyboard shortcuts becoming unresponsive.
*   **How to test safely:**
    *   Test all UI hotkeys (I, Q, C, F, Esc).
    *   Open and close panels in various sequences.
    *   Test opening a shop via dialogue, then trying to open other panels.
*   **Rollback procedures:** Revert changes to `GameEngine._processInput`.

#### 3. PuzzleSystem (Push Block Puzzles)
*   **What might break:**
    *   Game crashes due to incorrect entity type handling.
    *   Blocks not moving, moving through walls, or getting stuck.
    *   Puzzles not registering as solved, or solving incorrectly.
    *   Save/load breaking if `puzzleStates` are not correctly serialized/deserialized.
*   **How to test safely:**
    *   Implement one puzzle type (e.g., push blocks) on a small, isolated map first.
    *   Use debug rendering to visualize block positions and pressure plate states.
    *   Test edge cases: pushing into walls, pushing into other entities, pushing multiple blocks.
    *   Save and load the game mid-puzzle to ensure state persistence.
*   **Rollback procedures:** Revert changes to `global.types.ts`, `debugDungeon.ts`, `GameEngine.ts`, `GameContext.tsx`, and `PuzzleSystem.ts`. This is the most complex rollback due to distributed changes.

#### 4. Faction-Based Pricing
*   **What might break:**
    *   Incorrect prices displayed in shops.
    *   Player gold being incorrectly deducted/added.
    *   UI display issues for reputation.
*   **How to test safely:**
    *   Manually set player reputation to different tiers (e.g., in debug mode or via console commands).
    *   Visit shops and verify prices match the expected modifiers.
    *   Perform buy/sell operations and check gold balance.
    *   Ensure the reputation text in the shop UI updates correctly.
*   **Rollback procedures:** Revert changes to `Shop.tsx` and its CSS. The `GameContext.tsx` changes are already in place and functional.

### General Rollback Procedure
1.  **Version Control:** Always commit your current working state before starting any integration work.
2.  **Branching:** Work on a dedicated feature branch (`git checkout -b feature/hidden-integrations`).
3.  **Revert:** If issues arise that cannot be quickly fixed, use `git revert <commit-hash>` or `git reset --hard <commit-hash>` to return to a stable state.

By following this guide, Chris and his team can systematically activate these hidden features, enhancing the depth and complexity of Tales of Claude. Good luck, agents!