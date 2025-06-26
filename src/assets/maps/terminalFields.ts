import { GameMap as IGameMap, Tile, TileType, NPC, NPCRole, Enemy, EnemyType, Item } from '../../types/global.types';

// Generate the tiles array for Terminal Fields
const generateTiles = (): Tile[][] => {
  const tiles: Tile[][] = [];
  
  // Initialize 50x50 farmland map
  for (let y = 0; y < 50; y++) {
    tiles[y] = [];
    for (let x = 0; x < 50; x++) {
      // Default to grass (farmland)
      tiles[y][x] = { type: 'grass' as TileType, walkable: true };
    }
  }
  
  // Create border with trees
  for (let x = 0; x < 50; x++) {
    tiles[0][x] = { type: 'tree' as TileType, walkable: false };
    tiles[49][x] = { type: 'tree' as TileType, walkable: false };
  }
  for (let y = 0; y < 50; y++) {
    tiles[y][0] = { type: 'tree' as TileType, walkable: false };
    tiles[y][49] = { type: 'tree' as TileType, walkable: false };
  }
  
  // Clear the exit to Terminal Town at x=0, y=25
  tiles[25][0] = { type: 'path' as TileType, walkable: true };
  tiles[25][1] = { type: 'path' as TileType, walkable: true };
  tiles[25][2] = { type: 'path' as TileType, walkable: true };
  
  // Create farm plots with different crop areas
  const cropAreas = [
    { x1: 8, y1: 8, x2: 18, y2: 15 },    // Wheat fields
    { x1: 25, y1: 10, x2: 35, y2: 18 },  // Data fruit orchards
    { x1: 8, y1: 20, x2: 20, y2: 28 },   // Logic lettuce
    { x1: 30, y1: 25, x2: 42, y2: 35 },  // Binary crops
    { x1: 12, y1: 35, x2: 25, y2: 42 },  // Algorithm tree nursery
  ];
  
  // Add storage buildings (represented as walls)
  const storageSpots = [
    { x: 10, y: 16 }, { x: 27, y: 19 }, { x: 15, y: 29 }, 
    { x: 35, y: 30 }, { x: 20, y: 38 }
  ];
  
  for (const spot of storageSpots) {
    if (spot.x > 0 && spot.x < 49 && spot.y > 0 && spot.y < 49) {
      tiles[spot.y][spot.x] = { type: 'wall' as TileType, walkable: false };
    }
  }
  
  // Create dirt paths
  // Main horizontal path
  for (let x = 5; x < 45; x++) {
    tiles[23][x] = { type: 'path' as TileType, walkable: true };
  }
  
  // Main vertical path
  for (let y = 5; y < 45; y++) {
    tiles[y][22] = { type: 'path' as TileType, walkable: true };
  }
  
  // Connecting paths
  const connectingPaths = [
    // Path to northwest field
    ...Array.from({ length: 4 }, (_, i) => ({ x: 18 + i, y: 16 })),
    ...Array.from({ length: 4 }, (_, i) => ({ x: 13, y: 16 + i })),
    // Path to southeast field
    ...Array.from({ length: 5 }, (_, i) => ({ x: 25 + i, y: 35 })),
    ...Array.from({ length: 10 }, (_, i) => ({ x: 35, y: 25 + i })),
    // Path to south field
    ...Array.from({ length: 3 }, (_, i) => ({ x: 18, y: 35 + i })),
  ];
  
  for (const path of connectingPaths) {
    if (path.x > 0 && path.x < 49 && path.y > 0 && path.y < 49) {
      tiles[path.y][path.x] = { type: 'path' as TileType, walkable: true };
    }
  }
  
  return tiles;
};

// NPCs - Farmers with agricultural dialogue
const npcs: NPC[] = [
  {
    id: 'npc_farmer_root',
    name: 'Farmer Root',
    position: { x: 13, y: 12 },
    level: 5,
    role: 'quest_giver' as NPCRole,
    dialogueId: 'farmerRoot',
    sprite: 'farmer'
  },
  {
    id: 'npc_farmer_bash',
    name: 'Farmer Bash',
    position: { x: 30, y: 14 },
    level: 6,
    role: 'quest_giver' as NPCRole,
    dialogueId: 'farmerBash',
    sprite: 'farmer'
  },
  {
    id: 'npc_harvester_pike',
    name: 'Harvester Pike',
    position: { x: 15, y: 25 },
    level: 7,
    role: 'quest_giver' as NPCRole,
    dialogueId: 'harvesterPike',
    sprite: 'farmer'
  },
  {
    id: 'npc_supervisor_grep',
    name: 'Field Supervisor Grep',
    position: { x: 32, y: 28 },
    level: 8,
    role: 'special' as NPCRole,
    dialogueId: 'supervisorGrep',
    sprite: 'supervisor'
  },
  {
    id: 'npc_farmer_nano',
    name: 'Young Farmer Nano',
    position: { x: 18, y: 38 },
    level: 3,
    role: 'quest_giver' as NPCRole,
    dialogueId: 'farmerNano',
    sprite: 'youngFarmer'
  }
];

