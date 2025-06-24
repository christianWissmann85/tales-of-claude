// In GameEngine.ts
export class GameEngine {
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private testMode: boolean = false;

  constructor(
    dispatch: (action: any) => void, 
    initialState: GameState,
    testMode: boolean = false // Add this parameter
  ) {
    this.dispatch = dispatch;
    this.gameState = initialState;
    this.testMode = testMode;
    
    // Only start the game loop if not in test mode
    if (!testMode) {
      this.start();
    }
  }

  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.gameLoop();
    }
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    // Your game loop logic here
    this.update();
    this.render();

    // Continue the loop
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  // Add a method to manually run one frame for testing
  runOneFrame(): void {
    if (this.testMode) {
      this.update();
      this.render();
    }
  }
}
function testGameEngine(): void {
  suite('Game Engine Tests', () => {
    let player: Player;
    let currentMap: GameMap;
    let enemies: Enemy[];
    let npcs: NPC[];
    let items: Item[];

    beforeEach(() => {
      player = new Player('p1', 'Claude', { x: 2, y: 2 });
      currentMap = new GameMap(mockMapDataIndex['town_square']);
      enemies = [new Enemy('bug_on_map', EnemyVariant.BasicBug, { x: 1, y: 2 })];
      npcs = [{ id: 'villager_01', name: 'Villager', position: { x: 2, y: 1 }, dialogueId: 'npc_villager_dialogue_01', role: 'villager' }];
      items = [Item.createItem(ItemVariant.HealthPotion, { x: 3, y: 2 })];

      // Reset mock state and dispatched actions
      mockGameState = {
        player: player,
        currentMap: currentMap,
        enemies: enemies,
        npcs: npcs,
        items: items,
        dialogue: null,
        battle: null,
        gameFlags: {},
        showInventory: false,
        showQuestLog: false,
        showCharacterScreen: false,
        notification: null,
        questManagerState: null,
        hotbarConfig: [null, null, null, null, null],
      };
      dispatchedActions = []; // Clear actions for each test

      // Create GameEngine in test mode to prevent automatic game loop start
      globalGameEngineInstance = new GameEngine(mockDispatch, mockGameState, true);
      globalGameEngineInstance.setGameState(mockGameState); // Ensure engine has the latest state
      QuestManager.getInstance().initialize([]); // Clear QuestManager state for clean tests
    });

    // Simplified afterEach - no need to stop since it never started
    afterEach(() => {
      globalGameEngineInstance = null;
      activeAnimationFrames.clear();
    });

    test('should initialize with correct game state', () => {
      assert(globalGameEngineInstance !== null, 'GameEngine should be initialized');
      
      const state = globalGameEngineInstance.getGameState();
      assert(state.player.name === 'Claude', 'Player name should be Claude');
      assert(state.enemies.length === 1, 'Should have 1 enemy');
      assert(state.npcs.length === 1, 'Should have 1 NPC');
      assert(state.items.length === 1, 'Should have 1 item');
    });

    test('should handle player movement', () => {
      // Test player movement by running one frame
      globalGameEngineInstance.handleInput({ type: 'move', direction: 'right' });
      globalGameEngineInstance.runOneFrame(); // Process the input
      
      // Check if movement action was dispatched
      const moveActions = dispatchedActions.filter(action => action.type === 'MOVE_PLAYER');
      assert(moveActions.length > 0, 'Should dispatch move action');
    });

    test('should handle combat initialization', () => {
      // Move player to enemy position to trigger combat
      globalGameEngineInstance.handleInput({ type: 'move', direction: 'left' });
      globalGameEngineInstance.runOneFrame();
      
      // Check if combat was initiated
      const combatActions = dispatchedActions.filter(action => action.type === 'START_BATTLE');
      assert(combatActions.length > 0, 'Should initiate combat when player moves to enemy');
    });

    test('should handle item collection', () => {
      // Move player to item position
      globalGameEngineInstance.handleInput({ type: 'move', direction: 'right' });
      globalGameEngineInstance.runOneFrame();
      
      // Check if item collection was handled
      const itemActions = dispatchedActions.filter(action => action.type === 'COLLECT_ITEM');
      assert(itemActions.length > 0, 'Should collect item when player moves to item position');
    });

    test('should handle NPC interaction', () => {
      // Move player to NPC position
      globalGameEngineInstance.handleInput({ type: 'move', direction: 'up' });
      globalGameEngineInstance.runOneFrame();
      
      // Trigger interaction
      globalGameEngineInstance.handleInput({ type: 'interact' });
      globalGameEngineInstance.runOneFrame();
      
      // Check if dialogue was started
      const dialogueActions = dispatchedActions.filter(action => action.type === 'START_DIALOGUE');
      assert(dialogueActions.length > 0, 'Should start dialogue when interacting with NPC');
    });

    test('should update game state correctly', () => {
      const newState = {
        ...mockGameState,
        player: new Player('p1', 'UpdatedClaude', { x: 3, y: 3 })
      };
      
      globalGameEngineInstance.setGameState(newState);
      globalGameEngineInstance.runOneFrame();
      
      const currentState = globalGameEngineInstance.getGameState();
      assert(currentState.player.name === 'UpdatedClaude', 'Should update game state');
      assert(currentState.player.position.x === 3, 'Should update player position');
    });

    test('should handle invalid moves', () => {
      // Try to move to an invalid position (assuming map boundaries)
      const initialPosition = { ...mockGameState.player.position };
      
      // Try to move out of bounds
      globalGameEngineInstance.handleInput({ type: 'move', direction: 'left' });
      globalGameEngineInstance.handleInput({ type: 'move', direction: 'left' });
      globalGameEngineInstance.runOneFrame();
      
      // Verify player didn't move to invalid position
      const state = globalGameEngineInstance.getGameState();
      assert(state.player.position.x >= 0, 'Player should not move to negative x position');
    });

    // Add more tests as needed...
  });
}
// Create an interface for the game loop
interface GameLoop {
  start(): void;
  stop(): void;
}

// Production implementation
class ProductionGameLoop implements GameLoop {
  start() { /* start requestAnimationFrame loop */ }
  stop() { /* stop loop */ }
}

// Test implementation
class TestGameLoop implements GameLoop {
  start() { /* do nothing */ }
  stop() { /* do nothing */ }
}

// In your GameEngine constructor:
constructor(
  dispatch: (action: any) => void, 
  initialState: GameState,
  gameLoop?: GameLoop
) {
  this.gameLoop = gameLoop || new ProductionGameLoop();
  this.gameLoop.start();
}