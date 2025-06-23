
// src/components/Minimap/Minimap.tsx

import React, { useState, useCallback, useMemo } from 'react';
import styles from './Minimap.module.css';
import { Player, GameMap, TileType, Position, NPC, Exit } from '../../types/global.types';
import FastTravelModal from './FastTravelModal';

interface MinimapProps {
  player: Player;
  currentMap: GameMap;
  npcs: NPC[]; // Pass NPCs to mark quest givers, save points etc.
  onFastTravel: (mapId: string, position: Position) => void;
}

// Constants for minimap display
const MINIMAP_VIEW_SIZE = 15; // 15x15 tiles
const HALF_VIEW_SIZE = Math.floor(MINIMAP_VIEW_SIZE / 2);

// Tile type to color mapping
const TILE_COLORS: Record<TileType, string> = {
  grass: '#6B8E23', // Green
  path: '#6B8E23', // Green (same as grass for now)
  path_one: '#6B8E23', // Green
  path_zero: '#6B8E23', // Green
  tree: '#36454F', // Dark Gray
  wall: '#36454F', // Dark Gray
  water: '#4682B4', // Blue
  floor: '#D3D3D3', // Light Gray
  dungeon_floor: '#D3D3D3', // Light Gray
  walkable: '#D3D3D3', // Light Gray
  door: '#FFD700', // Yellow
  exit: '#FFD700', // Yellow
  shop: '#800080', // Purple
  healer: '#FF0000', // Red
  locked_door: '#FFA500', // Orange
  hidden_area: '#D3D3D3', // Light Gray (will be marked with star)
};

// POI marker symbols
const MARKER_SYMBOLS: Record<string, string> = {
  quest_npc: '!',
  shop: '$',
  important_npc: '?',
  compiler_cat: 'S',
  map_transition: '→',
  hidden_area: '★',
  healer: '+', // Using plus for healer
};

