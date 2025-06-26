/**
 * Legacy Map Schema Types
 * 
 * DEPRECATED: These types are only for backwards compatibility.
 * Use ai-map.types.ts for new development.
 */

import { Position } from './global.types';

export interface TileType {
    id: string;
    name: string;
    walkable: boolean;
    sprite?: string;
}

export interface MapLayer {
    name: string;
    tiles: (string | null)[][];
}

export interface MapObject {
    id: string;
    type: string;
    position: Position;
    properties?: Record<string, unknown>;
}

export interface MapSchema {
    id: string;
    name: string;
    width: number;
    height: number;
    tileSize: number;
    layers: MapLayer[];
    objects?: MapObject[];
    properties?: Record<string, unknown>;
}

// Legacy types for backward compatibility
export interface JsonMapTileLayer {
    type: 'tilelayer';
    name: string;
    data: number[];
    width: number;
    height: number;
}

export interface JsonMapObjectLayer {
    type: 'objectgroup';
    name: string;
    objects: MapObject[];
}

export interface JsonMap {
    id: string;
    name: string;
    width: number;
    height: number;
    tilewidth: number;
    tileheight: number;
    layers: (JsonMapTileLayer | JsonMapObjectLayer)[];
}

// Alias for backward compatibility
export type JsonMapObject = MapObject;

// Re-export Position for convenience
export type { Position };