/**
 * @file src/engine/PuzzleSystem.ts
 * @description Manages the state and logic for environmental puzzles within the game.
 * This system tracks puzzle states on a per-map basis, supports various puzzle
 * types, and handles saving, loading, and resetting puzzle progress.
 */

// --- TYPE DEFINITIONS ---

/**
 * Represents a 2D coordinate in the game world.
 * Assumed to be defined elsewhere in the project, included here for completeness.
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * State for a push block puzzle.
 * Tracks the positions of movable blocks and the puzzle's solved status.
 */
export interface PushBlockPuzzleState {
  type: 'pushBlock';
  /** Current positions of all blocks associated with this puzzle. */
  blockPositions: Position[];
  /** Whether the puzzle is currently solved (e.g., all plates are active). */
  isSolved: boolean;
}

/**
 * State for a switch sequence puzzle.
 * Tracks the sequence of activated switches.
 */
export interface SwitchSequencePuzzleState {
  type: 'switchSequence';
  /** An ordered list of switch IDs that have been activated by the player. */
  activatedSequence: string[];
  /** Whether the puzzle is currently solved (i.e., the correct sequence was entered). */
  isSolved: boolean;
}

/**
 * State for a code arrangement puzzle.
 * Tracks the current arrangement of items (e.g., runes, dials).
 */
export interface CodeArrangementPuzzleState {
  type: 'codeArrangement';
  /** An ordered list of item IDs representing the player's current arrangement. */
  currentArrangement: string[];
  /** Whether the puzzle is currently solved (i.e., the arrangement is correct). */
  isSolved: boolean;
}

/**
 * A discriminated union representing the state of any possible puzzle.
 * The `type` property is used to determine the specific puzzle logic to apply.
 */
export type PuzzleState =
  | PushBlockPuzzleState
  | SwitchSequencePuzzleState
  | CodeArrangementPuzzleState;

/**
 * The serializable data structure for saving the puzzle system's state.
 * Maps are converted to Records for JSON compatibility.
 * The outer key is the mapId, the inner key is the puzzleId.
 */
export type PuzzleSystemSaveData = Record<string, Record<string, PuzzleState>>;


// --- PUZZLE SYSTEM CLASS ---

/**
 * Manages all environmental puzzles in the game.
 *
 * This class is responsible for:
 * - Registering puzzles with their initial states when a map is defined.
 * - Tracking the current, modified state of puzzles as the player interacts with them.
 * - Providing methods to update and query puzzle states in a type-safe manner.
 * - Handling serialization for saving and loading game progress.
 * - Resetting puzzles to their initial state.
 */
export class PuzzleSystem {
  /**
   * Stores the initial, unmodified state of all registered puzzles.
   * Used as a blueprint and for resetting puzzles.
   * Map<mapId, Map<puzzleId, PuzzleState>>
   */
  private puzzleDefinitions: Map<string, Map<string, PuzzleState>> = new Map();

  /**
   * Stores the current, in-progress state of all puzzles.
   * This is the state that gets modified during gameplay and is saved.
   * Map<mapId, Map<puzzleId, PuzzleState>>
   */
  private currentPuzzleStates: Map<string, Map<string, PuzzleState>> = new Map();

  /**
   * Registers a new puzzle with the system.
   * This should be called during map setup or game initialization.
   * It stores the puzzle's initial state, which is used for resetting.
   *
   * @param mapId - The ID of the map the puzzle belongs to.
   * @param puzzleId - A unique identifier for the puzzle within the map.
   * @param initialState - The starting state of the puzzle.
   */
  public registerPuzzle(mapId: string, puzzleId: string, initialState: PuzzleState): void {
    if (!this.puzzleDefinitions.has(mapId)) {
      this.puzzleDefinitions.set(mapId, new Map());
    }
    const mapPuzzles = this.puzzleDefinitions.get(mapId)!;

    if (mapPuzzles.has(puzzleId)) {
      console.warn(`[PuzzleSystem] Puzzle with ID '${puzzleId}' on map '${mapId}' is already registered. Overwriting definition.`);
    }
    
    // Use structuredClone to ensure the initial state is a deep copy
    mapPuzzles.set(puzzleId, structuredClone(initialState));
  }

  /**
   * Retrieves the current state of a specific puzzle.
   * If the puzzle has not been interacted with yet, it clones the initial state.
   *
   * @param mapId - The ID of the map.
   * @param puzzleId - The ID of the puzzle.
   * @returns The current PuzzleState, or undefined if the puzzle is not registered.
   */
  public getPuzzleState(mapId: string, puzzleId: string): PuzzleState | undefined {
    // Ensure the map's puzzle state container exists in the current states
    if (!this.currentPuzzleStates.has(mapId)) {
      this.currentPuzzleStates.set(mapId, new Map());
    }
    const currentMapStates = this.currentPuzzleStates.get(mapId)!;

    // If the puzzle isn't in the current state, it means it hasn't been touched yet.
    // We should initialize it from its definition.
    if (!currentMapStates.has(puzzleId)) {
      const definitionMap = this.puzzleDefinitions.get(mapId);
      const definition = definitionMap?.get(puzzleId);

      if (!definition) {
        console.error(`[PuzzleSystem] Attempted to get state for unregistered puzzle: '${puzzleId}' on map '${mapId}'.`);
        return undefined;
      }
      // Clone the definition to create the initial current state
      const initialStateCopy = structuredClone(definition);
      currentMapStates.set(puzzleId, initialStateCopy);
    }

    return currentMapStates.get(puzzleId);
  }

