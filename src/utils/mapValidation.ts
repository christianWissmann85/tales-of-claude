// src/utils/mapValidation.ts

import { 
  JsonMap, 
  JsonMapTileLayer, 
  JsonMapObjectLayer,
  JsonMapObject, // Kept for type inference in validation, assuming it now has a 'position' property
  JsonMapNPC,
  JsonMapEnemy,
  JsonMapItem,
  JsonMapExit,
  JsonMapDoor,
} from '../types/map-schema.types';
import { GameMap as IGameMap, Tile, TileType, NPC, Enemy as IEnemy, Item, Exit, ItemType } from '../types/global.types'; // Added ItemType
import { Enemy, EnemyVariant } from '../models/Enemy'; // EnemyVariant is not directly used in this file's logic, but Enemy class is.
import { Item as ItemClass, ItemVariant } from '../models/Item'; // ItemVariant is used for type inference, ItemClass is not directly used.

/**
 * Validates that a JSON object conforms to the JsonMap schema.
 * Throws descriptive errors if validation fails.
 * @param json The JSON object to validate
 * @throws Error if the JSON doesn't match the expected JsonMap schema
 */
export function validateJsonMap(json: any): void {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid map data: Expected an object');
  }

  // Check required top-level fields
  const requiredFields = ['id', 'name', 'width', 'height', 'version', 'layers'];
  for (const field of requiredFields) {
    if (!(field in json)) {
      throw new Error(`Invalid map data: Missing required field "${field}"`);
    }
  }

  // Validate field types
  if (typeof json.id !== 'string' || json.id.trim() === '') {
    throw new Error('Invalid map data: "id" must be a non-empty string');
  }

  if (typeof json.name !== 'string' || json.name.trim() === '') {
    throw new Error('Invalid map data: "name" must be a non-empty string');
  }

  if (typeof json.width !== 'number' || json.width <= 0 || !Number.isInteger(json.width)) {
    throw new Error('Invalid map data: "width" must be a positive integer');
  }

  if (typeof json.height !== 'number' || json.height <= 0 || !Number.isInteger(json.height)) {
    throw new Error('Invalid map data: "height" must be a positive integer');
  }

  if (typeof json.version !== 'string') {
    throw new Error('Invalid map data: "version" must be a string');
  }

  // Validate layers
  if (!Array.isArray(json.layers)) {
    throw new Error('Invalid map data: "layers" must be an array');
  }

  if (json.layers.length === 0) {
    throw new Error('Invalid map data: "layers" array must contain at least one layer');
  }

  // Validate each layer
  json.layers.forEach((layer: any, index: number) => {
    if (!layer || typeof layer !== 'object') {
      throw new Error(`Invalid map data: Layer at index ${index} must be an object`);
    }

    if (typeof layer.name !== 'string') {
      throw new Error(`Invalid map data: Layer at index ${index} "name" must be a string`);
    }

    if (layer.type === 'tilelayer') {
      const requiredTileLayerFields = ['name', 'type', 'data'];
      for (const field of requiredTileLayerFields) {
        if (!(field in layer)) {
          throw new Error(`Invalid map data: Tile layer at index ${index} is missing required field "${field}"`);
        }
      }

      if (!Array.isArray(layer.data)) {
        throw new Error(`Invalid map data: Tile layer at index ${index} "data" must be an array`);
      }

      const expectedSize = json.width * json.height;
      if (layer.data.length !== expectedSize) {
        throw new Error(`Invalid map data: Tile layer at index ${index} data array size (${layer.data.length}) doesn't match expected size (${expectedSize})`);
      }

      // Validate that all tiles are numbers
      layer.data.forEach((tile: any, tileIndex: number) => {
        if (typeof tile !== 'number') {
          throw new Error(`Invalid map data: Tile layer at index ${index}, tile at position ${tileIndex} must be a number`);
        }
      });
    } else if (layer.type === 'objectgroup') {
      // JsonMapObjectLayer uses 'objects' property, not 'data'
      const requiredObjectLayerFields = ['name', 'type', 'objects']; 
      for (const field of requiredObjectLayerFields) {
        if (!(field in layer)) {
          throw new Error(`Invalid map data: Object layer at index ${index} is missing required field "${field}"`);
        }
      }

      if (!Array.isArray(layer.objects)) {
        throw new Error(`Invalid map data: Object layer at index ${index} "objects" must be an array`);
      }

      // Validate each object in the layer
      layer.objects.forEach((obj: any, objIndex: number) => {
        if (!obj || typeof obj !== 'object') {
          throw new Error(`Invalid map data: Object at index ${objIndex} in layer ${index} must be an object`);
        }

        if (!obj.type || typeof obj.type !== 'string') {
          throw new Error(`Invalid map data: Object at index ${objIndex} in layer ${index} must have a valid "type" string`);
        }

        // Correction: JsonMapObject (and its extensions) are now expected to have a 'position' object
        if (!obj.position || typeof obj.position !== 'object' || typeof obj.position.x !== 'number' || typeof obj.position.y !== 'number') {
          throw new Error(`Invalid map data: Object at index ${objIndex} in layer ${index} must have a "position" object with numeric "x" and "y" coordinates`);
        }
      });
    } else {
      throw new Error(`Invalid map data: Layer at index ${index} has invalid type "${layer.type}". Expected "tilelayer" or "objectgroup"`);
    }
  });
}

