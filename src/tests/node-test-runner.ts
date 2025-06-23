// src/tests/node-test-runner.ts

// --- MOCK SETUP ---
// Mock localStorage: Provides an in-memory storage for SaveGameService tests.
const localStorageMock = (function () {
  let store: { [key: string]: string } = {};
  return {
    getItem: function (key: string) {
      return store[key] || null;
    },
    setItem: function (key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem: function (key: string) {
      delete store[key];
    },
    clear: function () {
      store = {};
    },
    // Helper for testing internal state of the mock
    getStore: function() {
      return store;
    }
  };
})();

// Assign the mock to the global object to simulate browser environment
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock window and performance: Essential for GameEngine's internal timers and requestAnimationFrame.
const windowMock = {
  performance: {
    now: () => Date.now(), // Simple mock for performance.now()
  },
  // Simulate requestAnimationFrame with setTimeout for basic time progression in tests.
  // This is not a true RAF, but sufficient for advancing GameEngine's internal clock.
  requestAnimationFrame: (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 16), // Simulate ~60 FPS
  cancelAnimationFrame: (id: number) => clearTimeout(id),
};

// Assign mocks to global objects
Object.defineProperty(global, 'window', { value: windowMock });
Object.defineProperty(global, 'performance', { value: windowMock.performance });
Object.defineProperty(global, 'requestAnimationFrame', { value: windowMock.requestAnimationFrame });
Object.defineProperty(global, 'cancelAnimationFrame', { value: windowMock.cancelAnimationFrame });

// Mock React.Dispatch: GameEngine relies on this to communicate state changes.
// This mock records dispatched actions and applies them to a mutable `mockGameState`
// to simulate the game state updates that would normally happen in a React context.
let mockGameState: any = {}; // This will be the mutable state for GameEngine tests
let dispatchedActions: any[] = []; // To record actions for assertion

const mockDispatch = (action: any) => {
  dispatchedActions.push(action);
  // Simulate state updates based on common actions.
  // This is crucial for GameEngine tests where the engine reads its own dispatched state.
  switch (action.type) {
    case 'MOVE_PLAYER':
      const { direction } = action.payload;
      const { x, y } = mockGameState.player.position;
      let newX = x, newY = y;
      if (direction === 'up') newY--;
      else if (direction === 'down') newY++;
      else if (direction === 'left') newX--;
      else if (direction === 'right') newX++;
      mockGameState.player.position = { x: newX, y: newY };
      break;
    case 'UPDATE_MAP':
      mockGameState.currentMap = action.payload.newMap;
      mockGameState.player.position = action.payload.playerNewPosition;
      // Also update enemies, NPCs, items on map for the new map
      mockGameState.enemies = action.payload.newMap.entities.filter((e: any) => e instanceof Enemy);
      mockGameState.npcs = action.payload.newMap.entities.filter((e: any) => 'dialogueId' in e);
      mockGameState.items = action.payload.newMap.entities.filter((e: any) => e instanceof Item);
      break;
    case 'START_BATTLE':
      mockGameState.battle = { enemies: action.payload.enemies, player: mockGameState.player, combatLog: [] };
      break;
    case 'END_BATTLE':
      mockGameState.battle = null;
      break;
    case 'REMOVE_ENEMY':
      mockGameState.enemies = mockGameState.enemies.filter((e: any) => e.id !== action.payload.enemyId);
      // Also remove from currentMap.entities if it's there
      mockGameState.currentMap.entities = mockGameState.currentMap.entities.filter((e: any) => !(e instanceof Enemy && e.id === action.payload.enemyId));
      break;
    case 'ADD_ITEM':
      if (action.payload.toPlayerInventory) {
        mockGameState.player.addItem(action.payload.item); // Use player's method
      } else {
        mockGameState.items.push(action.payload.item);
      }
      break;
    case 'REMOVE_ITEM':
      if (action.payload.fromPlayerInventory) {
        mockGameState.player.removeItem(action.payload.itemId); // Use player's method
      } else {
        mockGameState.items = mockGameState.items.filter((i: any) => i.id !== action.payload.itemId);
        // Also remove from currentMap.entities if it's there
        mockGameState.currentMap.entities = mockGameState.currentMap.entities.filter((e: any) => !(e instanceof Item && e.id === action.payload.itemId));
      }
      break;
    case 'START_DIALOGUE':
      mockGameState.dialogue = action.payload.dialogueState;
      break;
    case 'END_DIALOGUE':
      mockGameState.dialogue = null;
      break;
    case 'SHOW_NOTIFICATION':
      mockGameState.notification = action.payload.message;
      break;
    case 'TOGGLE_INVENTORY':
      mockGameState.showInventory = !mockGameState.showInventory;
      break;
    case 'TOGGLE_QUEST_LOG':
      mockGameState.showQuestLog = !mockGameState.showQuestLog;
      break;
    case 'TOGGLE_CHARACTER_SCREEN':
      mockGameState.showCharacterScreen = !mockGameState.showCharacterScreen;
      break;
    case 'UPDATE_PLAYER_STATS':
      mockGameState.player.updateBaseStats(action.payload.stats);
      break;
    case 'UPDATE_PLAYER_GOLD':
      mockGameState.player.gold = action.payload.gold;
      break;
    case 'UPDATE_QUEST_MANAGER_STATE':
      // In a real app, this would trigger a re-render of quest UI.
      // For tests, we just update the state.
      mockGameState.questManagerState = action.payload.state;
      break;
    // Add more state update logic as needed for tests
  }
  // After dispatching and updating mockGameState, ensure GameEngine's internal state is updated.
  // This is crucial for tests where GameEngine makes multiple decisions based on its internal state.
  if (globalGameEngineInstance) {
    globalGameEngineInstance.setGameState(mockGameState);
  }
};

// Mock dialogue data (minimal for testing NPC interaction)
const mockDialoguesData = [
  {
    id: 'npc_villager_dialogue_01',
    lines: [
      { text: 'Hello, adventurer!', speaker: 'Villager' },
      { text: 'The bugs are getting worse.', speaker: 'Villager' },
    ],
  },
  {
    id: 'npc_shopkeeper_dialogue_01',
    lines: [
      { text: 'Welcome to my shop!', speaker: 'Shopkeeper' },
      { text: 'What can I get for you?', speaker: 'Shopkeeper' },
    ],
  },
];
// Mock map data index (minimal for testing map transitions and collisions)
const mockMapDataIndex = {
  'town_square': {
    id: 'town_square',
    name: 'Town Square',
    width: 5,
    height: 5,
    tiles: [
      [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }],
      [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }],
      [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }],
      [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }],
      [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }],
    ],
    entities: [],
    exits: [{ position: { x: 4, y: 2 }, targetMapId: 'forest_path', targetPosition: { x: 0, y: 2 } }],
  },
  'forest_path': {
    id: 'forest_path',
    name: 'Forest Path',
    width: 5,
    height: 5,
    tiles: [
      [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }],
      [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }],
      [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }],
      [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }],
      [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }],
    ],
    entities: [],
    exits: [{ position: { x: 0, y: 2 }, targetMapId: 'town_square', targetPosition: { x: 4, y: 2 } }],
  },
  'dungeon_entrance': {
    id: 'dungeon_entrance',
    name: 'Dungeon Entrance',
    width: 3,
    height: 3,
    tiles: [
      [{ type: 'stone', walkable: true }, { type: 'stone', walkable: true }, { type: 'stone', walkable: true }],
      [{ type: 'stone', walkable: true }, { type: 'locked_door', walkable: false }, { type: 'stone', walkable: true }],
      [{ type: 'stone', walkable: true }, { type: 'stone', walkable: true }, { type: 'stone', walkable: true }],
    ],
    entities: [],
    exits: [],
  },
  'wall_map': { // Custom map for wall collision test
    id: 'wall_map',
    name: 'Wall Map',
    width: 3,
    height: 3,
    tiles: [
      [{ type: 'grass', walkable: true }, { type: 'wall', walkable: false }, { type: 'grass', walkable: true }],
      [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }],
      [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }],
    ],
    entities: [],
    exits: [],
  },
};

// Override imports for mocked data using a simple global mock for tsx.
// In a full Jest setup, this would be done with `jest.mock`.
// For `tsx`, we can directly modify `require.cache` or use `module-alias` if needed,
// but for simple JSON/object imports, direct assignment to a global mock is often sufficient
// if the original module is not already loaded or if we control the import path.
// A more robust way for `tsx` is to use `module-alias` or ensure the mock is loaded first.
// For this example, we'll assume `tsx` handles this by allowing direct override of the import.
// If this fails, a `package.json` "imports" field or `module-alias` would be needed.
// For simplicity, we'll use a direct mock that `tsx` should pick up.
// Note: This is a common pattern for simple mocks in Node.js, but might not work for all module systems.
// For `tsx`, the `jest.mock` syntax is often recognized if `jest-mock` is installed.
// Let's use a more direct approach by creating a mock file and then importing it.
// Since the original files are in `src/assets`, we need to simulate that.
// For this exercise, we'll assume the `tsx` environment can handle this direct override.

// A more robust way for tsx would be to create mock files in a __mocks__ directory
// or use a custom resolver. For this self-contained file, we'll just define them here.
// If `tsx` doesn't pick this up, a simple `require.cache` manipulation might be needed.
// For now, let's assume direct import override works.
// This is a common pattern for simple mocks in Node.js, but might not work for all module systems.
// For `tsx`, the `jest.mock` syntax is often recognized if `jest-mock` is installed.
// Let's use a direct approach by creating a mock file and then importing it.
// Since the original files are in `src/assets`, we need to simulate that.
// For this exercise, we'll assume the `tsx` environment can handle this direct override.

// A simple way to mock modules for Node.js/TSX without a full framework like Jest:
// This works by overriding the module resolution for specific paths.
// This is a bit advanced for a single file, but necessary for direct imports.
// For this problem, we'll assume the user's `tsx` setup or `tsconfig.json`
// allows for direct mocking of these paths, or that the imports are resolved
// after our mocks are defined.
// Given the prompt, the simplest way is to ensure the mock data is available
// when the game logic files are imported.

// For `tsx`, if you have `tsconfig.json` with `baseUrl` and `paths`, you might need
// to configure `module-alias` or similar.
// For this specific problem, let's assume `tsx` can handle this by defining the mocks
// before the actual imports of the game logic.

// This is a common workaround for simple cases in Node.js without a full test runner.
// It might not be perfectly robust for all module resolution scenarios.
// If `tsx` complains, the user might need to adjust their `tsconfig.json` or `package.json`
// to ensure these mocks are picked up.
// For this example, we'll define them as if they were actual modules.
// This is a bit of a hack, but for a self-contained test file, it's often acceptable.

// We'll simulate the module structure by directly assigning to a global object
// that can be referenced by the game logic files if they are imported *after* this.
// This is not standard module mocking but a pragmatic approach for a single file.

// A more direct way to mock `dialogues.json` and `mapDataIndex` for `tsx`
// is to use `module-alias` or ensure the mock data is available globally
// and the consuming modules are modified to use a global variable if it exists.
// For this problem, we'll assume the `GameEngine` and other modules
// can be configured to use these mocks.

// Let's define global variables that the game modules can potentially pick up
// if their import paths are configured to allow it, or if we modify them.
// Given the constraint of "import game models directly", we can't modify the game models.
// So, the mocking has to happen at the module resolution level.
// The `jest.mock` syntax is often supported by `tsx` if `jest-mock` is a dependency.
// Let's add a comment assuming `jest-mock` is available for `tsx`.

// If `jest-mock` is not available or configured for `tsx`, these mocks might not work.
// A fallback would be to manually override `require.cache` for these modules,
// but that's more complex for a single file.

// @ts-ignore
global['__MOCKED_DIALOGUES_DATA__'] = mockDialoguesData;
// @ts-ignore
global['__MOCKED_MAP_DATA_INDEX__'] = mockMapDataIndex;

// The actual game files would need to import like:
// import dialoguesData from '../assets/dialogues.json';
// import { mapDataIndex } from '../assets/maps';
// For this to work with mocks, `tsx` needs to resolve these paths to our mocks.
// A common way is to use `jest.mock` syntax which `tsx` can interpret if `jest-mock` is installed.
// If not, the direct import will try to load the real files.
// For the purpose of this exercise, we will assume `tsx` handles this mock syntax.
// If running this directly, ensure `jest-mock` is installed (`npm install --save-dev jest-mock`).

// --- IMPORTS ---
// Import core game models and types.
import { Player, EquippableItem, EquipmentSlotType } from '../models/Player';
import { Enemy, EnemyVariant } from '../models/Enemy';
import { Item, ItemVariant } from '../models/Item';
import { GameMap } from '../models/Map';
import { NPCModel } from '../models/NPC';
import { TalentTree, Talent } from '../models/TalentTree';
import { QuestManager, QuestStatus } from '../models/QuestManager';
import BattleSystem from '../engine/BattleSystem';
// import { Shop } from '../models/Shop'; // Shop model doesn't exist
import { GameEngine } from '../engine/GameEngine';
import SaveGameService from '../services/SaveGame';

// Import types for clarity and to avoid naming conflicts with classes
import {
  Position,
  Direction,
  Item as IItem, // Alias to avoid conflict with Item class
  Ability,
  StatusEffect,
  PlayerStats,
  CombatStats,
  NPC,
  DialogueState,
  BattleState,
  Quest,
  CombatLogEntry,
  GameMap as IGameMap, // Alias to avoid conflict with GameMap class
  Exit,
  Tile,
  TileType,
  GameAction,
  GameState as IGameState, // Alias to avoid conflict with mockGameState
} from '../types/global.types';

// Global instance of GameEngine for mockDispatch to update its state
let globalGameEngineInstance: GameEngine | null = null;


// --- TEST UTILITIES AND HELPERS ---

// ANSI escape codes for colored console output
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';

// Global counters for test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let currentSuiteName = '';

// Custom assertion functions
function assert(condition: boolean, message: string): void {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`${green}  ✓ ${message}${reset}`);
  } else {
    failedTests++;
    console.error(`${red}  ✗ ${message}${reset}`);
    throw new Error(message); // Throw to stop current test execution on first failure
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  assert(actual === expected, `${message} (Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)})`);
}

