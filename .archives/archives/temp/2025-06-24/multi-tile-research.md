Of course. As a game development architect specializing in tile-based rendering, I'd be happy to provide a comprehensive technical design for a multi-tile structure system. This document will analyze various approaches and recommend a solution that is elegant, maintainable, and integrates smoothly with your existing React-based architecture.

---

## Technical Design Document: Multi-Tile Structure System

**Author:** Game Development Architect
**Date:** October 26, 2023
**Version:** 1.0

### 1. Overview

This document outlines the research and design for implementing multi-tile structures (e.g., houses, castles) within the existing 2D grid-based game engine. The current system renders a grid of 1x1 emoji-based tiles. The new system must support structures spanning multiple tiles (2x2, 3x3, etc.) while maintaining visual coherence, correct collision, and backward compatibility.

Our primary goal is to achieve this with minimal disruption to the current architecture, prioritizing a clean data model and an efficient rendering strategy that leverages the strengths of React and CSS Grid.

---

### 2. Implementation Approaches: A Comparative Analysis

We will evaluate five potential implementation techniques.

| Approach | Description | Pros | Cons | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **1. CSS Grid Spanning** | Use `grid-column` and `grid-row` CSS properties to make a single `<div>` span multiple grid cells. | - **Native to current system.**<br>- Elegant and declarative.<br>- Excellent performance.<br>- CSS handles clipping at grid edges. | - Can be complex to manage z-index for player-behind effects.<br>- Requires careful calculation of grid start positions. | **Primary Choice.** The most idiomatic and maintainable solution for the visual layer. |
| **2. Absolute Positioning** | Render the base grid, then render structures as absolutely positioned `<div>`s on top of the grid container. | - Decouples structures from the grid.<br>- Simple z-index control.<br>- Easy to implement player-behind effects with multiple layers. | - Requires manual calculation of `top`, `left`, `width`, `height` in pixels.<br>- Can feel disconnected from the grid logic. | **Secondary Choice.** Excellent for handling the "player-behind" effect in a hybrid approach. |
| **3. Canvas Rendering** | Replace the DOM-based grid with a `<canvas>` element and draw all tiles, structures, and entities manually. | - **Highest performance** for very large or complex scenes.<br>- Total control over rendering. | - Complete architectural shift away from React/DOM.<br>- Loses accessibility and ease of debugging with browser tools.<br>- Much more complex state management. | **Not Recommended.** A premature optimization that sacrifices the benefits of the current stack. |
| **4. SVG Composition** | Render the grid as an `<svg>` element, with structures being `<rect>` or `<image>` elements. | - Vector-based; scales perfectly.<br>- Good for complex, non-rectangular shapes. | - Emojis are text, not vectors; would require image assets.<br>- Overkill for a grid-based system.<br>- Less performant than CSS Grid for this use case. | **Not Recommended.** Adds unnecessary complexity for the stated requirements. |
| **5. Multiple Tiles with Shared State** | Each tile occupied by a structure is rendered individually, but with its `className` or style modified to hide borders and appear connected. | - Simple data model.<br>- Collision is handled at the tile level. | - **Cannot render one large emoji** across multiple cells.<br>- Visually unconvincing.<br>- Complex rendering logic to "stitch" tiles together. | **Not Recommended.** Fails the core requirement of visual coherence. |

#### **Recommendation:**

A **hybrid approach** is the most robust and elegant solution:

1.  **CSS Grid Spanning** for rendering the main visual of the structure.
2.  **Modifying the underlying `Tile` data** in the `GameMap` object to handle collision and interaction logic.
3.  **A separate, absolutely positioned layer** for elements that need to appear "in front" of the player when they walk behind a structure (e.g., roofs).

This approach leverages the best of both worlds: the simplicity of CSS Grid for layout and the explicit layering control of absolute positioning for complex interactions.

---

### 3. Data Structure Design

To support multi-tile structures, we will extend the map's JSON format and the corresponding in-game types.

#### 3.1. JSON Schema Extension

We will introduce a new object `type` in the `objectgroup` layer: `"type": "structure"`.

