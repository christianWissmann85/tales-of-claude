// src/utils/mapCreator.ts

import { 
  JsonMap, 
  JsonMapTileLayer, 
  JsonMapObjectLayer, 
  JsonMapObject,
  JsonMapNPC,
  JsonMapEnemy,
  JsonMapItem,
  JsonMapExit,
} from '../types/map-schema.types';
import { TileType, NPCRole, Position } from '../types/global.types';

/**
 * Map creation utilities for generating large maps with districts and paths
 */

export interface District {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseTile: TileType;
  borderTile?: TileType;
  decorations?: Array<{ tile: TileType; density: number }>;
}

export interface MapCreatorOptions {
  id: string;
  name: string;
  width: number;
  height: number;
  defaultTile?: TileType;
  borderTile?: TileType;
  districts?: District[];
}

/**
 * Creates a new JSON map with the specified dimensions and default tiles
 */
export function createMap(options: MapCreatorOptions): JsonMap {
  const {
    id,
    name,
    width,
    height,
    defaultTile = 'grass',
    borderTile = 'tree',
    districts = [],
  } = options;

  // Initialize base layer
  const baseData: TileType[] = new Array(width * height).fill(defaultTile);
  
  // Create borders
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        baseData[y * width + x] = borderTile;
      }
    }
  }

  // Create the map structure
  const map: JsonMap = {
    version: '1.0',
    id,
    name,
    width,
    height,
    tilewidth: 32,
    tileheight: 32,
    properties: {
      music: 'ambient_theme',
      spawnPoint: { x: Math.floor(width / 2), y: Math.floor(height / 2) },
    },
    layers: [
      {
        name: 'base',
        type: 'tilelayer',
        width,
        height,
        data: baseData,
        visible: true,
        opacity: 1,
      },
      {
        name: 'collision',
        type: 'tilelayer',
        width,
        height,
        data: baseData.map(tile => {
          // Set collision based on tile type
          switch (tile) {
            case 'grass':
            case 'path':
            case 'floor':
            case 'dungeon_floor':
              return 'walkable';
            default:
              return tile;
          }
        }),
        visible: false,
        opacity: 1,
      },
      {
        name: 'objects',
        type: 'objectgroup',
        objects: [],
        visible: true,
        opacity: 1,
      },
    ],
  };

  // Add districts
  districts.forEach(district => {
    addDistrict(map, district);
  });

  return map;
}

/**
 * Adds a district to an existing map
 */
export function addDistrict(map: JsonMap, district: District): void {
  const baseLayer = map.layers.find(l => l.type === 'tilelayer' && l.name === 'base') as JsonMapTileLayer;
  const collisionLayer = map.layers.find(l => l.type === 'tilelayer' && l.name === 'collision') as JsonMapTileLayer;
  
  if (!baseLayer || !collisionLayer) { return; }

  // Fill district area
  for (let dy = 0; dy < district.height; dy++) {
    for (let dx = 0; dx < district.width; dx++) {
      const x = district.x + dx;
      const y = district.y + dy;
      
      if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
        const index = y * map.width + x;
        
        // Add border if specified
        if (district.borderTile && (
          dx === 0 || dx === district.width - 1 ||
          dy === 0 || dy === district.height - 1
        )) {
          baseLayer.data[index] = district.borderTile;
          collisionLayer.data[index] = district.borderTile;
        } else {
          baseLayer.data[index] = district.baseTile;
          collisionLayer.data[index] = district.baseTile === 'wall' ? 'wall' : 'walkable';
        }
      }
    }
  }

  // Add random decorations
  if (district.decorations) {
    district.decorations.forEach(({ tile, density }) => {
      const numDecorations = Math.floor(district.width * district.height * density);
      
      for (let i = 0; i < numDecorations; i++) {
        const dx = Math.floor(Math.random() * (district.width - 2)) + 1;
        const dy = Math.floor(Math.random() * (district.height - 2)) + 1;
        const x = district.x + dx;
        const y = district.y + dy;
        const index = y * map.width + x;
        
        if (baseLayer.data[index] === district.baseTile) {
          baseLayer.data[index] = tile;
          collisionLayer.data[index] = tile;
        }
      }
    });
  }
}

/**
 * Generates a winding path between two points
 */
