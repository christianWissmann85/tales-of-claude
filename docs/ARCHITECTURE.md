# ARCHITECTURE_LEAN.md

Tales of Claude is a 2D adventure RPG where Claude, an AI, battles bugs. Its architecture emphasizes modularity, a centralized state, and event-driven interactions for a dynamic gameplay experience.

## 1. System Overview

The game's core is a central `GameState` managed by a React Context reducer. This `GameState` acts as the single source of truth for all game data. The `GameEngine` orchestrates the main game loop and logic, reacting to state changes and dispatching new actions to update the `GameState`. UI components then render this updated state.

```ascii
+-----------------+       +-----------------+
| React Components| <---> |   GameContext   |
| (UI, Views)     |       | (GameState, Reducer)|
+-----------------+       +-----------------+
        ^                         ^
        | (Reads State)           | (Dispatches Actions)
        |                         |
+-----------------+       +-----------------+
|   GameEngine    | <---> |  Core Systems   |
| (Game Loop, Logic)|     | (Models, Managers)|
+-----------------+       +-----------------+
```

## 2. Core Patterns & Principles

*   **Centralized State Management:** The `GameContext` holds the immutable `GameState`. All state modifications occur via `dispatch`ing `GameAction`s to a single `gameReducer`. This ensures predictable state changes and simplifies debugging.
*   **Game Loop Orchestration:** The `GameEngine` runs the main game loop using `requestAnimationFrame`. It's responsible for processing player input, updating various game systems (like AI and time), and dispatching actions to reflect changes in the `GameState`.
*   **Event-Driven Architecture:** Systems like `TimeSystem`, `WeatherSystem`, and `FactionManager` communicate changes using internal `EventEmitter`s or callback arrays. This allows for loose coupling, where components can react to events without direct knowledge of the emitter's internal workings.
*   **Model-View-Controller (Implicit):** Game models (`Player`, `Enemy`, `Map`, `Quest`) encapsulate data and their specific business logic. The `GameEngine` acts as a controller, manipulating these models and then dispatching `GameAction`s. React components serve as the views, rendering the `GameState`.
*   **Singleton Pattern:** Key managers (`QuestManager`, `FactionManager`, `MapLoader`, `UIManager`, `SaveGameService`) are implemented as singletons. This ensures a single, globally accessible instance for managing their respective domains, preventing inconsistent states.
*   **Immutability:** The `GameState` is treated as immutable. Reducers always return new state objects, and mutable instances within the state (like `Player` or `GameMap`) are cloned when modified. This is crucial for React's efficient re-rendering and state predictability.
*   **Separation of Concerns:** Core game logic and domain-specific systems are encapsulated in dedicated classes, decoupled from React components. This improves maintainability and testability.

## 3. Key System Interactions

### React Components & Game Models

React components (e.g., `CharacterScreen`, `Inventory`) receive game model instances (`Player`, `Inventory`) as props. They interact with these models by calling their methods (e.g., `player.equip(item)`). After a model's state is mutated, components then `dispatch` an action with the *modified/cloned* model instance to update the central `GameState`, ensuring React's immutability requirements are met.
`UI Component --(Calls Model Method)--> Game Model --(Dispatches Action with New Model)--> GameState`

### Event Bus Architecture

`TimeSystem` and `WeatherSystem` manage their own internal state and emit events (`timeChanged`, `weatherTransitionComplete`). The `GameEngine` subscribes to these events to update the `GameState` accordingly, ensuring the UI reflects environmental changes.
`TimeSystem --(Emits 'timeChanged')--> GameEngine --(Dispatches UPDATE_TIME)--> GameState`
`WeatherSystem --(Emits 'weatherChange')--> GameEngine --(Dispatches UPDATE_WEATHER)--> GameState`

### Save/Load System Flow

The `SaveGameService` handles game persistence. It serializes the entire `GameState` (including the states of singletons like `QuestManager` and `FactionManager`) into `localStorage`. The `LOAD_GAME` action deserializes this data, re-initializes manager singletons with the loaded data, and updates the `GameState` to resume play.
`GameState <--(LOAD/SAVE)--> SaveGameService <--(Persists)--> localStorage`

### Combat System Architecture

The `BattleSystem` is responsible for all combat logic. When a battle starts, it takes a snapshot of the player and enemy entities to create a `BattleState`. It then processes turns, applies damage, healing, and status effects. Upon battle conclusion or significant updates, it dispatches `END_BATTLE` or `UPDATE_BATTLE_STATE` actions. It also interacts with `QuestManager` to award XP and items.
`GameEngine --(START_BATTLE)--> BattleSystem --(Updates/Ends Battle)--> GameState`

### Quest & Dialogue Systems

The `QuestManager` (singleton) centrally manages all `Quest` definitions, tracking player progress through linear and branching questlines. `NPCModel`s are linked to specific dialogue IDs. The `GameEngine` triggers dialogue based on player interaction. The `DialogueBox` component renders dialogue lines and presents player choices. These choices can trigger `QuestManager` actions (e.g., `startQuest`, `handleChoice`) or other game-altering events.
`NPC --(Dialogue ID)--> GameEngine --(START_DIALOGUE)--> DialogueBox --(DIALOGUE_CHOICE)--> QuestManager`

### Map & Tile Rendering

The `MapLoader` (singleton) is responsible for asynchronously loading map data (from JSON/TS files) and converting it into `GameMap` instances. The `GameMap` object stores tile data, entities (NPCs, Enemies, Items), exits, and structures. The `MapGrid` React component renders the visible portion of the `currentMap` based on the player's position, applying visual styles (emoji/ASCII, background colors) to tiles and overlaying entities. The `player.exploredMaps` property tracks visited tiles for minimap fog-of-war.
`MapLoader --(Provides GameMap)--> GameState --(currentMap)--> MapGrid`

## 4. Discovered Systems

*   **PatrolSystem:** Manages enemy AI behavior, including patrol routes, vision, alert states, and respawning. It dynamically adjusts based on `TimeSystem` (day/night cycles) and `WeatherSystem` (movement penalties).
*   **UIManager / StableUIManager:** Provides centralized control for all UI panels (inventory, quest log, character screen). It ensures only one modal panel is active at a time, manages z-indexing, and uses `criticalSectionManager` and `actionQueueManager` to prevent rapid toggles and race conditions during UI transitions, enhancing stability.
*   **FactionSystem (FactionManager):** Tracks and manages the player's reputation with various in-game factions. It handles reputation adjustments based on player actions, implements inter-faction conflict logic, and provides reputation tiers that can influence gameplay (e.g., shop prices, dialogue options).
*   **PuzzleSystem:** Manages the state and logic for environmental puzzles (e.g., push blocks, switch sequences) on a per-map basis. The `PuzzleInteractionHandler` acts as a facade for interacting with specific puzzle types, allowing the game to track and persist puzzle progress.