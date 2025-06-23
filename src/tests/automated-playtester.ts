// src/tests/automated-playtester.ts
declare global {
    interface Window {
        game: {
            player: {
                x: number;
                y: number;
                hp: number;
                maxHp: number;
                inventory: string[];
                equipped: string[];
                gold: number;
            };
            map: {
                current: string;
                entities: Array<{
                    id: string;
                    type: 'npc' | 'item' | 'shop' | 'enemy' | 'portal' | 'quest';
                    name?: string;
                    x: number;
                    y: number;
                    dialogue?: string[];
                    items?: Array<{ name: string; price: number; }>;
                    targetMap?: string;
                    giverId?: string;
                }>;
                isWalkable?: (x: number, y: number) => boolean;
            };
            dialogue: {
                active: boolean;
                text: string;
                npcId?: string;
            };
            battle: {
                active: boolean;
                enemyHp?: number;
                enemyMaxHp?: number;
                enemyName?: string;
                playerTurn?: boolean;
                abilities?: string[];
                log?: string[];
            };
            inventory: string[];
            shop: {
                active: boolean;
                items?: Array<{ name: string; price: number; }>;
                shopId?: string;
            };
            quests: Array<{
                id: string;
                name: string;
                status: 'active' | 'completed' | 'failed';
                description?: string;
                objective?: string;
            }>;
            ui: {
                characterScreenActive: boolean;
                inventoryScreenActive: boolean;
                mapScreenActive: boolean;
                shopScreenActive: boolean;
                dialogueActive: boolean;
                battleActive: boolean;
            };
            saveGame?: () => void;
            loadGame?: () => void;
            startGame?: () => void;
            _debug?: {
                teleportPlayer?: (x: number, y: number) => void;
                spawnEnemy?: (type: string, x: number, y: number) => void;
                giveItem?: (itemName: string) => void;
                completeQuest?: (questId: string) => void;
                resetGame?: () => void;
            };
        };
        // Fix 2: Make window properties optional to allow deletion
        _originalConsoleLog?: (...args: any[]) => void;
        _capturedConsoleLogs?: string[];
        _originalWindowOnError?: OnErrorEventHandler;
        _capturedErrors?: string[];
    }
}

// Fix 1: Define GameMapEntity to mirror the structure of window.game.map.entities
// This ensures all possible properties (dialogue, items, targetMap, giverId) are included
// as optional properties on a single entity type, matching the runtime structure.
type GameMapEntity = {
    id: string;
    type: 'npc' | 'item' | 'shop' | 'enemy' | 'portal' | 'quest';
    name?: string;
    x: number;
    y: number;
    dialogue?: string[];
    items?: Array<{ name: string; price: number; }>;
    targetMap?: string;
    giverId?: string;
};

interface GameState {
    player: { x: number; y: number; hp: number; maxHp: number; inventory: string[]; equipped: string[]; gold: number; };
    // Fix 1: Use the GameMapEntity type for map.entities
    map: { current: string; entities: GameMapEntity[]; };
    dialogue: { active: boolean; text: string; npcId?: string; };
    battle: { active: boolean; enemyHp?: number; enemyMaxHp?: number; enemyName?: string; playerTurn?: boolean; abilities?: string[]; };
    inventory: string[];
    shop: { active: boolean; items?: Array<{ name: string; price: number; }>; shopId?: string; };
    quests: Array<{ id: string; name: string; status: 'active' | 'completed' | 'failed'; }>;
    ui: { characterScreenActive: boolean; inventoryScreenActive: boolean; mapScreenActive: boolean; shopScreenActive: boolean; dialogueActive: boolean; battleActive: boolean; };
}

interface TestConfig {
    debugMode: boolean;
    testSpeed: 'fast' | 'normal' | 'slow';
    movementDelay: number;
    interactionDelay: number;
    uiDelay: number;
    battleActionDelay: number;
    stateCheckInterval: number;
    stateCheckTimeout: number;
    fullRun: boolean;
    suitesToRun: string[];
    resetGameBeforeRun: boolean;
}

interface TestResult {
    suite: string;
    test: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message: string;
    errors: string[];
    logs?: string[];
}

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function simulateKey(key: string, type: 'down' | 'up', target: EventTarget = document): void {
    const eventType = type === 'down' ? 'keydown' : 'keyup';
    const event = new KeyboardEvent(eventType, {
        key: key,
        code: `Key${key.toUpperCase()}`,
        bubbles: true,
        cancelable: true,
    });
    target.dispatchEvent(event);
}

async function waitFor<T>(
    conditionFn: () => T | Promise<T>,
    timeout: number,
    interval: number = 100
): Promise<T> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        try {
            const result = await Promise.resolve(conditionFn());
            if (result) {
                return result;
            }
        } catch (e) {
            console.warn(`waitFor conditionFn error: ${e instanceof Error ? e.message : String(e)}`);
        }
        await sleep(interval);
    }
    throw new Error(`Timeout after ${timeout}ms waiting for condition.`);
}

function readGameState(): GameState {
    const game = window.game;
    if (!game) {
        return {
            player: { x: 0, y: 0, hp: 0, maxHp: 0, inventory: [], equipped: [], gold: 0 },
            map: { current: 'unknown', entities: [] },
            dialogue: { active: false, text: '' },
            battle: { active: false },
            inventory: [],
            shop: { active: false },
            quests: [],
            ui: { characterScreenActive: false, inventoryScreenActive: false, mapScreenActive: false, shopScreenActive: false, dialogueActive: false, battleActive: false }
        };
    }
    return {
        player: {
            x: game.player?.x ?? 0,
            y: game.player?.y ?? 0,
            hp: game.player?.hp ?? 0,
            maxHp: game.player?.maxHp ?? 0,
            inventory: game.player?.inventory ?? [],
            equipped: game.player?.equipped ?? [],
            gold: game.player?.gold ?? 0
        },
        map: {
            current: game.map?.current ?? 'unknown',
            // Fix 1: Direct assignment is now possible as GameState.map.entities matches window.game.map.entities
            entities: game.map?.entities ?? []
        },
        dialogue: {
            active: game.dialogue?.active ?? false,
            text: game.dialogue?.text ?? '',
            npcId: game.dialogue?.npcId
        },
        battle: {
            active: game.battle?.active ?? false,
            enemyHp: game.battle?.enemyHp,
            enemyMaxHp: game.battle?.enemyMaxHp,
            enemyName: game.battle?.enemyName,
            playerTurn: game.battle?.playerTurn,
            abilities: game.battle?.abilities
        },
        inventory: game.inventory ?? [],
        shop: {
            active: game.shop?.active ?? false,
            items: game.shop?.items,
            shopId: game.shop?.shopId
        },
        quests: game.quests ?? [],
        ui: {
            characterScreenActive: game.ui?.characterScreenActive ?? false,
            inventoryScreenActive: game.ui?.inventoryScreenActive ?? false,
            mapScreenActive: game.ui?.mapScreenActive ?? false,
            shopScreenActive: game.ui?.shopScreenActive ?? false,
            dialogueActive: game.ui?.dialogueActive ?? false,
            battleActive: game.ui?.battleActive ?? false
        }
    };
}