const Minimap: React.FC<MinimapProps> = ({ player, currentMap, npcs, onFastTravel }) => {
  const [scale, setScale] = useState<1 | 2>(1);
  const [showFastTravelModal, setShowFastTravelModal] = useState(false);
  const [fastTravelDestinations, setFastTravelDestinations] = useState<
    { mapId: string; position: Position; name: string; type: string }[]
  >([]);

  const toggleScale = useCallback(() => {
    setScale(prevScale => (prevScale === 1 ? 2 : 1));
  }, []);

  const isTileExplored = useCallback((x: number, y: number) => {
    return player.isTileExplored(currentMap.id, x, y);
  }, [player, currentMap.id]);

  const getPoiMarker = useCallback((x: number, y: number): string | null => {
    // Check for NPCs
    const npcAtPos = npcs.find(npc => npc.position.x === x && npc.position.y === y);
    if (npcAtPos) {
      if (npcAtPos.role === 'quest_giver') return MARKER_SYMBOLS.quest_npc;
      if (npcAtPos.role === 'compiler_cat') return MARKER_SYMBOLS.compiler_cat;
      if (npcAtPos.role === 'merchant') return MARKER_SYMBOLS.shop; // Merchant is also a shop marker
      if (npcAtPos.role === 'healer') return MARKER_SYMBOLS.healer; // Healer is also a healer marker
      // Default for other important NPCs
      if (['wizard', 'debugger', 'lost_program', 'tutorial', 'bard'].includes(npcAtPos.role)) {
        return MARKER_SYMBOLS.important_npc;
      }
    }

    // Check for map exits
    const exitAtPos = currentMap.exits.find(exit => exit.position.x === x && exit.position.y === y);
    if (exitAtPos) {
      return MARKER_SYMBOLS.map_transition;
    }

    // Check for hidden areas (only if explored)
    const tile = currentMap.tiles[y]?.[x];
    if (tile && tile.type === 'hidden_area' && isTileExplored(x, y)) {
      return MARKER_SYMBOLS.hidden_area;
    }

    return null;
  }, [npcs, currentMap.exits, currentMap.tiles, isTileExplored]);

  // Mock mapData for FastTravelModal to access map names
  // In a real app, this would be imported from a central data source or passed as a prop
  const mapData: Record<string, GameMap> = useMemo(() => ({
    'starting_area': { id: 'starting_area', name: 'The Root Directory', width: 20, height: 15, tiles: [], entities: [], exits: [] },
    'forest_path': { id: 'forest_path', name: 'The Binary Forest', width: 10, height: 10, tiles: [], entities: [], exits: [] },
  }), []);


  const handleTileClick = useCallback((x: number, y: number) => {
    if (!isTileExplored(x, y)) return; // Can only fast travel to explored tiles

    const tile = currentMap.tiles[y]?.[x];
    if (!tile) return;

    const destinations: { mapId: string; position: Position; name: string; type: string }[] = [];

    // Check if it's a shop tile
    if (tile.type === 'shop') {
      destinations.push({ mapId: currentMap.id, position: { x, y }, name: `${currentMap.name} Shop`, type: 'shop' });
    }
    // Check if it's a healer tile
    if (tile.type === 'healer') {
      destinations.push({ mapId: currentMap.id, position: { x, y }, name: `${currentMap.name} Healer`, type: 'healer' });
    }
    // Check if it's an exit tile
    const exit = currentMap.exits.find(e => e.position.x === x && e.position.y === y);
    if (exit) {
      // Only add if the target map's target position is also explored (or just the exit tile itself)
      // For simplicity, let's assume if the exit tile is explored, the destination is "known"
      destinations.push({ mapId: exit.targetMapId, position: exit.targetPosition, name: `${mapData[exit.targetMapId]?.name || 'Unknown Map'} Entrance`, type: 'exit' });
    }

    if (destinations.length > 0) {
      // Filter out duplicate destinations if a tile has multiple roles (e.g., shop and exit)
      const uniqueDestinations = Array.from(new Map(destinations.map(d => [`${d.mapId}-${d.position.x},${d.position.y}`, d])).values());
      setFastTravelDestinations(uniqueDestinations);
      setShowFastTravelModal(true);
    }
  }, [currentMap, isTileExplored, mapData]);

  // Calculate the visible window for the minimap
  const startX = Math.max(0, Math.min(currentMap.width - MINIMAP_VIEW_SIZE, player.position.x - HALF_VIEW_SIZE));
  const startY = Math.max(0, Math.min(currentMap.height - MINIMAP_VIEW_SIZE, player.position.y - HALF_VIEW_SIZE));

  const minimapCells = useMemo(() => {
    const cells = [];
    for (let y = 0; y < MINIMAP_VIEW_SIZE; y++) {
      for (let x = 0; x < MINIMAP_VIEW_SIZE; x++) {
        const mapX = startX + x;
        const mapY = startY + y;
        const isPlayerPos = player.position.x === mapX && player.position.y === mapY;
        const explored = isTileExplored(mapX, mapY);
        const tile = currentMap.tiles[mapY]?.[mapX];
        const tileType = tile?.type || 'wall'; // Default to wall if out of bounds or undefined
        const backgroundColor = explored ? TILE_COLORS[tileType] || '#36454F' : '#1a1a1a'; // Fog of war color

        const marker = explored ? getPoiMarker(mapX, mapY) : null;

        cells.push(
          <div
            key={`${mapX}-${mapY}`}
            className={styles.minimapCell}
            style={{
              backgroundColor: backgroundColor,
              width: `${100 / MINIMAP_VIEW_SIZE}%`,
              height: `${100 / MINIMAP_VIEW_SIZE}%`,
            }}
            onClick={() => handleTileClick(mapX, mapY)}
          >
            {isPlayerPos && <div className={styles.playerDot}></div>}
            {marker && <span className={styles.marker}>{marker}</span>}
          </div>
        );
      }
    }
    return cells;
  }, [player.position, currentMap.tiles, startX, startY, isTileExplored, getPoiMarker, handleTileClick]);

  return (
    <div className={styles.minimapContainer} style={{ transform: `scale(${scale})` }}>
      <div className={styles.minimapHeader}>
        <span className={styles.mapName}>{currentMap.name}</span>
        <button className={styles.scaleButton} onClick={toggleScale}>
          Scale {scale}x
        </button>
      </div>
      <div
        className={styles.minimapGrid}
        style={{
          gridTemplateColumns: `repeat(${MINIMAP_VIEW_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${MINIMAP_VIEW_SIZE}, 1fr)`,
        }}
      >
        {minimapCells}
      </div>

      {showFastTravelModal && (
        <FastTravelModal
          isOpen={showFastTravelModal}
          onClose={() => setShowFastTravelModal(false)}
          destinations={fastTravelDestinations}
          onSelectDestination={(mapId, position) => {
            onFastTravel(mapId, position);
            setShowFastTravelModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Minimap;


### **Step 5: Create `src/components/Minimap/Minimap.module.css`**

```css
/* src/components/Minimap/Minimap.module.css */

.minimapContainer {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 150px; /* Base width for 15x15 at 1x scale (10px per tile) */
  height: 170px; /* Height includes header (150px for grid + 20px for header) */
  background-color: rgba(0, 0, 0, 0.7); /* Semi-transparent background */
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  transform-origin: top right; /* For scaling */
  transition: transform 0.2s ease-out; /* Smooth scale animation */
  z-index: 100; /* Ensure it's above other game elements */
  font-family: 'Press Start 2P', cursive; /* Example pixel font */
  font-size: 8px; /* Base font size for markers */
  color: #eee;
}

.minimapHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 8px;
  border-bottom: 1px solid #333;
  background-color: rgba(0, 0, 0, 0.8);
}

.mapName {
  font-size: 10px;
  font-weight: bold;
  color: #fff;
}

.scaleButton {
  background-color: #555;
  color: #fff;
  border: none;
  padding: 3px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 8px;
  transition: background-color 0.2s ease;
}

.scaleButton:hover {
  background-color: #777;
}

.minimapGrid {
  flex-grow: 1;
  display: grid;
  /* Grid template columns/rows will be set dynamically by JS */
}

.minimapCell {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 0.5px solid rgba(255, 255, 255, 0.05); /* Subtle grid lines */
  box-sizing: border-box;
  cursor: pointer; /* Indicate clickable for fast travel */
}

.minimapCell:hover {
  filter: brightness(1.2); /* Highlight on hover */
}

.playerDot {
  width: 60%;
  height: 60%;
  background-color: #FFD700; /* Gold color for player */
  border-radius: 50%;
  animation: blink 1s step-end infinite; /* Blinking animation */
  position: absolute;
  z-index: 2; /* Above markers */
}

@keyframes blink {
  50% { opacity: 0; }
}

.marker {
  position: absolute;
  font-size: 10px; /* Larger for visibility */
  font-weight: bold;
  color: #fff; /* White for markers */
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.8); /* For contrast */
  z-index: 1; /* Below player dot */
}

/* Fast Travel Modal Styles */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}

.modalContent {
  background-color: #222;
  border: 1px solid #555;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.8);
  max-width: 400px;
  width: 90%;
  color: #eee;
  font-family: 'Press Start 2P', cursive;
  font-size: 12px;
  text-align: center;
}

.modalContent h3 {
  margin-top: 0;
  color: #fff;
  font-size: 16px;
  margin-bottom: 15px;
}

.destinationList {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.destinationItem {
  margin-bottom: 8px;
}

.destinationButton {
  background-color: #444;
  color: #fff;
  border: 1px solid #666;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-family: 'Press Start 2P', cursive;
  font-size: 10px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.destinationButton:hover {
  background-color: #666;
  border-color: #888;
}

.closeButton {
  background-color: #888;
  color: #fff;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-family: 'Press Start 2P', cursive;
  font-size: 12px;
  transition: background-color 0.2s ease;
}

.closeButton:hover {
  background-color: #aaa;
}


### **Step 6: Create `src/components/Minimap/FastTravelModal.tsx`**


// src/components/Minimap/FastTravelModal.tsx

import React from 'react';
import styles from './Minimap.module.css'; // Use same CSS module for consistency

interface FastTravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinations: { mapId: string; position: { x: number; y: number }; name: string; type: string }[];
  onSelectDestination: (mapId: string, position: { x: number; y: number }) => void;
}
