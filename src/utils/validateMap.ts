// src/utils/validateMap.ts

import { JsonMap, JsonMapTileLayer, JsonMapObjectLayer } from '../types/map-schema.types';
import { TileType, Position } from '../types/global.types';
import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    tileCount: number;
    entityCount: number;
    walkableTiles: number;
    unreachableAreas: number;
    exits: number;
  };
}

/**
 * Validates a JSON map file
 */
export function validateMap(map: JsonMap): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      tileCount: 0,
      entityCount: 0,
      walkableTiles: 0,
      unreachableAreas: 0,
      exits: 0
    }
  };

  // Basic structure validation
  if (!map.id || !map.name) {
    result.errors.push('Map must have id and name');
    result.valid = false;
  }

  if (!map.width || !map.height || map.width < 1 || map.height < 1) {
    result.errors.push('Map must have valid width and height');
    result.valid = false;
  }

  if (!map.layers || !Array.isArray(map.layers) || map.layers.length === 0) {
    result.errors.push('Map must have at least one layer');
    result.valid = false;
  }

  // Validate layers
  const hasBaseLayer = map.layers.some(l => l.type === 'tilelayer' && l.name === 'base');
  if (!hasBaseLayer) {
    result.warnings.push('Map should have a "base" tile layer');
  }

  // Check tile layers
  map.layers.forEach(layer => {
    if (layer.type === 'tilelayer') {
      const tileLayer = layer as JsonMapTileLayer;
      result.stats.tileCount += tileLayer.data.length;

      if (tileLayer.data.length !== map.width * map.height) {
        result.errors.push(`Layer "${layer.name}" has incorrect tile count`);
        result.valid = false;
      }

      // Count walkable tiles
      tileLayer.data.forEach(tile => {
        if (isWalkable(tile as TileType)) {
          result.stats.walkableTiles++;
        }
      });
    } else if (layer.type === 'objectgroup') {
      const objLayer = layer as JsonMapObjectLayer;
      result.stats.entityCount += objLayer.objects.length;

      // Check object positions
      objLayer.objects.forEach(obj => {
        if (obj.position.x < 0 || obj.position.x >= map.width ||
            obj.position.y < 0 || obj.position.y >= map.height) {
          result.errors.push(`Object "${obj.id}" is outside map bounds`);
          result.valid = false;
        }

        if (obj.type === 'exit') {
          result.stats.exits++;
        }
      });
    }
  });

  // Check for unreachable areas
  const unreachableAreas = findUnreachableAreas(map);
  result.stats.unreachableAreas = unreachableAreas.length;
  if (unreachableAreas.length > 0) {
    result.warnings.push(`Found ${unreachableAreas.length} unreachable areas`);
  }

  // Additional checks
  if (result.stats.exits === 0) {
    result.warnings.push('Map has no exits defined');
  }

  if (result.stats.walkableTiles < map.width * map.height * 0.2) {
    result.warnings.push('Less than 20% of the map is walkable');
  }

  return result;
}

/**
 * Checks if a tile type is walkable
 */
function isWalkable(tileType: TileType | string): boolean {
  const walkableTiles: string[] = [
    'walkable', 'grass', 'floor', 'path', 
    'path_one', 'path_zero', 'dungeon_floor', 
    'exit', 'door'
  ];
  return walkableTiles.includes(tileType);
}

/**
 * Finds unreachable areas using flood fill
 */
function findUnreachableAreas(map: JsonMap): Position[][] {
  const collisionLayer = map.layers.find(
    l => l.type === 'tilelayer' && (l.name === 'collision' || l.name === 'base')
  ) as JsonMapTileLayer;

  if (!collisionLayer) return [];

  const visited = new Array(map.height).fill(null).map(() => 
    new Array(map.width).fill(false)
  );
  
  const areas: Position[][] = [];

  // Find all walkable areas
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const index = y * map.width + x;
      if (!visited[y][x] && isWalkable(collisionLayer.data[index] as string)) {
        const area = floodFill(map, collisionLayer, x, y, visited);
        if (area.length > 0) {
          areas.push(area);
        }
      }
    }
  }

  // Return all areas except the largest (main area)
  if (areas.length <= 1) return [];
  
  areas.sort((a, b) => b.length - a.length);
  return areas.slice(1);
}

/**
 * Flood fill algorithm to find connected areas
 */
