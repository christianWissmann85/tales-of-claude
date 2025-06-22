// src/assets/maps/terminalTown.ts

import { Position, Tile, TileType, Exit, Enemy, NPC, Item, GameMap as IGameMap } from '../../types/global.types';
import { GameMap } from '../../models/Map'; // Import GameMap class as requested
import { Enemy as EnemyClass, EnemyVariant } from '../../models/Enemy'; // Import Enemy class and EnemyVariant
import { Item as ItemClass, ItemVariant } from '../../models/Item'; // Import Item class and ItemVariant for creating items

const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;

// Define common tile types for clarity and reusability
const grassTile: Tile = { walkable: true, type: 'grass' };
const treeTile: Tile = { walkable: false, type: 'tree' };
const wallTile: Tile = { walkable: false, type: 'wall' };
const doorTile: Tile = { walkable: true, type: 'door' };
const exitTile: Tile = { walkable: true, type: 'exit' }; // Visual indicator for exit points

// Initialize all tiles as grass to form the base ground
const tiles: Tile[][] = Array.from({ length: MAP_HEIGHT }, () =>
  Array.from({ length: MAP_WIDTH }, () => ({ ...grassTile })),
);

// --- Layout Design ---

// 1. Trees around the edges for boundaries
for (let y = 0; y < MAP_HEIGHT; y++) {
  tiles[y][0] = { ...treeTile }; // Left border
  tiles[y][MAP_WIDTH - 1] = { ...treeTile }; // Right border
}
for (let x = 0; x < MAP_WIDTH; x++) {
  tiles[0][x] = { ...treeTile }; // Top border
  tiles[MAP_HEIGHT - 1][x] = { ...treeTile }; // Bottom border
}

// 2. A few buildings (walls with door tiles)

// Debugger's Hut (a cozy shop/healer building)
// Walls: from (7,4) to (9,6)
for (let y = 4; y <= 6; y++) {
  for (let x = 7; x <= 9; x++) {
    tiles[y][x] = { ...wallTile };
  }
}
tiles[6][8] = { ...doorTile }; // Door at (8,6)

// Archive Building (a place for lore or quests)
// Walls: from (12,9) to (14,11)
for (let y = 9; y <= 11; y++) {
  for (let x = 12; x <= 14; x++) {
    tiles[y][x] = { ...wallTile };
  }
}
tiles[11][13] = { ...doorTile }; // Door at (13,11)

// 3. Town square in center with grass tiles
// The buildings are strategically placed to leave a large, open grass area in the center,
// creating a welcoming town square feel.

// 4. NPCs: The Great Debugger and another friendly face
const npcs: NPC[] = [
  {
    id: 'npc_debugger_great',
    name: 'The Great Debugger',
    position: { x: 10, y: 5 }, // Position as required by the prompt
    role: 'debugger', // Aligns with GDD for merchants/healers, fitting for a "Debugger"
    dialogueId: 'debugger_intro', // Dialogue key for this NPC
    statusEffects: [], // Initialize empty array for statusEffects as per NPC interface
  },
  {
    id: 'npc_compiler_cat',
    name: 'Compiler Cat',
    position: { x: 3, y: 10 }, // Another NPC, perhaps a save point or quest giver
    role: 'compiler_cat', // Aligns with GDD for saving game
    dialogueId: 'compiler_cat_save', // Dialogue key for this NPC
    statusEffects: [], // Initialize empty array for statusEffects as per NPC interface
  },
];

// 5. Enemies: A few to test battles
const enemies: Enemy[] = [
  new EnemyClass('enemy_basic_bug_01', EnemyVariant.BasicBug, { x: 2, y: 2 }), // Near spawn
  new EnemyClass('enemy_syntax_error_01', EnemyVariant.SyntaxError, { x: 10, y: 8 }), // Middle
  new EnemyClass('enemy_runtime_error_01', EnemyVariant.RuntimeError, { x: 17, y: 12 }), // Near edge
];

// 5.5. Items: Some pickups for the player
const items: Item[] = [
  { ...ItemClass.createItem(ItemVariant.HealthPotion), id: 'health_potion_1', position: { x: 5, y: 3 } }, // Near spawn
  { ...ItemClass.createItem(ItemVariant.EnergyDrink), id: 'energy_drink_1', position: { x: 15, y: 10 } }, // Near archive
  { ...ItemClass.createItem(ItemVariant.HealthPotion), id: 'health_potion_2', position: { x: 8, y: 12 } }, // Bottom area
];

// 6. Exit to Binary Forest on the east side
const exits: Exit[] = [
  {
    position: { x: MAP_WIDTH - 1, y: 7 }, // Rightmost edge, middle height
    targetMapId: 'binaryForest', // The ID of the map to transition to
    targetPosition: { x: 0, y: 7 }, // Player appears at the left edge of Binary Forest
  },
];

// Set the exit tile type for visual representation on the map
tiles[exits[0].position.y][exits[0].position.x] = { ...exitTile };


// --- ASCII Art Comment Showing the Layout ---
/*
// Terminal Town Map Layout (20x15)
// This map aims for a cozy starting town feel with a central open area,
// a couple of buildings, and friendly NPCs.

// Key:
// T = Tree (boundary)
// G = Grass (walkable ground, town square)
// W = Wall (part of buildings, not walkable)
// D = Door (walkable entrance to buildings)
// E = Exit (leads to Binary Forest)
// N = NPC: The Great Debugger (at 10,5)
// C = NPC: Compiler Cat (at 3,10)
// B = Enemy: Basic Bug (at 2,2)
// S = Enemy: Syntax Error (at 10,8)
// R = Enemy: Runtime Error (at 17,12)

TTTTTTTTTTTTTTTTTTTT
TGGGGGGGGGGGGGGGGGGGT
TBGGGGGGGGGGGGGGGGGGGT  <-- Basic Bug (2,2)
TGGGGGGGGGGGGGGGGGGGT
TGGGGGGWWWWGGGGGGGGGT  <-- Debugger's Hut (Walls: 7,4 to 9,6)
TGGGGGGW N WGGGGGGGGGT  <-- The Great Debugger (10,5)
TGGGGGGW D WGGGGGGGGGT  <-- Door to Debugger's Hut (8,6)
TGGGGGGWWWWGGGGGGGGGE  <-- Exit to Binary Forest (19,7)
TGGGGGGGGGSGGGGGGGGGT  <-- Syntax Error (10,8)
TGGGGGGGGGGGGWWWWGGGT  <-- Archive Building (Walls: 12,9 to 14,11)
TGCGGGGGGGGGGW G WGGGT  <-- Compiler Cat (3,10)
TGGGGGGGGGGGGW D WGGGT  <-- Door to Archive (13,11)
TGGGGGGGGGGGGWWWWGGGR  <-- Runtime Error (17,12)
TGGGGGGGGGGGGGGGGGGGT
TTTTTTTTTTTTTTTTTTTT
*/

// Export the map data conforming to the IGameMap interface

export const terminalTownData: IGameMap = {
  id: 'terminalTown',
  name: 'Terminal Town',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  tiles: tiles,
  entities: [...npcs, ...enemies, ...items], // Initial entities on the map (NPCs, Enemies, and Items)
  exits: exits,
};