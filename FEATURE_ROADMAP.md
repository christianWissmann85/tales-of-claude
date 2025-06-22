Here is a comprehensive game design feature roadmap for "Tales of Claude".

# Tales of Claude: Feature Development Roadmap

## 1. Overview & Strategy

This document outlines the development roadmap for adding new features and fixing critical issues in "Tales of Claude". The features are prioritized based on their impact on core gameplay, player experience, and technical dependencies. The goal is to create a more robust, engaging, and complete-feeling game.

Each feature includes a detailed implementation plan, time estimates for a skilled developer with AI assistance, and specific technical guidance suitable for direct implementation.

### High-Level Roadmap & Priorities

| Priority | Feature ID | Feature Description                               | Dependencies          | Est. Time (Hours) |
| :------: | :--------: | ------------------------------------------------- | --------------------- | :---------------: |
| 1 (High) | #7         | **Fix: Dungeon Map Progression**                  | -                     |         2         |
| 2 (High) | #4 & #2    | **Character Screen & Equipment/Inventory UI**     | `Player.ts` equipment |         8         |
| 3 (Med)  | #5         | **ASCII Art Battle Visuals (FF1 Style)**          | Battle System         |         6         |
| 4 (Med)  | #6         | **Visual Feedback / On-Screen HUD**               | `Player.ts` stats     |         3         |
| 5 (Low)  | #3         | **Talent/Skill Upgrade System**                   | Character Screen      |         7         |
| 6 (Low)  | #1         | **Intro Splash Screen & Opening Scene**           | -                     |         4         |
|          |            | **Total Estimated Time:**                         |                       |      **30 hrs**   |

---

## 2. Detailed Feature Implementation Plan

### Feature #7: Fix Dungeon Map Progression (High Priority)

*   **Objective:** Resolve the progression block in `debugDungeon` by making the map navigable and implementing a key/lock mechanic for the door at `(9,6)`.
*   **Priority:** High
*   **Estimated Time:** 2 hours
*   **Dependencies:** None

#### Implementation Details

1.  **Update `debugDungeon.ts` Map Layout:**
    *   The current layout has impassable walls that isolate sections. The primary issue is the locked door at `(9,6)` which is correctly defined as `walkable: false`, but the player needs a way to open it. The `BossKey` item already exists in the loot table.
    *   **Action:** Modify `debugDungeon.ts` to ensure all areas are reachable. The provided ASCII art in the file is a good reference, but let's ensure the paths are clear. The main fix is not in the map layout itself, but in the interaction logic.

2.  **Implement Locked Door Interaction Logic:**
    *   The interaction logic should be handled within the `GameEngine` when the player attempts to move.
    *   **File to Modify:** `src/engine/GameEngine.ts` (This file is not provided but is referenced. The logic below assumes its structure).

    ```typescript
    // src/engine/GameEngine.ts (conceptual)

    // Inside the method that handles player movement, e.g., _handleMovement()
    private _handleMovement(direction: Direction): void {
        const { player, currentMap } = this.gameState;
        const targetPos = this.getNewPosition(player.position, direction);

        // Check for map boundaries
        if (!this.isWithinBounds(targetPos, currentMap)) {
            return;
        }

        const targetTile = currentMap.tiles[targetPos.y][targetPos.x];

        // --- NEW LOGIC START ---
        // Check for locked door interaction
        if (targetTile.type === 'locked_door') {
            // Check if player has the key (e.g., 'item_boss_key')
            const playerHasKey = player.inventory.some(item => item.id === 'dd_boss_key');

            if (playerHasKey) {
                // Player has the key. Unlock the door.
                this.dispatch({
                    type: 'USE_KEY_ON_DOOR',
                    payload: {
                        position: targetPos,
                        itemId: 'dd_boss_key'
                    }
                });
                // Optional: Show a message like "You used the Boss Key."
                this.dispatch({ type: 'ADD_GAME_LOG', payload: 'The Boss Key fits the lock. The door creaks open!' });
            } else {
                // Player does not have the key. Show a message.
                this.dispatch({ type: 'ADD_GAME_LOG', payload: 'The door is locked. It seems to require a special key.' });
            }
            return; // Prevent movement into the door tile this frame
        }
        // --- NEW LOGIC END ---

        if (targetTile.walkable) {
            // ... existing movement logic ...
            this.dispatch({ type: 'MOVE_PLAYER', payload: { direction } });
        }
    }
    ```

