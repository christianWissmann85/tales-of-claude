// src/components/GameBoard/MapGrid.tsx

import React from 'react';
import { Position, TileType, GameMap, Enemy, NPC, Item as IItem } from '../../types/global.types';
import styles from './GameBoard.module.css';

// Map tile types to their visual representation (emoji)
const emojiTileMap: Record<TileType, string> = {
  grass: '🌿',
  tree: '🌲',
  wall: '🧱',
  water: '🌊',
  door: '🚪',
  exit: '➡️',
  shop: '🏪',
  healer: '🏥',
  walkable: ' ',
  path: '👣',
  path_one: '1️⃣',
  path_zero: '0️⃣',
  floor: '⬜',
  dungeon_floor: '⬛',
  locked_door: '🔒',
  hidden_area: '✨',
  tech_floor: '⚡',
  metal_floor: '⚙️',
};

// Map tile types to their visual representation (ASCII)
const asciiTileMap: Record<TileType, string> = {
  grass: '.',
  tree: 'T',
  wall: '#',
  water: '~',
  door: 'D',
  exit: 'E',
  shop: 'S',
  healer: 'H',
  walkable: ' ',
  path: '.',
  path_one: '1',
  path_zero: '0',
  floor: '.',
  dungeon_floor: '.',
  locked_door: 'L',
  hidden_area: '*',
  tech_floor: '=',
  metal_floor: 'M',
};

// Define tile variants for a richer visual experience (emoji only)
const tileVariants: Record<TileType, string[]> = {
  grass: ['🌿', '🌱', '🌾', '🍃'],
  tree: ['🌲', '🌳', '🌴', '🎋'],
  wall: ['🧱', '🪨', '🗿'],
  water: ['🌊', '💧', '💦'],
  floor: ['⬜', '▫️', '◽'],
  dungeon_floor: ['⬛', '▪️', '◾'],
  path: ['👣', '🐾'],
} as Record<TileType, string[]>;

/**
 * Deterministically selects a tile variant based on its coordinates.
 * This ensures that a specific tile (x,y) always renders the same variant,
 * preventing flickering or random changes on re-render.
 */
const getTileVariant = (type: TileType, x: number, y: number): string => {
  const variants = tileVariants[type];
  if (variants && variants.length > 0) {
    // Use a simple hash function for deterministic selection
    // Prime numbers (31, 17) help distribute the hash evenly
    const hash = (x * 31 + y * 17) % variants.length;
    return variants[hash];
  }
  // Fallback to the default emojiTileMap emoji if no variants are defined
  return emojiTileMap[type] || '?';
};

// Map entity types to their visual representation (emoji)
const emojiEntityMap = {
  player: '🤖',
  npc: '🧙',
  enemy: '👾',
  item: '💾',
};

// Map entity types to their visual representation (ASCII)
const asciiEntityMap = {
  player: '@',
  npc: 'N',
  enemy: 'X',
  item: 'I',
};

interface MapGridProps {
  currentMap: GameMap;
  playerPos: Position;
  enemies: Enemy[];
  npcs: NPC[];
  items: IItem[];
  display_width: number;
  display_height: number;
  isAsciiMode: boolean;
}

const MapGrid: React.FC<MapGridProps> = ({
  currentMap,
  playerPos,
  enemies,
  npcs,
  items,
  display_width,
  display_height,
  isAsciiMode,
}) => {
  /**
   * Determines the character (emoji/ASCII) to render at a specific grid position.
   * Prioritizes entities over map tiles.
   */
  const getCellContent = (x: number, y: number): string => {
    const currentTileMap = isAsciiMode ? asciiTileMap : emojiTileMap;
    const currentEntityMap = isAsciiMode ? asciiEntityMap : emojiEntityMap;

    // 1. Check for Player at this position
    if (playerPos.x === x && playerPos.y === y) {
      return currentEntityMap.player;
    }

    // 2. Check for NPCs at this position
    const npcAtPos = npcs.find(npc => npc.position.x === x && npc.position.y === y);
    if (npcAtPos) {
      if (isAsciiMode) {
        // Specific ASCII characters for key NPCs
        if (npcAtPos.role === 'compiler_cat') return 'C';
        if (npcAtPos.role === 'debugger') return 'W';
        return currentEntityMap.npc;
      } else {
        // Specific emoji based on NPC role
        if (npcAtPos.role === 'compiler_cat') return '🐱';
        if (npcAtPos.role === 'debugger') return '🧙';
        return currentEntityMap.npc;
      }
    }

    // 3. Check for Enemies at this position
    const enemyAtPos = enemies.find(enemy => enemy.position.x === x && enemy.position.y === y);
    if (enemyAtPos) {
      return currentEntityMap.enemy;
    }

    // 4. Check for Items at this position
    const itemAtPos = items.find((item: IItem) => item.position && item.position.x === x && item.position.y === y);
    if (itemAtPos) {
      return currentEntityMap.item;
    }

    // 5. If no entity is found, render the underlying map tile
    const tile = currentMap.tiles[y]?.[x];
    if (!tile) {
      return ' ';
    }

    // Use getTileVariant for emoji mode, otherwise use direct ASCII mapping
    return isAsciiMode ? currentTileMap[tile.type] : getTileVariant(tile.type, x, y);
  };

  // Calculate camera offset for centering the player
  const mapWidth = currentMap.width;
  const mapHeight = currentMap.height;

  let startX = 0;
  let startY = 0;

  // Calculate horizontal offset
  if (mapWidth > display_width) {
    startX = playerPos.x - Math.floor(display_width / 2);
    startX = Math.max(0, startX);
    startX = Math.min(mapWidth - display_width, startX);
  }

  // Calculate vertical offset
  if (mapHeight > display_height) {
    startY = playerPos.y - Math.floor(display_height / 2);
    startY = Math.max(0, startY);
    startY = Math.min(mapHeight - display_height, startY);
  }

  // Generate grid cells for rendering
  const gridCells = [];
  for (let y = 0; y < display_height; y++) {
    for (let x = 0; x < display_width; x++) {
      const mapX = startX + x;
      const mapY = startY + y;
      const content = getCellContent(mapX, mapY);

      gridCells.push(
        <div
          key={`${mapX}-${mapY}`}
          className={styles.gridCell}
          data-map-x={mapX}
          data-map-y={mapY}
        >
          {content}
        </div>,
      );
    }
  }

  return (
    <div
      className={styles.mapGridContainer}
      style={{
        gridTemplateColumns: `repeat(${display_width}, 1fr)`,
        gridTemplateRows: `repeat(${display_height}, 1fr)`,
      }}
    >
      {gridCells}
    </div>
  );
};

export default React.memo(MapGrid);