// src/assets/maps/debugDungeon.ts

import { Position, Tile, TileType, Exit, Enemy, NPC, Item, GameMap as IGameMap } from '../../types/global.types';
import { GameMap } from '../../models/Map';
import { Enemy as EnemyClass, EnemyVariant } from '../../models/Enemy';
import { Item as ItemClass, ItemVariant } from '../../models/Item';

const MAP_WIDTH = 20;
const MAP_HEIGHT = 20;

// Define common tile types for clarity and reusability
const wallTile: Tile = { walkable: false, type: 'wall' }; // Dungeon walls
const floorTile: Tile = { walkable: true, type: 'dungeon_floor' }; // Dungeon floor
const exitTile: Tile = { walkable: true, type: 'exit' }; // Visual indicator for exit points
const lockedDoorTile: Tile = { walkable: false, type: 'locked_door' }; // For future expansion

// Initialize all tiles as dungeon_floor to form the base ground
const tiles: Tile[][] = Array.from({ length: MAP_HEIGHT }, () =>
  Array.from({ length: MAP_WIDTH }, () => ({ ...floorTile })),
);

// --- Layout Design ---

// Function to draw a rectangle of walls
function drawRectWalls(x1: number, y1: number, x2: number, y2: number) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      if (x === x1 || x === x2 || y === y1 || y === y2) {
        tiles[y][x] = { ...wallTile };
      }
    }
  }
}

// Function to draw a filled rectangle (for rooms)
function fillRect(x1: number, y1: number, x2: number, y2: number, tile: Tile) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      tiles[y][x] = { ...tile };
    }
  }
}

// 1. Outer walls
for (let y = 0; y < MAP_HEIGHT; y++) {
  tiles[y][0] = { ...wallTile }; // Left border
  tiles[y][MAP_WIDTH - 1] = { ...wallTile }; // Right border
}
for (let x = 0; x < MAP_WIDTH; x++) {
  tiles[0][x] = { ...wallTile }; // Top border
  tiles[MAP_HEIGHT - 1][x] = { ...wallTile }; // Bottom border
}

// 2. Internal Walls and Rooms
// Create main vertical corridor walls
for (let y = 1; y < MAP_HEIGHT - 1; y++) {
  if (y < 6 || y > 6 && y < 14 || y > 16) { // Breaks for locked door and boss room entrance
    tiles[y][8] = { ...wallTile };
    tiles[y][11] = { ...wallTile };
  }
}

// Create main horizontal corridor walls
for (let x = 1; x < MAP_WIDTH - 1; x++) {
  if (x < 8 || x > 11) { // Breaks for vertical corridor
    tiles[2][x] = { ...wallTile };
    tiles[17][x] = { ...wallTile };
  }
}

// Connect vertical walls to outer walls for room boundaries
for (let y = 2; y <= 17; y++) {
    if (y !== 7 && y !== 8 && y !== 14) { // Don't overwrite main horizontal path
        tiles[y][2] = { ...wallTile }; // Leftmost internal vertical wall
        tiles[y][17] = { ...wallTile }; // Rightmost internal vertical wall
    }
}

// Room 1 (Top-Left)
drawRectWalls(2, 3, 8, 6);
fillRect(3, 4, 7, 5, floorTile); // Fill inside with floor

// Room 2 (Top-Right)
drawRectWalls(11, 3, 17, 6);
fillRect(12, 4, 16, 5, floorTile); // Fill inside with floor

// Room 3 (Mid-Left)
drawRectWalls(2, 9, 8, 13);
fillRect(3, 10, 7, 12, floorTile); // Fill inside with floor

// Room 4 (Mid-Right)
drawRectWalls(11, 9, 17, 13);
fillRect(12, 10, 16, 12, floorTile); // Fill inside with floor

// Boss Room (Center-Bottom)
drawRectWalls(8, 14, 12, 17);
fillRect(9, 15, 10, 16, floorTile); // Fill inside with floor

// Open paths/doors to rooms and corridors
tiles[3][8] = { ...floorTile }; // Path to R1
tiles[3][11] = { ...floorTile }; // Path to R2
tiles[10][8] = { ...floorTile }; // Path to R3
tiles[10][11] = { ...floorTile }; // Path to R4
tiles[14][9] = { ...floorTile }; // Path to Boss Room
tiles[14][10] = { ...floorTile }; // Path to Boss Room