3.  **Update Game Reducer:**
    *   Add a new case to handle the `USE_KEY_ON_DOOR` action.
    *   **File to Modify:** `src/context/GameContext.tsx` (or wherever the reducer is defined).

    ```typescript
    // In the gameReducer function
    case 'USE_KEY_ON_DOOR': {
        const { position, itemId } = action.payload;
        const newMap = { ...state.currentMap };
        const newTiles = newMap.tiles.map(row => [...row]);

        // Change the tile type from 'locked_door' to 'dungeon_floor'
        newTiles[position.y][position.x] = { walkable: true, type: 'dungeon_floor' };
        newMap.tiles = newTiles;

        // Remove the key from player's inventory
        const newPlayerInventory = state.player.inventory.filter(item => item.id !== itemId);
        const newPlayer = { ...state.player, inventory: newPlayerInventory };

        return {
            ...state,
            player: newPlayer,
            currentMap: newMap,
        };
    }
    ```

---

### Feature #2 & #4: Character Screen & Equipment/Inventory UI (High Priority)

*   **Objective:** Create a dedicated Character Screen accessible with the 'C' key. This screen will display player stats, equipped items, and the main inventory, separating equipment from other items.
*   **Priority:** High
*   **Estimated Time:** 8 hours
*   **Dependencies:** `Player.ts` equipment slots (already exist).

#### Implementation Details

1.  **File Structure:**
    *   `src/components/CharacterScreen/CharacterScreen.tsx`
    *   `src/components/CharacterScreen/CharacterScreen.module.css`

2.  **Keyboard Input & State:**
    *   **`useKeyboard.ts`:** Add `'KeyC'` to a new key group or check for it directly.
    *   **`GameEngine.ts`:** In the input handling loop, detect if 'C' is pressed and dispatch a `TOGGLE_CHARACTER_SCREEN` action.
    *   **`GameContext`:** Add `showCharacterScreen: boolean` to the game state and a `TOGGLE_CHARACTER_SCREEN` action to the reducer.

3.  **`CharacterScreen.tsx` Component Design:**
    *   This component will be rendered conditionally in `GameBoard.tsx` or `App.tsx` based on `state.showCharacterScreen`.
    *   It should overlay the game and pause game logic when open.

    **ASCII Mockup:**
    ```
    +-------------------------------------------------------------------+
    | CHARACTER: Claude                [Press C or ESC to Close]        |
    +----------------------------------+--------------------------------+
    |           [ STATS ]              |          [ INVENTORY ]         |
    |                                  |                                |
    | Level: 1 (EXP: 0/100)            | [1] Health Potion      (Use)   |
    | HP:      100 / 100               | [2] Energy Drink       (Use)   |
    | Energy:   50 / 50                | [3] Debug Blade        (Equip) |
    |                                  | [4] Binary Shield      (Equip) |
    | Attack:  10 (+5)                 | [5] Old Amulet         (Equip) |
    | Defense: 10 (+8)                 | ...                            |
    | Speed:   10                      |                                |
    |                                  |                                |
    +----------------------------------+--------------------------------+
    |         [ EQUIPMENT ]            |                                |
    |                                  |                                |
    | Weapon:    [ Debug Blade ]       | (Unequip)                      |
    | Armor:     [ Binary Shield ]     | (Unequip)                      |
    | Accessory: [ Old Amulet ]        | (Unequip)                      |
    |                                  |                                |
    +-------------------------------------------------------------------+
    ```

