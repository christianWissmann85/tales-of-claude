/**
 * AI-First Map System Type Definitions
 * 
 * This file defines all TypeScript interfaces for the zone-based map system.
 * Maps are now defined by behavior and purpose, not visual representation.
 */

// Core positional types
export interface Position {
    x: number;
    y: number;
}

export interface Coordinate extends Position {
    z?: number; // Optional for multi-level maps
}

export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Bounds {
    min: Coordinate;
    max: Coordinate;
}

// Zone purpose defines the functional role of an area
export type ZonePurpose = 
    | 'social_hub'      // NPCs gather, shops, quests
    | 'combat_area'     // Enemy spawns, battles
    | 'transition'      // Connects areas
    | 'safe_zone'       // No combat, healing
    | 'puzzle_area'     // Environmental challenges
    | 'boss_arena'      // Special combat rules
    | 'secret_area'     // Hidden content
    | 'residential'     // NPC homes
    | 'commercial'      // Shops and services
    | 'industrial'      // Crafting, work areas
    | 'natural';        // Forests, caves, etc.

// Entity types that can exist in zones
export type EntityType = 'npc' | 'enemy' | 'item' | 'structure' | 'interaction_point';

// Connection types between zones
export type ConnectionType = 'adjacent' | 'portal' | 'stairs' | 'door';

// Environmental properties
export interface ZoneEnvironment {
    type: 'indoor' | 'outdoor' | 'underground';
    lighting?: 'bright' | 'dim' | 'dark';
    weather?: boolean;
}

// Entity behavior configuration
export interface EntityBehavior {
    type: string; // e.g., 'shopkeeper', 'guard', 'wanderer'
    config?: Record<string, unknown>;
    [key: string]: unknown; // Allow additional properties
}

// Zone entity definition
export interface ZoneEntity {
    type: EntityType;
    id: string;
    position: Position; // Relative to zone origin
    behavior?: EntityBehavior;
}

// Behavior trigger types
export interface BehaviorTrigger {
    type: 'time' | 'player_enter' | 'player_exit' | 'interaction' | 'quest_state' | 'time_period';
    conditions?: Record<string, unknown>;
    [key: string]: unknown; // Allow additional trigger properties
}

// Behavior action definition
export interface BehaviorAction {
    type: string;
    parameters?: Record<string, unknown>;
    [key: string]: unknown; // Allow additional action properties
}

// Zone-specific behavior
export interface ZoneBehavior {
    type: string;
    trigger: BehaviorTrigger;
    action: BehaviorAction;
}

// Zone definition - the core building block of maps
export interface Zone {
    id: string;
    name: string;
    purpose: ZonePurpose;
    bounds: Rectangle;
    
    // Explicit walkability
    walkableAreas: Rectangle[]; // If empty, entire zone is walkable
    blockedAreas?: Rectangle[]; // Explicit blocks within walkable areas
    
    // What belongs here
    entities: ZoneEntity[];
    
    // Zone-specific behaviors
    behaviors: ZoneBehavior[];
    
    // Environmental properties
    environment?: ZoneEnvironment;
}

// Connection requirements
export interface ConnectionRequirement {
    type: 'key' | 'quest' | 'level' | 'custom';
    value: string | number;
}

// Zone connection definition
export interface ZoneConnection {
    fromZoneId: string;
    toZoneId: string;
    type: ConnectionType;
    bidirectional: boolean;
    requirements?: ConnectionRequirement[];
    
    // Explicit connection points
    fromPoint: Position;
    toPoint: Position;
}

// Global map behaviors
export interface MapBehavior {
    type: 'time_based' | 'weather' | 'faction' | 'quest_state';
    config: Record<string, unknown>;
}

// Optional render configuration for visual representation
export interface RenderConfiguration {
    tileSize?: number;
    theme?: string;
    layers?: string[];
    [key: string]: unknown;
}

// Main map interface - AI-first design
export interface AIFirstMap {
    id: string;
    name: string;
    description: string; // What is this place?
    
    // Logical zones that compose the map
    zones: Zone[];
    
    // Connections between zones
    connections: ZoneConnection[];
    
    // Global behaviors
    behaviors: MapBehavior[];
    
    // Visual hints (optional, for renderer)
    renderHints?: RenderConfiguration;
}

// For hybrid approach - tile properties
export enum WalkabilityType {
    WALKABLE = 'WALKABLE',
    BLOCKED = 'BLOCKED',
    CONDITIONAL = 'CONDITIONAL',
    HAZARDOUS = 'HAZARDOUS'
}

export enum InteractionType {
    NONE = 'NONE',
    DOOR = 'DOOR',
    CHEST = 'CHEST',
    NPC = 'NPC',
    SHOP = 'SHOP',
    SIGN = 'SIGN',
    PORTAL = 'PORTAL',
    TRIGGER = 'TRIGGER',
    PICKUP = 'PICKUP'
}

// AI hints for better understanding
export interface AIHints {
    description: string;
    keywords: string[];
    suggestedActions: string[];
}

// Tile properties for hybrid approach
export interface TileProperties {
    walkability: WalkabilityType;
    interaction: InteractionType;
    conditions?: Record<string, unknown>;
    interactionData?: Record<string, unknown>;
    environment?: Record<string, unknown>;
    aiHints?: AIHints;
}

// Query result types
export interface MovementOption {
    direction: string;
    coordinate: Coordinate;
    description: string;
}

export interface Feature {
    type: InteractionType;
    coordinate: Coordinate;
    distance: number;
    description: string;
    keywords: string[];
}

export interface PathResult {
    found: boolean;
    steps: string[];
    distance: number;
    estimatedTime: number;
}

// Validation types
export type ValidationErrorType = 'STRUCTURAL' | 'LOGICAL' | 'REFERENCE' | 'PATHFINDING';
export type ValidationSeverity = 'ERROR' | 'WARNING';

export interface ValidationError {
    type: ValidationErrorType;
    location: string;
    message: string;
    severity: ValidationSeverity;
    suggestedFix?: string;
}

export interface ValidationWarning extends ValidationError {
    severity: 'WARNING';
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

// Zone analysis types
export interface SuggestedZone {
    bounds: Rectangle;
    suggestedPurpose: ZonePurpose;
    detectedEntities: EntityType[];
    confidence: number;
}