function assertNotEqual<T>(actual: T, expected: T, message: string): void {
  assert(actual !== expected, `${message} (Expected not: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)})`);
}

function assertTrue(value: boolean, message: string): void {
  assert(value === true, `${message} (Expected: true, Got: ${value})`);
}

function assertFalse(value: boolean, message: string): void {
  assert(value === false, `${message} (Expected: false, Got: ${value})`);
}

function assertThrows(fn: () => any, message: string): void {
  totalTests++;
  let thrown = false;
  try {
    fn();
  } catch (e) {
    thrown = true;
  }
  if (thrown) {
    passedTests++;
    console.log(`${green}  ✓ ${message}${reset}`);
  } else {
    failedTests++;
    console.error(`${red}  ✗ ${message} (Expected an error to be thrown)${reset}`);
    throw new Error(message);
  }
}

// Deep equality check for objects/arrays
function assertDeepEqual(actual: any, expected: any, message: string): void {
  totalTests++;
  try {
    // Use JSON.stringify for simple deep comparison.
    // For complex objects with functions, circular refs, or specific class instances,
    // a more robust deep equality library would be needed.
    assertEqual(JSON.stringify(actual), JSON.stringify(expected), message);
  } catch (e) {
    failedTests++;
    console.error(`${red}  ✗ ${message} (Deep equality failed)${reset}`);
    throw e;
  }
}

// Test suite runner
function suite(name: string, testsFn: () => void): void {
  currentSuiteName = name;
  console.log(`\n${cyan}--- ${name} ---${reset}`);
  try {
    testsFn();
  } catch (e: any) {
    // Error already logged by assertion function, just catch to continue other suites
  }
}

// Individual test case runner
function test(name: string, fn: () => void): void {
  try {
    fn();
  } catch (e: any) {
    // Error already logged by assertion function, just catch to continue other tests in suite
  }
}

// Helper to run a setup function before each test in a suite
// This mimics Jest's `beforeEach` and helps ensure test isolation.
type BeforeEachFn = () => void;
let currentBeforeEach: BeforeEachFn | null = null;

function beforeEach(fn: BeforeEachFn) {
  currentBeforeEach = fn;
}

// Wrapper for `test` that executes `beforeEach` if set
function testWithBeforeEach(name: string, fn: () => void): void {
  test(name, () => {
    if (currentBeforeEach) {
      currentBeforeEach();
    }
    fn();
  });
}


// Main function to run all test suites
function runAllTests(): void {
  console.log(`${cyan}Starting Node.js Game Logic Tests for Tales of Claude...${reset}`);

  // --- TEST SUITES EXECUTION ---
  testPlayerModel();
  testEnemyModel();
  testItemModel();
  testGameMapModel();
  testTalentTree();
  testQuestManager();
  // testShop(); // Shop model doesn't exist
  testBattleSystem();
  testGameEngine();
  testSaveGameService();
  testStatusEffects(); // More dedicated status effect tests

  // --- SUMMARY ---
  console.log(`\n${cyan}--- Test Summary ---${reset}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${green}Passed: ${passedTests}${reset}`);
  if (failedTests > 0) {
    console.error(`${red}Failed: ${failedTests}${reset}`);
  } else {
    console.log(`${green}All tests passed!${reset}`);
  }
  console.log(`${cyan}--------------------${reset}\n`);
}

// --- TEST SUITE IMPLEMENTATIONS ---

function testPlayerModel(): void {
  suite('Player Model Tests', () => {
    let player: Player;

    beforeEach(() => {
      player = new Player('p1', 'Claude', { x: 0, y: 0 });
    });

    testWithBeforeEach('Player initialization', () => {
      assertEqual(player.name, 'Claude', 'Player name should be initialized');
      assertEqual(player.position.x, 0, 'Player X position should be 0');
      assertEqual(player.position.y, 0, 'Player Y position should be 0');
      assertEqual(player.getBaseStats().hp, 100, 'Player HP should be 100');
      assertEqual(player.gold, 100, 'Player gold should be 100');
      assertEqual(player.talentPoints, 0, 'Player talent points should be 0 at start');
      assertTrue(player.abilities.length > 0, 'Player should have starting abilities');
    });

    testWithBeforeEach('Player movement', () => {
      player.move('right');
      assertEqual(player.position.x, 1, 'Player should move right');
      player.move('down');
      assertEqual(player.position.y, 1, 'Player should move down');
      player.move('left');
      assertEqual(player.position.x, 0, 'Player should move left');
      player.move('up');
      assertEqual(player.position.y, 0, 'Player should move up');
    });

    testWithBeforeEach('Player takeDamage and heal', () => {
      player.takeDamage(20);
      assertEqual(player.getBaseStats().hp, 80, 'Player HP should decrease after damage');
      player.heal(10);
      assertEqual(player.getBaseStats().hp, 90, 'Player HP should increase after healing');
      player.takeDamage(100);
      assertEqual(player.getBaseStats().hp, 0, 'Player HP should not go below 0');
      player.heal(50);
      assertEqual(player.getBaseStats().hp, 50, 'Player HP should heal from 0');
      player.heal(200);
      assertEqual(player.getBaseStats().hp, player.getBaseStats().maxHp, 'Player HP should not exceed max HP');
    });

    testWithBeforeEach('Player useEnergy and restoreEnergy', () => {
      assertTrue(player.useEnergy(10), 'Should be able to use energy');
      assertEqual(player.getBaseStats().energy, 40, 'Player energy should decrease');
      assertFalse(player.useEnergy(100), 'Should not be able to use more energy than available');
      assertEqual(player.getBaseStats().energy, 40, 'Player energy should not change if not enough');
      player.restoreEnergy(20);
      assertEqual(player.getBaseStats().energy, 50, 'Player energy should restore');
      player.restoreEnergy(100);
      assertEqual(player.getBaseStats().energy, player.getBaseStats().maxEnergy, 'Player energy should not exceed max energy');
    });

    testWithBeforeEach('Player addExperience and levelUp', () => {
      const initialMaxHp = player.getBaseStats().maxHp;
      const initialMaxEnergy = player.getBaseStats().maxEnergy;
      const initialLevel = player.getBaseStats().level;

      player.addExperience(99);
      assertEqual(player.getBaseStats().exp, 99, 'Player EXP should increase');
      assertEqual(player.getBaseStats().level, initialLevel, 'Player level should not change yet');

      player.addExperience(1); // Total 100 EXP, should level up
      assertEqual(player.getBaseStats().level, initialLevel + 1, 'Player should level up');
      assertEqual(player.getBaseStats().exp, 0, 'Player EXP should reset after level up');
      assertEqual(player.getBaseStats().maxHp, initialMaxHp + 10, 'Player max HP should increase on level up');
      assertEqual(player.getBaseStats().maxEnergy, initialMaxEnergy + 5, 'Player max energy should increase on level up');
      assertEqual(player.getBaseStats().hp, player.getBaseStats().maxHp, 'Player HP should be full after level up');
      assertEqual(player.getBaseStats().energy, player.getBaseStats().maxEnergy, 'Player energy should be full after level up');
      assertEqual(player.talentPoints, 3, 'Player should gain 3 talent points on level up');

      player.addExperience(150); // Level 2, needs 200 for Level 3. Has 150.
      assertEqual(player.getBaseStats().exp, 150, 'Player EXP should carry over');
      assertEqual(player.getBaseStats().level, initialLevel + 1, 'Player level should not change again yet');

      player.addExperience(50); // Total 200 EXP, should level up to 3
      assertEqual(player.getBaseStats().level, initialLevel + 2, 'Player should level up again');
      assertEqual(player.talentPoints, 6, 'Player should gain another 3 talent points');
    });

    testWithBeforeEach('Player inventory management', () => {
      const potion = Item.createItem(ItemVariant.HealthPotion);
      const sword = Item.createItem(ItemVariant.RustySword);

      player.addItem(potion);
      assertEqual(player.inventory.length, 1, 'Inventory should have 1 item');
      assertTrue(player.hasItem(potion.id), 'Player should have the potion');

      player.addItem(sword);
      assertEqual(player.inventory.length, 2, 'Inventory should have 2 items');

      const removedPotion = player.removeItem(potion.id);
      assertEqual(player.inventory.length, 1, 'Inventory should have 1 item after removal');
      assertEqual(removedPotion?.id, potion.id, 'Removed item should be the potion');
      assertFalse(player.hasItem(potion.id), 'Player should no longer have the potion');

      const nonExistentItem = player.removeItem('non_existent');
      assertEqual(nonExistentItem, undefined, 'Removing non-existent item should return undefined');
      assertEqual(player.inventory.length, 1, 'Inventory count should not change for non-existent item removal');
    });

    testWithBeforeEach('Player gold management', () => {
      player.addGold(50);
      assertEqual(player.gold, 150, 'Player gold should increase');
      assertTrue(player.removeGold(75), 'Should be able to remove gold');
      assertEqual(player.gold, 75, 'Player gold should decrease');
      assertFalse(player.removeGold(100), 'Should not be able to remove more gold than available');
      assertEqual(player.gold, 75, 'Player gold should not change if not enough');
      assertTrue(player.removeGold(75), 'Should be able to remove all gold');
      assertEqual(player.gold, 0, 'Player gold should be 0');
    });

    testWithBeforeEach('Player ability learning', () => {
      const initialAbilityCount = player.abilities.length;
      const newAbility: Ability = {
        id: 'new_skill',
        name: 'New Skill',
        description: 'A brand new skill.',
        type: 'attack',
        cost: 10,
        effect: { damage: 20, target: 'singleEnemy' },
      };

      player.learnAbility(newAbility);
      assertEqual(player.abilities.length, initialAbilityCount + 1, 'Player should learn a new ability');
      assertTrue(player.abilities.some(a => a.id === 'new_skill'), 'New ability should be in the list');

      player.learnAbility(newAbility); // Try to learn again
      assertEqual(player.abilities.length, initialAbilityCount + 1, 'Player should not learn the same ability twice');
    });

    testWithBeforeEach('Player equipment management and stats calculation', () => {
      const initialAttack = player.stats.attack;
      const initialDefense = player.stats.defense;
      const initialSpeed = player.stats.speed;

      const rustySword = Item.createItem(ItemVariant.RustySword); // Attack +5
      const basicShield = Item.createItem(ItemVariant.BasicShield); // Defense +5
      const speedRing = Item.createItem(ItemVariant.SpeedRing); // Speed +5
      const debuggerBlade = Item.createItem(ItemVariant.DebuggerBlade); // Attack +10, Speed +2

      player.addItem(rustySword);
      player.addItem(basicShield);
      player.addItem(speedRing);
      player.addItem(debuggerBlade);

      // Equip Rusty Sword
      player.equip(rustySword);
      assertEqual(player.weaponSlot?.id, rustySword.id, 'Rusty Sword should be equipped');
      assertEqual(player.inventory.length, 3, 'Inventory should decrease after equipping');
      assertEqual(player.stats.attack, initialAttack + 5, 'Attack should increase with Rusty Sword');
      assertEqual(player.stats.defense, initialDefense, 'Defense should not change');
      assertEqual(player.stats.speed, initialSpeed, 'Speed should not change');
      assertEqual(player.getEquippedItems().length, 1, 'Should have 1 equipped item');

      // Equip Basic Shield
      player.equip(basicShield);
      assertEqual(player.armorSlot?.id, basicShield.id, 'Basic Shield should be equipped');
      assertEqual(player.inventory.length, 2, 'Inventory should decrease further');
      assertEqual(player.stats.defense, initialDefense + 5, 'Defense should increase with Basic Shield');
      assertEqual(player.getEquippedItems().length, 2, 'Should have 2 equipped items');

      // Equip Speed Ring
      player.equip(speedRing);
      assertEqual(player.accessorySlot?.id, speedRing.id, 'Speed Ring should be equipped');
      assertEqual(player.inventory.length, 1, 'Inventory should decrease further');
      assertEqual(player.stats.speed, initialSpeed + 5, 'Speed should increase with Speed Ring');
      assertEqual(player.getEquippedItems().length, 3, 'Should have 3 equipped items');

      // Equip Debugger Blade (replaces Rusty Sword)
      player.equip(debuggerBlade);
      assertEqual(player.weaponSlot?.id, debuggerBlade.id, 'Debugger Blade should replace Rusty Sword');
      assertEqual(player.inventory.length, 1, 'Inventory should contain the unequipped Rusty Sword');
      assertTrue(player.hasItem(rustySword.id), 'Rusty Sword should be back in inventory');
      assertEqual(player.stats.attack, initialAttack + 10, 'Attack should update with Debugger Blade');
      assertEqual(player.stats.speed, initialSpeed + 5 + 2, 'Speed should update with Debugger Blade'); // Speed Ring + Debugger Blade

      // Unequip Armor
      const unequippedArmor = player.unequip('armor');
      assertEqual(player.armorSlot, undefined, 'Armor slot should be empty');
      assertEqual(unequippedArmor?.id, basicShield.id, 'Unequipped item should be Basic Shield');
      assertEqual(player.inventory.length, 2, 'Inventory should increase after unequipping');
      assertTrue(player.hasItem(basicShield.id), 'Basic Shield should be back in inventory');
      assertEqual(player.stats.defense, initialDefense, 'Defense should revert after unequipping');
      assertEqual(player.getEquippedItems().length, 2, 'Should have 2 equipped items');

      // Try to unequip an empty slot
      const unequippedEmpty = player.unequip('armor');
      assertEqual(unequippedEmpty, undefined, 'Unequipping empty slot should return undefined');
      assertEqual(player.inventory.length, 2, 'Inventory count should not change for empty unequip');
    });

    testWithBeforeEach('Player talent tree investment and reset', () => {
      player.addExperience(100); // Level up to 2, gain 3 talent points
      assertEqual(player.talentPoints, 3, 'Player should have 3 talent points after level up');

      const hpTalent = player.talentTree.getTalent('hp_boost');
      assert(hpTalent !== undefined, 'hp_boost talent should exist');
      if (!hpTalent) return; // Type guard

      // Invest 1 point
      assertTrue(player.spendTalentPoint('hp_boost'), 'Should be able to spend talent point');
      assertEqual(player.talentPoints, 2, 'Player talent points should decrease by 1');
      assertEqual(hpTalent.currentRank, 1, 'hp_boost rank should be 1');
      assertEqual(player.talentTree.availablePoints, 0, 'TalentTree available points should be 0 after spending'); // TalentTree's internal pool

      // Invest 2 more points to max it out
      player.spendTalentPoint('hp_boost');
      player.spendTalentPoint('hp_boost');
      assertEqual(player.talentPoints, 0, 'Player talent points should be 0');
      assertEqual(hpTalent.currentRank, 3, 'hp_boost rank should be 3 (max)');
      assertFalse(player.spendTalentPoint('hp_boost'), 'Should not be able to spend beyond max rank');
      assertEqual(player.talentPoints, 0, 'Player talent points should remain 0');

      // Reset talents
      player.resetTalents();
      assertEqual(player.talentPoints, 3, 'Player talent points should be refunded after reset');
      assertEqual(hpTalent.currentRank, 0, 'hp_boost rank should be 0 after reset');
      assertEqual(player.talentTree.availablePoints, 3, 'TalentTree available points should be refunded after reset');

      // Test spending after reset
      assertTrue(player.spendTalentPoint('hp_boost'), 'Should be able to spend talent point after reset');
      assertEqual(player.talentPoints, 2, 'Player talent points should decrease after spending post-reset');
      assertEqual(hpTalent.currentRank, 1, 'hp_boost rank should be 1 after spending post-reset');
    });
  });
}

