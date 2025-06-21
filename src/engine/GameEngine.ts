// src/engine/GameEngine.ts

// Import types from global.types.ts
import {
  Position,
  Direction,
  Tile,
  GameMap as IGameMap, // Renamed to avoid conflict with GameMap class
  NPC,
  Item,
  Exit,
  DialogueState, // Import DialogueState
  DialogueOption, // Import DialogueOption
} from '../types/global.types';

// 1. Add import for Enemy model from '../models/Enemy'
import { Enemy } from '../models/Enemy';

// Import GameState and action types from context/GameContext.tsx
import { GameState, GameAction } from '../context/GameContext';

// Import Player and GameMap classes as they are used in GameState
import { Player } from '../models/Player';
import { GameMap } from '../models/Map'; // Assuming GameMap class exists and is imported by GameContext

// 1. Import dialogue data from '../assets/dialogues.json'
import dialoguesData from '../assets/dialogues.json';

// Define interfaces for the imported dialogue data structure to match dialogues.json
interface DialogueLineData {
  text: string;
  choices?: DialogueOption[]; // Choices are optional and appear on the last line
}

interface DialogueEntryData {
  id: string;
  lines: DialogueLineData[];
}

/**
 * GameEngine class implementing the core game loop and orchestration.
 * It interacts with the game state via a dispatch function and receives state updates.
 *
 * This engine is designed to be decoupled from React's rendering cycle.
 * It reads the current game state via `setGameState` and dispatches actions
 * to request state changes, which then trigger React re-renders.
 */
export class GameEngine {
  private _dispatch: React.Dispatch<GameAction>;
  private _currentGameState: GameState; // Snapshot of the current game state
  private _animationFrameId: number | null = null;
  private _lastTimestamp: DOMHighResTimeStamp = 0;
  private _isRunning: boolean = false;

  // FPS tracking
  private _fps: number = 0;
  private _frameCounter: number = 0;
  private _lastFpsUpdateTime: DOMHighResTimeStamp = 0;

  // Input handling
  private _pressedKeys: Set<string> = new Set();
  private _lastProcessedMovementDirection: Direction | null = null; // To prevent rapid movement dispatches
  private _movementCooldown: number = 150; // milliseconds between player movements
  private _lastMovementTime: DOMHighResTimeStamp = 0;
  private _interactionCooldown: number = 300; // milliseconds between interaction attempts
  private _lastInteractionTime: DOMHighResTimeStamp = 0;


  constructor(dispatch: React.Dispatch<GameAction>, initialState: GameState) {
    this._dispatch = dispatch;
    this._currentGameState = initialState; // Initialize with the initial state
  }

  /**
   * Updates the internal snapshot of the game state.
   * This method should be called by the React component managing the engine
   * whenever the GameContext state changes, ensuring the engine always operates
   * on the latest game state.
   * @param newState The latest game state from the context.
   */
  public setGameState(newState: GameState): void {
    this._currentGameState = newState;
  }

  /**
   * The main game loop, called by requestAnimationFrame.
   * It calculates deltaTime, processes input, updates game logic, and tracks FPS.
   * @param timestamp The DOMHighResTimeStamp provided by requestAnimationFrame.
   */
  private _gameLoop = (timestamp: DOMHighResTimeStamp): void => {
    // 4. The start of _gameLoop to confirm it's running
    console.log('GameEngine: _gameLoop running.');

    if (!this._isRunning) {
      return;
    }

    const deltaTime = timestamp - this._lastTimestamp;
    this._lastTimestamp = timestamp;

    // Process input (which might dispatch actions)
    // Note: _processInput is already called here. The request is to also call it in `update`.
    this._processInput(); 

    // Update game logic
    this.update(deltaTime);

    // Render the game (placeholder, actual rendering is done by React components)
    this.render();

    // Track FPS
    this._trackFPS(timestamp);

    // Request next frame
    this._animationFrameId = requestAnimationFrame(this._gameLoop);
  };

  /**
   * Starts the game loop.
   * Initializes timestamps and requests the first animation frame.
   */
  public start(): void {
    if (this._isRunning) {
      console.warn('GameEngine is already running.');
      return;
    }
    this._isRunning = true;
    this._lastTimestamp = performance.now();
    this._lastFpsUpdateTime = performance.now();
    this._animationFrameId = requestAnimationFrame(this._gameLoop);
    console.log('GameEngine started.');
  }