  /**
   * Updates the state of a puzzle.
   * It's recommended to use the more specific update methods like `moveBlock`
   * for better type safety, but this provides a general-purpose update mechanism.
   *
   * @param mapId - The ID of the map.
   * @param puzzleId - The ID of the puzzle.
   * @param newState - The new state object for the puzzle.
   */
  public updatePuzzleState(mapId: string, puzzleId: string, newState: PuzzleState): void {
    const state = this.getPuzzleState(mapId, puzzleId);
    if (!state) {
      // getPuzzleState already logs an error for unregistered puzzles
      return;
    }
    
    if (state.type !== newState.type) {
        console.error(`[PuzzleSystem] Type mismatch when updating puzzle '${puzzleId}'. Expected '${state.type}', got '${newState.type}'.`);
        return;
    }

    this.currentPuzzleStates.get(mapId)!.set(puzzleId, newState);
  }

  /**
   * Checks if a specific puzzle is solved.
   *
   * @param mapId - The ID of the map.
   * @param puzzleId - The ID of the puzzle.
   * @returns `true` if the puzzle is solved, `false` otherwise.
   */
  public isPuzzleSolved(mapId: string, puzzleId: string): boolean {
    const state = this.getPuzzleState(mapId, puzzleId);
    return state?.isSolved ?? false;
  }

  /**
   * Resets a single puzzle on a given map to its initial registered state.
   *
   * @param mapId - The ID of the map.
   * @param puzzleId - The ID of the puzzle to reset.
   */
  public resetPuzzle(mapId: string, puzzleId: string): void {
    const definition = this.puzzleDefinitions.get(mapId)?.get(puzzleId);

    if (!definition) {
      console.error(`[PuzzleSystem] Cannot reset puzzle: No definition found for '${puzzleId}' on map '${mapId}'.`);
      return;
    }

    // Get or create the map state container
    if (!this.currentPuzzleStates.has(mapId)) {
        this.currentPuzzleStates.set(mapId, new Map());
    }
    const currentMapStates = this.currentPuzzleStates.get(mapId)!;

    // Reset by cloning the original definition
    currentMapStates.set(puzzleId, structuredClone(definition));
    console.log(`[PuzzleSystem] Puzzle '${puzzleId}' on map '${mapId}' has been reset.`);
  }

  /**
   * Resets all puzzles on a specific map to their initial states.
   *
   * @param mapId - The ID of the map whose puzzles should be reset.
   */
  public resetMapPuzzles(mapId: string): void {
    const mapDefinitions = this.puzzleDefinitions.get(mapId);
    if (!mapDefinitions) {
      // No puzzles defined for this map, so nothing to do.
      return;
    }

    // Overwrite the current states for this map with a fresh clone of its definitions
    this.currentPuzzleStates.set(mapId, structuredClone(mapDefinitions));
    console.log(`[PuzzleSystem] All puzzles on map '${mapId}' have been reset.`);
  }

  /**
   * Generates a serializable object representing the current state of all puzzles.
   * This data should be included in the main game save file.
   *
   * @returns A `PuzzleSystemSaveData` object.
   */
  public getSaveData(): PuzzleSystemSaveData {
    const saveData: PuzzleSystemSaveData = {};
    for (const [mapId, puzzles] of this.currentPuzzleStates.entries()) {
      // Convert the inner Map to a Record<string, PuzzleState>
      saveData[mapId] = Object.fromEntries(puzzles.entries());
    }
    return saveData;
  }

  /**
   * Loads the puzzle system's state from a save data object.
   * This will overwrite all current puzzle states.
   *
   * @param data - The `PuzzleSystemSaveData` to load.
   */
  public loadSaveData(data: PuzzleSystemSaveData): void {
    // Clear existing states before loading
    this.currentPuzzleStates.clear();

    for (const mapId in data) {
      if (Object.prototype.hasOwnProperty.call(data, mapId)) {
        const mapPuzzlesRecord = data[mapId];
        // Convert the loaded Record back into a Map
        const mapPuzzlesMap = new Map(Object.entries(mapPuzzlesRecord));
        this.currentPuzzleStates.set(mapId, mapPuzzlesMap);
      }
    }
    console.log('[PuzzleSystem] Puzzle data loaded successfully.');
  }
}