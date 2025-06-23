// src/utils/mapMigration.ts

import {
  GameMap as IGameMap,
  Tile,
  TileType,
  Exit,
  Enemy,
  NPC,
  Item,
  Position,
  NPCRole,
  EnemyType,
  ItemType,
} from '../types/global.types';
import {
  JsonMap,
  JsonMapLayer,
  JsonMapObject,
  JsonNpcObject,
  JsonEnemyObject,
  JsonItemObject,
  JsonExitObject,
  JsonDoorObject,
  JsonProperty,
  JsonProperties,
} from '../types/map-schema.types';

// These imports are for type inference during migration, not for runtime logic.
// They are needed because the original `terminalTown.ts` uses these classes.
import { EnemyVariant } from '../models/Enemy';
import { ItemVariant } from '../models/Item';

/**
 * Converts an existing TypeScript IGameMap structure to the new JsonMap format.
 * This function infers layers and object types from the flat IGameMap structure.
 *
 * @param tsMap The IGameMap object to convert.
 * @returns A JsonMap object representing the converted map.
 */
export function convertTsMapToJson(tsMap: IGameMap): JsonMap {
  const jsonMap: JsonMap = {
    id: tsMap.id,
    name: tsMap.name,
    width: tsMap.width,
    height: tsMap.height,
    tileWidth: 16, // Assuming 16x16 tiles as a standard for the game
    tileHeight: 16, // Assuming 16x16 tiles as a standard for the game
    properties: {
      // Example global map properties. These would typically be defined in the original
      // IGameMap if it had a richer metadata structure.
      defaultSpawnX: 1,
      defaultSpawnY: 1,
      musicTrack: "town_theme",
      ambientSound: "town_ambience"
    },
    layers: [],
  };

  // Initialize tile layer data arrays.
  // These arrays will store TileType strings in row-major order.
  const baseLayerData: TileType[] = [];
  const collisionLayerData: TileType[] = [];
  const decorationLayerData: TileType[] = [];

  // Populate tile layer data from the original `tsMap.tiles`
  for (let y = 0; y < tsMap.height; y++) {
    for (let x = 0; x < tsMap.width; x++) {
      const tile = tsMap.tiles[y][x];

      // Base Layer: Contains the primary visual tile type
      baseLayerData.push(tile.type);

      // Collision Layer: Defines walkability and special collision types
      if (tile.type === 'wall' || tile.type === 'tree' || tile.type === 'water') {
        collisionLayerData.push(tile.type); // Mark as non-walkable obstacle
      } else if (tile.type === 'door' || tile.type === 'locked_door') {
        collisionLayerData.push(tile.type); // Mark as door for collision logic
      } else if (tile.type === 'exit') {
        collisionLayerData.push(tile.type); // Mark as exit point
      } else {
        collisionLayerData.push('walkable'); // Default to walkable
      }

      // Decoration Layer: For visual elements that might overlay the base layer (e.g., trees)
      // We infer trees as decoration. Other tiles are 'walkable' (meaning no decoration).
      if (tile.type === 'tree') {
        decorationLayerData.push(tile.type);
      } else {
        decorationLayerData.push('walkable'); // Placeholder for no decoration
      }
    }
  }

  // Add the created tile layers to the JSON map
  jsonMap.layers.push({ name: 'base', type: 'tilelayer', data: baseLayerData, visible: true, opacity: 1 });
  jsonMap.layers.push({ name: 'collision', type: 'tilelayer', data: collisionLayerData, visible: true, opacity: 0.5 });
  jsonMap.layers.push({ name: 'decoration', type: 'tilelayer', data: decorationLayerData, visible: true, opacity: 1 });

  // Create an object layer for entities and exits
  const objectLayer: JsonMapLayer = {
    name: 'objects',
    type: 'objectlayer',
    objects: [],
    visible: true,
    opacity: 1,
  };

  // Convert NPCs from `tsMap.entities`
  tsMap.entities.filter((e): e is NPC => 'role' in e).forEach(npc => {
    const jsonNpc: JsonNpcObject = {
      id: npc.id,
      type: 'npc',
      position: npc.position,
      properties: {
        name: npc.name,
        role: npc.role,
        dialogueId: npc.dialogueId,
      },
    };
    objectLayer.objects!.push(jsonNpc);
  });

  // Convert Enemies from `tsMap.entities`
  tsMap.entities.filter((e): e is Enemy => 'type' in e && 'expReward' in e).forEach(enemy => {
    const jsonEnemy: JsonEnemyObject = {
      id: enemy.id,
      type: 'enemy',
      position: enemy.position,
      properties: {
        variant: enemy.type, // Enemy.type directly maps to EnemyType string
      },
    };
    objectLayer.objects!.push(jsonEnemy);
  });

  // Convert Items from `tsMap.entities`
  tsMap.entities.filter((e): e is Item => 'description' in e && e.position !== undefined).forEach(item => {
    const jsonItem: JsonItemObject = {
      id: item.id,
      type: 'item',
      position: item.position!, // Position is guaranteed by filter
      properties: {
        // Heuristic: convert "Health Potion" to "HealthPotion" to match ItemVariant enum keys
        variant: item.name.replace(/\s/g, ''),
      },
    };
    objectLayer.objects!.push(jsonItem);
  });

  // Convert Exits from `tsMap.exits`
  tsMap.exits.forEach(exit => {
    const jsonExit: JsonExitObject = {
      id: `exit_${exit.targetMapId}_${exit.position.x}_${exit.position.y}`, // Generate a unique ID
      type: 'exit',
      position: exit.position,
      properties: {
        targetMapId: exit.targetMapId,
        targetPositionX: exit.targetPosition.x,
        targetPositionY: exit.targetPosition.y,
      },
    };
    objectLayer.objects!.push(jsonExit);
  });

  // Infer Doors from `tsMap.tiles` and add them as objects.
  // The original `terminalTown.ts` has doors at (8,6) and (13,11).
  const inferredDoorPositions: Position[] = [{ x: 8, y: 6 }, { x: 13, y: 11 }];
  inferredDoorPositions.forEach((pos) => {
    const tile = tsMap.tiles[pos.y][pos.x];
    if (tile.type === 'door' || tile.type === 'locked_door') {
      const jsonDoor: JsonDoorObject = {
        id: `door_${tsMap.id}_${pos.x}_${pos.y}`,
        type: tile.type, // 'door' or 'locked_door'
        position: pos,
        properties: {
          doorId: `door_${tsMap.id}_${pos.x}_${pos.y}`,
          // keyItemId would be added here if the original TS map supported it
        },
      };
      objectLayer.objects!.push(jsonDoor);
    }
  });

  jsonMap.layers.push(objectLayer);

  return jsonMap;
}

