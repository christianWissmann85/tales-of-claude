/**
 * MapLoader Compatibility Layer
 * 
 * Provides backwards compatibility for loading old tile-based maps
 * while we transition to the AI-first zone-based system.
 * 
 * DEPRECATED: New maps should use AIFirstMap format!
 */

import { GameMap } from '../models/Map';
import { AIFirstMap } from '../models/AIFirstMap';
import { terminalTownAI } from '../maps/TerminalTown';

// Import old map data if it exists
let terminalTownData: any = null;
const binaryForestData: any = null;
const debugDungeonData: any = null;

// Try to load archived maps
try {
    // These might not exist anymore after cleanup
    terminalTownData = require('../../archives/old-maps/terminalTown.json');
} catch (e) {
    // Use fallback data
    terminalTownData = {
        id: 'terminal_town',
        name: 'Terminal Town',
        width: 20,
        height: 20,
        tiles: [],
        startPosition: { x: 10, y: 10 },
    };
}

/**
 * Legacy MapLoader class
 * @deprecated Use AIFirstMap directly
 */
export class MapLoader {
    private static instance: MapLoader;
    private static mapCache: Map<string, GameMap> = new Map();
    private static aiMapCache: Map<string, AIFirstMap> = new Map();

    /**
     * Get singleton instance
     */
    static getInstance(): MapLoader {
        if (!this.instance) {
            this.instance = new MapLoader();
        }
        return this.instance;
    }

    /**
     * Load a map by ID (compatibility method)
     */
    static async loadMap(mapId: string): Promise<GameMap> {
        // Check cache first
        if (this.mapCache.has(mapId)) {
            return this.mapCache.get(mapId)!;
        }

        // Try to load AI-first map and convert
        if (mapId === 'terminal_town_ai') {
            const aiMap = new AIFirstMap(terminalTownAI);
            const legacyMap = this.convertAIMapToLegacy(aiMap);
            this.mapCache.set(mapId, legacyMap);
            return legacyMap;
        }

        // Try to load from map index (handles both camelCase and snake_case)
        try {
            const { mapDataIndex } = await import('../assets/maps');
            // Check both camelCase and snake_case versions
            const mapData = mapDataIndex[mapId] || mapDataIndex[mapId.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')];
            if (mapData && !(mapData instanceof Promise)) {
                const gameMap = new GameMap(mapData);
                this.mapCache.set(mapId, gameMap);
                return gameMap;
            }
        } catch (e) {
            console.warn(`Failed to load map from index: ${mapId}`, e);
        }

        // Fall back to empty map
        const emptyMap = new GameMap({
            id: mapId,
            name: mapId,
            width: 20,
            height: 20,
            tiles: [],
            startPosition: { x: 10, y: 10 },
        });

        this.mapCache.set(mapId, emptyMap);
        return emptyMap;
    }

    /**
     * Convert AI-first map to legacy format
     */
    private static convertAIMapToLegacy(aiMap: AIFirstMap): GameMap {
        // Calculate bounds
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        aiMap.zones.forEach(zone => {
            minX = Math.min(minX, zone.bounds.x);
            minY = Math.min(minY, zone.bounds.y);
            maxX = Math.max(maxX, zone.bounds.x + zone.bounds.width);
            maxY = Math.max(maxY, zone.bounds.y + zone.bounds.height);
        });

        const width = Math.ceil((maxX - minX) / 16); // Assume 16px tiles
        const height = Math.ceil((maxY - minY) / 16);

        // Create tile array
        const tiles: any[][] = [];
        for (let y = 0; y < height; y++) {
            tiles[y] = [];
            for (let x = 0; x < width; x++) {
                const worldX = minX + x * 16;
                const worldY = minY + y * 16;
                const walkable = aiMap.isWalkable({ x: worldX, y: worldY });
                
                tiles[y][x] = {
                    type: walkable ? 'floor' : 'water',
                    walkable: walkable,
                };
            }
        }

        // Extract NPCs and enemies
        const npcs: any[] = [];
        const enemies: any[] = [];
        
        aiMap.zones.forEach(zone => {
            zone.entities.forEach(entity => {
                const worldPos = {
                    x: Math.floor((zone.bounds.x + entity.position.x - minX) / 16),
                    y: Math.floor((zone.bounds.y + entity.position.y - minY) / 16),
                };
                
                if (entity.type === 'npc') {
                    npcs.push({
                        id: entity.id,
                        name: entity.id,
                        position: worldPos,
                        type: 'npc',
                    });
                } else if (entity.type === 'enemy') {
                    enemies.push({
                        id: entity.id,
                        name: entity.id,
                        position: worldPos,
                        type: 'enemy',
                    });
                }
            });
        });

        const gameMap = new GameMap({
            id: aiMap.id,
            name: aiMap.name,
            width,
            height,
            tiles,
            npcs,
            enemies,
            startPosition: { x: Math.floor(width / 2), y: Math.floor(height / 2) },
        });
        
        // Ensure entities and exits are populated
        gameMap.entities = [...npcs, ...enemies];
        gameMap.exits = [];
        
        return gameMap;
    }

    /**
     * Get all available maps
     */
    static getAvailableMaps(): string[] {
        return ['terminalTown', 'binaryForest', 'debugDungeon'];
    }

    /**
     * Clear cache
     */
    static clearCache(): void {
        this.mapCache.clear();
        this.aiMapCache.clear();
    }
}

// Re-export for compatibility
export { GameMap } from '../models/Map';