// Locked door - make it actually block the path at {x: 9, y: 6}
tiles[6][9] = { ...lockedDoorTile }; // Already correctly set to walkable: false

// Ensure central horizontal path is clear
for (let x = 1; x < MAP_WIDTH - 1; x++) {
    if (x < 8 || x > 11) { // Clear path, but keep central vertical walls
        tiles[7][x] = { ...floorTile };
        tiles[8][x] = { ...floorTile };
    }
}

// 3. NPCs
const npcs: NPC[] = [
  {
    id: 'npc_imprisoned_program',
    name: 'Imprisoned Program',
    position: { x: 3, y: 11 }, // In Room 3
    role: 'quest_giver',
    dialogueId: 'imprisoned_program_intro',
    statusEffects: [],
  },
  // New NPCs
  {
    id: 'npc_memory_leak',
    name: 'Memory Leak',
    position: { x: 6, y: 16 }, // Near boss room entrance
    role: 'quest_giver',
    dialogueId: 'memory_leak_warning',
    statusEffects: [],
  },
  {
    id: 'npc_corrupted_core',
    name: 'Corrupted Core',
    position: { x: 16, y: 12 }, // In Room 4
    role: 'quest_giver',
    dialogueId: 'corrupted_core_hints',
    statusEffects: [],
  },
];

// 4. Enemies
const enemies: Enemy[] = [
  // Stronger enemies in various rooms/corridors
  new EnemyClass('enemy_runtime_error_01', EnemyVariant.RuntimeError, { x: 5, y: 4 }), // Room 1
  new EnemyClass('enemy_null_pointer_01', EnemyVariant.NullPointer, { x: 14, y: 5 }), // Room 2
  new EnemyClass('enemy_runtime_error_02', EnemyVariant.RuntimeError, { x: 14, y: 11 }), // Room 4
  new EnemyClass('enemy_syntax_error_01', EnemyVariant.SyntaxError, { x: 5, y: 7 }), // Corridor
  new EnemyClass('enemy_basic_bug_01', EnemyVariant.BasicBug, { x: 15, y: 7 }), // Corridor

  // New challenging enemy placements
  new EnemyClass('enemy_runtime_error_03', EnemyVariant.RuntimeError, { x: 7, y: 14 }), // Corridor leading to boss
  new EnemyClass('enemy_null_pointer_02', EnemyVariant.NullPointer, { x: 12, y: 14 }), // Corridor leading to boss
  new EnemyClass('enemy_runtime_error_04', EnemyVariant.RuntimeError, { x: 10, y: 7 }), // Central corridor

  // Boss: Segfault Sovereign
  new EnemyClass('boss_segfault_sovereign', EnemyVariant.SegfaultSovereign, { x: 9, y: 15 }), // Replaced NullPointer mini-boss
];

// 5. Loot (multiple items)
const items: Item[] = [
  { ...ItemClass.createItem(ItemVariant.HealthPotion), id: 'dd_health_potion_1', position: { x: 4, y: 4 } }, // Room 1
  { ...ItemClass.createItem(ItemVariant.EnergyDrink), id: 'dd_energy_drink_1', position: { x: 15, y: 4 } }, // Room 2
  { ...ItemClass.createItem(ItemVariant.HealthPotion), id: 'dd_health_potion_2', position: { x: 6, y: 11 } }, // Room 3
  { ...ItemClass.createItem(ItemVariant.EnergyDrink), id: 'dd_energy_drink_2', position: { x: 13, y: 11 } }, // Room 4

  // New rare equipment
  { ...ItemClass.createItem(ItemVariant.DebugBlade), id: 'dd_debug_blade', position: { x: 6, y: 4 } }, // Room 1
  { ...ItemClass.createItem(ItemVariant.BinaryShield), id: 'dd_binary_shield', position: { x: 13, y: 5 } }, // Room 2
  { ...ItemClass.createItem(ItemVariant.CompilersCharm), id: 'dd_compiler_charm', position: { x: 11, y: 15 } }, // Boss room
  { ...ItemClass.createItem(ItemVariant.BossKey), id: 'dd_boss_key', position: { x: 5, y: 11 } }, // Room 3

  // More Ultra Potions near boss room
  { ...ItemClass.createItem(ItemVariant.UltraPotion), id: 'dd_ultra_potion_1', position: { x: 10, y: 16 } }, // Boss Room (replaced old Health Potion)
  { ...ItemClass.createItem(ItemVariant.UltraPotion), id: 'dd_ultra_potion_2', position: { x: 9, y: 14 } }, // Just before boss room entrance
];

