// src/tests/visual/edge-case-bug-hunt.ts
import { chromium, Page, Browser } from 'playwright';

// Base URL for Tales of Claude (replace with actual game URL)
const BASE_URL = 'http://localhost:3000/tales-of-claude';

// --- Helper Functions ---

/**
 * Navigates to the game and ensures it's ready.
 * Assumes a simple load screen or main menu.
 */
async function startGame(page: Page) {
    await page.goto(BASE_URL);
    // Wait for the game to load, e.g., a "Start Game" button or main menu element
    // Replacing expect with waitForSelector
    try {
        await page.waitForSelector('#gameCanvas', { state: 'visible', timeout: 30000 });
    } catch (e) {
        await page.waitForSelector('#startButton', { state: 'visible', timeout: 30000 });
    }
    console.log('Game loaded successfully.');
    // If there's a start button, click it
    const startButton = page.locator('#startButton');
    if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(1000); // Give game a moment to transition
    }
    // Assume player character is now visible or game world is loaded
    try {
        await page.waitForSelector('#playerCharacter', { state: 'visible', timeout: 15000 });
    } catch (e) {
        await page.waitForSelector('#gameWorld', { state: 'visible', timeout: 15000 });
    }
    console.log('Game started, player character visible.');
}

/**
 * Presses a key for a short duration.
 */
async function pressKey(page: Page, key: string, durationMs: number = 100) {
    await page.keyboard.down(key);
    await page.waitForTimeout(durationMs);
    await page.keyboard.up(key);
}

/**
 * Moves the character in a specified direction for a duration.
 */
async function moveCharacter(page: Page, direction: 'w' | 'a' | 's' | 'd', durationMs: number = 500) {
    await pressKey(page, direction, durationMs);
}

/**
 * Opens a UI panel by pressing its key.
 */
async function openUIPanel(page: Page, key: string, panelSelector: string) {
    console.log(`Attempting to open UI panel: ${key}`);
    await pressKey(page, key);
    await page.waitForSelector(panelSelector, { state: 'visible', timeout: 5000 });
    console.log(`UI panel ${key} opened.`);
}

/**
 * Closes a UI panel by pressing ESC.
 */
async function closeUIPanel(page: Page, panelSelector: string) {
    console.log('Attempting to close UI panel: ESC');
    await pressKey(page, 'Escape');
    await page.waitForSelector(panelSelector, { state: 'hidden', timeout: 5000 });
    console.log('UI panel closed.');
}

/**
 * Simulates a rapid sequence of actions.
 */
async function rapidAction(page: Page, action: () => Promise<void>, count: number = 10) {
    console.log(`Performing rapid action ${count} times...`);
    for (let i = 0; i < count; i++) {
        await action();
        await page.waitForTimeout(50); // Small delay between actions
    }
    console.log('Rapid action completed.');
}

// --- Test Suite Functions (converted from test blocks) ---

async function combatSystemStressTest(page: Page) {
    console.log('--- Combat System Stress Test ---');
    // Assume there's an enemy at a known location or we can find one
    // For this test, we'll simulate moving into an enemy.
    // Replace with actual game logic to find/engage enemy if needed.
    const enemyLocator = '#enemyCharacter'; // Example selector for an enemy

    // Try to initiate combat repeatedly
    console.log('Repeatedly initiating combat...');
    for (let i = 0; i < 3; i++) {
        await moveCharacter(page, 'd', 1000); // Move towards an assumed enemy
        await page.waitForSelector('#combatUI', { timeout: 10000, state: 'visible' });
        console.log(`Combat initiated ${i + 1} times.`);

        // During combat: spam abilities, check damage
        await page.waitForSelector('#playerHealthBar', { state: 'visible' });
        await page.waitForSelector('#enemyHealthBar', { state: 'visible' });

        console.log('Spamming abilities and observing combat...');
        const abilityButton = page.locator('#ability1Button'); // Example ability button
        const attackButton = page.locator('#attackButton'); // Example basic attack button

        // Rapidly use abilities
        await rapidAction(page, async () => {
            if (await abilityButton.isVisible()) {
                await abilityButton.click();
            } else if (await attackButton.isVisible()) {
                await attackButton.click();
            }
            // Check for damage numbers appearing (visual check)
            await page.waitForSelector('.damage-number', { state: 'visible', timeout: 500 }).catch(() => {});
        }, 20); // 20 rapid ability uses

        // Try to open inventory/map during combat
        console.log('Attempting to open UI during combat...');
        await openUIPanel(page, 'i', '#inventoryPanel').catch(() => console.log('Inventory failed to open in combat (expected or bug)'));
        await page.waitForTimeout(500);
        await closeUIPanel(page, '#inventoryPanel').catch(() => {});

        // Wait for combat to end (either win or lose)
        await page.waitForSelector('#combatUI', { state: 'hidden', timeout: 30000 });
        console.log(`Combat ended ${i + 1} times.`);
        await page.waitForTimeout(1000); // Cooldown
    }

    // Verify player state after combat (e.g., health, mana)
    // This requires specific game state access, which Playwright can't do directly.
    // Visual checks or console logs from game are needed here.
    await page.screenshot({ path: 'screenshots/combat_stress_test_end.png' });
}

