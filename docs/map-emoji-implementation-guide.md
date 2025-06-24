This guide provides a detailed technical implementation plan to address the walkability bug, enhance visual fidelity with emoji tiles, implement a tile variety system, and optimize performance, along with a comprehensive testing approach.

---

## Technical Implementation Guide

### 1. WALKABILITY FIX (MapLoader.ts)

**Problem:** The `MapLoader.ts` currently interprets collision layer tile IDs backward. Specifically, `0` (which typically means walkable/no collision in Tiled) is mapped to `'wall'`, and `1` (which typically means wall/collision) is mapped to `'grass'`. This leads to incorrect walkability detection.

**Solution:** Correct the `tileIdToType` mapping and ensure the `collision` layer processing correctly sets `tile.walkable`.

**File:** `src/engine/MapLoader.ts`

**Code Changes:**

```typescript
// src/engine/MapLoader.ts

import { GameMap as IGameMap, Tile, TileType, Exit, NPC, NPCRole, Item } from '../types/global.types';
import { 
  JsonMap, 
  JsonMapObject, 
  JsonMapNPC, 
  JsonMapEnemy, 
  JsonMapItem, 
  JsonMapExit,
  JsonMapDoor,
  JsonMapObjectType,
  JsonMapTileLayer,
  JsonMapObjectLayer
} from '../types/map-schema.types';
import { Enemy, EnemyVariant } from '../models/Enemy';
import { Item as ItemClass, ItemVariant } from '../models/Item';
import { validateJsonMap } from '../utils/mapValidation';

// Import all JSON map files statically for browser/Vite environment
import terminalTownJson from '../assets/maps/json/terminalTown.json';
import terminalTownExpandedJson from '../assets/maps/json/terminalTownExpanded.json';
import crystalCavernsJson from '../assets/maps/json/crystalCaverns.json';
import syntaxSwampJson from '../assets/maps/json/syntaxSwamp.json';
import overworldJson from '../assets/maps/json/overworld.json';

// Define base directories for map files as relative URLs for browser
// These are primarily for the TS map fallback, as JSON maps are now statically imported.
const TS_MAPS_DIR = '/src/assets/maps';

// Type definitions for JSON object types with proper properties
interface JsonNpcObject extends JsonMapObject {
  type: 'npc';
  properties: {
    name: string;
    role: NPCRole;
    dialogueId: string;
    questStatus?: string;
  };
}

interface JsonEnemyObject extends JsonMapObject {
  type: 'enemy';
  properties: {
    variant: string;
    enemyType?: string;
    level?: number;
  };
}

interface JsonItemObject extends JsonMapObject {
  type: 'item';
  properties: {
    variant: string;
    itemType?: string;
    quantity?: number;
  };
}

interface JsonExitObject extends JsonMapObject {
  type: 'exit';
  properties: {
    targetMapId: string;
    targetPositionX: number;
    targetPositionY: number;
    displayName?: string;
  };
}

interface JsonDoorObject extends JsonMapObject {
  type: 'door' | 'locked_door';
  properties?: {
    doorId?: string;
    keyItemId?: string;
  };
}

export class MapLoader {
  private static instance: MapLoader;
  private cache: Map<string, IGameMap> = new Map();
  private isDevMode: boolean = (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) || false;

  // Registry for statically imported JSON maps
  private static readonly jsonMapRegistry: Record<string, JsonMap> = {
    terminalTown: terminalTownJson as any as JsonMap,
    terminalTownExpanded: terminalTownExpandedJson as any as JsonMap,
    crystalCaverns: crystalCavernsJson as any as JsonMap,
    syntaxSwamp: syntaxSwampJson as any as JsonMap,
    overworld: overworldJson as any as JsonMap,
  };

  private constructor() {
    if (this.isDevMode) {
      console.log('MapLoader running in development mode. Hot-reloading handled by bundler (Vite).');
    }
  }

  /**
   * Gets the singleton instance of MapLoader.
   */
  public static getInstance(): MapLoader {
    if (!MapLoader.instance) {
      MapLoader.instance = new MapLoader();
    }
    return MapLoader.instance;
  }

  /**
   * Loads a game map by its ID. Prioritizes JSON (statically imported), then falls back to TS.
   * Caches loaded maps for efficient retrieval.
   * @param mapId The ID of the map to load (e.g., "terminalTown").
   * @returns A Promise that resolves with the loaded IGameMap.
   * @throws Error if the map cannot be loaded from either source.
   */
  public async loadMap(mapId: string): Promise<IGameMap> {
    if (this.cache.has(mapId)) {
      return this.cache.get(mapId)!;
    }

    let gameMap: IGameMap | null = null;
    let jsonError: Error | null = null;

    // 1. Try loading from JSON (statically imported)
    try {
      const jsonMap = await this.loadJsonMap(mapId);
      gameMap = this.processJsonMap(jsonMap);
      console.log(`Successfully loaded map "${mapId}" from JSON.`);
    } catch (error: any) {
      jsonError = error;
      console.warn(`Failed to load map "${mapId}" from JSON: ${error.message}`);
    }

    // 2. Fallback to TS if JSON failed or was not found
    if (!gameMap) {
      try {
        const tsMap = await this.loadTsMap(mapId);
        gameMap = tsMap;
        console.log(`Successfully loaded map "${mapId}" from TS.`);
      } catch (tsError: any) {
        console.error(`Failed to load map "${mapId}" from TS: ${tsError.message}`);
        const combinedError = `Could not load map "${mapId}" from JSON or TS. ` +
                              `JSON Error: ${jsonError ? jsonError.message : 'N/A'}. ` +
                              `TS Error: ${tsError.message}.`;
        throw new Error(combinedError);
      }
    }

    if (!gameMap) {
      throw new Error(`Map "${mapId}" could not be loaded by any method.`);
    }

    this.cache.set(mapId, gameMap);
    return gameMap;
  }

  /**
   * Loads a JSON map from the static import registry, parses it, and validates its structure.
   * This method no longer uses fetch() for local assets.
   * @param mapId The ID of the map.
   * @returns A Promise that resolves with the validated JsonMap.
   * @throws Error if the map is not found in the registry or fails validation.
   */
  private async loadJsonMap(mapId: string): Promise<JsonMap> {
    const importedJson = MapLoader.jsonMapRegistry[mapId];
    if (!importedJson) {
      // If the mapId is not in our static registry, it means it's not a statically imported JSON map.
      // In a browser/Vite environment, we cannot fetch local src/assets paths directly for these.
      // So, we throw an error, letting the loadMap method fall back to TS.
      throw new Error(`JSON map "${mapId}" not found in static import registry.`);
    }

    try {
      validateJsonMap(importedJson); // Validate the structure of the imported JSON
      return importedJson;
    } catch (error: any) {
      throw new Error(`Error validating statically imported JSON map "${mapId}": ${error.message}`);
    }
  }

  /**
   * Loads a TypeScript map file using dynamic import.
   * @param mapId The ID of the map.
   * @returns A Promise that resolves with the IGameMap from the TS file.
   * @throws Error if the file cannot be imported or the expected export is missing/invalid.
   */
  private async loadTsMap(mapId: string): Promise<IGameMap> {
    const url = `${TS_MAPS_DIR}/${mapId}.ts`; // Construct URL for browser dynamic import
    try {
      // Dynamic import for TS files. In a browser, a bundler (like Vite) handles this.
      // /* @vite-ignore */ is added to tell Vite to ignore this import for static analysis,
      // as the path is dynamic and not known at build time.
      const module = await import(/* @vite-ignore */ url);
      const mapData = module[`${mapId}Data`]; // Assumes export name is mapIdData (e.g., terminalTownData)

      if (!mapData || typeof mapData !== 'object' || !mapData.id) {
        throw new Error(`Invalid or missing export for map "${mapId}" in ${url}. Expected export named "${mapId}Data".`);
      }
      return mapData as IGameMap;
    } catch (error: any) {
      throw new Error(`Error loading TS map "${mapId}" from ${url}: ${error.message}`);
    }
  }

  /**
   * Processes a validated JsonMap into the IGameMap format used by the game engine.
   * This involves combining tile layers and converting object layer data into game entities.
   * @param jsonMap The validated JsonMap.
   * @returns The converted IGameMap.
   */
  private processJsonMap(jsonMap: JsonMap): IGameMap {
    // Mapping from numeric tile IDs to TileType strings
    // CRITICAL BUG FIX: Collision layer interpretation was backward.
    // In Tiled, 0 typically means 'no collision' (walkable), and 1 means 'collision' (wall).
    const tileIdToType: Record<number, TileType> = {
      0: 'walkable',  // FIX: 0 means walkable in collision layer
      1: 'wall',      // FIX: 1 means wall in collision layer
      2: 'floor',     // Most common tile type in maps
      3: 'water',
      4: 'wall',      // Redundant, but kept for existing map compatibility if 4 was used for walls
      5: 'door',
      6: 'locked_door',
      7: 'exit',
      8: 'healer',
      9: 'walkable',  // Explicitly 'walkable' for clarity, if used in Tiled
      10: 'path',
      11: 'tree',
      12: 'shop',
      13: 'dungeon_floor',
      14: 'hidden_area',
      15: 'tech_floor',
      16: 'metal_floor',
      17: 'path_one',
      18: 'path_zero',
      // Add any other tile IDs present in your Tiled maps
    };

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
    const tileLayerData: { [key: string]: (TileType | number)[] } = {};
    const objectLayers: JsonMapObjectType[][] = [];

    for (const layer of jsonMap.layers) {
      if (layer.type === 'tilelayer' && layer.data) {
        if (layer.data.length !== tileCount) {
          console.warn(`Map "${jsonMap.id}": Layer "${layer.name}" data length mismatch. Expected ${tileCount}, got ${layer.data.length}. Skipping.`);
          continue;
        }
        tileLayerData[layer.name] = (layer as JsonMapTileLayer).data;
      } else if (layer.type === 'objectgroup' && (layer as JsonMapObjectLayer).objects) {
        objectLayers.push((layer as JsonMapObjectLayer).objects);
      }
    }

    // Populate gameMap.tiles by combining information from different tile layers
    for (let y = 0; y < jsonMap.height; y++) {
      for (let x = 0; x < jsonMap.width; x++) {
        const index = y * jsonMap.width + x;
        const tile: Tile = { walkable: false, type: 'wall' }; // Start with a default non-walkable wall

        // 1. Apply base layer (e.g., grass, floor)
        if (tileLayerData['base'] && tileLayerData['base'][index] !== undefined) {
          const baseValue = tileLayerData['base'][index];
          if (typeof baseValue === 'number') {
            // Convert numeric ID to string TileType
            tile.type = tileIdToType[baseValue] || 'wall';
          } else if (typeof baseValue === 'string') {
            tile.type = baseValue as TileType;
          }
        }

        // 2. Apply decoration layer (e.g., trees, rocks that overlay base)
        if (tileLayerData['decoration'] && tileLayerData['decoration'][index] !== undefined) {
          const decorValue = tileLayerData['decoration'][index];
          let mappedDecorType: TileType | undefined;

          if (typeof decorValue === 'number') {
            mappedDecorType = tileIdToType[decorValue];
          } else if (typeof decorValue === 'string') {
            mappedDecorType = decorValue as TileType;
          }

          // Only apply decoration if it's a valid, non-empty type (0 is often empty/transparent in Tiled)
          if (mappedDecorType && mappedDecorType !== 'walkable' && decorValue !== 0) {
            tile.type = mappedDecorType;
          }
        }

        // 3. Determine walkability and final tile type from collision layer
        // The collision layer is authoritative for walkability and can override visual type for special tiles.
        if (tileLayerData['collision'] && tileLayerData['collision'][index] !== undefined) {
          const collisionValue = tileLayerData['collision'][index];
          let collisionType: TileType = 'wall'; // Default collision type if not mapped

          if (typeof collisionValue === 'number') {
            collisionType = tileIdToType[collisionValue] || 'wall';
          } else if (typeof collisionValue === 'string') {
            collisionType = collisionValue as TileType;
          }
          
          // Determine walkability based on the collision type
          switch (collisionType) {
            case 'walkable':
            case 'grass':
            case 'floor':
            case 'path':
            case 'path_one':
            case 'path_zero':
            case 'dungeon_floor':
            case 'exit': // Exits are walkable
            case 'tech_floor':
            case 'metal_floor':
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
            case 'hidden_area':
              tile.walkable = false;
              break;
            default:
              // If an unknown type is in collision, assume non-walkable
              tile.walkable = false;
              break;
          }
          // If the collision layer specifies a distinct visual type (like door, exit, shop), use it.
          // This ensures that a 'door' in the collision layer correctly renders as a door,
          // even if the base layer underneath was 'floor'.
          if (['door', 'locked_door', 'exit', 'shop', 'healer', 'hidden_area', 'tech_floor', 'metal_floor'].includes(collisionType)) {
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
              statusEffects: [], // NPCs don't typically have status effects on map load
            } as NPC); // Cast to NPC to satisfy IGameMap.entities type
            break;
          case 'enemy':
            const jsonEnemy = obj as JsonEnemyObject;
            const enemyVariant = jsonEnemy.properties.variant as EnemyVariant;
            // Use Enemy constructor to create a proper instance
            const newEnemy: Enemy = new Enemy(jsonEnemy.id, enemyVariant, jsonEnemy.position);
            gameMap.entities.push(newEnemy);
            break;
          case 'item':
            const jsonItem = obj as JsonItemObject;
            const itemVariantStr = jsonItem.properties.variant as string;
            const itemVariant = ItemVariant[itemVariantStr as keyof typeof ItemVariant];
            if (itemVariant) {
              // Create a proper Item instance, ensuring ID and position are set
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
              gameMap.tiles[y][x].type = jsonDoor.type; // Set tile type to 'door' or 'locked_door'
              gameMap.tiles[y][x].walkable = false; // Doors are initially not walkable
              // Note: The global.types.Tile interface doesn't directly support doorId/keyItemId.
              // Game logic would need to query the object layer for these properties if needed.
            }
            break;
          case 'trigger':
            // Handle trigger objects (e.g., for quest triggers, music zones, environmental effects)
            // For now, just log them. A dedicated TriggerManager would process these.
            console.log(`Map "${jsonMap.id}": Found trigger object: ${obj.id} (Type: ${obj.type}) at (${x},${y}) with properties:`, obj.properties);
            break;
          default:
            console.warn(`Map "${jsonMap.id}": Unknown object type encountered: "${(obj as any).type}" for object "${(obj as any).id}". Object not loaded.`);
            break;
        }
      }
    }

    return gameMap;
  }

  /**
   * Cleans up all active file watchers.
   * This method is no longer relevant for browser environment as custom file watchers are removed.
   */
  public cleanupWatchers(): void {
    // No-op in browser environment as fs.watch is not used.
    if (this.isDevMode) {
      console.log('MapLoader: cleanupWatchers is a no-op in browser environment.');
    }
  }
}

```