/**
 * Performs basic validation on a given object to ensure it conforms to the JsonMap schema.
 * This function checks for required properties and basic type correctness.
 *
 * @param data The object to validate.
 * @returns True if the object is a valid JsonMap, otherwise throws an error.
 * @throws Error with details if validation fails.
 */
export function validateJsonMap(data: any): data is JsonMap {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Map data must be an object.');
  }

  const requiredProps = ['id', 'name', 'width', 'height', 'tileWidth', 'tileHeight', 'layers'];
  for (const prop of requiredProps) {
    if (!(prop in data)) {
      throw new Error(`Missing required map property: "${prop}".`);
    }
  }

  if (typeof data.id !== 'string' || data.id.trim() === '') throw new Error('Map ID must be a non-empty string.');
  if (typeof data.name !== 'string' || data.name.trim() === '') throw new Error('Map name must be a non-empty string.');
  if (typeof data.width !== 'number' || data.width <= 0) throw new Error('Map width must be a positive number.');
  if (typeof data.height !== 'number' || data.height <= 0) throw new Error('Map height must be a positive number.');
  if (typeof data.tileWidth !== 'number' || data.tileWidth <= 0) throw new Error('Map tileWidth must be a positive number.');
  if (typeof data.tileHeight !== 'number' || data.tileHeight <= 0) throw new Error('Map tileHeight must be a positive number.');
  if (!Array.isArray(data.layers)) throw new Error('Map layers must be an array.');

  const expectedTileCount = data.width * data.height;

  for (const layer of data.layers) {
    if (typeof layer !== 'object' || layer === null) throw new Error('Each layer must be an object.');
    if (typeof layer.name !== 'string' || layer.name.trim() === '') throw new Error('Layer name must be a non-empty string.');
    if (layer.type !== 'tilelayer' && layer.type !== 'objectlayer') throw new Error(`Invalid layer type for layer "${layer.name}": "${layer.type}".`);

    if (layer.type === 'tilelayer') {
      if (!Array.isArray(layer.data)) throw new Error(`Tile layer "${layer.name}" must have a 'data' array.`);
      if (layer.data.length !== expectedTileCount) {
        throw new Error(`Tile layer "${layer.name}" data length (${layer.data.length}) does not match map dimensions (${expectedTileCount}).`);
      }
      // Optional: More rigorous check for valid TileType strings could be added here.
      for (const tileType of layer.data) {
        if (typeof tileType !== 'string') {
          console.warn(`Validation Warning: Tile layer "${layer.name}" contains non-string tile type: ${tileType}.`);
        }
      }
    } else if (layer.type === 'objectlayer') {
      if (!Array.isArray(layer.objects)) throw new Error(`Object layer "${layer.name}" must have an 'objects' array.`);
      for (const obj of layer.objects) {
        if (typeof obj !== 'object' || obj === null) throw new Error(`Object in layer "${layer.name}" must be an object.`);
        if (typeof obj.id !== 'string' || obj.id.trim() === '') throw new Error(`Object in layer "${layer.name}" missing ID.`);
        if (typeof obj.type !== 'string' || obj.type.trim() === '') throw new Error(`Object "${obj.id}" in layer "${layer.name}" missing type.`);
        if (typeof obj.position !== 'object' || typeof obj.position.x !== 'number' || typeof obj.position.y !== 'number') {
          throw new Error(`Object "${obj.id}" in layer "${layer.name}" has invalid position.`);
        }
        // Further validation for specific object types (e.g., required properties for NPC) can be added here.
      }
    }
  }

  return true;
}

