// src/components/GameBoard/GameBoard.tsx

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useGameContext } from '../../context/GameContext';
import { useKeyboard } from '../../hooks/useKeyboard';
import { GameEngine } from '../../engine/GameEngine';
import { MovementSystem } from '../../engine/MovementSystem';
import { Position, TileType, Enemy, NPC, Item as IItem, CombatLogEntry, TimeOfDay } from '../../types/global.types';
import Inventory from '../Inventory/Inventory';
import { Inventory as InventoryModel } from '../../models/Inventory';
import { Player } from '../../models/Player';
import { Item as ItemClass } from '../../models/Item';
import QuestJournal from '../QuestJournal/QuestJournal';
import QuestTracker from '../QuestTracker/QuestTracker';
import CharacterScreen from '../CharacterScreen/CharacterScreen';
import { EquipmentSlotType } from '../../models/Player';
import { TalentTree } from '../../models/TalentTree';
import PlayerProgressBar from '../PlayerProgressBar/PlayerProgressBar';
import MiniCombatLog from '../MiniCombatLog/MiniCombatLog';
import { useNotification } from '../NotificationSystem/NotificationSystem';
import Hotbar from '../Hotbar/Hotbar';
import Shop from '../Shop/Shop';
import Minimap from '../Minimap/Minimap';
import WeatherEffects from '../WeatherEffects/WeatherEffects';
import WeatherDisplay from '../WeatherDisplay/WeatherDisplay';
import FactionStatus from '../FactionStatus/FactionStatus';
import MapGrid from './MapGrid'; // Import the new MapGrid component

import styles from './GameBoard.module.css';

// Define the display dimensions for the game board
// Increased from 20x15 to 25x20 for 70% viewport coverage
const DISPLAY_WIDTH = 25;
const DISPLAY_HEIGHT = 20;

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
  
  // Copy exploration data
  newPlayer.exploredMaps = new Map();
  player.exploredMaps.forEach((tiles, mapId) => {
    newPlayer.exploredMaps.set(mapId, new Set(tiles));
  });
  
  return newPlayer;
};