**Test Cases to Verify Fix:**

1.  **Manual Test:**
    *   Load a map (e.g., `terminalTown`).
    *   Attempt to move the player onto tiles that were previously incorrectly marked as walls (e.g., grass tiles if `0` was previously `wall`). The player should now be able to move onto them.
    *   Attempt to move onto known wall tiles (e.g., actual walls, trees, water). The player should still be blocked.
    *   Verify movement through doors (if implemented) or onto exit tiles.

2.  **Automated Test (Conceptual, requires test framework setup):**
    *   **Unit Test for `MapLoader.processJsonMap`:**
        *   Create a minimal `JsonMap` object with a `collision` layer containing `0` and `1` values.
        *   Call `MapLoader.getInstance().processJsonMap(testJsonMap)`.
        *   Assert that `gameMap.tiles[y][x].walkable` is `true` for positions corresponding to `0` in the collision layer.
        *   Assert that `gameMap.tiles[y][x].walkable` is `false` for positions corresponding to `1` in the collision layer.
    *   **Integration Test (MovementSystem/GameEngine):**
        *   Load a specific map.
        *   Programmatically set the player's position next to a tile that *should* be walkable (e.g., a grass tile that was previously a wall).
        *   Call `GameEngine.movePlayer(direction)` towards that tile.
        *   Assert that the player's position has updated, indicating successful movement.
        *   Repeat for a tile that *should* be a wall, asserting that the player's position remains unchanged.

