// src/assets/maps/binaryForest.ts

import { Position, Tile, TileType, Exit, Enemy, NPC, Item, GameMap as IGameMap } from '../../types/global.types';
// import { GameMap } from '../../models/Map'; // Unused import
import { Enemy as EnemyClass, EnemyVariant } from '../../models/Enemy';
import { Item as ItemClass, ItemVariant } from '../../models/Item';
import { NPCRole } from '../../types/global.types'; // Import NPCRole for NPC definitions

const MAP_WIDTH = 25;
const MAP_HEIGHT = 20;

const forestFloorTile: Tile = { walkable: true, type: 'grass' }; // Reusing 'grass' for forest floor
const denseTreesTile: Tile = { walkable: false, type: 'tree' };
const rockTile: Tile = { walkable: false, type: 'wall' }; // Using 'wall' as rock substitute
const dirtPathTile: Tile = { walkable: true, type: 'path' }; // Using 'path' as dirt substitute
const exitTile: Tile = { walkable: true, type: 'exit' };

const tiles: Tile[][] = Array.from({ length: MAP_HEIGHT }, () =>
  Array.from({ length: MAP_WIDTH }, () => ({ ...forestFloorTile })),
);

// --- Layout Design ---

// 1. Dense trees around the edges for boundaries
for (let y = 0; y < MAP_HEIGHT; y++) {
  tiles[y][0] = { ...denseTreesTile };
  tiles[y][MAP_WIDTH - 1] = { ...denseTreesTile };
}
for (let x = 0; x < MAP_WIDTH; x++) {
  tiles[0][x] = { ...denseTreesTile };
  tiles[MAP_HEIGHT - 1][x] = { ...denseTreesTile };
}

// 2. Winding dirt path
const pathCoordinates: Position[] = [
  { x: 1, y: 10 }, { x: 2, y: 10 }, { x: 3, y: 10 }, { x: 4, y: 10 }, { x: 5, y: 10 },
  { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 }, { x: 10, y: 9 },
  { x: 11, y: 8 }, { x: 12, y: 8 }, { x: 13, y: 8 }, { x: 14, y: 8 }, { x: 15, y: 8 },
  { x: 16, y: 9 }, { x: 17, y: 9 }, { x: 18, y: 9 }, { x: 19, y: 9 }, { x: 20, y: 9 },
  { x: 21, y: 10 }, { x: 22, y: 10 }, { x: 23, y: 10 },
];

pathCoordinates.forEach(p => {
  if (p.y >= 0 && p.y < MAP_HEIGHT && p.x >= 0 && p.x < MAP_WIDTH) {
    tiles[p.y][p.x] = { ...dirtPathTile };
  }
});

