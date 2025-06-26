// src/assets/maps/terminalTown.ts

import { GameMap as IGameMap, TileType, NPC, Enemy, Item } from '../../types/global.types';

// Terminal Town - The starting town for our adventure
export const terminalTownData: IGameMap = {
  id: 'terminalTown',
  name: 'Terminal Town',
  width: 100,
  height: 100,
  startPosition: { x: 50, y: 50 },
  tiles: Array(100).fill(null).map(() => 
    Array(100).fill(null).map((_, x) => {
      // Create a basic town layout
      // Border walls
      if (x === 0 || x === 99) {
        return { type: 'wall' as TileType, walkable: false };
      }
      // Most tiles are walkable floor
      return { type: 'floor' as TileType, walkable: true };
    })
  ).map((row, y) => {
    // Add top and bottom walls
    if (y === 0 || y === 99) {
      return row.map(() => ({ type: 'wall' as TileType, walkable: false }));
    }
    
    // Add some buildings (non-walkable areas)
    // Building 1: Shop (20,20 to 30,30)
    if (y >= 20 && y <= 30) {
      return row.map((tile, x) => {
        if (x >= 20 && x <= 30) {
          return { type: 'wall' as TileType, walkable: false };
        }
        return tile;
      });
    }
    
    // Building 2: Inn (60,20 to 70,30)
    if (y >= 20 && y <= 30) {
      return row.map((tile, x) => {
        if (x >= 60 && x <= 70) {
          return { type: 'wall' as TileType, walkable: false };
        }
        return tile;
      });
    }
    
    // Building 3: House (20,60 to 30,70)
    if (y >= 60 && y <= 70) {
      return row.map((tile, x) => {
        if (x >= 20 && x <= 30) {
          return { type: 'wall' as TileType, walkable: false };
        }
        return tile;
      });
    }
    
    // Building 4: House (60,60 to 70,70)
    if (y >= 60 && y <= 70) {
      return row.map((tile, x) => {
        if (x >= 60 && x <= 70) {
          return { type: 'wall' as TileType, walkable: false };
        }
        return tile;
      });
    }
    
    // Central fountain area (45,45 to 55,55)
    if (y >= 45 && y <= 55) {
      return row.map((tile, x) => {
        if (x >= 45 && x <= 55) {
          return { type: 'water' as TileType, walkable: false };
        }
        return tile;
      });
    }
    
    return row;
  }),
  npcs: [
    {
      id: 'npc_bit_merchant',
      name: 'Bit Merchant',
      role: 'merchant',
      position: { x: 35, y: 25 },
      dialogueId: 'bit_merchant_intro',
      sprite: 'merchant'
    },
    {
      id: 'npc_memory_merchant',
      name: 'Memory Merchant',
      role: 'merchant',
      position: { x: 75, y: 25 },
      dialogueId: 'memory_merchant_intro',
      sprite: 'merchant'
    },
    {
      id: 'npc_compiler_cat',
      name: 'Compiler Cat',
      role: 'special',
      position: { x: 50, y: 40 },
      dialogueId: 'compiler_cat',
      sprite: 'cat'
    },
    {
      id: 'npc_debugger',
      name: 'The Great Debugger',
      role: 'quest_giver',
      position: { x: 50, y: 60 },
      dialogueId: 'debugger_intro',
      sprite: 'wizard'
    },
    {
      id: 'npc_binary_bard',
      name: 'Binary Bard',
      role: 'quest_giver',
      position: { x: 40, y: 50 },
      dialogueId: 'binary_bard_intro',
      sprite: 'bard'
    }
  ] as NPC[],
  enemies: [
    {
      id: 'enemy_minor_bug_1',
      name: 'Minor Bug',
      type: 'bug',
      level: 1,
      position: { x: 80, y: 80 },
      stats: {
        hp: 20,
        maxHp: 20,
        energy: 10,
        maxEnergy: 10,
        attack: 5,
        defense: 2,
        speed: 3,
        critChance: 0.05,
        critDamage: 1.5
      },
      abilities: [],
      loot: [],
      expReward: 10,
      statusEffects: []
    },
    {
      id: 'enemy_minor_bug_2',
      name: 'Minor Bug',
      type: 'bug',
      level: 1,
      position: { x: 85, y: 85 },
      stats: {
        hp: 20,
        maxHp: 20,
        energy: 10,
        maxEnergy: 10,
        attack: 5,
        defense: 2,
        speed: 3,
        critChance: 0.05,
        critDamage: 1.5
      },
      abilities: [],
      loot: [],
      expReward: 10,
      statusEffects: []
    }
  ] as Enemy[],
  items: [
    {
      id: 'potion_hp_1',
      name: 'Debug Potion',
      type: 'consumable',
      description: 'Restores 50 HP',
      effect: 'restoreHp',
      value: 50,
      position: { x: 55, y: 50 }
    }
  ] as Item[],
  exits: [
    {
      position: { x: 50, y: 0 },
      targetMap: 'binaryForest',
      targetPosition: { x: 50, y: 95 },
      direction: 'north'
    },
    {
      position: { x: 0, y: 50 },
      targetMap: 'debugDungeon',
      targetPosition: { x: 95, y: 50 },
      direction: 'west'
    }
  ],
  // Combined entities array (required by GameMap interface)
  entities: []
};

// Populate the entities array with all NPCs, enemies, and items
terminalTownData.entities = [
  ...terminalTownData.npcs!,
  ...terminalTownData.enemies!,
  ...terminalTownData.items!
];