### 2. EMOJI TILE MAPPING UPDATE (GameBoard.tsx)

**Problem:** The current `tileMap` uses basic ASCII characters for some tiles, and is incomplete.

**Solution:** Update the `tileMap` to use more expressive emoji characters and ensure all `TileType`s are mapped.

**File:** `src/components/GameBoard/GameBoard.tsx`

**Code Changes:**

```typescript
// src/components/GameBoard/GameBoard.tsx

// ... (imports and other code)

// Map tile types to their visual representation (emoji/ASCII)
// BEFORE:
// const tileMap: Record<TileType, string> = {
//   grass: '·',
//   tree: '🌲',
//   wall: '#',
//   water: '~',
//   door: '🚪',
//   exit: '🚪',
//   shop: '🏪',
//   healer: '🏥',
//   walkable: ' ',
//   path: '·',
//   path_one: '1',
//   path_zero: '0',
//   floor: '.',
//   dungeon_floor: '⬛',
//   locked_door: '🔒',
//   hidden_area: '✨',
//   tech_floor: '⚡',
//   metal_floor: '▓',
// };

// AFTER:
const tileMap: Record<TileType, string> = {
  grass: '🌿', // Updated from '·'
  tree: '🌲',  // Already good
  wall: '🧱',  // Updated from '#'
  water: '🌊', // Updated from '~'
  door: '🚪',
  exit: '➡️', // Changed from '🚪' for clearer distinction
  shop: '🏪',
  healer: '🏥',
  walkable: ' ', // Generic walkable, often overridden by base layer
  path: '👣', // Path tile
  path_one: '1️⃣', // Binary forest path showing '1'
  path_zero: '0️⃣', // Binary forest path showing '0'
  floor: '⬜', // Generic floor, light
  dungeon_floor: '⬛', // Dark dungeon floor
  locked_door: '🔒',
  hidden_area: '✨',
  tech_floor: '⚡',
  metal_floor: '⚙️', // Metal floor
  // Ensure all TileType values from global.types.ts are covered.
  // Add more if new TileTypes are introduced.
};

// ... (rest of the GameBoard.tsx code)
```

### 3. TILE VARIETY SYSTEM (GameBoard.tsx)

**Problem:** Tiles of the same type (e.g., 'grass') look identical, leading to a repetitive visual experience.

**Solution:** Implement a `tileVariants` system that provides multiple emoji options for certain tile types and deterministically selects one based on the tile's coordinates to ensure consistency without flickering.

**File:** `src/components/GameBoard/GameBoard.tsx`

**Code Changes:**

