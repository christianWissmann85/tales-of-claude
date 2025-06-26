/**
 * AIFirstMap Model
 * 
 * Main map class for the AI-first system.
 * Maps are collections of zones with behaviors and connections.
 */

import {
    AIFirstMap as IAIFirstMap,
    Zone as IZone,
    ZoneConnection,
    MapBehavior,
    Position,
    ZonePurpose,
    RenderConfiguration,
    ZoneEntity,
    ConnectionType,
} from '../types/ai-map.types';
import { Zone } from './Zone';

export class AIFirstMap implements IAIFirstMap {
    id: string;
    name: string;
    description: string;
    zones: Zone[];
    connections: ZoneConnection[];
    behaviors: MapBehavior[];
    renderHints?: RenderConfiguration;

    private zoneMap: Map<string, Zone>;
    private connectionMap: Map<string, ZoneConnection[]>;

    constructor(data: IAIFirstMap) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.zones = data.zones.map(z => new Zone(z));
        this.connections = data.connections;
        this.behaviors = data.behaviors;
        this.renderHints = data.renderHints;

        // Build lookup maps for efficient querying
        this.zoneMap = new Map();
        this.connectionMap = new Map();
        
        this.zones.forEach(zone => {
            this.zoneMap.set(zone.id, zone);
        });