function floodFill(
  map: JsonMap,
  layer: JsonMapTileLayer,
  startX: number,
  startY: number,
  visited: boolean[][]
): Position[] {
  const area: Position[] = [];
  const queue: Position[] = [{ x: startX, y: startY }];

  while (queue.length > 0) {
    const pos = queue.shift()!;
    const { x, y } = pos;

    if (x < 0 || x >= map.width || y < 0 || y >= map.height || visited[y][x]) {
      continue;
    }

    const index = y * map.width + x;
    if (!isWalkable(layer.data[index] as string)) {
      continue;
    }

    visited[y][x] = true;
    area.push(pos);

    // Add neighbors
    queue.push({ x: x + 1, y });
    queue.push({ x: x - 1, y });
    queue.push({ x, y: y + 1 });
    queue.push({ x, y: y - 1 });
  }

  return area;
}

/**
 * Generates ASCII representation of a map
 */
export function generateAsciiMap(map: JsonMap): string {
  const baseLayer = map.layers.find(
    l => l.type === 'tilelayer' && l.name === 'base'
  ) as JsonMapTileLayer;

  if (!baseLayer) return 'No base layer found';

  const objectLayer = map.layers.find(
    l => l.type === 'objectgroup'
  ) as JsonMapObjectLayer;

  // Create character map
  const charMap: { [key: string]: string } = {
    'grass': '.',
    'tree': 'T',
    'wall': '#',
    'door': 'D',
    'locked_door': 'L',
    'water': '~',
    'path': '-',
    'floor': '_',
    'dungeon_floor': ':',
    'exit': 'E',
    'shop': 'S',
    'healer': 'H'
  };

  let ascii = '';
  
  // Add border
  ascii += '┌' + '─'.repeat(map.width) + '┐\n';

  for (let y = 0; y < map.height; y++) {
    ascii += '│';
    for (let x = 0; x < map.width; x++) {
      const index = y * map.width + x;
      let char = charMap[baseLayer.data[index] as string] || '?';

      // Check for objects at this position
      if (objectLayer) {
        const obj = objectLayer.objects.find(
          o => o.position.x === x && o.position.y === y
        );
        if (obj) {
          switch (obj.type) {
            case 'npc': char = 'N'; break;
            case 'enemy': char = 'e'; break;
            case 'item': char = 'i'; break;
            case 'exit': char = 'E'; break;
          }
        }
      }

      ascii += char;
    }
    ascii += '│\n';
  }

  // Add border
  ascii += '└' + '─'.repeat(map.width) + '┘\n';

  // Add legend
  ascii += '\nLegend:\n';
  ascii += '. = Grass  T = Tree  # = Wall  D = Door\n';
  ascii += 'N = NPC    e = Enemy i = Item  E = Exit\n';
  ascii += '~ = Water  - = Path  _ = Floor : = Dungeon\n';

  return ascii;
}

/**
 * CLI tool for validating map files
 */
export async function validateMapCLI(filePath: string): Promise<void> {
  try {
    console.log(`\n🗺️  Validating map: ${filePath}\n`);

    // Read and parse JSON file
    const jsonContent = fs.readFileSync(filePath, 'utf8');
    const map = JSON.parse(jsonContent) as JsonMap;

    // Validate
    const result = validateMap(map);

    // Display results
    console.log(`Map: ${map.name} (${map.id})`);
    console.log(`Size: ${map.width}x${map.height}`);
    console.log(`\nValidation Result: ${result.valid ? '✅ VALID' : '❌ INVALID'}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach(warn => console.log(`  - ${warn}`));
    }

    console.log('\n📊 Statistics:');
    console.log(`  - Total Tiles: ${result.stats.tileCount}`);
    console.log(`  - Walkable Tiles: ${result.stats.walkableTiles} (${(result.stats.walkableTiles / result.stats.tileCount * 100).toFixed(1)}%)`);
    console.log(`  - Entities: ${result.stats.entityCount}`);
    console.log(`  - Exits: ${result.stats.exits}`);
    console.log(`  - Unreachable Areas: ${result.stats.unreachableAreas}`);

    // Generate ASCII map
    console.log('\n🗺️  ASCII Map Visualization:');
    console.log(generateAsciiMap(map));

  } catch (error) {
    console.error('❌ Error validating map:', error);
    process.exit(1);
  }
}

// Run CLI if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node validateMap.js <map-file.json>');
    process.exit(1);
  }
  validateMapCLI(args[0]);
}