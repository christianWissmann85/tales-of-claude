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
import { TalentTree } from '../models/TalentTree';
import { GameMap } from '../models/Map'; // Import the GameMap class
import { terminalTownData } from '../assets/maps/terminalTown'; // Import terminalTownData
import SaveGameService from '../services/SaveGame'; // Import SaveGameService
import dialoguesData from '../assets/dialogues.json'; // Import dialogue data
import { QuestManager } from '../models/QuestManager'; // Import QuestManager

/**
 * Represents the entire game state, using concrete class instances for Player and GameMap.
 * Note: When updating Player or GameMap instances within the reducer,
 * new instances must be created to ensure immutability for React's change detection.
 */
interface GameState extends IGameState {
  player: Player; // Use the Player class instance
  currentMap: GameMap; // Use the GameMap class instance
  showCharacterScreen?: boolean; // Add character screen visibility state
  gamePhase: 'splash' | 'intro' | 'playing'; // Add game phase tracking
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
  newPlayer.updateBaseStats(player.getBaseStats()); // Copy base stats using the new methods
  // Deep copy items in inventory, ensuring they retain their full structure
  newPlayer.inventory = player.inventory.map(item => ({
    ...item,
    position: item.position ? { ...item.position } : undefined,
  }));
  newPlayer.abilities = player.abilities.map(ability => ({ ...ability })); // Deep copy abilities
  // Copy equipped items
  if (player.weaponSlot) newPlayer.weaponSlot = { ...player.weaponSlot };
  if (player.armorSlot) newPlayer.armorSlot = { ...player.armorSlot };
  if (player.accessorySlot) newPlayer.accessorySlot = { ...player.accessorySlot };
  // Copy quest tracking
  newPlayer.activeQuestIds = [...player.activeQuestIds];
  newPlayer.completedQuestIds = [...player.completedQuestIds];
  
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
  | { type: 'TOGGLE_QUEST_LOG' }
  | { type: 'SHOW_QUEST_LOG'; payload: { show: boolean } }
  | { type: 'TOGGLE_CHARACTER_SCREEN' }
  | { type: 'SHOW_CHARACTER_SCREEN'; payload: { show: boolean } }
  | { type: 'DIALOGUE_CHOICE'; payload: { action: string } }
  | { type: 'SAVE_GAME' }
  | { type: 'LOAD_GAME'; payload: { savedState: Partial<GameState> } }
  | { type: 'SHOW_NOTIFICATION'; payload: { message: string } }
  | { type: 'CLEAR_NOTIFICATION' }
  | { type: 'SET_GAME_PHASE'; payload: { phase: 'splash' | 'intro' | 'playing' } };

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
          currentTurn: state.player.id, // Player always starts (using entity ID)
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

      // Extract entities from the new map
      const newNpcs = newMap.entities.filter((entity): entity is NPC => 'role' in entity);
      const newEnemies = newMap.entities.filter(
        (entity): entity is Enemy => 
          'abilities' in entity && 
          Array.isArray(entity.abilities) &&
          'stats' in entity &&
          'hp' in (entity as any).stats
      );
      const newItems = newMap.entities.filter(
        (entity): entity is Item => 
          'type' in entity && 
          typeof entity.type === 'string' && 
          !('role' in entity) && 
          !('abilities' in entity)
      );

      return {
        ...state,
        currentMap: newMap,
        player: updatedPlayer,
        enemies: newEnemies,
        npcs: newNpcs,
        items: newItems,
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
      updatedPlayer.updateBaseStats(action.payload.stats);
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

    case 'TOGGLE_QUEST_LOG':
      return { ...state, showQuestLog: !state.showQuestLog };

    case 'SHOW_QUEST_LOG':
      return { ...state, showQuestLog: action.payload.show };

    case 'TOGGLE_CHARACTER_SCREEN':
      return { ...state, showCharacterScreen: !state.showCharacterScreen };

    case 'SHOW_CHARACTER_SCREEN':
      return { ...state, showCharacterScreen: action.payload.show };

    case 'DIALOGUE_CHOICE': {
      const { action: choiceAction } = action.payload;
      
      // Handle specific dialogue actions
      if (choiceAction === 'save_game') {
        // Save the game with quest manager state
        const questManager = QuestManager.getInstance();
        const stateWithQuests = {
          ...state,
          questManagerState: questManager.saveState()
        };
        const saveSuccess = SaveGameService.saveGame(stateWithQuests);
        if (saveSuccess) {
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
      } else if (choiceAction === 'load_game') {
        // Load the game
        const loadedState = SaveGameService.loadGame();
        if (loadedState) {
          // Load quest manager state
          const questManager = QuestManager.getInstance();
          if (loadedState.questManagerState) {
            questManager.loadState(loadedState.questManagerState);
          }
          return { 
            ...loadedState, 
            dialogue: null,
            notification: 'Game loaded successfully! Welcome back!',
            gamePhase: 'playing' // Ensure we're in playing phase after loading
          };
        } else {
          return { 
            ...state, 
            dialogue: null,
            notification: 'No saved game found or loading failed!' 
          };
        }
      } else if (choiceAction === 'end_dialogue') {
        return { ...state, dialogue: null };
      } else if (choiceAction === 'debugger_advice' || choiceAction === 'offer_bug_hunt_quest') {
        // Load new dialogue
        const dialogueId = choiceAction === 'debugger_advice' ? 'debugger_advice' : 'offer_bug_hunt_quest';
        const newDialogue = dialoguesData.find((d) => d.id === dialogueId);
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
      } else if (choiceAction === 'start_quest_bug_hunt') {
        // Start the Bug Hunt quest
        const questManager = QuestManager.getInstance();
        const quest = questManager.getQuestById('bug_hunt');
        if (quest && questManager.startQuest('bug_hunt')) {
          return {
            ...state,
            dialogue: null,
            notification: `Quest started: ${quest.name}!`
          };
        }
      }
      // Add more dialogue actions as needed
      return state;
    }

    case 'SAVE_GAME': {
      const questManager = QuestManager.getInstance();
      const stateWithQuests = {
        ...state,
        questManagerState: questManager.saveState()
      };
      const saveSuccess = SaveGameService.saveGame(stateWithQuests);
      if (saveSuccess) {
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
        if (savedState.player.stats) {
          updatedPlayer.updateBaseStats(savedState.player.stats);
        }
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

    case 'SET_GAME_PHASE':
      return { ...state, gamePhase: action.payload.phase };

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
  showQuestLog: false,
  showCharacterScreen: false,
  notification: null,
  gamePhase: 'splash', // Start with splash screen
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

  // Initialize QuestManager and check for saved game when the game starts
  React.useEffect(() => {
    const questManager = QuestManager.getInstance();
    questManager.initializeQuests();
    
    // Check if there's a saved game and offer to load it
    if (SaveGameService.hasSaveGame()) {
      // Show a notification about available save
      dispatch({ 
        type: 'SHOW_NOTIFICATION', 
        payload: { 
          message: 'Save game found! Talk to Compiler Cat to load it.' 
        } 
      });
    }
  }, []);

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