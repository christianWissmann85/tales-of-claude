import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  GameState as IGameState, // Renamed to IGameState to avoid conflict with local GameState interface
  Position,
  Direction,
  DialogueState,
  BattleState,
  Item,
  Enemy,
  NPC,
  PlayerStats,
  GameMap as IGameMap, // Renamed to IGameMap to avoid conflict with local GameMap class
  CombatEntity,
} from '../types/global.types';
import { Player } from '../models/Player';
import { GameMap } from '../models/Map'; // Import the GameMap class
import { terminalTownData } from '../assets/maps/terminalTown'; // Import terminalTownData
import SaveGameService from '../services/SaveGame'; // Import SaveGameService
import dialoguesData from '../assets/dialogues.json'; // Import dialogue data

/**
 * Represents the entire game state, using concrete class instances for Player and GameMap.
 * Note: When updating Player or GameMap instances within the reducer,
 * new instances must be created to ensure immutability for React's change detection.
 */
interface GameState extends IGameState {
  player: Player; // Use the Player class instance
  currentMap: GameMap; // Use the GameMap class instance
}

/**
 * Helper function to deep clone a Player instance.
 * This is crucial for maintaining immutability in the reducer when Player methods mutate state.
 */
const clonePlayer = (player: Player): Player => {
  const newPlayer = new Player(player.id, player.name, { ...player.position });
  // Manually copy over all other properties from the old player instance
  // This is crucial because the Player constructor initializes some fields.
  newPlayer.statusEffects = player.statusEffects.map(se => ({ ...se }));
  newPlayer.stats = { ...player.stats }; // Shallow copy stats object
  // Deep copy items in inventory, ensuring they retain their full structure
  newPlayer.inventory = player.inventory.map(item => ({
    ...item,
    position: item.position ? { ...item.position } : undefined,
  }));
  newPlayer.abilities = player.abilities.map(ability => ({ ...ability })); // Deep copy abilities
  return newPlayer;
};

/**
 * Defines all possible actions that can be dispatched to modify the game state.
 */
type GameAction =
  | { type: 'MOVE_PLAYER'; payload: { direction: Direction } }
  | { type: 'START_BATTLE'; payload: { enemies: Enemy[] } }
  | { type: 'END_BATTLE'; payload: { playerWon: boolean; playerExpGained?: number; itemsDropped?: Item[]; playerCombatState?: CombatEntity } }
  | { type: 'START_DIALOGUE'; payload: { dialogueState: DialogueState } }
  | { type: 'END_DIALOGUE' }
  | { type: 'UPDATE_MAP'; payload: { newMap: GameMap; playerNewPosition: Position } }
  | { type: 'ADD_ITEM'; payload: { item: Item; toPlayerInventory?: boolean; position?: Position } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string; fromPlayerInventory?: boolean; position?: Position } }
  | { type: 'UPDATE_PLAYER_STATS'; payload: { stats: Partial<PlayerStats> } }
  | { type: 'UPDATE_GAME_FLAG'; payload: { key: string; value: boolean | number | string } }
  | { type: 'ADD_ENEMY'; payload: { enemy: Enemy } }
  | { type: 'REMOVE_ENEMY'; payload: { enemyId: string } }
  | { type: 'ADD_NPC'; payload: { npc: NPC } }
  | { type: 'REMOVE_NPC'; payload: { npcId: string } }
  | { type: 'TOGGLE_INVENTORY' }
  | { type: 'SHOW_INVENTORY'; payload: { show: boolean } }
  | { type: 'DIALOGUE_CHOICE'; payload: { action: string } }
  | { type: 'SAVE_GAME' }
  | { type: 'LOAD_GAME'; payload: { savedState: Partial<GameState> } }
  | { type: 'SHOW_NOTIFICATION'; payload: { message: string } }
  | { type: 'CLEAR_NOTIFICATION' };