```typescript
// src/components/GameBoard/GameBoard.tsx

import React, { useEffect, useRef, useCallback } from 'react';
import { useGameContext } from '../../context/GameContext';
import { useKeyboard } from '../../hooks/useKeyboard';
import { GameEngine } from '../../engine/GameEngine';
import { MovementSystem } from '../../engine/MovementSystem';
import { Position, TileType, Enemy, NPC, Item as IItem, CombatLogEntry, TimeOfDay } from '../../types/global.types';
import Inventory from '../Inventory/Inventory';
import { Inventory as InventoryModel } from '../../models/Inventory';
import { Player } from '../../models/Player';
import { Item as ItemClass } from '../../models/Item';
import QuestJournal from '../QuestJournal/QuestJournal';
import QuestTracker from '../QuestTracker/QuestTracker';
import CharacterScreen from '../CharacterScreen/CharacterScreen';
import { EquipmentSlotType } from '../../models/Player';
import { TalentTree } from '../../models/TalentTree';
import PlayerProgressBar from '../PlayerProgressBar/PlayerProgressBar';
import MiniCombatLog from '../MiniCombatLog/MiniCombatLog';
import { useNotification } from '../NotificationSystem/NotificationSystem';
import Hotbar from '../Hotbar/Hotbar';
import Shop from '../Shop/Shop';
import Minimap from '../Minimap/Minimap';
import WeatherEffects from '../WeatherEffects/WeatherEffects';
import WeatherDisplay from '../WeatherDisplay/WeatherDisplay';
import FactionStatus from '../FactionStatus/FactionStatus';

import styles from './GameBoard.module.css';

// Define the display dimensions for the game board
const DISPLAY_WIDTH = 20;
const DISPLAY_HEIGHT = 15;

// Helper function to deep clone a Player instance
const clonePlayer = (player: Player): Player => {
  const newPlayer = new Player(player.id, player.name, { ...player.position });
  newPlayer.statusEffects = player.statusEffects.map(se => ({ ...se }));
  newPlayer.updateBaseStats(player.getBaseStats());
  newPlayer.inventory = player.inventory.map(item => ({
    ...item,
    position: item.position ? { ...item.position } : undefined,
  }));
  newPlayer.abilities = player.abilities.map(ability => ({ ...ability }));
  if (player.weaponSlot) newPlayer.weaponSlot = { ...player.weaponSlot };
  if (player.armorSlot) newPlayer.armorSlot = { ...player.armorSlot };
  if (player.accessorySlot) newPlayer.accessorySlot = { ...player.accessorySlot };
  
  // Copy talent system
  newPlayer.talentPoints = player.talentPoints;
  
  // Deep copy the TalentTree by recreating invested points
  const clonedTalentTree = new TalentTree();
  player.talentTree.getAllTalents().forEach(originalTalent => {
    for (let i = 0; i < originalTalent.currentRank; i++) {
      clonedTalentTree.investPoint(originalTalent.id);
    }
  });
  newPlayer.talentTree = clonedTalentTree;
  
  // Copy exploration data
  newPlayer.exploredMaps = new Map();
  player.exploredMaps.forEach((tiles, mapId) => {
    newPlayer.exploredMaps.set(mapId, new Set(tiles));
  });
  
  return newPlayer;
};

// Map tile types to their visual representation (emoji/ASCII)
const tileMap: Record<TileType, string> = {
  grass: '🌿',
  tree: '🌲',
  wall: '🧱',
  water: '🌊',
  door: '🚪',
  exit: '➡️',
  shop: '🏪',
  healer: '🏥',
  walkable: ' ',
  path: '👣',
  path_one: '1️⃣',
  path_zero: '0️⃣',
  floor: '⬜',
  dungeon_floor: '⬛',
  locked_door: '🔒',
  hidden_area: '✨',
  tech_floor: '⚡',
  metal_floor: '⚙️',
};

// Define tile variants for a richer visual experience
const tileVariants: Record<TileType, string[]> = {
  grass: ['🌿', '🌱', '🌾', '🍃'],
  tree: ['🌲', '🌳', '🌴', '🎋'],
  wall: ['🧱', '🪨', '🗿'], // Stone, rock, moai for variety
  water: ['🌊', '💧', '💦'], // Wave, droplet, sweat droplets for water
  floor: ['⬜', '▫️', '◽'], // Different shades of white square
  dungeon_floor: ['⬛', '▪️', '◾'], // Different shades of black square
  path: ['👣', '🐾'], // Footprints, paw prints
  // Add more variants for other tile types as desired
  // For types not listed here, the default tileMap emoji will be used.
};

/**
 * Deterministically selects a tile variant based on its coordinates.
 * This ensures that a specific tile (x,y) always renders the same variant,
 * preventing flickering or random changes on re-render.
 * @param type The TileType.
 * @param x The x-coordinate of the tile.
 * @param y The y-coordinate of the tile.
 * @returns The selected emoji string.
 */
const getTileVariant = (type: TileType, x: number, y: number): string => {
  const variants = tileVariants[type];
  if (variants && variants.length > 0) {
    // Use a simple hash function for deterministic selection
    // Prime numbers (31, 17) help distribute the hash
    const hash = (x * 31 + y * 17) % variants.length;
    return variants[hash];
  }
  // Fallback to the default tileMap emoji if no variants are defined or available
  return tileMap[type] || '?';
};

// Map entity types to their visual representation
const entityMap = {
  player: '🤖',
  npc: '🧙',
  enemy: '👾',
  item: '💾',
};

const GameBoard: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const { pressedKeys, getDirection } = useKeyboard();
  const gameEngineRef = useRef<GameEngine | null>(null);
  const { notify } = useNotification();
  const [combatLog, setCombatLog] = React.useState<CombatLogEntry[]>([]);

  // Get current time period for atmospheric styling
  const getTimeOfDay = (): TimeOfDay => {
    if (!state.timeData) return 'day';
    const hour = state.timeData.hours;
    if (hour >= 6 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 18) return 'day';
    if (hour >= 18 && hour < 20) return 'dusk';
    return 'night';
  };

  // FIX: Initialize GameEngine instance only once on component mount.
  // The empty dependency array ensures this useEffect runs only on initial mount.
  // `dispatch` is stable, and the initial `state` is passed; subsequent state
  // updates are handled by the separate `useEffect` below.
  useEffect(() => {
    if (!gameEngineRef.current) {
      gameEngineRef.current = new GameEngine(dispatch, state); // `dispatch` is stable, `state` is initial
      gameEngineRef.current.start();
    }

    // Cleanup: stop the engine when the component unmounts
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
        gameEngineRef.current = null; // Clear the ref on unmount for robustness
      }
    };
  }, []); // FIX: Empty dependency array ensures this runs only once on mount

  // Update GameEngine's internal state whenever the GameContext state changes.
  // This keeps the engine's snapshot of the game state up-to-date for its logic,
  // without recreating the engine instance.
  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setGameState(state);
    }
  }, [state]); // Correctly depends only on `state`

  // Pass raw keyboard input (set of pressed keys) to the GameEngine.
  // The engine can then use this for its internal input processing loop.
  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.handleKeyboardInput(pressedKeys);
    }
  }, [pressedKeys]); // Only re-run if the Set of pressed keys changes
  
  // Track defeated enemies from battle results
  const prevBattleRef = useRef(state.battle);
  useEffect(() => {
    // Check if battle just ended (was active, now null)
    if (prevBattleRef.current && !state.battle && gameEngineRef.current) {
      // Get defeated enemy IDs from the previous battle state
      const defeatedEnemyIds = prevBattleRef.current.enemies
        .filter(enemy => enemy.hp <= 0)
        .map(enemy => enemy.id);
      
      // Mark each defeated enemy in the patrol system
      defeatedEnemyIds.forEach(enemyId => {
        gameEngineRef.current!.markEnemyDefeated(enemyId);
      });
    }
    prevBattleRef.current = state.battle;
  }, [state.battle]);

  // Add loading check before rendering
  if (state.currentMap.id === 'loading' || !state.currentMap.tiles || state.currentMap.tiles.length === 0) {
    return (
      <div className={styles.gameBoard} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '600px'
      }}>
        <div>Loading map...</div>
      </div>
    );
  }

  /**
   * Determines the character (emoji/ASCII) to render at a specific grid position.
   * Prioritizes entities over map tiles.
   */
  const getCellContent = useCallback((x: number, y: number): string => {
    const { player, enemies, npcs, items, currentMap } = state;

    // 1. Check for Player at this position
    if (player.position.x === x && player.position.y === y) {
      return entityMap.player;
    }

    // 2. Check for NPCs at this position
    const npcAtPos = npcs.find(npc => npc.position.x === x && npc.position.y === y);
    if (npcAtPos) {
      // Use specific emoji based on NPC role
      if (npcAtPos.role === 'compiler_cat') {
        return '🐱'; // Cat emoji for Compiler Cat
      } else if (npcAtPos.role === 'debugger') {
        return '🧙'; // Keep wizard for The Great Debugger
      }
      return entityMap.npc; // Default NPC emoji
    }

    // 3. Check for Enemies at this position
    const enemyAtPos = enemies.find(enemy => enemy.position.x === x && enemy.position.y === y);
    if (enemyAtPos) {
      return entityMap.enemy;
    }

    // 4. Check for Items at this position (only if they have a position on the map)
    const itemAtPos = items.find((item: IItem) => item.position && item.position.x === x && item.position.y === y);
    if (itemAtPos) {
      return entityMap.item;
    }

    // 5. If no entity is found, render the underlying map tile
    const tile = currentMap.tiles[y]?.[x]; // Access tile safely
    // Use getTileVariant for tiles that have variety, otherwise use default tileMap
    return tile ? getTileVariant(tile.type, x, y) : ' '; // Fallback to ' ' for out-of-bounds
  }, [state.player, state.enemies, state.npcs, state.items, state.currentMap]);

  // Calculate camera offset for centering the player if the map is larger than the display viewport.
  const mapWidth = state.currentMap.width;
  const mapHeight = state.currentMap.height;
  const playerX = state.player.position.x;
  const playerY = state.player.position.y;

  let startX = 0;
  let startY = 0;

  // Calculate horizontal offset
  if (mapWidth > DISPLAY_WIDTH) {
    startX = playerX - Math.floor(DISPLAY_WIDTH / 2);
    // Clamp startX to ensure it doesn't go out of map bounds
    startX = Math.max(0, startX);
    startX = Math.min(mapWidth - DISPLAY_WIDTH, startX);
  }

  // Calculate vertical offset
  if (mapHeight > DISPLAY_HEIGHT) {
    startY = playerY - Math.floor(DISPLAY_HEIGHT / 2);
    // Clamp startY to ensure it doesn't go out of map bounds
    startY = Math.max(0, startY);
    startY = Math.min(mapHeight - DISPLAY_HEIGHT, startY);
  }

  // Generate grid cells for rendering
  // This part will be extracted into a memoized component for performance.
  const timeOfDay = getTimeOfDay();

  // ... (rest of the GameBoard component)
```

