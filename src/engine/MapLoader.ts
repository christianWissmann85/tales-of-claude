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
    const tileIdToType: Record<number, TileType> = {
      0: 'wall', // Default/empty tile - use wall as safe fallback
      1: 'grass',
      2: 'floor', // Most common tile type in maps
      3: 'water',
      4: 'wall',
      5: 'door',
      6: 'locked_door',
      7: 'exit',
      8: 'healer',
      9: 'walkable', // Often used in collision layers
      10: 'path',
      11: 'tree',
      12: 'shop',
      13: 'dungeon_floor',
      14: 'hidden_area',
      15: 'tech_floor',
      16: 'metal_floor',
      17: 'path_one',
      18: 'path_zero',
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

          // Only apply decoration if it's a valid, non-empty type
          if (mappedDecorType && mappedDecorType !== 'walkable' && decorValue !== 0) {
            tile.type = mappedDecorType;
          }
        }

        // 3. Determine walkability and final tile type from collision layer
        if (tileLayerData['collision'] && tileLayerData['collision'][index] !== undefined) {
          const collisionValue = tileLayerData['collision'][index];
          let collisionType: TileType = 'wall'; // Default collision type

          if (typeof collisionValue === 'number') {
            // Convert numeric ID to string TileType
            collisionType = tileIdToType[collisionValue] || 'wall';
          } else if (typeof collisionValue === 'string') {
            collisionType = collisionValue as TileType;
          }
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
            case 'shop': // Shop/healer tiles might be non-walkable depending on design
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