// Enemies - Agricultural pests
const enemies: Enemy[] = [
  // Data Beetles
  {
    id: 'enemy_data_beetle_1',
    name: 'Data Beetle',
    position: { x: 16, y: 10 },
    type: 'bug' as EnemyType,
    level: 3,
    stats: {
      hp: 25,
      maxHp: 25,
      energy: 10,
      maxEnergy: 10,
      attack: 8,
      defense: 4,
      speed: 6,
      critChance: 0.05,
      critDamage: 1.5
    },
    abilities: [],
    expReward: 20,
    statusEffects: []
  },
  {
    id: 'enemy_data_beetle_2',
    name: 'Data Beetle',
    position: { x: 28, y: 16 },
    type: 'bug' as EnemyType,
    level: 3,
    stats: {
      hp: 25,
      maxHp: 25,
      energy: 10,
      maxEnergy: 10,
      attack: 8,
      defense: 4,
      speed: 6,
      critChance: 0.05,
      critDamage: 1.5
    },
    abilities: [],
    expReward: 20,
    statusEffects: []
  },
  {
    id: 'enemy_data_beetle_3',
    name: 'Data Beetle',
    position: { x: 12, y: 24 },
    type: 'bug' as EnemyType,
    level: 3,
    stats: {
      hp: 25,
      maxHp: 25,
      energy: 10,
      maxEnergy: 10,
      attack: 8,
      defense: 4,
      speed: 6,
      critChance: 0.05,
      critDamage: 1.5
    },
    abilities: [],
    expReward: 20,
    statusEffects: []
  },
  {
    id: 'enemy_data_beetle_4',
    name: 'Data Beetle',
    position: { x: 38, y: 32 },
    type: 'bug' as EnemyType,
    level: 3,
    stats: {
      hp: 25,
      maxHp: 25,
      energy: 10,
      maxEnergy: 10,
      attack: 8,
      defense: 4,
      speed: 6,
      critChance: 0.05,
      critDamage: 1.5
    },
    abilities: [],
    expReward: 20,
    statusEffects: []
  },
  // Buffer Bugs - stronger pests
  {
    id: 'enemy_buffer_bug_1',
    name: 'Buffer Bug',
    position: { x: 20, y: 13 },
    type: 'bug' as EnemyType,
    level: 4,
    stats: {
      hp: 35,
      maxHp: 35,
      energy: 15,
      maxEnergy: 15,
      attack: 12,
      defense: 6,
      speed: 5,
      critChance: 0.08,
      critDamage: 1.6
    },
    abilities: [],
    expReward: 30,
    statusEffects: []
  },
  {
    id: 'enemy_buffer_bug_2',
    name: 'Buffer Bug',
    position: { x: 33, y: 22 },
    type: 'bug' as EnemyType,
    level: 4,
    stats: {
      hp: 35,
      maxHp: 35,
      energy: 15,
      maxEnergy: 15,
      attack: 12,
      defense: 6,
      speed: 5,
      critChance: 0.08,
      critDamage: 1.6
    },
    abilities: [],
    expReward: 30,
    statusEffects: []
  },
  {
    id: 'enemy_buffer_bug_3',
    name: 'Buffer Bug',
    position: { x: 17, y: 32 },
    type: 'bug' as EnemyType,
    level: 4,
    stats: {
      hp: 35,
      maxHp: 35,
      energy: 15,
      maxEnergy: 15,
      attack: 12,
      defense: 6,
      speed: 5,
      critChance: 0.08,
      critDamage: 1.6
    },
    abilities: [],
    expReward: 30,
    statusEffects: []
  },
  // Malware Mites - tiny but numerous
  {
    id: 'enemy_malware_mite_1',
    name: 'Malware Mite',
    position: { x: 25, y: 12 },
    type: 'virus' as EnemyType,
    level: 2,
    stats: {
      hp: 15,
      maxHp: 15,
      energy: 8,
      maxEnergy: 8,
      attack: 6,
      defense: 2,
      speed: 8,
      critChance: 0.1,
      critDamage: 1.5
    },
    abilities: [],
    expReward: 15,
    statusEffects: []
  },
  {
    id: 'enemy_malware_mite_2',
    name: 'Malware Mite',
    position: { x: 14, y: 18 },
    type: 'virus' as EnemyType,
    level: 2,
    stats: {
      hp: 15,
      maxHp: 15,
      energy: 8,
      maxEnergy: 8,
      attack: 6,
      defense: 2,
      speed: 8,
      critChance: 0.1,
      critDamage: 1.5
    },
    abilities: [],
    expReward: 15,
    statusEffects: []
  },
  {
    id: 'enemy_malware_mite_3',
    name: 'Malware Mite',
    position: { x: 36, y: 28 },
    type: 'virus' as EnemyType,
    level: 2,
    stats: {
      hp: 15,
      maxHp: 15,
      energy: 8,
      maxEnergy: 8,
      attack: 6,
      defense: 2,
      speed: 8,
      critChance: 0.1,
      critDamage: 1.5
    },
    abilities: [],
    expReward: 15,
    statusEffects: []
  },
  {
    id: 'enemy_malware_mite_4',
    name: 'Malware Mite',
    position: { x: 22, y: 36 },
    type: 'virus' as EnemyType,
    level: 2,
    stats: {
      hp: 15,
      maxHp: 15,
      energy: 8,
      maxEnergy: 8,
      attack: 6,
      defense: 2,
      speed: 8,
      critChance: 0.1,
      critDamage: 1.5
    },
    abilities: [],
    expReward: 15,
    statusEffects: []
  }
];