function testEnemyModel(): void {
  suite('Enemy Model Tests', () => {
    let bug: Enemy;
    let runtimeError: Enemy;
    let syntaxError: Enemy;

    beforeEach(() => {
      bug = new Enemy('bug1', EnemyVariant.BasicBug, { x: 1, y: 1 });
      runtimeError = new Enemy('re1', EnemyVariant.RuntimeError, { x: 2, y: 2 });
      syntaxError = new Enemy('se1', EnemyVariant.SyntaxError, { x: 3, y: 3 });
    });

    testWithBeforeEach('Enemy initialization', () => {
      assertEqual(bug.name, 'Basic Bug', 'Enemy name should be correct');
      assertEqual(bug.type, 'bug', 'Enemy type should be correct');
      assertEqual(bug.stats.hp, 25, 'Enemy HP should be initialized');
      assertEqual(bug.expReward, 10, 'Enemy EXP reward should be correct');
      assertTrue(bug.abilities.length > 0, 'Enemy should have abilities');
    });

    testWithBeforeEach('Enemy takeDamage', () => {
      bug.takeDamage(10);
      assertEqual(bug.stats.hp, 15, 'Enemy HP should decrease after damage');
      bug.takeDamage(20);
      assertEqual(bug.stats.hp, 0, 'Enemy HP should not go below 0');
    });

    testWithBeforeEach('Enemy calculateDamageOutput', () => {
      const playerDefense = 5;
      const bugBite = bug.getAbility('bug_bite');
      assert(bugBite !== undefined, 'Bug Bite ability should exist');
      if (!bugBite) return;

      const damage = bug.calculateDamageOutput(bugBite, playerDefense);
      // Base damage: Enemy Attack (6) + Ability Damage (4) = 10
      // Final damage: 10 - Player Defense (5) = 5
      assertEqual(damage, 5, 'Calculated damage should be correct');

      // Test with an ability that does no direct damage
      const systemOverload: Ability = {
        id: 'system_overload',
        name: 'System Overload',
        description: 'Boosts own attack for a few turns.',
        type: 'buff',
        cost: 10,
        effect: { target: 'self', duration: 2 },
      };
      assertEqual(bug.calculateDamageOutput(systemOverload, playerDefense), 0, 'Non-damaging ability should return 0 damage');
    });

    testWithBeforeEach('Enemy useAbility', () => {
      const initialEnergy = runtimeError.stats.energy;
      const crashProgram = runtimeError.getAbility('crash_program'); // Cost 15
      assert(crashProgram !== undefined, 'Crash Program ability should exist');
      if (!crashProgram) return;

      assertTrue(runtimeError.useAbility(crashProgram), 'Should be able to use ability with enough energy');
      assertEqual(runtimeError.stats.energy, initialEnergy - crashProgram.cost, 'Energy should decrease after using ability');

      // Set energy to less than ability cost to test insufficient energy
      runtimeError.stats.energy = crashProgram.cost - 1;
      assertFalse(runtimeError.useAbility(crashProgram), 'Should not be able to use ability without enough energy');
      assertEqual(runtimeError.stats.energy, crashProgram.cost - 1, 'Energy should not change if not enough');
    });

    testWithBeforeEach('Enemy applyStatusEffect and updateStatusEffects', () => {
      assertEqual(syntaxError.statusEffects.length, 0, 'Enemy should start with no status effects');

      const corruptedEffect: StatusEffect = { type: 'corrupted', duration: 2, damagePerTurn: 5 };
      syntaxError.applyStatusEffect(corruptedEffect);
      assertEqual(syntaxError.statusEffects.length, 1, 'Should have 1 status effect');
      assertEqual(syntaxError.statusEffects[0].type, 'corrupted', 'Status effect type should be corrupted');
      assertEqual(syntaxError.statusEffects[0].duration, 2, 'Status effect duration should be 2');

      const initialHp = syntaxError.stats.hp;
      let logs = syntaxError.updateStatusEffects(); // Turn 1: duration becomes 1, takes damage
      assertEqual(syntaxError.stats.hp, initialHp - 5, 'Enemy should take damage from corrupted effect');
      assertEqual(syntaxError.statusEffects[0].duration, 1, 'Status effect duration should decrement');
      assertTrue(logs.some(log => log.includes('takes 5 corrupted damage!')), 'Log should indicate damage');

      const newCorruptedEffect: StatusEffect = { type: 'corrupted', duration: 3, damagePerTurn: 7 };
      syntaxError.applyStatusEffect(newCorruptedEffect); // Apply same type, should refresh/update
      assertEqual(syntaxError.statusEffects.length, 1, 'Should still have 1 status effect (refreshed)');
      assertEqual(syntaxError.statusEffects[0].duration, 3, 'Corrupted effect duration should be refreshed to 3');
      assertEqual(syntaxError.statusEffects[0].damagePerTurn, 7, 'Corrupted effect damagePerTurn should be updated');

      logs = syntaxError.updateStatusEffects(); // Turn 2: duration becomes 2, takes 7 damage
      assertEqual(syntaxError.stats.hp, initialHp - 5 - 7, 'Enemy should take updated damage');
      assertEqual(syntaxError.statusEffects[0].duration, 2, 'Status effect duration should decrement');

      logs = syntaxError.updateStatusEffects(); // Turn 3: duration becomes 1, takes 7 damage
      assertEqual(syntaxError.stats.hp, initialHp - 5 - 7 - 7, 'Enemy should take damage again');
      assertEqual(syntaxError.statusEffects[0].duration, 1, 'Status effect duration should decrement');

      logs = syntaxError.updateStatusEffects(); // Turn 4: duration becomes 0, takes 7 damage, then removed
      assertEqual(syntaxError.stats.hp, initialHp - 5 - 7 - 7 - 7, 'Enemy should take final damage');
      assertEqual(syntaxError.statusEffects.length, 0, 'Status effect should be removed after duration ends');
      assertTrue(logs.some(log => log.includes('no longer corrupted')), 'Log should indicate effect removal');
    });

    testWithBeforeEach('Enemy chooseAction - damaging abilities', () => {
      const player = new Player('p1', 'Claude', { x: 0, y: 0 });
      const battleState: BattleState = { player: player, enemies: [runtimeError], combatLog: [] };

      // Ensure enough energy for Crash Program (cost 15, damage 16) and Runtime Strike (cost 0, damage 6)
      runtimeError.stats.energy = 20;
      const action = runtimeError.chooseAction(battleState);
      assert(action !== null, 'Enemy should choose an action');
      assertEqual(action?.ability.id, 'crash_program', 'Enemy should prioritize higher damage ability (Crash Program)');
      assertEqual(action?.targetId, player.id, 'Target should be the player');

      runtimeError.stats.energy = 0; // No energy for Crash Program
      const action2 = runtimeError.chooseAction(battleState);
      assert(action2 !== null, 'Enemy should choose an action even with low energy if 0-cost available');
      assertEqual(action2?.ability.id, 'runtime_strike', 'Enemy should choose 0-cost ability if no energy for others');
    });

    testWithBeforeEach('Enemy chooseAction - utility abilities', () => {
      const player = new Player('p1', 'Claude', { x: 0, y: 0 });
      const battleState: BattleState = { player: player, enemies: [runtimeError], combatLog: [] };

      // Remove damaging abilities, leave only System Overload (buff, cost 10)
      runtimeError.abilities = runtimeError.abilities.filter(a => a.type !== 'attack');
      runtimeError.stats.energy = 15;

      const action = runtimeError.chooseAction(battleState);
      assert(action !== null, 'Enemy should choose a utility action');
      assertEqual(action?.ability.id, 'system_overload', 'Enemy should choose utility ability if no damaging ones');
      assertEqual(action?.targetId, runtimeError.id, 'Self-targeting ability should target self');
    });

    testWithBeforeEach('Enemy chooseAction - no action possible', () => {
      const player = new Player('p1', 'Claude', { x: 0, y: 0 });
      const battleState: BattleState = { player: player, enemies: [runtimeError], combatLog: [] };

      // Remove all abilities
      runtimeError.abilities = [];
      const action = runtimeError.chooseAction(battleState);
      assertEqual(action, null, 'Enemy should choose no action if no abilities are available');

      // Test with no 0-cost abilities available
      // Remove all 0-cost abilities
      runtimeError.abilities = Enemy.ENEMY_DATA[EnemyVariant.RuntimeError].abilities.filter(a => a.cost > 0);
      runtimeError.stats.energy = 0;
      const action2 = runtimeError.chooseAction(battleState);
      assertEqual(action2, null, 'Enemy should choose no action if not enough energy for any ability');
    });
  });
}

function testItemModel(): void {
  suite('Item Model Tests', () => {
    let player: Player;

    beforeEach(() => {
      player = new Player('p1', 'Claude', { x: 0, y: 0 });
    });

    testWithBeforeEach('Item creation', () => {
      const potion = Item.createItem(ItemVariant.HealthPotion, { x: 5, y: 5 });
      assertEqual(potion.id, 'health_potion', 'Potion ID should be correct');
      assertEqual(potion.name, 'Health Potion', 'Potion name should be correct');
      assertEqual(potion.type, 'consumable', 'Potion type should be consumable');
      assertEqual(potion.position?.x, 5, 'Potion X position should be correct');
      assertEqual(potion.effect, 'restoreHp', 'Potion effect should be restoreHp');
      assertEqual(potion.value, 30, 'Potion value should be 30');

      const sword = Item.createItem(ItemVariant.RustySword);
      assertEqual(sword.type, 'equipment', 'Sword type should be equipment');
      assertEqual(sword.equipmentSlotType, 'weapon', 'Sword equipment slot type should be weapon');
      assertEqual(sword.stats?.attack, 5, 'Sword attack stats should be 5');
      assertEqual(sword.position, undefined, 'Sword position should be undefined if not set');

      const key = Item.createItem(ItemVariant.CompilerKey);
      assertEqual(key.type, 'key', 'Key type should be key');
      assertEqual(key.targetId, 'area_compiler_room_entrance', 'Key target ID should be correct');

      assertThrows(() => Item.createItem('non_existent_variant' as ItemVariant), 'Creating item with non-existent variant should throw error');
    });

    testWithBeforeEach('Item use - consumables', () => {
      const healthPotion = Item.createItem(ItemVariant.HealthPotion);
      const energyDrink = Item.createItem(ItemVariant.EnergyDrink);
      const ultraPotion = Item.createItem(ItemVariant.UltraPotion);

      // Test Health Potion
      player.takeDamage(50);
      let result = healthPotion.use(player);
      assertTrue(result.success, 'Health Potion should be usable when not full HP');
      player.heal(healthPotion.value!); // Simulate effect application by BattleSystem/GameEngine
      assertEqual(player.getBaseStats().hp, 100 - 50 + 30, 'Player HP should increase after using health potion');

      player.heal(100); // Max HP
      result = healthPotion.use(player);
      assertFalse(result.success, 'Health Potion should not be usable when at full HP');
      assertEqual(player.getBaseStats().hp, player.getBaseStats().maxHp, 'Player HP should remain max HP');

      // Test Energy Drink
      player.useEnergy(30);
      result = energyDrink.use(player);
      assertTrue(result.success, 'Energy Drink should be usable when not full energy');
      player.restoreEnergy(energyDrink.value!); // Simulate effect application
      assertEqual(player.getBaseStats().energy, 50, 'Player energy should increase after using energy drink');

      player.restoreEnergy(100); // Max Energy
      result = energyDrink.use(player);
      assertFalse(result.success, 'Energy Drink should not be usable when at full energy');
      assertEqual(player.getBaseStats().energy, player.getBaseStats().maxEnergy, 'Player energy should remain max energy');

      // Test Ultra Potion (full restore)
      player.takeDamage(90);
      player.useEnergy(40);
      result = ultraPotion.use(player);
      assertTrue(result.success, 'Ultra Potion should be usable when not full HP');
      // For Ultra Potion, value is 999, which means it should heal to max.
      player.heal(player.getBaseStats().maxHp); // Simulate full heal
      assertEqual(player.getBaseStats().hp, player.getBaseStats().maxHp, 'Ultra Potion should restore HP to max');
    });

    testWithBeforeEach('Item use - non-consumables', () => {
      const questItem = Item.createItem(ItemVariant.CodeFragment);
      const keyItem = Item.createItem(ItemVariant.CompilerKey);
      const equipmentItem = Item.createItem(ItemVariant.DebuggerBlade);

      let result = questItem.use(player);
      assertFalse(result.success, 'Quest item should not be usable directly');
      assertTrue(result.message.includes('important for a quest'), 'Quest item message should be informative');

      result = keyItem.use(player);
      assertFalse(result.success, 'Key item should not be usable directly');
      assertTrue(result.message.includes('needs to be used at the right location'), 'Key item message should be informative');

      result = equipmentItem.use(player);
      assertFalse(result.success, 'Equipment item should not be usable directly');
      assertTrue(result.message.includes('need to equip it, not use it directly'), 'Equipment item message should be informative');
    });
  });
}

