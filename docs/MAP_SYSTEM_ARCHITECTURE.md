# Map System Architecture Guide

## Overview

The Tales of Claude map system supports both JSON (preferred) and TypeScript formats for maximum flexibility. This document explains the architecture, loading flow, and how to work with massive maps.

## Map Format Types

### 1. JSON Maps (Preferred)
- **Location**: `src/assets/maps/json/`
- **Examples**: terminalTown.json, overworld.json, terminalFields.json
- **Created with**: Tiled map editor
- **Benefits**: 
  - Tool-friendly (visual editing)
  - Easier to modify
  - Supports layers and object data
  - Smaller file size

### 2. TypeScript Maps (Legacy)
- **Location**: `src/assets/maps/`
- **Examples**: binaryForest.ts, debugDungeon.ts
- **Status**: Legacy format, kept for backward compatibility
- **Benefits**: Type-safe, direct code integration

## Loading Flow

```
GameContext.loadInitialMap()
    ↓
getMap('terminalTown') [src/assets/maps/index.ts]
    ↓
MapLoader.getInstance().loadMap('terminalTown')
    ↓
1. Check cache
2. Try JSON (statically imported)
3. Fallback to TS if needed
    ↓
processJsonMap() [converts Tiled format to game format]
    ↓
new GameMap(mapData) [instantiates NPCs]
    ↓
UPDATE_MAP action → GameState
```

## Map Properties

Maps can include properties in their JSON:

```json
{
  "properties": {
    "spawnPoint": { "x": 50, "y": 50 },
    "ambientMusic": "town_theme",
    "weatherEnabled": true
  }
}
```

## Tile Layer System

Maps use three main layers:
1. **base**: Ground tiles (grass, floor, etc.)
2. **decoration**: Objects on top (trees, rocks)
3. **collision**: Walkability data (0 = walkable, 1 = wall)

## Creating New Maps

### Using Tiled:
1. Create new map in Tiled
2. Use standard tile IDs:
   - 0: Empty/walkable
   - 1: Grass
   - 2: Tree (wall)
   - 3: Wall
   - 4: Door
   - 5: Exit
3. Add object layer for NPCs, enemies, items
4. Export as JSON to `src/assets/maps/json/`
5. Add static import to MapLoader.ts:
   ```typescript
   import newMapJson from '../assets/maps/json/newMap.json';
   ```
6. Register in jsonMapRegistry:
   ```typescript
   newMap: newMapJson as any as JsonMap,
   ```

## Supporting Massive Maps (200x200+)

Current architecture loads entire maps into memory. For massive maps, implement:

### 1. Chunk-Based Architecture
```typescript
interface MapChunk {
  id: string;
  x: number; // Chunk coordinates
  y: number;
  tiles: Tile[][];
  entities: Entity[];
}
```

### 2. Lazy Loading
- Load chunks within radius of player
- Unload distant chunks
- Stream chunks as player moves

### 3. Spatial Partitioning
- Use Quadtree for entity queries
- Grid-based system for tile lookups
- O(log N) instead of O(N) performance

### 4. Memory Management
- Active chunks: ~9 chunks (3x3 around player)
- Chunk size: 32x32 or 64x64 tiles
- Total memory: constant regardless of world size

## World Map Implementation

To add world map view ('m' key):

### 1. Create WorldMapOverlay Component
```typescript
const WorldMapOverlay: React.FC = () => {
  // Render scaled-down map view
  // Show explored areas
  // Mark player position
};
```

### 2. Update GameState
```typescript
interface GameState {
  showWorldMap: boolean;
  // ...
}
```

### 3. Handle Input
```typescript
if (keys.has('m')) {
  dispatch({ type: 'TOGGLE_WORLD_MAP' });
}
```

### 4. Features
- Fog of war (use player.exploredMaps)
- Points of interest markers
- Fast travel (click to travel)
- Mini-map mode in corner

## Common Issues & Solutions

### Map Won't Load
1. Check spawn point is valid/walkable
2. Verify JSON is in jsonMapRegistry
3. Check console for validation errors

### Collision Issues
- Tiled: 0 = walkable, 1 = collision
- Verify collision layer interpretation

### Performance Problems
- Implement chunk loading for large maps
- Use spatial partitioning for entities
- Limit render distance

## Best Practices

1. **Always set spawn points** in map properties
2. **Test walkability** at spawn location
3. **Use meaningful layer names** (base, decoration, collision)
4. **Validate JSON** before importing
5. **Cache processed maps** to avoid reprocessing

## Future Enhancements

1. **Dynamic map loading** from server
2. **Procedural generation** for infinite worlds
3. **Level-of-detail** system for zooming
4. **Seamless world** with no loading screens
5. **Map editor** built into the game

## Chris's Vision

"Maps should be MASSIVE! Think 200x200 minimum, with Terminal Fields completely surrounding Terminal Town. When you're in the fields, the town should appear as a small cluster of buildings."

This guide will help achieve that vision through proper architecture and optimization.