// 3. Scatter dense trees and rocks to create a forest maze feel
const obstaclePositions: Position[] = [
  { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 },
  { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
  { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 },
  { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 },
  { x: 10, y: 4 }, { x: 11, y: 4 }, { x: 12, y: 4 },
  { x: 13, y: 3 }, { x: 14, y: 3 }, { x: 15, y: 3 },
  { x: 17, y: 2 }, { x: 18, y: 2 }, { x: 19, y: 2 },
  { x: 20, y: 3 }, { x: 21, y: 3 }, { x: 22, y: 3 },
  { x: 23, y: 4 }, { x: 23, y: 5 }, { x: 23, y: 6 },

  { x: 2, y: 12 }, { x: 3, y: 12 }, { x: 4, y: 12 },
  { x: 5, y: 13 }, { x: 6, y: 13 }, { x: 7, y: 13 },
  { x: 8, y: 14 }, { x: 9, y: 14 }, { x: 10, y: 14 },
  { x: 11, y: 15 }, { x: 12, y: 15 }, { x: 13, y: 15 },
  { x: 14, y: 16 }, { x: 15, y: 16 }, { x: 16, y: 16 },
  { x: 17, y: 17 }, { x: 18, y: 17 }, { x: 19, y: 17 },
  { x: 20, y: 18 }, { x: 21, y: 18 }, { x: 22, y: 18 },
  { x: 23, y: 17 }, { x: 23, y: 16 }, { x: 23, y: 15 },

  // Rocks
  { x: 10, y: 1 }, { x: 11, y: 1 },
  { x: 1, y: 15 }, { x: 1, y: 16 },
  { x: 20, y: 6 }, { x: 21, y: 6 },
  { x: 15, y: 11 }, { x: 16, y: 11 },
];

obstaclePositions.forEach(p => {
  if (p.y > 0 && p.y < MAP_HEIGHT - 1 && p.x > 0 && p.x < MAP_WIDTH - 1) { // Ensure not overwriting border exits
    if (Math.random() < 0.7) { // More trees
      tiles[p.y][p.x] = { ...denseTreesTile };
    } else { // Some rocks
      tiles[p.y][p.x] = { ...rockTile };
    }
  }
});


// 4. NPCs
const npcs: NPC[] = [
  {
    id: 'npc_binary_bard',
    name: 'Binary Bard',
    position: { x: 5, y: 5 },
    role: 'bard' as NPCRole,
    dialogueId: 'bard_intro',
    statusEffects: [],
  },
  {
    id: 'npc_data_druid',
    name: 'Data Druid',
    position: { x: 18, y: 4 },
    role: 'wizard' as NPCRole,
    dialogueId: 'druid_intro',
    statusEffects: [],
  },
  {
    id: 'npc_circuit_sage',
    name: 'Circuit Sage',
    position: { x: 7, y: 15 },
    role: 'wizard' as NPCRole,
    dialogueId: 'sage_intro',
    statusEffects: [],
  },
  {
    id: 'npc_lost_debugger',
    name: 'Lost Debugger',
    position: { x: 12, y: 10 },
    role: 'debugger' as NPCRole,
    dialogueId: 'debugger_lost',
    statusEffects: [],
  },
  {
    id: 'npc_bit_merchant',
    name: 'Bit Merchant',
    position: { x: 20, y: 15 },
    role: 'merchant' as NPCRole,
    dialogueId: 'bit_merchant_intro',
    statusEffects: [],
    factionId: 'order', // Affiliated with Order of Clean Code
  },
  {
    id: 'elder_binary_oak',
    name: 'Elder Binary Oak',
    position: { x: 15, y: 8 },
    role: 'quest_giver' as NPCRole,
    dialogueId: 'elder_oak_intro', // Default dialogue
    statusEffects: [],
  },
];

// 5. Enemies
const enemies: Enemy[] = [
  new EnemyClass('enemy_runtime_error_01', EnemyVariant.RuntimeError, { x: 4, y: 10 }),
  new EnemyClass('enemy_null_pointer_01', EnemyVariant.NullPointer, { x: 8, y: 3 }),
  new EnemyClass('enemy_runtime_error_02', EnemyVariant.RuntimeError, { x: 10, y: 7 }),
  new EnemyClass('enemy_null_pointer_02', EnemyVariant.NullPointer, { x: 20, y: 10 }),
  new EnemyClass('enemy_runtime_error_03', EnemyVariant.RuntimeError, { x: 16, y: 17 }),
  new EnemyClass('enemy_null_pointer_03', EnemyVariant.NullPointer, { x: 1, y: 14 }),
];

// 6. Items
const items: Item[] = [
  { ...ItemClass.createItem(ItemVariant.LogicAnalyzer), id: 'logic_analyzer_01', position: { x: 13, y: 10 } },
  { ...ItemClass.createItem(ItemVariant.DebugBlade), id: 'debug_blade_01', position: { x: 22, y: 7 } },
  { ...ItemClass.createItem(ItemVariant.BinaryShield), id: 'binary_shield_01', position: { x: 3, y: 17 } },
  { ...ItemClass.createItem(ItemVariant.UltraPotion), id: 'ultra_potion_01', position: { x: 10, y: 1 } },
  { ...ItemClass.createItem(ItemVariant.HealthPotion), id: 'health_potion_bf_01', position: { x: 2, y: 8 } },
  { ...ItemClass.createItem(ItemVariant.EnergyDrink), id: 'energy_drink_bf_01', position: { x: 15, y: 12 } },
  { ...ItemClass.createItem(ItemVariant.HealthPotion), id: 'health_potion_bf_02', position: { x: 18, y: 18 } },
  { ...ItemClass.createItem(ItemVariant.EnergyDrink), id: 'energy_drink_bf_02', position: { x: 6, y: 1 } },
];

// 7. Exits
const exits: Exit[] = [
  {
    position: { x: 0, y: 10 },
    targetMapId: 'terminalTown',
    targetPosition: { x: 18, y: 7 }, // Back to Terminal Town's exit point (x: 18 since Terminal Town width is 20)
  },
  {
    position: { x: MAP_WIDTH - 1, y: 10 },
    targetMapId: 'debugDungeon', // New map to be created later
    targetPosition: { x: 0, y: 10 }, // Appears at the left edge of Data Caverns
  },
];

// Set the exit tile type for visual representation on the map
exits.forEach(exit => {
  if (exit.position.y >= 0 && exit.position.y < MAP_HEIGHT && exit.position.x >= 0 && exit.position.x < MAP_WIDTH) {
    tiles[exit.position.y][exit.position.x] = { ...exitTile };
  }
});

// --- SECRET AREAS ---

// Secret 1: Hidden Grove with Legendary Equipment (20,5)
// Create a false tree wall that can be walked through
tiles[5][20] = { 
  walkable: true,
  type: 'tree' as TileType,
};

// Hidden grove area (21-23, 4-6)
for (let y = 4; y <= 6; y++) {
  for (let x = 21; x <= 23; x++) {
    if (x < MAP_WIDTH && y < MAP_HEIGHT) {
      tiles[y][x] = { ...forestFloorTile };
    }
  }
}

// Peaceful fountain in the center
tiles[5][22] = { 
  walkable: true, 
  type: 'water' as TileType,
};

// Secret 2: Tree Push Puzzle (12,10)
// Three pushable trees with visual hints
const pushableTrees: Position[] = [
  { x: 11, y: 9 },
  { x: 13, y: 9 },
  { x: 12, y: 11 },
];

pushableTrees.forEach((pos, _index) => {
  tiles[pos.y][pos.x] = {
    walkable: false,
    type: 'tree' as TileType,
  };
});

// Secret trainer location (initially blocked)
tiles[10][12] = { 
  ...forestFloorTile,
};

// Secret 3: Waterfall Cache (22,11)
// The water tile is walkable and leads to treasure
tiles[11][22] = {
  walkable: true,
  type: 'water' as TileType,
};

// Add secret NPCs
const secretNpcs: NPC[] = [
  {
    id: 'elder_willow',
    name: 'Elder Willow',
    role: 'trainer' as NPCRole,
    dialogueId: 'dialogue_elder_willow',
    position: { x: 12, y: 10 },
    statusEffects: [],
  },
  {
    id: 'forest_spirit',
    name: 'Forest Spirit',
    role: 'quest_giver' as NPCRole,
    dialogueId: 'dialogue_forest_spirit',
    position: { x: 22, y: 5 },
    statusEffects: [],
  },
];

// Add legendary items
const legendaryItems: Item[] = [
  { 
    ...ItemClass.createItem(ItemVariant.DebuggerBlade),
    id: 'natures_wrath',
    position: { x: 22, y: 4 },
  },
  {
    ...ItemClass.createItem(ItemVariant.HealthPotion),
    id: 'forest_gem',
    position: { x: 22, y: 11 },
  },
  {
    ...ItemClass.createItem(ItemVariant.FirewallArmor),
    id: 'bark_armor',
    position: { x: 23, y: 5 },
  },
];

// Add all secret entities to the main arrays
npcs.push(...secretNpcs);
items.push(...legendaryItems);

export const binaryForestData: IGameMap = {
  id: 'binaryForest',
  name: 'Binary Forest',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  tiles: tiles,
  entities: [...npcs, ...enemies, ...items],
  exits: exits,
};