async function saveLoadCorruptionStressTest(page: Page) {
    console.log('--- Save/Load Corruption Stress Test ---');
    const saveButton = page.locator('#saveGameButton'); // Example save button
    const loadButton = page.locator('#loadGameButton'); // Example load button
    const menuButton = page.locator('#menuButton'); // Example menu button to access save/load

    await menuButton.waitFor({ state: 'visible' });
    await menuButton.click();
    await saveButton.waitFor({ state: 'visible' });

    // Rapidly save and load
    console.log('Rapidly saving and loading...');
    await rapidAction(page, async () => {
        await saveButton.click();
        await page.waitForTimeout(200); // Wait for save animation/confirmation
        await loadButton.click();
        await page.waitForTimeout(200); // Wait for load animation/confirmation
    }, 10);

    // Save mid-movement
    console.log('Saving mid-movement...');
    await page.keyboard.down('w');
    await saveButton.click();
    await page.keyboard.up('w');
    await page.waitForTimeout(500);
    await loadButton.click();
    await page.waitForTimeout(1000); // Wait for load to complete

    // Save mid-UI interaction (e.g., inventory open)
    console.log('Saving with inventory open...');
    await openUIPanel(page, 'i', '#inventoryPanel');
    await saveButton.click();
    await page.waitForTimeout(500);
    await closeUIPanel(page, '#inventoryPanel');
    await page.waitForTimeout(500);
    await loadButton.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/save_load_stress_test.png' });
    await menuButton.click(); // Close menu
}

async function mapTransitionEdgeCases(page: Page) {
    console.log('--- Map Transition Edge Cases ---');
    // Assume a map transition zone is near the player's starting position
    // Or navigate to one.
    const transitionZone = '#mapTransitionZone'; // Example selector for a transition area

    // Move to a known transition zone (adjust coordinates/movement as needed)
    console.log('Moving to a transition zone...');
    await moveCharacter(page, 'd', 1500); // Example: move right to a transition
    await page.waitForTimeout(1000); // Allow character to reach

    // Rapidly enter and exit a transition zone
    console.log('Rapidly entering/exiting map transition...');
    await rapidAction(page, async () => {
        await moveCharacter(page, 'd', 200); // Enter
        await page.waitForTimeout(500); // Wait for transition
        await moveCharacter(page, 'a', 200); // Exit
        await page.waitForTimeout(500); // Wait for transition back
    }, 5);

    // Try to open UI during transition
    console.log('Opening UI during map transition...');
    await page.keyboard.down('d'); // Start moving into transition
    await page.waitForTimeout(100); // Small delay
    await openUIPanel(page, 'i', '#inventoryPanel').catch(() => console.log('Inventory failed to open during transition (expected or bug)'));
    await page.keyboard.up('d');
    await page.waitForTimeout(1000); // Let transition complete
    await closeUIPanel(page, '#inventoryPanel').catch(() => {});

    // Move diagonally into a transition corner (if applicable)
    console.log('Moving diagonally into transition corner...');
    await page.keyboard.down('w');
    await page.keyboard.down('d');
    await page.waitForTimeout(1000);
    await page.keyboard.up('w');
    await page.keyboard.up('d');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/map_transition_edge_cases.png' });
}

