// src/services/SaveGame.ts

import { Item, ItemVariant } from '../models/Item';
import { Player } from '../models/Player';
import { TalentTree, Talent } from '../models/TalentTree'; // Import Talent for type checking
import {
  GameState as IGameState,
  Position,
  Enemy,
  NPC,
  Ability,
  StatusEffect,
  PlayerStats,
  EquippableItem,
  CombatEntity,
  DialogueState,
  BattleState,
  Quest,
  CombatLogEntry,
  GameMap as IGameMap,
  Exit,
  Tile,
  TileType,
  Item as IItem, // Alias Item from global.types to avoid conflict with models/Item
  WeatherType,
  WeatherData
} from '../types/global.types';
import { GameMap } from '../models/Map';

/**
 * Defines the actual game state with class instances.
 */
interface GameState extends IGameState {
  player: Player;
  currentMap: GameMap;
  items: Item[];
}

/**
 * Key for storing the save game data in localStorage.
 */
const SAVE_GAME_KEY = 'talesOfClaudeSaveGame';

/**
 * Defines the serializable structure for an Item.
 * We only need to store the variant and position to reconstruct it.
 */
interface SerializableItem {
  variant: ItemVariant;
  position?: Position; // Only present if the item is on the map
}

/**
 * Defines the serializable structure for an EquippableItem.
 * We only need to store the variant to reconstruct it.
 */
interface SerializableEquippableItem {
  variant: ItemVariant;
}

/**
 * Defines the serializable structure for a Talent's state.
 * We only need to store its ID and current rank.
 */
interface SerializableTalentState {
  id: string;
  currentRank: number;
}

/**
 * Defines the serializable structure for the Player class.
 * This flattens class instances into data that can be JSON.stringified.
 */
interface SerializablePlayer {
  id: string;
  name: string;
  position: Position;
  statusEffects: StatusEffect[];
  _baseStats: PlayerStats; // Store the base stats directly
  inventory: SerializableItem[]; // Inventory stores serializable items
  abilities: Ability[];
  weaponSlot?: SerializableEquippableItem; // Equipped items store serializable items
  armorSlot?: SerializableEquippableItem;
  accessorySlot?: SerializableEquippableItem;
  activeQuestIds: string[];
  completedQuestIds: string[];
  talentTree: {
    talents: SerializableTalentState[]; // Store talent states (id and rank)
    _availablePoints: number; // Store available points in the talent tree
  };
  talentPoints: number; // Player's master talent points
  exploredMaps?: { [mapId: string]: string[] }; // Serialized exploration data
}

/**
 * Defines the serializable structure for entities on the map.
 * Items need to be converted to SerializableItem.
 */
type SerializableMapEntity = Enemy | NPC | SerializableItem;

/**
 * Defines the complete serializable GameState structure.
 * This is the interface for the data that will be stored in localStorage.
 */
interface SerializableGameState {
  player: SerializablePlayer;
  currentMap: {
    id: string;
    name: string;
    width: number;
    height: number;
    tiles: Tile[][];
    entities: SerializableMapEntity[]; // Map entities can be enemies, NPCs, or serializable items
    exits: Exit[];
  };
  enemies: Enemy[]; // Dynamic list of enemies currently active on the map
  npcs: NPC[]; // Dynamic list of NPCs currently active on the map
  items: SerializableItem[]; // Dynamic list of items currently active on the map (e.g., dropped loot)
  dialogue: DialogueState | null;
  battle: BattleState | null;
  gameFlags: Record<string, boolean | number | string>;
  showInventory: boolean;
  showQuestLog: boolean;
  showCharacterScreen: boolean;
  notification: string | null;
  questManagerState?: any; // Quest manager state for saving/loading
  hotbarConfig: (string | null)[]; // Array of item IDs in hotbar slots
  timeData?: {
    hours: number;
    minutes: number;
    isPaused: boolean;
  };
  weatherData?: WeatherData;
}

/**
 * Service for managing game saves and loads using localStorage.
 */
class SaveGameService {

