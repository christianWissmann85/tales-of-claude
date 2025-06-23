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
  const [fastTravelOptions, setFastTravelOptions] = useState<Array<{ mapId: string; position: Position; name: string }>>([]);

  // Toggle scale between 1x and 2x
  const toggleScale = useCallback(() => {
    setScale(prev => (prev === 1 ? 2 : 1));
  }, []);

  // Calculate the view bounds based on player position
  const viewBounds = useMemo(() => {
    const startX = Math.max(0, player.position.x - HALF_VIEW_SIZE);
    const startY = Math.max(0, player.position.y - HALF_VIEW_SIZE);
    const endX = Math.min(currentMap.width - 1, startX + MINIMAP_VIEW_SIZE - 1);
    const endY = Math.min(currentMap.height - 1, startY + MINIMAP_VIEW_SIZE - 1);

    // Adjust start if we hit the map edge
    const adjustedStartX = endX - MINIMAP_VIEW_SIZE + 1 < 0 ? 0 : endX - MINIMAP_VIEW_SIZE + 1;
    const adjustedStartY = endY - MINIMAP_VIEW_SIZE + 1 < 0 ? 0 : endY - MINIMAP_VIEW_SIZE + 1;

    return {
      startX: Math.max(0, adjustedStartX),
      startY: Math.max(0, adjustedStartY),
      endX,
      endY,
    };
  }, [player.position, currentMap.width, currentMap.height]);

  // Create a map of NPC positions for quick lookup
  const npcPositionMap = useMemo(() => {
    const map = new Map<string, NPC>();
    npcs.forEach(npc => {
      const key = `${npc.position.x},${npc.position.y}`;
      map.set(key, npc);
    });
    return map;
  }, [npcs]);

  // Create a map of exit positions
  const exitPositionMap = useMemo(() => {
    const map = new Map<string, Exit>();
    currentMap.exits.forEach(exit => {
      const key = `${exit.position.x},${exit.position.y}`;
      map.set(key, exit);
    });
    return map;
  }, [currentMap.exits]);

  // Check if a tile is explored
  const isTileExplored = useCallback((x: number, y: number): boolean => {
    if (!player.exploredMaps) return false;
    const exploredTiles = player.exploredMaps.get(currentMap.id);
    if (!exploredTiles) return false;
    return exploredTiles.has(`${x},${y}`);
  }, [player.exploredMaps, currentMap.id]);

  // Check if a tile is a fast travel point
  const isFastTravelPoint = useCallback((x: number, y: number): boolean => {
    const tile = currentMap.tiles[y]?.[x];
    if (!tile) return false;
    return tile.type === 'shop' || tile.type === 'healer' || tile.type === 'exit';
  }, [currentMap.tiles]);

  // Handle tile click for fast travel
  const handleTileClick = useCallback((x: number, y: number) => {
    if (!isTileExplored(x, y) || !isFastTravelPoint(x, y)) return;

    const options: Array<{ mapId: string; position: Position; name: string }> = [];

    // Check if it's an exit
    const exitKey = `${x},${y}`;
    const exit = exitPositionMap.get(exitKey);
    if (exit) {
      options.push({
        mapId: exit.targetMapId,
        position: exit.targetPosition,
        name: `Travel to ${exit.targetMapId}`,
      });
    }

    // For shops and healers, add current location as fast travel point
    const tile = currentMap.tiles[y][x];
    if (tile.type === 'shop' || tile.type === 'healer') {
      options.push({
        mapId: currentMap.id,
        position: { x, y },
        name: `${tile.type === 'shop' ? 'Shop' : 'Healer'} at (${x}, ${y})`,
      });
    }

    if (options.length > 0) {
      setFastTravelOptions(options);
      setShowFastTravelModal(true);
    }
  }, [isTileExplored, isFastTravelPoint, currentMap, exitPositionMap]);

  // Handle fast travel selection
  const handleFastTravelSelect = useCallback((mapId: string, position: Position) => {
    setShowFastTravelModal(false);
    onFastTravel(mapId, position);
  }, [onFastTravel]);

  // Get marker for a tile position
  const getTileMarker = useCallback((x: number, y: number): string | null => {
    // Check for NPCs
    const npcKey = `${x},${y}`;
    const npc = npcPositionMap.get(npcKey);
    if (npc) {
      if (npc.role === 'compiler_cat') return MARKER_SYMBOLS.compiler_cat;
      if (npc.role === 'quest_giver') return MARKER_SYMBOLS.quest_npc;
      if (npc.role === 'merchant') return MARKER_SYMBOLS.shop;
      return MARKER_SYMBOLS.important_npc;
    }

    // Check for exits
    if (exitPositionMap.has(npcKey)) return MARKER_SYMBOLS.map_transition;

    // Check for tile-based markers
    const tile = currentMap.tiles[y]?.[x];
    if (!tile) return null;

    if (tile.type === 'shop') return MARKER_SYMBOLS.shop;
    if (tile.type === 'healer') return MARKER_SYMBOLS.healer;
    if (tile.type === 'hidden_area' && isTileExplored(x, y)) return MARKER_SYMBOLS.hidden_area;

    return null;
  }, [npcPositionMap, exitPositionMap, currentMap.tiles, isTileExplored]);

  // Render the minimap grid
  const renderGrid = () => {
    const grid = [];
    
    for (let y = viewBounds.startY; y <= viewBounds.endY; y++) {
      const row = [];
      for (let x = viewBounds.startX; x <= viewBounds.endX; x++) {
        const isPlayerPosition = x === player.position.x && y === player.position.y;
        const isExplored = isTileExplored(x, y);
        const tile = currentMap.tiles[y]?.[x];
        const tileColor = tile ? TILE_COLORS[tile.type] || '#000' : '#000';
        const marker = isExplored ? getTileMarker(x, y) : null;
        const canFastTravel = isExplored && isFastTravelPoint(x, y);

        row.push(
          <div
            key={`${x},${y}`}
            className={`${styles.tile} ${!isExplored ? styles.unexplored : ''} ${canFastTravel ? styles.fastTravelPoint : ''}`}
            style={{
              backgroundColor: isExplored ? tileColor : '#1a1a1a',
              width: `${12 * scale}px`,
              height: `${12 * scale}px`,
            }}
            onClick={() => handleTileClick(x, y)}
          >
            {isPlayerPosition && (
              <div className={styles.playerDot} />
            )}
            {marker && !isPlayerPosition && (
              <div className={styles.marker} style={{ fontSize: `${8 * scale}px` }}>
                {marker}
              </div>
            )}
          </div>
        );
      }
      grid.push(
        <div key={y} className={styles.row}>
          {row}
        </div>
      );
    }

    return grid;
  };

  return (
    <div className={styles.minimap}>
      <div className={styles.header}>
        <h3 className={styles.mapName}>{currentMap.name}</h3>
        <button className={styles.scaleButton} onClick={toggleScale}>
          {scale}x
        </button>
      </div>
      <div className={styles.grid}>
        {renderGrid()}
      </div>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendSymbol}>!</span> Quest
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendSymbol}>$</span> Shop
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendSymbol}>S</span> Save
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendSymbol}>→</span> Exit
        </div>
      </div>
      {showFastTravelModal && (
        <FastTravelModal
          options={fastTravelOptions}
          onSelect={handleFastTravelSelect}
          onClose={() => setShowFastTravelModal(false)}
        />
      )}
    </div>
  );
};

export default Minimap;