4.  **Component Implementation (`CharacterScreen.tsx`):**

    ```tsx
    // src/components/CharacterScreen/CharacterScreen.tsx
    import React from 'react';
    import { useGameContext } from '../../context/GameContext';
    import { Item } from '../../models/Item';
    import styles from './CharacterScreen.module.css';

    const CharacterScreen: React.FC = () => {
        const { state, dispatch } = useGameContext();
        const { player } = state;

        const handleClose = () => {
            dispatch({ type: 'TOGGLE_CHARACTER_SCREEN' });
        };

        const handleEquip = (item: Item) => {
            if (item.type === 'equipment') {
                dispatch({ type: 'EQUIP_ITEM', payload: { itemId: item.id } });
            }
        };

        const handleUnequip = (slot: 'weapon' | 'armor' | 'accessory') => {
            dispatch({ type: 'UNEQUIP_ITEM', payload: { slot } });
        };

        // Separate equipped item IDs from the main inventory list
        const equippedItemIds = new Set(player.getEquippedItems().map(item => item.id));
        const inventoryItems = player.inventory.filter(item => !equippedItemIds.has(item.id));

        return (
            <div className={styles.overlay}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h2>CHARACTER: {player.name}</h2>
                        <button onClick={handleClose}>X</button>
                    </div>
                    <div className={styles.mainContent}>
                        <div className={styles.leftPanel}>
                            {/* Stats Section */}
                            <div className={styles.stats}>
                               <h3>Stats</h3>
                               <p>Level: {player.stats.level}</p>
                               <p>HP: {player.stats.hp} / {player.stats.maxHp}</p>
                               {/* ... more stats ... */}
                            </div>
                            {/* Equipment Section */}
                            <div className={styles.equipment}>
                                <h3>Equipment</h3>
                                <p>Weapon: {player.weaponSlot?.name || 'None'}
                                    {player.weaponSlot && <button onClick={() => handleUnequip('weapon')}>Unequip</button>}
                                </p>
                                <p>Armor: {player.armorSlot?.name || 'None'}
                                    {player.armorSlot && <button onClick={() => handleUnequip('armor')}>Unequip</button>}
                                </p>
                                <p>Accessory: {player.accessorySlot?.name || 'None'}
                                    {player.accessorySlot && <button onClick={() => handleUnequip('accessory')}>Unequip</button>}
                                </p>
                            </div>
                        </div>
                        <div className={styles.rightPanel}>
                            {/* Inventory Section */}
                            <h3>Inventory</h3>
                            <ul className={styles.itemList}>
                                {inventoryItems.map(item => (
                                    <li key={item.id}>
                                        {item.name}
                                        {item.type === 'equipment' && <button onClick={() => handleEquip(item)}>Equip</button>}
                                        {item.type === 'consumable' && <button>Use</button> /* Add use logic */}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    export default CharacterScreen;
    ```

5.  **Reducer Logic for Equip/Unequip:**
    *   **File to Modify:** `src/context/GameContext.tsx`
    *   Implement `EQUIP_ITEM` and `UNEQUIP_ITEM` actions. These actions should use a deep clone of the player object, call the `player.equip()` or `player.unequip()` methods, and then update the state.

---

### Feature #5: ASCII Art Battle Visuals (Medium Priority)

*   **Objective:** Redesign the battle screen to emulate the classic side-view layout of early Final Fantasy games using ASCII art, improving immersion.
*   **Priority:** Medium
*   **Estimated Time:** 6 hours
*   **Dependencies:** Existing `BattleSystem`.

#### Implementation Details

1.  **ASCII Art Assets:**
    *   Create simple, recognizable ASCII art for the player and common enemies.
    *   **Player (Claude `🤖`):**
        ```
          ___
         |o_o|
         | O |
        /| | |\\
         |_|_|
        ```
    *   **Bug `👾`:**
        ```
         /o  o\\
        (  _  )
         \\_-_/
        ```
    *   **Virus `🦠`:**
        ```
         .---.
        /  _  \\
        |/   \\|
        (  ^  )
         \\_-_/
        ```