function testGameMapModel(): void {
  suite('GameMap Model Tests', () => {
    testWithBeforeEach('GameMap initialization', () => {
      const mapData = {
        id: 'test_map',
        name: 'Test Map',
        width: 3,
        height: 3,
        tiles: [
          [{ type: 'grass', walkable: true }, { type: 'wall', walkable: false }, { type: 'grass', walkable: true }],
          [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }],
          [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }],
        ],
        entities: [],
        exits: [{ position: { x: 2, y: 2 }, targetMapId: 'next_map', targetPosition: { x: 0, y: 0 } }],
      };
      const gameMap = new GameMap(mapData);

      assertEqual(gameMap.id, 'test_map', 'Map ID should be correct');
      assertEqual(gameMap.name, 'Test Map', 'Map name should be correct');
      assertEqual(gameMap.width, 3, 'Map width should be correct');
      assertEqual(gameMap.height, 3, 'Map height should be correct');
      assertEqual(gameMap.tiles[0][1].type, 'wall', 'Tile type at [0,1] should be wall');
      assertFalse(gameMap.tiles[0][1].walkable, 'Wall tile should not be walkable');
      assertEqual(gameMap.exits.length, 1, 'Map should have 1 exit');
      assertEqual(gameMap.exits[0].targetMapId, 'next_map', 'Exit target map ID should be correct');
      assertEqual(gameMap.entities.length, 0, 'Map should have 0 entities initially');
    });

    testWithBeforeEach('GameMap with entities', () => {
      const enemy = new Enemy('bug1', EnemyVariant.BasicBug, { x: 1, y: 1 });
      const npc: NPC = { id: 'npc1', name: 'Villager', position: { x: 0, y: 0 }, dialogueId: 'villager_dialogue', role: 'villager' };
      const item = Item.createItem(ItemVariant.HealthPotion, { x: 2, y: 0 });

      const mapData = {
        id: 'test_map_entities',
        name: 'Test Map with Entities',
        width: 3,
        height: 3,
        tiles: [[{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }], [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }], [{ type: 'grass', walkable: true }, { type: 'grass', walkable: true }, { type: 'grass', walkable: true }]],
        entities: [enemy, npc, item],
        exits: [],
      };
      const gameMap = new GameMap(mapData);

      assertEqual(gameMap.entities.length, 3, 'Map should have 3 entities');
      assertTrue(gameMap.entities.some(e => (e as Enemy).id === 'bug1'), 'Enemy should be in entities');
      assertTrue(gameMap.entities.some(e => (e as NPC).id === 'npc1'), 'NPC should be in entities');
      assertTrue(gameMap.entities.some(e => (e as Item).id === 'health_potion'), 'Item should be in entities');
    });
  });
}

function testTalentTree(): void {
  suite('Talent Tree Tests', () => {
    let talentTree: TalentTree;
    let hpBoostTalent: Talent;
    let atkBoostTalent: Talent;
    let defBoostTalent: Talent;
    let prereqTalent: Talent;
    let dependentTalent: Talent;

    beforeEach(() => {
      talentTree = new TalentTree();
      hpBoostTalent = talentTree.getTalent('hp_boost')!;
      atkBoostTalent = talentTree.getTalent('attack_boost')!;
      defBoostTalent = talentTree.getTalent('defense_boost')!;
      prereqTalent = talentTree.getTalent('prerequisite_talent')!;
      dependentTalent = talentTree.getTalent('dependent_talent')!;
    });

    testWithBeforeEach('TalentTree initialization', () => {
      assertEqual(talentTree.availablePoints, 0, 'Initial available points should be 0');
      assertEqual(hpBoostTalent.currentRank, 0, 'Initial talent rank should be 0');
      assertEqual(hpBoostTalent.maxRank, 3, 'hp_boost max rank should be 3');
      assertEqual(hpBoostTalent.prerequisites.length, 0, 'hp_boost should have no prerequisites');
    });

    testWithBeforeEach('Invest point successfully', () => {
      talentTree.addPoints(1);
      assertTrue(talentTree.investPoint('hp_boost'), 'Should be able to invest point');
      assertEqual(talentTree.availablePoints, 0, 'Available points should decrease');
      assertEqual(hpBoostTalent.currentRank, 1, 'Talent rank should increase');
    });

    testWithBeforeEach('Invest point beyond max rank', () => {
      talentTree.addPoints(3);
      talentTree.investPoint('hp_boost'); // Rank 1
      talentTree.investPoint('hp_boost'); // Rank 2
      talentTree.investPoint('hp_boost'); // Rank 3 (max)
      assertEqual(hpBoostTalent.currentRank, 3, 'Talent rank should be at max');
      assertEqual(talentTree.availablePoints, 0, 'Available points should be 0');

      assertFalse(talentTree.investPoint('hp_boost'), 'Should not be able to invest beyond max rank');
      assertEqual(hpBoostTalent.currentRank, 3, 'Talent rank should remain at max');
      assertEqual(talentTree.availablePoints, 0, 'Available points should not change');
    });

    testWithBeforeEach('Invest point with insufficient points', () => {
      assertEqual(talentTree.availablePoints, 0, 'No points initially');
      assertFalse(talentTree.investPoint('hp_boost'), 'Should not be able to invest with 0 points');
      assertEqual(hpBoostTalent.currentRank, 0, 'Talent rank should remain 0');
    });

    testWithBeforeEach('Invest point with prerequisites', () => {
      talentTree.addPoints(1);
      assertFalse(talentTree.investPoint('dependent_talent'), 'Should not invest without prerequisite');
      assertEqual(dependentTalent.currentRank, 0, 'Dependent talent rank should remain 0');
      assertEqual(talentTree.availablePoints, 1, 'Points should not be spent');

      talentTree.investPoint('prerequisite_talent'); // Spend point on prerequisite
      assertEqual(prereqTalent.currentRank, 1, 'Prerequisite talent rank should be 1');
      assertEqual(talentTree.availablePoints, 0, 'Points should be spent on prerequisite');

      talentTree.addPoints(1); // Add another point for dependent talent
      assertTrue(talentTree.investPoint('dependent_talent'), 'Should invest after prerequisite met');
      assertEqual(dependentTalent.currentRank, 1, 'Dependent talent rank should be 1');
      assertEqual(talentTree.availablePoints, 0, 'Points should be spent');
    });

    testWithBeforeEach('Reset talents', () => {
      talentTree.addPoints(5);
      talentTree.investPoint('hp_boost'); // Rank 1
      talentTree.investPoint('attack_boost'); // Rank 1
      talentTree.investPoint('hp_boost'); // Rank 2
      assertEqual(hpBoostTalent.currentRank, 2, 'hp_boost rank should be 2');
      assertEqual(atkBoostTalent.currentRank, 1, 'attack_boost rank should be 1');
      assertEqual(talentTree.availablePoints, 2, 'Available points should be 2'); // 5 - 2 - 1 = 2

      talentTree.resetTalents();
      assertEqual(hpBoostTalent.currentRank, 0, 'hp_boost rank should be 0 after reset');
      assertEqual(atkBoostTalent.currentRank, 0, 'attack_boost rank should be 0 after reset');
      assertEqual(talentTree.availablePoints, 5, 'All points should be refunded after reset');
    });

    testWithBeforeEach('Get talent by ID', () => {
      const talent = talentTree.getTalent('hp_boost');
      assert(talent !== undefined, 'Should retrieve hp_boost talent');
      assertEqual(talent?.id, 'hp_boost', 'Retrieved talent ID should match');
      assertEqual(talentTree.getTalent('non_existent'), undefined, 'Should return undefined for non-existent talent');
    });

    testWithBeforeEach('Get all talents', () => {
      const allTalents = talentTree.getAllTalents();
      assertTrue(allTalents.size > 0, 'Should return a map of talents');
      assertTrue(allTalents.has('hp_boost'), 'Map should contain hp_boost');
      assertTrue(allTalents.has('attack_boost'), 'Map should contain attack_boost');
    });
  });
}

function testQuestManager(): void {
  suite('Quest Manager Tests', () => {
    let questManager: QuestManager;
    // Define mock quests for testing
    const mockQuests: Quest[] = [
      {
        id: 'quest_start',
        name: 'The First Step',
        description: 'Talk to the Villager.',
        status: 'available',
        stages: [
          {
            id: 'talk_villager',
            description: 'Find and talk to the Villager.',
            objective: { type: 'talk_to_npc', targetId: 'villager_01', count: 1 },
            completed: false,
          },
          {
            id: 'report_back',
            description: 'Report back to the Quest Giver.',
            objective: { type: 'talk_to_npc', targetId: 'quest_giver_01', count: 1 },
            completed: false,
          },
        ],
        rewards: { exp: 50, items: [{ id: ItemVariant.HealthPotion, quantity: 1 }] },
        currentStageIndex: 0,
      },
      {
        id: 'quest_collect',
        name: 'Gather Supplies',
        description: 'Collect 3 Code Fragments.',
        status: 'available',
        stages: [
          {
            id: 'collect_fragments',
            description: 'Collect 3 Code Fragments.',
            objective: { type: 'collect_item', targetId: ItemVariant.CodeFragment, count: 3 },
            completed: false,
          },
        ],
        rewards: { exp: 75, gold: 20 },
        currentStageIndex: 0,
      },
      {
        id: 'quest_kill',
        name: 'Exterminate Bugs',
        description: 'Defeat 2 Basic Bugs.',
        status: 'available',
        stages: [
          {
            id: 'kill_bugs',
            description: 'Defeat 2 Basic Bugs.',
            objective: { type: 'defeat_enemy', targetId: EnemyVariant.BasicBug, count: 2 },
            completed: false,
          },
        ],
        rewards: { exp: 100, items: [{ id: ItemVariant.EnergyDrink, quantity: 1 }] },
        currentStageIndex: 0,
      },
      {
        id: 'quest_prereq',
        name: 'Advanced Debugging',
        description: 'Requires "The First Step" to be completed.',
        status: 'available',
        prerequisites: ['quest_start'],
        stages: [
          {
            id: 'advanced_task',
            description: 'Complete an advanced task.',
            objective: { type: 'talk_to_npc', targetId: 'advanced_npc', count: 1 },
            completed: false,
          },
        ],
        rewards: { exp: 150 },
        currentStageIndex: 0,
      },
    ];

    beforeEach(() => {
      // Reset the singleton instance for each test to ensure isolation
      (QuestManager as any)._instance = null;
      questManager = QuestManager.getInstance();
      questManager.initialize(mockQuests); // Initialize with a fresh copy of mock quests
    });

    testWithBeforeEach('QuestManager initialization and singleton', () => {
      const qm1 = QuestManager.getInstance();
      const qm2 = QuestManager.getInstance();
      assertEqual(qm1, qm2, 'QuestManager should be a singleton');
      assertEqual(questManager.getAvailableQuests().length, 4, 'Should load all mock quests as available');
      assertEqual(questManager.getActiveQuests().length, 0, 'Should have no active quests initially');
      assertEqual(questManager.getCompletedQuests().length, 0, 'Should have no completed quests initially');
    });

    testWithBeforeEach('Start quest', () => {
      const questId = 'quest_start';
      assertTrue(questManager.startQuest(questId), 'Should be able to start an available quest');
      assertEqual(questManager.getQuestStatus(questId), 'active', 'Quest status should be active');
      assertEqual(questManager.getActiveQuests().length, 1, 'Should have 1 active quest');
      assertEqual(questManager.getAvailableQuests().length, 3, 'Available quests should decrease');

      assertFalse(questManager.startQuest(questId), 'Should not be able to start an active quest again');
      assertFalse(questManager.startQuest('non_existent_quest'), 'Should not be able to start a non-existent quest');
    });

    testWithBeforeEach('Start quest with prerequisites', () => {
      const prereqQuestId = 'quest_prereq';
      assertFalse(questManager.startQuest(prereqQuestId), 'Should not start quest without prerequisites met');
      assertEqual(questManager.getQuestStatus(prereqQuestId), 'available', 'Prereq quest should remain available');

      // Complete the prerequisite quest
      questManager.startQuest('quest_start');
      questManager.updateQuestProgress('talk_to_npc', 'villager_01', 1);
      questManager.updateQuestProgress('talk_to_npc', 'quest_giver_01', 1);
      assertEqual(questManager.getQuestStatus('quest_start'), 'completed', 'Prerequisite quest should be completed');

      assertTrue(questManager.startQuest(prereqQuestId), 'Should start quest after prerequisites met');
      assertEqual(questManager.getQuestStatus(prereqQuestId), 'active', 'Prereq quest status should be active');
    });

    testWithBeforeEach('Update quest progress - talk to NPC', () => {
      const questId = 'quest_start';
      questManager.startQuest(questId);

      questManager.updateQuestProgress('talk_to_npc', 'villager_01', 1);
      assertEqual(questManager.getQuestStatus(questId), 'active', 'Quest should still be active after first stage');
      assertTrue(questManager.getActiveQuests()[0].stages[0].completed, 'First stage should be completed');
      assertEqual(questManager.getActiveQuests()[0].currentStageIndex, 1, 'Current stage index should advance');

      questManager.updateQuestProgress('talk_to_npc', 'quest_giver_01', 1);
      assertEqual(questManager.getQuestStatus(questId), 'completed', 'Quest should be completed after all stages');
      assertEqual(questManager.getCompletedQuests().length, 1, 'Should have 1 completed quest');
      assertEqual(questManager.getActiveQuests().length, 0, 'Should have no active quests');
    });

    testWithBeforeEach('Update quest progress - collect item', () => {
      const questId = 'quest_collect';
      questManager.startQuest(questId);

      questManager.updateQuestProgress('collect_item', ItemVariant.CodeFragment, 1);
      assertEqual(questManager.getQuestStatus(questId), 'active', 'Quest should still be active after 1 item');
      assertEqual(questManager.getActiveQuests()[0].stages[0].objective.currentCount, 1, 'Current count should be 1');

      questManager.updateQuestProgress('collect_item', ItemVariant.CodeFragment, 1);
      assertEqual(questManager.getActiveQuests()[0].stages[0].objective.currentCount, 2, 'Current count should be 2');

      questManager.updateQuestProgress('collect_item', ItemVariant.CodeFragment, 1);
      assertEqual(questManager.getQuestStatus(questId), 'completed', 'Quest should be completed after 3 items');
      assertTrue(questManager.getCompletedQuests()[0].stages[0].completed, 'Collect stage should be completed');
    });

    testWithBeforeEach('Update quest progress - defeat enemy', () => {
      const questId = 'quest_kill';
      questManager.startQuest(questId);

      questManager.updateQuestProgress('defeat_enemy', EnemyVariant.BasicBug, 1);
      assertEqual(questManager.getQuestStatus(questId), 'active', 'Quest should still be active after 1 enemy');
      assertEqual(questManager.getActiveQuests()[0].stages[0].objective.currentCount, 1, 'Current count should be 1');

      questManager.updateQuestProgress('defeat_enemy', EnemyVariant.BasicBug, 1);
      assertEqual(questManager.getQuestStatus(questId), 'completed', 'Quest should be completed after 2 enemies');
      assertTrue(questManager.getCompletedQuests()[0].stages[0].completed, 'Defeat stage should be completed');
    });

    testWithBeforeEach('Update quest progress - wrong target or type', () => {
      const questId = 'quest_start';
      questManager.startQuest(questId);

      questManager.updateQuestProgress('talk_to_npc', 'wrong_npc', 1);
      assertEqual(questManager.getQuestStatus(questId), 'active', 'Quest status should not change for wrong target');
      assertFalse(questManager.getActiveQuests()[0].stages[0].completed, 'Stage should not be completed for wrong target');

      questManager.updateQuestProgress('collect_item', ItemVariant.CodeFragment, 1); // Wrong type for this quest
      assertEqual(questManager.getQuestStatus(questId), 'active', 'Quest status should not change for wrong type');
      assertFalse(questManager.getActiveQuests()[0].stages[0].completed, 'Stage should not be completed for wrong type');
    });

    testWithBeforeEach('Get quest by ID', () => {
      const quest = questManager.getQuestById('quest_start');
      assert(quest !== undefined, 'Should retrieve quest_start');
      assertEqual(quest?.name, 'The First Step', 'Retrieved quest name should match');
      assertEqual(questManager.getQuestById('non_existent'), undefined, 'Should return undefined for non-existent quest');
    });

    testWithBeforeEach('Serialization and Deserialization', () => {
      questManager.startQuest('quest_start');
      questManager.updateQuestProgress('talk_to_npc', 'villager_01', 1);
      questManager.startQuest('quest_collect');
      questManager.updateQuestProgress('collect_item', ItemVariant.CodeFragment, 1);

      const serializedState = questManager.serialize();
      (QuestManager as any)._instance = null; // Clear singleton for deserialization test
      const newQuestManager = QuestManager.getInstance();
      newQuestManager.deserialize(serializedState, mockQuests); // Pass mockQuests for re-initialization

      assertEqual(newQuestManager.getActiveQuests().length, 2, 'Deserialized manager should have 2 active quests');
      assertEqual(newQuestManager.getQuestStatus('quest_start'), 'active', 'Deserialized quest_start should be active');
      assertTrue(newQuestManager.getQuestById('quest_start')?.stages[0].completed, 'Deserialized quest_start first stage should be completed');
      assertEqual(newQuestManager.getQuestById('quest_collect')?.stages[0].objective.currentCount, 1, 'Deserialized quest_collect count should be 1');
    });
  });
}

