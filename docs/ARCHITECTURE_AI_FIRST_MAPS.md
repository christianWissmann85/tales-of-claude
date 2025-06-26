# AI-First Map Architecture

## Philosophy: Behavior Over Appearance

The current map system forces AI to "see" visual patterns to understand map logic. This is backwards. Maps should be defined by their **behavior and purpose**, not their visual representation.

## Core Principles

### 1. Explicit Over Implicit

- No guessing if a tile is walkable based on its type
- Clear zone boundaries and purposes
- Defined interaction points

### 2. Logical Zones Over Grid Patterns

- Maps are collections of purposeful zones
- Each zone has explicit properties
- Relationships between zones are defined

### 3. Behavior-First Design

- What can happen here? (actions)
- Who belongs here? (NPCs, enemies)
- What connects to here? (transitions)
- Visual representation comes last

### 4. Testable Without Rendering

- Can verify walkability programmatically
- Can validate zone connectivity
- Can test NPC behavior without visuals

## New Architecture

### Zone-Based Map Definition

```typescript
interface AIFirstMap {
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

interface Zone {
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
  environment?: {
    type: 'indoor' | 'outdoor' | 'underground';
    lighting?: 'bright' | 'dim' | 'dark';
    weather?: boolean;
  };
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

type ZonePurpose = 
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
  | 'natural'         // Forests, caves, etc.

interface ZoneEntity {
  type: 'npc' | 'enemy' | 'item' | 'structure' | 'interaction_point';
  id: string;
  position: Position; // Relative to zone origin
  behavior?: EntityBehavior;
}

interface ZoneConnection {
  fromZoneId: string;
  toZoneId: string;
  type: 'adjacent' | 'portal' | 'stairs' | 'door';
  bidirectional: boolean;
  requirements?: ConnectionRequirement[];
  
  // Explicit connection points
  fromPoint: Position;
  toPoint: Position;
}

interface ZoneBehavior {
  type: string;
  trigger: BehaviorTrigger;
  action: BehaviorAction;
}

interface MapBehavior {
  type: 'time_based' | 'weather' | 'faction' | 'quest_state';
  config: Record<string, any>;
}
```

### Example: Terminal Town Reimagined

```typescript
const terminalTownAI: AIFirstMap = {
  id: 'terminal_town',
  name: 'Terminal Town',
  description: 'A bustling digital settlement where programs live and work',
  
  zones: [
    {
      id: 'town_square',
      name: 'Central Square',
      purpose: 'social_hub',
      bounds: { x: 30, y: 30, width: 40, height: 40 },
      walkableAreas: [
        { x: 30, y: 30, width: 40, height: 40 }
      ],
      blockedAreas: [
        { x: 45, y: 45, width: 10, height: 10 } // Fountain
      ],
      entities: [
        {
          type: 'structure',
          id: 'fountain',
          position: { x: 50, y: 50 }
        },
        {
          type: 'npc',
          id: 'guild_recruiter',
          position: { x: 35, y: 35 },
          behavior: {
            type: 'stationary',
            dialogue: 'recruit_dialogue'
          }
        }
      ],
      behaviors: [
        {
          type: 'ambient_activity',
          trigger: { type: 'time', hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17] },
          action: { type: 'spawn_crowd_npcs', count: 5 }
        }
      ]
    },
    
    {
      id: 'market_district',
      name: 'Market District',
      purpose: 'commercial',
      bounds: { x: 70, y: 30, width: 30, height: 40 },
      walkableAreas: [
        { x: 70, y: 30, width: 30, height: 40 }
      ],
      entities: [
        {
          type: 'npc',
          id: 'array_merchant',
          position: { x: 75, y: 35 },
          behavior: {
            type: 'shopkeeper',
            shopId: 'array_shop',
            workHours: { start: 6, end: 20 }
          }
        },
        {
          type: 'structure',
          id: 'market_stall_1',
          position: { x: 75, y: 35 }
        }
      ],
      behaviors: [
        {
          type: 'shop_hours',
          trigger: { type: 'time', hours: [20, 21, 22, 23, 0, 1, 2, 3, 4, 5] },
          action: { type: 'close_shops' }
        }
      ]
    },
    
    {
      id: 'residential_district',
      name: 'Residential District',
      purpose: 'residential',
      bounds: { x: 10, y: 10, width: 20, height: 20 },
      walkableAreas: [
        { x: 10, y: 10, width: 20, height: 20 }
      ],
      entities: [
        {
          type: 'structure',
          id: 'small_house_1',
          position: { x: 12, y: 12 }
        },
        {
          type: 'structure',
          id: 'small_house_2',
          position: { x: 20, y: 12 }
        },
        {
          type: 'interaction_point',
          id: 'house_1_door',
          position: { x: 14, y: 15 },
          behavior: {
            type: 'zone_transition',
            targetZone: 'house_1_interior'
          }
        }
      ],
      behaviors: [
        {
          type: 'npc_schedules',
          trigger: { type: 'time', hours: [22, 23, 0, 1, 2, 3, 4, 5] },
          action: { type: 'npcs_return_home' }
        }
      ]
    },
    
    {
      id: 'town_entrance',
      name: 'Town Entrance',
      purpose: 'transition',
      bounds: { x: 45, y: 0, width: 10, height: 10 },
      walkableAreas: [
        { x: 45, y: 0, width: 10, height: 10 }
      ],
      entities: [
        {
          type: 'npc',
          id: 'gate_guard',
          position: { x: 47, y: 5 },
          behavior: {
            type: 'guard',
            dialogue: 'guard_dialogue'
          }
        }
      ]
    }
  ],
  
  connections: [
    {
      fromZoneId: 'town_square',
      toZoneId: 'market_district',
      type: 'adjacent',
      bidirectional: true,
      fromPoint: { x: 70, y: 50 },
      toPoint: { x: 70, y: 50 }
    },
    {
      fromZoneId: 'town_square',
      toZoneId: 'residential_district',
      type: 'adjacent',
      bidirectional: true,
      fromPoint: { x: 30, y: 30 },
      toPoint: { x: 30, y: 30 }
    },
    {
      fromZoneId: 'town_entrance',
      toZoneId: 'town_square',
      type: 'adjacent',
      bidirectional: true,
      fromPoint: { x: 50, y: 10 },
      toPoint: { x: 50, y: 30 }
    },
    {
      fromZoneId: 'town_entrance',
      toZoneId: 'world_map',
      type: 'portal',
      bidirectional: true,
      fromPoint: { x: 50, y: 0 },
      toPoint: { x: 0, y: 0 } // Defined by world map
    }
  ],
  
  behaviors: [
    {
      type: 'time_based',
      config: {
        dayNightCycle: true,
        npcSchedules: true
      }
    },
    {
      type: 'weather',
      config: {
        enabled: true,
        types: ['clear', 'rain', 'fog']
      }
    }
  ]
};
```

