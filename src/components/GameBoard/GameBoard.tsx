// src/components/GameBoard/GameBoard.tsx

import React, { useEffect, useRef, useCallback } from 'react';
import { useGameContext } from '../../context/GameContext';
import { useKeyboard } from '../../hooks/useKeyboard';
import { GameEngine } from '../../engine/GameEngine';
import { MovementSystem } from '../../engine/MovementSystem'; // Imported as requested, though GameEngine handles movement dispatch directly
import { Position, TileType, Enemy, NPC, Item as IItem, CombatLogEntry } from '../../types/global.types';
import Inventory from '../Inventory/Inventory';
import { Inventory as InventoryModel } from '../../models/Inventory';
import { Player } from '../../models/Player';
import { Item as ItemClass } from '../../models/Item';
import QuestLog from '../QuestLog/QuestLog';
import CharacterScreen from '../CharacterScreen/CharacterScreen';
import { EquipmentSlotType } from '../../models/Player';
import { TalentTree } from '../../models/TalentTree';
import PlayerProgressBar from '../PlayerProgressBar/PlayerProgressBar';
import MiniCombatLog from '../MiniCombatLog/MiniCombatLog';
import { useNotification } from '../NotificationSystem/NotificationSystem';

import styles from './GameBoard.module.css';

// Define the display dimensions for the game board
const DISPLAY_WIDTH = 20;
const DISPLAY_HEIGHT = 15;

