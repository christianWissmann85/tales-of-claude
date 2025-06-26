/**
 * ZoneEngine - Pathfinding and Query Engine
 * 
 * Handles zone-based pathfinding, validation, and advanced queries.
 * This is the brain that makes AI-first maps intelligent.
 */

import {
    Position,
    Rectangle,
    Zone as IZone,
    ZoneConnection,
    AIFirstMap as IAIFirstMap,
    ZonePurpose,
    ValidationResult,
    ValidationError,
    ValidationWarning,
    SuggestedZone,
} from '../types/ai-map.types';
import { Zone } from '../models/Zone';
import { AIFirstMap } from '../models/AIFirstMap';

interface PathNode {
    position: Position;
    g: number; // Cost from start
    h: number; // Heuristic to end
    f: number; // Total cost
    parent?: PathNode;
}

export class ZoneEngine {
    private map: AIFirstMap;

    constructor(map: AIFirstMap) {
        this.map = map;
    }

    /**
     * A* pathfinding within and across zones
     */
    findPath(start: Position, end: Position): Position[] | null {
        const startZone = this.map.getZoneAtPosition(start);
        const endZone = this.map.getZoneAtPosition(end);

        if (!startZone || !endZone) {
            return null;
        }

        // Same zone - simple pathfinding
        if (startZone.id === endZone.id) {
            return this.findPathInZone(start, end, startZone);
        }

        // Different zones - need zone path first
        const zonePath = this.findZonePath(startZone.id, endZone.id);
        if (!zonePath) {
            return null;
        }

        // Build complete path through zones
        return this.buildPathThroughZones(start, end, zonePath);
    }

    /**
     * Find path within a single zone using A*
     */
    private findPathInZone(start: Position, end: Position, zone: Zone): Position[] | null {
        if (!zone.isWalkable(start) || !zone.isWalkable(end)) {
            return null;
        }

        const openSet: PathNode[] = [];
        const closedSet = new Set<string>();
        
        const startNode: PathNode = {
            position: start,
            g: 0,
            h: this.heuristic(start, end),
            f: 0,
        };
        startNode.f = startNode.g + startNode.h;
        
        openSet.push(startNode);

        while (openSet.length > 0) {
            // Get node with lowest f score
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift()!;
            
            // Check if we reached the goal
            if (current.position.x === end.x && current.position.y === end.y) {
                return this.reconstructPath(current);
            }

            closedSet.add(`${current.position.x},${current.position.y}`);

            // Check neighbors
            const neighbors = this.getNeighbors(current.position, zone);
            
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                if (closedSet.has(neighborKey)) {
                    continue;
                }

                const g = current.g + 1;
                const h = this.heuristic(neighbor, end);
                const f = g + h;

                const existingNode = openSet.find(
                    n => n.position.x === neighbor.x && n.position.y === neighbor.y,
                );

                if (!existingNode) {
                    openSet.push({
                        position: neighbor,
                        g,
                        h,
                        f,
                        parent: current,
                    });
                } else if (g < existingNode.g) {
                    existingNode.g = g;
                    existingNode.f = f;
                    existingNode.parent = current;
                }
            }
        }