// Shop model doesn't exist, commenting out tests
/*
function testShop(): void {
  suite('Shop Tests', () => {
    let shop: Shop;
    let player: Player;
    const shopItems = [
      Item.createItem(ItemVariant.HealthPotion),
      Item.createItem(ItemVariant.RustySword),
      Item.createItem(ItemVariant.EnergyDrink),
    ];
    const itemPrices = {
      [ItemVariant.HealthPotion]: 10,
      [ItemVariant.RustySword]: 50,
      [ItemVariant.EnergyDrink]: 15,
      [ItemVariant.CodeFragment]: 0, // Item with no buy price
    };
    const sellPrices = {
      [ItemVariant.HealthPotion]: 5,
      [ItemVariant.RustySword]: 25,
      [ItemVariant.EnergyDrink]: 7,
      [ItemVariant.CodeFragment]: undefined, // Item with no sell price
    };

    beforeEach(() => {
      player = new Player('p1', 'Claude', { x: 0, y: 0 });
      player.gold = 100; // Starting gold for tests
      shop = new Shop(shopItems, itemPrices, sellPrices);
    });

    testWithBeforeEach('Shop initialization', () => {
      assertEqual(shop.getShopInventory().length, 3, 'Shop should have 3 items');
      assertEqual(shop.getItemPrice(ItemVariant.HealthPotion), 10, 'Health Potion price should be 10');
      assertEqual(shop.getItemSellPrice(ItemVariant.HealthPotion), 5, 'Health Potion sell price should be 5');
      assertEqual(shop.getItemPrice(ItemVariant.CodeFragment), 0, 'Item with no buy price should return 0');
      assertEqual(shop.getItemSellPrice(ItemVariant.CodeFragment), undefined, 'Item with no sell price should return undefined');
    });

    testWithBeforeEach('Buy item - success', () => {
      const initialPlayerGold = player.gold;
      const initialPlayerInventoryCount = player.inventory.length;
      const healthPotion = shopItems[0]; // Health Potion

      const success = shop.buyItem(player, healthPotion.id);
      assertTrue(success, 'Should successfully buy Health Potion');
      assertEqual(player.gold, initialPlayerGold - itemPrices[ItemVariant.HealthPotion], 'Player gold should decrease');
      assertEqual(player.inventory.length, initialPlayerInventoryCount + 1, 'Player inventory should increase');
      assertTrue(player.hasItem(healthPotion.id), 'Player should have Health Potion');
      assertEqual(shop.getShopInventory().length, 2, 'Shop inventory should decrease'); // Assuming shop removes item
      assertFalse(shop.getShopInventory().some(i => i.id === healthPotion.id), 'Health Potion should be removed from shop');
    });

    testWithBeforeEach('Buy item - insufficient gold', () => {
      player.gold = 5; // Not enough for Health Potion (10)
      const initialPlayerGold = player.gold;
      const initialPlayerInventoryCount = player.inventory.length;
      const healthPotion = shopItems[0];

      const success = shop.buyItem(player, healthPotion.id);
      assertFalse(success, 'Should not buy Health Potion with insufficient gold');
      assertEqual(player.gold, initialPlayerGold, 'Player gold should not change');
      assertEqual(player.inventory.length, initialPlayerInventoryCount, 'Player inventory should not change');
      assertTrue(shop.getShopInventory().some(i => i.id === healthPotion.id), 'Health Potion should remain in shop');
    });

    testWithBeforeEach('Buy item - item not in shop', () => {
      const initialPlayerGold = player.gold;
      const initialPlayerInventoryCount = player.inventory.length;

      const success = shop.buyItem(player, 'non_existent_item');
      assertFalse(success, 'Should not buy non-existent item');
      assertEqual(player.gold, initialPlayerGold, 'Player gold should not change');
      assertEqual(player.inventory.length, initialPlayerInventoryCount, 'Player inventory should not change');
    });

    testWithBeforeEach('Sell item - success', () => {
      const initialPlayerGold = player.gold;
      const rustySword = Item.createItem(ItemVariant.RustySword);
      player.addItem(rustySword);
      const initialPlayerInventoryCount = player.inventory.length;

      const success = shop.sellItem(player, rustySword.id);
      assertTrue(success, 'Should successfully sell Rusty Sword');
      assertEqual(player.gold, initialPlayerGold + sellPrices[ItemVariant.RustySword], 'Player gold should increase');
      assertEqual(player.inventory.length, initialPlayerInventoryCount - 1, 'Player inventory should decrease');
      assertFalse(player.hasItem(rustySword.id), 'Player should no longer have Rusty Sword');
    });

    testWithBeforeEach('Sell item - item not in player inventory', () => {
      const initialPlayerGold = player.gold;
      const initialPlayerInventoryCount = player.inventory.length;

      const success = shop.sellItem(player, ItemVariant.EnergyDrink); // Player doesn't have it
      assertFalse(success, 'Should not sell item not in inventory');
      assertEqual(player.gold, initialPlayerGold, 'Player gold should not change');
      assertEqual(player.inventory.length, initialPlayerInventoryCount, 'Player inventory should not change');
    });

    testWithBeforeEach('Sell item - item has no sell price', () => {
      // Create a quest item that typically has no sell price
      const codeFragment = Item.createItem(ItemVariant.CodeFragment);
      player.addItem(codeFragment);
      const initialPlayerGold = player.gold;
      const initialPlayerInventoryCount = player.inventory.length;

      const success = shop.sellItem(player, codeFragment.id);
      assertFalse(success, 'Should not sell item with no defined sell price');
      assertEqual(player.gold, initialPlayerGold, 'Player gold should not change');
      assertEqual(player.inventory.length, initialPlayerInventoryCount, 'Player inventory should not change');
      assertTrue(player.hasItem(codeFragment.id), 'Player should still have the item');
    });
  });
}
*/

