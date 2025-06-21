// src/components/GameBoard/GameBoard.tsx

import React, { useEffect, useRef, useCallback } from 'react';
import { useGameContext } from '../../context/GameContext';
import { useKeyboard } from '../../hooks/useKeyboard';
import { GameEngine } from '../../engine/GameEngine';
import { MovementSystem } from '../../engine/MovementSystem'; // Imported as requested, though GameEngine handles movement dispatch directly
import { Position, TileType, Enemy, NPC, Item } from '../../types/global.types';

import styles from './GameBoard.module.css';

// Define the display dimensions for the game board
const DISPLAY_WIDTH = 20;
const DISPLAY_HEIGHT = 15;

// Map tile types to their visual representation (emoji/ASCII)
const tileMap: Record<TileType, string> = {
  grass: '·',
  tree: '🌲',
  wall: '#',
  water: '~',
  door: '🚪',
  exit: '🚪', // Using door emoji for exits as well, as per TECH_SPEC.md
  shop: '🏪', // Placeholder for shop tiles
  healer: '🏥', // Placeholder for healer tiles
  walkable: ' ', // FIX: Added mapping for 'walkable' tile type
};

// Map entity types to their visual representation
const entityMap = {
  player: '🤖',
  npc: '🧙',
  enemy: '👾',
  item: '💾',
};

const GameBoard: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const { pressedKeys, getDirection } = useKeyboard(); // `getDirection` is no longer directly used for movement in this component
  const gameEngineRef = useRef<GameEngine | null>(null);

  // FIX: Initialize GameEngine instance only once on component mount.
  // The empty dependency array ensures this useEffect runs only on initial mount.
  // `dispatch` is stable, and the initial `state` is passed; subsequent state
  // updates are handled by the separate `useEffect` below.
  useEffect(() => {
    if (!gameEngineRef.current) {
      console.log("GameBoard: Initializing GameEngine...");
      gameEngineRef.current = new GameEngine(dispatch, state); // `dispatch` is stable, `state` is initial
      gameEngineRef.current.start();
      console.log("GameBoard: GameEngine started.");
    }

    // Cleanup: stop the engine when the component unmounts
    return () => {
      if (gameEngineRef.current) {
        console.log("GameBoard: Stopping GameEngine...");
        gameEngineRef.current.stop();
        gameEngineRef.current = null; // Clear the ref on unmount for robustness
        console.log("GameBoard: GameEngine stopped.");
      }
    };
  }, []); // FIX: Empty dependency array ensures this runs only once on mount

  // Update GameEngine's internal state whenever the GameContext state changes.
  // This keeps the engine's snapshot of the game state up-to-date for its logic,
  // without recreating the engine instance.
  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setGameState(state);
    }
  }, [state]); // Correctly depends only on `state`

  // Pass raw keyboard input (set of pressed keys) to the GameEngine.
  // The engine can then use this for its internal input processing loop.
  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.handleKeyboardInput(pressedKeys);
    }
  }, [pressedKeys]); // Only re-run if the Set of pressed keys changes

  /**
   * Determines the character (emoji/ASCII) to render at a specific grid position.
   * Prioritizes entities over map tiles.
   */
  const getCellContent = useCallback((x: number, y: number): string => {
    const { player, enemies, npcs, items, currentMap } = state;

    // 1. Check for Player at this position
    if (player.position.x === x && player.position.y === y) {
      return entityMap.player;
    }

    // 2. Check for NPCs at this position
    const npcAtPos = npcs.find(npc => npc.position.x === x && npc.position.y === y);
    if (npcAtPos) {
      return entityMap.npc;
    }

    // 3. Check for Enemies at this position
    const enemyAtPos = enemies.find(enemy => enemy.position.x === x && enemy.position.y === y);
    if (enemyAtPos) {
      return entityMap.enemy;
    }

    // 4. Check for Items at this position (only if they have a position on the map)
    const itemAtPos = items.find(item => item.position && item.position.x === x && item.position.y === y);
    if (itemAtPos) {
      return entityMap.item;
    }

    // 5. If no entity is found, render the underlying map tile
    const tile = currentMap.tiles[y]?.[x]; // Access tile safely
    return tile ? tileMap[tile.type] || '?' : ' '; // Fallback to '?' for unknown tile types or ' ' for out-of-bounds
  }, [state.player, state.enemies, state.npcs, state.items, state.currentMap]);

  // Calculate camera offset for centering the player if the map is larger than the display viewport.
  // Given the current `GameContext` initializes a 20x15 map, and `DISPLAY_WIDTH/HEIGHT` are 20x15,
  // this logic will result in `startX` and `startY` being 0, effectively showing the entire map.
  // It's included for future scalability if map sizes change.
  const mapWidth = state.currentMap.width;
  const mapHeight = state.currentMap.height;
  const playerX = state.player.position.x;
  const playerY = state.player.position.y;

  let startX = 0;
  let startY = 0;

  // Calculate horizontal offset
  if (mapWidth > DISPLAY_WIDTH) {
    startX = playerX - Math.floor(DISPLAY_WIDTH / 2);
    // Clamp startX to ensure it doesn't go out of map bounds
    startX = Math.max(0, startX);
    startX = Math.min(mapWidth - DISPLAY_WIDTH, startX);
  }

  // Calculate vertical offset
  if (mapHeight > DISPLAY_HEIGHT) {
    startY = playerY - Math.floor(DISPLAY_HEIGHT / 2);
    // Clamp startY to ensure it doesn't go out of map bounds
    startY = Math.max(0, startY);
    startY = Math.min(mapHeight - DISPLAY_HEIGHT, startY);
  }

  // Generate grid cells for rendering
  const gridCells = [];
  for (let y = 0; y < DISPLAY_HEIGHT; y++) {
    for (let x = 0; x < DISPLAY_WIDTH; x++) {
      // Calculate the actual map coordinates for the current display cell
      const mapX = startX + x;
      const mapY = startY + y;
      const content = getCellContent(mapX, mapY);

      gridCells.push(
        <div
          key={`${mapX}-${mapY}`} // Use map coordinates for unique key
          className={styles.gridCell}
          // Optional: Add data attributes for debugging or future styling
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
      className={styles.gameBoard}
      // Dynamically set CSS Grid template columns/rows based on display dimensions
      style={{
        gridTemplateColumns: `repeat(${DISPLAY_WIDTH}, 1fr)`,
        gridTemplateRows: `repeat(${DISPLAY_HEIGHT}, 1fr)`,
      }}
    >
      {gridCells}
      {/* Display FPS counter for debugging, if GameEngine is initialized */}
      {gameEngineRef.current && (
        <div className={styles.fpsCounter}>
          FPS: {gameEngineRef.current.fps}
        </div>
      )}
    </div>
  );
};

export default GameBoard;