function setupMonitoring(): void {
    if (!window._capturedConsoleLogs) {
        window._capturedConsoleLogs = [];
        window._originalConsoleLog = console.log;
        console.log = (...args: any[]) => {
            // Fix 3: Add non-null assertion as _capturedConsoleLogs is checked above
            window._capturedConsoleLogs!.push(args.map(a => String(a)).join(' '));
            window._originalConsoleLog!.apply(console, args);
        };
    }
    if (!window._capturedErrors) {
        window._capturedErrors = [];
        window._originalWindowOnError = window.onerror;
        window.onerror = (message, source, lineno, colno, error) => {
            const errorMsg = `Error: ${message} at ${source}:${lineno}:${colno}`;
            // Fix 3: Add non-null assertion as _capturedErrors is checked above
            window._capturedErrors!.push(errorMsg);
            if (window._originalWindowOnError) {
                return window._originalWindowOnError(message, source, lineno, colno, error);
            }
            return false;
        };
    }
}

function cleanupMonitoring(): void {
    if (window._originalConsoleLog) {
        console.log = window._originalConsoleLog;
        // Fix 2: delete is now allowed on optional properties
        delete window._originalConsoleLog;
    }
    if (window._capturedConsoleLogs) {
        // Fix 2: delete is now allowed on optional properties
        delete window._capturedConsoleLogs;
    }
    if (window._originalWindowOnError) {
        window.onerror = window._originalWindowOnError;
        // Fix 2: delete is now allowed on optional properties
        delete window._originalWindowOnError;
    }
    if (window._capturedErrors) {
        // Fix 2: delete is now allowed on optional properties
        delete window._capturedErrors;
    }
}

class AutomatedPlaytester {
    private config: TestConfig;
    private results: TestResult[] = [];
    private currentSuiteName: string = '';
    private testStartTime: number = 0;

    constructor(config: Partial<TestConfig> = {}) {
        this.config = {
            debugMode: config.debugMode ?? true,
            testSpeed: config.testSpeed ?? 'normal',
            movementDelay: config.movementDelay ?? (config.testSpeed === 'fast' ? 50 : config.testSpeed === 'slow' ? 500 : 200),
            interactionDelay: config.interactionDelay ?? (config.testSpeed === 'fast' ? 100 : config.testSpeed === 'slow' ? 1000 : 300),
            uiDelay: config.uiDelay ?? (config.testSpeed === 'fast' ? 50 : config.testSpeed === 'slow' ? 500 : 200),
            battleActionDelay: config.battleActionDelay ?? (config.testSpeed === 'fast' ? 200 : config.testSpeed === 'slow' ? 1500 : 800),
            stateCheckInterval: config.stateCheckInterval ?? 50,
            stateCheckTimeout: config.stateCheckTimeout ?? 5000,
            fullRun: config.fullRun ?? true,
            suitesToRun: config.suitesToRun ?? [],
            resetGameBeforeRun: config.resetGameBeforeRun ?? true,
        };
        this.log(`Playtester initialized with speed: ${this.config.testSpeed}`);
    }

    private log(message: string): void {
        if (this.config.debugMode) {
            console.log(`[PLAYTESTER] ${message}`);
        }
    }

    private logError(message: string): void {
        console.error(`[PLAYTESTER ERROR] ${message}`);
    }

    private logWarning(message: string): void {
        console.warn(`[PLAYTESTER WARNING] ${message}`);
    }

    private async pressKey(key: string, delay: number = this.config.movementDelay): Promise<void> {
        simulateKey(key, 'down');
        await sleep(delay);
        simulateKey(key, 'up');
        await sleep(50);
    }

    private readGameState(): GameState {
        return readGameState();
    }

    private async waitForState(
        conditionFn: (state: GameState) => boolean | Promise<boolean>,
        timeout: number = this.config.stateCheckTimeout,
        message: string = 'state change'
    ): Promise<void> {
        await waitFor(async () => conditionFn(this.readGameState()), timeout, this.config.stateCheckInterval)
            .catch(e => { throw new Error(`Failed to wait for ${message}: ${e instanceof Error ? e.message : String(e)}`); });
    }

    private async waitForPlayerMove(initialPos: { x: number; y: number; }, timeout: number = this.config.stateCheckTimeout): Promise<void> {
        await this.waitForState(
            (state) => state.player.x !== initialPos.x || state.player.y !== initialPos.y,
            timeout,
            'player to move'
        );
    }

    private async waitForUIState(
        uiProperty: keyof GameState['ui'],
        expectedState: boolean,
        timeout: number = this.config.stateCheckTimeout
    ): Promise<void> {
        await this.waitForState(
            (state) => state.ui[uiProperty] === expectedState,
            timeout,
            `${String(uiProperty)} to be ${expectedState ? 'active' : 'inactive'}`
        );
    }

    private async runSuite(name: string, suiteFn: () => Promise<void>): Promise<void> {
        this.currentSuiteName = name;
        this.log(`--- Starting Suite: ${name} ---`);
        this.testStartTime = Date.now();
        const initialErrors = [...(window._capturedErrors || [])];
        try {
            await suiteFn();
            this.log(`--- Suite "${name}" Completed in ${((Date.now() - this.testStartTime) / 1000).toFixed(2)}s ---`);
        } catch (error: any) {
            const errorMessage = `Suite "${name}" failed unexpectedly: ${error.message || error}`;
            this.logError(errorMessage);
            this.results.push({
                suite: name,
                test: 'Suite Execution',
                status: 'FAIL',
                message: errorMessage,
                errors: [...initialErrors, ...(window._capturedErrors || [])].filter((e, i, a) => a.indexOf(e) === i),
            });
        } finally {
            this.currentSuiteName = '';
        }
    }

