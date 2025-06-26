import { GameMap as IGameMap, Tile, TileType, NPC, NPCRole, Enemy, EnemyType, Item } from '../../types/global.types';

// Generate the tiles array
const generateTiles = (): Tile[][] => {
  const tiles: Tile[][] = [];
  
  for (let y = 0; y < 100; y++) {
    tiles[y] = [];
    for (let x = 0; x < 100; x++) {
      // Default to grass
      tiles[y][x] = { type: 'grass' as TileType, walkable: true };
      
      // Main paths
      if ((x >= 45 && x <= 55) || (y >= 45 && y <= 55)) {
        tiles[y][x] = { type: 'path' as TileType, walkable: true };
      }
      
      // Town Hall (3x3) - center north
      if (x >= 48 && x <= 50 && y >= 24 && y <= 26) {
        if (x === 48 || x === 50 || y === 24 || y === 26) {
          tiles[y][x] = { type: 'wall' as TileType, walkable: false };
        } else {
          tiles[y][x] = { type: 'floor' as TileType, walkable: true };
        }
      }
      
      // Market stalls (2x2 each) - east side
      const marketStalls = [
        { x: 70, y: 30 }, { x: 75, y: 30 }, { x: 80, y: 30 },
        { x: 70, y: 40 }, { x: 75, y: 40 }, { x: 80, y: 40 },
        { x: 70, y: 60 }, { x: 75, y: 60 }, { x: 80, y: 60 }
      ];
      
      for (const stall of marketStalls) {
        if (x >= stall.x && x <= stall.x + 1 && y >= stall.y && y <= stall.y + 1) {
          if (x === stall.x || x === stall.x + 1 || y === stall.y || y === stall.y + 1) {
            tiles[y][x] = { type: 'wall' as TileType, walkable: false };
          } else {
            tiles[y][x] = { type: 'floor' as TileType, walkable: true };
          }
        }
      }
      
      // Residential houses (2x2) - west side
      const houses = [
        { x: 15, y: 20 }, { x: 20, y: 20 }, { x: 25, y: 20 },
        { x: 15, y: 30 }, { x: 20, y: 30 }, { x: 25, y: 30 },
        { x: 15, y: 40 }, { x: 20, y: 40 }, { x: 25, y: 40 },
        { x: 15, y: 50 }, { x: 20, y: 50 }, { x: 25, y: 50 },
        { x: 15, y: 60 }, { x: 20, y: 60 }, { x: 25, y: 60 }
      ];
      
      for (const house of houses) {
        if (x >= house.x && x <= house.x + 1 && y >= house.y && y <= house.y + 1) {
          if (x === house.x || x === house.x + 1 || y === house.y || y === house.y + 1) {
            tiles[y][x] = { type: 'wall' as TileType, walkable: false };
          } else {
            tiles[y][x] = { type: 'floor' as TileType, walkable: true };
          }
        }
      }
      
      // Fountain (5x5) - center
      if (x >= 48 && x <= 52 && y >= 48 && y <= 52) {
        if (x === 50 && y === 50) {
          tiles[y][x] = { type: 'water' as TileType, walkable: false };
        } else if ((x >= 49 && x <= 51) && (y >= 49 && y <= 51)) {
          tiles[y][x] = { type: 'water' as TileType, walkable: false };
        } else {
          tiles[y][x] = { type: 'path' as TileType, walkable: true };
        }
      }
      
      // Park area - south
      if (y >= 65 && y <= 85) {
        // Trees scattered throughout park
        if ((x === 20 && y === 70) || (x === 25 && y === 75) || (x === 30 && y === 68) ||
            (x === 35 && y === 80) || (x === 40 && y === 72) || (x === 45 && y === 78) ||
            (x === 55 && y === 75) || (x === 60 && y === 70) || (x === 65 && y === 82) ||
            (x === 70 && y === 68) || (x === 75 && y === 76)) {
          tiles[y][x] = { type: 'tree' as TileType, walkable: false };
        }
        
        // Benches (represented as path)
        if ((x >= 42 && x <= 44 && y === 82) || (x >= 56 && x <= 58 && y === 82) ||
            (x >= 30 && x <= 32 && y === 77) || (x >= 67 && x <= 69 && y === 77)) {
          tiles[y][x] = { type: 'path' as TileType, walkable: true };
        }
      }
      
      // Border walls
      if (x === 0 || x === 99 || y === 0 || y === 99) {
        // Leave exits open
        if (!((x === 50 && y === 0) || (x === 0 && y === 50) || (x === 99 && y === 50))) {
          tiles[y][x] = { type: 'wall' as TileType, walkable: false };
        }
      }
    }
  }
  
  return tiles;
};