const GameBoard: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const { pressedKeys, getDirection } = useKeyboard();
  const gameEngineRef = useRef<GameEngine | null>(null);
  const { notify } = useNotification();
  const [combatLog, setCombatLog] = React.useState<CombatLogEntry[]>([]);
  const [isAsciiMode, setIsAsciiMode] = useState(false); // New state for ASCII mode
  const prevBattleRef = useRef(state.battle);

  // Create an InventoryModel instance from the player's inventory items
  const playerInventory = React.useMemo(() => {
    const inventory = new InventoryModel();
    state.player.inventory.forEach(item => {
      if (item && item.id && item.type) {
        if (!(item instanceof ItemClass) && 'name' in item) {
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

  // Get current time period for atmospheric styling
  const getTimeOfDay = (): TimeOfDay => {
    if (!state.timeData) return 'day';
    const hour = state.timeData.hours;
    if (hour >= 6 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 18) return 'day';
    if (hour >= 18 && hour < 20) return 'dusk';
    return 'night';
  };

  // FIX: Initialize GameEngine instance only once on component mount.
  useEffect(() => {
    if (!gameEngineRef.current) {
      gameEngineRef.current = new GameEngine(dispatch, state);
      gameEngineRef.current.start();
    }

    // Cleanup: stop the engine when the component unmounts
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
        gameEngineRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Update GameEngine's internal state whenever the GameContext state changes.
  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setGameState(state);
    }
    // Expose game state and engine for debugging
    (window as any).__gameState = state;
    (window as any).__gameEngine = gameEngineRef.current;
  }, [state]);

  // Pass raw keyboard input (set of pressed keys) to the GameEngine.
  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.handleKeyboardInput(pressedKeys);
    }
  }, [pressedKeys]);
  
  // Track defeated enemies from battle results
  useEffect(() => {
    if (prevBattleRef.current && !state.battle && gameEngineRef.current) {
      const defeatedEnemyIds = prevBattleRef.current.enemies
        .filter(enemy => enemy.hp <= 0)
        .map(enemy => enemy.id);
      
      defeatedEnemyIds.forEach(enemyId => {
        gameEngineRef.current!.markEnemyDefeated(enemyId);
      });
    }
    prevBattleRef.current = state.battle;
  }, [state.battle]);

  // Define all callbacks before any conditional returns
  const handleHotbarConfigChange = useCallback((newConfig: (string | null)[]) => {
    dispatch({ type: 'UPDATE_HOTBAR_CONFIG', payload: { hotbarConfig: newConfig } });
  }, [dispatch]);

  const handleFastTravel = useCallback((mapId: string, position: Position) => {
    if (mapId === state.currentMap.id) {
      dispatch({ type: 'TELEPORT_PLAYER', payload: position });
      notify({ type: 'success', message: `Traveled to ${position.x}, ${position.y}` });
    } else {
      notify({ type: 'warning', message: `Travel to ${mapId} not yet implemented` });
    }
  }, [dispatch, notify, state.currentMap.id]);

  const handleUseItem = useCallback((itemId: string, quantity?: number) => {
    const item = playerInventory.getItem(itemId);
    if (item && item instanceof ItemClass) {
      const result = item.use(state.player);
      
      if (result.success) {
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
          dispatch({ type: 'REMOVE_ITEM', payload: { itemId, fromPlayerInventory: true } });
        }
        dispatch({ type: 'SHOW_INVENTORY', payload: { show: false } });
      }
      
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
      const newPlayer = clonePlayer(state.player);
      const previousItem = newPlayer.equip(item);
      
      dispatch({ type: 'UPDATE_PLAYER', payload: { player: newPlayer } });
      
      notify({
        type: 'success',
        message: previousItem 
          ? `Equipped ${item.name} (replaced ${previousItem.name})`
          : `Equipped ${item.name}`
      });
    }
  }, [playerInventory, state.player, dispatch]);

  const handleCloseCharacterScreen = useCallback(() => {
    dispatch({ type: 'SHOW_CHARACTER_SCREEN', payload: { show: false } });
  }, [dispatch]);

  const handleUnequipItem = useCallback((slotType: EquipmentSlotType) => {
    const newPlayer = clonePlayer(state.player);
    const unequippedItem = newPlayer.unequip(slotType);
    
    dispatch({ type: 'UPDATE_PLAYER', payload: { player: newPlayer } });
    
    if (unequippedItem) {
      notify({
        type: 'success',
        message: `Unequipped ${unequippedItem.name}`
      });
    }
  }, [state.player, dispatch]);

  const handleSpendTalentPoint = useCallback((talentId: string) => {
    const newPlayer = clonePlayer(state.player);
    const success = newPlayer.spendTalentPoint(talentId);
    if (success) {
      dispatch({ type: 'UPDATE_PLAYER_STATS', payload: { stats: newPlayer.getBaseStats() } });
    }
  }, [state.player, dispatch]);

  const handleResetTalents = useCallback(() => {
    const newPlayer = clonePlayer(state.player);
    newPlayer.resetTalents();
    dispatch({ type: 'UPDATE_PLAYER_STATS', payload: { stats: newPlayer.getBaseStats() } });
  }, [state.player, dispatch]);

  useEffect(() => {
    if (state.notification) {
      notify({
        type: 'info',
        message: state.notification
      });
      dispatch({ type: 'CLEAR_NOTIFICATION' });
    }
  }, [state.notification, notify, dispatch]);

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
      setCombatLog(prev => [...prev, ...newEntries].slice(-20));
    }
  }, [state.battle?.log]);

  const timeOfDay = getTimeOfDay();

  // Toggle ASCII mode with button
  const handleToggleAsciiMode = useCallback(() => {
    setIsAsciiMode(prev => !prev);
  }, []);

  // Add loading check after all hooks
  if (state.currentMap.id === 'loading' || !state.currentMap.tiles || state.currentMap.tiles.length === 0) {
    return (
      <div className={styles.gameBoard} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '600px'
      }}>
        <div>Loading map...</div>
      </div>
    );
  }

  return (
    <>
      <div className={`${styles.gameBoard} ${styles[timeOfDay]}`}>
        <MapGrid
          currentMap={state.currentMap}
          playerPos={state.player.position}
          enemies={state.enemies}
          npcs={state.npcs}
          items={state.items}
          display_width={DISPLAY_WIDTH}
          display_height={DISPLAY_HEIGHT}
          isAsciiMode={isAsciiMode}
        />
        {/* Display FPS counter and ASCII toggle */}
        {gameEngineRef.current && (
          <div className={styles.fpsCounter}>
            FPS: {gameEngineRef.current.fps}
            <button 
              onClick={handleToggleAsciiMode} 
              className={styles.asciiToggle}
              style={{ marginLeft: '10px', fontSize: '0.8em' }}
            >
              {isAsciiMode ? 'Emoji Mode' : 'ASCII Mode'}
            </button>
          </div>
        )}
        {/* Weather Effects Overlay */}
        {state.weatherData && (
          <WeatherEffects
            weatherType={state.weatherData.currentWeather}
            transitionProgress={state.weatherData.transitionProgress}
          />
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
      {/* Hotbar - always visible at bottom of screen */}
      <Hotbar
        inventory={playerInventory}
        player={state.player}
        onUseItem={handleUseItem}
        initialHotbarConfig={state.hotbarConfig}
        onHotbarConfigChange={handleHotbarConfigChange}
      />
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
      {/* Quest Tracker - always visible to show active objectives */}
      <QuestTracker 
        onOpenJournal={() => dispatch({ type: 'UPDATE_GAME_FLAG', payload: { key: 'showQuestLog', value: true } })}
        playerPosition={state.player.position}
      />
      {/* Render quest journal UI when visible */}
      {state.showQuestLog && (
        <QuestJournal />
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
      {/* Render faction status UI when visible */}
      {state.showFactionStatus && (
        <FactionStatus />
      )}
      {/* Render shop UI when visible */}
      {state.shopState && (
        <Shop />
      )}
      {/* Minimap - always visible in top-right */}
      <Minimap
        player={state.player}
        currentMap={state.currentMap}
        npcs={state.npcs}
        onFastTravel={handleFastTravel}
      />
      {/* Weather Display - shows current weather and effects */}
      {state.weatherData && gameEngineRef.current && (
        <WeatherDisplay
          weatherType={state.weatherData.currentWeather}
          effects={gameEngineRef.current.getWeatherEffects()}
        />
      )}
    </>
  );
};

export default GameBoard;