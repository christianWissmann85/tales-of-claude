// src/services/SaveGame.ts

import {
  GameState as IGameState, // Renamed to IGameState to avoid conflict with local GameState interface
  Player as IPlayer,       // Renamed to IPlayer to avoid conflict with Player class
  GameMap as IGameMap,     // Renamed to IGameMap to avoid conflict with GameMap class
  Item,
  Enemy,
  NPC,
  Ability,
  StatusEffect,
  CombatEntity,
  Position, // Needed for Player constructor
} from '../types/global.types';

// Import the actual Player and GameMap classes to reconstruct instances
import { Player } from '../models/Player';
import { GameMap } from '../models/Map';

/**
 * Defines the structure of the GameState when dealing with class instances,
 * extending the base interface from global.types.ts.
 */
interface GameState extends IGameState {
  player: Player;
  currentMap: GameMap;
}

/**
 * A service for storing and loading game state using LocalStorage.
 * It handles serialization/deserialization and reconstruction of class instances.
 */
class SaveGameService {
  private static readonly SAVE_KEY = 'tales-of-claude-save';

  /**
   * Saves the current game state to LocalStorage.
   *
   * @param state The GameState object to save. This object is expected to contain
   *              instances of Player and GameMap classes.
   * @returns True if the save was successful, false otherwise.
   */
  static saveGame(state: GameState): boolean {
    try {
      // When JSON.stringify is called on an object containing class instances,
      // it will only serialize the enumerable properties of those instances,
      // effectively converting them into plain JavaScript objects.
      // Methods are not serialized, which is expected as they will be re-attached on load.
      const jsonState = JSON.stringify(state);
      localStorage.setItem(SaveGameService.SAVE_KEY, jsonState);
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      // This catch block handles potential errors like QuotaExceededError
      // or if localStorage is not available in the environment.
      return false;
    }
  }

  /**
   * Loads the saved game state from LocalStorage.
   * It reconstructs Player and GameMap class instances from the loaded data.
   *
   * @returns The loaded GameState object with reconstructed class instances,
   *          or null if no save exists or loading/parsing fails.
   */
  static loadGame(): GameState | null {
    try {
      const savedData = localStorage.getItem(SaveGameService.SAVE_KEY);
      if (!savedData) {
        return null;
      }

      // Parse the JSON string back into a plain JavaScript object.
      // At this point, parsedState.player and parsedState.currentMap are plain objects,
      // not instances of Player or GameMap classes.
      const parsedState: IGameState = JSON.parse(savedData);

      // --- Reconstruct class instances from parsed data ---

      // 1. Reconstruct Player instance
      // The Player constructor requires id, name, and position.
      // Other properties (stats, inventory, abilities, statusEffects) need to be copied manually
      // because the constructor might initialize them differently or they hold dynamic game state.
      const loadedPlayer = new Player(
        parsedState.player.id,
        parsedState.player.name,
        parsedState.player.position, // Position is a simple object, directly usable
      );
      // Manually copy over all other properties from the parsed plain object to the new instance.
      // This ensures that current HP, EXP, inventory contents, etc., are restored.
      loadedPlayer.statusEffects = parsedState.player.statusEffects.map(se => ({ ...se }));
      loadedPlayer.updateBaseStats(parsedState.player.stats); // Use the new method to update stats
      loadedPlayer.inventory = parsedState.player.inventory.map(item => ({ ...item })); // Deep copy items in inventory
      loadedPlayer.abilities = parsedState.player.abilities.map(ability => ({ ...ability })); // Deep copy abilities

      // 2. Reconstruct GameMap instance
      // The GameMap constructor expects an IGameMap (or MapData) object, which the parsed currentMap already is.
      const loadedMap = new GameMap(parsedState.currentMap);

      // 3. Assemble the final GameState object.
      // We spread the parsedState to get all top-level properties, then override
      // 'player' and 'currentMap' with our reconstructed class instances.
      // For arrays and nested objects (like enemies, npcs, items, dialogue, battle, gameFlags),
      // it's good practice to create new references (e.g., using .map() or spread syntax)
      // to ensure immutability, even if their contents are simple data objects.
      const finalGameState: GameState = {
        ...parsedState, // Copy all top-level properties from the parsed data
        player: loadedPlayer, // Override with the reconstructed Player instance
        currentMap: loadedMap, // Override with the reconstructed GameMap instance
        // Ensure arrays and nested objects are new references for immutability
        enemies: parsedState.enemies.map(e => ({ ...e })),
        npcs: parsedState.npcs.map(n => ({ ...n })),
        items: parsedState.items.map(i => ({ ...i })),
        gameFlags: { ...parsedState.gameFlags }, // Shallow copy for flags record
        dialogue: parsedState.dialogue ? { ...parsedState.dialogue } : null,
        battle: parsedState.battle ? {
            ...parsedState.battle,
            player: { ...parsedState.battle.player }, // CombatEntity player
            enemies: parsedState.battle.enemies.map(e => ({ ...e })), // CombatEntity enemies
            log: [...parsedState.battle.log], // Copy log array
            turnOrder: [...parsedState.battle.turnOrder], // Copy turnOrder array
        } : null,
      };

      return finalGameState;

    } catch (error) {
      console.error('Failed to load game or parse data:', error);
      // If parsing fails, the saved data might be corrupted.
      // It's safer to remove it so the game doesn't try to load it again.
      localStorage.removeItem(SaveGameService.SAVE_KEY);
      return null;
    }
  }

  /**
   * Checks if a saved game exists in LocalStorage.
   *
   * @returns True if a save exists (key is present and not empty), false otherwise.
   */
  static hasSaveGame(): boolean {
    try {
      const savedData = localStorage.getItem(SaveGameService.SAVE_KEY);
      return savedData !== null && savedData.length > 0;
    } catch (error) {
      console.error('Error checking for save game:', error);
      // If localStorage is inaccessible, assume no save exists.
      return false;
    }
  }

  /**
   * Deletes the saved game from LocalStorage.
   */
  static deleteSave(): void {
    try {
      localStorage.removeItem(SaveGameService.SAVE_KEY);
    } catch (error) {
      console.error('Failed to delete save game:', error);
      // This catch block handles potential errors if localStorage is inaccessible.
    }
  }
}

export default SaveGameService;