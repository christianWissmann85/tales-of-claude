// tests/unit/maps.test.ts
import { strict as assert } from 'assert';
import { MapLoader } from '../../src/engine/MapLoader';
import { getMap } from '../../src/assets/maps';
import {} from '../../src/types/global.types';
import { JsonMap } from '../../src/types/map-schema.types';

// Import actual TS map data for testing legacy maps
import { binaryForestData } from '../../src/assets/maps/binaryForest';
import { debugDungeonData } from '../../src/assets/maps/debugDungeon';

// Import actual model classes that MapLoader instantiates
import { Enemy } from '../../src/models/Enemy';

// Mock JSON map data (simplified for testing specific aspects)
const mockTerminalTownJson: JsonMap = {
  id: 'terminalTown',
  name: 'Terminal Town',
  width: 10,
  height: 10,
  version: '1.0',
  layers: [
    {
      name: 'base',
      type: 'tilelayer',
      width: 10,
      height: 10,
      data: Array(100).fill('grass'), // All grass
    },
    {
      name: 'collision',
      type: 'tilelayer',
      width: 10,
      height: 10,
      data: Array(100).fill('walkable'), // All walkable
    },
    {
      name: 'objects',
      type: 'objectgroup',
      objects: [
        {
          id: 'npc_01',
          type: 'npc',
          position: { x: 1, y: 1 },
          properties: { name: 'Debugger Great', role: 'debugger', dialogueId: 'debuggerGreat_intro' },
        },
        {
          id: 'enemy_01',
          type: 'enemy',
          position: { x: 2, y: 2 },
          properties: { variant: 'BasicBug', enemyType: 'bug', level: 1 },
        },
        {
          id: 'item_01',
          type: 'item',
          position: { x: 3, y: 3 },
          properties: { variant: 'HealthPotion', itemType: 'consumable', quantity: 1 },
        },
        {
          id: 'exit_01',
          type: 'exit',
          position: { x: 9, y: 9 },
          properties: { targetMapId: 'terminalTownExpanded', targetPositionX: 0, targetPositionY: 0 },
        },
        {
          id: 'door_01',
          type: 'door',
          position: { x: 5, y: 5 },
          properties: { doorId: 'main_door' },
        },
        {
          id: 'locked_door_01',
          type: 'locked_door',
          position: { x: 6, y: 6 },
          properties: { doorId: 'locked_main_door', keyItemId: 'master_key' },
        },
      ],
    },
  ],
};

const mockTerminalTownExpandedJson: JsonMap = {
  id: 'terminalTownExpanded',
  name: 'Terminal Town Expanded',
  width: 20,
  height: 20,
  version: '1.0',
  layers: [
    { name: 'base', type: 'tilelayer', width: 20, height: 20, data: Array(400).fill('floor') },
    { name: 'collision', type: 'tilelayer', width: 20, height: 20, data: Array(400).fill('walkable') },
    { name: 'objects', type: 'objectgroup', objects: [] },
  ],
};

const mockCrystalCavernsJson: JsonMap = {
  id: 'crystalCaverns',
  name: 'Crystal Caverns',
  width: 15,
  height: 15,
  version: '1.0',
  layers: [
    { name: 'base', type: 'tilelayer', width: 15, height: 15, data: Array(225).fill('dungeon_floor') },
    { name: 'collision', type: 'tilelayer', width: 15, height: 15, data: Array(225).fill('walkable') },
    { name: 'objects', type: 'objectgroup', objects: [] },
  ],
};

const mockSyntaxSwampJson: JsonMap = {
  id: 'syntaxSwamp',
  name: 'Syntax Swamp',
  width: 12,
  height: 12,
  version: '1.0',
  layers: [
    { name: 'base', type: 'tilelayer', width: 12, height: 12, data: Array(144).fill('water') },
    { name: 'collision', type: 'tilelayer', width: 12, height: 12, data: Array(144).fill('wall') }, // Mostly non-walkable
    { name: 'objects', type: 'objectgroup', objects: [] },
  ],
};

