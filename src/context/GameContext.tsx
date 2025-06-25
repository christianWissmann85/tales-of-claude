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
  ShopState,
  ShopItem,
  TileType,
  TimeData,
  TimeOfDay,
  WeatherData,
  WeatherType,
} from '../types/global.types';
import { Player } from '../models/Player';
import { TalentTree } from '../models/TalentTree';
import { GameMap } from '../models/Map'; // Import the GameMap class
import { getMap } from '../assets/maps'; // Import getMap function for async map loading
import SaveGameService from '../services/SaveGame'; // Import SaveGameService
import dialoguesData from '../assets/dialogues.json'; // Import dialogue data
import { QuestManager } from '../models/QuestManager'; // Import QuestManager
import { Quest, QuestVariant } from '../models/Quest'; // Import Quest and QuestVariant
import { FactionManager } from '../engine/FactionManager'; // Import FactionManager
import { applyFactionPricing } from '../utils/shopPricing'; // Import shop pricing utility
import { getNPCDialogueId } from '../utils/dialogueHelpers'; // Import dialogue helper
import { UIManager } from '../engine/UIManager'; // Import UIManager

// Export GameAction type for external use
// REMOVED: export type { GameAction }; // This line was removed as per instruction 1 & 3

/**
 * Represents the entire game state, using concrete class instances for Player and GameMap.
 * Note: When updating Player or GameMap instances within the reducer,
 * new instances must be created to ensure immutability for React's change detection.
 */
interface GameState extends IGameState {
  player: Player; // Use the Player class instance
  currentMap: GameMap; // Use the GameMap class instance
  showCharacterScreen: boolean; // Add character screen visibility state
  gamePhase: 'splash' | 'intro' | 'playing'; // Add game phase tracking
  shopState: ShopState | null; // Add shop state
  factionManager: FactionManager; // Add faction manager
  showFactionStatus: boolean; // Add faction status visibility
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
  
  // Copy gold
  newPlayer.gold = player.gold;
  
  // Copy exploration data
  newPlayer.exploredMaps = new Map();
  player.exploredMaps.forEach((tiles, mapId) => {
    newPlayer.exploredMaps.set(mapId, new Set(tiles));
  });
  
  return newPlayer;
};

/**
 * Defines all possible actions that can be dispatched to modify the game state.
 */
type GameAction =
  | { type: 'MOVE_PLAYER'; payload: { direction: Direction } }
  | { type: 'START_BATTLE'; payload: { enemies: Enemy[] } }
  | { type: 'END_BATTLE'; payload: { playerWon: boolean; playerExpGained?: number; itemsDropped?: Item[]; playerCombatState?: CombatEntity; defeatedEnemyIds?: string[] } }
  | { type: 'START_DIALOGUE'; payload: { dialogueState: DialogueState } }
  | { type: 'END_DIALOGUE' }
  | { type: 'UPDATE_MAP'; payload: { newMap: GameMap; playerNewPosition: Position } }
  | { type: 'ADD_ITEM'; payload: { item: Item; toPlayerInventory?: boolean; position?: Position } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string; fromPlayerInventory?: boolean; position?: Position } }
  | { type: 'UPDATE_PLAYER_STATS'; payload: { stats: Partial<PlayerStats> } }
  | { type: 'UPDATE_GAME_FLAG'; payload: { key: string; value: boolean | number | string } }
  | { type: 'ADD_ENEMY'; payload: { enemy: Enemy } }
  | { type: 'REMOVE_ENEMY'; payload: { enemyId: string } }
  | { type: 'UPDATE_ENEMIES'; payload: { enemies: Enemy[] } }
  | { type: 'ADD_NPC'; payload: { npc: NPC } }
  | { type: 'REMOVE_NPC'; payload: { npcId: string } }
  | { type: 'TOGGLE_INVENTORY' }
  | { type: 'SHOW_INVENTORY'; payload: { show: boolean } }
  | { type: 'TOGGLE_QUEST_LOG' }
  | { type: 'SHOW_QUEST_LOG'; payload: { show: boolean } }
  | { type: 'TOGGLE_CHARACTER_SCREEN' }
  | { type: 'SHOW_CHARACTER_SCREEN'; payload: { show: boolean } }
  | { type: 'TOGGLE_FACTION_STATUS' }
  | { type: 'SHOW_FACTION_STATUS'; payload: { show: boolean } }
  | { type: 'DIALOGUE_CHOICE'; payload: { action: string } }
  | { type: 'SAVE_GAME' }
  | { type: 'LOAD_GAME'; payload: { savedState: Partial<GameState> } }
  | { type: 'UPDATE_HOTBAR_CONFIG'; payload: { hotbarConfig: (string | null)[] } }
  | { type: 'SHOW_NOTIFICATION'; payload: { message: string } }
  | { type: 'CLEAR_NOTIFICATION' }
  | { type: 'SET_GAME_PHASE'; payload: { phase: 'splash' | 'intro' | 'playing' } }
  | { type: 'UPDATE_PLAYER'; payload: { player: Player } }
  | { type: 'OPEN_SHOP'; payload: { npcId: string; npcName: string; items: ShopItem[] } }
  | { type: 'CLOSE_SHOP' }
  | { type: 'BUY_ITEM'; payload: { itemId: string; price: number } }
  | { type: 'SELL_ITEM'; payload: { itemId: string; price: number } }
  | { type: 'TELEPORT_PLAYER'; payload: Position }
  | { type: 'UPDATE_TIME'; payload: { timeData: TimeData } }
  | { type: 'SET_TIME_PAUSED'; payload: { isPaused: boolean } }
  | { type: 'UPDATE_WEATHER'; payload: { weatherData: WeatherData } };