**File: `terminalTownWithStructures.json` (Example)**
```json
{
  "id": "terminalTownWithStructures",
  "name": "Terminal Town (with Structures)",
  "width": 20,
  "height": 15,
  "layers": [
    // ... base and collision layers ...
    {
      "name": "objects",
      "type": "objectgroup",
      "objects": [
        // ... existing NPCs, items, etc. ...
        {
          "id": "house_main_01",
          "type": "structure",
          "position": { "x": 5, "y": 5 }, // Anchor Point (top-left)
          "properties": {
            "structureId": "small_house",
            "size": { "width": 2, "height": 2 },
            "visual": "🏠",
            "collision": [ // Relative to anchor
              { "x": 0, "y": 1 },
              { "x": 1, "y": 1 }
            ],
            "interactionPoints": [ // Relative to anchor
              { "x": 0, "y": 1, "type": "door", "targetMapId": "house_01_interior", "targetPosition": {"x": 3, "y": 5} }
            ],
            "zLayerOffset": 1 // Optional: for structures that should appear behind others
          }
        },
        {
          "id": "castle_main_01",
          "type": "structure",
          "position": { "x": 10, "y": 8 }, // Anchor Point (top-left)
          "properties": {
            "structureId": "small_castle",
            "size": { "width": 3, "height": 3 },
            "visual": "🏰",
            "collision": [
              { "x": 0, "y": 2 },
              { "x": 1, "y": 2 },
              { "x": 2, "y": 2 }
            ],
            "interactionPoints": [
              { "x": 1, "y": 2, "type": "door", "targetMapId": "castle_interior" }
            ]
          }
        }
      ]
    }
  ]
}
```

**Key Properties:**

*   **`position`**: The **anchor point** of the structure, typically the top-left tile. All other coordinates are relative to this.
*   **`properties.size`**: An object `{ "width": number, "height": number }` defining the structure's footprint.
*   **`properties.visual`**: The single emoji or character to be displayed, which will be scaled to cover the entire footprint.
*   **`properties.collision`**: An array of relative coordinates `[{x, y}]` that are impassable. This allows for structures with walkable areas (e.g., archways, courtyards). If omitted, the entire footprint is considered non-walkable.
*   **`properties.interactionPoints`**: An array defining special tiles within the structure, like doors or signs. This keeps interactive logic separate from pure collision.

#### 3.2. In-Game Type Definitions (`global.types.ts`)

We need new interfaces to represent this data in the game state.

```typescript
// src/types/global.types.ts

// ... existing interfaces ...

export interface StructureInteractionPoint {
  relativePos: Position;
  type: 'door' | 'exit' | 'sign';
  properties: Record<string, any>; // e.g., { targetMapId: '...', text: '...' }
}

export interface Structure {
  id: string;
  structureId: string; // e.g., 'small_house'
  position: Position; // Anchor point (absolute map coordinates)
  size: {
    width: number;
    height: number;
  };
  visual: string; // The emoji/character to render
  collisionMap: Set<string>; // A Set of "x,y" relative coordinates for fast collision checks
  interactionPoints: StructureInteractionPoint[];
  zLayerOffset?: number;
}

// Modify the Tile interface
export interface Tile {
  walkable: boolean;
  type: TileType;
  occupyingEntityId?: string;
  /** NEW: ID of the structure occupying this tile, if any. */
  structureId?: string; 
}

// Modify the GameMap interface
export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: Tile[][];
  /** NEW: A dedicated list for structures. */
  structures: Structure[];
  entities: (Enemy | NPC | Item)[];
  exits: Exit[];
}
```

#### 3.3. Map Loader Update (`MapLoader.ts`)

The `processJsonMap` function must be updated to parse these new objects.

