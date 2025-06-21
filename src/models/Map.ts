// src/models/Map.ts

import { Position, Tile, TileType, Exit, Enemy, NPC, Item, GameMap as IGameMap } from '../types/global.types';

/**
 * Represents a game map, managing its tiles, entities, and exits.
 */
export class GameMap implements IGameMap { // Added 'implements IGameMap' for clarity, though not strictly required by prompt
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  public tiles: Tile[][]; // Changed from private to public
  public entities: (Enemy | NPC | Item)[]; // Changed from private Map to public Array
  public exits: Exit[]; // Changed from private to public

  /**
   * Constructs a new GameMap instance from an IGameMap data object.
   * @param data The IGameMap data object containing map details.
   */
  constructor(data: IGameMap) {
    this.id = data.id;
    this.name = data.name;
    this.width = data.width;
    this.height = data.height;
    this.exits = [...data.exits]; // Shallow copy of exits array

    // Deep copy tiles to ensure internal state is independent
    this.tiles = data.tiles.map(row => row.map(tile => ({ ...tile })));

    this.entities = []; // Initialize as an array
    // Add initial entities, updating tile occupancy
    data.entities.forEach(entity => {
      this.addEntity(entity); // Use the refactored addEntity
    });
  }

  /**
   * Checks if a given position is within the map boundaries.
   * @param x The x-coordinate.
   * @param y The y-coordinate.
   * @returns True if the position is valid, false otherwise.
   */
  private isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Retrieves the tile at the specified coordinates.
   * @param x The x-coordinate of the tile.
   * @param y The y-coordinate of the tile.
   * @returns The Tile object if found, otherwise undefined.
   */
  getTile(x: number, y: number): Tile | undefined {
    if (!this.isValidPosition(x, y)) {
      return undefined;
    }
    return this.tiles[y][x];
  }

  /**
   * Sets the tile at the specified coordinates.
   * @param x The x-coordinate of the tile.
   * @param y The y-coordinate of the tile.
   * @param tile The new Tile object to set.
   */
  setTile(x: number, y: number, tile: Tile): void {
    if (!this.isValidPosition(x, y)) {
      console.warn(`GameMap: Attempted to set tile out of bounds at (${x}, ${y}) on map ${this.id}`);
      return;
    }
    this.tiles[y][x] = { ...tile }; // Store a copy to prevent external modification
  }

  /**
   * Checks if the tile at the specified coordinates is walkable.
   * @param x The x-coordinate.
   * @param y The y-coordinate.
   * @returns True if the tile is walkable, false if it's out of bounds or not walkable.
   */
  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile ? tile.walkable : false;
  }

  /**
   * Retrieves an entity (Enemy, NPC, or Item) at the specified coordinates.
   * Prioritizes checking the tile's occupyingEntityId for efficiency, then falls back to iterating.
   * @param x The x-coordinate.
   * @param y The y-coordinate.
   * @returns The entity object if found, otherwise undefined.
   */
  getEntityAt(x: number, y: number): (Enemy | NPC | Item) | undefined {
    if (!this.isValidPosition(x, y)) {
      return undefined;
    }

    const tile = this.getTile(x, y);
    if (tile?.occupyingEntityId) {
      // With entities as an array, this is now an O(N) operation
      const entity = this.entities.find(e => e.id === tile.occupyingEntityId);
      // Double-check position in case tile.occupyingEntityId is stale or incorrect
      if (entity && entity.position && entity.position.x === x && entity.position.y === y) {
        return entity;
      }
    }

    // Fallback: Iterate through all entities if tile.occupyingEntityId was not set or incorrect
    // or if the primary lookup failed.
    for (const entity of this.entities) { // Iterate array directly
      if (entity.position && entity.position.x === x && entity.position.y === y) {
        return entity;
      }
    }
    return undefined;
  }

  /**
   * Adds an entity to the map. Updates the corresponding tile's occupyingEntityId.
   * If an entity with the same ID already exists, it will be replaced.
   * @param entity The entity to add.
   */
  addEntity(entity: Enemy | NPC | Item): void {
    // Ensure the entity has a position before attempting to place it on the map
    if (!entity.position) {
      console.warn(`GameMap: Attempted to add entity ${entity.id} without a position to map ${this.id}`);
      return;
    }
    if (!this.isValidPosition(entity.position.x, entity.position.y)) {
      console.warn(`GameMap: Attempted to add entity ${entity.id} out of bounds at (${entity.position.x}, ${entity.position.y}) on map ${this.id}`);
      return;
    }

    // Replace existing entity or add new one (mimics Map.set behavior)
    const existingIndex = this.entities.findIndex(e => e.id === entity.id);
    if (existingIndex !== -1) {
      this.entities[existingIndex] = entity;
    } else {
      this.entities.push(entity);
    }

    const tile = this.getTile(entity.position.x, entity.position.y);
    if (tile) {
      tile.occupyingEntityId = entity.id;
    }
  }

  /**
   * Removes an entity from the map by its ID. Clears the corresponding tile's occupyingEntityId.
   * @param entityId The ID of the entity to remove.
   */
  removeEntity(entityId: string): void {
    const entity = this.entities.find(e => e.id === entityId); // Find the entity first
    if (entity) {
      this.entities = this.entities.filter(e => e.id !== entityId); // Filter out the entity

      // Only attempt to clear tile if the entity had a position (which it should if it was added)
      if (entity.position) {
        const tile = this.getTile(entity.position.x, entity.position.y);
        if (tile && tile.occupyingEntityId === entityId) {
          delete tile.occupyingEntityId; // Remove the property
        }
      } else {
        console.warn(`GameMap: Removed entity ${entity.id} which was on map but had no position property.`);
      }
    }
  }

  /**
   * Retrieves an exit point at the specified coordinates.
   * @param x The x-coordinate.
   * @param y The y-coordinate.
   * @returns The Exit object if found, otherwise undefined.
   */
  getExitAt(x: number, y: number): Exit | undefined {
    if (!this.isValidPosition(x, y)) {
      return undefined;
    }
    return this.exits.find(exit => exit.position.x === x && exit.position.y === y);
  }

  /**
   * Static method to create a GameMap instance from an IGameMap data object.
   * This is the recommended way to instantiate a GameMap from pre-defined map data.
   * @param data The IGameMap data object.
   * @returns A new GameMap instance.
   */
  static fromGameMapData(data: IGameMap): GameMap {
    return new GameMap(data);
  }

  /**
   * Static method to create a default 20x15 map filled with walkable grass tiles.
   * This can be used for testing or generating simple maps dynamically.
   * @param id The ID for the new map.
   * @param name The name for the new map.
   * @param width The width of the map (default: 20).
   * @param height The height of the map (default: 15).
   * @returns A new GameMap instance with default grass tiles.
   */
  static createDefaultMap(id: string, name: string, width: number = 20, height: number = 15): GameMap {
    const defaultTiles: Tile[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < width; x++) {
        row.push({ walkable: true, type: 'grass' });
      }
      defaultTiles.push(row);
    }

    const defaultGameMap: IGameMap = {
      id,
      name,
      width,
      height,
      tiles: defaultTiles,
      entities: [],
      exits: [],
    };

    return new GameMap(defaultGameMap);
  }
}