// Helper function to convert JsonMap to IGameMap (used by MapLoader)
// This function is defined here for logical grouping with migration utilities,
// but it's primarily consumed by the MapLoader.
export function convertJsonToGameMap(jsonMap: JsonMap): IGameMap {
  const gameMap: IGameMap = {
    id: jsonMap.id,
    name: jsonMap.name,
    width: jsonMap.width,
    height: jsonMap.height,
    tiles: Array.from({ length: jsonMap.height }, () =>
      Array.from({ length: jsonMap.width }, () => ({ walkable: false, type: 'wall' })), // Default tile
    ),
    entities: [],
    exits: [],
  };

  const tileCount = jsonMap.width * jsonMap.height;

  // Store tile layer data by name for combined processing
  const tileLayerData: { [key: string]: TileType[] } = {};
  const objectLayers: JsonMapObject[][] = [];

  for (const layer of jsonMap.layers) {
    if (layer.type === 'tilelayer' && layer.data) {
      if (layer.data.length !== tileCount) {
        console.warn(`Map "${jsonMap.id}": Layer "${layer.name}" data length mismatch. Expected ${tileCount}, got ${layer.data.length}. Skipping.`);
        continue;
      }
      tileLayerData[layer.name] = layer.data;
    } else if (layer.type === 'objectlayer' && layer.objects) {
      objectLayers.push(layer.objects);
    }
  }

  // Populate gameMap.tiles from tile layers
  for (let y = 0; y < jsonMap.height; y++) {
    for (let x = 0; x < jsonMap.width; x++) {
      const index = y * jsonMap.width + x;
      const tile: Tile = { walkable: false, type: 'wall' }; // Start with a default non-walkable wall

      // 1. Apply base layer (e.g., grass, floor)
      if (tileLayerData['base'] && tileLayerData['base'][index]) {
        tile.type = tileLayerData['base'][index];
      }

      // 2. Apply decoration layer (e.g., trees, rocks that overlay base)
      // 'walkable' is used as a placeholder in decoration layer for empty spots.
      if (tileLayerData['decoration'] && tileLayerData['decoration'][index] && tileLayerData['decoration'][index] !== 'walkable') {
        tile.type = tileLayerData['decoration'][index];
      }

      // 3. Determine walkability and final tile type from collision layer
      if (tileLayerData['collision'] && tileLayerData['collision'][index]) {
        const collisionType = tileLayerData['collision'][index];
        switch (collisionType) {
          case 'walkable':
          case 'grass':
          case 'floor':
          case 'path':
          case 'path_one':
          case 'path_zero':
          case 'dungeon_floor':
          case 'exit': // Exits are walkable
            tile.walkable = true;
            break;
          case 'door':
          case 'locked_door':
            tile.walkable = false; // Doors are initially non-walkable
            break;
          case 'wall':
          case 'tree':
          case 'water':
          case 'shop':
          case 'healer':
            tile.walkable = false;
            break;
          default:
            tile.walkable = false;
            break;
        }
        // If the collision layer specifies a distinct visual type (like door, exit, shop), use it.
        if (['door', 'locked_door', 'exit', 'shop', 'healer'].includes(collisionType)) {
          tile.type = collisionType;
        }
      } else {
        // Fallback if no collision layer or data missing: assume walkable if not a known obstacle from base/decoration
        tile.walkable = (tile.type !== 'wall' && tile.type !== 'tree' && tile.type !== 'water' && tile.type !== 'door' && tile.type !== 'locked_door');
      }

      gameMap.tiles[y][x] = tile;
    }
  }

  // Process object layers for entities and exits
  for (const objects of objectLayers) {
    for (const obj of objects) {
      const { x, y } = obj.position;
      switch (obj.type) {
        case 'npc':
          const jsonNpc = obj as JsonNpcObject;
          gameMap.entities.push({
            id: jsonNpc.id,
            name: jsonNpc.properties.name as string,
            position: jsonNpc.position,
            role: jsonNpc.properties.role as NPCRole,
            dialogueId: jsonNpc.properties.dialogueId as string,
            statusEffects: [],
          } as NPC);
          break;
        case 'enemy':
          const jsonEnemy = obj as JsonEnemyObject;
          const enemyVariant = jsonEnemy.properties.variant as EnemyType;
          // NOTE: EnemyClass is not defined in this snippet, assuming it's available globally or imported elsewhere.
          // For a complete, runnable example, you'd need to define/import EnemyClass.
          const newEnemy: Enemy = new EnemyClass(jsonEnemy.id, enemyVariant, jsonEnemy.position);
          gameMap.entities.push(newEnemy);
          break;
        case 'item':
          const jsonItem = obj as JsonItemObject;
          const itemVariantStr = jsonItem.properties.variant as string;
          const itemVariant = ItemVariant[itemVariantStr as keyof typeof ItemVariant];
          if (itemVariant) {
            // NOTE: ItemClass is not defined in this snippet, assuming it's available globally or imported elsewhere.
            // For a complete, runnable example, you'd need to define/import ItemClass.
            const newItem: Item = { ...ItemClass.createItem(itemVariant), id: jsonItem.id, position: jsonItem.position };
            gameMap.entities.push(newItem);
          } else {
            console.warn(`Map "${jsonMap.id}": Unknown item variant: "${itemVariantStr}" for object "${jsonItem.id}". Item not loaded.`);
          }
          break;
        case 'exit':
          const jsonExit = obj as JsonExitObject;
          const exit: Exit = {
            position: jsonExit.position,
            targetMapId: jsonExit.properties.targetMapId as string,
            targetPosition: {
              x: jsonExit.properties.targetPositionX as number,
              y: jsonExit.properties.targetPositionY as number,
            },
          };
          gameMap.exits.push(exit);
          // Ensure the tile itself is marked as 'exit' and walkable
          if (gameMap.tiles[y] && gameMap.tiles[y][x]) {
            gameMap.tiles[y][x].type = 'exit';
            gameMap.tiles[y][x].walkable = true;
          }
          break;
        case 'door':
        case 'locked_door':
          const jsonDoor = obj as JsonDoorObject;
          if (gameMap.tiles[y] && gameMap.tiles[y][x]) {
            gameMap.tiles[y][x].type = jsonDoor.type;
            gameMap.tiles[y][x].walkable = false;
          }
          break;
        case 'trigger':
          console.log(`Map "${jsonMap.id}": Found trigger object: ${obj.id} (Type: ${obj.type}) at (${x},${y}) with properties:`, obj.properties);
          break;
        default:
          console.warn(`Map "${jsonMap.id}": Unknown object type encountered: "${obj.type}" for object "${obj.id}". Object not loaded.`);
          break;
      }
    }
  }

  return gameMap;
}