// Helper function to deep clone a Player instance
const clonePlayer = (player: Player): Player => {
  const newPlayer = new Player(player.id, player.name, { ...player.position });
  newPlayer.statusEffects = player.statusEffects.map(se => ({ ...se }));
  newPlayer.updateBaseStats(player.getBaseStats());
  newPlayer.inventory = player.inventory.map(item => ({
    ...item,
    position: item.position ? { ...item.position } : undefined,
  }));
  newPlayer.abilities = player.abilities.map(ability => ({ ...ability }));
  if (player.weaponSlot) newPlayer.weaponSlot = { ...player.weaponSlot };
  if (player.armorSlot) newPlayer.armorSlot = { ...player.armorSlot };
  if (player.accessorySlot) newPlayer.accessorySlot = { ...player.accessorySlot };
  
  // Copy talent system
  newPlayer.talentPoints = player.talentPoints;
  
  // Deep copy the TalentTree by recreating invested points
  const clonedTalentTree = new TalentTree();
  player.talentTree.getAllTalents().forEach(originalTalent => {
    for (let i = 0; i < originalTalent.currentRank; i++) {
      clonedTalentTree.investPoint(originalTalent.id);
    }
  });
  newPlayer.talentTree = clonedTalentTree;
  
  return newPlayer;
};

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
  path: '·', // Regular path
  path_one: '1', // Binary forest path showing '1'
  path_zero: '0', // Binary forest path showing '0'
  floor: '.', // Regular floor
  dungeon_floor: '⬛', // Dark dungeon floor
  locked_door: '🔒', // Locked door for future features
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
  const { notify } = useNotification();
  const [combatLog, setCombatLog] = React.useState<CombatLogEntry[]>([]);

  // FIX: Initialize GameEngine instance only once on component mount.
  // The empty dependency array ensures this useEffect runs only on initial mount.
  // `dispatch` is stable, and the initial `state` is passed; subsequent state
  // updates are handled by the separate `useEffect` below.
  useEffect(() => {
    if (!gameEngineRef.current) {
      gameEngineRef.current = new GameEngine(dispatch, state); // `dispatch` is stable, `state` is initial
      gameEngineRef.current.start();
    }

    // Cleanup: stop the engine when the component unmounts
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
        gameEngineRef.current = null; // Clear the ref on unmount for robustness
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
      // Use specific emoji based on NPC role
      if (npcAtPos.role === 'compiler_cat') {
        return '🐱'; // Cat emoji for Compiler Cat
      } else if (npcAtPos.role === 'debugger') {
        return '🧙'; // Keep wizard for The Great Debugger
      }
      return entityMap.npc; // Default NPC emoji
    }

    // 3. Check for Enemies at this position
    const enemyAtPos = enemies.find(enemy => enemy.position.x === x && enemy.position.y === y);
    if (enemyAtPos) {
      return entityMap.enemy;
    }

    // 4. Check for Items at this position (only if they have a position on the map)
    const itemAtPos = items.find((item: IItem) => item.position && item.position.x === x && item.position.y === y);
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

  // Create an InventoryModel instance from the player's inventory items
  // Use useMemo to prevent recreating on every render
  const playerInventory = React.useMemo(() => {
    const inventory = new InventoryModel();
    state.player.inventory.forEach(item => {
      // Ensure item has required properties before adding
      if (item && item.id && item.type) {
        // Convert plain objects to Item instances if needed
        if (!(item instanceof ItemClass) && 'name' in item) {
          // This is a plain object, we can't convert it to ItemClass without knowing the variant
          inventory.addItem(item as any);
        } else {
          inventory.addItem(item);
        }
      } else {
        console.error('Invalid item in player inventory:', item);
      }
    });
    return inventory;
  }, [state.player.inventory]);

  const handleUseItem = useCallback((itemId: string) => {
    const item = playerInventory.getItem(itemId);
    if (item && item instanceof ItemClass) {
      // Use the item's validation method
      const result = item.use(state.player);
      
      if (result.success) {
        // Apply the item's effect
        if (item.type === 'consumable') {
          if (item.effect === 'restoreHp' && item.value) {
            const newPlayer = clonePlayer(state.player);
            newPlayer.heal(item.value);
            dispatch({ type: 'UPDATE_PLAYER_STATS', payload: { stats: newPlayer.getBaseStats() } });
          } else if (item.effect === 'restoreEnergy' && item.value) {
            const newPlayer = clonePlayer(state.player);
            newPlayer.restoreEnergy(item.value);
            dispatch({ type: 'UPDATE_PLAYER_STATS', payload: { stats: newPlayer.getBaseStats() } });
          }
          // Remove consumable items after successful use
          dispatch({ type: 'REMOVE_ITEM', payload: { itemId, fromPlayerInventory: true } });
        }
        // Don't remove quest items or key items
        dispatch({ type: 'SHOW_INVENTORY', payload: { show: false } });
      }
      
      // Show the result message using our notification system
      notify({
        type: result.success ? 'success' : 'warning',
        message: result.message
      });
    }
  }, [playerInventory, state.player, dispatch]);

  const handleCloseInventory = useCallback(() => {
    dispatch({ type: 'SHOW_INVENTORY', payload: { show: false } });
  }, [dispatch]);

  const handleEquipItem = useCallback((itemId: string) => {
    const item = playerInventory.getItem(itemId);
    if (item && item.type === 'equipment') {
      // Equip the item - the Player.equip method handles swapping if needed
      const newPlayer = clonePlayer(state.player);
      newPlayer.equip(item);
      // Update the player in state (this is a simplified approach)
      // In a real implementation, you'd have an EQUIP_ITEM action
      dispatch({ type: 'UPDATE_PLAYER_STATS', payload: { stats: newPlayer.getBaseStats() } });
    }
  }, [playerInventory, state.player, dispatch]);

  const handleCloseCharacterScreen = useCallback(() => {
    dispatch({ type: 'SHOW_CHARACTER_SCREEN', payload: { show: false } });
  }, [dispatch]);

  const handleUnequipItem = useCallback((slotType: EquipmentSlotType) => {
    const newPlayer = clonePlayer(state.player);
    newPlayer.unequip(slotType);
    dispatch({ type: 'UPDATE_PLAYER_STATS', payload: { stats: newPlayer.getBaseStats() } });
  }, [state.player, dispatch]);

  const handleSpendTalentPoint = useCallback((talentId: string) => {
    const newPlayer = clonePlayer(state.player);
    const success = newPlayer.spendTalentPoint(talentId);
    if (success) {
      // Update the player state with the new talent configuration
      dispatch({ type: 'UPDATE_PLAYER_STATS', payload: { stats: newPlayer.getBaseStats() } });
    }
  }, [state.player, dispatch]);

  const handleResetTalents = useCallback(() => {
    const newPlayer = clonePlayer(state.player);
    newPlayer.resetTalents();
    // Update the player state with reset talents
    dispatch({ type: 'UPDATE_PLAYER_STATS', payload: { stats: newPlayer.getBaseStats() } });
  }, [state.player, dispatch]);

  // Add effect to handle notifications from state changes
  useEffect(() => {
    if (state.notification) {
      notify({
        type: 'info',
        message: state.notification
      });
      // Clear the notification from state after showing it
      dispatch({ type: 'CLEAR_NOTIFICATION' });
    }
  }, [state.notification, notify, dispatch]);

  // Add effect to update combat log when in battle
  useEffect(() => {
    if (state.battle && state.battle.log.length > 0) {
      const newEntries = state.battle.log.map((msg, index) => ({
        id: `battle-${Date.now()}-${index}`,
        type: msg.includes('damage') ? 'damage' as const : 
              msg.includes('heal') ? 'healing' as const : 
              msg.includes('uses') ? 'ability' as const : 'info' as const,
        message: msg,
        timestamp: Date.now()
      }));
      setCombatLog(prev => [...prev, ...newEntries].slice(-20)); // Keep last 20 entries
    }
  }, [state.battle?.log]);

  return (
    <>
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
      {/* Player Progress Bar */}
      <PlayerProgressBar
        level={state.player.stats.level}
        currentXP={state.player.stats.exp}
        maxXpForLevel={state.player.stats.level * 100}
        currentHP={state.player.stats.hp}
        maxHP={state.player.stats.maxHp}
        currentEnergy={state.player.stats.energy}
        maxEnergy={state.player.stats.maxEnergy}
      />
      {/* Mini Combat Log - only show during battles */}
      {state.battle && (
        <MiniCombatLog logEntries={combatLog} />
      )}
      {/* Render inventory UI when visible */}
      {state.showInventory && (
        <Inventory
          inventory={playerInventory}
          onClose={handleCloseInventory}
          onUseItem={handleUseItem}
          player={state.player}
          onEquipItem={handleEquipItem}
        />
      )}
      {/* Render quest log UI when visible */}
      {state.showQuestLog && (
        <QuestLog />
      )}
      {/* Render character screen UI when visible */}
      {state.showCharacterScreen && (
        <CharacterScreen
          player={state.player}
          onClose={handleCloseCharacterScreen}
          onEquipItem={handleEquipItem}
          onUnequipItem={handleUnequipItem}
          onSpendTalentPoint={handleSpendTalentPoint}
          onResetTalents={handleResetTalents}
        />
      )}
    </>
  );
};

export default GameBoard;