async function inventoryStressTest(page: Page) {
    console.log('--- Inventory Stress Test ---');
    const inventoryPanel = '#inventoryPanel';
    const itemSlot = '#itemSlot1'; // Example first item slot
    const equipSlot = '#equipmentSlotWeapon'; // Example weapon equip slot
    const playerStatsDisplay = '#playerStatsDisplay'; // Example player stats display

    await openUIPanel(page, 'i', inventoryPanel);

    // Assume we have some items to interact with. If not, simulate acquiring them.
    // For testing, we'll assume itemSlot1 has an item and it's equipable.

    // Rapidly click an item (e.g., to use or move)
    console.log('Rapidly clicking item slots...');
    await rapidAction(page, async () => {
        if (await page.locator(itemSlot).isVisible()) {
            await page.locator(itemSlot).click(); // Click to select/use/move
            await page.waitForTimeout(50); // Small delay
        }
    }, 20);

    // Rapidly equip/unequip an item
    console.log('Rapidly equipping/unequipping item...');
    await rapidAction(page, async () => {
        if (await page.locator(itemSlot).isVisible()) {
            await page.locator(itemSlot).dblclick(); // Double-click to equip/unequip
            await page.waitForTimeout(100);
            // Verify stats change (requires parsing text, more advanced)
            // const currentStats = await page.locator(playerStatsDisplay).textContent();
            // console.log(`Current Stats: ${currentStats}`);
        }
    }, 10);

    // Try to drag and drop items rapidly or to invalid slots
    console.log('Rapidly dragging and dropping items...');
    const targetSlot = '#itemSlot2'; // Another item slot
    if (await page.locator(itemSlot).isVisible() && await page.locator(targetSlot).isVisible()) {
        for (let i = 0; i < 5; i++) {
            await page.locator(itemSlot).dragTo(page.locator(targetSlot));
            await page.waitForTimeout(100);
            await page.locator(targetSlot).dragTo(page.locator(itemSlot)); // Drag back
            await page.waitForTimeout(100);
        }
    }

    await page.screenshot({ path: 'screenshots/inventory_stress_test.png' });
    await closeUIPanel(page, inventoryPanel);
}

async function movementCollisionStressTest(page: Page) {
    console.log('--- Movement Collision Stress Test ---');
    // Assume there are walls, NPCs, and objects to collide with.
    // Navigate to an area with many obstacles.
    await moveCharacter(page, 'a', 1000); // Example: move left to a cluttered area
    await page.waitForTimeout(1000);

    // Run into a wall repeatedly from different angles
    console.log('Running into walls...');
    for (let i = 0; i < 5; i++) {
        await moveCharacter(page, 'w', 500); // Up into wall
        await moveCharacter(page, 's', 500); // Down into wall
        await moveCharacter(page, 'a', 500); // Left into wall
        await moveCharacter(page, 'd', 500); // Right into wall
        await page.waitForTimeout(100);
    }

    // Try to move diagonally into corners
    console.log('Moving diagonally into corners...');
    await page.keyboard.down('w');
    await page.keyboard.down('a');
    await page.waitForTimeout(1000);
    await page.keyboard.up('w');
    await page.keyboard.up('a');
    await page.waitForTimeout(500);

    await page.keyboard.down('s');
    await page.keyboard.down('d');
    await page.waitForTimeout(1000);
    await page.keyboard.up('s');
    await page.keyboard.up('d');
    await page.waitForTimeout(500);

    // Try to clip through NPCs or objects by rapid movement/spamming keys
    console.log('Spamming movement keys into an NPC/object...');
    // Assume an NPC at a certain location, move towards it and spam keys
    await moveCharacter(page, 'd', 500); // Move towards assumed NPC
    await rapidAction(page, async () => {
        await page.keyboard.press('w');
        await page.keyboard.press('a');
        await page.keyboard.press('s');
        await page.keyboard.press('d');
    }, 10);

    await page.screenshot({ path: 'screenshots/collision_stress_test.png' });
}