/**
 * The reducer function that handles state transitions based on dispatched actions.
 * It ensures immutability by creating new state objects and cloning mutable instances.
 */
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'MOVE_PLAYER': {
      const newPlayer = clonePlayer(state.player);
      newPlayer.move(action.payload.direction);
      // Mark surrounding tiles as explored when player moves
      newPlayer.markSurroundingTilesExplored(state.currentMap.id, 3);
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
      const { playerWon, playerExpGained, itemsDropped, playerCombatState, defeatedEnemyIds } = action.payload;
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
        
        // Don't remove defeated enemies from state - keep them for respawning
        // The PatrolSystem will handle their visibility and respawn timing
        if (defeatedEnemyIds && defeatedEnemyIds.length > 0) {
          // Keep enemies in state but PatrolSystem will mark them as RESPAWNING
          newState.enemies = state.enemies;
          
          // Update quest progress for defeating enemies
          const questManager = QuestManager.getInstance();
  
  // Initialize quests if not already done
  if (questManager.allQuests.length === 0) {
    questManager.initializeQuests();
  }
          questManager.setPlayer(updatedPlayer);
          
          // Track defeated enemy types for quest progress
          const defeatedEnemies = state.enemies.filter(e => defeatedEnemyIds.includes(e.id));
          defeatedEnemies.forEach(enemy => {
            // Update quest progress for defeat_enemy objectives
            const enemyType = enemy.name.toLowerCase().replace(/\s+/g, '_');
            questManager.updateQuestProgress('defeat_enemy', enemyType, 1);
            // Also track by generic enemy types
            if (enemy.name.includes('Bug')) {
              questManager.updateQuestProgress('defeat_enemy', 'bug', 1);
            } else if (enemy.name.includes('Virus')) {
              questManager.updateQuestProgress('defeat_enemy', 'virus', 1);
            } else if (enemy.name.includes('Corrupted')) {
              questManager.updateQuestProgress('defeat_enemy', 'corrupted_data', 1);
            } else if (enemy.name.includes('Boss') || enemy.name.includes('Sovereign')) {
              questManager.updateQuestProgress('defeat_enemy', 'boss', 1);
            }
          });
          
          // Check if any quests completed and update player
          const completedQuests = questManager.getActiveQuests().filter(q => q.status === 'completed');
          completedQuests.forEach(quest => {
            if (!updatedPlayer.completedQuestIds.includes(quest.id)) {
              updatedPlayer.completedQuestIds.push(quest.id);
              updatedPlayer.activeQuestIds = updatedPlayer.activeQuestIds.filter(id => id !== quest.id);
              questManager.completeQuest(quest.id, updatedPlayer);
            }
          });
          newState.player = updatedPlayer;
        }
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
        
        // Update quest progress for item collection
        const questManager = QuestManager.getInstance();
  
  // Initialize quests if not already done
  if (questManager.allQuests.length === 0) {
    questManager.initializeQuests();
  }
        questManager.setPlayer(updatedPlayer);
        
        // Check if this item collection completes any collect_item objectives
        if (item.id) {
          questManager.updateQuestProgress('collect_item', item.id, 1);
        }
        
        // Check if any quests completed and update player
        const completedQuests = questManager.getActiveQuests().filter(q => q.status === 'completed');
        completedQuests.forEach(quest => {
          if (!updatedPlayer.completedQuestIds.includes(quest.id)) {
            updatedPlayer.completedQuestIds.push(quest.id);
            updatedPlayer.activeQuestIds = updatedPlayer.activeQuestIds.filter(id => id !== quest.id);
            questManager.completeQuest(quest.id, updatedPlayer);
          }
        });
        
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

    case 'UPDATE_PLAYER': {
      // Update the entire player object (used for equipment changes)
      return { ...state, player: action.payload.player };
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

    case 'UPDATE_ENEMIES':
      return { ...state, enemies: action.payload.enemies };

    case 'ADD_NPC':
      return { ...state, npcs: [...state.npcs, action.payload.npc] };

    case 'REMOVE_NPC':
      return { ...state, npcs: state.npcs.filter(n => n.id !== action.payload.npcId) };

    case 'TOGGLE_INVENTORY':
      // If inventory is already open, close it. Otherwise close all panels and open inventory
      if (state.showInventory) {
        return { ...state, showInventory: false };
      } else {
        return {
          ...state,
          showInventory: true,
          showQuestLog: false,
          showCharacterScreen: false,
          showFactionStatus: false,
          shopState: null, // Close shop too
        };
      }

    case 'SHOW_INVENTORY':
      return { ...state, showInventory: action.payload.show };

    case 'TOGGLE_QUEST_LOG':
      // If quest log is already open, close it. Otherwise close all panels and open quest log
      if (state.showQuestLog) {
        return { ...state, showQuestLog: false };
      } else {
        return {
          ...state,
          showInventory: false,
          showQuestLog: true,
          showCharacterScreen: false,
          showFactionStatus: false,
          shopState: null, // Close shop too
        };
      }

    case 'SHOW_QUEST_LOG':
      return { ...state, showQuestLog: action.payload.show };

    case 'TOGGLE_CHARACTER_SCREEN':
      // If character screen is already open, close it. Otherwise close all panels and open it
      if (state.showCharacterScreen) {
        return { ...state, showCharacterScreen: false };
      } else {
        return {
          ...state,
          showInventory: false,
          showQuestLog: false,
          showCharacterScreen: true,
          showFactionStatus: false,
          shopState: null, // Close shop too
        };
      }

    case 'SHOW_CHARACTER_SCREEN':
      return { ...state, showCharacterScreen: action.payload.show };

    case 'TOGGLE_FACTION_STATUS':
      // If faction status is already open, close it. Otherwise close all panels and open it
      if (state.showFactionStatus) {
        return { ...state, showFactionStatus: false };
      } else {
        return {
          ...state,
          showInventory: false,
          showQuestLog: false,
          showCharacterScreen: false,
          showFactionStatus: true,
          shopState: null, // Close shop too
        };
      }

    case 'SHOW_FACTION_STATUS':
      return { ...state, showFactionStatus: action.payload.show };

    case 'DIALOGUE_CHOICE': {
      const { action: choiceAction } = action.payload;
      
      // Handle specific dialogue actions
      if (choiceAction === 'save_game') {
        // Save the game with quest manager state
        const questManager = QuestManager.getInstance();
  
  // Initialize quests if not already done
  if (questManager.allQuests.length === 0) {
    questManager.initializeQuests();
  }
        const stateWithQuests = {
          ...state,
          questManagerState: questManager.saveState()
        };
        const saveSuccess = SaveGameService.saveGame(stateWithQuests as any);
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
  
  // Initialize quests if not already done
  if (questManager.allQuests.length === 0) {
    questManager.initializeQuests();
  }
          if (loadedState.questManagerState) {
            questManager.loadState(loadedState.questManagerState);
          }
          // Deserialize faction manager if data exists
          const factionManager = FactionManager.getInstance();
          if (loadedState.factionReputations) {
            factionManager.deserialize({ factions: loadedState.factionReputations });
          }
          
          return { 
            ...loadedState, 
            dialogue: null,
            notification: 'Game loaded successfully! Welcome back!',
            gamePhase: 'playing', // Ensure we're in playing phase after loading
            shopState: null, // Ensure shop is closed when loading
            factionManager // Include faction manager in state
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
  
  // Initialize quests if not already done
  if (questManager.allQuests.length === 0) {
    questManager.initializeQuests();
  }
        const quest = questManager.getQuestById('bug_hunt');
        if (quest && questManager.startQuest('bug_hunt')) {
          return {
            ...state,
            dialogue: null,
            notification: `Quest started: ${quest.name}!`
          };
        }
      } else if (choiceAction === 'open_shop_bit_merchant') {
        // Open Bit Merchant's shop
        const baseShopItems: ShopItem[] = [
          { item: { id: 'potion_hp', name: 'Debug Potion', type: 'consumable', description: 'Restores 50 HP', effect: 'restoreHp', value: 50 }, price: 25, quantity: -1 },
          { item: { id: 'potion_energy', name: 'Energy Drink', type: 'consumable', description: 'Restores 25 Energy', effect: 'restoreEnergy', value: 25 }, price: 20, quantity: -1 },
          { item: { id: 'firewall_shield', name: 'Firewall Shield', type: 'equipment', description: 'Increases defense by 5', stats: { defense: 5 } }, price: 100, quantity: 1 },
          { item: { id: 'bandwidth_boost', name: 'Bandwidth Boost', type: 'consumable', description: 'Increases speed for 3 turns', effect: 'speedBoost', value: 3 }, price: 50, quantity: 5 },
        ];
        
        // Find the Bit Merchant NPC
        const bitMerchant = state.npcs.find(npc => npc.name === 'Bit Merchant');
        const shopItems = bitMerchant && bitMerchant.factionId 
          ? applyFactionPricing(baseShopItems, bitMerchant, state.factionManager)
          : baseShopItems;
        
        return {
          ...state,
          dialogue: null,
          shopState: {
            npcId: 'npc_bit_merchant',
            npcName: 'Bit Merchant',
            items: shopItems,
            playerGold: state.player.gold,
          },
        };
      } else if (choiceAction === 'open_shop_memory_merchant') {
        // Open Memory Merchant's shop
        const baseShopItems: ShopItem[] = [
          { item: { id: 'cache_cleaner', name: 'Cache Cleaner', type: 'consumable', description: 'Removes all debuffs', effect: 'removeDebuffs' }, price: 40, quantity: -1 },
          { item: { id: 'memory_leak_patch', name: 'Memory Leak Patch', type: 'consumable', description: 'Restores 100 HP', effect: 'restoreHp', value: 100 }, price: 50, quantity: 10 },
          { item: { id: 'ram_upgrade', name: 'RAM Upgrade', type: 'equipment', description: 'Increases max HP by 20', stats: { defense: 3 } }, price: 200, quantity: 1 },
          { item: { id: 'stack_overflow_shield', name: 'Stack Overflow Shield', type: 'equipment', description: 'Increases defense by 8', stats: { defense: 8 } }, price: 150, quantity: 1 },
        ];
        
        // Find the Memory Merchant NPC
        const memoryMerchant = state.npcs.find(npc => npc.name === 'Memory Merchant');
        const shopItems = memoryMerchant && memoryMerchant.factionId 
          ? applyFactionPricing(baseShopItems, memoryMerchant, state.factionManager)
          : baseShopItems;
        
        return {
          ...state,
          dialogue: null,
          shopState: {
            npcId: 'npc_memory_merchant',
            npcName: 'Memory Merchant',
            items: shopItems,
            playerGold: state.player.gold,
          },
        };
      } else if (choiceAction.startsWith('start_quest_')) {
        // Generic quest start handler
        const questId = choiceAction.replace('start_quest_', '');
        const questManager = QuestManager.getInstance();
  
  // Initialize quests if not already done
  if (questManager.allQuests.length === 0) {
    questManager.initializeQuests();
  }
        questManager.setPlayer(state.player);
        
        const quest = questManager.getQuestById(questId);
        if (quest) {
          if (questManager.startQuest(questId)) {
            const updatedPlayer = clonePlayer(state.player);
            if (!updatedPlayer.activeQuestIds.includes(questId)) {
              updatedPlayer.activeQuestIds.push(questId);
            }
            return {
              ...state,
              player: updatedPlayer,
              dialogue: null,
              notification: `Quest started: ${quest.name}!`
            };
          } else {
            return {
              ...state,
              dialogue: null,
              notification: `Cannot start quest: ${quest.name}. Check prerequisites or faction requirements.`
            };
          }
        }
      } else if (choiceAction.startsWith('bit_merchant') || choiceAction.startsWith('binary_bard')) {
        // Load dialogue for various NPCs
        const newDialogue = dialoguesData.find((d) => d.id === choiceAction);
        if (newDialogue) {
          // Find the NPC who is speaking
          const npc = state.npcs.find(n => n.dialogueId === choiceAction || choiceAction.includes(n.dialogueId));
          return {
            ...state,
            dialogue: {
              speaker: npc?.name || 'Unknown',
              lines: newDialogue.lines,
              currentLineIndex: 0,
            },
          };
        }
      } else if (choiceAction.startsWith('offer_quest_')) {
        // Load quest offering dialogue
        const questId = choiceAction.replace('offer_quest_', '');
        const questDialogue = dialoguesData.find((d) => d.id === `offer_quest_${questId}`);
        if (questDialogue) {
          const npc = state.npcs.find(n => state.dialogue?.speaker === n.name);
          return {
            ...state,
            dialogue: {
              speaker: npc?.name || state.dialogue?.speaker || 'Unknown',
              lines: questDialogue.lines,
              currentLineIndex: 0,
            },
          };
        }
      }
      // Add more dialogue actions as needed
      return state;
    }

    case 'SAVE_GAME': {
      const questManager = QuestManager.getInstance();
  
  // Initialize quests if not already done
  if (questManager.allQuests.length === 0) {
    questManager.initializeQuests();
  }
      const stateWithQuests = {
        ...state,
        questManagerState: questManager.saveState()
      };
      const saveSuccess = SaveGameService.saveGame(stateWithQuests as any);
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

    case 'UPDATE_HOTBAR_CONFIG':
      return { ...state, hotbarConfig: action.payload.hotbarConfig };
    
    case 'OPEN_SHOP':
      return {
        ...state,
        // Close all other panels when opening shop
        showInventory: false,
        showQuestLog: false,
        showCharacterScreen: false,
        showFactionStatus: false,
        shopState: {
          npcId: action.payload.npcId,
          npcName: action.payload.npcName,
          items: action.payload.items,
          playerGold: state.player.gold,
        },
      };
    
    case 'CLOSE_SHOP':
      return { ...state, shopState: null };
    
    case 'BUY_ITEM': {
      if (!state.shopState) return state;
      
      const { itemId, price } = action.payload;
      const shopItem = state.shopState.items.find(si => si.item.id === itemId);
      if (!shopItem || (shopItem.quantity === 0)) {
        return { ...state, notification: 'Item not available!' };
      }
      
      const newPlayer = clonePlayer(state.player);
      if (!newPlayer.removeGold(price)) {
        return { ...state, notification: 'Not enough gold!' };
      }
      
      newPlayer.addItem({ ...shopItem.item });
      
      // Update shop inventory
      const newShopItems = state.shopState.items.map(si => {
        if (si.item.id === itemId && si.quantity > 0) {
          return { ...si, quantity: si.quantity - 1 };
        }
        return si;
      });
      
      return {
        ...state,
        player: newPlayer,
        shopState: {
          ...state.shopState,
          items: newShopItems,
          playerGold: newPlayer.gold,
        },
        notification: `Purchased ${shopItem.item.name} for ${price} gold!`,
      };
    }
    
    case 'SELL_ITEM': {
      if (!state.shopState) return state;
      
      const { itemId, price } = action.payload;
      const newPlayer = clonePlayer(state.player);
      const item = newPlayer.removeItem(itemId);
      
      if (!item) {
        return { ...state, notification: 'You don't have that item!' };
      }
      
      newPlayer.addGold(price);
      
      return {
        ...state,
        player: newPlayer,
        shopState: {
          ...state.shopState,
          playerGold: newPlayer.gold,
        },
        notification: `Sold ${item.name} for ${price} gold!`,
      };
    }

    case 'TELEPORT_PLAYER': {
      const newPlayer = clonePlayer(state.player);
      newPlayer.position = { ...action.payload };
      // Mark surrounding tiles as explored at the new location
      newPlayer.markSurroundingTilesExplored(state.currentMap.id, 3);
      return { ...state, player: newPlayer };
    }

    case 'UPDATE_TIME':
      return {
        ...state,
        timeData: action.payload.timeData,
      };

    case 'SET_TIME_PAUSED':
      return {
        ...state,
        timeData: state.timeData ? {
          ...state.timeData,
          isPaused: action.payload.isPaused,
        } : undefined,
      };

    case 'UPDATE_WEATHER':
      return {
        ...state,
        weatherData: action.payload.weatherData,
      };

    default:
      return state;
  }
};

/**
 * Initializes the default game state.
 */
const initialPlayer = new Player('claude', 'Claude', { x: 10, y: 7 });

// Create a temporary empty map for initial state
const emptyMapData: IGameMap = {
  id: 'loading',
  name: 'Loading...',
  width: 1,
  height: 1,
  tiles: [[{ type: 'floor' as TileType, walkable: true }]],
  entities: [],
  exits: [],
};
const initialMap = new GameMap(emptyMapData);

// Empty arrays for initial state - will be populated when map loads
const initialNpcs: NPC[] = [];
const initialEnemies: Enemy[] = [];
const initialItems: Item[] = [];



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
  hotbarConfig: [null, null, null, null, null], // 5 empty hotbar slots
  shopState: null, // No shop open initially
  timeData: {
    hours: 12, // Start at noon
    minutes: 0,
    isPaused: false,
  },
  factionManager: FactionManager.getInstance(), // Initialize faction manager
  showFactionStatus: false, // Faction status hidden initially
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
  const [isMapLoaded, setIsMapLoaded] = React.useState(false);

  // Initialize QuestManager and check for saved game when the game starts
  React.useEffect(() => {
    const questManager = QuestManager.getInstance();
  
  // Initialize quests if not already done
  if (questManager.allQuests.length === 0) {
    questManager.initializeQuests();
  }
    questManager.initializeQuests();
    
    // Load the initial map asynchronously
    const loadInitialMap = async () => {
      try {
        const mapData = await getMap('terminalTown');
        const newMap = new GameMap(mapData);
        
        // Initialize exploration for the starting area
        state.player.markSurroundingTilesExplored(newMap.id, 3);
        
        // Extract entities from the loaded map
        const npcs = newMap.entities.filter((entity): entity is NPC => 'role' in entity);
        const enemies = newMap.entities.filter((entity): entity is Enemy => 
          'abilities' in entity && Array.isArray(entity.abilities));
        const items = newMap.entities.filter((entity): entity is Item => 
          'type' in entity && typeof entity.type === 'string' && 
          !('role' in entity) && !('abilities' in entity));
        
        // Update the game state with the loaded map
        dispatch({
          type: 'UPDATE_MAP',
          payload: {
            newMap,
            playerNewPosition: { x: 10, y: 7 },
          },
        });
        
        setIsMapLoaded(true);
        
        // Check if there's a saved game after map loads
        if (SaveGameService.hasSaveGame()) {
          dispatch({ 
            type: 'SHOW_NOTIFICATION', 
            payload: { 
              message: 'Save game found! Talk to Compiler Cat to load it.' 
            } 
          });
        }
      } catch (error) {
        console.error('Failed to load initial map:', error);
        dispatch({
          type: 'SHOW_NOTIFICATION',
          payload: { message: 'Failed to load game map' },
        });
      }
    };
    
    loadInitialMap();
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
// Add alias export for useGame as per instruction 2
export const useGame = useGameContext;
// Export types separately using 'export type' for isolatedModules compatibility
export type { GameState, GameAction };