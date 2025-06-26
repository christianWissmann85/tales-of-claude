/**
 * Terminal Town - AI-First Map Implementation
 * 
 * The bustling digital settlement reimagined with zones.
 * This demonstrates how to build maps that AI can understand and navigate.
 */

import { AIFirstMap } from '../types/ai-map.types';

export const terminalTownAI: AIFirstMap = {
    id: 'terminal_town_ai',
    name: 'Terminal Town',
    description: 'A bustling digital settlement where programs live and work',
    
    zones: [
        // Central Square - The heart of the town
        {
            id: 'town_square',
            name: 'Central Square',
            purpose: 'social_hub',
            bounds: { x: 100, y: 100, width: 100, height: 100 },
            walkableAreas: [
                { x: 100, y: 100, width: 100, height: 100 },
            ],
            blockedAreas: [
                { x: 140, y: 140, width: 20, height: 20 }, // Fountain in center
            ],
            entities: [
                {
                    type: 'structure',
                    id: 'central_fountain',
                    position: { x: 50, y: 50 }, // Relative to zone origin
                    behavior: {
                        type: 'landmark',
                        description: 'A beautiful digital fountain sparkles with binary water',
                    },
                },
                {
                    type: 'npc',
                    id: 'town_crier',
                    position: { x: 30, y: 30 },
                    behavior: {
                        type: 'information_giver',
                        dialogue: 'town_crier_dialogue',
                        schedule: 'always_active',
                    },
                },
                {
                    type: 'npc',
                    id: 'guild_recruiter',
                    position: { x: 70, y: 30 },
                    behavior: {
                        type: 'quest_giver',
                        questId: 'join_guild',
                        dialogue: 'guild_recruiter_dialogue',
                    },
                },
            ],
            behaviors: [
                {
                    type: 'ambient_npcs',
                    trigger: {
                        type: 'time_period',
                        period: 'day',
                    },
                    action: {
                        type: 'spawn_wandering_npcs',
                        count: 5,
                        npcType: 'townsperson',
                    },
                },
                {
                    type: 'lighting',
                    trigger: {
                        type: 'time_period',
                        period: 'night',
                    },
                    action: {
                        type: 'activate_lights',
                        lightSources: ['fountain', 'lamp_posts'],
                    },
                },
            ],
            environment: {
                type: 'outdoor',
                lighting: 'bright',
                weather: true,
            },
        },
        
        // Market District - Shopping and commerce
        {
            id: 'market_district',
            name: 'Market District',
            purpose: 'commercial',
            bounds: { x: 200, y: 100, width: 80, height: 100 },
            walkableAreas: [
                { x: 200, y: 100, width: 80, height: 100 },
            ],
            blockedAreas: [
                { x: 210, y: 110, width: 20, height: 15 }, // Array shop stall
                { x: 240, y: 110, width: 20, height: 15 }, // Weapon shop stall
                { x: 210, y: 140, width: 20, height: 15 }, // Potion shop stall
                { x: 240, y: 140, width: 20, height: 15 },  // Magic shop stall
            ],
            entities: [
                {
                    type: 'npc',
                    id: 'array_merchant',
                    position: { x: 20, y: 20 },
                    behavior: {
                        type: 'shopkeeper',
                        shopId: 'array_shop',
                        inventory: 'array_merchant_inventory',
                        dialogue: 'array_merchant_dialogue',
                        workHours: { start: 6, end: 20 },
                    },
                },
                {
                    type: 'npc',
                    id: 'weapon_smith',
                    position: { x: 50, y: 20 },
                    behavior: {
                        type: 'shopkeeper',
                        shopId: 'weapon_shop',
                        inventory: 'weapon_shop_inventory',
                        dialogue: 'weapon_smith_dialogue',
                        workHours: { start: 7, end: 19 },
                    },
                },
                {
                    type: 'npc',
                    id: 'potion_seller',
                    position: { x: 20, y: 50 },
                    behavior: {
                        type: 'shopkeeper',
                        shopId: 'potion_shop',
                        inventory: 'potion_shop_inventory',
                        dialogue: 'potion_seller_dialogue',
                        workHours: { start: 8, end: 21 },
                    },
                },
                {
                    type: 'structure',
                    id: 'market_stalls',
                    position: { x: 0, y: 0 },
                    behavior: {
                        type: 'decoration',
                        description: 'Colorful market stalls line the street',
                    },
                },
            ],
            behaviors: [
                {
                    type: 'shop_hours',
                    trigger: {
                        type: 'time',
                        hours: [20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6],
                    },
                    action: {
                        type: 'close_shops',
                        message: 'The shops are closed for the night',
                    },
                },
                {
                    type: 'market_activity',
                    trigger: {
                        type: 'time_period',
                        period: 'day',
                        days: ['saturday', 'sunday'],
                    },
                    action: {
                        type: 'spawn_market_crowd',
                        density: 'high',
                    },
                },
            ],
            environment: {
                type: 'outdoor',
                weather: true,
            },
        },
        
        // Residential District - Where NPCs live
        {
            id: 'residential_district',
            name: 'Residential District',
            purpose: 'residential',
            bounds: { x: 20, y: 100, width: 80, height: 100 },
            walkableAreas: [
                { x: 20, y: 100, width: 80, height: 100 },
            ],
            blockedAreas: [
                { x: 30, y: 110, width: 25, height: 25 }, // House 1
                { x: 65, y: 110, width: 25, height: 25 }, // House 2
                { x: 30, y: 145, width: 25, height: 25 }, // House 3
                { x: 65, y: 145, width: 25, height: 25 },  // House 4
            ],
            entities: [
                {
                    type: 'structure',
                    id: 'small_house_1',
                    position: { x: 20, y: 20 },
                    behavior: {
                        type: 'building',
                        residents: ['townsperson_1', 'townsperson_2'],
                    },
                },
                {
                    type: 'structure',
                    id: 'small_house_2',
                    position: { x: 55, y: 20 },
                    behavior: {
                        type: 'building',
                        residents: ['townsperson_3'],
                    },
                },
                {
                    type: 'interaction_point',
                    id: 'house_1_door',
                    position: { x: 25, y: 35 },
                    behavior: {
                        type: 'zone_transition',
                        targetZone: 'house_1_interior',
                        requiresKey: false,
                    },
                },
                {
                    type: 'npc',
                    id: 'neighborhood_watch',
                    position: { x: 40, y: 80 },
                    behavior: {
                        type: 'patrol',
                        route: 'residential_patrol',
                        dialogue: 'watch_dialogue',
                    },
                },
            ],
            behaviors: [
                {
                    type: 'quiet_hours',
                    trigger: {
                        type: 'time',
                        hours: [22, 23, 0, 1, 2, 3, 4, 5],
                    },
                    action: {
                        type: 'reduce_activity',
                        ambientSound: 'quiet',
                    },
                },
                {
                    type: 'npc_schedules',
                    trigger: {
                        type: 'time',
                        hours: [21, 22],
                    },
                    action: {
                        type: 'npcs_return_home',
                        npcList: 'residents',
                    },
                },
            ],
            environment: {
                type: 'outdoor',
                weather: true,
            },
        },
        
        // Town Entrance - Gateway to the world
        {
            id: 'town_entrance',
            name: 'Town Entrance',
            purpose: 'transition',
            bounds: { x: 120, y: 20, width: 60, height: 80 },
            walkableAreas: [
                { x: 120, y: 20, width: 60, height: 80 },
            ],
            blockedAreas: [
                { x: 120, y: 20, width: 20, height: 80 },  // Left wall
                { x: 160, y: 20, width: 20, height: 80 },   // Right wall
            ],
            entities: [
                {
                    type: 'npc',
                    id: 'gate_guard_left',
                    position: { x: 25, y: 40 },
                    behavior: {
                        type: 'guard',
                        dialogue: 'guard_dialogue',
                        hostile: false,
                        faction: 'town_guard',
                    },
                },
                {
                    type: 'npc',
                    id: 'gate_guard_right',
                    position: { x: 35, y: 40 },
                    behavior: {
                        type: 'guard',
                        dialogue: 'guard_dialogue',
                        hostile: false,
                        faction: 'town_guard',
                    },
                },
                {
                    type: 'structure',
                    id: 'town_gates',
                    position: { x: 30, y: 0 },
                    behavior: {
                        type: 'landmark',
                        description: 'Large wooden gates mark the entrance to Terminal Town',
                    },
                },
                {
                    type: 'interaction_point',
                    id: 'exit_to_world',
                    position: { x: 30, y: 10 },
                    behavior: {
                        type: 'map_transition',
                        targetMap: 'world_map',
                        targetPosition: { x: 500, y: 300 },
                    },
                },
            ],
            behaviors: [
                {
                    type: 'gate_control',
                    trigger: {
                        type: 'time',
                        hours: [20, 21, 22, 23, 0, 1, 2, 3, 4, 5],
                    },
                    action: {
                        type: 'close_gates',
                        guards_alert: true,
                    },
                },
            ],
            environment: {
                type: 'outdoor',
                weather: true,
            },
        },
        
        // Inn and Tavern - Safe zone for rest
        {
            id: 'inn_district',
            name: 'The Rusty Bit Inn',
            purpose: 'safe_zone',
            bounds: { x: 100, y: 200, width: 100, height: 60 },
            walkableAreas: [
                { x: 100, y: 200, width: 100, height: 60 },
            ],
            blockedAreas: [
                { x: 110, y: 210, width: 30, height: 20 }, // Bar area
                { x: 160, y: 210, width: 30, height: 40 },  // Private rooms
            ],
            entities: [
                {
                    type: 'npc',
                    id: 'innkeeper',
                    position: { x: 25, y: 20 },
                    behavior: {
                        type: 'innkeeper',
                        services: ['rest', 'save_game', 'rumors'],
                        dialogue: 'innkeeper_dialogue',
                        restCost: 10,
                    },
                },
                {
                    type: 'npc',
                    id: 'mysterious_traveler',
                    position: { x: 80, y: 40 },
                    behavior: {
                        type: 'quest_giver',
                        questId: 'ancient_mystery',
                        dialogue: 'traveler_dialogue',
                        appears: 'random',
                    },
                },
                {
                    type: 'interaction_point',
                    id: 'save_point',
                    position: { x: 50, y: 30 },
                    behavior: {
                        type: 'save_game',
                        visual: 'glowing_crystal',
                    },
                },
            ],
            behaviors: [
                {
                    type: 'safe_zone_healing',
                    trigger: {
                        type: 'player_enter',
                    },
                    action: {
                        type: 'gradual_heal',
                        rate: 5,
                        interval: 1000,
                    },
                },
                {
                    type: 'no_combat',
                    trigger: {
                        type: 'player_enter',
                        conditions: { persistent: true },
                    },
                    action: {
                        type: 'prevent_combat',
                        message: 'Violence is not allowed in the inn',
                    },
                },
            ],
            environment: {
                type: 'indoor',
                lighting: 'dim',
                weather: false,
            },
        },
    ],
    
    connections: [
        // Town Square connections
        {
            fromZoneId: 'town_square',
            toZoneId: 'market_district',
            type: 'adjacent',
            bidirectional: true,
            fromPoint: { x: 199, y: 150 },  // Right edge of town square
            toPoint: { x: 201, y: 150 },     // Left edge of market
        },
        {
            fromZoneId: 'town_square',
            toZoneId: 'residential_district',
            type: 'adjacent',
            bidirectional: true,
            fromPoint: { x: 101, y: 150 },  // Left edge of town square
            toPoint: { x: 99, y: 150 },      // Right edge of residential
        },
        {
            fromZoneId: 'town_square',
            toZoneId: 'town_entrance',
            type: 'adjacent',
            bidirectional: true,
            fromPoint: { x: 150, y: 101 },  // Top edge of town square
            toPoint: { x: 150, y: 99 },      // Bottom edge of entrance
        },
        {
            fromZoneId: 'town_square',
            toZoneId: 'inn_district',
            type: 'adjacent',
            bidirectional: true,
            fromPoint: { x: 150, y: 199 },  // Bottom edge of town square
            toPoint: { x: 150, y: 201 },     // Top edge of inn
        },
        
        // Comment out external connections for now
        /*
        // Entrance to world map
        {
            fromZoneId: 'town_entrance',
            toZoneId: 'world_map',
            type: 'portal',
            bidirectional: true,
            fromPoint: { x: 150, y: 20 },
            toPoint: { x: 0, y: 0 } // Defined by world map
        },
        
        // Interior connections (examples)
        {
            fromZoneId: 'residential_district',
            toZoneId: 'house_1_interior',
            type: 'door',
            bidirectional: true,
            fromPoint: { x: 45, y: 135 },
            toPoint: { x: 10, y: 10 },
            requirements: [
                { type: 'key', value: 'house_1_key' }
            ]
        }
        */
    ],
    
    behaviors: [
        {
            type: 'time_based',
            config: {
                dayNightCycle: true,
                cycleLength: 24000, // 24 game hours in milliseconds
                startTime: 8, // Start at 8 AM
            },
        },
        {
            type: 'weather',
            config: {
                enabled: true,
                types: ['clear', 'cloudy', 'rain', 'fog'],
                changeInterval: 3600000, // Change every hour
                seasonal: true,
            },
        },
        {
            type: 'faction',
            config: {
                factions: ['town_guard', 'merchants_guild', 'thieves_guild'],
                defaultRelations: {
                    'town_guard': { 'thieves_guild': -50 },
                    'merchants_guild': { 'town_guard': 50 },
                },
            },
        },
    ],
    
    renderHints: {
        tileSize: 16,
        theme: 'medieval_town',
        layers: ['ground', 'buildings', 'decorations', 'npcs'],
        ambientSound: 'town_ambience',
        musicTrack: 'peaceful_town',
    },
};

/**
 * Helper function to create interior zones
 */
export function createInteriorZone(id: string, name: string, parentZone: string) {
    return {
        id,
        name,
        purpose: 'residential' as const,
        bounds: { x: 0, y: 0, width: 50, height: 50 },
        walkableAreas: [
            { x: 0, y: 0, width: 50, height: 50 },
        ],
        blockedAreas: [
            { x: 0, y: 0, width: 50, height: 5 },   // North wall
            { x: 0, y: 45, width: 50, height: 5 },  // South wall
            { x: 0, y: 0, width: 5, height: 50 },   // West wall
            { x: 45, y: 0, width: 5, height: 50 },   // East wall
        ],
        entities: [],
        behaviors: [],
        environment: {
            type: 'indoor' as const,
            lighting: 'dim' as const,
            weather: false,
        },
    };
}