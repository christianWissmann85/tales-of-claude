// src/engine/MapLoader.ts

import { GameMap as IGameMap, Tile, TileType, Exit, NPC, NPCRole, Item } from '../types/global.types';
import { 
  JsonMap, 
  JsonMapObject, 
  JsonMapNPC, 
  JsonMapEnemy, 
  JsonMapItem, 
  JsonMapExit,
  JsonMapTileLayer,
  JsonMapObjectLayer
} from '../types/map-schema.types';
import { Enemy, EnemyVariant } from '../models/Enemy';
import { Item as ItemClass, ItemVariant } from '../models/Item';
import { validateJsonMap } from '../utils/mapMigration';
// Removed Node.js specific imports: fs, path, promisify

// Define base directories for map files as relative URLs for browser
const JSON_MAPS_DIR = '/src/assets/maps/json';
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
  private isDevMode: boolean = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) || false; // Use Vite's import.meta.env.DEV for development mode
  // Removed: private watchers: Map<string, fs.FSWatcher> = new Map(); // No longer needed for browser hot-reloading

  private constructor() {
    if (this.isDevMode) {
      // Custom hot-reloading via file watchers is removed for browser environment.
      // Vite's HMR handles module updates and will re-initialize MapLoader if needed.
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
   * Loads a game map by its ID. Prioritizes JSON, then falls back to TS for backward compatibility.
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

    // 1. Try loading from JSON
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
   * Loads a JSON map file, parses it, and validates its structure against JsonMap schema.
   * @param mapId The ID of the map.
   * @returns A Promise that resolves with the validated JsonMap.
   * @throws Error if the file cannot be read, parsed, or fails validation.
   */
  private async loadJsonMap(mapId: string): Promise<JsonMap> {
    const url = `${JSON_MAPS_DIR}/${mapId}.json`; // Construct URL for browser fetch
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for ${url}`);
      }
      const json = await response.json();
      validateJsonMap(json); // Throws if invalid, using the utility function
      return json;
    } catch (error: any) {
      throw new Error(`Error loading or parsing JSON map "${mapId}" from ${url}: ${error.message}`);
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
    const objectLayers: JsonMapObject[][] = [];

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
        if (tileLayerData['base'] && tileLayerData['base'][index]) {
          const baseValue = tileLayerData['base'][index];
          if (typeof baseValue === 'string') {
            tile.type = baseValue as TileType;
          }
        }

        // 2. Apply decoration layer (e.g., trees, rocks that overlay base)
        // 'walkable' is used as a placeholder in decoration layer for empty spots.
        if (tileLayerData['decoration'] && tileLayerData['decoration'][index] && tileLayerData['decoration'][index] !== 'walkable') {
          const decorValue = tileLayerData['decoration'][index];
          if (typeof decorValue === 'string') {
            tile.type = decorValue as TileType;
          }
        }

        // 3. Determine walkability and final tile type from collision layer
        if (tileLayerData['collision'] && tileLayerData['collision'][index]) {
          const collisionValue = tileLayerData['collision'][index];
          if (typeof collisionValue === 'string') {
            const collisionType = collisionValue as TileType;
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
            case 'shop': // Shop/healer tiles might be non-walkable depending on design
            case 'healer':
              tile.walkable = false;
              break;
            default:
              // If an unknown type is in collision, assume non-walkable
              tile.walkable = false;
              break;
          }
            // If the collision layer specifies a distinct visual type (like door, exit, shop), use it.
            if (['door', 'locked_door', 'exit', 'shop', 'healer'].includes(collisionType)) {
              tile.type = collisionType;
            }
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
            console.warn(`Map "${jsonMap.id}": Unknown object type encountered: "${obj.type}" for object "${obj.id}". Object not loaded.`);
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