### 4. PERFORMANCE OPTIMIZATIONS

**A. Caching Strategies (MapLoader.ts)**

*   **Current Status:** The `MapLoader` already implements a `cache: Map<string, IGameMap>` to store loaded maps. This is crucial for performance, as it prevents re-parsing and re-processing map data every time a map is requested.
*   **Verification:** The `loadMap` method correctly checks `this.cache.has(mapId)` before attempting to load, and `this.cache.set(mapId, gameMap)` after successful loading.
*   **Consideration:** For very large maps or maps with frequent updates (e.g., dynamic changes to tiles/entities), a more granular caching strategy might be considered, but for static map data, the current approach is highly effective.

**B. Render Optimization (GameBoard.tsx)**

**Problem:** The `gridCells` array is generated inside the `GameBoard` component's render function. Since `GameBoard` re-renders frequently due to `state` changes (player movement, time updates, etc.), this loop runs on every render, even if the visible map area hasn't changed.

**Solution:** Extract the map grid rendering into a separate, memoized component (`MapGrid`) to prevent unnecessary re-renders of the grid cells.

**New File:** `src/components/GameBoard/MapGrid.tsx`

```typescript
// src/components/GameBoard/MapGrid.tsx

import React, { memo, useCallback } from 'react';
import { Position, TileType, Enemy, NPC, Item as IItem } from '../../types/global.types';
import { GameMap } from '../../types/global.types'; // Assuming GameMap type is available
import styles from './GameBoard.module.css'; // Re-use existing styles

// Define tile variants for a richer visual experience (copied from GameBoard.tsx)
const tileVariants: Record<TileType, string[]> = {
  grass: ['🌿', '🌱', '🌾', '🍃'],
  tree: ['🌲', '🌳', '🌴', '🎋'],
  wall: ['🧱', '🪨', '🗿'],
  water: ['🌊', '💧', '💦'],
  floor: ['⬜', '▫️', '◽'],
  dungeon_floor: ['⬛', '▪️', '◾'],
  path: ['👣', '🐾'],
};

// Map tile types to their visual representation (emoji/ASCII) (copied from GameBoard.tsx)
const tileMap: Record<TileType, string> = {
  grass: '🌿',
  tree: '🌲',
  wall: '🧱',
  water: '🌊',
  door: '🚪',
  exit: '➡️',
  shop: '🏪',
  healer: '🏥',
  walkable: ' ',
  path: '👣',
  path_one: '1️⃣',
  path_zero: '0️⃣',
  floor: '⬜',
  dungeon_floor: '⬛',
  locked_door: '🔒',
  hidden_area: '✨',
  tech_floor: '⚡',
  metal_floor: '⚙️',
};

// Map entity types to their visual representation (copied from GameBoard.tsx)
const entityMap = {
  player: '🤖',
  npc: '🧙',
  enemy: '👾',
  item: '💾',
};

/**
 * Deterministically selects a tile variant based on its coordinates.
 * This ensures that a specific tile (x,y) always renders the same variant,
 * preventing flickering or random changes on re-render.
 * @param type The TileType.
 * @param x The x-coordinate of the tile.
 * @param y The y-coordinate of the tile.
 * @returns The selected emoji string.
 */
const getTileVariant = (type: TileType, x: number, y: number): string => {
  const variants = tileVariants[type];
  if (variants && variants.length > 0) {
    const hash = (x * 31 + y * 17) % variants.length;
    return variants[hash];
  }
  return tileMap[type] || '?';
};

interface MapGridProps {
  currentMap: GameMap;
  playerPos: Position;
  enemies: Enemy[];
  npcs: NPC[];
  items: IItem[];
  display_width: number;
  display_height: number;
  isAsciiMode: boolean; // For ASCII fallback
}

const MapGrid: React.FC<MapGridProps> = ({
  currentMap,
  playerPos,
  enemies,
  npcs,
  items,
  display_width,
  display_height,
  isAsciiMode,
}) => {

  // ASCII fallback map
  const asciiTileMap: Record<TileType, string> = {
    grass: '.',
    tree: 'T',
    wall: '#',
    water: '~',
    door: 'D',
    exit: 'E',
    shop: 'S',
    healer: 'H',
    walkable: ' ',
    path: '.',
    path_one: '1',
    path_zero: '0',
    floor: '.',
    dungeon_floor: 'X',
    locked_door: 'L',
    hidden_area: '?',
    tech_floor: '=',
    metal_floor: 'M',
  };

  // ASCII entity map
  const asciiEntityMap = {
    player: '@',
    npc: 'N',
    enemy: '!',
    item: 'i',
  };

  /**
   * Determines the character (emoji/ASCII) to render at a specific grid position.
   * Prioritizes entities over map tiles.
   */
  const getCellContent = useCallback((x: number, y: number): string => {
    // Determine which map to use based on isAsciiMode
    const currentTileMap = isAsciiMode ? asciiTileMap : tileMap;
    const currentEntityMap = isAsciiMode ? asciiEntityMap : entityMap;

    // 1. Check for Player at this position
    if (playerPos.x === x && playerPos.y === y) {
      return currentEntityMap.player;
    }

    // 2. Check for NPCs at this position
    const npcAtPos = npcs.find(npc => npc.position.x === x && npc.position.y === y);
    if (npcAtPos) {
      if (!isAsciiMode) {
        if (npcAtPos.role === 'compiler_cat') return '🐱';
        if (npcAtPos.role === 'debugger') return '🧙';
      }
      return currentEntityMap.npc;
    }

    // 3. Check for Enemies at this position
    const enemyAtPos = enemies.find(enemy => enemy.position.x === x && enemy.position.y === y);
    if (enemyAtPos) {
      return currentEntityMap.enemy;
    }

    // 4. Check for Items at this position
    const itemAtPos = items.find((item: IItem) => item.position && item.position.x === x && item.position.y === y);
    if (itemAtPos) {
      return currentEntityMap.item;
    }

    // 5. If no entity is found, render the underlying map tile
    const tile = currentMap.tiles[y]?.[x];
    if (!tile) return ' '; // Out of bounds

    // Use getTileVariant for emoji mode, otherwise use asciiTileMap directly
    return isAsciiMode ? currentTileMap[tile.type] || '?' : getTileVariant(tile.type, x, y);
  }, [currentMap, playerPos, enemies, npcs, items, isAsciiMode]);

  // Calculate camera offset for centering the player
  let startX = 0;
  let startY = 0;

  if (currentMap.width > display_width) {
    startX = playerPos.x - Math.floor(display_width / 2);
    startX = Math.max(0, startX);
    startX = Math.min(currentMap.width - display_width, startX);
  }

  if (currentMap.height > display_height) {
    startY = playerPos.y - Math.floor(display_height / 2);
    startY = Math.max(0, startY);
    startY = Math.min(currentMap.height - display_height, startY);
  }

  const gridCells = [];
  for (let y = 0; y < display_height; y++) {
    for (let x = 0; x < display_width; x++) {
      const mapX = startX + x;
      const mapY = startY + y;
      const content = getCellContent(mapX, mapY);

      gridCells.push(
        <div
          key={`${mapX}-${mapY}`}
          className={styles.gridCell}
          data-map-x={mapX}
          data-map-y={mapY}
        >
          {content}
        </div>,
      );
    }
  }

  return (
    <div
      className={styles.gameBoardGrid} // A new style for the grid container
      style={{
        gridTemplateColumns: `repeat(${display_width}, 1fr)`,
        gridTemplateRows: `repeat(${display_height}, 1fr)`,
      }}
    >
      {gridCells}
    </div>
  );
};

export default memo(MapGrid); // Memoize the component
```