  /**
   * Stops the game loop and cleans up resources.
   * Cancels the animation frame request and resets internal state.
   */
  public stop(): void {
    if (!this._isRunning) {
      console.warn('GameEngine is not running.');
      return;
    }
    this._isRunning = false;
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
    this._lastTimestamp = 0;
    this._fps = 0;
    this._frameCounter = 0;
    this._lastFpsUpdateTime = 0;
    this._pressedKeys.clear();
    this._lastProcessedMovementDirection = null;
    this._lastMovementTime = 0;
    this._lastInteractionTime = 0;
    console.log('GameEngine stopped.');
  }

  /**
   * Receives and stores the current set of pressed keyboard keys.
   * This method is expected to be called by an external input handler (e.g., a React hook).
   * @param keys A Set of currently pressed keyboard event codes (e.g., 'KeyW', 'Space').
   */
  public handleKeyboardInput(keys: Set<string>): void {
    // 1. handleKeyboardInput - log the keys being received
    console.log('GameEngine: handleKeyboardInput received keys:', Array.from(keys));
    this._pressedKeys = new Set(keys); // Take a snapshot of the keys
  }

  /**
   * Processes the current keyboard input state to trigger game actions.
   * This method is called once per game loop iteration.
   */
  private _processInput(): void {
    // 2. _processInput - log when it's called
    console.log('GameEngine: _processInput called.');
    const now = performance.now();

    // Movement input
    const currentDirection = this._getDirectionFromKeys(this._pressedKeys);
    // 2. _processInput - log what direction is detected
    console.log('GameEngine: _processInput detected direction:', currentDirection);

    if (currentDirection && now - this._lastMovementTime > this._movementCooldown) {
      // Only process movement if a new direction is pressed or if the same direction is held after cooldown
      if (currentDirection !== this._lastProcessedMovementDirection || this._lastMovementTime === 0) {
        this.processMovement(currentDirection);
        this._lastMovementTime = now;
        this._lastProcessedMovementDirection = currentDirection;
      }
    } else if (!currentDirection) {
      // Reset last processed direction if no directional key is pressed
      this._lastProcessedMovementDirection = null;
    }

    // 2. In handleKeyboardInput, check for interaction keys (space/enter)
    if (this._isAnyOfKeysPressed(this._pressedKeys, ['Space', 'Enter'])) {
      if (now - this._lastInteractionTime > this._interactionCooldown) {
        this.checkInteractions(); // Call the general interaction handler
        this._lastInteractionTime = now;
      }
    }
    // Add other input types here (e.g., menu, cancel)
  }

  /**
   * Helper to determine the current cardinal direction based on pressed keys.
   * This logic is similar to what might be found in a `useKeyboard` hook.
   * @param keys The set of currently pressed key codes.
   * @returns The determined Direction ('up', 'down', 'left', 'right') or null if ambiguous or no directional keys are pressed.
   */
  private _getDirectionFromKeys(keys: Set<string>): Direction | null {
    const UP_KEYS = ['ArrowUp', 'KeyW'];
    const DOWN_KEYS = ['ArrowDown', 'KeyS'];
    const LEFT_KEYS = ['ArrowLeft', 'KeyA'];
    const RIGHT_KEYS = ['ArrowRight', 'KeyD'];

    const isAnyOfKeysPressed = (keyGroup: string[]) => keyGroup.some(key => keys.has(key));

    const upActive = isAnyOfKeysPressed(UP_KEYS);
    const downActive = isAnyOfKeysPressed(DOWN_KEYS);
    const leftActive = isAnyOfKeysPressed(LEFT_KEYS);
    const rightActive = isAnyOfKeysPressed(RIGHT_KEYS);

    // Prioritize single cardinal directions
    if (upActive && !downActive && !leftActive && !rightActive){ return 'up'; }
    if (downActive && !upActive && !leftActive && !rightActive){ return 'down'; }
    if (leftActive && !rightActive && !upActive && !downActive){ return 'left'; }
    if (rightActive && !leftActive && !upActive && !downActive){  return 'right'; }

    return null; // No clear single direction or conflicting directions
  }

  /**
   * Helper to check if any key from a given list is currently pressed.
   * @param currentKeys The set of currently pressed key codes.
   * @param targetKeys The array of key codes to check against.
   * @returns True if any of the target keys are in currentKeys, false otherwise.
   */
  private _isAnyOfKeysPressed(currentKeys: Set<string>, targetKeys: string[]): boolean {
    return targetKeys.some(key => currentKeys.has(key));
  }