export function generatePath(
  map: JsonMap,
  start: Position,
  end: Position,
  pathTile: TileType = 'path',
  width: number = 2,
): void {
  const baseLayer = map.layers.find(l => l.type === 'tilelayer' && l.name === 'base') as JsonMapTileLayer;
  const collisionLayer = map.layers.find(l => l.type === 'tilelayer' && l.name === 'collision') as JsonMapTileLayer;
  
  if (!baseLayer || !collisionLayer) { return; }

  // Simple A* pathfinding with some randomness
  const path = findPath(map, start, end);
  
  // Draw the path with specified width
  path.forEach(pos => {
    for (let dy = -Math.floor(width / 2); dy <= Math.floor(width / 2); dy++) {
      for (let dx = -Math.floor(width / 2); dx <= Math.floor(width / 2); dx++) {
        const x = pos.x + dx;
        const y = pos.y + dy;
        
        if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
          const index = y * map.width + x;
          baseLayer.data[index] = pathTile;
          collisionLayer.data[index] = 'walkable';
        }
      }
    }
  });
}

/**
 * Simple pathfinding algorithm
 */
function findPath(map: JsonMap, start: Position, end: Position): Position[] {
  const path: Position[] = [];
  const current = { ...start };
  
  while (current.x !== end.x || current.y !== end.y) {
    path.push({ ...current });
    
    // Add some randomness to make paths more natural
    const randomFactor = Math.random() < 0.7 ? 1 : 0;
    
    if (Math.abs(current.x - end.x) > Math.abs(current.y - end.y) || randomFactor) {
      current.x += current.x < end.x ? 1 : -1;
    } else {
      current.y += current.y < end.y ? 1 : -1;
    }
  }
  
  path.push(end);
  return path;
}

/**
 * Randomly places entities on the map
 */
export function scatterEntities(
  map: JsonMap,
  entityType: 'npc' | 'enemy' | 'item',
  count: number,
  properties: any = {},
  allowedTiles: TileType[] = ['grass', 'floor', 'dungeon_floor'],
): void {
  const objectLayer = map.layers.find(l => l.type === 'objectgroup' && l.name === 'objects') as JsonMapObjectLayer;
  const baseLayer = map.layers.find(l => l.type === 'tilelayer' && l.name === 'base') as JsonMapTileLayer;
  
  if (!objectLayer || !baseLayer) { return; }

  const validPositions: Position[] = [];
  
  // Find all valid positions
  for (let y = 1; y < map.height - 1; y++) {
    for (let x = 1; x < map.width - 1; x++) {
      const index = y * map.width + x;
      if (allowedTiles.includes(baseLayer.data[index] as TileType)) {
        validPositions.push({ x, y });
      }
    }
  }

  // Randomly select positions
  for (let i = 0; i < count && validPositions.length > 0; i++) {
    const posIndex = Math.floor(Math.random() * validPositions.length);
    const position = validPositions.splice(posIndex, 1)[0];
    
    const entity: JsonMapObject = {
      id: `${entityType}_${Date.now()}_${i}`,
      type: entityType,
      position,
      properties: { ...properties },
    };
    
    objectLayer.objects.push(entity);
  }
}

/**
 * Creates a large city map with multiple districts
 */
export function createCityMap(size: number = 40): JsonMap {
  const map = createMap({
    id: 'megaCity',
    name: 'Mega City',
    width: size,
    height: size,
    defaultTile: 'grass',
    borderTile: 'wall',
  });

  // Define districts
  const districts: District[] = [
    {
      name: 'Market District',
      x: 5,
      y: 5,
      width: 10,
      height: 10,
      baseTile: 'floor',
      borderTile: 'wall',
      decorations: [{ tile: 'shop', density: 0.05 }],
    },
    {
      name: 'Residential District',
      x: 20,
      y: 5,
      width: 15,
      height: 15,
      baseTile: 'grass',
      borderTile: 'tree',
      decorations: [{ tile: 'door', density: 0.1 }],
    },
    {
      name: 'Debug Quarter',
      x: 5,
      y: 25,
      width: 12,
      height: 10,
      baseTile: 'dungeon_floor',
      borderTile: 'wall',
    },
    {
      name: 'Binary Gardens',
      x: 25,
      y: 25,
      width: 10,
      height: 10,
      baseTile: 'grass',
      decorations: [{ tile: 'tree', density: 0.2 }],
    },
  ];

  // Add districts
  districts.forEach(district => addDistrict(map, district));

  // Connect districts with paths
  generatePath(map, { x: 10, y: 15 }, { x: 27, y: 15 }, 'path', 3);
  generatePath(map, { x: 10, y: 15 }, { x: 11, y: 30 }, 'path', 3);
  generatePath(map, { x: 27, y: 20 }, { x: 30, y: 30 }, 'path', 3);
  generatePath(map, { x: 17, y: 30 }, { x: 25, y: 30 }, 'path', 3);

  // Add some NPCs
  scatterEntities(map, 'npc', 10, {
    role: 'merchant',
    dialogueId: 'merchant_generic',
  });

  // Add some enemies
  scatterEntities(map, 'enemy', 15, {
    variant: 'BasicBug',
  });

  // Add items
  scatterEntities(map, 'item', 20, {
    variant: 'HealthPotion',
  });

  return map;
}