        this.buildConnectionMap();
    }

    /**
     * Build connection lookup map
     */
    private buildConnectionMap(): void {
        this.connections.forEach(conn => {
            // Add connection for fromZone
            if (!this.connectionMap.has(conn.fromZoneId)) {
                this.connectionMap.set(conn.fromZoneId, []);
            }
            this.connectionMap.get(conn.fromZoneId)!.push(conn);

            // Add reverse connection if bidirectional
            if (conn.bidirectional) {
                if (!this.connectionMap.has(conn.toZoneId)) {
                    this.connectionMap.set(conn.toZoneId, []);
                }
                this.connectionMap.get(conn.toZoneId)!.push({
                    ...conn,
                    fromZoneId: conn.toZoneId,
                    toZoneId: conn.fromZoneId,
                    fromPoint: conn.toPoint,
                    toPoint: conn.fromPoint,
                });
            }
        });
    }

    /**
     * Get zone by ID
     */
    getZone(zoneId: string): Zone | undefined {
        return this.zoneMap.get(zoneId);
    }

    /**
     * Get zone at position
     */
    getZoneAtPosition(position: Position): Zone | undefined {
        for (const zone of this.zones) {
            if (zone.isInBounds(position)) {
                return zone;
            }
        }
        return undefined;
    }

    /**
     * Check if position is walkable on the map
     */
    isWalkable(position: Position): boolean {
        const zone = this.getZoneAtPosition(position);
        return zone ? zone.isWalkable(position) : false;
    }

    /**
     * Get all zones connected to a specific zone
     */
    getConnectedZones(zoneId: string): Zone[] {
        const connections = this.connectionMap.get(zoneId) || [];
        const connectedZones: Zone[] = [];
        
        connections.forEach(conn => {
            const targetZone = this.getZone(conn.toZoneId);
            if (targetZone) {
                connectedZones.push(targetZone);
            }
        });
        
        return connectedZones;
    }

    /**
     * Get zones by purpose
     */
    getZonesByPurpose(purpose: ZonePurpose): Zone[] {
        return this.zones.filter(zone => zone.hasPurpose(purpose));
    }

    /**
     * Find path between two positions (simple implementation)
     */
    findPath(from: Position, to: Position): Position[] | null {
        const fromZone = this.getZoneAtPosition(from);
        const toZone = this.getZoneAtPosition(to);
        
        if (!fromZone || !toZone) {
            return null;
        }

        // Same zone - direct path
        if (fromZone.id === toZone.id) {
            if (fromZone.isWalkable(from) && fromZone.isWalkable(to)) {
                return [from, to];
            }
            return null;
        }

        // Different zones - need to find connection path
        const zonePath = this.findZonePath(fromZone.id, toZone.id);
        if (!zonePath) {
            return null;
        }

        // Convert zone path to position path
        const positionPath: Position[] = [from];
        
        for (let i = 0; i < zonePath.length - 1; i++) {
            const connection = this.getConnection(zonePath[i], zonePath[i + 1]);
            if (connection) {
                positionPath.push(connection.fromPoint);
                positionPath.push(connection.toPoint);
            }
        }
        
        positionPath.push(to);
        return positionPath;
    }

    /**
     * Find path between zones using BFS
     */
    private findZonePath(fromZoneId: string, toZoneId: string): string[] | null {
        if (fromZoneId === toZoneId) {
            return [fromZoneId];
        }

        const visited = new Set<string>();
        const queue: { zoneId: string; path: string[] }[] = [
            { zoneId: fromZoneId, path: [fromZoneId] },
        ];

        while (queue.length > 0) {
            const { zoneId, path } = queue.shift()!;
            
            if (visited.has(zoneId)) {
                continue;
            }
            
            visited.add(zoneId);

            const connections = this.connectionMap.get(zoneId) || [];
            for (const conn of connections) {
                if (conn.toZoneId === toZoneId) {
                    return [...path, toZoneId];
                }
                
                if (!visited.has(conn.toZoneId)) {
                    queue.push({
                        zoneId: conn.toZoneId,
                        path: [...path, conn.toZoneId],
                    });
                }
            }
        }

        return null;
    }

    /**
     * Get connection between two zones
     */
    private getConnection(fromZoneId: string, toZoneId: string): ZoneConnection | undefined {
        const connections = this.connectionMap.get(fromZoneId) || [];
        return connections.find(conn => conn.toZoneId === toZoneId);
    }

    /**
     * Check if two zones are connected
     */
    areZonesConnected(zoneId1: string, zoneId2: string): boolean {
        const connection = this.getConnection(zoneId1, zoneId2);
        return connection !== undefined;
    }

    /**
     * Get all entities of a specific type across all zones
     */
    getEntitiesByType(type: ZoneEntity['type']): { zone: Zone; entity: ZoneEntity }[] {
        const results: { zone: Zone; entity: ZoneEntity }[] = [];
        
        this.zones.forEach(zone => {
            zone.getEntitiesByType(type).forEach(entity => {
                results.push({ zone, entity });
            });
        });
        
        return results;
    }

    /**
     * Find entity by ID
     */
    findEntity(entityId: string): { zone: Zone; entity: ZoneEntity } | undefined {
        for (const zone of this.zones) {
            const entity = zone.getEntity(entityId);
            if (entity) {
                return { zone, entity };
            }
        }
        return undefined;
    }

    /**
     * Get behaviors of a specific type
     */
    getBehaviorsByType(type: string): MapBehavior[] {
        return this.behaviors.filter(behavior => behavior.type === type);
    }

    /**
     * Add a new zone
     */
    addZone(zone: Zone): void {
        this.zones.push(zone);
        this.zoneMap.set(zone.id, zone);
    }

    /**
     * Remove a zone
     */
    removeZone(zoneId: string): boolean {
        const index = this.zones.findIndex(z => z.id === zoneId);
        if (index !== -1) {
            this.zones.splice(index, 1);
            this.zoneMap.delete(zoneId);
            
            // Remove connections to/from this zone
            this.connections = this.connections.filter(
                conn => conn.fromZoneId !== zoneId && conn.toZoneId !== zoneId,
            );
            this.buildConnectionMap();
            
            return true;
        }
        return false;
    }

    /**
     * Add a connection
     */
    addConnection(connection: ZoneConnection): void {
        this.connections.push(connection);
        this.buildConnectionMap();
    }

    /**
     * Get map description for AI
     */
    getDescription(): string {
        const zoneCount = this.zones.length;
        const connectionCount = this.connections.length;
        const npcCount = this.getEntitiesByType('npc').length;
        const enemyCount = this.getEntitiesByType('enemy').length;
        
        let desc = `${this.name}: ${this.description}\n`;
        desc += `Contains ${zoneCount} zones with ${connectionCount} connections.\n`;
        desc += `Population: ${npcCount} NPCs, ${enemyCount} enemies.\n`;
        desc += `Zone types: ${this.getZonePurposeSummary()}`;
        
        return desc;
    }

    /**
     * Get summary of zone purposes
     */
    private getZonePurposeSummary(): string {
        const purposeCounts = new Map<ZonePurpose, number>();
        
        this.zones.forEach(zone => {
            const count = purposeCounts.get(zone.purpose) || 0;
            purposeCounts.set(zone.purpose, count + 1);
        });
        
        return Array.from(purposeCounts.entries())
            .map(([purpose, count]) => `${count} ${purpose.replace('_', ' ')}`)
            .join(', ');
    }

    /**
     * Validate map structure
     */
    validate(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        // Check for duplicate zone IDs
        const zoneIds = new Set<string>();
        this.zones.forEach(zone => {
            if (zoneIds.has(zone.id)) {
                errors.push(`Duplicate zone ID: ${zone.id}`);
            }
            zoneIds.add(zone.id);
        });
        
        // Validate connections
        this.connections.forEach((conn, index) => {
            if (!this.zoneMap.has(conn.fromZoneId)) {
                errors.push(`Connection ${index}: Invalid fromZoneId: ${conn.fromZoneId}`);
            }
            if (!this.zoneMap.has(conn.toZoneId)) {
                errors.push(`Connection ${index}: Invalid toZoneId: ${conn.toZoneId}`);
            }
        });
        
        // Check for unreachable zones (if more than one zone exists)
        if (this.zones.length > 1) {
            const reachableZones = new Set<string>();
            const startZone = this.zones[0];
            this.findReachableZones(startZone.id, reachableZones);
            
            this.zones.forEach(zone => {
                if (!reachableZones.has(zone.id)) {
                    errors.push(`Zone ${zone.id} (${zone.name}) is not reachable from other zones`);
                }
            });
        }
        
        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Find all reachable zones from a starting zone
     */
    private findReachableZones(startZoneId: string, reachable: Set<string>): void {
        if (reachable.has(startZoneId)) {
            return;
        }
        
        reachable.add(startZoneId);
        const connections = this.connectionMap.get(startZoneId) || [];
        
        connections.forEach(conn => {
            this.findReachableZones(conn.toZoneId, reachable);
        });
    }

    /**
     * Serialize to JSON
     */
    toJSON(): IAIFirstMap {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            zones: this.zones.map(z => z.toJSON()),
            connections: this.connections,
            behaviors: this.behaviors,
            renderHints: this.renderHints,
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(data: IAIFirstMap): AIFirstMap {
        return new AIFirstMap(data);
    }
}