# TESTING.md - Comprehensive Testing Guide for Tales of Claude

*Note for Chris: run `npx tsx tests/unit/node-test-runner.ts` in your bash to see the tests. Stop being so nose - y 😉*

## Overview

Welcome, Task Agents, to the comprehensive testing guide for "Tales of Claude"! This document outlines our robust, multi-faceted approach to ensuring the highest quality for our game. Effective testing is paramount to delivering a stable, enjoyable, and bug-free experience to our players.

We employ **THREE powerful and complementary testing approaches**, each designed to tackle different aspects of the game's functionality:

1.  **Node.js Tests**
    *   **Purpose:** These are our foundational "unit" and "integration" tests for pure game logic. They run in a Node.js environment, completely detached from the browser, making them incredibly fast and efficient. Ideal for verifying algorithms, data structures, and core game mechanics in isolation.
    *   **Location:** These tests are located in `tests/unit/node-test-runner.ts`.
    *   **Strengths:** Speed, isolation, precise logic validation, low resource consumption, and easy integration into CI pipelines.
    *   **Current Pass Rate:** An impressive 95.7% pass rate, indicating a strong core logic foundation!

2.  **Browser Console Tests**
    *   **Purpose:** These tests interact directly with the running game instance within a web browser's developer console. They are perfect for simulating user interactions, verifying UI responses, and debugging specific gameplay scenarios where visual feedback or direct DOM manipulation is required.
    *   **Location:** These tests are defined in `tests/browser/automated-playtester.ts`.
    *   **Strengths:** Real-time visual feedback, direct access to the game's runtime environment (`window.game`), easy to debug interactively, and excellent for reproducing user-reported bugs. These are the preferred method for browser-based testing due to their direct interaction and ease of debugging.

3.  **Puppeteer Tests**
    *   **Purpose:** Our most comprehensive "end-to-end" and "visual regression" tests. Puppeteer is a Node.js library that provides a high-level API to control Chrome or Chromium over the DevTools Protocol. It allows us to automate full browser interactions, capture screenshots, and simulate complex user journeys, providing robust regression coverage and visual proof of functionality.
    *   **Location:** These tests are located in `tests/browser/puppeteer-test-runner.ts`.
    *   **Strengths:** Full browser automation, visual regression testing, cross-browser (Chromium-based) compatibility, detailed reporting, and seamless CI/CD integration.
    *   **Note:** Puppeteer tests are currently experimental and browser console tests are generally preferred for their directness and ease of debugging.

## Test Infrastructure Organization

To streamline our testing efforts and provide a clear separation of concerns, our test files are now organized under the `tests/` directory with the following structure:

*   **`tests/unit/`**:
    *   Contains all Node.js-based unit and integration tests for core game logic.
    *   **`node-test-runner.ts`**: The main entry point for running these tests.

*   **`tests/browser/`**:
    *   Houses all browser-dependent tests.
    *   **`automated-playtester.ts`**: Contains the definitions for our browser console tests, designed for direct interaction with the `window.game` object. These are ideal for functional UI testing and interactive debugging.
    *   **`puppeteer-test-runner.ts`**: The entry point for our Puppeteer-driven end-to-end and visual regression tests. These automate a browser instance for broader coverage.

*   **`tests/concept/`**:
    *   This directory is reserved for experimental test implementations, such as exploring new testing frameworks (e.g., Playwright) or novel testing methodologies. Tests in this directory are not part of the standard CI pipeline unless explicitly configured.

This organization ensures that each type of test lives in its appropriate environment, making it easier to locate, run, and maintain specific test suites.

## Quick Start - Get Testing Immediately!

Before you begin, ensure you have Node.js (v18+) and npm installed.

### Prerequisites

```bash
# Ensure you are in the root directory of the 'Tales of Claude' project.
# Install all project dependencies
npm install
```

### Running Node.js Tests

These tests are the fastest to run and ideal for quick iterations on game logic.

```bash
npm run test:node
# Command: `tsx tests/unit/node-test-runner.ts`
# This directly executes our Node.js test runner using `tsx` (TypeScript execution).
# It tests core game logic, calculations, and state management in isolation.
# No browser is required, making it extremely fast.
```
**Expected Output:** A summary of passed/failed tests and suites, similar to:
```
Running Node.js Tests...
Suite: Player Stats (3/3 Passed)
  ✅ Initial HP is 100
  ✅ Level up increases max HP
  ✅ Taking damage reduces HP
Suite: Inventory Management (2/2 Passed)
  ✅ Add item to inventory
  ✅ Use consumable item
All Node.js Tests Completed.
Total Suites: 2 (5/5 Passed, 0 Failed, 0 Skipped)
```

### Running Browser Console Tests

These tests require the game to be running in your browser. They are excellent for interactive debugging and UI-related testing.

1.  **Start the Game Server:**
    ```bash
    npm run dev
    # This will start the Vite development server, usually accessible at http://localhost:5173.
    # Ensure the game loads completely in your browser.
    ```

2.  **Open Browser Console:**
    *   Navigate to `http://localhost:5173` in your preferred browser (Chrome, Firefox, Edge).
    *   Open the browser's developer console (usually by pressing `F12` or `Ctrl+Shift+I` / `Cmd+Option+I`).

3.  **Inject and Run Tests:**
    *   Paste the following code into the console and press Enter. This will instantiate our `AutomatedPlaytester`.
        ```javascript
        // Ensure the game object is available before proceeding
        if (typeof window.game === 'undefined') {
            console.error("Game object not found. Ensure the game has fully loaded.");
            // For robust automation, consider a `waitFor` utility here.
        }
        const tester = new AutomatedPlaytester({ testSpeed: 'fast', debugMode: true });
        console.log('AutomatedPlaytester initialized. Use tester.start() to begin.');
        ```
    *   **Run Specific Test Suite(s):**
        ```javascript
        await tester.start(['Movement Testing', 'Combat Testing']);
        // This will execute only the 'Movement Testing' and 'Combat Testing' suites.
        // Useful for focused debugging or verifying specific feature fixes.
        ```
    *   **Run All Test Suites:**
        ```javascript
        await tester.start();
        // This will execute all defined browser console test suites sequentially.
        // Be prepared for automated inputs and screen changes!
        ```
**Expected Behavior:** The game will play itself, simulating player inputs and interactions. Console logs will indicate test progress (PASS/FAIL).

### Running Puppeteer Tests

These tests provide end-to-end coverage and visual regression capabilities.

1.  **Ensure Game is Running:**
    ```bash
    npm run dev
    # Puppeteer needs a running instance of the game to connect to.
    ```

2.  **In a Separate Terminal:**
    ```bash
    npm run test:puppeteer
    # Command: `tsx tests/browser/puppeteer-test-runner.ts`
    # This will launch a headless (by default) Chromium browser, navigate to the game,
    # and execute the defined Puppeteer test scenarios.
    ```
**Expected Output:**
*   A new directory `test-screenshots/` will be created at the project root, containing screenshots captured during the tests. These are invaluable for visual verification and debugging.
*   A detailed test report will be generated in `test-reports/` (e.g., `test-report-YYYYMMDD_HHMMSS.json` or `test-report.html`).
*   Console output will show the progress and summary of Puppeteer test runs.

## For Task Agents - Testing Workflow

As a Task Agent, understanding when and how to leverage each testing approach is key to efficient development and bug resolution.

### When to Use Each Test Type

Choosing the right tool for the job saves time and provides the most relevant feedback.

**Use Node.js Tests When:**
*   **Testing pure game logic:**
    *   Player stats calculations (damage, healing, experience gain).
    *   Enemy AI decision-making (target selection, ability usage).
    *   Inventory management (adding, removing, stacking items).
    *   Quest state transitions (acceptance, progress updates, completion conditions).
    *   Skill tree progression and point allocation.
    *   Dialogue tree parsing and branching logic.
*   **Testing state management:**
    *   Verifying save/load mechanisms correctly serialize and deserialize game state.
    *   Ensuring persistent data (player progress, world state) is handled robustly.