// NPCs
const npcs: NPC[] = [
  {
    id: 'npc_mayor',
    name: 'Mayor Mainframe',
    position: { x: 49, y: 25 },
    level: 15,
    role: 'special' as NPCRole,
    dialogueId: 'mayor',
    sprite: 'mayor'
  },
  {
    id: 'npc_bit_merchant',
    name: 'Bit Merchant',
    position: { x: 71, y: 31 },
    level: 8,
    role: 'merchant' as NPCRole,
    dialogueId: 'bitMerchant',
    sprite: 'merchant'
  },
  {
    id: 'npc_memory_merchant',
    name: 'Memory Merchant',
    position: { x: 76, y: 31 },
    level: 10,
    role: 'merchant' as NPCRole,
    dialogueId: 'memoryMerchant',
    sprite: 'merchant'
  },
  {
    id: 'npc_compiler_cat',
    name: 'Compiler Cat',
    position: { x: 47, y: 50 },
    level: 12,
    role: 'special' as NPCRole,
    dialogueId: 'compilerCat',
    sprite: 'cat'
  },
  {
    id: 'npc_debugger_dan',
    name: 'Debugger Dan',
    position: { x: 53, y: 50 },
    level: 20,
    role: 'quest_giver' as NPCRole,
    dialogueId: 'debugger',
    sprite: 'debugger'
  },
  {
    id: 'npc_binary_bard',
    name: 'Binary Bard',
    position: { x: 50, y: 80 },
    level: 7,
    role: 'bard' as NPCRole,
    dialogueId: 'binaryBard',
    sprite: 'bard'
  },
  {
    id: 'npc_citizen_alice',
    name: 'Alice Algorithm',
    position: { x: 16, y: 21 },
    level: 3,
    role: 'quest_giver' as NPCRole,
    dialogueId: 'citizen1',
    sprite: 'citizen'
  },
  {
    id: 'npc_citizen_bob',
    name: 'Bob Buffer',
    position: { x: 21, y: 31 },
    level: 4,
    role: 'quest_giver' as NPCRole,
    dialogueId: 'citizen2',
    sprite: 'citizen'
  },
  {
    id: 'npc_gardener',
    name: 'Grace Grepper',
    position: { x: 50, y: 75 },
    level: 6,
    role: 'quest_giver' as NPCRole,
    dialogueId: 'gardener',
    sprite: 'gardener'
  },
  {
    id: 'npc_variable_vendor',
    name: 'Variable Vendor',
    position: { x: 81, y: 41 },
    level: 5,
    role: 'merchant' as NPCRole,
    dialogueId: 'vendor',
    sprite: 'vendor'
  }
];

// Enemies
const enemies: Enemy[] = [
  {
    id: 'enemy_corrupt_pixel_1',
    name: 'Corrupt Pixel',
    position: { x: 85, y: 15 },
    type: 'bug' as EnemyType,
    level: 1,
    stats: {
      hp: 25,
      maxHp: 25,
      energy: 10,
      maxEnergy: 10,
      attack: 8,
      defense: 3,
      speed: 5,
      critChance: 0.05,
      critDamage: 1.5
    },
    abilities: [],
    expReward: 15,
    statusEffects: []
  },
  {
    id: 'enemy_corrupt_pixel_2',
    name: 'Corrupt Pixel',
    position: { x: 12, y: 85 },
    type: 'bug' as EnemyType,
    level: 1,
    stats: {
      hp: 25,
      maxHp: 25,
      energy: 10,
      maxEnergy: 10,
      attack: 8,
      defense: 3,
      speed: 5,
      critChance: 0.05,
      critDamage: 1.5
    },
    abilities: [],
    expReward: 15,
    statusEffects: []
  },
  {
    id: 'enemy_virus_spawn_1',
    name: 'Virus Spawn',
    position: { x: 90, y: 90 },
    type: 'virus' as EnemyType,
    level: 2,
    stats: {
      hp: 35,
      maxHp: 35,
      energy: 15,
      maxEnergy: 15,
      attack: 12,
      defense: 5,
      speed: 4,
      critChance: 0.08,
      critDamage: 1.6
    },
    abilities: [],
    expReward: 25,
    statusEffects: []
  },
  {
    id: 'enemy_virus_spawn_2',
    name: 'Virus Spawn',
    position: { x: 8, y: 8 },
    type: 'virus' as EnemyType,
    level: 2,
    stats: {
      hp: 35,
      maxHp: 35,
      energy: 15,
      maxEnergy: 15,
      attack: 12,
      defense: 5,
      speed: 4,
      critChance: 0.08,
      critDamage: 1.6
    },
    abilities: [],
    expReward: 25,
    statusEffects: []
  }
];

// Items
const items: Item[] = [
  {
    id: 'healthPotion1',
    name: 'Debug Potion',
    position: { x: 45, y: 30 },
    type: 'consumable',
    effect: 'heal',
    value: 30,
    description: 'Restores 30 health points'
  },
  {
    id: 'healthPotion2',
    name: 'Debug Potion',
    position: { x: 65, y: 70 },
    type: 'consumable',
    effect: 'heal',
    value: 30,
    description: 'Restores 30 health points'
  },
  {
    id: 'codeSword',
    name: 'Code Sword',
    position: { x: 77, y: 61 },
    type: 'weapon',
    effect: 'attack',
    value: 15,
    description: 'A sharp blade forged from pure code'
  },
  {
    id: 'dataCrystal',
    name: 'Data Crystal',
    position: { x: 35, y: 45 },
    type: 'misc',
    effect: 'none',
    value: 100,
    description: 'A valuable crystal containing compressed data'
  },
  {
    id: 'memoryModule',
    name: 'Memory Module',
    position: { x: 28, y: 82 },
    type: 'misc',
    effect: 'none',
    value: 150,
    description: 'A rare memory module from the old systems'
  }
];

export const terminalTownData: IGameMap = {
  id: 'terminalTown',
  name: 'Terminal Town',
  width: 100,
  height: 100,
  startPosition: { x: 50, y: 35 },
  tiles: generateTiles(),
  npcs: npcs,
  enemies: enemies,
  items: items,
  exits: [
    {
      position: { x: 50, y: 0 },
      targetMapId: 'binaryForest',
      targetPosition: { x: 50, y: 95 }
    },
    {
      position: { x: 0, y: 50 },
      targetMapId: 'debugDungeon',
      targetPosition: { x: 95, y: 50 }
    },
    {
      position: { x: 99, y: 50 },
      targetMapId: 'terminalFields',
      targetPosition: { x: 5, y: 50 }
    }
  ],
  entities: []
};

// Populate entities array
terminalTownData.entities = [...npcs, ...enemies, ...items];