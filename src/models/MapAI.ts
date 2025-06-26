/**
 * MapAI - Natural Language Interface for Maps
 * 
 * Provides AI-friendly queries and descriptions for the zone-based map system.
 * This allows AI agents to understand and work with maps using natural language.
 */

import {
    Position,
    Coordinate,
    MovementOption,
    Feature,
    PathResult,
    InteractionType,
    ZoneEntity,
} from '../types/ai-map.types';
import { AIFirstMap } from './AIFirstMap';
import { Zone } from './Zone';

export class MapAI {
    private map: AIFirstMap;

    constructor(map: AIFirstMap) {
        this.map = map;
    }

    /**
     * Describe a location in natural language
     */
    describeLocation(coordinate: Coordinate): string {
        const zone = this.map.getZoneAtPosition(coordinate);
        
        if (!zone) {
            return 'You are outside the known map boundaries. Nothing but void here.';
        }

        let description = `You are in ${zone.name}.`;
        
        // Add zone purpose description
        const purposeDesc = this.describePurpose(zone.purpose);
        if (purposeDesc) {
            description += ` ${purposeDesc}`;
        }

        // Add environment description
        if (zone.environment) {
            description += ` This is an ${zone.environment.type} area`;
            if (zone.environment.lighting) {
                description += ` with ${zone.environment.lighting} lighting`;
            }
            description += '.';
        }

        // Describe nearby entities
        const nearbyEntities = this.findNearbyEntities(coordinate, zone, 10);
        if (nearbyEntities.length > 0) {
            description += '\n\nNearby:';
            nearbyEntities.forEach(({ entity, distance }) => {
                description += `\n- ${this.describeEntity(entity)} (${Math.round(distance)} steps away)`;
            });
        }

        // Describe available exits
        const connections = this.map.getConnectedZones(zone.id);
        if (connections.length > 0) {
            description += '\n\nExits:';
            connections.forEach(connectedZone => {
                const direction = this.getDirectionToZone(zone, connectedZone);
                description += `\n- ${direction} to ${connectedZone.name}`;
            });
        }

        return description;
    }

    /**
     * Get movement options from current position
     */
    getMovementOptions(coordinate: Coordinate): MovementOption[] {
        const options: MovementOption[] = [];
        const currentZone = this.map.getZoneAtPosition(coordinate);
        
        if (!currentZone) {
            return options;
        }

        // Check cardinal directions
        const directions = [
            { name: 'north', offset: { x: 0, y: -1 } },
            { name: 'south', offset: { x: 0, y: 1 } },
            { name: 'east', offset: { x: 1, y: 0 } },
            { name: 'west', offset: { x: -1, y: 0 } },
            { name: 'northeast', offset: { x: 1, y: -1 } },
            { name: 'northwest', offset: { x: -1, y: -1 } },
            { name: 'southeast', offset: { x: 1, y: 1 } },
            { name: 'southwest', offset: { x: -1, y: 1 } },
        ];

        directions.forEach(({ name, offset }) => {
            const newPos: Coordinate = {
                x: coordinate.x + offset.x,
                y: coordinate.y + offset.y,
                z: coordinate.z,
            };

            if (this.map.isWalkable(newPos)) {
                const targetZone = this.map.getZoneAtPosition(newPos);
                let description = 'Clear path';
                
                if (targetZone && targetZone.id !== currentZone.id) {
                    description = `Leads to ${targetZone.name}`;
                }

                options.push({
                    direction: name,
                    coordinate: newPos,
                    description,
                });
            }
        });

        // Add zone transition points
        const connections = this.map.connections.filter(conn => 
            conn.fromZoneId === currentZone.id,
        );

        connections.forEach(conn => {
            const targetZone = this.map.getZone(conn.toZoneId);
            if (targetZone) {
                const distance = this.getDistance(coordinate, conn.fromPoint);
                if (distance < 5) { // Only show nearby transitions
                    options.push({
                        direction: `portal to ${targetZone.name}`,
                        coordinate: conn.fromPoint,
                        description: `${conn.type} connection to ${targetZone.name}`,
                    });
                }
            }
        });

        return options;
    }

