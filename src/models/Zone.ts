/**
 * Zone Model
 * 
 * Core building block of the AI-first map system.
 * Zones define areas by their purpose and behavior, not appearance.
 */

import {
    Zone as IZone,
    Rectangle,
    Position,
    ZonePurpose,
    ZoneEntity,
    ZoneBehavior,
    ZoneEnvironment,
} from '../types/ai-map.types';

export class Zone implements IZone {
    id: string;
    name: string;
    purpose: ZonePurpose;
    bounds: Rectangle;
    walkableAreas: Rectangle[];
    blockedAreas?: Rectangle[];
    entities: ZoneEntity[];
    behaviors: ZoneBehavior[];
    environment?: ZoneEnvironment;

    constructor(data: IZone) {
        this.id = data.id;
        this.name = data.name;
        this.purpose = data.purpose;
        this.bounds = data.bounds;
        this.walkableAreas = data.walkableAreas.length > 0 ? data.walkableAreas : [data.bounds];
        this.blockedAreas = data.blockedAreas;
        this.entities = data.entities;
        this.behaviors = data.behaviors;
        this.environment = data.environment;
    }

    /**
     * Check if a position is walkable within this zone
     */
    isWalkable(position: Position): boolean {
        // First check if position is within zone bounds
        if (!this.isInBounds(position)) {
            return false;
        }

        // Check if position is in any blocked area
        if (this.blockedAreas) {
            for (const blocked of this.blockedAreas) {
                if (this.isPositionInRectangle(position, blocked)) {
                    return false;
                }
            }
        }

        // Check if position is in any walkable area
        for (const walkable of this.walkableAreas) {
            if (this.isPositionInRectangle(position, walkable)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if a position is within zone bounds
     */
    isInBounds(position: Position): boolean {
        return this.isPositionInRectangle(position, this.bounds);
    }

    /**
     * Get all entities of a specific type
     */
    getEntitiesByType(type: ZoneEntity['type']): ZoneEntity[] {
        return this.entities.filter(entity => entity.type === type);
    }

    /**
     * Get entity by ID
     */
    getEntity(id: string): ZoneEntity | undefined {
        return this.entities.find(entity => entity.id === id);
    }

    /**
     * Get behaviors triggered by a specific trigger type
     */
    getBehaviorsByTrigger(triggerType: string): ZoneBehavior[] {
        return this.behaviors.filter(behavior => behavior.trigger.type === triggerType);
    }

    /**
     * Add an entity to the zone
     */
    addEntity(entity: ZoneEntity): void {
        this.entities.push(entity);
    }

    /**
     * Remove an entity from the zone
     */
    removeEntity(entityId: string): boolean {
        const index = this.entities.findIndex(entity => entity.id === entityId);
        if (index !== -1) {
            this.entities.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Update entity position
     */
    updateEntityPosition(entityId: string, newPosition: Position): boolean {
        const entity = this.getEntity(entityId);
        if (entity) {
            entity.position = newPosition;
            return true;
        }
        return false;
    }

    /**
     * Get distance from zone center to a position
     */
    getDistanceFromCenter(position: Position): number {
        const centerX = this.bounds.x + this.bounds.width / 2;
        const centerY = this.bounds.y + this.bounds.height / 2;
        return Math.sqrt(
            Math.pow(position.x - centerX, 2) + 
            Math.pow(position.y - centerY, 2),
        );
    }

    /**
     * Get zone description for AI understanding
     */
    getDescription(): string {
        const entityCount = this.entities.length;
        const npcCount = this.getEntitiesByType('npc').length;
        const enemyCount = this.getEntitiesByType('enemy').length;
        
        let description = `${this.name} is a ${this.purpose.replace('_', ' ')} zone`;
        
        if (this.environment) {
            description += ` (${this.environment.type}`;
            if (this.environment.lighting) {
                description += `, ${this.environment.lighting} lighting`;
            }
            description += ')';
        }
        
        if (entityCount > 0) {
            description += `. Contains ${entityCount} entities`;
            if (npcCount > 0) { description += ` including ${npcCount} NPCs`; }
            if (enemyCount > 0) { description += ` and ${enemyCount} enemies`; }
        }
        
        return description;
    }

    /**
     * Helper to check if position is in rectangle
     */
    private isPositionInRectangle(position: Position, rect: Rectangle): boolean {
        return position.x >= rect.x &&
               position.x < rect.x + rect.width &&
               position.y >= rect.y &&
               position.y < rect.y + rect.height;
    }

    /**
     * Get all walkable positions (for pathfinding)
     */
    getWalkablePositions(): Position[] {
        const positions: Position[] = [];
        
        for (const walkable of this.walkableAreas) {
            for (let x = walkable.x; x < walkable.x + walkable.width; x++) {
                for (let y = walkable.y; y < walkable.y + walkable.height; y++) {
                    const pos = { x, y };
                    if (this.isWalkable(pos)) {
                        positions.push(pos);
                    }
                }
            }
        }
        
        return positions;
    }

    /**
     * Check if this zone serves a specific purpose
     */
    hasPurpose(purpose: ZonePurpose): boolean {
        return this.purpose === purpose;
    }

    /**
     * Serialize zone to JSON
     */
    toJSON(): IZone {
        return {
            id: this.id,
            name: this.name,
            purpose: this.purpose,
            bounds: this.bounds,
            walkableAreas: this.walkableAreas,
            blockedAreas: this.blockedAreas,
            entities: this.entities,
            behaviors: this.behaviors,
            environment: this.environment,
        };
    }

    /**
     * Create zone from JSON
     */
    static fromJSON(data: IZone): Zone {
        return new Zone(data);
    }
}