**Update `GameBoard.tsx` to use `MapGrid`:**

```typescript
// src/components/GameBoard/GameBoard.tsx

import React, { useEffect, useRef, useCallback } from 'react';
import { useGameContext } from '../../context/GameContext';
import { useKeyboard } from '../../hooks/useKeyboard';
import { GameEngine } from '../../engine/GameEngine';
// import { MovementSystem } from '../../engine/MovementSystem'; // No longer directly used here
import { Position, TileType, Enemy, NPC, Item as IItem, CombatLogEntry, TimeOfDay } from '../../types/global.types';
import Inventory from '../Inventory/Inventory';
import { Inventory as InventoryModel } from '../../models/Inventory';
import { Player } from '../../models/Player';
import { Item as ItemClass } from '../../models/Item';
import QuestJournal from '../QuestJournal/QuestJournal';
import QuestTracker from '../QuestTracker/QuestTracker';
import CharacterScreen from '../CharacterScreen/CharacterScreen';
import { EquipmentSlotType } from '../../models/Player';
import { TalentTree } from '../../models/TalentTree';
import PlayerProgressBar from '../PlayerProgressBar/PlayerProgressBar';
import MiniCombatLog from '../MiniCombatLog/MiniCombatLog';
import { useNotification } from '../NotificationSystem/NotificationSystem';
import Hotbar from '../Hotbar/Hotbar';
import Shop from '../Shop/Shop';
import Minimap from '../Minimap/Minimap';
import WeatherEffects from '../WeatherEffects/WeatherEffects';
import WeatherDisplay from '../WeatherDisplay/WeatherDisplay';
import FactionStatus from '../FactionStatus/FactionStatus';
import MapGrid from './MapGrid'; // Import the new MapGrid component

import styles from './GameBoard.module.css';

// Define the display dimensions for the game board
const DISPLAY_WIDTH = 20;
const DISPLAY_HEIGHT = 15;

// Helper function to deep clone a Player instance
const clonePlayer = (player: Player): Player => {
  const newPlayer = new Player(player.id, player.name, { ...player.position });
  newPlayer.statusEffects = player.statusEffects.map(se => ({ ...se }));
  newPlayer.updateBaseStats(player.getBaseStats());
  newPlayer.inventory = player.inventory.map(item => ({
    ...item,
    position: item.position ? { ...item.position } : undefined,
  }));
  newPlayer.abilities = player.abilities.map(ability => ({ ...ability }));
  if (player.weaponSlot) newPlayer.weaponSlot = { ...player.weaponSlot };
  if (player.armorSlot) newPlayer.armorSlot = { ...player.armorSlot };
  if (player.accessorySlot) newPlayer.accessorySlot = { ...player.accessorySlot };
  
  // Copy talent system
  newPlayer.talentPoints = player.talentPoints;
  
  // Deep copy the TalentTree by recreating invested points
  const clonedTalentTree = new TalentTree();
  player.talentTree.getAllTalents().forEach(originalTalent => {
    for (let i = 0; i < originalTalent.currentRank; i++) {
      clonedTalentTree.investPoint(originalTalent.id);
    }
  });
  newPlayer.talentTree = clonedTalentTree;
  
  // Copy exploration data
  newPlayer.exploredMaps = new Map();
  player.exploredMaps.forEach((tiles, mapId) => {
    newPlayer.exploredMaps.set(mapId, new Set(tiles));
  });
  
  return newPlayer;
};

// NOTE: tileMap and tileVariants are now moved to MapGrid.tsx
// const tileMap: Record<TileType, string> = { ... };
// const tileVariants: Record<TileType, string[]> = { ... };
// const getTileVariant = ...;

// NOTE: entityMap is also moved to MapGrid.tsx
// const entityMap = { ... };

const GameBoard: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const { pressedKeys, getDirection } = useKeyboard();
  const gameEngineRef = useRef<GameEngine | null>(null);
  const { notify } = useNotification();
  const [combatLog, setCombatLog] = React.useState<CombatLogEntry[]>([]);
  const [isAsciiMode, setIsAsciiMode] = React.useState(false); // New state for ASCII mode

  // Get current time period for atmospheric styling
  const getTimeOfDay = (): TimeOfDay => {
    if (!state.timeData) return 'day';
    const hour = state.timeData.hours;
    if (hour >= 6 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 18) return 'day';
    if (hour >= 18 && hour < 20) return 'dusk';
    return 'night';
  };

  useEffect(() => {
    if (!gameEngineRef.current) {
      gameEngineRef.current = new GameEngine(dispatch, state);
      gameEngineRef.current.start();
    }
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
        gameEngineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setGameState(state);
    }
  }, [state]);

  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.handleKeyboardInput(pressedKeys);
    }
  }, [pressedKeys]);
  
  // Track defeated enemies from battle results
  const prevBattleRef = useRef(state.battle);
  useEffect(() => {
    if (prevBattleRef.current && !state.battle && gameEngineRef.current) {
      const defeatedEnemyIds = prevBattleRef.current.enemies
        .filter(enemy => enemy.hp <= 0)
        .map(enemy => enemy.id);
      
      defeatedEnemyIds.forEach(enemyId => {
        gameEngineRef.current!.markEnemyDefeated(enemyId);
      });
    }
    prevBattleRef.current = state.battle;
  }, [state.battle]);

  // Add loading check before rendering
  if (state.currentMap.id === 'loading' || !state.currentMap.tiles || state.currentMap.tiles.length === 0) {
    return (
      <div className={styles.gameBoard} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '600px'
      }}>
        <div>Loading map...</div>
      </div>
    );
  }

  // NOTE: getCellContent is now moved to MapGrid.tsx

  // Calculate camera offset for centering the player if the map is larger than the display viewport.
  const mapWidth = state.currentMap.width;
  const mapHeight = state.currentMap.height;
  const playerX = state.player.position.x;
  const playerY = state.player.position.y;

  // NOTE: startX and startY calculation is now moved to MapGrid.tsx
  // let startX = 0;
  // let startY = 0;
  // ... (calculation logic)

  // NOTE: gridCells generation is now moved to MapGrid.tsx
  // const gridCells = [];
  // ... (loop and push logic)

  // Create an InventoryModel instance from the player's inventory items
  const playerInventory = React.useMemo(() => {
    const inventory = new InventoryModel();
    state.player.inventory.forEach(item => {
      if (item && item.id && item.type) {
        if (!(item instanceof ItemClass) && 'name' in item) {
          inventory.addItem(item as any);
        } else {
          inventory.addItem(item);
        }
      } else {
        console.error('Invalid item in player inventory:', item);
      }
    });
    return inventory;
  }, [state.player.inventory]);

  const handleHotbarConfigChange = useCallback((newConfig: (string | null)[]) => {
    dispatch({ type: 'UPDATE_HOTBAR_CONFIG', payload: { hotbarConfig: newConfig } });
  }, [dispatch]);

  const handleFastTravel = useCallback((mapId: string, position: Position) => {
    if (mapId === state.currentMap.id) {
      dispatch({ type: 'TELEPORT_PLAYER', payload: position });
      notify({ type: 'success', message: `Traveled to ${position.x}, ${position.y}` });
    } else {
      notify({ type: 'warning', message: `Travel to ${mapId} not yet implemented` });
    }
  }, [dispatch, notify, state.currentMap.id]);

  const handleUseItem = useCallback((itemId: string, quantity?: number) => {
    const item = playerInventory.getItem(itemId);
    if (item && item instanceof ItemClass) {
      const result = item.use(state.player);
      
      if (result.success) {
        if (item.type === 'consumable') {
          if (item.effect === 'restoreHp' && item.value) {
            const newPlayer = clonePlayer(state.player);
            newPlayer.heal(item.value);
            dispatch({ type: 'UPDATE_PLAYER_STATS', payload: { stats: newPlayer.getBaseStats() } });
          } else if (item.effect === 'restoreEnergy' && item.value) {
            const newPlayer = clonePlayer(state.player);
            newPlayer.restoreEnergy(item.value);
            dispatch({ type: 'UPDATE_PLAYER_STATS', payload: { stats: newPlayer.getBaseStats() } });
          }
          dispatch({ type: 'REMOVE_ITEM', payload: { itemId, fromPlayerInventory: true } });
        }
        dispatch({ type: 'SHOW_INVENTORY', payload: { show: false } });
      }
      
      notify({
        type: result.success ? 'success' : 'warning',
        message: result.message
      });
    }
  }, [playerInventory, state.player, dispatch]);

  const handleCloseInventory = useCallback(() => {
    dispatch({ type: 'SHOW_INVENTORY', payload: { show: false } });
  }, [dispatch]);

  const handleEquipItem = useCallback((itemId: string) => {
    const item = playerInventory.getItem(itemId);
    if (item && item.type === 'equipment') {
      const newPlayer = clonePlayer(state.player);
      const previousItem = newPlayer.equip(item);
      
      dispatch({ type: 'UPDATE_PLAYER', payload: { player: newPlayer } });
      
      notify({
        type: 'success',
        message: previousItem 
          ? `Equipped ${item.name} (replaced ${previousItem.name})`
          : `Equipped ${item.name}`
      });
    }
  }, [playerInventory, state.player, dispatch]);

  const handleCloseCharacterScreen = useCallback(() => {
    dispatch({ type: 'SHOW_CHARACTER_SCREEN', payload: { show: false } });
  }, [dispatch]);

  const handleUnequipItem = useCallback((slotType: EquipmentSlotType) => {
    const newPlayer = clonePlayer(state.player);
    const unequippedItem = newPlayer.unequip(slotType);
    
    dispatch({ type: 'UPDATE_PLAYER', payload: { player: newPlayer } });
    
    if (unequippedItem) {
      notify({
        type: 'success',
        message: `Unequipped ${unequippedItem.name}`
      });
    }
  }, [state.player, dispatch]);

  const handleSpendTalentPoint = useCallback((talentId: string) => {
    const newPlayer = clonePlayer(state.player);
    const success = newPlayer.spendTalentPoint(talentId);
    if (success) {
      dispatch({ type: 'UPDATE_PLAYER_STATS', payload: { stats: newPlayer.getBaseStats() } });
    }
  }, [state.player, dispatch]);

  const handleResetTalents = useCallback(() => {
    const newPlayer = clonePlayer(state.player);
    newPlayer.resetTalents();
    dispatch({ type: 'UPDATE_PLAYER_STATS', payload: { stats: newPlayer.getBaseStats() } });
  }, [state.player, dispatch]);

  useEffect(() => {
    if (state.notification) {
      notify({
        type: 'info',
        message: state.notification
      });
      dispatch({ type: 'CLEAR_NOTIFICATION' });
    }
  }, [state.notification, notify, dispatch]);

  useEffect(() => {
    if (state.battle && state.battle.log.length > 0) {
      const newEntries = state.battle.log.map((msg, index) => ({
        id: `battle-${Date.now()}-${index}`,
        type: msg.includes('damage') ? 'damage' as const : 
              msg.includes('heal') ? 'healing' as const : 
              msg.includes('uses') ? 'ability' as const : 'info' as const,
        message: msg,
        timestamp: Date.now()
      }));
      setCombatLog(prev => [...prev, ...newEntries].slice(-20));
    }
  }, [state.battle?.log]);

  const timeOfDay = getTimeOfDay();

  return (
    <>
      <div
        className={`${styles.gameBoard} ${styles[timeOfDay]}`}
        // The grid styling is now applied to MapGrid component
        // style={{
        //   gridTemplateColumns: `repeat(${DISPLAY_WIDTH}, 1fr)`,
        //   gridTemplateRows: `repeat(${DISPLAY_HEIGHT}, 1fr)`,
        // }}
      >
        <MapGrid
          currentMap={state.currentMap}
          playerPos={state.player.position}
          enemies={state.enemies}
          npcs={state.npcs}
          items={state.items}
          display_width={DISPLAY_WIDTH}
          display_height={DISPLAY_HEIGHT}
          isAsciiMode={isAsciiMode} // Pass the ASCII mode state
        />
        {/* Display FPS counter for debugging, if GameEngine is initialized */}
        {gameEngineRef.current && (
          <div className={styles.fpsCounter}>
            FPS: {gameEngineRef.current.fps}
            <button onClick={() => setIsAsciiMode(prev => !prev)} className={styles.asciiToggle}>
              {isAsciiMode ? 'Emoji Mode' : 'ASCII Mode'}
            </button>
          </div>
        )}
        {/* Weather Effects Overlay */}
        {state.weatherData && (
          <WeatherEffects
            weatherType={state.weatherData.currentWeather}
            transitionProgress={state.weatherData.transitionProgress}
          />
        )}
      </div>
      {/* Player Progress Bar */}
      <PlayerProgressBar
        level={state.player.stats.level}
        currentXP={state.player.stats.exp}
        maxXpForLevel={state.player.stats.level * 100}
        currentHP={state.player.stats.hp}
        maxHP={state.player.stats.maxHp}
        currentEnergy={state.player.stats.energy}
        maxEnergy={state.player.stats.maxEnergy}
      />
      {/* Mini Combat Log - only show during battles */}
      {state.battle && (
        <MiniCombatLog logEntries={combatLog} />
      )}
      {/* Hotbar - always visible at bottom of screen */}
      <Hotbar
        inventory={playerInventory}
        player={state.player}
        onUseItem={handleUseItem}
        initialHotbarConfig={state.hotbarConfig}
        onHotbarConfigChange={handleHotbarConfigChange}
      />
      {/* Render inventory UI when visible */}
      {state.showInventory && (
        <Inventory
          inventory={playerInventory}
          onClose={handleCloseInventory}
          onUseItem={handleUseItem}
          player={state.player}
          onEquipItem={handleEquipItem}
        />
      )}
      {/* Quest Tracker - always visible to show active objectives */}
      <QuestTracker 
        onOpenJournal={() => dispatch({ type: 'UPDATE_GAME_FLAG', payload: { key: 'showQuestLog', value: true } })}
        playerPosition={state.player.position}
      />
      {/* Render quest journal UI when visible */}
      {state.showQuestLog && (
        <QuestJournal />
      )}
      {/* Render character screen UI when visible */}
      {state.showCharacterScreen && (
        <CharacterScreen
          player={state.player}
          onClose={handleCloseCharacterScreen}
          onEquipItem={handleEquipItem}
          onUnequipItem={handleUnequipItem}
          onSpendTalentPoint={handleSpendTalentPoint}
          onResetTalents={handleResetTalents}
        />
      )}
      {/* Render faction status UI when visible */}
      {state.showFactionStatus && (
        <FactionStatus />
      )}
      {/* Render shop UI when visible */}
      {state.shopState && (
        <Shop />
      )}
      {/* Minimap - always visible in top-right */}
      <Minimap
        player={state.player}
        currentMap={state.currentMap}
        npcs={state.npcs}
        onFastTravel={handleFastTravel}
      />
      {/* Weather Display - shows current weather and effects */}
      {state.weatherData && gameEngineRef.current && (
        <WeatherDisplay
          weatherType={state.weatherData.currentWeather}
          effects={gameEngineRef.current.getWeatherEffects()}
        />
      )}
    </>
  );
};

export default GameBoard;
```