// Items - Resources and farming supplies
const items: Item[] = [
  // Memory crystals
  {
    id: 'memoryCrystal1',
    name: 'Memory Crystal',
    position: { x: 11, y: 14 },
    type: 'misc',
    effect: 'none',
    value: 100,
    description: 'A crystallized fragment of pure data'
  },
  {
    id: 'memoryCrystal2',
    name: 'Memory Crystal',
    position: { x: 29, y: 17 },
    type: 'misc',
    effect: 'none',
    value: 100,
    description: 'A crystallized fragment of pure data'
  },
  {
    id: 'memoryCrystal3',
    name: 'Memory Crystal',
    position: { x: 19, y: 26 },
    type: 'misc',
    effect: 'none',
    value: 100,
    description: 'A crystallized fragment of pure data'
  },
  // Fresh produce
  {
    id: 'digitalWheat',
    name: 'Digital Wheat',
    position: { x: 15, y: 11 },
    type: 'consumable',
    effect: 'heal',
    value: 20,
    description: 'Freshly harvested algorithm grain - restores 20 HP'
  },
  {
    id: 'dataFruit',
    name: 'Data Fruit',
    position: { x: 31, y: 15 },
    type: 'consumable',
    effect: 'heal',
    value: 25,
    description: 'Sweet fruit infused with processed information - restores 25 HP'
  },
  {
    id: 'binaryBerries',
    name: 'Binary Berries',
    position: { x: 13, y: 27 },
    type: 'consumable',
    effect: 'heal',
    value: 15,
    description: 'Tiny berries that sparkle with ones and zeros - restores 15 HP'
  },
  {
    id: 'logicLettuce',
    name: 'Logic Lettuce',
    position: { x: 37, y: 31 },
    type: 'consumable',
    effect: 'heal',
    value: 20,
    description: 'Crisp greens that sharpen mental processing - restores 20 HP'
  },
  // Farming tools
  {
    id: 'rustyHoe',
    name: 'Rusty Hoe',
    position: { x: 27, y: 20 },
    type: 'weapon',
    effect: 'attack',
    value: 10,
    description: 'An old farming tool, still functional for combat'
  },
  {
    id: 'seedPacket',
    name: 'Seed Packet',
    position: { x: 16, y: 30 },
    type: 'misc',
    effect: 'none',
    value: 50,
    description: 'Contains rare optimization seeds'
  },
  {
    id: 'fertilizerBag',
    name: 'Fertilizer Bag',
    position: { x: 34, y: 33 },
    type: 'misc',
    effect: 'none',
    value: 75,
    description: 'Compressed nutrient data for growing crops'
  },
  // Valuable finds
  {
    id: 'databaseFragment',
    name: 'Ancient Database Fragment',
    position: { x: 21, y: 19 },
    type: 'misc',
    effect: 'none',
    value: 200,
    description: 'A piece of old-world knowledge'
  },
  {
    id: 'quantumCompost',
    name: 'Quantum Compost',
    position: { x: 23, y: 34 },
    type: 'misc',
    effect: 'none',
    value: 150,
    description: 'Superposition fertilizer - exists in all growth states'
  }
];

export const terminalFieldsData: IGameMap = {
  id: 'terminalFields',
  name: 'Terminal Fields',
  width: 50,
  height: 50,
  startPosition: { x: 5, y: 25 },
  tiles: generateTiles(),
  npcs: npcs,
  enemies: enemies,
  items: items,
  exits: [
    {
      position: { x: 0, y: 25 },
      targetMapId: 'terminalTown',
      targetPosition: { x: 95, y: 50 }
    }
  ],
  entities: []
};

// Populate entities array
terminalFieldsData.entities = [...npcs, ...enemies, ...items];