/**
 * The reducer function that handles state transitions based on dispatched actions.
 * It ensures immutability by creating new state objects and cloning mutable instances.
 */
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'MOVE_PLAYER': {
      const newPlayer = clonePlayer(state.player);
      newPlayer.move(action.payload.direction);
      return { ...state, player: newPlayer };
    }

    case 'START_BATTLE':
      return {
        ...state,
        battle: {
          player: { // Create a combat entity snapshot of the player
            id: state.player.id,
            name: state.player.name,
            hp: state.player.stats.hp,
            maxHp: state.player.stats.maxHp,
            energy: state.player.stats.energy,
            maxEnergy: state.player.stats.maxEnergy,
            attack: state.player.stats.attack,
            defense: state.player.stats.defense,
            speed: state.player.stats.speed,
            abilities: state.player.abilities.map(a => ({ ...a })),
            statusEffects: state.player.statusEffects.map(se => ({ ...se })),
          },
          enemies: action.payload.enemies.map(e => ({ // Deep copy enemies for battle state
            id: e.id,
            name: e.name,
            hp: e.stats.hp,
            maxHp: e.stats.maxHp,
            energy: e.stats.energy,
            maxEnergy: e.stats.maxEnergy,
            attack: e.stats.attack,
            defense: e.stats.defense,
            speed: e.stats.speed,
            abilities: e.abilities.map(a => ({ ...a })),
            statusEffects: e.statusEffects.map(se => ({ ...se })),
            expReward: e.expReward, // Include expReward for victory calculations
          })),
          currentTurn: 'player', // Player always starts
          turnOrder: [state.player.id, ...action.payload.enemies.map(e => e.id)].sort(() => Math.random() - 0.5), // Simple random order
          log: [],
        },
        dialogue: null, // End dialogue if battle starts
      };

    case 'END_BATTLE': {
      const { playerWon, playerExpGained, itemsDropped, playerCombatState } = action.payload;
      const newState = { ...state, battle: null }; // Clear battle state

      if (playerWon) {
        const updatedPlayer = clonePlayer(state.player);

        // Apply HP/Energy changes from battle if playerCombatState is provided
        if (playerCombatState) {
          updatedPlayer.stats.hp = playerCombatState.hp;
          updatedPlayer.stats.energy = playerCombatState.energy;
          updatedPlayer.statusEffects = playerCombatState.statusEffects.map(se => ({ ...se }));
        }

        if (playerExpGained) {
          updatedPlayer.addExperience(playerExpGained);
        }
        if (itemsDropped) {
          itemsDropped.forEach(item => updatedPlayer.addItem(item));
        }
        newState.player = updatedPlayer;
      }
      return newState;
    }

    case 'START_DIALOGUE':
      return { ...state, dialogue: action.payload.dialogueState, battle: null }; // End battle if dialogue starts

    case 'END_DIALOGUE':
      return { ...state, dialogue: null };

    case 'UPDATE_MAP': {
      const { newMap, playerNewPosition } = action.payload;
      const updatedPlayer = clonePlayer(state.player);
      updatedPlayer.position = { ...playerNewPosition }; // Update player's position on the new map

      // Clear dynamic entities from previous map.
      // The new map instance (newMap) will manage its own initial entities internally.
      return {
        ...state,
        currentMap: newMap,
        player: updatedPlayer,
        enemies: [],
        npcs: [],
        items: [],
        dialogue: null,
        battle: null,
      };
    }

    case 'ADD_ITEM': {
      const { item, toPlayerInventory, position } = action.payload;
      if (toPlayerInventory) {
        const updatedPlayer = clonePlayer(state.player);
        updatedPlayer.addItem(item);
        return { ...state, player: updatedPlayer };
      } else if (position) {
        // Add item to map's dynamic items list (e.g., dropped loot)
        // Note: This does not update the GameMap instance's internal entities due to private fields.
        return { ...state, items: [...state.items, { ...item, position }] };
      }
      return state;
    }

    case 'REMOVE_ITEM': {
      const { itemId, fromPlayerInventory } = action.payload;
      if (fromPlayerInventory) {
        const updatedPlayer = clonePlayer(state.player);
        updatedPlayer.removeItem(itemId);
        return { ...state, player: updatedPlayer };
      } else {
        // Remove item from map's dynamic items list
        return { ...state, items: state.items.filter(item => item.id !== itemId) };
      }
    }

    case 'UPDATE_PLAYER_STATS': {
      const updatedPlayer = clonePlayer(state.player);
      updatedPlayer.stats = { ...updatedPlayer.stats, ...action.payload.stats };
      return { ...state, player: updatedPlayer };
    }

    case 'UPDATE_GAME_FLAG':
      return {
        ...state,
        gameFlags: {
          ...state.gameFlags,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'ADD_ENEMY':
      return { ...state, enemies: [...state.enemies, action.payload.enemy] };

    case 'REMOVE_ENEMY':
      return { ...state, enemies: state.enemies.filter(e => e.id !== action.payload.enemyId) };

    case 'ADD_NPC':
      return { ...state, npcs: [...state.npcs, action.payload.npc] };

    case 'REMOVE_NPC':
      return { ...state, npcs: state.npcs.filter(n => n.id !== action.payload.npcId) };

    case 'TOGGLE_INVENTORY':
      return { ...state, showInventory: !state.showInventory };

    case 'SHOW_INVENTORY':
      return { ...state, showInventory: action.payload.show };

    case 'DIALOGUE_CHOICE': {
      const { action: choiceAction } = action.payload;
      
      // Handle specific dialogue actions
      if (choiceAction === 'save_game') {
        // Save the game
        const saveSuccess = SaveGameService.saveGame(state);
        if (saveSuccess) {
          console.log('Game saved successfully!');
          return { 
            ...state, 
            dialogue: null,
            notification: 'Game saved successfully! Meow~' 
          };
        } else {
          console.error('Failed to save game');
          return { 
            ...state, 
            dialogue: null,
            notification: 'Failed to save game! Please try again.' 
          };
        }
      } else if (choiceAction === 'end_dialogue') {
        return { ...state, dialogue: null };
      } else if (choiceAction === 'debugger_advice') {
        // Load new dialogue
        const newDialogue = dialoguesData.find((d) => d.id === 'debugger_advice');
        if (newDialogue) {
          return {
            ...state,
            dialogue: {
              speaker: 'The Great Debugger',
              lines: newDialogue.lines,
              currentLineIndex: 0,
            },
          };
        }
      }
      // Add more dialogue actions as needed
      return state;
    }

    case 'SAVE_GAME': {
      const saveSuccess = SaveGameService.saveGame(state);
      if (saveSuccess) {
        console.log('Game saved successfully!');
      } else {
        console.error('Failed to save game');
      }
      return state; // State doesn't change
    }

    case 'LOAD_GAME': {
      const { savedState } = action.payload;
      // Merge saved state with current state, preserving class instances
      const updatedPlayer = clonePlayer(state.player);
      if (savedState.player) {
        updatedPlayer.position = savedState.player.position || updatedPlayer.position;
        updatedPlayer.stats = savedState.player.stats || updatedPlayer.stats;
        updatedPlayer.inventory = savedState.player.inventory || updatedPlayer.inventory;
        updatedPlayer.abilities = savedState.player.abilities || updatedPlayer.abilities;
        updatedPlayer.statusEffects = savedState.player.statusEffects || updatedPlayer.statusEffects;
      }
      
      return {
        ...state,
        ...savedState,
        player: updatedPlayer,
        // Ensure we maintain class instances
        currentMap: savedState.currentMap || state.currentMap,
      };
    }

    case 'SHOW_NOTIFICATION':
      return { ...state, notification: action.payload.message };
    
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };

    default:
      return state;
  }
};