2.  **`Battle.tsx` Layout Redesign:**
    *   Refactor the JSX in `Battle.tsx` to use the new layout. CSS Grid is highly recommended.

    **ASCII Mockup:**
    ```
    +--------------------------------------------------------------------------+
    | [BATTLE SCENE]                                                           |
    |                                                                          |
    |    /o  o\         .---.                                   ___            |
    |   (  _  )        /  _  \                                 |o_o|           |
    |    \_-_/         |/   \|                                 | O |           |
    |   Lvl 5 Bug      (  ^  )                                /| | |\          |
    |                  Lvl 6 Virus                             |_|_|           |
    |                                                         Claude Lvl 5     |
    |                                                         HP: 100/100      |
    |                                                         EN:  50/50       |
    |                                                                          |
    +------------------------------------+-------------------------------------+
    | [ACTION MENU / TARGETS]            | [BATTLE LOG]                        |
    |                                    |                                     |
    | > Attack                           | > Battle Started!                   |
    |   Ability                          | > Claude's Turn!                    |
    |   Item                             |                                     |
    |   Flee                             |                                     |
    |                                    |                                     |
    +------------------------------------+-------------------------------------+
    ```

3.  **Component Implementation (`Battle.tsx`):**
    *   The main container will be a grid with two rows: `battle-scene` and `battle-hud`.
    *   `battle-hud` will be a grid with two columns: `actions` and `log`.
    *   Use local state `const [menuState, setMenuState] = useState('main' | 'ability' | 'item' | 'target');` to control which menu is displayed in the `actions` panel.
    *   Replace button dropdowns with a navigable list. Keyboard input (arrows/enter) should be the primary interaction method during battle.

    ```tsx
    // src/components/Battle/Battle.tsx (snippet of new JSX structure)
    <div className={styles.battleContainer}>
        <div className={styles.battleScene}>
            <div className={styles.enemiesSection}>
                {enemies.map(enemy => (
                    <div key={enemy.id} className={styles.spriteContainer}>
                        <pre className={styles.asciiArt}>{getAsciiForEnemy(enemy.name)}</pre>
                        <span>{enemy.name}</span>
                        {/* HP Bar */}
                    </div>
                ))}
            </div>
            <div className={styles.playerSection}>
                 <div className={styles.spriteContainer}>
                    <pre className={styles.asciiArt}>{/* Player ASCII */}</pre>
                    <span>{player.name}</span>
                    {/* HP/Energy Bars */}
                </div>
            </div>
        </div>
        <div className={styles.battleHud}>
            <div className={styles.actionsPanel}>
                {/* Conditionally render menus based on local menuState */}
            </div>
            <div className={styles.battleLog}>
                {/* Log messages */}
            </div>
        </div>
    </div>
    ```

---

### Feature #6: Visual Feedback / On-Screen HUD (Medium Priority)

*   **Objective:** Add a persistent Heads-Up Display (HUD) on the overworld screen to show the player's current HP, Energy, and other vital stats.
*   **Priority:** Medium
*   **Estimated Time:** 3 hours
*   **Dependencies:** `Player.ts` stats.

#### Implementation Details

1.  **File Structure:**
    *   `src/components/HUD/HUD.tsx`
    *   `src/components/HUD/HUD.module.css`

2.  **Component Design (`HUD.tsx`):**
    *   The component will read `state.player.stats` from the `GameContext`.
    *   It should be styled with `position: fixed` or `absolute` to overlay the `GameBoard`.
    *   **ASCII Mockup (Top-Left Corner):**
        ```
        +--------------------------+
        | Claude | Lvl: 1          |
        | HP [||||||||||] 100/100  |
        | EN [|||||-----]  50/100  |
        +--------------------------+
        ```