**Update `GameBoard.module.css`:**

Add a new class for the grid container within `GameBoard.module.css` to apply the grid layout:

```css
/* src/components/GameBoard/GameBoard.module.css */

.gameBoard {
  /* Existing styles for the overall game board container */
  position: relative; /* Needed for absolute positioning of overlays */
  overflow: hidden; /* Hide content outside the board */
  /* Remove grid-related properties from here */
}

.gameBoardGrid {
  display: grid;
  width: 100%; /* Or fixed width based on DISPLAY_WIDTH * cell_size */
  height: 100%; /* Or fixed height based on DISPLAY_HEIGHT * cell_size */
  /* Ensure grid cells are square if needed */
  grid-auto-rows: 1fr;
  grid-auto-columns: 1fr;
}

.gridCell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem; /* Adjust as needed for emoji size */
  line-height: 1; /* Prevent extra spacing */
  user-select: none; /* Prevent text selection */
  /* Optional: Add a subtle border or background for visual separation */
  /* border: 1px solid rgba(255, 255, 255, 0.1); */
}

/* ... (rest of your existing styles) */
```

**C. ASCII Fallback Mode**

**Problem:** Emojis might not render consistently across all platforms or might be preferred to be toggled off for a more "classic" ASCII feel or for performance on very low-end devices.