/**
 * Initializes the default game state.
 */
const initialPlayer = new Player('claude', 'Claude', { x: 10, y: 7 });
// Use GameMap constructor to load the Terminal Town map
const initialMap = new GameMap(terminalTownData);

// Extract NPCs from the initial map's entities
// NPCs are identified by the presence of a 'role' property, unique to them in the GameMap's entities union.
const initialNpcs: NPC[] = initialMap.entities.filter(
  (entity): entity is NPC => 'role' in entity,
);

// Extract Enemies from the initial map's entities
// Enemies are identified by having 'abilities' array and stats with hp
const initialEnemies: Enemy[] = initialMap.entities.filter(
  (entity): entity is Enemy => 
    'abilities' in entity && 
    Array.isArray(entity.abilities) &&
    'stats' in entity &&
    'hp' in (entity as any).stats,
);

// Extract Items from the initial map's entities
// Items are identified by having a 'type' property that is ItemType (string) not EnemyType
// and not having 'role' (which NPCs have) or 'abilities' (which Enemies have)
const initialItems: Item[] = initialMap.entities.filter(
  (entity): entity is Item => 
    'type' in entity && 
    typeof entity.type === 'string' && 
    !('role' in entity) && 
    !('abilities' in entity),
);



const defaultGameState: GameState = {
  player: initialPlayer,
  currentMap: initialMap,
  enemies: initialEnemies, // Load enemies from map data
  npcs: initialNpcs,    // NPCs will be loaded from map data if present, or added dynamically
  items: initialItems,   // Load items from map data
  dialogue: null,
  battle: null,
  gameFlags: {},
  showInventory: false,
  notification: null,
};

/**
 * Defines the shape of the GameContext value.
 */
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

/**
 * Creates the React Context for game state.
 */
const GameContext = createContext<GameContextType | undefined>(undefined);

/**
 * Props for the GameProvider component.
 */
interface GameProviderProps {
  children: ReactNode;
}

/**
 * The GameProvider component wraps the application and provides the game state
 * and dispatch function to its children.
 */
const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, defaultGameState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

/**
 * Custom hook to easily access the game state and dispatch function from the context.
 * Throws an error if used outside of a GameProvider.
 */
const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

// Export values (components, hooks)
export { GameProvider, useGameContext };
// Export types separately using 'export type' for isolatedModules compatibility
export type { GameState, GameAction };