3.  **Component Implementation (`HUD.tsx`):**

    ```tsx
    // src/components/HUD/HUD.tsx
    import React from 'react';
    import { useGameContext } from '../../context/GameContext';
    import styles from './HUD.module.css';

    const createAsciiBar = (current: number, max: number, length: number = 10): string => {
        const percentage = max > 0 ? current / max : 0;
        const filledCount = Math.round(percentage * length);
        const emptyCount = length - filledCount;
        return `[${'|'.repeat(filledCount)}${'-'.repeat(emptyCount)}]`;
    };

    const HUD: React.FC = () => {
        const { state } = useGameContext();
        const { player } = state;

        if (!player) return null;

        const { hp, maxHp, energy, maxEnergy, level } = player.stats;

        return (
            <div className={styles.hudContainer}>
                <div className={styles.playerName}>
                    {player.name} | Lvl: {level}
                </div>
                <div className={styles.statBar}>
                    <span className={styles.label}>HP</span>
                    <pre className={styles.asciiBar}>{createAsciiBar(hp, maxHp)}</pre>
                    <span className={styles.values}>{hp}/{maxHp}</span>
                </div>
                <div className={styles.statBar}>
                    <span className={styles.label}>EN</span>
                    <pre className={styles.asciiBar}>{createAsciiBar(energy, maxEnergy)}</pre>
                    <span className={styles.values}>{energy}/{maxEnergy}</span>
                </div>
            </div>
        );
    };

    export default HUD;
    ```

4.  **Integration:**
    *   Render the `<HUD />` component inside the main `App.tsx` or `GameBoard.tsx` component, ensuring it is not rendered during battle or on menu screens where it would be obstructive.

    ```tsx
    // In GameBoard.tsx's return statement
    return (
        <>
            <HUD /> {/* Add the HUD component */}
            <div className={styles.gameBoard} ...>
                {/* ... */}
            </div>
            {/* ... other overlays ... */}
        </>
    );
    ```

---

### Feature #3: Talent/Skill Upgrade System (Low Priority)