    /**
     * Find nearby interactive features
     */
    findNearbyFeatures(coordinate: Coordinate, radius: number = 10): Feature[] {
        const features: Feature[] = [];
        const currentZone = this.map.getZoneAtPosition(coordinate);
        
        if (!currentZone) {
            return features;
        }

        // Check entities in current zone
        currentZone.entities.forEach(entity => {
            const distance = this.getDistance(coordinate, {
                x: currentZone.bounds.x + entity.position.x,
                y: currentZone.bounds.y + entity.position.y,
            });

            if (distance <= radius) {
                features.push({
                    type: this.entityTypeToInteractionType(entity.type),
                    coordinate: {
                        x: currentZone.bounds.x + entity.position.x,
                        y: currentZone.bounds.y + entity.position.y,
                    },
                    distance,
                    description: this.describeEntity(entity),
                    keywords: this.getEntityKeywords(entity),
                });
            }
        });

        // Check nearby zones if radius is large enough
        if (radius > 20) {
            this.map.zones.forEach(zone => {
                if (zone.id !== currentZone.id) {
                    const zoneDistance = this.getDistanceToZone(coordinate, zone);
                    if (zoneDistance <= radius) {
                        zone.entities.forEach(entity => {
                            const entityCoord = {
                                x: zone.bounds.x + entity.position.x,
                                y: zone.bounds.y + entity.position.y,
                            };
                            const distance = this.getDistance(coordinate, entityCoord);
                            
                            if (distance <= radius) {
                                features.push({
                                    type: this.entityTypeToInteractionType(entity.type),
                                    coordinate: entityCoord,
                                    distance,
                                    description: `${this.describeEntity(entity)} in ${zone.name}`,
                                    keywords: this.getEntityKeywords(entity),
                                });
                            }
                        });
                    }
                }
            });
        }

        // Sort by distance
        features.sort((a, b) => a.distance - b.distance);
        
        return features;
    }

    /**
     * Find path with natural language directions
     */
    findPath(from: Coordinate, to: Coordinate): PathResult {
        const path = this.map.findPath(from, to);
        
        if (!path || path.length === 0) {
            return {
                found: false,
                steps: ['No path found between these locations.'],
                distance: -1,
                estimatedTime: -1,
            };
        }

        const steps: string[] = [];
        let totalDistance = 0;

        for (let i = 0; i < path.length - 1; i++) {
            const current = path[i];
            const next = path[i + 1];
            const distance = this.getDistance(current, next);
            totalDistance += distance;

            const currentZone = this.map.getZoneAtPosition(current);
            const nextZone = this.map.getZoneAtPosition(next);

            if (currentZone && nextZone && currentZone.id !== nextZone.id) {
                // Zone transition
                const connection = this.map.connections.find(conn =>
                    conn.fromZoneId === currentZone.id && 
                    conn.toZoneId === nextZone.id,
                );
                
                if (connection) {
                    steps.push(`Take the ${connection.type} from ${currentZone.name} to ${nextZone.name}`);
                }
            } else {
                // Movement within zone
                const direction = this.getDirection(current, next);
                if (i === 0) {
                    steps.push(`Head ${direction}`);
                } else if (distance > 5) {
                    steps.push(`Continue ${direction} for ${Math.round(distance)} steps`);
                }
            }
        }

        const finalZone = this.map.getZoneAtPosition(to);
        if (finalZone) {
            steps.push(`Arrive at your destination in ${finalZone.name}`);
        }

        return {
            found: true,
            steps,
            distance: Math.round(totalDistance),
            estimatedTime: Math.round(totalDistance * 0.5), // Assume 0.5 seconds per step
        };
    }

    /**
     * Suggest contextual actions based on location
     */
    suggestActions(coordinate: Coordinate): string[] {
        const suggestions: string[] = [];
        const zone = this.map.getZoneAtPosition(coordinate);
        
        if (!zone) {
            return ['Move to a valid location on the map'];
        }

        // Movement suggestions
        const movements = this.getMovementOptions(coordinate);
        if (movements.length > 0) {
            suggestions.push(`Move ${movements[0].direction}`);
        }

        // Nearby features
        const features = this.findNearbyFeatures(coordinate, 5);
        features.forEach(feature => {
            switch (feature.type) {
                case InteractionType.NPC:
                    suggestions.push(`Talk to ${feature.description}`);
                    break;
                case InteractionType.SHOP:
                    suggestions.push(`Browse shop at ${feature.description}`);
                    break;
                case InteractionType.CHEST:
                    suggestions.push(`Open ${feature.description}`);
                    break;
                case InteractionType.DOOR:
                    suggestions.push(`Enter through ${feature.description}`);
                    break;
                case InteractionType.PORTAL:
                    suggestions.push(`Use ${feature.description}`);
                    break;
            }
        });

        // Zone-specific suggestions
        switch (zone.purpose) {
            case 'safe_zone':
                suggestions.push('Rest and recover health');
                suggestions.push('Save your game');
                break;
            case 'commercial':
                suggestions.push('Look for shops and merchants');
                break;
            case 'combat_area':
                suggestions.push('Prepare for battle');
                suggestions.push('Check equipment');
                break;
            case 'puzzle_area':
                suggestions.push('Look for clues');
                suggestions.push('Examine the environment');
                break;
        }

        return suggestions;
    }