async function uiOverlappingAndZIndexStressTest(page: Page) {
    console.log('--- UI Overlapping and Z-Index Stress Test ---');
    const inventoryPanel = '#inventoryPanel';
    const mapPanel = '#mapPanel';
    const questPanel = '#questPanel';
    const optionsPanel = '#optionsPanel';

    // Open multiple panels rapidly
    console.log('Rapidly opening multiple UI panels...');
    await openUIPanel(page, 'i', inventoryPanel);
    await openUIPanel(page, 'm', mapPanel);
    await openUIPanel(page, 'q', questPanel);
    await openUIPanel(page, 'Escape', optionsPanel); // Assuming ESC opens options/main menu

    await page.waitForTimeout(1000); // Let all panels settle

    // Try to interact with elements on lower Z-index panels
    console.log('Attempting to interact with obscured UI elements...');
    // Example: Try to click an inventory item while options are open
    const inventoryItem = page.locator('#itemSlot1');
    if (await inventoryItem.isVisible()) {
        await inventoryItem.click({ force: true }).catch(() => console.log('Click on obscured inventory item failed (expected or bug)'));
    }

    await page.screenshot({ path: 'screenshots/ui_overlapping_all_open.png' });

    // Rapidly close panels in random order
    console.log('Rapidly closing UI panels in random order...');
    const panels = [inventoryPanel, mapPanel, questPanel, optionsPanel];
    const keys = ['i', 'm', 'q', 'Escape'];
    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * panels.length);
        const panelToClose = panels[randomIndex];
        const keyToPress = keys[randomIndex];

        if (await page.locator(panelToClose).isVisible()) {
            await pressKey(page, keyToPress);
            await page.waitForTimeout(100);
            await page.waitForSelector(panelToClose, { state: 'hidden', timeout: 2000 });
        } else {
            // If panel is already closed, try opening it again
            await pressKey(page, keyToPress);
            await page.waitForTimeout(100);
            await page.waitForSelector(panelToClose, { state: 'visible', timeout: 2000 });
        }
    }

    // Ensure all are closed
    await closeUIPanel(page, inventoryPanel).catch(() => {});
    await closeUIPanel(page, mapPanel).catch(() => {});
    await closeUIPanel(page, questPanel).catch(() => {});
    await closeUIPanel(page, optionsPanel).catch(() => {});
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/ui_overlapping_all_closed.png' });
}

async function memoryLeakSimulation(page: Page) {
    console.log('--- Memory Leak Simulation (Visual/Performance Check) ---');
    // Playwright cannot directly monitor game memory, but we can perform
    // many repetitive actions and look for visual slowdowns, stuttering,
    // or eventual crashes, which would indicate a potential leak.

    console.log('Performing extensive repetitive actions...');

    // Repeatedly open/close all UI panels
    console.log('Repeatedly opening/closing UI panels (50 cycles)...');
    for (let i = 0; i < 50; i++) {
        await openUIPanel(page, 'i', '#inventoryPanel');
        await openUIPanel(page, 'm', '#mapPanel');
        await openUIPanel(page, 'q', '#questPanel');
        await openUIPanel(page, 'Escape', '#optionsPanel');
        await page.waitForTimeout(50);
        await closeUIPanel(page, '#optionsPanel');
        await closeUIPanel(page, '#questPanel');
        await closeUIPanel(page, '#mapPanel');
        await closeUIPanel(page, '#inventoryPanel');
        await page.waitForTimeout(50);
        if (i % 10 === 0) { console.log(`  UI cycle ${i + 1}/50`); }
    }

    // Repeatedly enter/exit a combat scenario (if possible to force)
    console.log('Repeatedly entering/exiting combat (10 cycles)...');
    for (let i = 0; i < 10; i++) {
        // Simulate engaging and disengaging combat
        await moveCharacter(page, 'd', 1000); // Move to enemy
        await page.waitForSelector('#combatUI', { timeout: 10000, state: 'visible' });
        await page.waitForTimeout(1000); // Fight for a bit
        // Assume a way to flee or combat ends quickly
        await page.locator('#fleeButton').click().catch(() => {}); // Try to flee
        await page.waitForSelector('#combatUI', { state: 'hidden', timeout: 30000 });
        await moveCharacter(page, 'a', 1000); // Move away
        await page.waitForTimeout(1000);
        if (i % 2 === 0) { console.log(`  Combat cycle ${i + 1}/10`); }
    }

    // Repeatedly transition maps
    console.log('Repeatedly transitioning maps (20 cycles)...');
    for (let i = 0; i < 20; i++) {
        await moveCharacter(page, 'd', 500); // Enter transition
        await page.waitForTimeout(1000); // Wait for transition
        await moveCharacter(page, 'a', 500); // Exit transition
        await page.waitForTimeout(1000);
        if (i % 5 === 0) { console.log(`  Map transition cycle ${i + 1}/20`); }
    }

    // After all actions, check for responsiveness
    console.log('Checking game responsiveness after stress test...');
    await page.screenshot({ path: 'screenshots/memory_leak_stress_test_end.png' });
    // If the test runner itself crashes or becomes unresponsive, it's a strong indicator.
    // Manual observation during test run is crucial for this category.
}