function testBattleSystem(): void {
  suite('Battle System Tests', () => {
    let player: Player;
    let enemy1: Enemy;
    let enemy2: Enemy;
    let battleSystem: BattleSystem;
    let mockBattleState: BattleState;

    beforeEach(() => {
      player = new Player('p1', 'Claude', { x: 0, y: 0 });
      player.updateBaseStats({ hp: 100, maxHp: 100, energy: 50, maxEnergy: 50, attack: 10, defense: 5, speed: 10 });
      player.inventory = []; // Clear inventory for clean tests
      player.weaponSlot = undefined;
      player.armorSlot = undefined;
      player.accessorySlot = undefined;

      enemy1 = new Enemy('bug1', EnemyVariant.BasicBug, { x: 1, y: 1 });
      enemy1.stats = { hp: 25, maxHp: 25, energy: 10, maxEnergy: 10, attack: 6, defense: 3, speed: 7 };
      enemy2 = new Enemy('bug2', EnemyVariant.BasicBug, { x: 2, y: 2 });
      enemy2.stats = { hp: 20, maxHp: 20, energy: 10, maxEnergy: 10, attack: 5, defense: 2, speed: 8 };

      mockBattleState = {
        player: player,
        enemies: [enemy1, enemy2],
        combatLog: [],
        turnOrder: [], // Will be calculated by BattleSystem
        currentTurnEntityId: '', // Will be set by BattleSystem
      };
      battleSystem = new BattleSystem(mockBattleState);
    });

    testWithBeforeEach('BattleSystem initialization and turn order', () => {
      battleSystem.startBattle();
      assertEqual(mockBattleState.turnOrder.length, 3, 'Turn order should include player and 2 enemies');
      // Player speed 10, Enemy1 speed 7, Enemy2 speed 8
      // Expected order: Player (10), Enemy2 (8), Enemy1 (7)
      assertEqual(mockBattleState.turnOrder[0].id, player.id, 'First in turn order should be player');
      assertEqual(mockBattleState.turnOrder[1].id, enemy2.id, 'Second in turn order should be enemy2');
      assertEqual(mockBattleState.turnOrder[2].id, enemy1.id, 'Third in turn order should be enemy1');
      assertEqual(mockBattleState.currentTurnEntityId, player.id, 'Current turn should start with the first entity');
    });

    testWithBeforeEach('Process player attack ability', () => {
      battleSystem.startBattle();
      const debugAbility = player.abilities.find(a => a.id === 'debug'); // Damage 15, Cost 5
      assert(debugAbility !== undefined, 'Debug ability should exist');
      if (!debugAbility) return;

      const initialEnemyHp = enemy1.stats.hp;
      const initialPlayerEnergy = player.getBaseStats().energy;

      // Simulate player's turn
      battleSystem.processPlayerAction(debugAbility, enemy1.id);

      // Expected damage: Player Attack (10) + Ability Damage (15) - Enemy Defense (3) = 22
      assertEqual(enemy1.stats.hp, initialEnemyHp - 22, 'Enemy HP should decrease by calculated damage');
      assertEqual(player.getBaseStats().energy, initialPlayerEnergy - debugAbility.cost, 'Player energy should decrease');
      assertTrue(mockBattleState.combatLog.length > 0, 'Combat log should have entries');
      assertTrue(mockBattleState.combatLog[0].message.includes('Claude uses Debug on Basic Bug'), 'Log should show player action');
      assertTrue(mockBattleState.combatLog[1].message.includes('Basic Bug takes 22 damage'), 'Log should show damage taken');
      assertTrue(mockBattleState.combatLog[2].message.includes('Basic Bug is now corrupted'), 'Log should show status effect');
    });

    testWithBeforeEach('Process player heal ability', () => {
      battleSystem.startBattle();
      player.takeDamage(50);
      const initialPlayerHp = player.getBaseStats().hp;
      const initialPlayerEnergy = player.getBaseStats().energy;
      const refactorAbility = player.abilities.find(a => a.id === 'refactor'); // Heal 30, Cost 15
      assert(refactorAbility !== undefined, 'Refactor ability should exist');
      if (!refactorAbility) return;

      battleSystem.processPlayerAction(refactorAbility, player.id);

      assertEqual(player.getBaseStats().hp, initialPlayerHp + refactorAbility.effect.heal!, 'Player HP should increase after healing');
      assertEqual(player.getBaseStats().energy, initialPlayerEnergy - refactorAbility.cost, 'Player energy should decrease');
      assertTrue(mockBattleState.combatLog.some(log => log.message.includes('Claude uses Refactor')), 'Log should show player healing');
    });

    testWithBeforeEach('Process player buff ability', () => {
      battleSystem.startBattle();
      const initialPlayerEnergy = player.getBaseStats().energy;
      const analyzeAbility = player.abilities.find(a => a.id === 'analyze'); // Buff, Cost 10
      assert(analyzeAbility !== undefined, 'Analyze ability should exist');
      if (!analyzeAbility) return;

      battleSystem.processPlayerAction(analyzeAbility, player.id);

      assertEqual(player.getBaseStats().energy, initialPlayerEnergy - analyzeAbility.cost, 'Player energy should decrease');
      assertTrue(player.statusEffects.some(se => se.type === 'optimized'), 'Player should have optimized status effect');
      assertTrue(mockBattleState.combatLog.some(log => log.message.includes('Claude uses Analyze')), 'Log should show player buffing');
    });

    testWithBeforeEach('Process enemy turn', () => {
      battleSystem.startBattle();
      // Set current turn to enemy1
      mockBattleState.currentTurnEntityId = enemy1.id;
      const initialPlayerHp = player.getBaseStats().hp;
      const initialEnemyEnergy = enemy1.stats.energy;

      battleSystem.processEnemyTurn();

      // Basic Bug uses Bug Bite (damage 4, cost 0)
      // Expected damage: Enemy Attack (6) + Ability Damage (4) - Player Defense (5) = 5
      assertEqual(player.getBaseStats().hp, initialPlayerHp - 5, 'Player HP should decrease after enemy attack');
      assertEqual(enemy1.stats.energy, initialEnemyEnergy, 'Enemy energy should not change for 0-cost ability');
      assertTrue(mockBattleState.combatLog.some(log => log.message.includes('Basic Bug uses Bug Bite on Claude')), 'Log should show enemy action');
    });

    testWithBeforeEach('Battle progression and turn cycling', () => {
      battleSystem.startBattle();
      assertEqual(mockBattleState.currentTurnEntityId, player.id, 'Turn starts with player');

      battleSystem.endTurn(); // Player ends turn
      assertEqual(mockBattleState.currentTurnEntityId, enemy2.id, 'Turn should pass to Enemy2');

      battleSystem.endTurn(); // Enemy2 ends turn
      assertEqual(mockBattleState.currentTurnEntityId, enemy1.id, 'Turn should pass to Enemy1');

      battleSystem.endTurn(); // Enemy1 ends turn
      assertEqual(mockBattleState.currentTurnEntityId, player.id, 'Turn should cycle back to player');
    });

    testWithBeforeEach('Win condition - all enemies defeated', () => {
      battleSystem.startBattle();
      const initialPlayerExp = player.getBaseStats().exp;
      const enemy1Exp = enemy1.expReward; // 10
      const enemy2Exp = enemy2.expReward; // 10

      // Defeat enemy1
      enemy1.takeDamage(enemy1.stats.hp);
      battleSystem.checkBattleEnd();
      assertEqual(mockBattleState.enemies.length, 1, 'One enemy should be defeated');
      assert(mockBattleState.battle !== null, 'Battle should still be active'); // Not ended yet

      // Defeat enemy2
      enemy2.takeDamage(enemy2.stats.hp);
      battleSystem.checkBattleEnd();
      assertEqual(mockBattleState.enemies.length, 0, 'All enemies should be defeated');
      assertEqual(mockBattleState.battle, null, 'Battle state should be null after win');
      assertEqual(player.getBaseStats().exp, initialPlayerExp + enemy1Exp + enemy2Exp, 'Player should gain EXP from all defeated enemies');
      assertTrue(mockBattleState.combatLog.some(log => log.message.includes('Battle won!')), 'Log should show battle win');
    });

    testWithBeforeEach('Lose condition - player defeated', () => {
      battleSystem.startBattle();
      player.takeDamage(player.getBaseStats().hp); // Player HP to 0
      battleSystem.checkBattleEnd();
      assertEqual(player.getBaseStats().hp, 0, 'Player HP should be 0');
      assertEqual(mockBattleState.battle, null, 'Battle state should be null after loss');
      assertTrue(mockBattleState.combatLog.some(log => log.message.includes('Battle lost!')), 'Log should show battle loss');
    });

    testWithBeforeEach('Status effects in battle', () => {
      battleSystem.startBattle();
      const corruptedEffect: StatusEffect = { type: 'corrupted', duration: 2, damagePerTurn: 5 };
      player.applyStatusEffect(corruptedEffect);
      enemy1.applyStatusEffect(corruptedEffect);

      const initialPlayerHp = player.getBaseStats().hp;
      const initialEnemy1Hp = enemy1.stats.hp;

      // Simulate turn progression to apply status effects
      battleSystem.endTurn(); // Player's turn ends, status effects update
      assertEqual(player.getBaseStats().hp, initialPlayerHp - 5, 'Player should take damage from corrupted effect');
      assertEqual(enemy1.stats.hp, initialEnemy1Hp - 5, 'Enemy should take damage from corrupted effect');
      assertTrue(player.statusEffects[0].duration === 1, 'Player status effect duration should decrement');
      assertTrue(enemy1.statusEffects[0].duration === 1, 'Enemy status effect duration should decrement');

      battleSystem.endTurn(); // Enemy2's turn ends, status effects update
      battleSystem.endTurn(); // Enemy1's turn ends, status effects update
      assertEqual(player.getBaseStats().hp, initialPlayerHp - 10, 'Player should take damage again');
      assertEqual(enemy1.stats.hp, initialEnemy1Hp - 10, 'Enemy should take damage again');
      assertEqual(player.statusEffects.length, 0, 'Player status effect should be removed');
      assertEqual(enemy1.statusEffects.length, 0, 'Enemy status effect should be removed');
    });

    testWithBeforeEach('Player cannot act if frozen', () => {
      battleSystem.startBattle();
      const frozenEffect: StatusEffect = { type: 'frozen', duration: 1 };
      player.applyStatusEffect(frozenEffect);

      const debugAbility = player.abilities.find(a => a.id === 'debug');
      assert(debugAbility !== undefined, 'Debug ability should exist');
      if (!debugAbility) return;

      const initialEnemyHp = enemy1.stats.hp;
      const initialPlayerEnergy = player.getBaseStats().energy;

      // Player's turn, but is frozen
      battleSystem.processPlayerAction(debugAbility, enemy1.id); // This should effectively do nothing

      assertEqual(enemy1.stats.hp, initialEnemyHp, 'Enemy HP should not change if player is frozen');
      assertEqual(player.getBaseStats().energy, initialPlayerEnergy, 'Player energy should not change if player is frozen');
      assertTrue(mockBattleState.combatLog.some(log => log.message.includes('Claude is frozen and cannot act!')), 'Log should indicate player is frozen');

      // End turn, frozen effect should wear off
      battleSystem.endTurn();
      assertEqual(player.statusEffects.length, 0, 'Frozen effect should be removed');
    });
  });
}