*   **Verifying algorithms:**
    *   Pathfinding algorithms (A*, Dijkstra's).
    *   Collision detection logic (without rendering).
    *   Random number generation for loot drops or critical hits.
*   **Quick iteration during development:**
    *   When implementing a new game mechanic, write Node.js tests first to validate the core logic before integrating it into the UI.
*   **No UI interaction needed:**
    *   If the feature can be tested purely by manipulating data structures and calling functions, Node.js tests are the most efficient.

**Use Browser Console Tests When:**
*   **Testing UI interactions:**
    *   Verifying button clicks navigate to the correct screen.
    *   Ensuring form inputs are handled correctly (e.g., character naming).
    *   Testing drag-and-drop functionality for inventory or equipment.
    *   Validating menu navigation and sub-menu access.
*   **Verifying visual elements are working:**
    *   Checking if health bars update visually after damage.
    *   Confirming quest markers appear/disappear on the map.
    *   Ensuring dialogue text renders correctly and progresses.
    *   Validating item icons display in the inventory.
*   **Debugging specific gameplay scenarios:**
    *   Reproducing a bug that only occurs when a player performs a specific sequence of actions (e.g., open inventory, use potion, then attack).
    *   Testing complex combat sequences with specific ability timings.
*   **Need to see what's happening in real-time:**
    *   The visual feedback in the browser is invaluable for understanding the flow of a test and identifying unexpected UI states.
    *   Allows for interactive pauses and inspection of the DOM/game state during a test run.

**Use Puppeteer Tests When:**
*   **Running full regression tests:**
    *   Before a major release, run all Puppeteer tests to ensure no new changes have broken existing functionality or introduced visual regressions.
*   **Generating visual proof of functionality:**
    *   Screenshots captured by Puppeteer serve as concrete evidence that a feature works as expected, both functionally and visually.
    *   Useful for stakeholder reviews or bug reports.
*   **Testing across different viewports/resolutions:**
    *   Puppeteer can simulate various screen sizes, allowing you to test responsiveness and layout integrity.
*   **CI/CD integration:**
    *   Automate Puppeteer tests as part of your continuous integration pipeline to catch critical issues early in the development cycle.
    *   Ensures that every pull request or commit is automatically validated.
*   **Creating detailed test reports for review:**
    *   Puppeteer tests can be configured to generate comprehensive reports (e.g., JUnit XML, HTML reports) that summarize test results, including links to screenshots and error logs.

## Creating New Tests - Examples for Agents

These examples illustrate how to add new tests to each of our testing frameworks. Pay close attention to the structure, assertions, and use of helper functions.

#### Example 1: Adding a Node.js Test

Node.js tests are typically added to `tests/unit/node-test-runner.ts`. They focus on isolated logic.

```typescript
// tests/unit/node-test-runner.ts

// ... (existing imports and runTest/assert functions) ...

// Example: Testing a new boss enemy's properties and a specific ability's damage calculation
await runTest('New Boss Enemy - Dragon Lord', async () => {
    // 1. Setup: Create a mock player and the boss enemy
    const mockPlayer = {
        id: 'player_mock',
        stats: { hp: 200, defense: 50, attack: 30, level: 10 },
        buffs: [],
        equipment: { weapon: 'legendary_sword' }
    };
    // Assuming Enemy constructor can take an ID to load data from a mock data source
    const boss = new Enemy('dragon_lord'); 

    // 2. Assert Initial Properties: Verify the boss's base stats
    assert(boss.stats.hp === 5000, `Boss HP should be 5000, but was ${boss.stats.hp}`);
    assert(boss.stats.attack === 150, `Boss attack should be 150, but was ${boss.stats.attack}`);
    assert(boss.abilities.includes('fireBreath'), 'Boss should have fireBreath ability');
    assert(boss.abilities.includes('tailWhip'), 'Boss should have tailWhip ability');
    assert(boss.weaknesses.includes('ice'), 'Boss should be weak to ice');

    // 3. Action & Assert: Test damage calculation for a specific ability
    // Assuming a method `calculateDamage` exists on the CombatService
    const fireBreathDamage = CombatService.calculateDamage(
        boss,
        'fireBreath',
        mockPlayer
    );
    // Fire breath should deal between 200 and 300 damage, considering player defense
    assert(
        fireBreathDamage >= 200 && fireBreathDamage <= 300,
        `Fire breath damage out of expected range: ${fireBreathDamage}`
    );

    // Test another ability with a different effect (e.g., debuff)
    const tailWhipEffect = CombatService.applyAbilityEffect(
        boss,
        'tailWhip',
        mockPlayer
    );
    assert(
        tailWhipEffect.debuffs.includes('stunned'),
        'Tail whip should apply stun debuff'
    );
    assert(
        tailWhipEffect.damage > 0,
        'Tail whip should also deal damage'
    );

    // 4. Cleanup: (Not typically needed for isolated Node.js tests as they don't modify global state)
    // If you were testing a singleton service that maintained state, you might reset it here.
});

// Example: Testing a new item's effect on player stats
await runTest('New Item - Elixir of Vitality', async () => {
    const player = new Player(); // Assume Player class can be instantiated for testing
    const initialHP = player.stats.hp;
    const initialMaxHP = player.stats.maxHp;

    // Simulate adding and using the elixir
    player.inventory.addItem('elixir_of_vitality');
    const elixir = player.inventory.getItem('elixir_of_vitality');
    assert(elixir !== null, 'Elixir of Vitality should be in inventory');

    player.useItem(elixir.id); // Assume useItem method exists

    // Assert the effect
    assert(player.stats.hp > initialHP, 'Elixir should have healed the player');
    assert(player.stats.maxHp === initialMaxHP + 50, 'Elixir should have increased max HP by 50');
    assert(!player.inventory.hasItem('elixir_of_vitality'), 'Elixir should be consumed after use');
});
```

#### Example 2: Adding a Browser Console Test

Browser console tests are defined within `tests/browser/automated-playtester.ts`. They simulate user interaction and observe UI/game state changes.

```typescript
// tests/browser/automated-playtester.ts

// ... (existing imports and class definition) ...

class AutomatedPlaytester {
    // ... (constructor and existing methods) ...

    /**
     * @private
     * Tests the activation and effect of a new power-up item.
     * This involves player movement, interaction, and state verification.
     */
    private async testPowerUpActivation(): Promise<void> {
        await this.runSuite('New Feature Testing - Power-Up', async () => {
            await this.runTest('Activate Speed Boost Power-Up', async () => {
                // 1. Setup: Reset game state and teleport player to a known location near the power-up.
                await this.resetGame();
                const powerUpLocation = { x: 15, y: 10 };
                
                // Use debug command to place player precisely for the test
                await this.executeDebugCommand(`teleportPlayer(${powerUpLocation.x}, ${powerUpLocation.y})`);
                await sleep(this.config.movementDelay * 2); // Give game time to update player position visually

                // Verify player is at the power-up location
                const currentPlayerPos = this.readGameState().player.position;
                assert(
                    currentPlayerPos.x === powerUpLocation.x && currentPlayerPos.y === powerUpLocation.y,
                    `Player not at power-up location. Expected (${powerUpLocation.x},${powerUpLocation.y}), Got (${currentPlayerPos.x},${currentPlayerPos.y})`
                );
                
                // 2. Action: Simulate pressing the 'e' key to interact (pick up power-up)
                console.log('Attempting to pick up power-up by pressing "e"...');
                await this.pressKey('e');
                await sleep(this.config.interactionDelay); // Wait for interaction to process

                // 3. Assert: Verify the power-up effect by checking player state
                console.log('Waiting for speed_boost buff to appear...');
                await this.waitForState(
                    s => s.player.buffs.includes('speed_boost'),
                    this.config.stateCheckTimeout,
                    'speed boost activation'
                );
                
                const finalPlayerState = this.readGameState().player;
                assert(
                    finalPlayerState.buffs.includes('speed_boost'),
                    'Player should have "speed_boost" buff after pickup'
                );
                
                // Verify the actual effect on player stats (e.g., movement speed)
                // Assuming base speed is 1 and speed_boost doubles it to 2
                assert(
                    finalPlayerState.moveSpeed === 2,
                    `Player speed should be 2 after speed boost, but was ${finalPlayerState.moveSpeed}`
                );

                // 4. Cleanup: (Implicitly handled by resetGame at start of next test or suite)
                // For this specific test, we might want to ensure the buff expires or is removed if it's long-lasting.
                // await this.executeDebugCommand('removeBuff("speed_boost")');
            });

            await this.runTest('Power-Up Cooldown and Re-activation', async () => {
                await this.resetGame();
                await this.executeDebugCommand(`teleportPlayer(15, 10)`);
                await sleep(this.config.movementDelay);

                // Pick up first time
                await this.pressKey('e');
                await this.waitForState(s => s.player.buffs.includes('speed_boost'), this.config.stateCheckTimeout, 'first speed boost');
                assert(this.readGameState().player.moveSpeed === 2, 'Speed should be 2 after first boost');

                // Wait for buff to expire (assuming a 5-second duration for example)
                console.log('Waiting for speed boost to expire...');
                await sleep(5000 + this.config.uiDelay); // Wait duration + buffer
                await this.waitForState(s => !s.player.buffs.includes('speed_boost'), this.config.stateCheckTimeout, 'speed boost expiration');
                assert(this.readGameState().player.moveSpeed === 1, 'Speed should return to 1 after boost expires');

                // Try to pick up again immediately (should fail if cooldown)
                await this.pressKey('e');
                await sleep(this.config.interactionDelay);
                assert(!this.readGameState().player.buffs.includes('speed_boost'), 'Should not get speed boost immediately after cooldown');

                // Wait for cooldown to pass (e.g., 10 seconds total cooldown)
                console.log('Waiting for power-up cooldown...');
                await sleep(5000 + this.config.uiDelay); // Remaining cooldown
                
                // Pick up again after cooldown
                await this.pressKey('e');
                await this.waitForState(s => s.player.buffs.includes('speed_boost'), this.config.stateCheckTimeout, 'second speed boost');
                assert(this.readGameState().player.moveSpeed === 2, 'Speed should be 2 after second boost');
            });
        });
    }

    // Add this method to the `start` method's suite execution list:
    // public async start(suitesToRun?: string[]): Promise<void> {
    //     // ...
    //     if (!suitesToRun || suitesToRun.includes('New Feature Testing - Power-Up')) {
    //         await this.testPowerUpActivation();
    //     }
    //     // ...
    // }
}
```

#### Example 3: Verifying a Fix with Targeted Tests

After fixing a bug, it's crucial to verify the fix and ensure no regressions were introduced.

```bash
# Scenario: A bug was reported where player HP was not correctly updated after combat.
# The fix involved changes to the CombatService and PlayerState management.

# 1. Run targeted Node.js tests for the specific logic area.
#    This quickly verifies the underlying calculations and state updates.
npm run test:node -- --filter "Combat|Player Stats"
# The `--filter` flag (or `--suite` depending on runner implementation)
# allows you to run only tests whose names or suite names contain "Combat" or "Player Stats".
# This is much faster than running all Node.js tests.

# 2. Run browser console tests for that feature.
#    This verifies the UI interaction and visual feedback.
#    First, ensure the game is running: `npm run dev`
#    Then, in the browser console:
const tester = new AutomatedPlaytester({ testSpeed: 'normal' });
await tester.start(['Combat Testing', 'Character Screen Testing']);
# This will simulate combat scenarios and then check the character screen
# to ensure HP, XP, and other stats are displayed correctly after battle.

# 3. Generate visual proof with Puppeteer.
#    This provides screenshots for regression checks and confirms end-to-end flow.
#    First, ensure the game is running: `npm run dev`
#    Then, in a separate terminal:
npm run test:puppeteer -- --suite "Combat" --screenshot-on-pass
# The `--suite "Combat"` flag limits Puppeteer to only run tests related to combat.
# `--screenshot-on-pass` (if supported by your Puppeteer runner) ensures you get
# visual evidence even for successful runs, which is great for regression.
# Review the generated screenshots in `test-screenshots/` to visually confirm the fix.
```

## Test Coverage - What Each Suite Tests

Our test suites are designed to cover critical areas of the game. This section details the scope of each major suite.

### Node.js Test Suites (`tests/unit/node-test-runner.ts`)

*   **Player Stats & Progression Testing**
    *   Initial player HP, MP, and base stats.
    *   Experience gain and level-up mechanics (stat increases, new abilities unlocked).
    *   Stat point allocation and its effects.
    *   Buff/debuff application and expiration logic.
    *   Equipment stat bonuses.
    *   Player death and revival conditions.
*   **Combat Logic Testing**
    *   Damage calculation formulas (player vs. enemy, enemy vs. player).
    *   Critical hit and dodge chance mechanics.
    *   Ability cooldowns and mana costs.
    *   Turn order determination.
    *   Victory/defeat conditions and associated rewards/penalties.
    *   Status effect application (poison, stun, burn) and their tick damage/duration.
*   **Inventory & Item Logic Testing**
    *   Adding and removing items from inventory.
    *   Item stacking and unstacking.
    *   Consumable item effects (healing, mana restoration, temporary buffs).
    *   Equipment slot management (equipping, unequipping, validating slot types).
    *   Item durability and breakage.
    *   Loot generation mechanics.
*   **Quest System Logic Testing**
    *   Quest acceptance and rejection.
    *   Progress tracking for various quest types (kill X enemies, collect Y items, talk to Z NPC).
    *   Completion triggers and reward distribution (XP, gold, items).
    *   Quest log updates and status changes.
    *   Prerequisite quests and quest chains.
*   **NPC & Dialogue Logic Testing**
    *   NPC state management (friendly, hostile, quest-giver).
    *   Dialogue tree traversal and branching logic.
    *   Conditional dialogue based on player stats or quest progress.
    *   Shop inventory management and pricing logic.
*   **Save/Load Data Integrity Testing**
    *   Serialization and deserialization of full game state.
    *   Verification that all critical data points (player, inventory, map, quests) are correctly saved and loaded.
    *   Handling of corrupted or incomplete save files.

### Browser Console Test Suites (`tests/browser/automated-playtester.ts`)

*   **Movement Testing**
    *   Player position updates correctly based on keyboard input (WASD).
    *   Collision detection with walls, obstacles, and map boundaries.
    *   Diagonal movement handling and speed consistency.
    *   Debug teleportation functionality (used for test setup).
    *   Player animation states during movement.
*   **NPC Interaction Testing**
    *   Dialogue activation on proximity and 'e' key press.
    *   Text display and progression through dialogue lines.
    *   NPC state persistence after interaction (e.g., quest given).
    *   Multiple dialogue branches and player choice handling.
    *   Quest giver interactions (accepting/declining quests via UI).
    *   Visual feedback for interaction prompts.
*   **Combat Testing**
    *   Battle initiation on enemy contact or specific trigger.
    *   Turn-based action system UI responsiveness.
    *   Damage numbers display correctly on screen.
    *   Victory/defeat screen display and navigation.
    *   Ability usage via UI buttons and cooldown visual indicators.
    *   Enemy AI decisions reflected in their actions.
    *   Player HP/MP bar updates during combat.
*   **Item & Inventory UI Testing**
    *   Item pickup mechanics (visual disappearance from world, appearance in inventory).
    *   Inventory screen activation and display (correct item icons, quantities).
    *   Consumable item usage via UI (e.g., clicking a potion).
    *   Equipment system UI (dragging items to slots, visual changes to player avatar).
    *   Item stacking and splitting via UI.
    *   Shop transactions (buying/selling items, gold updates).
*   **Save/Load UI Testing**
    *   Accessing the save/load menu.
    *   Creating new save files.
    *   Loading existing save files and verifying visual state restoration (player position, map, active quests).
    *   Confirmation prompts for overwriting saves.
*   **Map Transition Testing**
    *   Portal functionality (walking into a portal triggers transition).
    *   Entity spawning on new maps (NPCs, enemies, items).
    *   State cleanup between maps (e.g., old enemies despawn).
    *   Bidirectional transitions (can go back and forth).
    *   Loading screen display during transitions.
*   **Shop Interaction Testing**
    *   UI activation and display upon interacting with a merchant.
    *   Item listing with correct prices and quantities.
    *   Purchase mechanics (clicking buy, gold deduction, item addition).
    *   Sell functionality (selecting item, gold addition, item removal).
    *   Error messages for insufficient gold or inventory space.
*   **Character Screen Testing**
    *   Stats display (HP, MP, Attack, Defense, Level, XP).
    *   Equipment visualization (equipped items shown on character model/slots).
    *   Experience bar and level display updates.
    *   Screen navigation (tabs for stats, equipment, abilities).
    *   Ability tree display and point allocation UI.
*   **Quest System UI Testing**
    *   Quest acceptance UI flow.
    *   Progress tracking display in quest log.
    *   Completion triggers (e.g., submitting items to NPC).
    *   Reward distribution UI (pop-ups, inventory updates).
    *   Quest markers on map/minimap.

## Adding New Tests - A Step-by-Step Guide

Adding new tests is a fundamental task for Task Agents. Follow this structured approach to ensure your tests are effective, maintainable, and contribute positively to our test coverage.

### Step 1: Identify What to Test

Before writing any code, clearly define the scope and objective of your test.

```typescript
// Good test characteristics:
// 1. Tests ONE specific thing: Focus on a single piece of functionality or a single interaction.
//    - Bad: "Test everything about combat."
//    - Good: "Test player damage calculation against a low-defense enemy."
//    - Good: "Test that a healing potion restores HP within a specific range."
// 2. Has clear pass/fail criteria: You should know exactly what constitutes a success or a failure.
//    - Bad: "Game should feel responsive."
//    - Good: "Player's HP should be 100 after using a full heal potion."
//    - Good: "Player's position should be (5,5) after teleporting."
// 3. Cleans up after itself: Tests should leave the environment in a predictable state for subsequent tests.
//    - This is crucial for test isolation and preventing flaky tests. Use `resetGame()` or specific teardown.
// 4. Provides helpful error messages: When a test fails, the error message should immediately tell you *what* failed and *why*.
//    - Bad: "Assertion failed."
//    - Good: "Player HP mismatch. Expected 100, but got 75 after healing potion."
// 5. Is repeatable and deterministic: Running the test multiple times should yield the same result, every time.
//    - Avoid reliance on external factors, random numbers (unless testing randomness itself), or timing-sensitive operations without proper waits.
```
**Example Scenario:** You're implementing a new "Dash" ability for the player.
*   **What to test (logic):**
    *   Does it consume stamina?
    *   Does it move the player a specific distance?
    *   Does it have a cooldown?
    *   Can it be used through obstacles? (Should not)
*   **What to test (UI/interaction):
    *   Does the Dash button activate?
    *   Does the player visually dash?
    *   Does the stamina bar update?
    *   Does the cooldown visually appear?
    *   Can it be used while stunned? (Should not)

### Step 2: Choose Test Location

The type of test you're writing dictates where it should reside.

```typescript
// For pure logic tests (calculations, data manipulation, algorithms):
// -> tests/unit/node-test-runner.ts
//    - These tests are fast and don't require a browser.
//    - They directly interact with game service functions or class methods.

// For UI interaction tests (button clicks, screen navigation, visual updates):
// -> tests/browser/automated-playtester.ts
//    - These tests run in the browser console and simulate user input.
//    - They use `window.game` and `this.pressKey`, `this.waitForState`, etc.

// For end-to-end user journeys, visual regression, or cross-browser checks:
// -> tests/browser/puppeteer-test-runner.ts
//    - These tests launch a browser instance and automate high-level interactions.
//    - They capture screenshots and are ideal for CI/CD.
```
**Decision for "Dash" ability:**
*   **Node.js:** Test stamina consumption, distance calculation, cooldown logic, collision check *logic*.
*   **Browser Console:** Test pressing the dash key, player visual movement, stamina bar update, cooldown visual, inability to dash through walls (UI feedback).
*   **Puppeteer:** Full user journey involving dashing through a level, ensuring no visual glitches, and overall responsiveness.

### Step 3: Write the Test

Follow a consistent structure: Setup, Action, Assert, Cleanup. This makes tests readable and maintainable.

```typescript
// Template for a new Browser Console Test (in automated-playtester.ts)
// Add this as a new private async method within the AutomatedPlaytester class.

/**
 * @private
 * Tests the player's new Dash ability: stamina consumption, movement, and cooldown.
 * Ensures the player cannot dash through solid obstacles.
 */
private async testPlayerDashAbility(): Promise<void> {
    await this.runSuite('Player Abilities - Dash', async () => {
        await this.runTest('Dash - Basic Functionality and Stamina Cost', async () => {
            // 1. Setup: Reset game, ensure player has full stamina and is at a known position.
            await this.resetGame();
            await this.executeDebugCommand('giveStamina(100)'); // Ensure full stamina
            await this.executeDebugCommand('teleportPlayer(5, 5)');
            await sleep(this.config.movementDelay); // Allow game to settle

            const initialPlayerState = this.readGameState().player;
            const initialStamina = initialPlayerState.stamina;
            const initialPos = { x: initialPlayerState.position.x, y: initialPlayerState.position.y };
            
            // Assuming dash consumes 20 stamina and moves 3 tiles
            const expectedStaminaAfterDash = initialStamina - 20;
            const expectedXAfterDash = initialPos.x + 3; // Assuming dash right

            // 2. Action: Simulate pressing the dash key (e.g., 'shift')
            console.log('Attempting to dash right...');
            await this.pressKey('d', 'down'); // Hold 'd' for direction
            await this.pressKey('shift'); // Press 'shift' to dash
            await this.releaseKey('d'); // Release 'd'
            await sleep(this.config.movementDelay * 5); // Give time for dash animation and state update

            // 3. Assert: Verify stamina reduction and new position.
            const afterDashState = this.readGameState().player;
            assert(
                afterDashState.stamina === expectedStaminaAfterDash,
                `Stamina mismatch after dash. Expected ${expectedStaminaAfterDash}, got ${afterDashState.stamina}`
            );
            assert(
                afterDashState.position.x === expectedXAfterDash && afterDashState.position.y === initialPos.y,
                `Player position incorrect after dash. Expected (${expectedXAfterDash},${initialPos.y}), got (${afterDashState.position.x},${afterDashState.position.y})`
            );
            assert(
                afterDashState.cooldowns.dash > 0,
                `Dash ability should be on cooldown, but cooldown is ${afterDashState.cooldowns.dash}`
            );

            // 4. Cleanup: (resetGame at the start of the next test handles this)
        });

        await this.runTest('Dash - Cannot Dash Through Walls', async () => {
            await this.resetGame();
            // Teleport player right next to a wall (e.g., wall at x=7)
            await this.executeDebugCommand('teleportPlayer(6, 5)');
            await sleep(this.config.movementDelay);

            const initialPlayerState = this.readGameState().player;
            const initialPos = { x: initialPlayerState.position.x, y: initialPlayerState.position.y };

            // Attempt to dash into the wall
            console.log('Attempting to dash into a wall...');
            await this.pressKey('d', 'down');
            await this.pressKey('shift');
            await this.releaseKey('d');
            await sleep(this.config.movementDelay * 5);

            // Assert: Player position should not have changed significantly, or should be blocked.
            const afterDashState = this.readGameState().player;
            assert(
                afterDashState.position.x === initialPos.x && afterDashState.position.y === initialPos.y,
                `Player should not have moved through wall. Expected (${initialPos.x},${initialPos.y}), got (${afterDashState.position.x},${afterDashState.position.y})`
            );
            // Optionally, assert that stamina was still consumed if the attempt was made
            assert(
                afterDashState.stamina < initialPlayerState.stamina,
                'Stamina should still be consumed even if dash is blocked by wall'
            );
        });
    });
}

// Remember to add `this.testPlayerDashAbility()` to the `start` method's suite execution list
// in `tests/browser/automated-playtester.ts` so it runs when `tester.start()` is called.
// Example:
// public async start(suitesToRun?: string[]): Promise<void> {
//     if (!suitesToRun || suitesToRun.includes('Player Abilities - Dash')) {
//         await this.testPlayerDashAbility();
//     }
//     // ... other suites
// }
```

### Step 4: Run and Verify

After writing your test, run it to ensure it passes and accurately reflects the desired behavior.

```bash
# For the example above (Browser Console Test):
# 1. Start the game server:
npm run dev

# 2. In your browser console:
const tester = new AutomatedPlaytester({ debugMode: true, testSpeed: 'normal' });
await tester.start(['Player Abilities - Dash']);

# Check the output:
# Look for: ✅ PASS or ❌ FAIL messages in the console.
# Read error messages carefully: If a test fails, the assertion message will guide you.
# Observe the game: Watch the player's movement, stamina bar, and cooldowns visually.
# Use console.log: Add `console.log` statements within your test to trace execution flow and variable values.
```
**Verification Checklist:**
*   Does the test pass when the feature is working correctly?
*   Does the test fail when the feature is broken (e.g., temporarily introduce a bug to confirm)?
*   Are the error messages clear and actionable?
*   Does the test run consistently every time?
*   Does the test clean up after itself, leaving the game in a good state?

## Troubleshooting - Common Issues and Solutions

Even with the best practices, tests can sometimes fail or behave unexpectedly. Here are common issues and how to resolve them.

#### Issue: "window.game not found" or "game is undefined"
**Cause:** The game's global `game` object (or `window.game`) has not been fully initialized in the browser when the test script tries to access it. This often happens if the test runs too quickly after the page loads.
**Solution:** Implement a robust wait mechanism that polls for the `window.game` object to become available.
```javascript
// In automated-playtester.ts or Puppeteer tests:
import { waitFor } => './utils/test-utils'; // Assuming a utility function

// Before any test interaction:
await waitFor(
    () => typeof window.game !== 'undefined' && window.game._isInitialized,
    30000, // Timeout after 30 seconds
    'window.game object to be initialized'
);
console.log('Game object is ready!');
```

#### Issue: "Test timeout" or "waitForState timed out"
**Cause:** A condition that the test is waiting for (e.g., a state change, a UI element to appear) did not occur within the specified timeout period. This could be due to:
1.  The condition never becoming true (a bug in the game).
2.  The condition taking longer than expected to become true (performance issue or insufficient timeout).
3.  A race condition where the state changes too quickly before the test can observe it.
**Solution:**
*   **Increase timeout:** If the operation is genuinely slow (e.g., a complex map load), increase the timeout.
    ```javascript
    await this.waitForState(condition, 10000); // 10 seconds timeout
    ```
*   **Check for infinite loops/deadlocks:** Debug the game logic to ensure the expected state change *will* eventually happen.
*   **Add more `sleep` calls:** For UI animations or complex sequences, sometimes a small `sleep` can help stabilize the state before a `waitForState`.
*   **Verify condition logic:** Double-check the lambda function passed to `waitForState` to ensure it correctly identifies the desired state.
*   **Inspect game logs:** Look for errors or warnings in the game's console output that might indicate why the state isn't updating.

#### Issue: "Cannot read property 'x' of undefined" or similar `TypeError`
**Cause:** The test is trying to access a property of an object that is `null` or `undefined`. This usually means:
1.  An expected object (e.g., an NPC, an item) was not found in the game state.
2.  A game service or component failed to initialize correctly.
3.  The test assumed a certain state that was not met (e.g., player has an item, but they don't).
**Solution:**
*   **Add null checks and defensive coding:** Before accessing properties, verify the object exists.
    ```javascript
    const npc = state.npcs?.find(n => n.id === 'merchant');
    if (!npc) {
        throw new Error('Merchant NPC not found on map. Test setup failed or NPC missing.');
    }
    // Now it's safe to access npc.position, etc.
    ```
*   **Review test setup:** Ensure all preconditions for the test are met (e.g., player has enough gold, specific enemies are spawned). Use debug commands to set up the environment precisely.
*   **Check game initialization:** Ensure all game modules and data are loaded before the test begins.

#### Issue: "State not updating" or "UI not responding to input"
**Cause:** The game's internal state management might not be correctly dispatching updates, or the UI is not reacting to state changes. This can also be a timing issue where the test asserts before the UI has had a chance to render the new state.
**Solution:**
*   **Verify event dispatching:** If using a Redux-like pattern, ensure `dispatch(action)` is actually being called and the reducer is processing it.
    ```javascript
    // In game code:
    console.log('Dispatching action:', action.type, action.payload);
    dispatch(action);

    // In test:
    await sleep(this.config.uiDelay); // Give UI time to render
    await this.waitForState(condition, timeout);
    ```
*   **Check state selectors/getters:** Ensure the test is reading the correct part of the state.
*   **Inspect DOM:** Use browser dev tools to manually inspect the DOM after an action to see if the UI elements have changed as expected.
*   **Increase `uiDelay` or `interactionDelay`:** Sometimes, simply giving the game a bit more time to process inputs and render updates can resolve flaky tests.

#### Issue: "Screenshots not generated" or "Puppeteer fails to launch browser"
**Cause:** Puppeteer might be having trouble launching Chromium, or the screenshot path is incorrect, or the test is failing before the screenshot command.
**Solution:**
*   **Check Puppeteer configuration:**
    *   Ensure `headless` mode is set correctly (`headless: 'new'` is recommended for modern Puppeteer).
    *   For CI environments, `args: ['--no-sandbox']` is often necessary.
    *   Verify `executablePath` if you're using a specific Chromium build.
    ```javascript
    const browser = await puppeteer.launch({
        headless: 'new', // Use new headless mode for better performance/stability
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Essential for CI/Linux
        // executablePath: '/usr/bin/google-chrome' // Uncomment if you need a specific path
    });
    ```
*   **Verify screenshot path:** Ensure the directory exists and Puppeteer has write permissions.
*   **Add `try...catch` blocks:** Wrap Puppeteer actions in `try...catch` to log errors and ensure screenshots are taken even on failure.
*   **Run in non-headless mode:** Temporarily set `headless: false` to visually observe Puppeteer's actions and see if the browser launches at all.

## Best Practices - Writing Robust and Maintainable Tests

Adhering to these best practices will make your tests more reliable, easier to understand, and less prone to breaking with future changes.

### 1. Test Isolation
Each test should be independent and not rely on the state left by previous tests. This prevents "flaky" tests that pass or fail inconsistently.

```typescript
// Good Example: Isolated Test
await this.runTest('Isolated Test - Player Starts with Full HP', async () => {
    // Always start fresh for critical state-dependent tests
    await this.resetGame(); // Resets player stats, inventory, map, quests, etc.
    
    const playerState = this.readGameState().player;
    assert(playerState.hp === playerState.maxHp, 'Player HP should be full at start');
    assert(playerState.inventory.length === 0, 'Inventory should be empty at start');
    
    // Test logic here, knowing you have a clean slate.
    // ...
});

// Bad Example: Dependent Test (Avoid this pattern)
// Test A: Player picks up sword
// Test B: Player attacks with sword (relies on Test A having picked up the sword)
// If Test A fails or is skipped, Test B will also fail, masking the true issue.
```
**Key Takeaway:** Use `this.resetGame()` at the beginning of each test (or at least each suite) in `tests/browser/automated-playtester.ts` and `tests/browser/puppeteer-test-runner.ts`. Node.js tests are inherently more isolated as they often work with new instances of objects.

### 2. Meaningful Assertions
Assertions are the core of your tests. Make them descriptive so that when a test fails, you immediately understand the problem.

```typescript
// Bad Assertion (unhelpful error message)
assert(value === 100); // If this fails, you only know 'value' wasn't 100. What 'value'? Why 100?

// Good Assertion (clear and informative)
assert(
    player.hp === 100,
    `Player HP should be 100 after healing potion, but was ${player.hp}`
);

// Another Good Example:
assert(
    inventory.hasItem('health_potion'),
    `Player inventory should contain 'health_potion' after pickup, but it does not.`
);

// For complex objects, consider deep equality checks or specific property checks:
// assert.deepStrictEqual(player.position, { x: 10, y: 5 }, 'Player position mismatch');
```

### 3. Use Helper Functions
Abstract common test patterns or complex setup steps into reusable helper functions. This reduces code duplication, improves readability, and makes tests easier to maintain.

```typescript
// Example Helper Function (in automated-playtester.ts)
/**
 * @private
 * Moves the player to a specific tile coordinate using simulated key presses.
 * This is a simplified example; a real implementation might use pathfinding.
 * @param {number} targetX - The target X coordinate.
 * @param {number} targetY - The target Y coordinate.
 * @param {number} [maxSteps=100] - Maximum steps to prevent infinite loops.
 */
private async movePlayerTo(targetX: number, targetY: number, maxSteps: number = 100): Promise<void> {
    let steps = 0;
    while (steps < maxSteps) {
        const playerPos = this.readGameState().player.position;
        if (playerPos.x === targetX && playerPos.y === targetY) {
            console.log(`Player reached target (${targetX}, ${targetY}).`);
            return;
        }

        let moved = false;
        if (playerPos.x < targetX) {
            await this.pressKey('d'); // Move Right
            moved = true;
        } else if (playerPos.x > targetX) {
            await this.pressKey('a'); // Move Left
            moved = true;
        }

        if (playerPos.y < targetY) {
            await this.pressKey('s'); // Move Down
            moved = true;
        } else if (playerPos.y > targetY) {
            await this.pressKey('w'); // Move Up
            moved = true;
        }

        if (!moved) {
            console.warn(`Player stuck or unable to move towards (${targetX}, ${targetY}). Current: (${playerPos.x}, ${playerPos.y})`);
            break; // Prevent infinite loop if stuck
        }
        await sleep(this.config.movementDelay); // Wait for movement to register
        steps++;
    }
    throw new Error(`Failed to move player to (${targetX}, ${targetY}) within ${maxSteps} steps.`);
}

// Usage in a test:
await this.runTest('Player Movement to Specific Location', async () => {
    await this.resetGame();
    await this.movePlayerTo(10, 15); // Use the helper
    const finalPos = this.readGameState().player.position;
    assert(finalPos.x === 10 && finalPos.y === 15, 'Player should be at (10,15)');
});
```

### 4. Test Edge Cases
Beyond the "happy path," consider boundary conditions and unusual inputs. This uncovers bugs that might not appear in typical usage.

```typescript
await this.runTest('HP Regeneration - Edge Cases', async () => {
    await this.resetGame();
    const player = this.readGameState().player; // Get mutable player object for testing

    // Test minimum values: Healing from 1 HP
    await this.executeDebugCommand('setPlayerHp(1)');
    await this.executeDebugCommand('giveItem("basic_health_potion")');
    await this.pressKey('i'); // Open inventory
    await sleep(this.config.uiDelay);
    await this.pressKey('1'); // Use first item (potion)
    await sleep(this.config.interactionDelay);
    assert(player.hp > 1, 'Potion should heal player from 1 HP');
    assert(player.hp <= player.maxHp, 'HP should not exceed max HP after healing');

    // Test maximum values: Healing when already at max HP
    await this.executeDebugCommand('setPlayerHp(player.maxHp)');
    await this.executeDebugCommand('giveItem("basic_health_potion")');
    await this.pressKey('i');
    await sleep(this.config.uiDelay);
    await this.pressKey('1');
    await sleep(this.config.interactionDelay);
    assert(player.hp === player.maxHp, 'HP should not exceed max HP when already full');

    // Test invalid input (e.g., using a non-consumable item as consumable)
    await this.executeDebugCommand('giveItem("iron_sword")');
    await this.pressKey('i');
    await sleep(this.config.uiDelay);
    await this.pressKey('1'); // Try to "use" the sword
    await sleep(this.config.interactionDelay);
    assert(player.inventory.includes('iron_sword'), 'Iron sword should not be consumed');
    // Assert no error message popped up for invalid use (if applicable)
});
```

### 5. Document Test Purpose
Add comments or JSDoc to your test functions and suites explaining their purpose, what they cover, and any specific assumptions. This is invaluable for future Task Agents (and your future self!).

```typescript
/**
 * @suite Combat Testing
 * This suite covers various aspects of the game's combat system,
 * including battle initiation, turn-based mechanics, damage application,
 * and victory/defeat conditions.
 */
// In tests/browser/automated-playtester.ts:
private async testCombatSystem(): Promise<void> {
    await this.runSuite('Combat Testing', async () => {
        /**
         * @test Enter Combat and Win
         * Verifies that the player can successfully initiate combat,
         * defeat an enemy, and receive appropriate rewards (XP, gold).
         * Assumes player has sufficient stats to win against a 'weak_goblin'.
         */
        await this.runTest('Enter Combat and Win', async () => {
            // ... test implementation ...
        });
    });
}
```

## Test Utilities - Your Toolkit for Effective Testing

Our testing frameworks provide a rich set of utilities to help you set up test scenarios, interact with the game, and verify outcomes.

### Debug Commands Available (`window.game._debug`)

These commands are injected into the global `window.game` object when running in development mode (`npm run dev`). They allow you to manipulate the game state directly for testing purposes without needing to simulate complex user actions.

```javascript
// Access the debug object:
// window.game._debug

// Teleport player to specific coordinates (x, y) on the current map
window.game._debug.teleportPlayer(10, 5);
console.log('Player teleported to (10,5)');

// Spawn an enemy of a specific type at coordinates (x, y)
window.game._debug.spawnEnemy('goblin', 12, 6);
window.game._debug.spawnEnemy('skeleton_archer', 15, 8, { hp: 50, attack: 10 }); // With optional custom stats
console.log('Goblin and skeleton spawned.');

// Give the player a specific item by its ID
window.game._debug.giveItem('iron_sword');
window.game._debug.giveItem('health_potion', 5); // Give 5 health potions
console.log('Player received iron sword and 5 health potions.');

// Set player's current HP or MP
window.game._debug.setPlayerHp(50);
window.game._debug.setPlayerMp(20);
console.log('Player HP set to 50, MP to 20.');

// Set player's max HP or MP
window.game._debug.setPlayerMaxHp(200);
window.game._debug.setPlayerMaxMp(100);
console.log('Player max HP set to 200, max MP to 100.');

// Give player experience points
window.game._debug.giveExperience(1000);
console.log('Player gained 1000 XP.');

// Give player gold
window.game._debug.giveGold(500);
console.log('Player gained 500 gold.');

// Complete a specific quest by its ID
window.game._debug.completeQuest('main_quest_1');
console.log('Quest "main_quest_1" completed.');

// Accept a specific quest by its ID
window.game._debug.acceptQuest('side_quest_goblin_hunt');
console.log('Quest "side_quest_goblin_hunt" accepted.');

// Reset the entire game state to its initial start-up condition
// This is crucial for test isolation!
window.game._debug.resetGame();
console.log('Game state reset.');

// Change the current map
window.game._debug.changeMap('forest_map');
console.log('Map changed to forest_map.');

// Apply a buff or debuff to the player
window.game._debug.applyBuff('speed_boost', 5000); // 5 seconds duration
window.game._debug.applyDebuff('poison', 10000, 5); // 10 seconds, 5 damage per tick
console.log('Speed boost applied, poison debuff applied.');

// Remove a specific buff or debuff from the player
window.game._debug.removeBuff('speed_boost');
console.log('Speed boost removed.');
```

### State Reading Helpers (`this.readGameState()`)

In `tests/browser/automated-playtester.ts`, `this.readGameState()` provides a snapshot of the current game state, allowing you to make assertions.

```javascript
// Read current game state
const state = this.readGameState();
console.log('Current game state snapshot:', state);

// Access specific data points:
const playerPos = { x: state.player.position.x, y: state.player.position.y };
console.log('Player position:', playerPos);

const hasItem = state.inventory.items.some(item => item.id === 'health_potion');
console.log('Has health potion:', hasItem);

const inBattle = state.battle.active;
console.log('In battle:', inBattle);

const currentMapId = state.map.currentMapId;
console.log('Current map:', currentMapId);

const activeQuests = state.quests.activeQuests.map(q => q.id);
console.log('Active quests:', activeQuests);

const npcDialogueActive = state.ui.dialogueBox.visible;
console.log('Dialogue box visible:', npcDialogueActive);

// Example of using state for assertion:
assert(playerPos.x === 5 && playerPos.y === 5, 'Player should be at (5,5)');
```

### Timing Utilities (`sleep`, `waitForState`, `waitForUIState`)

Precise timing is critical for browser-based tests to account for asynchronous operations, animations, and UI rendering.

```javascript
// Wait for a specific duration (in milliseconds)
// Use sparingly, primarily for animations or fixed delays.
await sleep(1000); // Wait for 1 second

// Wait for a specific game state condition to become true
// This is preferred over fixed `sleep` for state changes.
await this.waitForState(
    state => state.player.hp > 50, // Condition: player HP is greater than 50
    5000, // Timeout: 5 seconds (test will fail if condition not met within this time)
    'player HP to increase above 50' // Descriptive message for timeout errors
);

// Wait for a specific UI state property to become true/false
// Useful for waiting for UI elements to appear or disappear.
await this.waitForUIState(
    'inventoryScreenActive', // Property name in the UI state (e.g., state.ui.inventoryScreenActive)
    true, // Expected value (e.g., true for active, false for inactive)
    'inventory screen to become active' // Descriptive message
);

// Example usage in a test:
await this.runTest('Open and Close Inventory', async () => {
    await this.resetGame();
    
    // Open inventory
    await this.pressKey('i');
    await this.waitForUIState('inventoryScreenActive', true, 'inventory screen to open');
    assert(this.readGameState().ui.inventoryScreenActive, 'Inventory should be active');

    // Close inventory
    await this.pressKey('escape'); // Or 'i' again
    await this.waitForUIState('inventoryScreenActive', false, 'inventory screen to close');
    assert(!this.readGameState().ui.inventoryScreenActive, 'Inventory should be inactive');
});
```

## Test Data - Managing Data for Consistent Tests

Consistent and controlled test data is essential for reliable and repeatable tests.

### Mock Data for Testing

For Node.js tests, you often create mock data directly within the test file or import it from a dedicated `test-data` directory. For browser tests, you might use debug commands to inject specific data.

```javascript
// tests/test-data/mock-items.ts
export const testItems = [
    {
        id: 'test_sword',
        name: 'Test Sword',
        type: 'weapon',
        stats: { attack: 10, defense: 0 },
        description: 'A sword for testing.',
        value: 100
    },
    {
        id: 'test_potion',
        name: 'Test Potion',
        type: 'consumable',
        effect: { type: 'heal', value: 50 },
        description: 'Heals 50 HP.',
        value: 20
    },
    {
        id: 'test_key',
        name: 'Test Key',
        type: 'quest_item',
        description: 'Opens the test dungeon.',
        value: 0
    }
];

// tests/test-data/mock-enemies.ts
export const testEnemies = [
    {
        id: 'weak_enemy',
        name: 'Weak Goblin',
        stats: { hp: 10, attack: 1, defense: 0, speed: 1 },
        abilities: ['basic_attack'],
        loot: [{ itemId: 'gold', quantity: 5 }],
        xpReward: 10
    },
    {
        id: 'strong_enemy',
        name: 'Ogre Brute',
        stats: { hp: 100, attack: 10, defense: 5, speed: 0.5 },
        abilities: ['smash', 'roar'],
        loot: [{ itemId: 'test_sword', quantity: 1 }, { itemId: 'gold', quantity: 50 }],
        xpReward: 100
    }
];

// tests/test-data/mock-maps.ts
export const testMap = {
    id: 'test_arena',
    name: 'Test Arena',
    width: 20,
    height: 20,
    tiles: Array(20).fill(null).map(() => Array(20).fill({ walkable: true, type: 'grass' })),
    entities: [
        { type: 'enemy', id: 'weak_enemy', x: 5, y: 5 },
        { type: 'npc', id: 'test_merchant', x: 10, y: 10 },
        { type: 'portal', targetMapId: 'town_square', x: 19, y: 19 }
    ]
};

// Usage in a Node.js test:
import { testItems, testEnemies } from './test-data/mock-data';
// ...
const player = new Player();
player.inventory.addItem(testItems.find(i => i.id === 'test_potion'));
const enemy = new Enemy(testEnemies.find(e => e.id === 'strong_enemy'));
```
**Best Practices for Test Data:**
*   **Minimalism:** Only include the data necessary for the test.
*   **Realism:** Data should resemble real game data to catch integration issues.
*   **Factories/Builders:** For complex objects, consider creating factory functions that generate test data with sensible defaults, allowing specific properties to be overridden.
*   **Version Control:** Store test data under version control alongside your tests.

## Performance Testing - Ensuring a Smooth Experience

Performance is a critical aspect of game quality. While our primary tests focus on functionality, we also have tools to monitor and identify performance bottlenecks.

### Measuring Frame Rate (FPS)

Monitoring FPS helps identify rendering or logic bottlenecks that cause stuttering or low frame rates.

```javascript
// This script can be injected into the browser console or run via Puppeteer's page.evaluate
let frameCount = 0;
let lastTime = performance.now();
let fpsMeasurements = [];
const MEASUREMENT_DURATION_MS = 5000; // Measure FPS for 5 seconds

function startFPSMeasurement() {
    frameCount = 0;
    lastTime = performance.now();
    fpsMeasurements = [];
    // Store start time to control overall measurement duration
    startFPSMeasurement.startTime = performance.now(); 
    requestAnimationFrame(measureFPS);
    console.log('FPS measurement started...');
}

function measureFPS() {
    frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;

    if (deltaTime >= 1000) { // Every second
        const currentFPS = frameCount / (deltaTime / 1000);
        fpsMeasurements.push(currentFPS);
        console.log(`Current FPS: ${currentFPS.toFixed(2)}`);
        frameCount = 0;
        lastTime = currentTime;
    }

    if (currentTime - startFPSMeasurement.startTime < MEASUREMENT_DURATION_MS) {
        requestAnimationFrame(measureFPS);
    } else {
        const averageFPS = fpsMeasurements.reduce((sum, fps) => sum + fps, 0) / fpsMeasurements.length;
        console.log(`FPS Measurement Complete. Average FPS over ${MEASUREMENT_DURATION_MS / 1000}s: ${averageFPS.toFixed(2)}`);
        // You can then assert on averageFPS in your test
        // e.g., assert(averageFPS >= 30, 'Average FPS dropped below 30');
    }
}

// To use in a browser test:
// await this.executeConsoleScript(startFPSMeasurement.toString() + '; startFPSMeasurement();');
// await sleep(MEASUREMENT_DURATION_MS + 1000); // Wait for measurement to complete + buffer
// const result = await this.executeConsoleScript('averageFPS;'); // Retrieve result
// assert(result >= 50, 'Average FPS should be at least 50');
```

### Memory Usage Monitoring

Identifying memory leaks is crucial for long-running games.

```javascript
// This can be run in the browser console or via Puppeteer's page.evaluate
if (performance.memory) {
    const memoryInfo = performance.memory;
    console.log('Memory Usage (JS Heap):', {
        usedJSHeapSize: (memoryInfo.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalJSHeapSize: (memoryInfo.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        jsHeapSizeLimit: (memoryInfo.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
    });
    // You can capture this at different points in a test and compare.
    // E.g., after loading a new map, check if memory returns to baseline.
} else {
    console.warn('performance.memory API not available in this browser/environment.');
}

// In Puppeteer, you can also use:
// const client = await page.target().createCDPSession();
// const metrics = await client.send('Performance.getMetrics');
// console.log(metrics); // Contains various performance metrics including memory
```

### CPU Usage Monitoring (Puppeteer)

Puppeteer can give you insights into CPU usage during a test run.

```javascript
// In tests/browser/puppeteer-test-runner.ts
const client = await page.target().createCDPSession();
await client.send('Tracing.start', {
    categories: 'devtools.timeline',
    options: 'sampling-profiler'
});

// Perform your actions here
await page.goto('http://localhost:5173');
await page.waitForSelector('#game-canvas', { timeout: 10000 });
// ... simulate complex gameplay ...

const tracing = await client.send('Tracing.end');
// tracing.stream is a readable stream with the trace data
// You can save this to a file and analyze with Chrome DevTools Performance tab.
// fs.writeFileSync('trace.json', JSON.stringify(tracing.stream));
console.log('CPU trace captured. Analyze with Chrome DevTools Performance tab.');
```

## Continuous Integration (CI) - Automating Quality

Integrating our tests into a CI pipeline ensures that every code change is automatically validated, catching regressions early and maintaining a high standard of quality. We use GitHub Actions for our CI.

### GitHub Actions Example (`.github/workflows/main.yml`)

This workflow runs our Node.js tests, type checks, and Puppeteer tests on every push and pull request.

```yaml
name: Tales of Claude CI

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

jobs:
  build_and_test:
    runs-on: ubuntu-latest # Use a fresh Ubuntu environment for each job

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v3 # Use v3 for better security and features
        with:
          fetch-depth: 0 # Fetch all history for potential future git-based operations

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18' # Ensure consistent Node.js version
          cache: 'npm' # Cache npm dependencies for faster builds

      - name: Install Dependencies
        run: npm install --frozen-lockfile # Use --frozen-lockfile for deterministic installs

      - name: Run Type Check
        run: npm run type-check # Catches TypeScript compilation errors
        # This should always run first as it's a quick sanity check.

      - name: Run Linting
        run: npm run lint # Ensures code style and catches common errors
        # Add this step if you have ESLint or similar configured.

      - name: Run Node.js Tests
        run: npm run test:node # Execute our fast unit/logic tests
        # These are crucial and should always pass.

      - name: Start Game Server in Background
        run: |
          npm run dev & # Start the game server in the background
          # Wait for the server to be ready. Adjust sleep duration as needed.
          # A more robust check would be to poll a health endpoint.
          echo "Waiting for game server to start..."
          sleep 10 # Give Vite server time to compile and serve assets
        # This step is essential for Puppeteer tests to have a target.

      - name: Run Puppeteer Tests
        run: npm run test:puppeteer # Execute end-to-end browser tests
        env:
          CI: true # Set CI environment variable for Puppeteer (might disable some dev features)
        # Puppeteer requires a headless browser environment, which GitHub Actions provides.

      - name: Upload Test Screenshots
        uses: actions/upload-artifact@v3 # Upload screenshots as an artifact
        if: always() # Upload even if tests fail, for debugging
        with:
          name: test-screenshots-${{ github.sha }} # Unique name for artifact
          path: test-screenshots/ # Path to where Puppeteer saves screenshots
          retention-days: 7 # Keep artifacts for 7 days

      - name: Upload Test Reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-reports-${{ github.sha }}
          path: test-reports/
          retention-days: 7

      - name: Clean up background processes
        if: always()
        run: |
          # Kill any remaining node processes from `npm run dev &`
          pkill -f "node" || true
          pkill -f "vite" || true
```
**Key Considerations for CI:**
*   **Environment:** Ensure the CI environment has all necessary dependencies (Node.js, Chromium for Puppeteer).
*   **Headless Mode:** Puppeteer should run in headless mode in CI.
*   **Timeouts:** CI environments can be slower, so adjust timeouts for tests and server startup.
*   **Artifacts:** Uploading screenshots and reports is crucial for debugging CI failures.
*   **Cleanup:** Ensure background processes are properly terminated.

## Test Report Interpretation - Understanding Your Results

After running tests, interpreting the output is crucial for identifying issues and understanding the health of the codebase.

### Understanding Test Output

Our test runners provide clear console output.

#### Success Output Example
```
Running Node.js Tests...
Suite: Movement Testing (4/4 Passed, 0 Failed, 0 Skipped)
  ✅ Move Right (D): Test passed. Player moved from (0,0) to (1,0).
  ✅ Move Left (A): Test passed. Player moved from (1,0) to (0,0).
  ✅ Move Up (W): Test passed. Player moved from (0,0) to (0,1).
  ✅ Move Down (S): Test passed. Player moved from (0,1) to (0,0).
Suite: Inventory Management (2/2 Passed, 0 Failed, 0 Skipped)
  ✅ Add item to inventory: Health Potion added successfully. Inventory size: 1.
  ✅ Use consumable item: Health Potion consumed. Player HP: 90/100.
All Node.js Tests Completed.
Total Suites: 2 (6/6 Passed, 0 Failed, 0 Skipped)
Overall Test Result: ✅ ALL TESTS PASSED!
```
*   **`Suite: [Name] ([Passed]/[Total] Passed, [Failed] Failed, [Skipped] Skipped)`**: Provides a summary for each logical group of tests.
*   **`✅ [Test Name]: Test passed. [Optional detailed message]`**: Indicates a successful test. The detailed message helps confirm the expected outcome.

#### Failure Output Example
```
Running Browser Console Tests...
Suite: Combat Testing (1/2 Passed, 1 Failed, 0 Skipped)
  ✅ Enter Combat and Win: Test passed. Player defeated enemy and gained 10 XP.
  ❌ Enter Combat and Lose: Player did not lose combat as expected. HP remaining: 50. Expected HP <= 0.
    Error Details:
      AssertionError: Player did not lose combat as expected. HP remaining: 50. Expected HP <= 0.
          at AutomatedPlaytester.testCombatSystem (tests/browser/automated-playtester.ts:123:17)
          at AutomatedPlaytester.runTest (tests/browser/automated-playtester.ts:50:25)
          at AutomatedPlaytester.runSuite (tests/browser/automated-playtester.ts:30:13)
          at AutomatedPlaytester.start (tests/browser/automated-playtester.ts:80:9)
    Captured Errors (from game console):
      - [ERROR] 2023-10-27 14:35:01: CombatService: Invalid damage value calculated: -10.
      - [WARN] 2023-10-27 14:35:05: PlayerState: HP cannot go below 1. Clamping value.
Suite: Map Transition Testing (0/1 Passed, 1 Failed, 0 Skipped)
  ❌ Portal Functionality: Player did not transition to target map 'dungeon_level_1'. Current map: 'forest_entrance'.
    Error Details:
      TimeoutError: waitForState timed out after 5000ms waiting for map transition.
          at AutomatedPlaytester.waitForState (tests/browser/automated-playtester.ts:200:19)
          at AutomatedPlaytester.testMapTransition (tests/browser/automated-playtester.ts:345:13)
    Captured Errors (from game console):
      - [ERROR] 2023-10-27 14:36:10: MapService: Portal target 'dungeon_level_1' not found in map data.
All Browser Console Tests Completed.
Total Suites: 2 (1/3 Passed, 2 Failed, 0 Skipped)
Overall Test Result: ❌ SOME TESTS FAILED!
```
*   **`❌ [Test Name]: [Failure message]`**: Indicates a failed test.
*   **`Error Details:`**: Provides the stack trace of the assertion failure, pointing to the exact line in the test code.
*   **`Captured Errors (from game console):`**: This is extremely valuable! It shows any `console.error` or `console.warn` messages that occurred in the game's own code during the test run. These often pinpoint the root cause of the bug.

### Analyzing Failures

When a test fails, follow these steps to efficiently diagnose and fix the issue:

1.  **Read the error message carefully:** The assertion message is your first clue. It should tell you *what* condition was not met.
2.  **Check the `Error Details` stack trace:** This tells you *where* in the test code the assertion failed.
3.  **Review `Captured Errors` from the game console:** These are often the most direct indicators of the underlying bug in the game's logic, not just the test's assertion. Look for `TypeError`, `ReferenceError`, or custom error messages from your game services.
4.  **Examine Puppeteer screenshots (if applicable):** If it's a Puppeteer test, look at the screenshots generated in `test-screenshots/`. They provide visual context of the game state at the moment of failure. This is especially useful for UI or visual bugs.
5.  **Reproduce manually:** Try to perform the exact steps outlined in the failing test manually in the browser. This often reveals the bug's behavior and helps you understand the user experience impact.
6.  **Add debug logging:** Insert `console.log` statements at critical points in both your test code and the game's source code to trace variable values, function calls, and state changes leading up to the failure.
    *   Example: `console.log('Player HP before damage:', player.hp);`
    *   Example: `console.log('Enemy attack calculation result:', damage);`
7.  **Isolate the bug:** Once you've identified the problematic area, try to create a minimal reproduction case. This might involve writing a new, very small test that *only* focuses on the failing logic.
8.  **Consult documentation/codebase:** If the error is unclear, refer to the relevant game module's documentation or source code to understand its intended behavior.

## Advanced Testing Techniques

Beyond the standard unit, integration, and end-to-end tests, these techniques offer deeper insights and broader coverage.

### Snapshot Testing (Node.js & Puppeteer)

Snapshot testing compares the current output of a component or data structure against a previously saved "snapshot." It's excellent for detecting unintended changes to UI, API responses, or complex data states.

```javascript
// Example: Node.js Snapshot Testing for Game State
// This requires a testing library like Jest or a custom snapshot utility.
// For simplicity, here's a manual approach:
import * as fs from 'fs';
import * as path from 'path';

const SNAPSHOT_DIR = path.join(__dirname, '..', 'snapshots');

async function runSnapshotTest(testName: string, dataToSnapshot: any) {
    const snapshotPath = path.join(SNAPSHOT_DIR, `${testName}.json`);
    const currentSnapshot = JSON.stringify(dataToSnapshot, null, 2);

    if (!fs.existsSync(SNAPSHOT_DIR)) {
        fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    }

    if (!fs.existsSync(snapshotPath)) {
        // First run: create the snapshot
        fs.writeFileSync(snapshotPath, currentSnapshot);
        console.log(`✅ Snapshot created for ${testName}.`);
    } else {
        // Subsequent runs: compare against existing snapshot
        const previousSnapshot = fs.readFileSync(snapshotPath, 'utf-8');
        try {
            assert(currentSnapshot === previousSnapshot, `Snapshot mismatch for ${testName}.`);
            console.log(`✅ Snapshot test passed for ${testName}.`);
        } catch (error) {
            console.error(`❌ Snapshot test failed for ${testName}.`);
            console.error(`Diff for ${testName}.json:`);
            // Implement a diffing utility here for better output
            // e.g., 'diff -u old.json new.json'
            fs.writeFileSync(snapshotPath.replace('.json', '.new.json'), currentSnapshot); // Save new for comparison
            throw error; // Re-throw to mark test as failed
        }
    }
}

// Usage in node-test-runner.ts:
await runTest('Player Initial State Snapshot', async () => {
    const player = new Player(); // Assume Player constructor creates initial state
    const initialState = player.getState(); // Get a serializable state object
    await runSnapshotTest('player-initial-state', initialState);
});

// Puppeteer for Visual Snapshot Testing:
// This involves comparing screenshots pixel-by-pixel. Libraries like 'jest-image-snapshot' are ideal.
// In tests/browser/puppeteer-test-runner.ts:
// await page.screenshot({ path: 'test-screenshots/homepage.png' });
// expect(homepageScreenshot).toMatchImageSnapshot(); // Using a library
```

### Regression Testing

Regression testing ensures that new changes do not break existing functionality. Our entire test suite serves as a regression suite, but you can also create targeted regression tests for specific areas.

```javascript
// Example: Regression Test for Difficulty Scaling
// This ensures that game mechanics scale correctly across different difficulty settings.
const difficultyConfigurations = [
    { name: 'Easy', difficulty: 'easy', expectedPlayerHP: 150, expectedEnemyHP: 50 },
    { name: 'Normal', difficulty: 'normal', expectedPlayerHP: 100, expectedEnemyHP: 100 },
    { name: 'Hard', difficulty: 'hard', expectedPlayerHP: 75, expectedEnemyHP: 150 }
];

for (const config of difficultyConfigurations) {
    await this.runTest(`Start Game - Difficulty: ${config.name}`, async () => {
        await this.resetGame();
        // Assuming a debug command or game method to set difficulty
        await this.executeDebugCommand(`setDifficulty("${config.difficulty}")`);
        await sleep(this.config.uiDelay); // Allow UI to update

        const playerState = this.readGameState().player;
        assert(
            playerState.maxHp === config.expectedPlayerHP,
            `Player max HP mismatch for ${config.name} difficulty. Expected ${config.expectedPlayerHP}, got ${playerState.maxHp}`
        );

        // Spawn an enemy and check its stats based on difficulty
        await this.executeDebugCommand(`spawnEnemy("goblin", 5, 5)`);
        await sleep(this.config.movementDelay);
        const spawnedEnemy = this.readGameState().enemies.find(e => e.id.includes('goblin'));
        assert(
            spawnedEnemy.stats.hp === config.expectedEnemyHP,
            `Goblin HP mismatch for ${config.name} difficulty. Expected ${config.expectedEnemyHP}, got ${spawnedEnemy.stats.hp}`
        );
    });
}
```

### Stress Testing

Stress testing evaluates the game's stability and performance under extreme conditions (e.g., many entities, rapid actions).

```javascript
await this.runTest('Stress Test - Spawn 100 Enemies and Move', async () => {
    await this.resetGame();
    const initialPlayerPos = this.readGameState().player.position;
    const startTime = performance.now();
    
    // Spawn a large number of enemies
    console.log('Spawning 100 enemies...');
    for (let i = 0; i < 100; i++) {
        // Distribute enemies across a small area to simulate high density
        const x = 5 + (i % 10);
        const y = 5 + Math.floor(i / 10);
        await this.executeDebugCommand(`spawnEnemy('goblin', ${x}, ${y})`);
    }
    await sleep(1000); // Give game time to process spawns

    const spawnTime = performance.now() - startTime;
    console.log(`Time to spawn 100 enemies: ${spawnTime.toFixed(2)}ms`);
    assert(spawnTime < 2000, 'Spawning 100 enemies took too long (>2s)'); // Performance assertion

    // Verify game still responsive by attempting player movement
    console.log('Attempting player movement amidst many enemies...');
    await this.pressKey('w'); // Move up
    await sleep(this.config.movementDelay * 2);
    const newPlayerPos = this.readGameState().player.position;
    assert(
        newPlayerPos.y === initialPlayerPos.y + 1, // Assuming no collision
        `Player should still be able to move. Expected Y: ${initialPlayerPos.y + 1}, Got: ${newPlayerPos.y}`
    );

    // Optionally, monitor FPS/memory during this stress test
    // await this.executeConsoleScript('startFPSMeasurement();');
    // await sleep(5000); // Run for 5 seconds
    // const avgFps = await this.executeConsoleScript('averageFPS;');
    // assert(avgFps >= 20, 'FPS dropped too low during stress test');
});
```

## Testing Philosophy - Our Guiding Principles

Our testing strategy is built upon core principles that ensure our efforts are effective and sustainable.

### The Three Pillars of Quality Testing

1.  **Reliability**
    *   **Consistency:** Tests should pass when the code is correct and fail when it's broken, consistently. Avoid "flaky" tests that randomly pass or fail.
    *   **Determinism:** Given the same inputs, a test should always produce the same output. Eliminate external dependencies or uncontrolled randomness.
    *   **Speed:** Fast tests encourage frequent execution, leading to quicker feedback loops.

2.  **Maintainability**
    *   **Readability:** Tests should be easy to understand, even by someone unfamiliar with the code. Use clear naming, comments, and a consistent structure.
    *   **Modularity:** Tests should be composed of small, focused units. Changes to one part of the game should ideally only require changes to a small, related set of tests.
    *   **Simplicity:** Avoid overly complex test logic. If a test is hard to write, it might be testing too much or the underlying code is too complex.

3.  **Clarity**
    *   **Actionable Feedback:** When a test fails, the error message should immediately tell you *what* went wrong and *why*, guiding you directly to the problem.
    *   **Specific Failures:** A single test failure should ideally point to a single bug. If one failure cascades into many, the tests might not be isolated enough.
    *   **Documentation:** Tests themselves serve as living documentation of the system's expected behavior.

### The Testing Pyramid

We follow the "Testing Pyramid" model, which advocates for a higher proportion of fast, isolated tests at the bottom, and fewer, more comprehensive tests at the top.

```
        /\
       /  \  UI Tests (Few) - Top of the pyramid: Slowest, most expensive, but cover critical user journeys.
      /    \  - Puppeteer tests: Full browser automation, visual regression.
     /______\ - Focus on critical end-to-end flows, accessibility, and cross-browser compatibility.
    /        \
   /          \ Integration Tests (Some) - Middle layer: Verify interactions between components.
  /            \ - Browser console tests: Simulate user interactions, verify UI/game state integration.
 /______________\ - Focus on component interactions (e.g., player + inventory + UI, combat system).
/                \
/                  \ Unit Tests (Many) - Base of the pyramid: Fastest, most isolated, cheapest to run.
/____________________\ - Node.js tests: Pure logic, algorithms, data structures, individual functions/classes.
                       - Focus on correctness of individual units in isolation.
```
**Why this pyramid?**
*   **Cost-Effectiveness:** Unit tests are cheap to write and run. UI tests are expensive due to setup time and flakiness.
*   **Feedback Speed:** Unit tests provide immediate feedback. UI tests are slow, delaying feedback.
*   **Specificity:** Unit tests pinpoint exact bugs. UI tests might indicate a problem but require more debugging to find the root cause.
*   **Coverage:** A strong base of unit tests provides confidence in core logic, allowing integration and UI tests to focus on the glue code and user experience.

## Quick Reference - Essential Commands and Functions

A handy cheat sheet for common testing tasks.

### Essential Commands

```bash
# Install all project dependencies
npm install

# Run type checking (TypeScript compiler)
npm run type-check

# Run code linting (ESLint)
npm run lint

# Run all Node.js tests
npm run test:node

# Run Node.js tests filtered by suite/test name (case-insensitive, partial match)
npm run test:node -- --filter "Combat"
npm run test:node -- --filter "Player Stats - Level Up"

# Start the game development server (required for browser/Puppeteer tests)
npm run dev

# Run all Puppeteer tests
npm run test:puppeteer

# Run Puppeteer tests filtered by suite/test name
npm run test:puppeteer -- --suite "Map Transitions"

# Generate a detailed test report (e.g., HTML, JSON) from Puppeteer results
npm run test:report # (Assumes your puppeteer-test-runner generates a report)

# Clean test artifacts (screenshots, reports)
rm -rf test-screenshots test-reports
```

### Key Testing Functions (AutomatedPlaytester / Puppeteer)

```javascript
// In AutomatedPlaytester (browser console tests):
await this.runSuite('My Test Suite', async () => { /* ... */ });
await this.runTest('Specific Feature Test', async () => { /* ... */ });

// Reset game state to a clean slate
await this.resetGame();

// Simulate a key press (down and up)
await this.pressKey('w'); // Simulates pressing 'w'
await this.pressKey('e', 'down'); // Simulates holding 'e' down
await this.releaseKey('e'); // Simulates releasing 'e'

// Execute a debug command on the game object
await this.executeDebugCommand('teleportPlayer(10, 10)');
await this.executeDebugCommand('giveItem("gold", 100)');

// Read the current game state snapshot
const state = this.readGameState();
console.log(state.player.hp);

// Wait for a specific condition to become true in the game state
await this.waitForState(s => s.player.hp > 50, 5000, 'player HP to increase');

// Wait for a specific UI state property to become true/false
await this.waitForUIState('inventoryScreenActive', true, 'inventory to open');

// Wait for a fixed duration (use sparingly)
await sleep(500); // Wait for 500 milliseconds

// Assert a condition (Node.js and Browser tests)
assert(condition, 'Descriptive error message if condition is false');

// In Puppeteer tests (page object):
await page.goto('http://localhost:5173'); // Navigate to the game URL
await page.waitForSelector('#game-canvas', { timeout: 10000 }); // Wait for game canvas to load

await page.keyboard.press('KeyW'); // Simulate pressing 'W'
await page.keyboard.down('Shift'); // Simulate holding Shift down
await page.keyboard.up('Shift'); // Simulate releasing Shift

await page.click('.inventory-button'); // Click a UI element by selector
await page.type('#player-name-input', 'TestPlayer'); // Type into an input field

await page.screenshot({ path: 'test-screenshots/my-test-screenshot.png', fullPage: true }); // Take a screenshot

// Evaluate JavaScript in the browser context (to access window.game)
const playerHp = await page.evaluate(() => window.game.getState().player.hp);
console.log('Player HP from Puppeteer:', playerHp);
```

### Test Configuration Options (`AutomatedPlaytester` config)

The `AutomatedPlaytester` constructor accepts a configuration object to fine-tune test behavior.

```javascript
const config = {
    debugMode: true,          // If true, enables detailed console logging from the playtester.
                              // Useful for debugging test failures.
    testSpeed: 'normal',      // Controls the speed of automated actions.
                              // 'fast': Minimal delays, good for quick runs.
                              // 'normal': Moderate delays, good balance for visual observation.
                              // 'slow': Longer delays, useful for very complex animations or manual debugging.
    movementDelay: 100,       // Milliseconds to wait after each simulated player movement.
    interactionDelay: 200,    // Milliseconds to wait after UI interactions (e.g., button clicks, key presses for actions).
    uiDelay: 150,             // Milliseconds to wait for UI elements to render or update after state changes.
    battleActionDelay: 300,   // Milliseconds to wait between actions during automated combat.
    stateCheckInterval: 50,   // Milliseconds between checks when using `waitForState` or `waitForUIState`.
                              // Lower values mean faster checks but potentially more CPU usage.
    stateCheckTimeout: 8000,  // Milliseconds before `waitForState` or `waitForUIState` times out.
                              // Increase for slow operations, decrease for faster feedback.
    fullRun: true,            // If true, `tester.start()` will run all defined suites.
                              // If false, you must specify suites in `tester.start(['Suite Name'])`.
    resetGameBeforeRun: true, // If true, `resetGame()` is called at the start of `tester.start()`.
                              // Ensures a clean slate for the entire test session.
    resetGameBeforeSuite: true, // If true, `resetGame()` is called before each test suite.
                                // Provides better isolation between suites.
    resetGameBeforeTest: false // If true, `resetGame()` is called before each individual test.
                               // Provides maximum isolation but can slow down runs significantly.
                               // Use `resetGameBeforeSuite` or manual `resetGame()` within tests for balance.
};

// Example usage:
const tester = new AutomatedPlaytester(config);
await tester.start();
```

## Conclusion

Testing is not just a phase; it's an ongoing commitment to quality. This comprehensive guide provides Task Agents with the knowledge and tools necessary to effectively contribute to the stability and excellence of "Tales of Claude." By understanding our three-tier testing approach, creating new tests with precision, and diligently troubleshooting failures, you play a vital role in delivering an exceptional gaming experience.

Remember: A feature isn't truly complete until it's thoroughly tested and proven to be robust!

## Appendix: Test Checklist for New Features

When adding a new feature or making significant changes, use this checklist to ensure comprehensive test coverage.

- [x] **Core Logic (Node.js Tests)**
    - [ ] Add unit tests for new functions, classes, or modules.
    - [ ] Verify data structures are correctly manipulated.
    - [ ] Test all calculations (damage, XP, gold, stats).
    - [ ] Cover all logical branches and edge cases (min/max values, invalid inputs).
    - [ ] Ensure state transitions are correct (e.g., quest status, buff application).
    - [ ] Validate serialization/deserialization if data persistence is involved.
- [x] **User Interface & Interaction (Browser Console Tests)**
    - [ ] Add tests for all new UI elements (buttons, inputs, displays).
    - [ ] Verify UI elements respond correctly to player input (keyboard, mouse).
    - [ ] Ensure visual feedback is accurate (e.g., health bars, cooldowns, quest markers).
    - [ ] Test navigation between new and existing screens/menus.
    - [ ] Simulate common user workflows involving the new feature.
    - [ ] Validate error messages or warnings are displayed correctly.
- [x] **End-to-End & Visual Regression (Puppeteer Tests)**
    - [ ] Create end-to-end tests for critical user journeys involving the new feature.
    - [ ] Capture screenshots at key points to detect visual regressions.
    - [ ] Test responsiveness across different common viewports if UI layout is affected.
    - [ ] Ensure the feature integrates seamlessly with existing systems.
- [x] **Test Data Management**
    - [ ] Create necessary mock data for the new feature (items, enemies, NPCs, maps).
    - [ ] Ensure test data is isolated and doesn't conflict with other tests.
- [x] **Performance Considerations**
    - [ ] Add performance benchmarks if the feature is computationally intensive (e.g., many entities, complex rendering).
    - [ ] Monitor FPS and memory usage during relevant tests.
- [x] **Documentation & Maintenance**
    - [ ] Document the purpose and scope of all new tests.
    - [ ] Update existing test documentation (e.g., this `TESTING.md` guide) with new patterns or debug commands.
    - [ ] Ensure new tests are added to the appropriate test runner (`start` method in `AutomatedPlaytester`, `runTest` calls in `node-test-runner`).
    - [ ] Run all existing tests to check for unintended regressions caused by the new feature.
    - [ ] Add any new debug commands to the `window.game._debug` object and document them here.
    - [ ] Review test configuration options for optimal performance and reliability.

Happy Testing! 🎮🧪