/**
 * Converts a TypeScript GameMap to JsonMap format.
 * @param tsMap The TypeScript GameMap to convert
 * @returns The converted JsonMap object
 */
export function convertTsMapToJson(tsMap: IGameMap): JsonMap {
  // Create the base JsonMap structure
  const jsonMap: JsonMap = {
    id: tsMap.id,
    name: tsMap.name,
    width: tsMap.width,
    height: tsMap.height,
    version: '1.0', // Default version
    layers: [],
  };

  // Convert tiles to tile layer
  const tileData: number[] = [];
  for (let y = 0; y < tsMap.height; y++) {
    for (let x = 0; x < tsMap.width; x++) {
      const tile = tsMap.tiles[y][x];
      // Correction 2: Remove invalid tile types from the switch statement
      // These should map to existing valid types or default to 0
      let tileId = 0;
      switch (tile.type) {
        case 'grass': tileId = 1; break;
        // 'stone' removed, defaults to 0
        case 'water': tileId = 3; break;
        case 'wall': tileId = 4; break;
        case 'door': tileId = 5; break;
        case 'locked_door': tileId = 6; break;
        case 'exit': tileId = 7; break; // Assuming 'exit' can be a tile type
        // 'chest', 'npc', 'enemy', 'boss', 'save' removed as they are entities, defaults to 0
        case 'shop': tileId = 12; break;
        default: tileId = 0;
      }
      tileData.push(tileId);
    }
  }

  const tileLayer: JsonMapTileLayer = {
    name: 'Ground',
    type: 'tilelayer',
    width: tsMap.width,
    height: tsMap.height,
    data: tileData,
  };
  jsonMap.layers.push(tileLayer);

  // Convert entities to object layer
  const objects: JsonMapObject[] = [];

  // Convert NPCs, Enemies, Items
  tsMap.entities.forEach((entity) => {
    if ('dialogueId' in entity) {
      // It's an NPC
      const npc = entity as NPC;
      const npcObject: JsonMapNPC = {
        id: `npc_${npc.id}`,
        type: 'npc',
        position: { x: npc.position.x, y: npc.position.y }, // Correction 1: Use position: {x, y}
        properties: {
          name: npc.name,
          role: npc.role,
          dialogueId: npc.dialogueId,
        },
      };
      objects.push(npcObject);
    } else if ('stats' in entity && typeof entity.stats === 'object' && 'hp' in (entity.stats as any) && 'maxHp' in (entity.stats as any)) {
      // Correction 3: Enemy detection: check for 'stats' property with hp/maxHp inside it
      const enemy = entity as IEnemy;
      const enemyObject: JsonMapEnemy = {
        id: `enemy_${enemy.id}`,
        type: 'enemy',
        position: { x: enemy.position.x, y: enemy.position.y }, // Correction 1: Use position: {x, y}
        properties: {
          variant: (enemy as any).variant || 'bug', // Correction 1: Track variant
          level: 1, // Correction 1: Default level to 1
        },
      };
      objects.push(enemyObject);
    } else if ('type' in entity && ['consumable', 'key', 'equipment', 'quest'].includes((entity as Item).type)) {
      // Correction 3: Item detection: check for 'type' property being ItemType value
      const item = entity as Item;
      if (item.position) { // Only add items that have a position
        const itemObject: JsonMapItem = {
          id: `item_${item.id}`,
          type: 'item',
          position: { x: item.position.x, y: item.position.y }, // Correction 1: Use position: {x, y}
          properties: {
            variant: (item as any).variant || 'health_potion', // Correction 1: Track variant
            quantity: 1, // Assuming quantity is always 1 for items placed on map
          },
        };
        objects.push(itemObject);
      }
    }
  });

  // Convert exits
  tsMap.exits.forEach((exit, index) => {
    const exitObject: JsonMapExit = {
      id: `exit_${index}`,
      type: 'exit',
      position: { x: exit.position.x, y: exit.position.y }, // Correction 1: Use position: {x, y}
      properties: {
        targetMapId: exit.targetMapId, // Correction 1: Use targetMapId
        targetPositionX: exit.targetPosition.x, // Correction 1: Use targetPositionX
        targetPositionY: exit.targetPosition.y, // Correction 1: Use targetPositionY
      },
    };
    objects.push(exitObject);
  });

  if (objects.length > 0) {
    const objectLayer: JsonMapObjectLayer = {
      name: 'Objects',
      type: 'objectgroup',
      objects: objects,
    };
    jsonMap.layers.push(objectLayer);
  }

  return jsonMap;
}