    /**
     * Search for locations by query
     */
    searchLocations(query: string): Zone[] {
        const queryLower = query.toLowerCase();
        const results: Zone[] = [];

        // Search zone names and purposes
        this.map.zones.forEach(zone => {
            if (zone.name.toLowerCase().includes(queryLower) ||
                zone.purpose.toLowerCase().includes(queryLower)) {
                results.push(zone);
            }
        });

        // Search for zones containing specific entity types
        if (queryLower.includes('shop') || queryLower.includes('merchant')) {
            this.map.getZonesByPurpose('commercial').forEach(zone => {
                if (!results.includes(zone)) {
                    results.push(zone);
                }
            });
        }

        if (queryLower.includes('safe') || queryLower.includes('rest')) {
            this.map.getZonesByPurpose('safe_zone').forEach(zone => {
                if (!results.includes(zone)) {
                    results.push(zone);
                }
            });
        }

        return results;
    }

    /**
     * Helper: Convert entity type to interaction type
     */
    private entityTypeToInteractionType(entityType: ZoneEntity['type']): InteractionType {
        switch (entityType) {
            case 'npc':
                return InteractionType.NPC;
            case 'structure':
                return InteractionType.NONE;
            case 'interaction_point':
                return InteractionType.TRIGGER;
            case 'item':
                return InteractionType.PICKUP;
            default:
                return InteractionType.NONE;
        }
    }

    /**
     * Helper: Describe entity in natural language
     */
    private describeEntity(entity: ZoneEntity): string {
        let description = entity.id.replace(/_/g, ' ');
        
        if (entity.behavior) {
            switch (entity.behavior.type) {
                case 'shopkeeper':
                    description += ' (merchant)';
                    break;
                case 'guard':
                    description += ' (guard)';
                    break;
                case 'quest_giver':
                    description += ' (has quest)';
                    break;
            }
        }
        
        return description;
    }

    /**
     * Helper: Get keywords for entity
     */
    private getEntityKeywords(entity: ZoneEntity): string[] {
        const keywords = [entity.type, entity.id];
        
        if (entity.behavior) {
            keywords.push(entity.behavior.type);
        }
        
        return keywords;
    }

    /**
     * Helper: Get distance between two positions
     */
    private getDistance(pos1: Position, pos2: Position): number {
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    }

    /**
     * Helper: Get distance to zone
     */
    private getDistanceToZone(position: Position, zone: Zone): number {
        const centerX = zone.bounds.x + zone.bounds.width / 2;
        const centerY = zone.bounds.y + zone.bounds.height / 2;
        return this.getDistance(position, { x: centerX, y: centerY });
    }

    /**
     * Helper: Find entities near a position
     */
    private findNearbyEntities(
        position: Position, 
        zone: Zone, 
        radius: number,
    ): { entity: ZoneEntity; distance: number }[] {
        const nearby: { entity: ZoneEntity; distance: number }[] = [];
        
        zone.entities.forEach(entity => {
            const entityPos = {
                x: zone.bounds.x + entity.position.x,
                y: zone.bounds.y + entity.position.y,
            };
            const distance = this.getDistance(position, entityPos);
            
            if (distance <= radius) {
                nearby.push({ entity, distance });
            }
        });
        
        return nearby.sort((a, b) => a.distance - b.distance);
    }

    /**
     * Helper: Describe zone purpose
     */
    private describePurpose(purpose: string): string {
        const descriptions: Record<string, string> = {
            'social_hub': 'This is a bustling area where people gather.',
            'combat_area': 'Danger lurks here - stay alert!',
            'transition': 'This area connects to other regions.',
            'safe_zone': 'You feel safe here. A good place to rest.',
            'puzzle_area': 'Something here requires clever thinking.',
            'boss_arena': 'A powerful foe awaits in this arena.',
            'secret_area': 'You\'ve discovered a hidden area!',
            'residential': 'People make their homes here.',
            'commercial': 'Merchants and shops line this area.',
            'industrial': 'The sounds of work and crafting fill the air.',
            'natural': 'Nature dominates this untamed area.',
        };
        
        return descriptions[purpose] || '';
    }

    /**
     * Helper: Get direction between positions
     */
    private getDirection(from: Position, to: Position): string {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'east' : 'west';
        } else if (dy !== 0) {
            return dy > 0 ? 'south' : 'north';
        } else {
            return 'here';
        }
    }

    /**
     * Helper: Get direction to connected zone
     */
    private getDirectionToZone(fromZone: Zone, toZone: Zone): string {
        const fromCenter = {
            x: fromZone.bounds.x + fromZone.bounds.width / 2,
            y: fromZone.bounds.y + fromZone.bounds.height / 2,
        };
        const toCenter = {
            x: toZone.bounds.x + toZone.bounds.width / 2,
            y: toZone.bounds.y + toZone.bounds.height / 2,
        };
        
        return this.getDirection(fromCenter, toCenter);
    }
}