// src/components/GameBoard/MapGrid.tsx

import React from 'react';
import { Position, TileType, GameMap, Enemy, NPC, Item as IItem } from '../../types/global.types';
import styles from './GameBoard.module.css';

// Map tile types to their visual representation (emoji)
// VISUAL HIERARCHY: Floors recede, walls are bold, NPCs/items stand out
const emojiTileMap: Record<TileType, string> = {
  // FLOORS - Subtle patterns that recede visually (these will now be background colors)
  floor: '░',           // Light shade - subtle texture instead of bold ⬜
  dungeon_floor: '▒',   // Medium shade - darker but still subtle instead of ⬛
  grass: '､',           // Ideographic comma - very subtle grass marker
  walkable: ' ',        // Empty space for generic walkable
  path: '⋅',            // Dot operator - subtle path marker instead of 👣
  path_one: '∙',        // Bullet operator - subtle variant
  path_zero: '·',       // Middle dot - another subtle variant
  tech_floor: '⚙',      // Gear without variant selector - less bold than ⚡
  metal_floor: '◌',     // Dotted circle - industrial but subtle
  
  // WALLS - Bold and obvious barriers
  wall: '🧱',           // Brick - perfect as is
  tree: '🌲',           // Evergreen - clear obstacle
  water: '🌊',          // Wave - clear liquid barrier
  locked_door: '🔒',    // Lock - immediately conveys "blocked"
  
  // INTERACTIVE - Stand out but not character-like
  door: '🚪',           // Door - clear interactive element
  exit: '➡️',           // Arrow - directional/interactive
  shop: '🏪',           // Store - clear location
  healer: '🏥',         // Hospital - clear location
  hidden_area: '❓',    // Question mark - mystery to discover
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

// NEW: Map floor tile types to their background colors
// REDUCED OPACITY to 25% (0.25 alpha) for better visual hierarchy
const floorColorMap: Record<TileType, string> = {
  grass: 'rgba(56, 102, 56, 0.25)',        // Green at 25% opacity
  floor: 'rgba(85, 85, 85, 0.25)',        // Gray at 25% opacity
  dungeon_floor: 'rgba(58, 58, 58, 0.25)', // Dark gray at 25% opacity
  path: 'rgba(90, 74, 58, 0.25)',         // Brown at 25% opacity
  path_one: 'rgba(90, 74, 58, 0.25)',     // Same as path
  path_zero: 'rgba(90, 74, 58, 0.25)',    // Same as path
  tech_floor: 'rgba(42, 74, 106, 0.25)',  // Blue at 25% opacity
  metal_floor: 'rgba(74, 74, 90, 0.25)',  // Metallic gray at 25% opacity
  walkable: 'transparent',                  // Transparent for generic walkable
  // Non-floor tiles - no background color
  wall: 'transparent',
  door: 'transparent',
  water: 'transparent',
  tree: 'transparent',
  exit: 'transparent',
  shop: 'transparent',
  healer: 'transparent',
  locked_door: 'transparent',
  hidden_area: 'transparent',
};

// Define tile variants for a richer visual experience (emoji only)
// VISUAL HIERARCHY: Maintain subtlety for floors, variety for walls
const tileVariants: Record<TileType, string[]> = {
  // FLOOR VARIANTS - All subtle (these will now be background colors)
  floor: ['░', '⠂', '⋅', '∘'],              // Various light patterns
  dungeon_floor: ['▒', '▓', '⠿', '∷'],       // Darker but still subtle
  grass: ['､', '｡', '·', '⸪'],              // Tiny grass markers
  path: ['⋅', '∙', '·', '‥'],               // Subtle path variations
  tech_floor: ['⚙', '◯', '◉', '◎'],         // Tech patterns
  metal_floor: ['◌', '○', '●', '◐'],         // Metal patterns
  
  // WALL VARIANTS - Can be bold
  wall: ['🧱', '🪨', '🗿'],                  // Stone variations
  tree: ['🌲', '🌳', '🌴', '🎋'],            // Tree variations
  water: ['🌊', '💧', '💦'],                  // Water variations
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
// ENTITIES: Must stand out clearly from subtle floor tiles
const emojiEntityMap = {
  player: '🤖',      // Robot Claude - unique and unmissable
  npc: '🧙',         // Wizard - clearly a character
  enemy: '👾',       // Alien - obviously hostile
  item: '✨',        // Sparkles - shows it's special/pickupable
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
    // Validate coordinates first
    if (isNaN(x) || isNaN(y) || x < 0 || y < 0) {
      return ' ';
    }
    
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
      // Add sparkle effect to items to make them stand out
      if (!isAsciiMode) {
        // Different item types can have different sparkle effects
        if (itemAtPos.type === 'equipment') return '⚔️✨';
        if (itemAtPos.type === 'consumable') return '🧪✨';
        if (itemAtPos.type === 'key') return '🗝️✨';
        return '✨';  // Default sparkle for other items
      }
      return currentEntityMap.item;
    }

    // 5. If no entity is found, render the underlying map tile
    const tile = currentMap.tiles[y]?.[x];
    if (!tile) {
      return ' ';
    }

    // Check if this is a floor tile that should be rendered as a background color
    const floorTypes = new Set([
      'floor', 'dungeon_floor', 'grass', 'walkable', 'path',
      'path_one', 'path_zero', 'tech_floor', 'metal_floor'
    ]);
    
    // In emoji mode, floor tiles should return empty string to allow background color rendering
    if (!isAsciiMode && floorTypes.has(tile.type)) {
      return ''; // Empty content for floor tiles - background color will be applied
    }

    // Use getTileVariant for emoji mode, otherwise use direct ASCII mapping
    return isAsciiMode ? currentTileMap[tile.type] : getTileVariant(tile.type, x, y);
  };

  // Calculate camera offset for centering the player
  const mapWidth = currentMap.width || 0;
  const mapHeight = currentMap.height || 0;

  // Validate player position to prevent NaN in calculations
  const safePlayerX = (!isNaN(playerPos.x) && playerPos.x >= 0) ? playerPos.x : 0;
  const safePlayerY = (!isNaN(playerPos.y) && playerPos.y >= 0) ? playerPos.y : 0;

  let startX = 0;
  let startY = 0;

  // Calculate horizontal offset
  if (mapWidth > display_width) {
    startX = safePlayerX - Math.floor(display_width / 2);
    startX = Math.max(0, startX);
    startX = Math.min(mapWidth - display_width, startX);
  }

  // Calculate vertical offset
  if (mapHeight > display_height) {
    startY = safePlayerY - Math.floor(display_height / 2);
    startY = Math.max(0, startY);
    startY = Math.min(mapHeight - display_height, startY);
  }
  
  // Final validation of start positions
  startX = isNaN(startX) ? 0 : startX;
  startY = isNaN(startY) ? 0 : startY;

  // Generate grid cells for rendering
  const gridCells = [];
  for (let y = 0; y < display_height; y++) {
    for (let x = 0; x < display_width; x++) {
      const mapX = startX + x;
      const mapY = startY + y;
      
      // Validate coordinates to prevent NaN keys
      if (isNaN(mapX) || isNaN(mapY) || mapX < 0 || mapY < 0 || 
          mapX >= mapWidth || mapY >= mapHeight) {
        // Skip invalid tiles - use empty cell with fallback key
        gridCells.push(
          <div
            key={`empty-${y}-${x}`}
            className={styles.gridCell}
            style={{}}
          >
            {' '}
          </div>
        );
        continue;
      }
      
      // Get the default content (entity or tile emoji/ASCII)
      const cellContent = getCellContent(mapX, mapY);
      let cellStyle: React.CSSProperties = {}; // Initialize empty style object for inline styles
      
      // Check if this is the player position for special styling
      const isPlayerCell = playerPos.x === mapX && playerPos.y === mapY;
      
      // Check if this is an enemy position
      const enemyAtPos = enemies.find(e => e.position.x === mapX && e.position.y === mapY);
      const isEnemyCell = !!enemyAtPos;
      
      // Check if this is an NPC position
      const npcAtPos = npcs.find(n => n.position.x === mapX && n.position.y === mapY);
      const isNpcCell = !!npcAtPos;

      // Check if we need to apply a background color for floor tiles
      const tile = currentMap.tiles[mapY]?.[mapX];
      if (tile && !isAsciiMode) {
        const floorTypes = new Set([
          'floor', 'dungeon_floor', 'grass', 'walkable', 'path',
          'path_one', 'path_zero', 'tech_floor', 'metal_floor'
        ]);
        
        // Apply background color for floor tiles
        if (floorTypes.has(tile.type)) {
          const color = floorColorMap[tile.type];
          if (color && color !== 'transparent') {
            cellStyle.backgroundColor = color;
          }
        }
      }

      // Safety check for valid coordinates for the key
      const safeKey = (!isNaN(mapX) && !isNaN(mapY) && tile) 
        ? `${mapX}-${mapY}` 
        : `cell-${y}-${x}`; // Use display coordinates as fallback
      
      // Build class name with entity-specific classes
      let cellClassName = styles.gridCell;
      if (isPlayerCell) cellClassName += ` ${styles.playerCell}`;
      if (isEnemyCell) cellClassName += ` ${styles.enemyCell}`;
      if (isNpcCell) cellClassName += ` ${styles.npcCell}`;
      
      gridCells.push(
        <div
          key={safeKey}
          className={cellClassName}
          style={cellStyle}
          {...(!isNaN(mapX) && { 'data-map-x': mapX })}
          {...(!isNaN(mapY) && { 'data-map-y': mapY })}
          {...(isPlayerCell && { 'data-entity-type': 'player' })}
          {...(isEnemyCell && { 'data-entity-type': 'enemy' })}
          {...(isNpcCell && { 'data-entity-type': 'npc' })}
        >
          {cellContent}
        </div>,
      );
    }
  }

  // Generate structure cells for multi-tile structures
  const structureCells = [];
  if (currentMap.structures && !isAsciiMode) {
    for (const structure of currentMap.structures) {
      // Check if structure is within viewport
      const structEndX = structure.position.x + structure.size.width - 1;
      const structEndY = structure.position.y + structure.size.height - 1;
      
      // Skip if completely outside viewport
      if (structEndX < startX || structure.position.x >= startX + display_width ||
          structEndY < startY || structure.position.y >= startY + display_height) {
        continue;
      }
      
      // Calculate grid position for structure
      const gridX = structure.position.x - startX + 1; // CSS Grid is 1-indexed
      const gridY = structure.position.y - startY + 1;
      
      // Determine z-index based on Y position
      // Structures further down (higher Y) appear in front
      let zIndex = 10 + (structure.position.y * 10);
      
      // If player is below the structure, increase z-index so structure appears in front
      if (playerPos.y > structure.position.y + structure.size.height - 1) {
        zIndex += 100;
      }
      
      structureCells.push(
        <div
          key={`structure-${structure.id}`}
          className={styles.structure}
          style={{
            gridColumnStart: gridX,
            gridRowStart: gridY,
            gridColumnEnd: `span ${structure.size.width}`,
            gridRowEnd: `span ${structure.size.height}`,
            fontSize: `${structure.size.height * 1.5}rem`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: structure.zIndex || zIndex,
            pointerEvents: 'none', // Prevent blocking clicks on underlying tiles
          }}
        >
          {structure.visual}
        </div>
      );
    }
  }

  return (
    <div className={styles.mapContainer}>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${display_width}, var(--cell-size))`,
          gridTemplateRows: `repeat(${display_height}, var(--cell-size))`,
          position: 'relative', // Ensure proper stacking context
        }}
      >
        {gridCells}
        {structureCells}
      </div>
    </div>
  );
};

export default React.memo(MapGrid);