*   **Objective:** Implement a system where players earn Talent Points on level-up and can spend them to permanently upgrade their abilities.
*   **Priority:** Low
*   **Estimated Time:** 7 hours
*   **Dependencies:** Character Screen (#2).

#### Implementation Details

1.  **Model & Type Updates:**
    *   **`global.types.ts`:**
        *   Add `talentPoints: number` to `PlayerStats`.
        *   Add `rank: number` to the `Ability` type.
    *   **`Player.ts`:**
        *   Initialize `talentPoints: 0` in the constructor.
        *   In `levelUp()`, increment `this._baseStats.talentPoints++`.
        *   Initialize all abilities with `rank: 1`.

2.  **Talent Tree Design:**
    *   This system will use a simple linear upgrade path for each ability. Define the upgrade data in a separate configuration file for easy management.
    *   **File:** `src/config/talents.ts`

    ```typescript
    // src/config/talents.ts
    export const talentData = {
        'debug': {
            name: 'Debug',
            ranks: [
                { rank: 1, description: 'Deals 15 damage. Cost: 5 EN.' },
                { rank: 2, description: 'Deals 20 damage, applies Corrupted for 3 turns. Cost: 5 EN.' },
                { rank: 3, description: 'Deals 25 damage, applies Corrupted for 3 turns. Cost: 7 EN.' },
            ]
        },
        'refactor': {
            name: 'Refactor',
            ranks: [
                { rank: 1, description: 'Heals for 30 HP. Cost: 15 EN.' },
                { rank: 2, description: 'Heals for 45 HP. Cost: 15 EN.' },
                { rank: 3, description: 'Heals for 45 HP and removes one negative status effect. Cost: 20 EN.' },
            ]
        },
        // ... other abilities
    };
    ```

3.  **UI Implementation:**
    *   Add a new "Talents" tab or section to the `CharacterScreen.tsx` component.
    *   This UI will list the player's abilities, show their current rank, the description for the next rank, and an "Upgrade" button.
    *   The "Upgrade" button should be disabled if the player has 0 talent points or the ability is max rank.
    *   Display `Talent Points Available: {player.talentPoints}` prominently.

4.  **Logic & State Management:**
    *   **Action:** Create an `UPGRADE_ABILITY` action that takes an `abilityId` in its payload.
    *   **Reducer:**
        *   On `UPGRADE_ABILITY`, find the ability in the player's `abilities` array.
        *   Check if `player.talentPoints > 0` and the ability is not at max rank.
        *   If valid, decrement `talentPoints` and increment the ability's `rank`.
        *   Update the player state.
    *   **`BattleSystem.ts`:**
        *   When an ability is used, the `useAbility` method must be modified. It should look up the ability's current rank from the player object and use the corresponding stats (damage, cost, effects) from `talentData` to calculate the outcome.

---

### Feature #1: Intro Splash Screen & Opening Scene (Low Priority)

*   **Objective:** Add a professional-looking title screen and a skippable opening cutscene to set the story's tone.
*   **Priority:** Low
*   **Estimated Time:** 4 hours
*   **Dependencies:** None.

#### Implementation Details

1.  **Game State Machine:**
    *   The core of this feature is a simple state machine to manage what is being displayed.
    *   **`GameContext`:** Modify the state to include `currentView: 'intro' | 'cutscene' | 'gameplay' | 'battle'`. The initial state should be `'intro'`.

2.  **`App.tsx` (or main layout component) Update:**
    *   Use a `switch` statement to render the correct component based on `state.currentView`.

    ```tsx
    // App.tsx
    const { state } = useGameContext();

    const renderView = () => {
        switch (state.currentView) {
            case 'intro':
                return <IntroScreen />;
            case 'cutscene':
                return <OpeningCutscene />;
            case 'gameplay':
                return <GameBoard />;
            case 'battle':
                return <Battle />;
            default:
                return <GameBoard />;
        }
    };

    return <div className="app-container">{renderView()}</div>;
    ```

3.  **`IntroScreen.tsx` Component:**
    *   **File:** `src/components/IntroScreen/IntroScreen.tsx`
    *   Display a large ASCII art title.
    *   Show "New Game" and "Load Game" (disabled for now) options.
    *   Listen for keyboard input (Enter) to select "New Game", which will dispatch an action to change `currentView` to `'cutscene'`.

    **ASCII Art Title:**
    ```
      ______     __         __         ______   __         ______     ______     ______
     /\  ___\   /\ \       /\ \       /\  ___\ /\ \       /\  __ \   /\  ___\   /\  ___\
     \ \ \____  \ \ \____  \ \ \____  \ \  __\ \ \ \____  \ \ \/\ \  \ \ \____  \ \  __\
      \ \_____\  \ \_____\  \ \_____\  \ \_\    \ \_____\  \ \_____\  \ \_____\  \ \_____\
       \/_____/   \/_____/   \/_____/   \/_/     \/_____/   \/_____/   \/_____/   \/_____/
                                 ______   __         __
                                /\  ___\ /\ \       /\ \
                                \ \ \____ \ \ \____  \ \ \
                                 \ \_____\ \ \_____\  \ \_\
                                  \/_____/  \/_____/   \/_/
    ```

4.  **`OpeningCutscene.tsx` Component:**
    *   **File:** `src/components/OpeningCutscene/OpeningCutscene.tsx`
    *   Use `useState` and `useEffect` with `setTimeout` to cycle through an array of "scenes".
    *   Each scene can be an object `{ text: string, backgroundArt?: string }`.
    *   Display text in a classic dialogue box at the bottom of the screen.
    *   Always show a "Press Enter to Skip" message. A key listener will immediately dispatch an action to set `currentView` to `'gameplay'`. The cutscene should also do this automatically when it finishes.