**Solution:** Implement a toggle button and conditional rendering logic to switch between emoji and ASCII representations.

**Implementation:**
*   A new `isAsciiMode` state variable is added to `GameBoard.tsx`.
*   A toggle button is added to the UI (e.g., near the FPS counter).
*   `MapGrid.tsx` receives `isAsciiMode` as a prop.
*   Inside `MapGrid.tsx`, `asciiTileMap` and `asciiEntityMap` are defined.
*   The `getCellContent` function in `MapGrid.tsx` uses `isAsciiMode` to select between emoji and ASCII maps.

(Refer to the code changes in `MapGrid.tsx` and `GameBoard.tsx` above for the implementation of ASCII fallback).

### 5. TESTING APPROACH

A robust testing strategy is essential to ensure the fixes and new features work as expected and don't introduce regressions.

**A. Walkability Verification**

*   **Manual Testing:**
    *   Load each map (`terminalTown`, `crystalCaverns`, etc.).
    *   Attempt to move the player across various terrain types: grass, floor, path, water, walls, trees, doors (locked and unlocked), exits, shops, healers, hidden areas.
    *   Verify that movement is allowed only on intended walkable tiles and blocked on non-walkable tiles.
    *   Specifically test areas that were previously buggy due to the backward collision layer interpretation.
*   **Automated Unit Tests (for `MapLoader.ts`):**
    *   **Purpose:** Verify that `processJsonMap` correctly interprets collision data.
    *   **Framework:** Jest (or similar).
    *   **Test Cases:**
        *   Create mock `JsonMap` objects with simple `base` and `collision` layers.
        *   Test a map with a `collision` layer where `0` is present: Assert `tile.walkable` is `true`.
        *   Test a map with a `collision` layer where `1` is present: Assert `tile.walkable` is `false`.
        *   Test a map with mixed `base` and `collision` layers: Ensure `collision` overrides `base` for walkability, and `tile.type` is correctly set for special tiles (e.g., `door`, `exit`) from the collision layer.
*   **Automated Integration Tests (for `GameEngine`/`MovementSystem`):**
    *   **Purpose:** Verify that the game engine respects the `walkable` property of tiles.
    *   **Framework:** Jest (or a custom integration test runner).
    *   **Test Cases:**
        *   Load a specific map (e.g., `terminalTown`).
        *   Simulate player movement attempts to known walkable coordinates. Assert `player.position` changes.
        *   Simulate player movement attempts to known non-walkable coordinates (e.g., walls, water). Assert `player.position` remains unchanged.
        *   Test movement through doors after they are "opened" (requires mocking door state or integrating with a door-opening mechanism).

**B. Visual Regression Tests**

*   **Purpose:** Ensure that visual changes (emoji tiles, variety system, ASCII fallback) do not introduce unintended layout shifts, rendering issues, or visual inconsistencies.
*   **Tools:**
    *   **Storybook:** If components are isolated in Storybook, tools like `Chromatic` (cloud-based) or `jest-image-snapshot` (local) can capture screenshots of components and compare them against a baseline.
    *   **Playwright/Cypress:** Write end-to-end tests that navigate to the game board, take full-page screenshots, and compare them.
*   **Test Cases:**
    *   Capture screenshots of the game board in various states (different maps, player positions, time of day).
    *   Capture screenshots with the emoji tile system enabled.
    *   Capture screenshots with the ASCII fallback mode enabled.
    *   Ensure the tile variety system consistently renders the same variant for the same tile coordinates across test runs.
    *   Verify minimap rendering is consistent with the main game board.

**C. Performance Benchmarks**

*   **Purpose:** Measure the impact of the new features and optimizations on rendering performance (FPS, frame times).
*   **Tools:**
    *   **Browser Developer Tools:** Use the "Performance" tab in Chrome/Firefox DevTools to record CPU and rendering activity. Look for long script execution times, layout thrashing, and excessive re-renders.
    *   **Built-in FPS Counter:** The existing FPS counter in `GameBoard.tsx` provides a quick visual indicator.
    *   **Custom Benchmarking Script:** For more precise measurements, write a script that runs the game for a fixed duration, logs FPS, and potentially memory usage.
*   **Test Cases:**
    *   Run the game on different maps (especially larger ones if available).
    *   Toggle the ASCII fallback mode and compare FPS.
    *   Measure FPS with many entities on screen vs. few entities.
    *   Monitor CPU and GPU usage during gameplay.
    *   Compare performance before and after the `MapGrid` memoization.

---

### Special Considerations

*   **Maintain Backward Compatibility:** The walkability fix is a *correction* of a bug, not a new feature. It changes how existing map data is *interpreted*, making it compatible with the *intended* design of the map files. The visual updates are purely cosmetic and do not affect game logic, thus maintaining compatibility.
*   **Chris's ngrok Test Server:** The current `MapLoader` design (static JSON imports, dynamic TS imports) is already suitable for a browser-based environment served via ngrok or similar. No `fs` module usage is involved.
*   **Plan for Future Biome Themes:** The `tileVariants` system is perfectly extensible for future biome themes. New biome-specific tile types can be added to `TileType`, and their corresponding emoji variants can be added to `tileVariants`.
*   **Keep Minimap Compatibility:** The `Minimap` component currently uses `state.currentMap.tiles` and `state.npcs`. If the `Minimap` also needs to display the new emoji tiles or variants, its rendering logic would need to be updated to use the `tileMap` and `tileVariants` (or a simplified version) from `MapGrid.tsx`. For now, it likely uses a simpler representation, but for full visual consistency, it should be considered. The `Minimap` component will need access to `tileMap` and `tileVariants` or a similar mapping. For simplicity, `Minimap` can use a simplified version of the `tileMap` or `asciiTileMap` as it's a high-level overview.

This comprehensive guide should enable a perfect implementation of the requested features and fixes.