async function questProgressionEdgeCases(page: Page) {
    console.log('--- Quest Progression Edge Cases ---');
    const questLogPanel = '#questPanel';
    const questGiverNPC = '#questGiverNPC'; // Example NPC
    const questItem = '#questItem'; // Example quest item
    const questCompleteButton = '#questCompleteButton'; // Example button on quest giver

    // Assume a simple "fetch item" quest.
    // 1. Accept quest
    console.log('Accepting quest...');
    await page.locator(questGiverNPC).click();
    await page.waitForSelector('#dialogueBox', { state: 'visible' });
    await page.locator('#acceptQuestButton').click();
    await page.waitForTimeout(500);
    await openUIPanel(page, 'q', questLogPanel);
    await page.waitForSelector('#activeQuestEntry', { state: 'visible' });
    await closeUIPanel(page, questLogPanel);

    // 2. Try to complete quest step while UI is open
    console.log('Completing quest step with UI open...');
    await openUIPanel(page, 'i', '#inventoryPanel');
    await page.locator(questItem).click(); // Simulate picking up/using quest item
    await page.waitForTimeout(1000);
    await closeUIPanel(page, '#inventoryPanel');
    await page.waitForTimeout(500);

    // 3. Try to turn in quest while in combat (if possible)
    console.log('Attempting to turn in quest during combat...');
    // Simulate engaging combat
    await moveCharacter(page, 'd', 1000);
    await page.waitForSelector('#combatUI', { timeout: 10000, state: 'visible' });
    // Try to interact with quest giver during combat
    await page.locator(questGiverNPC).click().catch(() => console.log('Quest giver interaction failed in combat (expected or bug)'));
    await page.waitForTimeout(500);
    if (await page.locator(questCompleteButton).isVisible()) {
        await page.locator(questCompleteButton).click();
        console.log('Quest completed during combat!');
    }
    // End combat
    await page.locator('#fleeButton').click().catch(() => {});
    await page.waitForSelector('#combatUI', { state: 'hidden', timeout: 30000 });
    await page.waitForTimeout(1000);

    // 4. Abandon and re-accept quest rapidly
    console.log('Rapidly abandoning and re-accepting quest...');
    await openUIPanel(page, 'q', questLogPanel);
    const abandonQuestButton = page.locator('#abandonQuestButton');
    if (await abandonQuestButton.isVisible()) {
        await rapidAction(page, async () => {
            await abandonQuestButton.click();
            await page.waitForTimeout(200);
            await closeUIPanel(page, questLogPanel);
            await page.locator(questGiverNPC).click();
            await page.waitForSelector('#dialogueBox', { state: 'visible' });
            await page.locator('#acceptQuestButton').click();
            await page.waitForTimeout(200);
            await openUIPanel(page, 'q', questLogPanel);
        }, 3);
    }
    await closeUIPanel(page, questLogPanel);

    await page.screenshot({ path: 'screenshots/quest_progression_edge_cases.png' });
}

async function npcStatePersistenceEdgeCases(page: Page) {
    console.log('--- NPC State Persistence Edge Cases ---');
    const friendlyNPC = '#friendlyNPC'; // Example friendly NPC
    const hostileNPC = '#hostileNPC'; // Example hostile NPC (if applicable)

    // 1. Interact with NPC, leave area, return
    console.log('Interacting with NPC, leaving, returning...');
    await page.locator(friendlyNPC).click();
    await page.waitForSelector('#dialogueBox', { state: 'visible' });
    await page.locator('#dialogueOption1').click(); // Select a dialogue option
    await page.waitForTimeout(500);
    await page.locator('#closeDialogueButton').click();
    await page.waitForTimeout(500);

    await moveCharacter(page, 'd', 2000); // Move far away
    await page.waitForTimeout(1000);
    await moveCharacter(page, 'a', 2000); // Return
    await page.waitForTimeout(1000);

    // Verify NPC state (e.g., still has dialogue, or new dialogue)
    await page.locator(friendlyNPC).click();
    await page.waitForSelector('#dialogueBox', { state: 'visible' });
    // Check for specific dialogue text if possible:
    // const dialogueText = await page.locator('#dialogueText').textContent();
    // if (dialogueText && !dialogueText.includes('Welcome back!')) {
    //     console.warn('Dialogue text did not contain "Welcome back!" as expected.');
    // }
    await page.locator('#closeDialogueButton').click();
    await page.waitForTimeout(500);

    // 2. Attack NPC (if allowed), leave, return
    console.log('Attacking NPC, leaving, returning...');
    if (await page.locator(hostileNPC).isVisible()) {
        await page.locator(hostileNPC).click(); // Target NPC
        await page.locator('#attackButton').click(); // Attack once
        await page.waitForTimeout(500);
        // Check if NPC is now hostile or has taken damage (visual check)
        await page.screenshot({ path: 'screenshots/npc_attacked.png' });

        await moveCharacter(page, 'd', 2000); // Leave
        await page.waitForTimeout(1000);
        await moveCharacter(page, 'a', 2000); // Return
        await page.waitForTimeout(1000);

        // Verify NPC state (e.g., still hostile, health persisted, or reset)
        await page.waitForSelector(hostileNPC, { state: 'visible' });
        // Check if it immediately attacks or is still damaged
        await page.screenshot({ path: 'screenshots/npc_attacked_returned.png' });
    } else {
        console.log('No hostile NPC found for this test part.');
    }

    await page.screenshot({ path: 'screenshots/npc_persistence_edge_cases.png' });
}