function testGameEngine(): void {
  suite('Game Engine Tests', () => {
    let player: Player;
    let currentMap: GameMap;
    let enemies: Enemy[];
    let npcs: NPC[];
    let items: Item[];

    beforeEach(() => {
      player = new Player('p1', 'Claude', { x: 2, y: 2 });
      currentMap = new GameMap(mockMapDataIndex['town_square']);
      enemies = [new Enemy('bug_on_map', EnemyVariant.BasicBug, { x: 1, y: 2 })];
      npcs = [{ id: 'villager_01', name: 'Villager', position: { x: 2, y: 1 }, dialogueId: 'npc_villager_dialogue_01', role: 'villager' }];
      items = [Item.createItem(ItemVariant.HealthPotion, { x: 3, y: 2 })];

      // Reset mock state and dispatched actions
      mockGameState = {
        player: player,
        currentMap: currentMap,
        enemies: enemies,
        npcs: npcs,
        items: items,
        dialogue: null,
        battle: null,
        gameFlags: {},
        showInventory: false,
        showQuestLog: false,
        showCharacterScreen: false,
        notification: null,
        questManagerState: null,
        hotbarConfig: [null, null, null, null, null],
      };
      dispatchedActions = []; // Clear actions for each test

      globalGameEngineInstance = new GameEngine(mockDispatch, mockGameState);
      globalGameEngineInstance.setGameState(mockGameState); // Ensure engine has the latest state
      QuestManager.getInstance().initialize([]); // Clear QuestManager state for clean tests
    });

    testWithBeforeEach('Player movement - valid move', () => {
      const initialPos = { ...player.position };
      globalGameEngineInstance!.processMovement('up');
      assertEqual(player.position.y, initialPos.y - 1, 'Player should move up');
      const moveAction = dispatchedActions.find(a => a.type === 'MOVE_PLAYER');
      assert(moveAction !== undefined, 'MOVE_PLAYER action should be dispatched');
      assertEqual(moveAction.payload.direction, 'up', 'Dispatched direction should be up');
    });

    testWithBeforeEach('Player movement - collision with wall', () => {
      // Create a map with a wall
      const mapWithWall = new GameMap(mockMapDataIndex['wall_map']);
      player.position = { x: 0, y: 0 };
      mockGameState.currentMap = mapWithWall;
      globalGameEngineInstance!.setGameState(mockGameState);
      dispatchedActions = []; // Clear actions

      globalGameEngineInstance!.processMovement('right'); // Try to move into wall at (0,1)
      assertEqual(player.position.x, 0, 'Player X position should not change due to wall');
      assertEqual(player.position.y, 0, 'Player Y position should not change due to wall');
      assertFalse(dispatchedActions.some(a => a.type === 'MOVE_PLAYER'), 'MOVE_PLAYER action should not be dispatched');
    });

    testWithBeforeEach('Player movement - collision with NPC', () => {
      player.position = { x: 2, y: 2 };
      npcs.push({ id: 'blocking_npc', name: 'Blocker', position: { x: 2, y: 1 }, dialogueId: 'some_dialogue', role: 'blocker' });
      mockGameState.npcs = npcs;
      globalGameEngineInstance!.setGameState(mockGameState);
      dispatchedActions = [];

      globalGameEngineInstance!.processMovement('up'); // Try to move into NPC at (2,1)
      assertEqual(player.position.x, 2, 'Player X position should not change due to NPC');
      assertEqual(player.position.y, 2, 'Player Y position should not change due to NPC');
      assertFalse(dispatchedActions.some(a => a.type === 'MOVE_PLAYER'), 'MOVE_PLAYER action should not be dispatched');
    });

    testWithBeforeEach('Player movement - map transition', () => {
      player.position = { x: 3, y: 2 }; // Player is at (3,2)
      currentMap.exits.push({ position: { x: 4, y: 2 }, targetMapId: 'forest_path', targetPosition: { x: 0, y: 2 } });
      mockGameState.currentMap = currentMap;
      globalGameEngineInstance!.setGameState(mockGameState);
      dispatchedActions = [];

      globalGameEngineInstance!.processMovement('right'); // Move to (4,2) which is an exit
      const updateMapAction = dispatchedActions.find(a => a.type === 'UPDATE_MAP');
      assert(updateMapAction !== undefined, 'UPDATE_MAP action should be dispatched for map transition');
      assertEqual(updateMapAction.payload.newMap.id, 'forest_path', 'New map should be forest_path');
      assertEqual(updateMapAction.payload.playerNewPosition.x, 0, 'Player new X position should be target X');
      assertEqual(updateMapAction.payload.playerNewPosition.y, 2, 'Player new Y position should be target Y');
      assertEqual(mockGameState.currentMap.id, 'forest_path', 'Game state map should be updated');
      assertEqual(mockGameState.player.position.x, 0, 'Game state player X should be updated');
      assertEqual(mockGameState.player.position.y, 2, 'Game state player Y should be updated');
      assertTrue(dispatchedActions.some(a => a.type === 'SHOW_NOTIFICATION' && a.payload.message.includes('Entering Forest Path')), 'Notification should be shown');
    });

    testWithBeforeEach('Player movement - item pickup', () => {
      player.position = { x: 2, y: 2 };
      const potionOnMap = Item.createItem(ItemVariant.HealthPotion, { x: 2, y: 1 });
      mockGameState.items = [potionOnMap];
      mockGameState.currentMap.entities.push(potionOnMap); // Add to map entities for GameEngine to find
      globalGameEngineInstance!.setGameState(mockGameState);
      dispatchedActions = [];
      player.inventory = []; // Ensure player inventory is empty

      globalGameEngineInstance!.processMovement('up'); // Move to (2,1) where potion is
      assertEqual(player.position.y, 1, 'Player should move up');
      assertTrue(player.hasItem(potionOnMap.id), 'Player should have picked up the potion');
      assertFalse(mockGameState.items.some(i => i.id === potionOnMap.id), 'Potion should be removed from map items');
      assertTrue(dispatchedActions.some(a => a.type === 'ADD_ITEM' && a.payload.item.id === potionOnMap.id), 'ADD_ITEM action should be dispatched');
      assertTrue(dispatchedActions.some(a => a.type === 'REMOVE_ITEM' && a.payload.itemId === potionOnMap.id), 'REMOVE_ITEM action should be dispatched');
      assertTrue(dispatchedActions.some(a => a.type === 'SHOW_NOTIFICATION' && a.payload.message.includes('Picked up Health Potion!')), 'Notification should be shown');
    });

    testWithBeforeEach('Player movement - enemy encounter', () => {
      player.position = { x: 2, y: 2 };
      const enemyOnMap = new Enemy('bug_on_map_2', EnemyVariant.SyntaxError, { x: 2, y: 1 });
      mockGameState.enemies = [enemyOnMap];
      mockGameState.currentMap.entities.push(enemyOnMap); // Add to map entities for GameEngine to find
      globalGameEngineInstance!.setGameState(mockGameState);
      dispatchedActions = [];

      globalGameEngineInstance!.processMovement('up'); // Move to (2,1) where enemy is
      assertEqual(player.position.y, 1, 'Player should move up');
      assertTrue(dispatchedActions.some(a => a.type === 'START_BATTLE'), 'START_BATTLE action should be dispatched');
      assertTrue(dispatchedActions.some(a => a.type === 'REMOVE_ENEMY' && a.payload.enemyId === enemyOnMap.id), 'REMOVE_ENEMY action should be dispatched');
      assertEqual(mockGameState.battle.enemies[0].id, enemyOnMap.id, 'Battle state should contain the enemy');
      assertEqual(mockGameState.enemies.length, 0, 'Enemy should be removed from map enemies');
    });

    testWithBeforeEach('Player movement - locked door without key', () => {
      player.position = { x: 1, y: 2 };
      mockGameState.currentMap = new GameMap(mockMapDataIndex['dungeon_entrance']); // Map with locked door at (1,1)
      player.inventory = []; // Ensure no key
      globalGameEngineInstance!.setGameState(mockGameState);
      dispatchedActions = [];

      globalGameEngineInstance!.processMovement('up'); // Try to move into locked door at (1,1)
      assertEqual(player.position.x, 1, 'Player X position should not change');
      assertEqual(player.position.y, 2, 'Player Y position should not change');
      assertFalse(dispatchedActions.some(a => a.type === 'MOVE_PLAYER'), 'MOVE_PLAYER action should not be dispatched');
      assertTrue(dispatchedActions.some(a => a.type === 'SHOW_NOTIFICATION' && a.payload.message.includes('You need the Boss Key')), 'Notification about locked door should be shown');
    });

    testWithBeforeEach('Player movement - locked door with key', () => {
      player.position = { x: 1, y: 2 };
      mockGameState.currentMap = new GameMap(mockMapDataIndex['dungeon_entrance']); // Map with locked door at (1,1)
      player.addItem(Item.createItem(ItemVariant.BossKey)); // Add boss key
      globalGameEngineInstance!.setGameState(mockGameState);
      dispatchedActions = [];

      globalGameEngineInstance!.processMovement('up'); // Move into locked door at (1,1)
      assertEqual(player.position.x, 1, 'Player X position should change'); // Should move through
      assertEqual(player.position.y, 1, 'Player Y position should change'); // Should move through
      assertTrue(dispatchedActions.some(a => a.type === 'MOVE_PLAYER'), 'MOVE_PLAYER action should be dispatched');
      assertTrue(dispatchedActions.some(a => a.type === 'SHOW_NOTIFICATION' && a.payload.message.includes('You used the Boss Key')), 'Notification about using key should be shown');
    });

    testWithBeforeEach('NPC interaction', () => {
      player.position = { x: 2, y: 2 };
      mockGameState.npcs = [{ id: 'villager_01', name: 'Villager', position: { x: 2, y: 1 }, dialogueId: 'npc_villager_dialogue_01', role: 'villager' }];
      globalGameEngineInstance!.setGameState(mockGameState);
      dispatchedActions = [];
      QuestManager.getInstance().initialize([]); // Clear quest manager for this test

      globalGameEngineInstance!.checkInteractions(); // Player is adjacent to NPC
      const startDialogueAction = dispatchedActions.find(a => a.type === 'START_DIALOGUE');
      assert(startDialogueAction !== undefined, 'START_DIALOGUE action should be dispatched');
      assertEqual(startDialogueAction.payload.dialogueState.speaker, 'Villager', 'Dialogue speaker should be Villager');
      assertEqual(startDialogueAction.payload.dialogueState.lines[0].text, 'Hello, adventurer!', 'First dialogue line should be correct');
      assertEqual(mockGameState.dialogue.speaker, 'Villager', 'Game state dialogue should be set');
      // Quest progress update is internal to QuestManager, but GameEngine dispatches a notification.
      assertTrue(dispatchedActions.some(a => a.type === 'SHOW_NOTIFICATION' && a.payload.message.includes('Quest progress updated')), 'Quest progress notification should be shown');
    });

    testWithBeforeEach('NPC interaction - no dialogue data', () => {
      player.position = { x: 2, y: 2 };
      mockGameState.npcs = [{ id: 'npc_no_dialogue', name: 'Silent NPC', position: { x: 2, y: 1 }, dialogueId: 'non_existent_dialogue', role: 'silent' }];
      globalGameEngineInstance!.setGameState(mockGameState);
      dispatchedActions = [];

      globalGameEngineInstance!.checkInteractions();
      assertFalse(dispatchedActions.some(a => a.type === 'START_DIALOGUE'), 'START_DIALOGUE action should not be dispatched');
      assertEqual(mockGameState.dialogue, null, 'Game state dialogue should remain null');
    });

    testWithBeforeEach('Interaction when in battle or dialogue', () => {
      player.position = { x: 2, y: 2 };
      mockGameState.npcs = [{ id: 'villager_01', name: 'Villager', position: { x: 2, y: 1 }, dialogueId: 'npc_villager_dialogue_01', role: 'villager' }];
      globalGameEngineInstance!.setGameState(mockGameState);
      dispatchedActions = [];

      // Test in battle
      mockGameState.battle = { enemies: [], player: player, combatLog: [] };
      globalGameEngineInstance!.checkInteractions();
      assertFalse(dispatchedActions.some(a => a.type === 'START_DIALOGUE'), 'Should not interact if in battle');
      mockGameState.battle = null; // Reset

      // Test in dialogue
      mockGameState.dialogue = { speaker: 'Test', lines: [], currentLineIndex: 0 };
      globalGameEngineInstance!.checkInteractions();
      assertFalse(dispatchedActions.some(a => a.type === 'START_DIALOGUE'), 'Should not interact if in dialogue');
      mockGameState.dialogue = null; // Reset
    });

    testWithBeforeEach('Keyboard input processing - movement', () => {
      player.position = { x: 2, y: 2 };
      globalGameEngineInstance!.setGameState(mockGameState);
      dispatchedActions = [];

      globalGameEngineInstance!.handleKeyboardInput(new Set(['ArrowUp']));
      globalGameEngineInstance!.update(100); // Simulate game loop update
      assertEqual(player.position.y, 1, 'Player should move up from keyboard input');
      assertTrue(dispatchedActions.some(a => a.type === 'MOVE_PLAYER' && a.payload.direction === 'up'), 'MOVE_PLAYER action dispatched');
      dispatchedActions = []; // Clear for next check

      // Test cooldown
      globalGameEngineInstance!.handleKeyboardInput(new Set(['ArrowUp']));
      globalGameEngineInstance!.update(50); // Less than cooldown
      assertEqual(player.position.y, 1, 'Player should not move again due to cooldown');
      assertFalse(dispatchedActions.some(a => a.type === 'MOVE_PLAYER'), 'No MOVE_PLAYER action dispatched due to cooldown');

      globalGameEngineInstance!.update(150); // More than cooldown
      assertEqual(player.position.y, 0, 'Player should move again after cooldown');
      assertTrue(dispatchedActions.some(a => a.type === 'MOVE_PLAYER' && a.payload.direction === 'up'), 'MOVE_PLAYER action dispatched after cooldown');
    });

    testWithBeforeEach('Keyboard input processing - interaction keys', () => {
      player.position = { x: 2, y: 2 };
      mockGameState.npcs = [{ id: 'villager_01', name: 'Villager', position: { x: 2, y: 1 }, dialogueId: 'npc_villager_dialogue_01', role: 'villager' }];
      globalGameEngineInstance!.setGameState(mockGameState);
      dispatchedActions = [];

      globalGameEngineInstance!.handleKeyboardInput(new Set(['Space']));
      globalGameEngineInstance!.update(100); // Simulate game loop update
      assertTrue(dispatchedActions.some(a => a.type === 'START_DIALOGUE'), 'START_DIALOGUE action should be dispatched via Space key');
      dispatchedActions = []; // Clear for next check

      // Test cooldown
      globalGameEngineInstance!.handleKeyboardInput(new Set(['Space']));
      globalGameEngineInstance!.update(100); // Less than cooldown
      assertFalse(dispatchedActions.some(a => a.type === 'START_DIALOGUE'), 'No START_DIALOGUE action dispatched due to cooldown');

      globalGameEngineInstance!.update(300); // More than cooldown
      assertTrue(dispatchedActions.some(a => a.type === 'START_DIALOGUE'), 'START_DIALOGUE action dispatched after cooldown');
    });

    testWithBeforeEach('Keyboard input processing - toggle inventory/quest log/character screen', () => {
      player.position = { x: 0, y: 0 }; // Move player away from interaction points
      mockGameState.npcs = [];
      mockGameState.items = [];
      globalGameEngineInstance!.setGameState(mockGameState);
      dispatchedActions = [];

      // Toggle Inventory
      globalGameEngineInstance!.handleKeyboardInput(new Set(['KeyI']));
      globalGameEngineInstance!.update(100);
      assertTrue(dispatchedActions.some(a => a.type === 'TOGGLE_INVENTORY'), 'TOGGLE_INVENTORY action should be dispatched');
      assertTrue(mockGameState.showInventory, 'showInventory should be true');
      dispatchedActions = [];

      globalGameEngineInstance!.update(300); // After cooldown
      globalGameEngineInstance!.handleKeyboardInput(new Set(['KeyI']));
      globalGameEngineInstance!.update(100);
      assertTrue(dispatchedActions.some(a => a.type === 'TOGGLE_INVENTORY'), 'TOGGLE_INVENTORY action should be dispatched again');
      assertFalse(mockGameState.showInventory, 'showInventory should be false');
      dispatchedActions = [];

      // Toggle Quest Log
      globalGameEngineInstance!.handleKeyboardInput(new Set(['KeyQ']));
      globalGameEngineInstance!.update(100);
      assertTrue(dispatchedActions.some(a => a.type === 'TOGGLE_QUEST_LOG'), 'TOGGLE_QUEST_LOG action should be dispatched');
      assertTrue(mockGameState.showQuestLog, 'showQuestLog should be true');
      dispatchedActions = [];

      // Toggle Character Screen
      globalGameEngineInstance!.handleKeyboardInput(new Set(['KeyC']));
      globalGameEngineInstance!.update(100);
      assertTrue(dispatchedActions.some(a => a.type === 'TOGGLE_CHARACTER_SCREEN'), 'TOGGLE_CHARACTER_SCREEN action should be dispatched');
      assertTrue(mockGameState.showCharacterScreen, 'showCharacterScreen should be true');
      dispatchedActions = [];
    });
  });
}

