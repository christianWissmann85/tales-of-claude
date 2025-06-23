// src/types/map-schema.types.ts

import { Position, TileType, NPCRole, EnemyType, ItemType } from './global.types';

/**
 * Represents a generic property for map, layer, or object.
 * This is a simple key-value pair, where value can be string, number, or boolean.
 */
export type JsonProperty = string | number | boolean;
export type JsonProperties = Record<string, JsonProperty>;

/**
 * Base interface for any object placed on an object layer.
 * These objects represent game entities, exits, or interactive elements.
 */
export interface JsonMapObject {
  id: string; // Unique ID for this specific instance (e.g., "npc_debugger_great_01")
  type: 'npc' | 'enemy' | 'item' | 'exit' | 'door' | 'locked_door' | 'trigger' | 'push_block' | 'pressure_plate' | 'switch' | 'code_terminal' | 'puzzle_door' | 'reset_lever'; // Categorization for the game engine
  position: Position; // Grid coordinates (x, y)
  properties?: JsonProperties; // Game-specific properties for this object
}

/**
 * Represents an NPC placed on the map.
 */
export interface JsonMapNPC extends JsonMapObject {
  type: 'npc';
  properties: {
    name: string;
    role: NPCRole;
    dialogueId: string;
    questStatus?: string; // 'not_started' | 'in_progress' | 'completed'
  };
}

/**
 * Represents an enemy placed on the map.
 */
export interface JsonMapEnemy extends JsonMapObject {
  type: 'enemy';
  properties: {
    variant: string; // e.g., "BasicBug", "SyntaxError"
    enemyType?: EnemyType;
    level?: number;
  };
}

/**
 * Represents an item placed on the map.
 */
export interface JsonMapItem extends JsonMapObject {
  type: 'item';
  properties: {
    variant: string; // e.g., "HealthPotion", "DebugBlade"
    itemType?: ItemType;
    quantity?: number;
  };
}

/**
 * Represents an exit/transition point on the map.
 */
export interface JsonMapExit extends JsonMapObject {
  type: 'exit';
  properties: {
    targetMapId: string;
    targetPositionX: number;
    targetPositionY: number;
    displayName?: string; // Optional display name for the exit
  };
}

/**
 * Represents a door or locked door on the map.
 */
export interface JsonMapDoor extends JsonMapObject {
  type: 'door' | 'locked_door';
  properties?: {
    doorId?: string;
    keyItemId?: string;
  };
}

/**
 * Union type for all possible object types.
 */
export type JsonMapObjectType = JsonMapNPC | JsonMapEnemy | JsonMapItem | JsonMapExit | JsonMapDoor | JsonMapObject;

/**
 * Represents a single layer in the map.
 * Layers can be either tile layers or object layers.
 */
export interface JsonMapLayer {
  name: string; // e.g., "base", "collision", "objects"
  type: 'tilelayer' | 'objectgroup';
  visible?: boolean; // Whether the layer is visible (default: true)
  opacity?: number; // Layer opacity (0-1, default: 1)
  properties?: JsonProperties; // Custom properties for this layer
}

/**
 * Represents a tile layer containing tile data.
 */
export interface JsonMapTileLayer extends JsonMapLayer {
  type: 'tilelayer';
  width: number; // Width in tiles
  height: number; // Height in tiles
  data: (TileType | number)[]; // Flattened array of TileTypes or tile IDs (0 means empty)
  tileTypes?: TileType[]; // Optional array mapping tile IDs to TileTypes
}

/**
 * Represents an object layer containing game entities.
 */
export interface JsonMapObjectLayer extends JsonMapLayer {
  type: 'objectgroup';
  objects: JsonMapObjectType[]; // Array of objects on this layer
}

/**
 * Complete JSON map format for Tales of Claude.
 * This format is designed to be extensible and compatible with common map editors.
 */
export interface JsonMap {
  version: string; // Map format version (e.g., "1.0")
  id: string; // Unique map identifier (e.g., "terminalTown")
  name: string; // Display name (e.g., "Terminal Town")
  width: number; // Map width in tiles
  height: number; // Map height in tiles
  tilewidth?: number; // Tile width in pixels (optional, default: 32)
  tileheight?: number; // Tile height in pixels (optional, default: 32)
  
  // Map properties for game-specific settings
  properties?: {
    music?: string; // Background music track ID
    ambience?: string; // Ambient sound ID
    weather?: string; // Weather effect (e.g., "rain", "snow")
    spawnPoint?: Position; // Default spawn position for this map
    [key: string]: JsonProperty | Position | undefined; // Allow additional properties
  };
  
  // Layers in rendering order (bottom to top)
  layers: (JsonMapTileLayer | JsonMapObjectLayer)[];
  
  // Optional tileset information for map editors
  tilesets?: JsonMapTileset[];
}

/**
 * Represents tileset information (optional, mainly for editor compatibility).
 */
export interface JsonMapTileset {
  firstgid: number; // First global tile ID
  name: string; // Tileset name
  tilecount: number; // Number of tiles in the tileset
  properties?: JsonProperties; // Tileset properties
}