async function multipleUIPanelsOpenInteractionEdgeCases(page: Page) {
    console.log('--- Multiple UI Panels Open Interaction Edge Cases ---');
    const inventoryPanel = '#inventoryPanel';
    const mapPanel = '#mapPanel';
    const questPanel = '#questPanel';
    const optionsPanel = '#optionsPanel';

    // Open Inventory and Map
    await openUIPanel(page, 'i', inventoryPanel);
    await openUIPanel(page, 'm', mapPanel);
    await page.waitForTimeout(500);

    // Try to drag an item from inventory while map is open
    console.log('Dragging inventory item with map open...');
    const itemToDrag = page.locator('#itemSlot1');
    const emptySlot = page.locator('#itemSlot2');
    if (await itemToDrag.isVisible() && await emptySlot.isVisible()) {
        await itemToDrag.dragTo(emptySlot);
        await page.waitForTimeout(500);
        await itemToDrag.waitFor({ state: 'hidden' }); // Item should have moved
        await emptySlot.waitFor({ state: 'visible' }); // Item should be in new slot
    }

    // Open Quest Log and Options
    await openUIPanel(page, 'q', questPanel);
    await openUIPanel(page, 'Escape', optionsPanel);
    await page.waitForTimeout(500);

    // Try to change an option while quest log is open
    console.log('Changing option with quest log open...');
    const volumeSlider = page.locator('#volumeSlider'); // Example option
    if (await volumeSlider.isVisible()) {
        await volumeSlider.fill('0.5'); // Set volume to 50%
        await page.waitForTimeout(500);
        // Verify value if possible
    }

    // Try to move character with all panels open
    console.log('Moving character with all panels open...');
    await page.keyboard.down('w');
    await page.waitForTimeout(1000);
    await page.keyboard.up('w');
    await page.screenshot({ path: 'screenshots/all_panels_open_movement.png' });

    // Close all panels
    await closeUIPanel(page, optionsPanel);
    await closeUIPanel(page, questPanel);
    await closeUIPanel(page, mapPanel);
    await closeUIPanel(page, inventoryPanel);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/all_panels_closed_after_interaction.png' });
}

// --- Main Test Runner ---
async function runEdgeCaseBugHunt() {
    let browser: Browser | undefined;
    let page: Page | undefined;

    try {
        browser = await chromium.launch({ headless: true }); // Launch browser

        const tests = [
            combatSystemStressTest,
            saveLoadCorruptionStressTest,
            mapTransitionEdgeCases,
            inventoryStressTest,
            movementCollisionStressTest,
            uiOverlappingAndZIndexStressTest,
            memoryLeakSimulation,
            questProgressionEdgeCases,
            npcStatePersistenceEdgeCases,
            multipleUIPanelsOpenInteractionEdgeCases,
        ];

        for (const testFn of tests) {
            console.log(`\n--- Starting Test: ${testFn.name} ---`);
            page = await browser.newPage(); // Create a new page for each test
            await startGame(page); // beforeEach equivalent
            // Optional: Navigate to a specific area suitable for testing
            // await moveCharacter(page, 'd', 2000); // Example: move right to an enemy zone
            // await page.waitForTimeout(1000); // Wait for area load

            await testFn(page); // Run the test function
            await page.close(); // Close page after each test
            console.log(`--- Finished Test: ${testFn.name} ---\n`);
        }

    } catch (error) {
        console.error('An error occurred during the test run:', error);
        process.exit(1); // Exit with error code
    } finally {
        if (browser) {
            await browser.close(); // Ensure browser is closed
        }
    }
}

// Execute the test suite
runEdgeCaseBugHunt();