function testSaveGameService(): void {
  suite('Save Game Service Tests', () => {
    let initialPlayer: Player;
    let initialMap: GameMap;
    let initialItems: Item[];
    let initialEnemies: Enemy[];
    let initialNPCs: NPC[];
    let initialGameState: IGameState;
    let mockQuestManager: QuestManager;

    beforeEach(() => {
      localStorageMock.clear(); // Clear localStorage before each test
      (QuestManager as any)._instance = null; // Reset QuestManager singleton

      initialPlayer = new Player('p1', 'Claude', { x: 5, y: 5 });
      initialPlayer.addExperience(150); // Level 2, 50 exp towards next
      initialPlayer.addGold(50);
      initialPlayer.addItem(Item.createItem(ItemVariant.HealthPotion));
      initialPlayer.addItem(Item.createItem(ItemVariant.EnergyDrink));
      initialPlayer.equip(Item.createItem(ItemVariant.DebuggerBlade)); // Attack +10, Speed +2
      initialPlayer.equip(Item.createItem(ItemVariant.FirewallArmor)); // Defense +10, Speed +2
      initialPlayer.equip(Item.createItem(ItemVariant.CompilersCharm)); // Attack +5, Defense +5, Speed +5

      // Spend some talent points
      initialPlayer.addExperience(100); // Level 3, +3 talent points
      initialPlayer.spendTalentPoint('hp_boost'); // Rank 1
      initialPlayer.spendTalentPoint('hp_boost'); // Rank 2
      initialPlayer.spendTalentPoint('attack_boost'); // Rank 1

      initialMap = new GameMap(mockMapDataIndex['town_square']);
      initialMap.entities.push(new Enemy('bug_on_map_save', EnemyVariant.BasicBug, { x: 1, y: 1 }));
      initialMap.entities.push(Item.createItem(ItemVariant.CodeFragment, { x: 2, y: 2 }));

      initialEnemies = [new Enemy('active_bug', EnemyVariant.SyntaxError, { x: 0, y: 0 })];
      initialNPCs = [{ id: 'shopkeeper_01', name: 'Shopkeeper', position: { x: 3, y: 3 }, dialogueId: 'npc_shopkeeper_dialogue_01', role: 'shopkeeper' }];
      initialItems = [Item.createItem(ItemVariant.MegaPotion, { x: 4, y: 4 })];

      // Mock QuestManager state
      mockQuestManager = QuestManager.getInstance();
      mockQuestManager.initialize([
        {
          id: 'test_quest_save',
          name: 'Test Quest',
          description: 'Do something.',
          status: 'available',
          stages: [{ id: 'stage1', description: 'Talk', objective: { type: 'talk_to_npc', targetId: 'shopkeeper_01', count: 1 }, completed: false }],
          rewards: {},
          currentStageIndex: 0,
        }
      ]);
      mockQuestManager.startQuest('test_quest_save');
      mockQuestManager.updateQuestProgress('talk_to_npc', 'shopkeeper_01', 1); // Complete first stage

      initialGameState = {
        player: initialPlayer,
        currentMap: initialMap,
        enemies: initialEnemies,
        npcs: initialNPCs,
        items: initialItems,
        dialogue: { speaker: 'Narrator', lines: [{ text: 'Game saved!', speaker: 'Narrator' }], currentLineIndex: 0 },
        battle: null,
        gameFlags: { tutorialComplete: true, visitedTown: true },
        showInventory: true,
        showQuestLog: false,
        showCharacterScreen: true,
        notification: 'Game saved!',
        questManagerState: mockQuestManager.serialize(), // Serialize QuestManager state
        hotbarConfig: [ItemVariant.HealthPotion, null, ItemVariant.EnergyDrink, null, null],
      };
    });

    testWithBeforeEach('saveGame stores data in localStorage', () => {
      const success = SaveGameService.saveGame(initialGameState);
      assertTrue(success, 'Save game should succeed');
      const savedData = localStorageMock.getItem('talesOfClaudeSaveGame');
      assert(savedData !== null, 'Data should be present in localStorage');
      const parsedData = JSON.parse(savedData!);
      assertEqual(parsedData.player.name, 'Claude', 'Player name should be saved');
      assertEqual(parsedData.player.position.x, 5, 'Player position should be saved');
      assertEqual(parsedData.currentMap.id, 'town_square', 'Current map ID should be saved');
      assertEqual(parsedData.gameFlags.tutorialComplete, true, 'Game flags should be saved');
      assertEqual(parsedData.player.inventory.length, 2, 'Player inventory items should be saved as serializable');
      assertEqual(parsedData.player.weaponSlot?.variant, ItemVariant.DebuggerBlade, 'Equipped weapon should be saved');
      assertEqual(parsedData.player.talentPoints, initialPlayer.talentPoints, 'Player talent points should be saved');
      assertEqual(parsedData.player.talentTree.talents.length, 3, 'Talent tree talents should be saved');
      assertEqual(parsedData.player.talentTree.talents.find((t: any) => t.id === 'hp_boost')?.currentRank, 2, 'hp_boost rank should be saved');
      assertEqual(parsedData.player.talentTree._availablePoints, initialPlayer.talentTree.availablePoints, 'TalentTree available points should be saved');
      assertEqual(parsedData.hotbarConfig[0], ItemVariant.HealthPotion, 'Hotbar config should be saved');
    });

    testWithBeforeEach('loadGame retrieves and reconstructs game state', () => {
      SaveGameService.saveGame(initialGameState);
      const loadedGameState = SaveGameService.loadGame();

      assert(loadedGameState !== null, 'Loaded game state should not be null');
      assertEqual(loadedGameState?.player.name, 'Claude', 'Loaded player name should match');
      assertEqual(loadedGameState?.player.position.x, 5, 'Loaded player position should match');
      assertEqual(loadedGameState?.player.getBaseStats().hp, initialPlayer.getBaseStats().hp, 'Loaded player HP should match');
      assertEqual(loadedGameState?.player.getBaseStats().level, initialPlayer.getBaseStats().level, 'Loaded player level should match');
      assertEqual(loadedGameState?.player.gold, initialPlayer.gold, 'Loaded player gold should match');
      assertEqual(loadedGameState?.currentMap.id, 'town_square', 'Loaded map ID should match');
      assertEqual(loadedGameState?.enemies.length, 1, 'Loaded enemies count should match');
      assertEqual(loadedGameState?.enemies[0].id, 'active_bug', 'Loaded enemy ID should match');
      assertEqual(loadedGameState?.items.length, 1, 'Loaded dynamic items count should match');
      assertEqual(loadedGameState?.items[0].id, ItemVariant.MegaPotion, 'Loaded dynamic item ID should match');
      assertEqual(loadedGameState?.dialogue?.speaker, 'Narrator', 'Loaded dialogue state should match');
      assertEqual(loadedGameState?.gameFlags.tutorialComplete, true, 'Loaded game flags should match');
      assertEqual(loadedGameState?.showInventory, true, 'Loaded showInventory should match');
      assertEqual(loadedGameState?.showCharacterScreen, true, 'Loaded showCharacterScreen should match');

      // Check reconstructed instances
      assertTrue(loadedGameState?.player instanceof Player, 'Loaded player should be a Player instance');
      assertTrue(loadedGameState?.currentMap instanceof GameMap, 'Loaded currentMap should be a GameMap instance');
      assertTrue(loadedGameState?.player.inventory[0] instanceof Item, 'Loaded inventory item should be an Item instance');
      assertTrue(loadedGameState?.items[0] instanceof Item, 'Loaded dynamic item should be an Item instance');

      // Check equipped items reconstruction
      assert(loadedGameState?.player.weaponSlot !== undefined, 'Loaded player should have a weapon equipped');
      assertEqual(loadedGameState?.player.weaponSlot?.id, ItemVariant.DebuggerBlade, 'Loaded weapon should be Debugger Blade');
      assertEqual(loadedGameState?.player.armorSlot?.id, ItemVariant.FirewallArmor, 'Loaded armor should be Firewall Armor');
      assertEqual(loadedGameState?.player.accessorySlot?.id, ItemVariant.CompilersCharm, 'Loaded accessory should be Compilers Charm');

      // Check player stats with equipment bonuses
      assertEqual(loadedGameState?.player.stats.attack, initialPlayer.stats.attack, 'Loaded player attack with equipment should match');
      assertEqual(loadedGameState?.player.stats.defense, initialPlayer.stats.defense, 'Loaded player defense with equipment should match');
      assertEqual(loadedGameState?.player.stats.speed, initialPlayer.stats.speed, 'Loaded player speed with equipment should match');

      // Check talent tree reconstruction
      assertEqual(loadedGameState?.player.talentPoints, initialPlayer.talentPoints, 'Loaded player talent points should match');
      assertEqual(loadedGameState?.player.talentTree.availablePoints, initialPlayer.talentTree.availablePoints, 'Loaded talent tree available points should match');
      assertEqual(loadedGameState?.player.talentTree.getTalent('hp_boost')?.currentRank, 2, 'Loaded hp_boost talent rank should match');
      assertEqual(loadedGameState?.player.talentTree.getTalent('attack_boost')?.currentRank, 1, 'Loaded attack_boost talent rank should match');

      // Check QuestManager state reconstruction
      const loadedQm = QuestManager.getInstance();
      // Re-initialize with the same mock quests used for saving, then deserialize
      loadedQm.initialize([
        {
          id: 'test_quest_save',
          name: 'Test Quest',
          description: 'Do something.',
          status: 'available',
          stages: [{ id: 'stage1', description: 'Talk', objective: { type: 'talk_to_npc', targetId: 'shopkeeper_01', count: 1 }, completed: false }],
          rewards: {},
          currentStageIndex: 0,
        }
      ]);
      loadedQm.deserialize(loadedGameState?.questManagerState);
      assertEqual(loadedQm.getActiveQuests().length, 1, 'Loaded QuestManager should have 1 active quest');
      assertEqual(loadedQm.getQuestStatus('test_quest_save'), 'active', 'Loaded test_quest_save should be active');
      assertTrue(loadedQm.getQuestById('test_quest_save')?.stages[0].completed, 'Loaded test_quest_save first stage should be completed');

      // Check hotbar config
      assertDeepEqual(loadedGameState?.hotbarConfig, [ItemVariant.HealthPotion, null, ItemVariant.EnergyDrink, null, null], 'Loaded hotbar config should match');
    });

    testWithBeforeEach('loadGame returns null if no save game exists', () => {
      localStorageMock.clear();
      const loadedGameState = SaveGameService.loadGame();
      assertEqual(loadedGameState, null, 'Loaded game state should be null if no save exists');
    });

    testWithBeforeEach('loadGame handles corrupted data by returning null and deleting save', () => {
      localStorageMock.setItem('talesOfClaudeSaveGame', '{"player": "corrupted json"'); // Invalid JSON
      const loadedGameState = SaveGameService.loadGame();
      assertEqual(loadedGameState, null, 'Loaded game state should be null for corrupted data');
      assertEqual(localStorageMock.getItem('talesOfClaudeSaveGame'), null, 'Corrupted save data should be deleted');
    });

    testWithBeforeEach('hasSaveGame correctly reports save presence', () => {
      localStorageMock.clear();
      assertFalse(SaveGameService.hasSaveGame(), 'Should report no save game initially');
      SaveGameService.saveGame(initialGameState);
      assertTrue(SaveGameService.hasSaveGame(), 'Should report save game after saving');
    });

    testWithBeforeEach('deleteSave removes data from localStorage', () => {
      SaveGameService.saveGame(initialGameState);
      assertTrue(SaveGameService.hasSaveGame(), 'Save game should exist before deletion');
      SaveGameService.deleteSave();
      assertFalse(SaveGameService.hasSaveGame(), 'Save game should not exist after deletion');
    });
  });
}

function testStatusEffects(): void {
  suite('Status Effects System Tests', () => {
    let player: Player;
    let enemy: Enemy;

    beforeEach(() => {
      player = new Player('p1', 'Claude', { x: 0, y: 0 });
      player.updateBaseStats({ hp: 100, maxHp: 100, energy: 50, maxEnergy: 50, attack: 10, defense: 5, speed: 10 });
      enemy = new Enemy('bug1', EnemyVariant.BasicBug, { x: 1, y: 1 });
      enemy.stats = { hp: 25, maxHp: 25, energy: 10, maxEnergy: 10, attack: 6, defense: 3, speed: 7 };
    });

    testWithBeforeEach('Applying and updating corrupted status effect (DoT)', () => {
      const initialPlayerHp = player.getBaseStats().hp;
      const corruptedEffect: StatusEffect = { type: 'corrupted', duration: 3, damagePerTurn: 10 };

      player.applyStatusEffect(corruptedEffect);
      assertEqual(player.statusEffects.length, 1, 'Player should have one status effect');
      assertEqual(player.statusEffects[0].duration, 3, 'Initial duration should be 3');

      player.updateStatusEffects(); // Turn 1
      assertEqual(player.getBaseStats().hp, initialPlayerHp - 10, 'Player HP should decrease by 10');
      assertEqual(player.statusEffects[0].duration, 2, 'Duration should decrement to 2');

      player.updateStatusEffects(); // Turn 2
      assertEqual(player.getBaseStats().hp, initialPlayerHp - 20, 'Player HP should decrease by another 10');
      assertEqual(player.statusEffects[0].duration, 1, 'Duration should decrement to 1');

      player.updateStatusEffects(); // Turn 3 (last turn of effect)
      assertEqual(player.getBaseStats().hp, initialPlayerHp - 30, 'Player HP should decrease by final 10');
      assertEqual(player.statusEffects.length, 0, 'Effect should be removed after duration ends');
    });

    testWithBeforeEach('Applying and updating optimized status effect (Buff)', () => {
      const initialPlayerSpeed = player.stats.speed;
      const optimizedEffect: StatusEffect = { type: 'optimized', duration: 2, speedMultiplier: 1.5 };

      player.applyStatusEffect(optimizedEffect);
      assertEqual(player.statusEffects.length, 1, 'Player should have one status effect');
      assertEqual(player.statusEffects[0].duration, 2, 'Initial duration should be 2');
      assertEqual(player.statusEffects[0].speedMultiplier, 1.5, 'Speed multiplier should be set');

      // Note: Player.stats getter already applies speedMultiplier.
      assertEqual(player.stats.speed, initialPlayerSpeed * 1.5, 'Player speed should be boosted');

      player.updateStatusEffects(); // Turn 1
      assertEqual(player.statusEffects[0].duration, 1, 'Duration should decrement to 1');
      assertEqual(player.stats.speed, initialPlayerSpeed * 1.5, 'Player speed should still be boosted');

      player.updateStatusEffects(); // Turn 2 (last turn of effect)
      assertEqual(player.statusEffects.length, 0, 'Effect should be removed after duration ends');
      assertEqual(player.stats.speed, initialPlayerSpeed, 'Player speed should revert to normal');
    });

    testWithBeforeEach('Applying frozen status effect (Crowd Control)', () => {
      const frozenEffect: StatusEffect = { type: 'frozen', duration: 1 };

      enemy.applyStatusEffect(frozenEffect);
      assertEqual(enemy.statusEffects.length, 1, 'Enemy should have one status effect');
      assertEqual(enemy.statusEffects[0].type, 'frozen', 'Effect type should be frozen');
      assertEqual(enemy.statusEffects[0].duration, 1, 'Initial duration should be 1');

      enemy.updateStatusEffects(); // Turn 1 (last turn of effect)
      assertEqual(enemy.statusEffects.length, 0, 'Effect should be removed after duration ends');
    });

    testWithBeforeEach('Applying same status effect refreshes duration and updates properties', () => {
      const corruptedEffect1: StatusEffect = { type: 'corrupted', duration: 2, damagePerTurn: 5 };
      const corruptedEffect2: StatusEffect = { type: 'corrupted', duration: 4, damagePerTurn: 8 };

      player.applyStatusEffect(corruptedEffect1);
      assertEqual(player.statusEffects[0].duration, 2, 'Initial duration is 2');
      assertEqual(player.statusEffects[0].damagePerTurn, 5, 'Initial damage is 5');

      player.updateStatusEffects(); // Duration becomes 1, takes 5 damage
      player.applyStatusEffect(corruptedEffect2); // Apply new, stronger version
      assertEqual(player.statusEffects.length, 1, 'Still only one effect');
      assertEqual(player.statusEffects[0].duration, 4, 'Duration should be refreshed to 4');
      assertEqual(player.statusEffects[0].damagePerTurn, 8, 'Damage per turn should be updated to 8');

      const initialHpAfterFirstTick = player.getBaseStats().hp;
      player.updateStatusEffects(); // Duration becomes 3, takes 8 damage
      assertEqual(player.getBaseStats().hp, initialHpAfterFirstTick - 8, 'Player takes updated damage');
      assertEqual(player.statusEffects[0].duration, 3, 'Duration decrements from new value');
    });

    testWithBeforeEach('Multiple different status effects', () => {
      const corruptedEffect: StatusEffect = { type: 'corrupted', duration: 2, damagePerTurn: 5 };
      const frozenEffect: StatusEffect = { type: 'frozen', duration: 1 };

      player.applyStatusEffect(corruptedEffect);
      player.applyStatusEffect(frozenEffect);
      assertEqual(player.statusEffects.length, 2, 'Player should have two different status effects');

      const initialPlayerHp = player.getBaseStats().hp;
      player.updateStatusEffects(); // Turn 1
      assertEqual(player.getBaseStats().hp, initialPlayerHp - 5, 'Player takes damage from corrupted');
      assertEqual(player.statusEffects.length, 1, 'Frozen effect should be removed');
      assertEqual(player.statusEffects[0].type, 'corrupted', 'Corrupted effect should remain');

      player.updateStatusEffects(); // Turn 2
      assertEqual(player.getBaseStats().hp, initialPlayerHp - 10, 'Player takes damage again from corrupted');
      assertEqual(player.statusEffects.length, 0, 'Corrupted effect should be removed');
    });
  });
}


// --- RUN ALL TESTS ---
runAllTests();