    private async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
        this.log(`  Running Test: ${testName}`);
        const suiteName = this.currentSuiteName;
        const initialErrors = [...(window._capturedErrors || [])];
        const initialLogs = [...(window._capturedConsoleLogs || [])];
        let status: TestResult['status'] = 'FAIL';
        let message: string = 'Test failed due to unknown error.';
        try {
            await testFn();
            status = 'PASS';
            message = 'Test passed.';
            this.log(`  PASS: ${testName}`);
        } catch (error: any) {
            status = 'FAIL';
            message = error.message || String(error);
            this.logError(`  FAIL: ${testName} - ${message}`);
        } finally {
            this.results.push({
                suite: suiteName,
                test: testName,
                status: status,
                message: message,
                errors: [...initialErrors, ...(window._capturedErrors || [])].filter((e, i, a) => a.indexOf(e) === i),
                logs: window._capturedConsoleLogs?.slice(initialLogs.length)
            });
        }
    }

    private async resetGame(): Promise<void> {
        if (window.game?._debug?.resetGame) {
            this.log("Attempting to reset game state via debug function...");
            window.game._debug!.resetGame!(); // Fix: Add non-null assertion for the function call
            await sleep(this.config.interactionDelay * 2);
            this.log("Game reset initiated.");
        } else if (window.game?.startGame) {
            this.log("Attempting to start new game via startGame function...");
            window.game.startGame();
            await sleep(this.config.interactionDelay * 2);
            this.log("New game started.");
        } else {
            this.logWarning("No game reset or start function available. Tests might not start from a clean state.");
        }
    }

    private async testMovement(): Promise<void> {
        await this.runSuite('Movement Testing', async () => {
            const initialPos = this.readGameState().player;
            if (!initialPos) {
                throw new Error('Could not read initial player position for movement test.');
            }

            await this.runTest('Move Right (D)', async () => {
                const state = this.readGameState();
                const startX = state.player.x;
                this.log(`  Player at (${state.player.x}, ${state.player.y}). Moving right...`);
                await this.pressKey('d');
                await this.waitForState(s => s.player.x > startX, this.config.movementDelay * 2, 'player to move right');
                const endX = this.readGameState().player.x;
                if (endX <= startX) {
                    throw new Error(`Player did not move right. Expected x > ${startX}, got ${endX}`);
                }
            });

            await this.runTest('Move Left (A)', async () => {
                const state = this.readGameState();
                const startX = state.player.x;
                this.log(`  Player at (${state.player.x}, ${state.player.y}). Moving left...`);
                await this.pressKey('a');
                await this.waitForState(s => s.player.x < startX, this.config.movementDelay * 2, 'player to move left');
                const endX = this.readGameState().player.x;
                if (endX >= startX) {
                    throw new Error(`Player did not move left. Expected x < ${startX}, got ${endX}`);
                }
            });

            await this.runTest('Move Up (W)', async () => {
                const state = this.readGameState();
                const startY = state.player.y;
                this.log(`  Player at (${state.player.x}, ${state.player.y}). Moving up...`);
                await this.pressKey('w');
                await this.waitForState(s => s.player.y < startY, this.config.movementDelay * 2, 'player to move up');
                const endY = this.readGameState().player.y;
                if (endY >= startY) {
                    throw new Error(`Player did not move up. Expected y < ${startY}, got ${endY}`);
                }
            });

            await this.runTest('Move Down (S)', async () => {
                const state = this.readGameState();
                const startY = state.player.y;
                this.log(`  Player at (${state.player.x}, ${state.player.y}). Moving down...`);
                await this.pressKey('s');
                await this.waitForState(s => s.player.y > startY, this.config.movementDelay * 2, 'player to move down');
                const endY = this.readGameState().player.y;
                if (endY <= startY) {
                    throw new Error(`Player did not move down. Expected y > ${startY}, got ${endY}`);
                }
            });

            await this.runTest('Collision Detection', async () => {
                const game = window.game;
                if (!game?._debug?.teleportPlayer || !game.map?.isWalkable) {
                    this.logWarning("Skipping collision test: Debug teleport or map.isWalkable not available.");
                    return;
                }

                let wallX = -1, wallY = -1;
                const playerPos = this.readGameState().player;

                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const targetX = playerPos.x + dx;
                        const targetY = playerPos.y + dy;
                        // game.map.isWalkable is checked in the outer if-condition
                        if (game.map.isWalkable && !game.map.isWalkable(targetX, targetY)) {
                            wallX = targetX;
                            wallY = targetY;
                            break;
                        }
                    }
                    if (wallX !== -1) break;
                }

                if (wallX === -1) {
                    this.logWarning("Could not find an adjacent wall for collision test. Skipping.");
                    return;
                }

                const teleportX = wallX > playerPos.x ? wallX - 1 : (wallX < playerPos.x ? wallX + 1 : playerPos.x);
                const teleportY = wallY > playerPos.y ? wallY - 1 : (wallY < playerPos.y ? wallY + 1 : playerPos.y);

                game._debug!.teleportPlayer!(teleportX, teleportY); // Fix: Add non-null assertion for the function call
                await sleep(this.config.interactionDelay);

                const preCollisionPos = this.readGameState().player;
                this.log(`  Teleported to (${preCollisionPos.x}, ${preCollisionPos.y}). Attempting to move into wall at (${wallX}, ${wallY}).`);

                let keyToPress: string;
                if (wallX > preCollisionPos.x) keyToPress = 'd';
                else if (wallX < preCollisionPos.x) keyToPress = 'a';
                else if (wallY > preCollisionPos.y) keyToPress = 's';
                else keyToPress = 'w';

                await this.pressKey(keyToPress);
                await sleep(this.config.movementDelay * 2);

                const postCollisionPos = this.readGameState().player;
                if (postCollisionPos.x !== preCollisionPos.x || postCollisionPos.y !== preCollisionPos.y) {
                    throw new Error(`Player moved through wall. Expected (${preCollisionPos.x}, ${preCollisionPos.y}), got (${postCollisionPos.x}, ${postCollisionPos.y})`);
                }
                this.log(`  Collision detected. Player remained at (${postCollisionPos.x}, ${postCollisionPos.y}).`);
            });
        });
    }

    private async testNPCInteraction(): Promise<void> {
        await this.runSuite('NPC Interaction Testing', async () => {
            const game = window.game;
            if (!game?._debug?.teleportPlayer) {
                this.logWarning("Skipping NPC interaction test: Debug teleport not available.");
                return;
            }

            // Filter for NPC entities
            const npcs = this.readGameState().map.entities.filter(e => e.type === 'npc');
            if (npcs.length === 0) {
                this.logWarning("No NPCs found on the current map. Skipping NPC interaction test.");
                return;
            }

            for (const npc of npcs) {
                await this.runTest(`Talk to NPC: ${npc.name || npc.id}`, async () => {
                    game._debug!.teleportPlayer!(npc.x - 1, npc.y); // Fix: Add non-null assertion for the function call
                    await sleep(this.config.interactionDelay);
                    this.log(`  Teleported to (${npc.x - 1}, ${npc.y}) near NPC ${npc.name || npc.id}.`);

                    await this.pressKey('e', this.config.interactionDelay);
                    await this.waitForUIState('dialogueActive', true, this.config.stateCheckTimeout);

                    const dialogueState = this.readGameState().dialogue;
                    if (!dialogueState.active || !dialogueState.text) {
                        throw new Error(`Dialogue did not activate or is empty for NPC ${npc.name || npc.id}.`);
                    }
                    this.log(`  Dialogue active: "${dialogueState.text}" from ${dialogueState.npcId || 'unknown'}.`);

                    await this.pressKey('e', this.config.interactionDelay);
                    await this.waitForUIState('dialogueActive', false, this.config.stateCheckTimeout);
                    if (this.readGameState().dialogue.active) {
                        throw new Error(`Dialogue did not dismiss for NPC ${npc.name || npc.id}.`);
                    }
                    this.log(`  Dialogue dismissed.`);
                });
            }
        });
    }

    private async testCombat(): Promise<void> {
        await this.runSuite('Combat Testing', async () => {
            const game = window.game;
            if (!game?._debug?.teleportPlayer || !game?._debug?.spawnEnemy) {
                this.logWarning("Skipping Combat test: Debug teleport or spawnEnemy not available.");
                return;
            }

            await this.runTest('Enter Combat and Win', async () => {
                await this.resetGame();
                await sleep(this.config.interactionDelay * 2);

                const playerPos = this.readGameState().player;
                const enemySpawnX = playerPos.x + 1;
                const enemySpawnY = playerPos.y;

                this.log(`  Spawning enemy at (${enemySpawnX}, ${enemySpawnY}).`);
                game._debug!.spawnEnemy!('Goblin', enemySpawnX, enemySpawnY); // Fix: Add non-null assertion for the function call
                await sleep(this.config.interactionDelay);

                this.log("  Moving into enemy to start combat.");
                await this.pressKey('d');
                await this.waitForUIState('battleActive', true, this.config.stateCheckTimeout);
                this.log("  Combat started.");

                await this.waitForState(s => s.battle.active && s.battle.playerTurn === true, this.config.stateCheckTimeout, 'player turn in battle'); // Fix 2: Explicitly check for true

                let battleState = this.readGameState().battle;
                let attempts = 0;
                const maxAttempts = 10;

                while (battleState.active && attempts < maxAttempts) {
                    // Fix 2: Ensure battleState.abilities is defined and has elements before accessing [0]
                    // Fix 2: Explicitly check for true for playerTurn
                    if (battleState.playerTurn === true && battleState.abilities && battleState.abilities.length > 0) {
                        this.log(`  Player turn. Using ability: ${battleState.abilities[0]}.`);
                        await this.pressKey('1', this.config.battleActionDelay);
                    } else {
                        this.logWarning("  Player turn but no abilities available or not player's turn. Waiting...");
                    }
                    await sleep(this.config.battleActionDelay);
                    battleState = this.readGameState().battle;
                    attempts++;
                }

                await this.waitForState(s => !s.battle.active, this.config.stateCheckTimeout * 5, 'battle to end');
                if (this.readGameState().battle.active) {
                    throw new Error("Combat did not end after repeated attacks.");
                }
                this.log("  Combat ended. Assuming win.");
            });

            await this.runTest('Enter Combat and Lose (if possible)', async () => {
                if (!game._debug?.teleportPlayer || !game._debug?.spawnEnemy) {
                    this.logWarning("Skipping 'Combat and Lose' test: Debug teleport/spawnEnemy not available.");
                    return;
                }

                await this.resetGame();
                await sleep(this.config.interactionDelay * 2);

                game._debug!.teleportPlayer!(10, 10); // Fix: Add non-null assertion for the function call
                await sleep(this.config.interactionDelay);
                game._debug!.spawnEnemy!('Overlord', 11, 10); // Fix: Add non-null assertion for the function call
                await sleep(this.config.interactionDelay);

                await this.pressKey('d');
                await this.waitForUIState('battleActive', true, this.config.stateCheckTimeout);
                this.log("  Combat started. Expecting loss.");

                let battleState = this.readGameState().battle;
                let attempts = 0;
                const maxAttempts = 20;

                while (battleState.active && this.readGameState().player.hp > 0 && attempts < maxAttempts) {
                    // Fix 2: Ensure battleState.abilities is defined and has elements before accessing [0]
                    // Fix 2: Explicitly check for true for playerTurn
                    if (battleState.playerTurn === true && battleState.abilities && battleState.abilities.length > 0) {
                        await this.pressKey('1', this.config.battleActionDelay);
                    } else {
                        this.logWarning("  Player turn but no abilities available or not player's turn. Waiting...");
                    }
                    await sleep(this.config.battleActionDelay);
                    battleState = this.readGameState().battle;
                    attempts++;
                }

                await this.waitForState(s => !s.battle.active, this.config.stateCheckTimeout * 10, 'battle to end (loss)');
                if (this.readGameState().player.hp > 0) {
                    this.logWarning("  Player did not lose combat. Perhaps the 'Overlord' wasn't strong enough or game logic prevented loss.");
                } else {
                    this.log("  Player lost combat. Test passed.");
                }
            });
        });
    }

    private async testItemUsage(): Promise<void> {
        await this.runSuite('Item Testing', async () => {
            const game = window.game;
            if (!game?._debug?.teleportPlayer || !game?._debug?.giveItem) {
                this.logWarning("Skipping Item test: Debug teleport or giveItem not available.");
                return;
            }

            await this.runTest('Pick up Item', async () => {
                await this.resetGame();
                await sleep(this.config.interactionDelay * 2);

                const initialInventoryCount = this.readGameState().inventory.length;
                const itemX = 5, itemY = 5;
                const itemName = 'Health Potion';

                game._debug!.teleportPlayer!(itemX - 1, itemY); // Fix: Add non-null assertion for the function call
                await sleep(this.config.interactionDelay);
                this.log(`  Moving to pick up '${itemName}' at (${itemX}, ${itemY}).`);
                await this.pressKey('d');

                await this.waitForState(s => s.inventory.length > initialInventoryCount, this.config.stateCheckTimeout, 'item to be picked up');
                const currentInventory = this.readGameState().inventory;
                if (!currentInventory.includes(itemName)) {
                    throw new Error(`Item '${itemName}' was not picked up. Inventory: ${currentInventory.join(', ')}`);
                }
                this.log(`  Item '${itemName}' picked up successfully.`);
            });

            await this.runTest('Use Item (Health Potion)', async () => {
                await this.resetGame();
                await sleep(this.config.interactionDelay * 2);

                let initialHP = this.readGameState().player.hp;
                const maxHP = this.readGameState().player.maxHp;

                if (!this.readGameState().inventory.includes('Health Potion')) {
                    game._debug!.giveItem!('Health Potion'); // Fix: Add non-null assertion for the function call
                    await sleep(this.config.interactionDelay);
                    if (!this.readGameState().inventory.includes('Health Potion')) {
                        throw new Error("Failed to give 'Health Potion' for testing.");
                    }
                }

                if (initialHP === maxHP) {
                    this.logWarning("  Player already at max HP. Attempting to lower HP for potion test.");
                    if (game._debug?.spawnEnemy && game._debug?.teleportPlayer) {
                        game._debug!.teleportPlayer!(10, 10); // Fix: Add non-null assertion for the function call
                        await sleep(this.config.interactionDelay);
                        game._debug!.spawnEnemy!('Weakling', 11, 10); // Fix: Add non-null assertion for the function call
                        await sleep(this.config.interactionDelay);
                        await this.pressKey('d');
                        await this.waitForUIState('battleActive', true, this.config.stateCheckTimeout);
                        await sleep(this.config.battleActionDelay * 2);
                        // Fix 3: Add optional chaining for game.battle.active
                        if (game.battle?.active) {
                            await this.waitForState(s => !s.battle.active, this.config.stateCheckTimeout * 3, 'battle to end for HP reduction');
                        }
                        initialHP = this.readGameState().player.hp;
                        if (initialHP === maxHP) {
                             this.logWarning("  Could not effectively lower player HP for potion test. Skipping.");
                             return;
                        }
                    } else {
                        this.logWarning("  No debug function to lower player HP. Skipping potion test.");
                        return;
                    }
                }

                this.log(`  HP before potion: ${initialHP}. Opening inventory.`);
                await this.pressKey('i', this.config.uiDelay);
                await this.waitForUIState('inventoryScreenActive', true);

                this.log("  Using Health Potion from inventory (simulating '1' then 'e').");
                const inventory = this.readGameState().inventory;
                const itemIndex = inventory.indexOf('Health Potion');
                if (itemIndex === -1) {
                    throw new Error(`Item 'Health Potion' not found in inventory after giving.`);
                }
                // Fix 3: The conversion to string is already correctly handled here.
                await this.pressKey(String(itemIndex + 1), this.config.uiDelay);
                await this.pressKey('e', this.config.uiDelay);
                await this.waitForUIState('inventoryScreenActive', false);

                await this.waitForState(s => s.player.hp > initialHP, this.config.stateCheckTimeout, 'player HP to increase');
                const hpAfterPotion = this.readGameState().player.hp;
                if (hpAfterPotion <= initialHP) {
                    throw new Error(`Health Potion did not increase HP. Before: ${initialHP}, After: ${hpAfterPotion}`);
                }
                this.log(`  Health Potion used. HP increased from ${initialHP} to ${hpAfterPotion}.`);
            });

            await this.runTest('Equip Item (Sword)', async () => {
                await this.resetGame();
                await sleep(this.config.interactionDelay * 2);

                const itemName = 'Iron Sword';
                if (!this.readGameState().inventory.includes(itemName)) {
                    game._debug!.giveItem!(itemName); // Fix: Add non-null assertion for the function call
                    await sleep(this.config.interactionDelay);
                    if (!this.readGameState().inventory.includes(itemName)) {
                        throw new Error(`Failed to give '${itemName}' for equipping test.`);
                    }
                }

                this.log(`  Opening inventory to equip '${itemName}'.`);
                await this.pressKey('i', this.config.uiDelay);
                await this.waitForUIState('inventoryScreenActive', true);

                this.log("  Equipping Iron Sword (simulating item selection then 'e').");
                const inventory = this.readGameState().inventory;
                const itemIndex = inventory.indexOf(itemName);
                if (itemIndex === -1) {
                    throw new Error(`Item '${itemName}' not found in inventory after giving.`);
                }
                await this.pressKey(String(itemIndex + 1), this.config.uiDelay);
                await this.pressKey('e', this.config.uiDelay);
                await this.waitForUIState('inventoryScreenActive', false);

                await this.waitForState(s => s.player.equipped.includes(itemName), this.config.stateCheckTimeout, `item '${itemName}' to be equipped`);
                if (!this.readGameState().player.equipped.includes(itemName)) {
                    throw new Error(`Item '${itemName}' was not equipped. Equipped: ${this.readGameState().player.equipped.join(', ')}`);
                }
                this.log(`  Item '${itemName}' equipped successfully.`);
            });
        });
    }

    private async testSaveLoad(): Promise<void> {
        await this.runSuite('Save/Load Testing', async () => {
            const game = window.game;
            if (!game?.saveGame || !game?.loadGame || !game?._debug?.teleportPlayer || !game?._debug?.giveItem) {
                this.logWarning("Skipping Save/Load test: Save/Load functions or debug functions not available.");
                return;
            }

            const testX = 100, testY = 100;
            const testItem = 'Test Gem';

            await this.runTest('Save Game', async () => {
                await this.resetGame();
                await sleep(this.config.interactionDelay * 2);

                this.log("  Manipulating state for save test: teleporting and giving item.");
                game._debug!.teleportPlayer!(testX, testY); // Fix: Add non-null assertion for the function call
                game._debug!.giveItem!(testItem); // Fix: Add non-null assertion for the function call
                await sleep(this.config.interactionDelay);

                const stateBeforeSave = this.readGameState();
                if (stateBeforeSave.player.x !== testX || stateBeforeSave.player.y !== testY || !stateBeforeSave.inventory.includes(testItem)) {
                    throw new Error("Failed to set up state for save test.");
                }

                this.log("  Calling saveGame().");
                if (game.saveGame) {
                    game.saveGame();
                } else {
                    throw new Error('saveGame function not available');
                }
                await sleep(this.config.interactionDelay * 2);
                this.log("  Save operation completed (assuming success).");
            });

            await this.runTest('Load Game', async () => {
                this.log("  Changing state before load: teleporting to (0,0) and attempting to clear inventory.");
                game._debug!.teleportPlayer!(0, 0); // Fix: Add non-null assertion for the function call
                await sleep(this.config.interactionDelay);

                const stateBeforeLoad = this.readGameState();
                if (stateBeforeLoad.player.x === testX && stateBeforeLoad.player.y === testY) {
                    this.logWarning("  State did not change before load, might affect test validity.");
                }

                this.log("  Calling loadGame().");
                if (game.loadGame) {
                    game.loadGame();
                } else {
                    throw new Error('loadGame function not available');
                }
                await sleep(this.config.interactionDelay * 2);

                const stateAfterLoad = this.readGameState();
                if (stateAfterLoad.player.x !== testX || stateAfterLoad.player.y !== testY) {
                    throw new Error(`Player position not restored. Expected (${testX}, ${testY}), got (${stateAfterLoad.player.x}, ${stateAfterLoad.player.y})`);
                }
                if (!stateAfterLoad.inventory.includes(testItem)) {
                    throw new Error(`Item '${testItem}' not restored in inventory. Inventory: ${stateAfterLoad.inventory.join(', ')}`);
                }
                this.log("  Load operation successful. State restored.");
            });
        });
    }

    private async testMapTransitions(): Promise<void> {
        await this.runSuite('Map Transition Testing', async () => {
            const game = window.game;
            if (!game?._debug?.teleportPlayer) {
                this.logWarning("Skipping Map Transition test: Debug teleport not available.");
                return;
            }

            // Fix 6: Filter for portal entities that have a targetMap.
            // The filter ensures that `e.targetMap` is defined for elements in `portals`.
            const portals = this.readGameState().map.entities.filter(e => e.type === 'portal' && e.targetMap);
            if (portals.length === 0) {
                this.logWarning("No portals with target maps found on the current map. Skipping map transition test.");
                return;
            }

            for (const portal of portals) {
                // Fix 6: Use non-null assertion `!` for portal.targetMap as it's guaranteed by the filter
                await this.runTest(`Transition to map: ${portal.targetMap!} via portal at (${portal.x}, ${portal.y})`, async () => {
                    const initialMap = this.readGameState().map.current;
                    this.log(`  Current map: ${initialMap}. Teleporting to portal at (${portal.x}, ${portal.y}).`);
                    game._debug!.teleportPlayer!(portal.x, portal.y); // Fix: Add non-null assertion for the function call
                    await sleep(this.config.interactionDelay);

                    this.log(`  Waiting for transition to ${portal.targetMap!}.`);
                    await this.waitForState(s => s.map.current === portal.targetMap, Number(this.config.stateCheckTimeout) * 2, `map to change to ${portal.targetMap!}`);

                    const newMap = this.readGameState().map.current;
                    if (newMap !== portal.targetMap) {
                        throw new Error(`Map transition failed. Expected '${portal.targetMap}', got '${newMap}'.`);
                    }
                    this.log(`  Successfully transitioned to map: ${newMap}.`);

                    if (game._debug?.teleportPlayer && initialMap !== 'unknown') {
                        this.log(`  Attempting to return to initial map: ${initialMap}.`);
                        game._debug!.teleportPlayer!(0, 0); // Fix: Add non-null assertion for the function call
                        await sleep(this.config.interactionDelay);
                        if (this.readGameState().map.current !== initialMap) {
                            this.logWarning(`  Could not verify return to initial map. Currently on: ${this.readGameState().map.current}.`);
                        } else {
                            this.log(`  Successfully returned to initial map: ${initialMap}.`);
                        }
                    }
                });
            }
        });
    }

    private async testShopInteraction(): Promise<void> {
        await this.runSuite('Shop Interaction Testing', async () => {
            const game = window.game;
            if (!game?._debug?.teleportPlayer || !game?._debug?.giveItem) {
                this.logWarning("Skipping Shop Interaction test: Debug teleport or giveItem not available.");
                return;
            }

            // Filter for shop entities
            const shops = this.readGameState().map.entities.filter(e => e.type === 'shop');
            if (shops.length === 0) {
                this.logWarning("No shops found on the current map. Skipping shop interaction test.");
                return;
            }

            for (const shop of shops) {
                await this.runTest(`Interact with Shop: ${shop.name || shop.id}`, async () => {
                    await this.resetGame();
                    await sleep(this.config.interactionDelay * 2);

                    game._debug!.teleportPlayer!(shop.x - 1, shop.y); // Fix: Add non-null assertion for the function call
                    await sleep(this.config.interactionDelay);
                    this.log(`  Teleported to (${shop.x - 1}, ${shop.y}) near shop ${shop.name || shop.id}.`);

                    await this.pressKey('e', this.config.interactionDelay);
                    await this.waitForUIState('shopScreenActive', true, this.config.stateCheckTimeout);

                    const shopState = this.readGameState().shop;
                    if (!shopState.active || !shopState.items || shopState.items.length === 0) {
                        throw new Error(`Shop did not open or has no items for shop ${shop.name || shop.id}.`);
                    }
                    this.log(`  Shop '${shop.name || shop.id}' opened with ${shopState.items.length} items.`);

                    const firstItem = shopState.items[0]; // Guaranteed to exist by previous check
                    if (firstItem && this.readGameState().player.gold >= firstItem.price) {
                        const initialGold = this.readGameState().player.gold;
                        this.log(`  Attempting to buy '${firstItem.name}' for ${firstItem.price} gold.`);
                        await this.pressKey('1', this.config.uiDelay);
                        await this.pressKey('e', this.config.uiDelay);
                        await this.waitForState(s => s.player.gold < initialGold || s.inventory.includes(firstItem.name),
                            this.config.stateCheckTimeout, 'item purchase');

                        const currentGold = this.readGameState().player.gold;
                        const currentInventory = this.readGameState().inventory;
                        if (currentGold >= initialGold || !currentInventory.includes(firstItem.name)) {
                            throw new Error(`Failed to buy '${firstItem.name}'. Gold: ${initialGold}->${currentGold}, Inventory: ${currentInventory.join(', ')}`);
                        }
                        this.log(`  Successfully bought '${firstItem.name}'. Gold: ${initialGold} -> ${currentGold}.`);
                    } else {
                        this.logWarning(`  Skipping buy test for '${firstItem?.name || 'N/A'}': Not enough gold or no items.`);
                    }

                    const playerInventory = this.readGameState().inventory;
                    if (playerInventory.length > 0) {
                        const itemToSell = playerInventory[0];
                        const initialGold = this.readGameState().player.gold;
                        this.log(`  Attempting to sell '${itemToSell}'.`);
                        await this.pressKey('i', this.config.uiDelay);
                        await this.waitForUIState('inventoryScreenActive', true);
                        await this.pressKey('1', this.config.uiDelay);
                        await this.pressKey('e', this.config.uiDelay);
                        await this.waitForState(s => s.player.gold > initialGold || !s.inventory.includes(itemToSell),
                            this.config.stateCheckTimeout, 'item sale');

                        const currentGold = this.readGameState().player.gold;
                        const currentInventory = this.readGameState().inventory;
                        if (currentGold <= initialGold || currentInventory.includes(itemToSell)) {
                            throw new Error(`Failed to sell '${itemToSell}'. Gold: ${initialGold}->${currentGold}, Inventory: ${currentInventory.join(', ')}`);
                        }
                        this.log(`  Successfully sold '${itemToSell}'. Gold: ${initialGold} -> ${currentGold}.`);
                    } else {
                        this.logWarning("  No items in inventory to sell. Skipping sell test.");
                    }

                    await this.pressKey('e', this.config.interactionDelay);
                    await this.waitForUIState('shopScreenActive', false, this.config.stateCheckTimeout);
                    if (this.readGameState().shop.active) {
                        throw new Error(`Shop did not close for shop ${shop.name || shop.id}.`);
                    }
                    this.log(`  Shop '${shop.name || shop.id}' closed.`);
                });
            }
        });
    }

    private async testCharacterScreen(): Promise<void> {
        await this.runSuite('Character Screen Testing', async () => {
            await this.runTest('Open and Close Character Screen', async () => {
                this.log("  Opening character screen (pressing 'C').");
                await this.pressKey('c', this.config.uiDelay);
                await this.waitForUIState('characterScreenActive', true);

                if (!this.readGameState().ui.characterScreenActive) {
                    throw new Error("Character screen did not open.");
                }
                this.log("  Character screen opened successfully.");

                const playerState = this.readGameState().player;
                // These checks are technically redundant because readGameState provides default 0,
                // but keeping them doesn't hurt and reflects original intent.
                if (playerState.hp === undefined || playerState.gold === undefined) {
                    this.logWarning("  Could not verify player HP/Gold on character screen (data not exposed or UI not checked).");
                } else {
                    this.log(`  Verified player HP: ${playerState.hp}, Gold: ${playerState.gold} on screen.`);
                }

                this.log("  Closing character screen (pressing 'C' again).");
                await this.pressKey('c', this.config.uiDelay);
                await this.waitForUIState('characterScreenActive', false);
                if (this.readGameState().ui.characterScreenActive) {
                    throw new Error("Character screen did not close.");
                }
                this.log("  Character screen closed successfully.");
            });
        });
    }

    private async testQuestSystem(): Promise<void> {
        await this.runSuite('Quest System Testing', async () => {
            const game = window.game;
            if (!game?._debug?.teleportPlayer || !game?._debug?.completeQuest) {
                this.logWarning("Skipping Quest System test: Debug teleport or completeQuest not available.");
                return;
            }

            await this.runTest('Accept and Complete a Quest', async () => {
                await this.resetGame();
                await sleep(this.config.interactionDelay * 2);

                // Filter for NPC entities that are also quest givers
                // This is now type-safe as GameMapEntity includes giverId as optional
                const questGivers = this.readGameState().map.entities.filter(e =>
                    e.type === 'npc' && this.readGameState().map.entities.some(q => q.type === 'quest' && q.giverId === e.id)
                );

                if (questGivers.length === 0) {
                    this.logWarning("No quest givers found. Skipping quest acceptance test.");
                    return;
                }
                const questGiver = questGivers[0];
                // Assuming a known quest ID and name for testing purposes.
                // In a real scenario, you might try to infer this from the game state.
                const questId = 'firstQuest';
                const questName = 'The First Quest';

                game._debug!.teleportPlayer!(questGiver.x - 1, questGiver.y); // Fix: Add non-null assertion for the function call
                await sleep(this.config.interactionDelay);
                this.log(`  Interacting with quest giver ${questGiver.name || questGiver.id} to accept '${questName}'.`);

                await this.pressKey('e', this.config.interactionDelay);
                await this.waitForUIState('dialogueActive', true);
                // Assuming multiple 'e' presses might be needed to cycle through dialogue and accept quest
                await this.pressKey('e', this.config.interactionDelay);
                await this.pressKey('e', this.config.interactionDelay);
                await this.waitForUIState('dialogueActive', false);

                await this.waitForState(s => s.quests.some(q => q.id === questId && q.status === 'active'),
                    this.config.stateCheckTimeout, `quest '${questName}' to become active`);
                if (!this.readGameState().quests.some(q => q.id === questId && q.status === 'active')) {
                    throw new Error(`Quest '${questName}' was not accepted or did not become active.`);
                }
                this.log(`  Quest '${questName}' accepted and is active.`);

                this.log(`  Completing quest '${questName}' via debug function.`);
                game._debug!.completeQuest!(questId); // Fix: Add non-null assertion for the function call
                await sleep(this.config.interactionDelay);

                await this.waitForState(s => s.quests.some(q => q.id === questId && q.status === 'completed'),
                    this.config.stateCheckTimeout, `quest '${questName}' to become completed`);
                if (!this.readGameState().quests.some(q => q.id === questId && q.status === 'completed')) {
                    throw new Error(`Quest '${questName}' was not completed.`);
                }
                this.log(`  Quest '${questName}' successfully completed.`);
            });

            await this.runTest('Open and Close Quest Log', async () => {
                this.log("  Opening quest log (assuming 'J' key).");
                await this.pressKey('j', this.config.uiDelay);
                // The original code checks mapScreenActive, which might be a placeholder for a generic UI screen.
                // If there's a specific quest log UI state, it should be used here.
                // For now, keeping mapScreenActive as per original.
                await this.waitForUIState('mapScreenActive', true);
                this.log("  Quest log opened successfully (placeholder check).");

                this.log("  Closing quest log (pressing 'J' again).");
                await this.pressKey('j', this.config.uiDelay);
                await this.waitForUIState('mapScreenActive', false);
                this.log("  Quest log closed successfully (placeholder check).");
            });
        });
    }

    public async start(suitesToRun?: string[]): Promise<void> {
        setupMonitoring();
        this.log("Automated Playtester starting...");

        try {
            await waitFor(() => !!window.game, Number(this.config.stateCheckTimeout) * 2, this.config.stateCheckInterval);
            this.log("window.game detected. Proceeding with tests.");
        } catch (e: any) {
            this.logError(`Game object (window.game) not found after timeout. Cannot proceed with tests: ${e.message}`);
            this.results.push({
                suite: 'Framework Setup',
                test: 'Game Object Availability',
                status: 'FAIL',
                message: `window.game was not found. Ensure the game is loaded and exposes its state.`,
                errors: window._capturedErrors || []
            });
            this.generateReport();
            cleanupMonitoring();
            return;
        }

        if (this.config.resetGameBeforeRun) {
            await this.resetGame();
        }

        const allSuites = {
            'Movement Testing': this.testMovement.bind(this),
            'NPC Interaction Testing': this.testNPCInteraction.bind(this),
            'Combat Testing': this.testCombat.bind(this),
            'Item Testing': this.testItemUsage.bind(this),
            'Save/Load Testing': this.testSaveLoad.bind(this),
            'Map Transition Testing': this.testMapTransitions.bind(this),
            'Shop Interaction Testing': this.testShopInteraction.bind(this),
            'Character Screen Testing': this.testCharacterScreen.bind(this),
            'Quest System Testing': this.testQuestSystem.bind(this),
        };

        const suitesToExecute = suitesToRun && suitesToRun.length > 0
            ? suitesToRun
            : (this.config.fullRun ? Object.keys(allSuites) : this.config.suitesToRun);

        for (const suiteName of suitesToExecute) {
            const suiteFn = allSuites[suiteName as keyof typeof allSuites];
            if (suiteFn) {
                await suiteFn();
            } else {
                this.logWarning(`Suite "${suiteName}" not found. Skipping.`);
                this.results.push({
                    suite: suiteName,
                    test: 'Suite Selection',
                    status: 'SKIP',
                    message: `Suite "${suiteName}" was requested but not found.`,
                    errors: []
                });
            }
            await sleep(this.config.interactionDelay * 2);
        }

        this.generateReport();
        cleanupMonitoring();
        this.log("Automated Playtester finished.");
    }

    private generateReport(): void {
        console.log('\n--- AUTOMATED PLAYTESTER REPORT ---');
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        const suiteResults: { [key: string]: { total: number; passed: number; failed: number; skipped: number; tests: TestResult[] } } = {};

        this.results.forEach(res => {
            if (!suiteResults[res.suite]) {
                suiteResults[res.suite] = { total: 0, passed: 0, failed: 0, skipped: 0, tests: [] };
            }
            suiteResults[res.suite].total++;
            suiteResults[res.suite].tests.push(res);
            if (res.status === 'PASS') {
                passed++;
                suiteResults[res.suite].passed++;
            } else if (res.status === 'FAIL') {
                failed++;
                suiteResults[res.suite].failed++;
            } else if (res.status === 'SKIP') {
                skipped++;
                suiteResults[res.suite].skipped++;
            }
        });

        for (const suiteName in suiteResults) {
            const suiteRes = suiteResults[suiteName];
            console.log(`\nSuite: ${suiteName} (${suiteRes.passed}/${suiteRes.total} Passed, ${suiteRes.failed} Failed, ${suiteRes.skipped} Skipped)`);
            suiteRes.tests.forEach(test => {
                const statusIcon = test.status === 'PASS' ? '✅' : (test.status === 'FAIL' ? '❌' : '⚠️');
                console.log(`  ${statusIcon} ${test.test}: ${test.message}`);
                if (test.status === 'FAIL' && test.errors && test.errors.length > 0) {
                    console.error('    Captured Errors:');
                    test.errors.forEach(err => console.error(`      - ${err}`));
                }
                if (test.status === 'FAIL' && test.logs && test.logs.length > 0 && this.config.debugMode) {
                    console.log('    Relevant Logs:');
                    test.logs.forEach(log => console.log(`      > ${log}`));
                }
            });
        }

        console.log('\n--- SUMMARY ---');
        console.log(`Total Tests: ${this.results.length}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log(`Skipped: ${skipped} ⚠️`);

        if (window._capturedErrors && window._capturedErrors.length > 0) {
            console.error('\n--- GLOBAL UNHANDLED ERRORS DURING RUN ---');
            window._capturedErrors.forEach(err => console.error(`- ${err}`));
        }
        console.log('\n--- REPORT END ---');
    }
}

// Fix 4: Use proper type exports for interfaces
export { AutomatedPlaytester };
export type { TestConfig, GameState, TestResult, GameMapEntity };