const mockOverworldJson: JsonMap = {
  id: 'overworld',
  name: 'Overworld Map',
  width: 50,
  height: 50,
  version: '1.0',
  layers: [
    { name: 'base', type: 'tilelayer', width: 50, height: 50, data: Array(2500).fill('grass') },
    { name: 'collision', type: 'tilelayer', width: 50, height: 50, data: Array(2500).fill('walkable') },
    { name: 'objects', type: 'objectgroup', objects: [] },
  ],
};

// Map of mapId to mock JSON data
const mockJsonMaps: Record<string, JsonMap | undefined> = { // Allow undefined for cleanup in beforeEach
  terminalTown: mockTerminalTownJson,
  terminalTownExpanded: mockTerminalTownExpandedJson,
  crystalCaverns: mockCrystalCavernsJson,
  syntaxSwamp: mockSyntaxSwampJson,
  overworld: mockOverworldJson,
};

// Mock fetch for JSON maps. This is necessary because MapLoader uses `fetch`
// to load JSON files, and in a Node.js test environment, `fetch` needs to be
// mocked to serve local data instead of making actual HTTP requests.
// Mock fetch - originalFetch not needed as we're not restoring it
global.fetch = async (url: RequestInfo | URL, _init?: RequestInit) => {
  const mapIdMatch = String(url).match(/\/src\/assets\/maps\/json\/(.*)\.json$/);
  if (mapIdMatch && mockJsonMaps[mapIdMatch[1]]) {
    return {
      ok: true,
      json: () => Promise.resolve(mockJsonMaps[mapIdMatch[1]]),
    } as Response;
  }
  // For non-existent maps, return a 404
  return {
    ok: false,
    status: 404,
    statusText: 'Not Found',
    json: () => Promise.resolve({ message: 'Map not found' }),
  } as Response;
};

// Custom test runner utilities (assuming these are available from node-test-runner.ts)
// These declarations allow TypeScript to recognize `test`, `suite`, `beforeEach`, `testWithBeforeEach`.
// declare function test(name: string, fn: () => void | Promise<void>): void; // Unused declaration
declare function suite(name: string, testsFn: () => void): void;
declare function beforeEach(fn: () => void): void;
declare function testWithBeforeEach(name: string, fn: () => void | Promise<void>): void;

// Utilities for spying on console.warn, mimicking Vitest's spy functionality
let originalConsoleWarn: typeof console.warn;
let consoleWarnMessages: string[] = [];

function spyOnConsoleWarn() {
  originalConsoleWarn = console.warn;
  consoleWarnMessages = [];
  console.warn = (...args: unknown[]) => {
    consoleWarnMessages.push(args.map(arg => String(arg)).join(' '));
    // Optionally call original console.warn if you still want output during tests
    // originalConsoleWarn(...args);
  };
}

function restoreConsoleWarn() {
  console.warn = originalConsoleWarn;
  consoleWarnMessages = []; // Clear messages after restoring
}

function assertConsoleWarnCalledWith(expectedSubstring: string, message: string) {
  const found = consoleWarnMessages.some(msg => msg.includes(expectedSubstring));
  assert.ok(found, `${message} (Expected warning containing: "${expectedSubstring}", Got: ${JSON.stringify(consoleWarnMessages)})`);
}