// 6. Exits
const exits: Exit[] = [
  {
    position: { x: 0, y: 8 }, // Leftmost edge, y=8
    targetMapId: 'binaryForest',
    targetPosition: { x: 24, y: 8 }, // Player appears at x=24 (right edge) of Binary Forest
  },
];

// Set the exit tile type for visual representation on the map
tiles[exits[0].position.y][exits[0].position.x] = { ...exitTile };


// --- ASCII Art Comment Showing the Dungeon Layout ---
/*
// Debug Dungeon Map Layout (20x20)
// A dark, dangerous dungeon where bugs are imprisoned.
// Features a central boss room, side rooms, and corridors.

// Key:
// W = Wall (not walkable)
// F = Floor (walkable dungeon floor)
// E = Exit (leads to Binary Forest)
// D = Locked Door (not walkable, at 9,6)
// B = Boss: Segfault Sovereign (at 9,15)
// L = NPC: Memory Leak (at 6,16)
// C = NPC: Corrupted Core (at 16,12)
// N = NPC: Imprisoned Program (at 3,11)
// b = Enemy: Basic Bug (at 15,7)
// s = Enemy: Syntax Error (at 5,7)
// r = Enemy: Runtime Error (at 5,4; 14,11; 7,14; 10,7)
// p = Enemy: Null Pointer (at 14,5; 12,14)
// K = Item: Boss Key (at 5,11)
// d = Item: Debug Blade (at 6,4)
// h = Item: Binary Shield (at 13,5)
// a = Item: Compiler's Charm (at 11,15)
// U = Item: Ultra Potion (at 10,16; 9,14)
// X = Item: Other Loot (Health/Energy, represented by F in ASCII, but positions are noted in code)

WWWWWWWWWWWWWWWWWWWW  (y=0)
WFFFFFFFFFFFFFFFFFFW  (y=1)
WFWWWWWWWWWWWWWWWWFW  (y=2)
WFWF r X d F  h p X F W  (y=3, r=RuntimeError, d=DebugBlade, h=BinaryShield, p=NullPointer)
WFWF X X X F  X X X F W  (y=4)
WFWF X X X F  X X X F W  (y=5)
WFWWWWWWWWDWWWWWWWFW  (y=6, D at 9,6)
WFs r r r F s b b b F W  (y=7, s=SyntaxError, r=RuntimeError, b=BasicBug)
EFFFFFFFFF  FFFFFFF W  (y=8, E at 0,8)
WFWWWWWWWF  FWWWWWFW  (y=9)
WFWF N X K F  X r X C W  (y=10, N=ImprisonedProgram, K=BossKey, r=RuntimeError, C=CorruptedCore)
WFWF X X X F  X X X F W  (y=11)
WFWF X X X F  X X X F W  (y=12)
WFWWWWWWWF  FWWWWWFW  (y=13)
WFr U F F F U p F F F W  (y=14, r=RuntimeError, U=UltraPotion, p=NullPointer)
WFWWWWWWWF B a FWWWWFW  (y=15, B=SegfaultSovereign, a=Compiler'sCharm)
WFWWWWWWWF L U FWWWWFW  (y=16, L=MemoryLeak, U=UltraPotion)
WFWWWWWWWWWWWWWWWWWWFW  (y=17)
WFFFFFFFFFFFFFFFFFFW  (y=18)
WWWWWWWWWWWWWWWWWWWW  (y=19)
*/

// Export the map data conforming to the IGameMap interface
export const debugDungeonData: IGameMap = {
  id: 'debugDungeon',
  name: 'Debug Dungeon',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  tiles: tiles,
  entities: [...npcs, ...enemies, ...items], // Initial entities on the map (NPCs, Enemies, and Items)
  exits: exits,
};