```typescript
// src/engine/MapLoader.ts -> inside processJsonMap()

// ... after initializing gameMap ...
gameMap.structures = []; // Initialize the new array

// ... inside the object processing loop ...
for (const obj of objects) {
  const { x, y } = obj.position;
  switch (obj.type) {
    // ... cases for npc, enemy, item ...
    
    case 'structure':
      const jsonStructure = obj as any; // Cast for simplicity, use proper types in production
      const props = jsonStructure.properties;
      
      // 1. Create the Structure object
      const newStructure: Structure = {
        id: jsonStructure.id,
        structureId: props.structureId,
        position: jsonStructure.position,
        size: props.size,
        visual: props.visual,
        // Convert collision array to a fast-lookup Set
        collisionMap: new Set((props.collision || []).map((p: Position) => `${p.x},${p.y}`)),
        interactionPoints: (props.interactionPoints || []).map((ip: any) => ({
            relativePos: { x: ip.x, y: ip.y },
            type: ip.type,
            properties: { ...ip } // Store all properties like targetMapId etc.
        })),
        zLayerOffset: props.zLayerOffset || 0,
      };
      gameMap.structures.push(newStructure);

      // 2. Update the underlying grid tiles
      for (let sy = 0; sy < newStructure.size.height; sy++) {
        for (let sx = 0; sx < new 'newStructure.size.width; sx++) {
          const tileX = newStructure.position.x + sx;
          const tileY = newStructure.position.y + sy;
          
          if (gameMap.tiles[tileY]?.[tileX]) {
            const tile = gameMap.tiles[tileY][tileX];
            tile.structureId = newStructure.id;
            
            // If a collision array is defined, use it. Otherwise, all tiles are non-walkable.
            if (props.collision) {
              if (newStructure.collisionMap.has(`${sx},${sy}`)) {
                tile.walkable = false;
              }
            } else {
              tile.walkable = false;
            }
          }
        }
      }
      break;

    // ... other cases ...
  }
}
```

---

### 4. Rendering Strategy & Edge Case Solutions

The rendering logic in `MapGrid.tsx` will be updated to handle structures.

#### 4.1. Core Rendering (`MapGrid.tsx`)

We will render structures in a separate pass after the base tiles but before entities.

```tsx
// src/components/GameBoard/MapGrid.tsx

// ... inside MapGrid component ...

// 1. Render base tiles as before (gridCells array)

// 2. Filter and render structures
const structureElements = currentMap.structures
  .filter(structure => {
    // Simple culling: check if any part of the structure is in the viewport
    const { x, y } = structure.position;
    const { width, height } = structure.size;
    return (
      x < startX + display_width && x + width > startX &&
      y < startY + display_height && y + height > startY
    );
  })
  .map(structure => {
    const gridX = structure.position.x - startX + 1;
    const gridY = structure.position.y - startY + 1;

    // Player-behind check (see section 4.2)
    const isPlayerBehind = playerPos.y > structure.position.y &&
                           playerPos.x >= structure.position.x &&
                           playerPos.x < structure.position.x + structure.size.width;
    
    const zIndex = 10 + (structure.position.y * 10) + (structure.zLayerOffset || 0);

    return (
      <div
        key={structure.id}
        className={styles.structureCell}
        style={{
          gridColumnStart: gridX,
          gridRowStart: gridY,
          gridColumnEnd: `span ${structure.size.width}`,
          gridRowEnd: `span ${structure.size.height}`,
          fontSize: `${structure.size.height * 1.5}rem`, // Scale emoji size
          zIndex: isPlayerBehind ? 9 : zIndex, // Render behind player if they are "behind" it
        }}
      >
        {structure.visual}
      </div>
    );
  });

// 3. Render everything in order
return (
  <div className={styles.mapGridContainer} style={...}>
    {gridCells}
    {structureElements}
    {/* Entity rendering logic would go here, ensuring they are on top */}
  </div>
);
```

**New CSS:**
```css
/* src/components/GameBoard/GameBoard.module.css */
.structureCell {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0.8; /* Adjust for better emoji centering */
  pointer-events: none; /* Structures themselves are not clickable */
  overflow: hidden;
  /* Ensure it doesn't push grid layout */
  width: 100%;
  height: 100%;
}
```

#### 4.2. Edge Case: Player Walking Behind Structures

The classic 2.5D problem. Our goal is for the player to appear *in front* of a house when their Y-coordinate is less than the house's, and *behind* it when their Y is greater.

The `z-index` logic shown above is a simple approach. A more robust solution involves splitting rendering into layers.

**Advanced "Player Behind" Rendering:**

The `getCellContent` function needs to be refactored. Instead of one big function, we can have a render loop that explicitly handles layers.