        return null;
    }

    /**
     * Get walkable neighbors of a position
     */
    private getNeighbors(position: Position, zone: Zone): Position[] {
        const neighbors: Position[] = [];
        const offsets = [
            { x: 0, y: -1 }, // North
            { x: 1, y: 0 },  // East
            { x: 0, y: 1 },  // South
            { x: -1, y: 0 }, // West
            { x: 1, y: -1 }, // NE
            { x: 1, y: 1 },  // SE
            { x: -1, y: 1 }, // SW
            { x: -1, y: -1 }, // NW
        ];

        for (const offset of offsets) {
            const newPos: Position = {
                x: position.x + offset.x,
                y: position.y + offset.y,
            };

            if (zone.isWalkable(newPos)) {
                neighbors.push(newPos);
            }
        }

        return neighbors;
    }

    /**
     * Manhattan distance heuristic
     */
    private heuristic(a: Position, b: Position): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    /**
     * Reconstruct path from A* result
     */
    private reconstructPath(node: PathNode): Position[] {
        const path: Position[] = [];
        let current: PathNode | undefined = node;

        while (current) {
            path.unshift(current.position);
            current = current.parent;
        }

        return path;
    }

    /**
     * Find path between zones
     */
    private findZonePath(startId: string, endId: string): string[] | null {
        if (startId === endId) {
            return [startId];
        }

        const queue: { id: string; path: string[] }[] = [
            { id: startId, path: [startId] },
        ];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const { id, path } = queue.shift()!;
            
            if (visited.has(id)) {
                continue;
            }
            
            visited.add(id);

            const connections = this.map.getConnectedZones(id);
            for (const zone of connections) {
                if (zone.id === endId) {
                    return [...path, endId];
                }
                
                if (!visited.has(zone.id)) {
                    queue.push({
                        id: zone.id,
                        path: [...path, zone.id],
                    });
                }
            }
        }

        return null;
    }

    /**
     * Build complete path through multiple zones
     */
    private buildPathThroughZones(
        start: Position,
        end: Position,
        zonePath: string[],
    ): Position[] | null {
        const fullPath: Position[] = [];
        
        for (let i = 0; i < zonePath.length - 1; i++) {
            const fromZone = this.map.getZone(zonePath[i])!;
            const toZone = this.map.getZone(zonePath[i + 1])!;
            
            // Find connection between zones
            const connection = this.map.connections.find(
                conn => conn.fromZoneId === fromZone.id && 
                        conn.toZoneId === toZone.id,
            );
            
            if (!connection) {
                return null;
            }

            // Path to exit point
            const currentStart = i === 0 ? start : connection.toPoint;
            const pathToExit = this.findPathInZone(
                currentStart,
                connection.fromPoint,
                fromZone,
            );
            
            if (!pathToExit) {
                return null;
            }
            
            // Add path segment (avoiding duplicates)
            if (fullPath.length === 0) {
                fullPath.push(...pathToExit);
            } else {
                fullPath.push(...pathToExit.slice(1));
            }
            
            // Add transition
            if (i < zonePath.length - 2) {
                fullPath.push(connection.toPoint);
            }
        }
        
        // Path from entry to final destination
        const lastZone = this.map.getZone(zonePath[zonePath.length - 1])!;
        const lastConnection = this.map.connections.find(
            conn => conn.fromZoneId === zonePath[zonePath.length - 2] &&
                    conn.toZoneId === lastZone.id,
        );
        
        if (lastConnection) {
            const finalPath = this.findPathInZone(
                lastConnection.toPoint,
                end,
                lastZone,
            );
            
            if (finalPath) {
                fullPath.push(...finalPath.slice(1));
            }
        }
        
        return fullPath;
    }

    /**
     * Validate map structure and connectivity
     */
    validateMap(): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        // Check zone IDs are unique
        const zoneIds = new Set<string>();
        this.map.zones.forEach(zone => {
            if (zoneIds.has(zone.id)) {
                errors.push({
                    type: 'STRUCTURAL',
                    location: `Zone: ${zone.id}`,
                    message: `Duplicate zone ID: ${zone.id}`,
                    severity: 'ERROR',
                });
            }
            zoneIds.add(zone.id);
        });

        // Validate each zone
        this.map.zones.forEach(zone => {
            // Check if zone has walkable areas
            if (zone.walkableAreas.length === 0) {
                warnings.push({
                    type: 'STRUCTURAL',
                    location: `Zone: ${zone.id}`,
                    message: 'Zone has no explicitly defined walkable areas',
                    severity: 'WARNING',
                    suggestedFix: 'Add walkableAreas or the entire zone will be walkable',
                } as ValidationWarning);
            }

            // Check for overlapping blocked areas
            if (zone.blockedAreas) {
                for (let i = 0; i < zone.blockedAreas.length; i++) {
                    for (let j = i + 1; j < zone.blockedAreas.length; j++) {
                        if (this.rectanglesOverlap(zone.blockedAreas[i], zone.blockedAreas[j])) {
                            warnings.push({
                                type: 'STRUCTURAL',
                                location: `Zone: ${zone.id}`,
                                message: 'Overlapping blocked areas detected',
                                severity: 'WARNING',
                            } as ValidationWarning);
                        }
                    }
                }
            }

            // Check entities are within zone bounds
            zone.entities.forEach(entity => {
                const entityPos = {
                    x: zone.bounds.x + entity.position.x,
                    y: zone.bounds.y + entity.position.y,
                };
                if (!zone.isInBounds(entityPos)) {
                    errors.push({
                        type: 'STRUCTURAL',
                        location: `Zone: ${zone.id}, Entity: ${entity.id}`,
                        message: 'Entity position is outside zone bounds',
                        severity: 'ERROR',
                    });
                }
            });
        });

        // Validate connections
        this.map.connections.forEach((conn, index) => {
            const fromZone = this.map.getZone(conn.fromZoneId);
            const toZone = this.map.getZone(conn.toZoneId);

            if (!fromZone) {
                errors.push({
                    type: 'REFERENCE',
                    location: `Connection ${index}`,
                    message: `Invalid fromZoneId: ${conn.fromZoneId}`,
                    severity: 'ERROR',
                });
            }

            if (!toZone) {
                errors.push({
                    type: 'REFERENCE',
                    location: `Connection ${index}`,
                    message: `Invalid toZoneId: ${conn.toZoneId}`,
                    severity: 'ERROR',
                });
            }

            // Check connection points are in respective zones
            if (fromZone && !fromZone.isInBounds(conn.fromPoint)) {
                errors.push({
                    type: 'STRUCTURAL',
                    location: `Connection ${index}`,
                    message: 'Connection fromPoint is outside source zone',
                    severity: 'ERROR',
                });
            }

            if (toZone && !toZone.isInBounds(conn.toPoint)) {
                errors.push({
                    type: 'STRUCTURAL',
                    location: `Connection ${index}`,
                    message: 'Connection toPoint is outside target zone',
                    severity: 'ERROR',
                });
            }
        });

        // Check connectivity
        const unreachableZones = this.findUnreachableZones();
        unreachableZones.forEach(zoneId => {
            warnings.push({
                type: 'PATHFINDING',
                location: `Zone: ${zoneId}`,
                message: 'Zone is not reachable from other zones',
                severity: 'WARNING',
                suggestedFix: 'Add connections to this zone',
            } as ValidationWarning);
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * Find zones that cannot be reached from any other zone
     */
    private findUnreachableZones(): string[] {
        if (this.map.zones.length <= 1) {
            return [];
        }

        const unreachable: string[] = [];
        const startZone = this.map.zones[0];

        this.map.zones.forEach(zone => {
            if (zone.id !== startZone.id) {
                const path = this.findZonePath(startZone.id, zone.id);
                if (!path) {
                    unreachable.push(zone.id);
                }
            }
        });

        return unreachable;
    }

    /**
     * Check if two rectangles overlap
     */
    private rectanglesOverlap(a: Rectangle, b: Rectangle): boolean {
        return !(a.x + a.width <= b.x ||
                 b.x + b.width <= a.x ||
                 a.y + a.height <= b.y ||
                 b.y + b.height <= a.y);
    }

    /**
     * Analyze tile-based map and suggest zones
     */
    analyzeTileMap(tiles: any[][], tileSize: number = 16): SuggestedZone[] {
        const suggestions: SuggestedZone[] = [];
        const processed = new Set<string>();

        for (let y = 0; y < tiles.length; y++) {
            for (let x = 0; x < tiles[y].length; x++) {
                const key = `${x},${y}`;
                if (processed.has(key)) {
                    continue;
                }

                // Find connected area of similar tiles
                const area = this.floodFillArea(tiles, x, y, processed);
                if (area.length > 10) { // Minimum size for a zone
                    const bounds = this.calculateBounds(area, tileSize);
                    const purpose = this.suggestPurpose(area, tiles);
                    
                    suggestions.push({
                        bounds,
                        suggestedPurpose: purpose,
                        detectedEntities: [],
                        confidence: 0.7,
                    });
                }
            }
        }

        return this.mergeAdjacentZones(suggestions);
    }

    /**
     * Flood fill to find connected areas
     */
    private floodFillArea(
        tiles: any[][],
        startX: number,
        startY: number,
        processed: Set<string>,
    ): Position[] {
        const area: Position[] = [];
        const stack: Position[] = [{ x: startX, y: startY }];
        const targetType = tiles[startY][startX].type;

        while (stack.length > 0) {
            const pos = stack.pop()!;
            const key = `${pos.x},${pos.y}`;

            if (processed.has(key) ||
                pos.x < 0 || pos.x >= tiles[0].length ||
                pos.y < 0 || pos.y >= tiles.length ||
                tiles[pos.y][pos.x].type !== targetType) {
                continue;
            }

            processed.add(key);
            area.push(pos);

            // Add neighbors
            stack.push({ x: pos.x + 1, y: pos.y });
            stack.push({ x: pos.x - 1, y: pos.y });
            stack.push({ x: pos.x, y: pos.y + 1 });
            stack.push({ x: pos.x, y: pos.y - 1 });
        }

        return area;
    }

    /**
     * Calculate bounding box for area
     */
    private calculateBounds(area: Position[], tileSize: number): Rectangle {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        area.forEach(pos => {
            minX = Math.min(minX, pos.x);
            minY = Math.min(minY, pos.y);
            maxX = Math.max(maxX, pos.x);
            maxY = Math.max(maxY, pos.y);
        });

        return {
            x: minX * tileSize,
            y: minY * tileSize,
            width: (maxX - minX + 1) * tileSize,
            height: (maxY - minY + 1) * tileSize,
        };
    }

    /**
     * Suggest zone purpose based on tile analysis
     */
    private suggestPurpose(area: Position[], tiles: any[][]): ZonePurpose {
        // Count tile types in area
        const typeCounts = new Map<string, number>();
        
        area.forEach(pos => {
            const tileType = tiles[pos.y][pos.x].type;
            typeCounts.set(tileType, (typeCounts.get(tileType) || 0) + 1);
        });

        // Simple heuristic based on tile types
        const dominantType = Array.from(typeCounts.entries())
            .sort((a, b) => b[1] - a[1])[0][0];

        // Map tile types to zone purposes
        const purposeMap: Record<string, ZonePurpose> = {
            'grass': 'natural',
            'stone': 'residential',
            'wood': 'commercial',
            'water': 'natural',
            'sand': 'natural',
            'brick': 'industrial',
        };

        return purposeMap[dominantType] || 'transition';
    }

    /**
     * Merge adjacent zones of the same type
     */
    private mergeAdjacentZones(zones: SuggestedZone[]): SuggestedZone[] {
        const merged: SuggestedZone[] = [];
        const used = new Set<number>();

        for (let i = 0; i < zones.length; i++) {
            if (used.has(i)) { continue; }

            let current = zones[i];
            used.add(i);

            // Find all adjacent zones with same purpose
            for (let j = i + 1; j < zones.length; j++) {
                if (used.has(j)) { continue; }

                if (zones[j].suggestedPurpose === current.suggestedPurpose &&
                    this.rectanglesAdjacent(current.bounds, zones[j].bounds)) {
                    // Merge bounds
                    current = {
                        ...current,
                        bounds: this.mergeRectangles(current.bounds, zones[j].bounds),
                        confidence: Math.max(current.confidence, zones[j].confidence),
                    };
                    used.add(j);
                }
            }

            merged.push(current);
        }

        return merged;
    }

    /**
     * Check if rectangles are adjacent
     */
    private rectanglesAdjacent(a: Rectangle, b: Rectangle): boolean {
        // Check if they share an edge
        const touchingX = (a.x + a.width === b.x) || (b.x + b.width === a.x);
        const touchingY = (a.y + a.height === b.y) || (b.y + b.height === a.y);
        
        const overlapX = !(a.x + a.width < b.x || b.x + b.width < a.x);
        const overlapY = !(a.y + a.height < b.y || b.y + b.height < a.y);
        
        return (touchingX && overlapY) || (touchingY && overlapX);
    }

    /**
     * Merge two rectangles into one
     */
    private mergeRectangles(a: Rectangle, b: Rectangle): Rectangle {
        const minX = Math.min(a.x, b.x);
        const minY = Math.min(a.y, b.y);
        const maxX = Math.max(a.x + a.width, b.x + b.width);
        const maxY = Math.max(a.y + a.height, b.y + b.height);
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        };
    }

    /**
     * Get statistics about the map
     */
    getMapStatistics(): {
        totalZones: number;
        zonesByPurpose: Map<ZonePurpose, number>;
        totalConnections: number;
        averageConnections: number;
        totalEntities: number;
        entitiesByType: Map<string, number>;
    } {
        const stats = {
            totalZones: this.map.zones.length,
            zonesByPurpose: new Map<ZonePurpose, number>(),
            totalConnections: this.map.connections.length,
            averageConnections: 0,
            totalEntities: 0,
            entitiesByType: new Map<string, number>(),
        };

        // Count zones by purpose
        this.map.zones.forEach(zone => {
            const count = stats.zonesByPurpose.get(zone.purpose) || 0;
            stats.zonesByPurpose.set(zone.purpose, count + 1);

            // Count entities
            stats.totalEntities += zone.entities.length;
            zone.entities.forEach(entity => {
                const entityCount = stats.entitiesByType.get(entity.type) || 0;
                stats.entitiesByType.set(entity.type, entityCount + 1);
            });
        });

        // Calculate average connections per zone
        if (stats.totalZones > 0) {
            stats.averageConnections = stats.totalConnections / stats.totalZones;
        }

        return stats;
    }
}