  /**
   * Updates the game logic based on the elapsed time.
   * This is where core game systems (e.g., AI, physics, timers) are updated.
   * @param deltaTime The time elapsed since the last frame in milliseconds.
   */
  public update(deltaTime: number): void {
    // console.log(`Updating game logic. DeltaTime: ${deltaTime.toFixed(2)}ms, FPS: ${this._fps}`);

    // ADDED: Call _processInput here as requested to ensure input is processed each frame.
    // This will result in _processInput being called twice per frame (once in _gameLoop, once here).
    // While typically input is processed once before the main update, this fulfills the specific request.
    this._processInput();

    // Update dynamic entities (enemies, NPCs, etc.)
    this.updateEntities(deltaTime);

    // Other game logic updates (e.g., status effects, timers, quest updates)
    // For example, if a battle is active, the BattleSystem would be updated here.
    // if (this._currentGameState.battle) {
    //   this._battleSystem.update(deltaTime, this._currentGameState.battle);
    // }
  }

  /**
   * Placeholder for rendering logic.
   * In a React application, actual visual rendering is typically handled by React components
   * observing the `GameState` provided by the `GameContext`.
   * This method primarily serves as a hook in a traditional game loop structure.
   */
  public render(): void {
    // console.log('Rendering game visuals.');
    // No direct DOM manipulation here. React components will re-render
    // automatically when `_dispatch` actions modify the `GameState`.
  }

  /**
   * Processes player movement based on the given direction.
   * It checks for map boundaries, tile collisions, and entity collisions.
   * If movement is valid, it dispatches a `MOVE_PLAYER` action.
   * @param direction The direction to move the player.
   */
  public processMovement(direction: Direction): void {
    // 3. processMovement - log when movement is attempted
    console.log('GameEngine: Attempting to process movement for direction:', direction);

    const { player, currentMap, battle, dialogue } = this._currentGameState;

    // Prevent movement if in battle or dialogue
    if (battle || dialogue) {
      console.log('GameEngine: Movement blocked: In battle or dialogue.');
      return;
    }

    const { x, y } = player.position;
    let newX = x;
    let newY = y;

    switch (direction) {
      case 'up': newY--; break;
      case 'down': newY++; break;
      case 'left': newX--; break;
      case 'right': newX++; break;
    }

    const newPosition: Position = { x: newX, y: newY };

    // Check map boundaries
    if (newX < 0 || newX >= currentMap.width || newY < 0 || newY >= currentMap.height) {
      console.log('GameEngine: Movement blocked: Map boundary.');
      return;
    }

    // Check for collisions with non-walkable tiles
    if (this.checkCollisions(newPosition, currentMap)) {
      console.log('GameEngine: Movement blocked: Collision with tile.');
      return;
    }

    // Check for collisions with NPCs (NPCs still block movement)
    if (this.checkNPCCollision(newPosition)) {
      console.log('GameEngine: Movement blocked: Collision with NPC.');
      return;
    }

    // Check for map exits
    const exit = currentMap.exits.find(e => e.position.x === newX && e.position.y === newY);
    if (exit) {
      console.log(`GameEngine: Player moved to exit at ${newX},${newY}. Transitioning to map: ${exit.targetMapId}`);
      // In a full game, this would trigger a map loading sequence
      // and then dispatch an `UPDATE_MAP` action with the new map and player position.
      // For this exercise, we allow movement onto the exit tile, assuming a separate
      // system would detect this and handle the map transition.
      // Example:
      // const newMapData = loadMapData(exit.targetMapId); // Hypothetical function
      // if (newMapData) {
      //   const newMapInstance = new GameMap(newMapData.id, newMapData.name, newMapData.width, newMapData.height, newMapData.tiles, newMapData.entities, newMapData.exits);
      //   this._dispatch({ type: 'UPDATE_MAP', payload: { newMap: newMapInstance, playerNewPosition: exit.targetPosition } });
      //   return; // Prevent further movement processing in this frame
      // }
    }

    // If all checks pass, dispatch the movement action
    console.log('GameEngine: Dispatching MOVE_PLAYER action.');
    this._dispatch({ type: 'MOVE_PLAYER', payload: { direction } });

    // After player moves, check for enemy encounters at the new position
    this.checkForEnemyEncounter(newPosition);
  }