## Migration Strategy

### Phase 1: Dual System

1. Create zone definitions alongside existing tile arrays
2. Build zone analyzer that extracts zones from tile patterns
3. Validate zone definitions match tile behavior

### Phase 2: Zone-First Development

1. New maps use zone definitions
2. Tile array generated from zones for rendering
3. All logic uses zones, not tiles

### Phase 3: Complete Migration

1. Convert all existing maps to zone format
2. Remove tile-based logic
3. Renderer uses zones directly

## Benefits

### For AI Development

- No visual pattern matching needed
- Clear understanding of map purpose
- Explicit behavior definitions
- Easy to generate new content

### For Testing

- Can test zone connectivity
- Can verify NPC behavior
- Can validate game progression
- No rendering required

### For Humans

- Clear map structure documentation
- Easy to understand map flow
- Purposeful design decisions
- Maintainable and extensible

## Implementation Notes

### Zone Analyzer Tool

```typescript
// Analyzes existing tile-based maps and suggests zone definitions
class ZoneAnalyzer {
  analyzeMap(tileMap: Tile[][]): SuggestedZone[] {
    // Identify connected walkable areas
    // Detect common patterns (walls, paths, etc.)
    // Suggest zone boundaries and purposes
    // Return zone definitions
  }
}
```

### Zone to Tile Converter

```typescript
// Generates tile array from zone definitions for rendering
class ZoneToTileConverter {
  convertToTiles(map: AIFirstMap, width: number, height: number): Tile[][] {
    // Create empty tile grid
    // For each zone, fill walkable areas
    // Add blocked areas
    // Place structures and entities
    // Return tile array
  }
}
```

### AI-Friendly Queries

```typescript
interface AIMapQueries {
  // "What zones connect to the town square?"
  getConnectedZones(zoneId: string): Zone[];
  
  // "Where do NPCs gather?"
  getZonesByPurpose(purpose: ZonePurpose): Zone[];
  
  // "What happens in this zone at night?"
  getZoneBehaviors(zoneId: string, time?: number): ZoneBehavior[];
  
  // "Can the player walk from A to B?"
  findPath(from: Position, to: Position): Position[] | null;
  
  // "What's the purpose of this location?"
  getZoneAtPosition(pos: Position): Zone | null;
}
```

## Next Steps

1. Implement zone analyzer for existing maps
2. Create zone editor tool
3. Build validation system
4. Convert Terminal Town as proof of concept
5. Document zone design patterns
6. Train AI agents on zone-based development

## Conclusion

This architecture shifts map design from "what it looks like" to "what it does". By making behavior explicit and visual representation secondary, we enable:

- AI agents that understand maps without "seeing" them
- Comprehensive testing without rendering
- Clear documentation of map intent
- Easier content generation
- More maintainable code

The revolution in map design starts with asking "why?" before "how?" - and definitely before "what color?"