```tsx
// Simplified render logic inside MapGrid.tsx
const renderOrder = [];

// 1. Add all tiles
// ... loop and push tile divs to renderOrder

// 2. Add structures
// ... loop and push structure divs to renderOrder

// 3. Add entities (Player, NPCs, etc.)
// ... loop and push entity divs to renderOrder

// 4. Sort by Y-coordinate and layer type
renderOrder.sort((a, b) => {
  const yA = a.props['data-map-y'];
  const yB = b.props['data-map-y'];
  if (yA !== yB) return yA - yB;

  // If on same row, define render order (tiles -> structures -> entities)
  const layerOrder = { 'tile': 1, 'structure': 2, 'entity': 3 };
  const layerA = layerOrder[a.props['data-layer-type']];
  const layerB = layerOrder[b.props['data-layer-type']];
  return layerA - layerB;
});

// 5. Render the sorted array
return <div ...>{renderOrder}</div>;
```
This "painter's algorithm" approach correctly sorts all elements by their Y-coordinate, naturally handling the behind/front effect for all entities and structures. Each rendered element would need a `data-map-y` and `data-layer-type` prop. Structures would use their anchor `y`.

#### 4.3. Other Edge Cases

*   **Map Boundaries:** CSS Grid spanning handles this gracefully. A structure partially off-screen will be correctly clipped by the grid container.
*   **Partial Visibility (Fog of War):** The rendering filter should check if the structure's anchor tile `(x,y)` is in the player's `exploredMaps` set. If so, render it. This is a simple but effective rule.
*   **Save/Load Persistence:** Structures are part of the static map data, so they don't need to be saved in the game state. Any state changes related to them (e.g., an unlocked door) should be stored as a boolean flag in `gameState.gameFlags` (e.g., `gameFlags['house_01_door_unlocked'] = true`).

---

### 5. Visual Examples (ASCII Mockups)

These diagrams illustrate the data structure concepts.

#### Example 1: 2x2 House

*   **Anchor:** (5, 5)
*   **Size:** 2x2
*   **Visual:** 🏠
*   **Collision:** Bottom row
*   **Interaction:** Door on the bottom-left tile

```
      (x) 5    6
(y)
 5      A──────────┐
        │          │
        │    🏠    │
 6      C────E─────┘

A = Anchor Point (5, 5)
C = Collision Point (relative 0,1 -> absolute 5,6)
E = Entrance/Interaction Point (relative 0,1 -> absolute 5,6)
- = Structure Boundary
```

#### Example 2: 3x3 Castle with Anchor Point Variations

**Strategy A: Top-Left Anchor (Recommended)**
*   **Anchor:** (10, 8)
*   **Size:** 3x3
*   **Collision:** Bottom row + side pillars
*   **Interaction:** Central door

```
      (x) 10   11   12
(y)
 8      A──────────────┐
        │              │
 9      │      🏰      │
        │              │
 10     C──────E──────C┘

A = Anchor (10, 8)
C = Collision (10,10), (12,10)
E = Entrance (11,10)
```

**Strategy B: Center Anchor (More complex)**
*   This would require more complex logic to calculate the top-left corner for rendering. The Top-Left anchor convention is simpler and more standard.

---

### 6. Conclusion and Final Recommendation

The proposed hybrid system, utilizing **CSS Grid Spanning for visuals** and an **updated data model for logic**, is the ideal path forward.

**Implementation Steps:**

1.  **Update `global.types.ts`:** Add the `Structure` interface and modify `Tile` and `GameMap`.
2.  **Update `MapLoader.ts`:** Implement the parsing logic for `"type": "structure"` in `processJsonMap`.
3.  **Create/Update Map JSON:** Add structure objects to one of your map files for testing.
4.  **Refactor `MapGrid.tsx`:**
    *   Implement the new rendering pass for `map.structures`.
    *   Use CSS Grid spanning properties (`gridColumnStart`, etc.) to position and size the structures.
    *   Implement the Y-coordinate sorting ("Painter's Algorithm") for robust z-index handling of all on-screen elements.
5.  **Update Collision Logic:** Ensure your movement/pathfinding logic correctly reads the `walkable` property of the `Tile` objects, which are now modified by structures during map loading.

This design provides a scalable, maintainable, and visually appealing solution for multi-tile structures that integrates seamlessly into your existing, well-structured codebase.