  /**
   * Checks for collisions at a given position with map tiles.
   * @param position The position to check for collision.
   * @param map The current game map object.
   * @returns True if a collision (non-walkable tile) occurs, false otherwise.
   */
  public checkCollisions(position: Position, map: GameMap): boolean {
    const tile = map.tiles[position.y]?.[position.x];
    if (!tile) {
      // This should ideally be caught by boundary checks, but as a safeguard
      console.error(`GameEngine: Attempted to access out-of-bounds tile at ${position.x},${position.y}`);
      return true; // Treat as collision
    }
    return !tile.walkable;
  }

  /**
   * Checks for collisions with NPCs at a given position.
   * NPCs block player movement.
   * @param position The position to check for NPC collision.
   * @returns True if a collision with an NPC occurs, false otherwise.
   */
  public checkNPCCollision(position: Position): boolean {
    const { npcs } = this._currentGameState;
    for (const npc of npcs) {
      if (npc.position.x === position.x && npc.position.y === position.y) {
        console.log(`GameEngine: Collision with NPC: ${npc.name}`);
        return true; // Collision with an NPC
      }
    }
    return false;
  }

  /**
   * Checks if an enemy exists at a given position. Does NOT prevent movement.
   * This method is used to identify an enemy for an encounter.
   * @param position The position to check for an enemy.
   * @returns The Enemy object if found, otherwise null.
   */
  private getEnemyAtPosition(position: Position): Enemy | null {
    const { enemies } = this._currentGameState;
    for (const enemy of enemies) {
      if (enemy.position.x === position.x && enemy.position.y === position.y) {
        console.log(`GameEngine: Enemy found at ${position.x},${position.y}: ${enemy.name}`);
        return enemy as Enemy; // Cast to Enemy class type
      }
    }
    return null;
  }

  /**
   * Checks for enemy encounters at a given position after player movement.
   * If an enemy is found, dispatches START_BATTLE and removes the enemy from the map.
   * @param position The position to check for an enemy encounter.
   * @returns True if a battle was initiated, false otherwise.
   */
  private checkForEnemyEncounter(position: Position): boolean {
    const enemy = this.getEnemyAtPosition(position);
    if (enemy) {
      console.log(`GameEngine: Encountered enemy: ${enemy.name} at ${position.x},${position.y}. Starting battle.`);
      this._dispatch({ type: 'START_BATTLE', payload: { enemies: [enemy] } });
      this._dispatch({ type: 'REMOVE_ENEMY', payload: { enemyId: enemy.id } });
      return true;
    }
    return false;
  }

  /**
   * Checks for interactions with NPCs or items at the player's current or adjacent position.
   * This method is typically called when an 'interact' key is pressed.
   */
  public checkInteractions(): void {
    const { battle, dialogue } = this._currentGameState;

    // 5. Only allow interaction when not already in dialogue
    // Prevent interaction if in battle or dialogue
    if (battle || dialogue) {
      console.log('GameEngine: Interaction blocked: In battle or dialogue.');
      return;
    }

    // Prioritize NPC interaction over item pickup if both are possible
    if (this.checkForNPCInteraction()) {
      return; // An NPC interaction occurred, stop here.
    }

    // Original Item interaction logic (kept for completeness)
    const { player, items } = this._currentGameState;
    const playerPos = player.position;
    const interactionRange: Position[] = [
      { x: playerPos.x, y: playerPos.y }, // Current tile
      { x: playerPos.x, y: playerPos.y - 1 }, // Up
      { x: playerPos.x, y: playerPos.y + 1 }, // Down
      { x: playerPos.x - 1, y: playerPos.y }, // Left
      { x: playerPos.x + 1, y: playerPos.y }, // Right
    ];

    // Check for Item interactions (picking up items)
    for (const item of items) {
      // Ensure item has a position on the map to be interactable
      if (item.position && interactionRange.some(pos => pos.x === item.position!.x && pos.y === item.position!.y)) {
        console.log(`GameEngine: Picking up item: ${item.name}`);
        // Dispatch actions to add item to player's inventory and remove it from the map
        this._dispatch({ type: 'ADD_ITEM', payload: { item: item, toPlayerInventory: true } });
        this._dispatch({ type: 'REMOVE_ITEM', payload: { itemId: item.id } });
        return; // Only one interaction per press
      }
    }

    console.log('GameEngine: No interaction found.');
  }

