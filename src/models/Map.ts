/**
 * Map Compatibility Layer
 * 
 * This provides backwards compatibility for the old tile-based Map class
 * while we transition to the AI-first zone-based system.
 * 
 * DEPRECATED: Use AIFirstMap and Zone classes instead!
 */

import { Position } from '../types/global.types';

// Import the proper Tile type from global.types
import { Tile as GlobalTile } from '../types/global.types';

// Re-export the global Tile type for compatibility
export type Tile = GlobalTile;

// Legacy map data structure
export interface MapData {
    id: string;
    name: string;
    width: number;
    height: number;
    tiles: Tile[][];
    startPosition?: Position;
    npcs?: any[];
    enemies?: any[];
}

/**
 * Legacy Map class - provides compatibility with old code
 * @deprecated Use AIFirstMap instead
 */
export class GameMap {
    id: string;
    name: string;
    width: number;
    height: number;
    tiles: Tile[][];
    npcs: any[];
    enemies: any[];
    startPosition?: Position;
    entities: any[]; // Combined list of all entities
    exits: any[]; // Exit points to other maps

    constructor(data: MapData) {
        this.id = data.id;
        this.name = data.name;
        this.width = data.width;
        this.height = data.height;
        this.tiles = data.tiles || this.createEmptyTiles(data.width, data.height);
        this.npcs = data.npcs || [];
        this.enemies = data.enemies || [];
        this.startPosition = data.startPosition;
        // Initialize entities as combined list
        this.entities = [...this.npcs, ...this.enemies];
        this.exits = []; // Initialize empty exits array
    }

    private createEmptyTiles(width: number, height: number): Tile[][] {
        const tiles: Tile[][] = [];
        for (let y = 0; y < height; y++) {
            tiles[y] = [];
            for (let x = 0; x < width; x++) {
                tiles[y][x] = { type: 'walkable', walkable: true } as Tile;
            }
        }
        return tiles;
    }

    getTile(x: number, y: number): Tile | null {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.tiles[y][x];
    }

    isWalkable(x: number, y: number): boolean {
        const tile = this.getTile(x, y);
        return tile ? (tile.walkable !== false) : false;
    }

    isValidPosition(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getAllNPCs(): any[] {
        return this.npcs;
    }

    getAllEnemies(): any[] {
        return this.enemies;
    }

    getNPCAt(x: number, y: number): any {
        return this.npcs.find(npc => npc.position.x === x && npc.position.y === y);
    }

    getEnemyAt(x: number, y: number): any {
        return this.enemies.find(enemy => enemy.position.x === x && enemy.position.y === y);
    }

    getEntityAt(x: number, y: number): any {
        // Check NPCs first
        const npc = this.getNPCAt(x, y);
        if (npc) { return npc; }
        
        // Then check enemies
        const enemy = this.getEnemyAt(x, y);
        if (enemy) { return enemy; }
        
        // Could also check items if they have positions
        return null;
    }

    // Compatibility methods
    toJSON(): MapData {
        return {
            id: this.id,
            name: this.name,
            width: this.width,
            height: this.height,
            tiles: this.tiles,
            npcs: this.npcs,
            enemies: this.enemies,
            startPosition: this.startPosition,
        };
    }

    static fromJSON(data: MapData): GameMap {
        return new GameMap(data);
    }
}