// Wrap all map tests in a suite
suite('MapLoader and Map Structure Tests', () => {

  beforeEach(() => {
    // Ensure MapLoader is a fresh instance for each test by resetting its singleton instance
    // Using type assertion to access private static property for testing
    (MapLoader as unknown as { instance: undefined }).instance = undefined;
    // Clear the cache of the singleton MapLoader instance before each test
    const mapLoader = MapLoader.getInstance();
    // Access private property for testing
    (mapLoader as unknown as { cache: Map<string, unknown> }).cache.clear();

    // Reset mockJsonMaps entries that might be modified by specific tests
    // This ensures each test starts with a clean slate for these dynamic mocks.
    mockJsonMaps['customMap'] = undefined;
    mockJsonMaps['minimalMap'] = undefined;
    mockJsonMaps['emptyObjectsMap'] = undefined;
    mockJsonMaps['noObjectsLayerMap'] = undefined;
    mockJsonMaps['unknownObjectMap'] = undefined;
    mockJsonMaps['invalidItemMap'] = undefined;
    mockJsonMaps['mismatchMap'] = undefined;
  });

  testWithBeforeEach('1. MapLoader can load all JSON maps', async () => {
    const mapLoader = MapLoader.getInstance();
    // Filter out any undefined entries that might result from beforeEach cleanup
    const jsonMapIds = Object.keys(mockJsonMaps).filter(id => mockJsonMaps[id] !== undefined);

    for (const mapId of jsonMapIds) {
      const map = await mapLoader.loadMap(mapId);
      assert.ok(map, `Map ${mapId} should be defined`);
      assert.strictEqual(map.id, mapId, `Map ID for ${mapId} should match`);
      assert.strictEqual(map.name, mockJsonMaps[mapId]!.name, `Map name for ${mapId} should match`);
      assert.strictEqual(map.width, mockJsonMaps[mapId]!.width, `Map width for ${mapId} should match`);
      assert.strictEqual(map.height, mockJsonMaps[mapId]!.height, `Map height for ${mapId} should match`);
    }
  });

  testWithBeforeEach('2. MapLoader can load legacy TS maps', async () => {
    const mapLoader = MapLoader.getInstance();

    // Test binaryForest
    const binaryForestMap = await mapLoader.loadMap('binaryForest');
    assert.ok(binaryForestMap, 'binaryForest map should be defined');
    assert.strictEqual(binaryForestMap.id, 'binaryForest', 'binaryForest ID should be correct');
    assert.strictEqual(binaryForestMap.name, binaryForestData.name, 'binaryForest name should be correct');
    assert.strictEqual(binaryForestMap.width, binaryForestData.width, 'binaryForest width should be correct');
    assert.strictEqual(binaryForestMap.height, binaryForestData.height, 'binaryForest height should be correct');

    // Test debugDungeon
    const debugDungeonMap = await mapLoader.loadMap('debugDungeon');
    assert.ok(debugDungeonMap, 'debugDungeon map should be defined');
    assert.strictEqual(debugDungeonMap.id, 'debugDungeon', 'debugDungeon ID should be correct');
    assert.strictEqual(debugDungeonMap.name, debugDungeonData.name, 'debugDungeon name should be correct');
    assert.strictEqual(debugDungeonMap.width, debugDungeonData.width, 'debugDungeon width should be correct');
    assert.strictEqual(debugDungeonMap.height, debugDungeonData.height, 'debugDungeon height should be correct');
  });

  testWithBeforeEach('3. getMap function works for all maps (JSON and TS)', async () => {
    // Test JSON maps via getMap
    const jsonMapIds = Object.keys(mockJsonMaps).filter(id => mockJsonMaps[id] !== undefined);
    for (const mapId of jsonMapIds) {
      const map = await getMap(mapId);
      assert.ok(map, `Map ${mapId} should be defined via getMap`);
      assert.strictEqual(map.id, mapId, `Map ID for ${mapId} via getMap should match`);
    }

    // Test TS maps via getMap (these are directly imported into mapDataIndex)
    const binaryForestMap = await getMap('binaryForest');
    assert.ok(binaryForestMap, 'binaryForest map should be defined via getMap');
    assert.strictEqual(binaryForestMap.id, 'binaryForest', 'binaryForest ID via getMap should be correct');
    assert.strictEqual(binaryForestMap.name, binaryForestData.name, 'binaryForest name via getMap should be correct');

    const debugDungeonMap = await getMap('debugDungeon');
    assert.ok(debugDungeonMap, 'debugDungeon map should be defined via getMap');
    assert.strictEqual(debugDungeonMap.id, 'debugDungeon', 'debugDungeon ID via getMap should be correct');
    assert.strictEqual(debugDungeonMap.name, debugDungeonData.name, 'debugDungeon name via getMap should be correct');
  });

  testWithBeforeEach('4. Map transitions (exits) work correctly', async () => {
    const map = await getMap('terminalTown');
    assert.ok(map.exits, 'map.exits should be defined');
    assert.ok(map.exits.length > 0, 'map.exits length should be greater than 0');

    const exit = map.exits.find(e => e.position.x === 9 && e.position.y === 9);
    assert.ok(exit, 'Exit at (9,9) should be defined');
    assert.deepStrictEqual(exit!.position, { x: 9, y: 9 }, 'Exit position should be (9,9)');
    assert.strictEqual(exit!.targetMapId, 'terminalTownExpanded', 'Exit targetMapId should be terminalTownExpanded');
    assert.deepStrictEqual(exit!.targetPosition, { x: 0, y: 0 }, 'Exit targetPosition should be (0,0)');

    // Verify the tile at the exit position is marked as 'exit' and walkable
    assert.strictEqual(map.tiles[9][9].type, 'exit', 'Tile at (9,9) should be of type exit');
    assert.strictEqual(map.tiles[9][9].walkable, true, 'Tile at (9,9) should be walkable');
  });

  testWithBeforeEach('5. JSON map structure is properly converted to IGameMap format', async () => {
    const map = await getMap('terminalTown');

    assert.strictEqual(map.id, 'terminalTown', 'Map ID should be terminalTown');
    assert.strictEqual(map.name, 'Terminal Town', 'Map name should be Terminal Town');
    assert.strictEqual(map.width, 10, 'Map width should be 10');
    assert.strictEqual(map.height, 10, 'Map height should be 10');
    assert.ok(Array.isArray(map.tiles), 'Map tiles should be an array');
    assert.strictEqual(map.tiles.length, 10, 'Map tiles height should be 10'); // height
    assert.strictEqual(map.tiles[0].length, 10, 'Map tiles width should be 10'); // width
    assert.ok(Array.isArray(map.entities), 'Map entities should be an array');
    assert.ok(Array.isArray(map.exits), 'Map exits should be an array');
  });

  testWithBeforeEach('6. Entities, exits, and tiles are correctly processed', async () => {
    const map = await getMap('terminalTown');

    // Test Tiles:
    // All tiles should be walkable 'grass' by default from mock, except specific objects
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (x === 5 && y === 5) { // Door
          assert.strictEqual(map.tiles[y][x].type, 'door', `Tile at (${x},${y}) should be door`);
          assert.strictEqual(map.tiles[y][x].walkable, false, `Tile at (${x},${y}) should not be walkable`);
        } else if (x === 6 && y === 6) { // Locked Door
          assert.strictEqual(map.tiles[y][x].type, 'locked_door', `Tile at (${x},${y}) should be locked_door`);
          assert.strictEqual(map.tiles[y][x].walkable, false, `Tile at (${x},${y}) should not be walkable`);
        } else if (x === 9 && y === 9) { // Exit
          assert.strictEqual(map.tiles[y][x].type, 'exit', `Tile at (${x},${y}) should be exit`);
          assert.strictEqual(map.tiles[y][x].walkable, true, `Tile at (${x},${y}) should be walkable`);
        } else {
          assert.strictEqual(map.tiles[y][x].type, 'grass', `Tile at (${x},${y}) should be grass`); // From base layer
          assert.strictEqual(map.tiles[y][x].walkable, true, `Tile at (${x},${y}) should be walkable`); // From collision layer
        }
      }
    }

    // Test Entities:
    assert.strictEqual(map.entities.length, 3, 'Map should have 3 entities (NPC, Enemy, Item)');

    const npc = map.entities.find(e => e.id === 'npc_01');
    assert.ok(npc, 'NPC should be defined');
    assert.strictEqual(npc!.name, 'Debugger Great', 'NPC name should be Debugger Great');
    assert.deepStrictEqual(npc!.position, { x: 1, y: 1 }, 'NPC position should be (1,1)');
    // NPC-specific properties check using type narrowing
    if ('role' in npc && 'dialogueId' in npc) {
      assert.strictEqual(npc.role, 'debugger', 'NPC role should be debugger');
      assert.strictEqual(npc.dialogueId, 'debuggerGreat_intro', 'NPC dialogueId should be debuggerGreat_intro');
    } else {
      assert.fail('Entity should have NPC properties');
    }

    const enemy = map.entities.find(e => e.id === 'enemy_01');
    assert.ok(enemy, 'Enemy should be defined');
    assert.strictEqual(enemy!.name, 'Basic Bug', 'Enemy name should be Basic Bug');
    assert.deepStrictEqual(enemy!.position, { x: 2, y: 2 }, 'Enemy position should be (2,2)');
    assert.strictEqual((enemy as Enemy).type, 'bug', 'Enemy type should be bug');
    assert.strictEqual((enemy as Enemy).stats.level, 1, 'Enemy level should be 1');

    const item = map.entities.find(e => e.id === 'item_01');
    assert.ok(item, 'Item should be defined');
    assert.strictEqual(item!.name, 'Health Potion', 'Item name should be Health Potion');
    assert.deepStrictEqual(item!.position, { x: 3, y: 3 }, 'Item position should be (3,3)');
    // Item type check using type narrowing
    if ('type' in item) {
      assert.strictEqual(item.type, 'consumable', 'Item type should be consumable');
    } else {
      assert.fail('Entity should have item type property');
    }

    // Test Exits: (already covered in #4, but re-verify count)
    assert.strictEqual(map.exits.length, 1, 'Map should have 1 exit');
    const exit = map.exits[0];
    assert.deepStrictEqual(exit.position, { x: 9, y: 9 }, 'Exit position should be (9,9)');
    assert.strictEqual(exit.targetMapId, 'terminalTownExpanded', 'Exit targetMapId should be terminalTownExpanded');
    assert.deepStrictEqual(exit.targetPosition, { x: 0, y: 0 }, 'Exit targetPosition should be (0,0)');
  });

  testWithBeforeEach('7. Error handling for non-existent maps', async () => {
    const nonExistentMapId = 'nonExistentMap';

    // The global fetch mock is already set up to return 404 for unknown URLs.
    // The getMap function will try JSON, then TS. Since neither will exist, it should throw.
    // Using Node.js's assert.rejects to check for async errors and their messages.
    await assert.rejects(
      async () => { await getMap(nonExistentMapId); },
      (err) => {
        assert.ok(err instanceof Error, 'Error should be an instance of Error');
        assert.ok(err.message.includes('Could not load map "nonExistentMap" from JSON or TS'), 'Error message should contain expected text');
        return true; // Return true if the error matches
      },
      'Loading a non-existent map should throw an error with a specific message',
    );
  });

  testWithBeforeEach('Tiles are correctly processed from multiple layers (base, decoration, collision)', async () => {
    const customJsonMap: JsonMap = {
      id: 'customMap',
      name: 'Custom Test Map',
      width: 3,
      height: 3,
      version: '1.0',
      layers: [
        {
          name: 'base',
          type: 'tilelayer',
          width: 3,
          height: 3,
          data: [
            'grass', 'grass', 'grass',
            'floor', 'floor', 'floor',
            'path', 'path', 'path',
          ],
        },
        {
          name: 'decoration',
          type: 'tilelayer',
          width: 3,
          height: 3,
          data: [
            'walkable', 'tree', 'walkable', // Tree on grass
            'walkable', 'walkable', 'water', // Water on floor
            'walkable', 'walkable', 'walkable',
          ],
        },
        {
          name: 'collision',
          type: 'tilelayer',
          width: 3,
          height: 3,
          data: [
            'walkable', 'wall', 'walkable', // Wall over tree
            'walkable', 'walkable', 'wall', // Wall over water
            'walkable', 'door', 'exit', // Door and Exit on path
          ],
        },
        {
          name: 'objects',
          type: 'objectgroup',
          objects: [
            { id: 'exit_custom', type: 'exit', position: { x: 2, y: 2 }, properties: { targetMapId: 'someMap', targetPositionX: 0, targetPositionY: 0 } },
          ],
        },
      ],
    };

    // Temporarily add customJsonMap to mockJsonMaps
    mockJsonMaps['customMap'] = customJsonMap;

    const map = await getMap('customMap');

    // (0,0): base=grass, decor=walkable, collision=walkable -> grass, walkable
    assert.deepStrictEqual(map.tiles[0][0], { type: 'grass', walkable: true }, 'Tile (0,0) should be grass and walkable');

    // (0,1): base=grass, decor=tree, collision=wall -> wall, non-walkable (collision overrides)
    assert.deepStrictEqual(map.tiles[0][1], { type: 'wall', walkable: false }, 'Tile (0,1) should be wall and non-walkable');

    // (0,2): base=grass, decor=walkable, collision=walkable -> grass, walkable
    assert.deepStrictEqual(map.tiles[0][2], { type: 'grass', walkable: true }, 'Tile (0,2) should be grass and walkable');

    // (1,0): base=floor, decor=walkable, collision=walkable -> floor, walkable
    assert.deepStrictEqual(map.tiles[1][0], { type: 'floor', walkable: true }, 'Tile (1,0) should be floor and walkable');

    // (1,1): base=floor, decor=walkable, collision=walkable -> floor, walkable
    assert.deepStrictEqual(map.tiles[1][1], { type: 'floor', walkable: true }, 'Tile (1,1) should be floor and walkable');

    // (1,2): base=floor, decor=water, collision=wall -> wall, non-walkable (collision overrides)
    assert.deepStrictEqual(map.tiles[1][2], { type: 'wall', walkable: false }, 'Tile (1,2) should be wall and non-walkable');

    // (2,0): base=path, decor=walkable, collision=walkable -> path, walkable
    assert.deepStrictEqual(map.tiles[2][0], { type: 'path', walkable: true }, 'Tile (2,0) should be path and walkable');

    // (2,1): base=path, decor=walkable, collision=door -> door, non-walkable
    assert.deepStrictEqual(map.tiles[2][1], { type: 'door', walkable: false }, 'Tile (2,1) should be door and non-walkable');

    // (2,2): base=path, decor=walkable, collision=exit -> exit, walkable (and exit object exists)
    assert.deepStrictEqual(map.tiles[2][2], { type: 'exit', walkable: true }, 'Tile (2,2) should be exit and walkable');
    assert.strictEqual(map.exits.length, 1, 'Map should have 1 exit');
    assert.deepStrictEqual(map.exits[0].position, { x: 2, y: 2 }, 'Exit position should be (2,2)');

    // Clean up custom map from mocks (done by beforeEach, but explicit here for clarity)
    delete mockJsonMaps['customMap'];
  });

  testWithBeforeEach('Tiles are correctly processed when some layers are missing', async () => {
    const minimalJsonMap: JsonMap = {
      id: 'minimalMap',
      name: 'Minimal Test Map',
      width: 2,
      height: 2,
      version: '1.0',
      layers: [
        {
          name: 'base',
          type: 'tilelayer',
          width: 2,
          height: 2,
          data: [
            'grass', 'wall',
            'floor', 'tree',
          ],
        },
        // No collision layer
        // No object layer
      ],
    };

    mockJsonMaps['minimalMap'] = minimalJsonMap;
    const map = await getMap('minimalMap');

    // (0,0): grass, no collision -> walkable (default for grass)
    assert.deepStrictEqual(map.tiles[0][0], { type: 'grass', walkable: true }, 'Tile (0,0) should be grass and walkable');
    // (0,1): wall, no collision -> non-walkable (default for wall)
    assert.deepStrictEqual(map.tiles[0][1], { type: 'wall', walkable: false }, 'Tile (0,1) should be wall and non-walkable');
    // (1,0): floor, no collision -> walkable (default for floor)
    assert.deepStrictEqual(map.tiles[1][0], { type: 'floor', walkable: true }, 'Tile (1,0) should be floor and walkable');
    // (1,1): tree, no collision -> non-walkable (default for tree)
    assert.deepStrictEqual(map.tiles[1][1], { type: 'tree', walkable: false }, 'Tile (1,1) should be tree and non-walkable');

    assert.strictEqual(map.entities.length, 0, 'Map entities length should be 0');
    assert.strictEqual(map.exits.length, 0, 'Map exits length should be 0');

    delete mockJsonMaps['minimalMap'];
  });

  testWithBeforeEach('Map with empty object layer processes correctly', async () => {
    const emptyObjectsMap: JsonMap = {
      id: 'emptyObjectsMap',
      name: 'Empty Objects Map',
      width: 5,
      height: 5,
      version: '1.0',
      layers: [
        {
          name: 'base',
          type: 'tilelayer',
          width: 5,
          height: 5,
          data: Array(25).fill('grass'),
        },
        {
          name: 'collision',
          type: 'tilelayer',
          width: 5,
          height: 5,
          data: Array(25).fill('walkable'),
        },
        {
          name: 'objects',
          type: 'objectgroup',
          objects: [], // Empty objects array
        },
      ],
    };

    mockJsonMaps['emptyObjectsMap'] = emptyObjectsMap;
    const map = await getMap('emptyObjectsMap');

    assert.strictEqual(map.entities.length, 0, 'Map entities length should be 0');
    assert.strictEqual(map.exits.length, 0, 'Map exits length should be 0');
    assert.strictEqual(map.tiles[0][0].type, 'grass', 'Tile (0,0) type should be grass');
    assert.strictEqual(map.tiles[0][0].walkable, true, 'Tile (0,0) should be walkable');

    delete mockJsonMaps['emptyObjectsMap'];
  });

  testWithBeforeEach('Map with no object layer at all processes correctly', async () => {
    const noObjectsLayerMap: JsonMap = {
      id: 'noObjectsLayerMap',
      name: 'No Objects Layer Map',
      width: 5,
      height: 5,
      version: '1.0',
      layers: [
        {
          name: 'base',
          type: 'tilelayer',
          width: 5,
          height: 5,
          data: Array(25).fill('grass'),
        },
        {
          name: 'collision',
          type: 'tilelayer',
          width: 5,
          height: 5,
          data: Array(25).fill('walkable'),
        },
      ],
    };

    mockJsonMaps['noObjectsLayerMap'] = noObjectsLayerMap;
    const map = await getMap('noObjectsLayerMap');

    assert.strictEqual(map.entities.length, 0, 'Map entities length should be 0');
    assert.strictEqual(map.exits.length, 0, 'Map exits length should be 0');
    assert.strictEqual(map.tiles[0][0].type, 'grass', 'Tile (0,0) type should be grass');
    assert.strictEqual(map.tiles[0][0].walkable, true, 'Tile (0,0) should be walkable');

    delete mockJsonMaps['noObjectsLayerMap'];
  });

  testWithBeforeEach('Unknown object types are logged as warnings and skipped', async () => {
    const unknownObjectMap: JsonMap = {
      id: 'unknownObjectMap',
      name: 'Unknown Object Map',
      width: 5,
      height: 5,
      version: '1.0',
      layers: [
        {
          name: 'base',
          type: 'tilelayer',
          width: 5,
          height: 5,
          data: Array(25).fill('grass'),
        },
        {
          name: 'objects',
          type: 'objectgroup',
          objects: [
            { id: 'unknown_01', type: 'unknown_type' as unknown as string, position: { x: 1, y: 1 } },
            { id: 'npc_01', type: 'npc', position: { x: 2, y: 2 }, properties: { name: 'Test NPC', role: 'debugger', dialogueId: 'test' } },
          ],
        },
      ],
    };

    mockJsonMaps['unknownObjectMap'] = unknownObjectMap;
    spyOnConsoleWarn(); // Start spying

    const map = await getMap('unknownObjectMap');

    assertConsoleWarnCalledWith('Unknown object type encountered: "unknown_type" for object "unknown_01". Object not loaded.', 'Warning for unknown object type should be logged');
    assert.strictEqual(map.entities.length, 1, 'Only the NPC should be loaded'); // Only the NPC should be loaded
    assert.strictEqual(map.entities[0].id, 'npc_01', 'Loaded entity ID should be npc_01');

    restoreConsoleWarn(); // Stop spying and restore original
    delete mockJsonMaps['unknownObjectMap'];
  });

  testWithBeforeEach('Invalid item variant is logged as warning and item is skipped', async () => {
    const invalidItemMap: JsonMap = {
      id: 'invalidItemMap',
      name: 'Invalid Item Map',
      width: 5,
      height: 5,
      version: '1.0',
      layers: [
        {
          name: 'base',
          type: 'tilelayer',
          width: 5,
          height: 5,
          data: Array(25).fill('grass'),
        },
        {
          name: 'objects',
          type: 'objectgroup',
          objects: [
            { id: 'item_invalid', type: 'item', position: { x: 1, y: 1 }, properties: { variant: 'NonExistentItem', itemType: 'consumable' } },
            { id: 'item_valid', type: 'item', position: { x: 2, y: 2 }, properties: { variant: 'HealthPotion', itemType: 'consumable' } },
          ],
        },
      ],
    };

    mockJsonMaps['invalidItemMap'] = invalidItemMap;
    spyOnConsoleWarn(); // Start spying

    const map = await getMap('invalidItemMap');

    assertConsoleWarnCalledWith('Unknown item variant: "NonExistentItem" for object "item_invalid". Item not loaded.', 'Warning for invalid item variant should be logged');
    assert.strictEqual(map.entities.length, 1, 'Only the valid item should be loaded'); // Only the valid item should be loaded
    assert.strictEqual(map.entities[0].id, 'item_valid', 'Loaded entity ID should be item_valid');

    restoreConsoleWarn(); // Stop spying and restore original
    delete mockJsonMaps['invalidItemMap'];
  });

  testWithBeforeEach('Tile layer data length mismatch logs a warning and skips layer', async () => {
    const mismatchMap: JsonMap = {
      id: 'mismatchMap',
      name: 'Mismatch Map',
      width: 2,
      height: 2,
      version: '1.0',
      layers: [
        {
          name: 'base',
          type: 'tilelayer',
          width: 2,
          height: 2,
          data: ['grass', 'grass', 'grass'], // Should be 4 elements (width * height)
        },
      ],
    };

    mockJsonMaps['mismatchMap'] = mismatchMap;
    spyOnConsoleWarn(); // Start spying

    const map = await getMap('mismatchMap');

    assertConsoleWarnCalledWith('Map "mismatchMap": Layer "base" data length mismatch. Expected 4, got 3. Skipping.', 'Warning for tile layer data length mismatch should be logged');
    // Since base layer was skipped, tiles should be default 'wall' and non-walkable
    assert.deepStrictEqual(map.tiles[0][0], { type: 'wall', walkable: false }, 'Tile (0,0) should be default wall and non-walkable');

    restoreConsoleWarn(); // Stop spying and restore original
    delete mockJsonMaps['mismatchMap'];
  });

});