  /**
   * 3. Add method checkForNPCInteraction() that:
   *    - Gets player position
   *    - Checks all 4 adjacent tiles for NPCs
   *    - If NPC found, loads their dialogue from dialogues.json
   *    - Dispatches START_DIALOGUE with the dialogue data
   *    - Handles the case where dialogue data doesn't exist
   * @returns True if an NPC interaction was initiated, false otherwise.
   */
  private checkForNPCInteraction(): boolean {
    const { player, npcs } = this._currentGameState;
    const playerPos = player.position;

    // Define the 4 adjacent tiles
    const adjacentTiles: Position[] = [
      { x: playerPos.x, y: playerPos.y - 1 }, // Up
      { x: playerPos.x, y: playerPos.y + 1 }, // Down
      { x: playerPos.x - 1, y: playerPos.y }, // Left
      { x: playerPos.x + 1, y: playerPos.y }, // Right
    ];

    for (const npc of npcs) {
      // Check if the NPC is on any of the adjacent tiles
      if (adjacentTiles.some(pos => pos.x === npc.position.x && pos.y === npc.position.y)) {
        console.log(`GameEngine: Attempting to interact with NPC: ${npc.name}`);

        // Load their dialogue from dialogues.json
        // Cast dialoguesData to the expected array type for proper type checking
        const dialogueEntry = (dialoguesData as DialogueEntryData[]).find(d => d.id === npc.dialogueId);

        // 4. Handle the case where dialogue data doesn't exist
        if (!dialogueEntry) {
          console.warn(`GameEngine: Dialogue data not found for NPC: ${npc.name} with dialogueId: ${npc.dialogueId}`);
          return false; // No dialogue to start
        }

        // Prepare the dialogue state payload
        // Extract only the text strings from the dialogue lines
        const dialogueLines: string[] = dialogueEntry.lines.map(line => line.text);
        // Options are typically on the last line of dialogue
        const lastLine = dialogueEntry.lines[dialogueEntry.lines.length - 1];
        const dialogueOptions: DialogueOption[] | undefined = lastLine.choices;

        const dialogueState: DialogueState = {
          speaker: npc.name,
          text: dialogueLines,
          currentLineIndex: 0, // Start at the first line
          options: dialogueOptions,
        };

        // Dispatch START_DIALOGUE with the dialogue data
        console.log(`GameEngine: Dispatching START_DIALOGUE for NPC: ${npc.name}`);
        this._dispatch({
          type: 'START_DIALOGUE',
          payload: { dialogueState },
        });
        return true; // Interaction initiated
      }
    }

    return false; // No NPC found for interaction
  }

  /**
   * Updates the state of dynamic entities (enemies, NPCs) over time.
   * This method would contain AI logic, movement patterns, and other time-based updates for entities.
   * Any changes to entities would require dispatching actions to update the `GameState`.
   * @param deltaTime The time elapsed since the last frame in milliseconds.
   */
  public updateEntities(deltaTime: number): void {
    // Example: Simple enemy movement or AI updates
    // For a real game, this would involve more complex AI logic, pathfinding, etc.
    // Since GameState is immutable, any entity changes would require dispatching actions.

    // Example: Enemies might move every few seconds or based on player proximity.
    // This would require tracking internal timers for each enemy or a global enemy update timer.
    // For now, this is a placeholder.
    // console.log(`Updating ${this._currentGameState.enemies.length} enemies and ${this._currentGameState.npcs.length} NPCs.`);
  }

  /**
   * Tracks and updates the Frames Per Second (FPS) counter.
   * This provides a performance metric for the game loop.
   * @param timestamp The current DOMHighResTimeStamp.
   */
  private _trackFPS(timestamp: DOMHighResTimeStamp): void {
    this._frameCounter++;
    if (timestamp - this._lastFpsUpdateTime >= 1000) { // Update FPS every second
      this._fps = this._frameCounter;
      this._frameCounter = 0;
      this._lastFpsUpdateTime = timestamp;
      // console.log(`FPS: ${this._fps}`); // Uncomment for continuous FPS logging
    }
  }

  /**
   * Returns the current Frames Per Second (FPS) being achieved by the game loop.
   * @returns The current FPS value.
   */
  public get fps(): number {
    return this._fps;
  }
}