  /**
   * Saves the current game state to localStorage.
   * @param gameState The current GameState object to save.
   */
  static saveGame(gameState: GameState): boolean {
    try {
      const serializableGameState: SerializableGameState = {
        player: {
          id: gameState.player.id,
          name: gameState.player.name,
          position: gameState.player.position,
          statusEffects: gameState.player.statusEffects,
          _baseStats: gameState.player.getBaseStats(), // Get base stats for saving
          inventory: gameState.player.inventory.map(item => ({
            variant: item.id as ItemVariant, // Item.id is the ItemVariant string
            position: item.position // Keep position if it's an item on the map
          })),
          abilities: gameState.player.abilities,
          weaponSlot: gameState.player.weaponSlot ? { variant: gameState.player.weaponSlot.id as ItemVariant } : undefined,
          armorSlot: gameState.player.armorSlot ? { variant: gameState.player.armorSlot.id as ItemVariant } : undefined,
          accessorySlot: gameState.player.accessorySlot ? { variant: gameState.player.accessorySlot.id as ItemVariant } : undefined,
          activeQuestIds: gameState.player.activeQuestIds,
          completedQuestIds: gameState.player.completedQuestIds,
          talentTree: {
            talents: Array.from(gameState.player.talentTree.getAllTalents().values()).map(talent => ({
              id: talent.id,
              currentRank: talent.currentRank,
            })),
            _availablePoints: gameState.player.talentTree.availablePoints,
          },
          talentPoints: gameState.player.talentPoints,
          exploredMaps: gameState.player.exploredMaps ? 
            Object.fromEntries(
              Array.from(gameState.player.exploredMaps.entries()).map(([mapId, tiles]) => [
                mapId,
                Array.from(tiles)
              ])
            ) : undefined,
        },
        currentMap: {
          ...gameState.currentMap,
          entities: gameState.currentMap.entities.map(entity => {
            if ('use' in entity && typeof entity.use === 'function') { // Check if it's an Item instance
              return { variant: (entity as Item).id as ItemVariant, position: (entity as Item).position } as SerializableItem;
            }
            return entity; // Enemies and NPCs are already serializable
          }) as SerializableMapEntity[],
        },
        enemies: gameState.enemies,
        npcs: gameState.npcs,
        items: gameState.items.map(item => ({
          variant: item.id as ItemVariant,
          position: item.position
        })),
        dialogue: gameState.dialogue,
        battle: gameState.battle,
        gameFlags: gameState.gameFlags,
        showInventory: gameState.showInventory,
        showQuestLog: gameState.showQuestLog,
        showCharacterScreen: gameState.showCharacterScreen,
        notification: gameState.notification,
        questManagerState: gameState.questManagerState,
        hotbarConfig: gameState.hotbarConfig,
        timeData: gameState.timeData,
        weatherData: gameState.weatherData,
      };

      localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(serializableGameState));
      console.log('Game saved successfully!');
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded. Cannot save game.');
        alert('Save game failed: Storage limit reached. Please clear some space or delete old saves.');
      }
      return false;
    }
  }

  /**
   * Loads the game state from localStorage.
   * @returns The reconstructed GameState object, or null if no save game exists or an error occurs.
   */
  static loadGame(): GameState | null {
    try {
      const savedData = localStorage.getItem(SAVE_GAME_KEY);
      if (!savedData) {
        console.log('No save game found.');
        return null;
      }

      const serializableGameState: SerializableGameState = JSON.parse(savedData);

      // 1. Reconstruct Player
      const playerSaveData = serializableGameState.player;
      const player = new Player(playerSaveData.id, playerSaveData.name, playerSaveData.position);

      // Set base stats
      player.updateBaseStats(playerSaveData._baseStats);

      // Reconstruct inventory items
      player.inventory = playerSaveData.inventory.map(sItem => {
        try {
          // Ensure the variant is a valid ItemVariant enum member
          if (Object.values(ItemVariant).includes(sItem.variant)) {
            return Item.createItem(sItem.variant, sItem.position);
          } else {
            console.warn(`Invalid item variant "${sItem.variant}" found in inventory. Skipping.`);
            return null;
          }
        } catch (e) {
          console.warn(`Error reconstructing inventory item "${sItem.variant}":`, e);
          return null;
        }
      }).filter(item => item !== null) as Item[]; // Filter out nulls and assert type

      // Reconstruct equipped items
      if (playerSaveData.weaponSlot) {
        try {
          if (Object.values(ItemVariant).includes(playerSaveData.weaponSlot.variant)) {
            const weapon = Item.createItem(playerSaveData.weaponSlot.variant) as EquippableItem;
            player.equip(weapon); // equip handles adding to slot and removing from inventory
          } else {
            console.warn(`Invalid weapon variant "${playerSaveData.weaponSlot.variant}" found. Skipping.`);
          }
        } catch (e) {
          console.warn(`Error reconstructing weapon "${playerSaveData.weaponSlot.variant}":`, e);
        }
      }
      if (playerSaveData.armorSlot) {
        try {
          if (Object.values(ItemVariant).includes(playerSaveData.armorSlot.variant)) {
            const armor = Item.createItem(playerSaveData.armorSlot.variant) as EquippableItem;
            player.equip(armor);
          } else {
            console.warn(`Invalid armor variant "${playerSaveData.armorSlot.variant}" found. Skipping.`);
          }
        } catch (e) {
          console.warn(`Error reconstructing armor "${playerSaveData.armorSlot.variant}":`, e);
        }
      }
      if (playerSaveData.accessorySlot) {
        try {
          if (Object.values(ItemVariant).includes(playerSaveData.accessorySlot.variant)) {
            const accessory = Item.createItem(playerSaveData.accessorySlot.variant) as EquippableItem;
            player.equip(accessory);
          } else {
            console.warn(`Invalid accessory variant "${playerSaveData.accessorySlot.variant}" found. Skipping.`);
          }
        } catch (e) {
          console.warn(`Error reconstructing accessory "${playerSaveData.accessorySlot.variant}":`, e);
        }
      }

      // Reconstruct TalentTree state
      // First, reset the player's talent tree to a clean state
      player.talentTree.resetTalents(); // This also refunds points to talentTree._availablePoints
      // Then, set the player's talent points and the talent tree's available points
      player.talentPoints = playerSaveData.talentPoints;
      // The TalentTree's internal _availablePoints needs to be set directly for loading
      // as player.spendTalentPoint will decrement player.talentPoints, not talentTree.availablePoints
      // We need to ensure talentTree.availablePoints is also correctly set for internal logic.
      // However, the prompt implies using player.spendTalentPoint, which manages player.talentPoints.
      // The talentTree.resetTalents() call already sets talentTree._availablePoints to the sum of spent points.
      // We need to ensure the _availablePoints on the TalentTree matches the saved state.
      // Let's directly set the internal _availablePoints of the talent tree.
      (player.talentTree as any)._availablePoints = playerSaveData.talentTree._availablePoints;


      // Now, invest points into talents based on saved ranks
      for (const savedTalent of playerSaveData.talentTree.talents) {
        const talentInTree = player.talentTree.getTalent(savedTalent.id);
        if (talentInTree) {
          // Invest points one by one until currentRank matches savedRank
          // This ensures player.talentPoints is decremented correctly
          for (let i = talentInTree.currentRank; i < savedTalent.currentRank; i++) {
            // We need to temporarily bypass the player.talentPoints check in player.spendTalentPoint
            // or directly manipulate the talent's rank and player's points.
            // The prompt asks to "recreates by investing points".
            // If player.spendTalentPoint is used, it will decrement player.talentPoints.
            // So, we should ensure player.talentPoints is sufficient *before* this loop,
            // or adjust it after.
            // Let's adjust player.talentPoints *after* setting the talent ranks directly,
            // then ensure the talentTree's available points are correct.

            // Option 1: Directly set talent rank and adjust player.talentPoints
            // This is simpler and avoids complex logic with spendTalentPoint during load.
            talentInTree.currentRank = savedTalent.currentRank;
          }
        } else {
          console.warn(`Talent "${savedTalent.id}" not found during load. Skipping.`);
        }
      }
      // After setting all talent ranks, the player.talentPoints should be what's left.
      // The talentTree._availablePoints should also be set from the save data.
      // The player.talentPoints was already set above.
      // The talentTree._availablePoints was also set above.
      // This approach ensures the state is directly loaded, rather than re-simulating point spending.
      // The prompt's "recreates by investing points" might imply a loop of `spendTalentPoint`,
      // but that would require careful management of `player.talentPoints` during the loop.
      // Directly setting `currentRank` and then `_availablePoints` is more robust for loading.
      // Let's re-read: "recreates by investing points during load". This implies calling `spendTalentPoint`.
      // To do this, we need to ensure `player.talentPoints` is high enough temporarily.
      // Let's try this:
      player.talentPoints = playerSaveData.talentPoints; // Set initial available points
      (player.talentTree as any)._availablePoints = playerSaveData.talentTree._availablePoints; // Set initial available points in tree

      // Now, for each talent, invest points one by one.
      // This will decrement player.talentPoints and talentTree._availablePoints correctly.
      for (const savedTalent of playerSaveData.talentTree.talents) {
        const talentInTree = player.talentTree.getTalent(savedTalent.id);
        if (talentInTree) {
          // Invest points until currentRank matches savedRank
          while (talentInTree.currentRank < savedTalent.currentRank) {
            // Temporarily increase player's talent points to allow spending if needed for load
            // This is a hack to satisfy the `spendTalentPoint` method's check
            // without actually giving the player extra points.
            player.talentPoints++;
            const success = player.spendTalentPoint(savedTalent.id);
            if (!success) {
              console.warn(`Failed to invest point in talent "${savedTalent.id}" during load. Current rank: ${talentInTree.currentRank}, Target rank: ${savedTalent.currentRank}`);
              player.talentPoints--; // Revert the temporary increase if it failed
              break; // Stop trying to invest in this talent
            }
          }
        } else {
          console.warn(`Talent "${savedTalent.id}" not found during load. Skipping.`);
        }
      }
      // After this loop, player.talentPoints and talentTree._availablePoints should reflect the saved state.


      // Copy other player properties
      player.abilities = playerSaveData.abilities;
      player.statusEffects = playerSaveData.statusEffects;
      player.activeQuestIds = playerSaveData.activeQuestIds;
      player.completedQuestIds = playerSaveData.completedQuestIds;
      
      // Restore exploration data
      if (playerSaveData.exploredMaps) {
        player.exploredMaps = new Map();
        Object.entries(playerSaveData.exploredMaps).forEach(([mapId, tiles]) => {
          player.exploredMaps.set(mapId, new Set(tiles));
        });
      }


      // 2. Reconstruct currentMap entities
      const reconstructedMapEntities = serializableGameState.currentMap.entities.map(entity => {
        if ('variant' in entity && typeof entity.variant === 'string') { // Check if it's a SerializableItem
          try {
            if (Object.values(ItemVariant).includes(entity.variant)) {
              return Item.createItem(entity.variant, entity.position);
            } else {
              console.warn(`Invalid item variant "${entity.variant}" found on map. Skipping.`);
              return null;
            }
          } catch (e) {
            console.warn(`Error reconstructing map item "${entity.variant}":`, e);
            return null;
          }
        }
        return entity; // Enemies and NPCs are already fine
      }).filter(entity => entity !== null) as (Enemy | NPC | Item)[]; // Filter out nulls and assert type

      const currentMap = new GameMap({
        ...serializableGameState.currentMap,
        entities: reconstructedMapEntities,
      });

      // 3. Reconstruct dynamic items on the map
      const reconstructedItems = serializableGameState.items.map(sItem => {
        try {
          if (Object.values(ItemVariant).includes(sItem.variant)) {
            return Item.createItem(sItem.variant, sItem.position);
          } else {
            console.warn(`Invalid item variant "${sItem.variant}" found in dynamic items. Skipping.`);
            return null;
          }
        } catch (e) {
          console.warn(`Error reconstructing dynamic item "${sItem.variant}":`, e);
          return null;
        }
      }).filter(item => item !== null) as Item[]; // Filter out nulls and assert type

      // 4. Assemble the full GameState
      const loadedGameState: GameState = {
        player: player,
        currentMap: currentMap,
        enemies: serializableGameState.enemies,
        npcs: serializableGameState.npcs,
        items: reconstructedItems,
        dialogue: serializableGameState.dialogue,
        battle: serializableGameState.battle,
        gameFlags: serializableGameState.gameFlags,
        showInventory: serializableGameState.showInventory,
        showQuestLog: serializableGameState.showQuestLog,
        showCharacterScreen: serializableGameState.showCharacterScreen || false,
        notification: serializableGameState.notification,
        questManagerState: serializableGameState.questManagerState,
        hotbarConfig: serializableGameState.hotbarConfig || [null, null, null, null, null],
        timeData: serializableGameState.timeData,
        weatherData: serializableGameState.weatherData,
      };

      console.log('Game loaded successfully!');
      return loadedGameState;

    } catch (error) {
      console.error('Failed to load game:', error);
      // Clear corrupted save data if parsing fails
      SaveGameService.deleteSave();
      alert('Failed to load game. Save data might be corrupted and has been deleted.');
      return null;
    }
  }

  /**
   * Checks if a save game exists in localStorage.
   * @returns True if a save game is found, false otherwise.
   */
  static hasSaveGame(): boolean {
    return localStorage.getItem(SAVE_GAME_KEY) !== null;
  }

  /**
   * Deletes the save game from localStorage.
   */
  static deleteSave(): void {
    try {
      localStorage.removeItem(SAVE_GAME_KEY);
      console.log('Save game deleted successfully!');
    } catch (error) {
      console.error('Failed to delete save game:', error);
    }
  }
}

export default SaveGameService;
