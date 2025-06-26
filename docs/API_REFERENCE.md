# API Reference

This document provides a comprehensive API reference for the Tales of Claude codebase, featuring the new AI-first zone-based map architecture.

## 1. GameEngine API

* **GameEngine**
  *  `constructor(dispatch: React.Dispatch<GameAction>, initialState: GameState)` - Initializes the game engine with dispatch and initial state.
  *  `setGameState(newState: GameState): void` - Updates the engine's internal snapshot of the game state.
  *  `start(): void` - Starts the main game loop.
  *  `stop(): void` - Stops the game loop and cleans up resources.
  *  `handleKeyboardInput(keys: Set<string>): void` - Receives and stores the current set of pressed keyboard keys.
  *  `update(deltaTime: number): void` - Updates game logic based on elapsed time (AI, physics, timers).
  *  `render(): void` - Placeholder for rendering logic (actual rendering by React).
  *  `processMovement(direction: Direction): Promise<void>` - Processes player movement, checking collisions and exits.
  *  `checkCollisions(position: Position, map: GameMap): boolean` - Checks for collisions with map tiles.
  *  `checkNPCCollision(position: Position): boolean` - Checks for collisions with NPCs.
  *  `checkInteractions(): void` - Checks for interactions with NPCs or items at player's position.
  *  `updateEntities(deltaTime: number): void` - Updates the state of dynamic entities (enemies, NPCs).
  *  `fps: number` - Current Frames Per Second (FPS) being achieved.
  *  `getWeatherEffects(): WeatherEffects` - Returns current weather effects.
  *  `markEnemyDefeated(enemyId: string): void` - Marks an enemy as defeated for respawning.

## 2. Player API

* **Player**
  *  `constructor(id: string, name: string, startPosition: Position)` - Creates a new player instance.
  *  **Properties**
      *  `id: string` - Unique identifier for the player.
      *  `name: string` - Player's display name.
      *  `position: Position` - Current position on the map.
      *  `statusEffects: StatusEffect[]` - Active status effects.
      *  `inventory: Item[]` - List of items in player's inventory.
      *  `abilities: Ability[]` - List of learned abilities.
      *  `weaponSlot?: EquippableItem` - Currently equipped weapon.
      *  `armorSlot?: EquippableItem` - Currently equipped armor.
      *  `accessorySlot?: EquippableItem` - Currently equipped accessory.
      *  `activeQuestIds: string[]` - IDs of active quests.
      *  `completedQuestIds: string[]` - IDs of completed quests.
      *  `talentTree: TalentTree` - Player's talent tree instance.
      *  `talentPoints: number` - Available talent points.
      *  `gold: number` - Player's current gold.
      *  `exploredMaps: Map<string, Set<string>>` - Tracked explored tiles per map.
  *  `stats: PlayerStats` - Getter for player stats including equipment bonuses.
  *  `move(direction: Direction): void` - Moves the player in the specified direction.
  *  `takeDamage(amount: number): void` - Reduces player's HP.
  *  `heal(amount: number): void` - Restores player's HP.
  *  `useEnergy(amount: number): boolean` - Consumes player's energy.
  *  `restoreEnergy(amount: number): void` - Restores player's energy.
  *  `addExperience(amount: number): void` - Adds experience points and handles level up.
  *  `levelUp(): void` - Levels up the player, increasing stats and talent points.
  *  `addItem(item: Item): void` - Adds an item to inventory.
  *  `removeItem(itemId: string): Item | undefined` - Removes an item from inventory by ID.
  *  `hasItem(itemId: string): boolean` - Checks if player has an item.
  *  `addGold(amount: number): void` - Adds gold to player's purse.
  *  `removeGold(amount: number): boolean` - Removes gold from player's purse.
  *  `learnAbility(ability: Ability): void` - Teaches the player a new ability.
  *  `equip(item: Item): EquippableItem | undefined` - Equips an item to the appropriate slot.
  *  `unequip(slotType: EquipmentSlotType): EquippableItem | undefined` - Unequips an item from the specified slot.
  *  `getEquippedItems(): EquippableItem[]` - Returns all currently equipped items.
  *  `updateBaseStats(updates: Partial<PlayerStats>): void` - Updates player's base stats.
  *  `getBaseStats(): PlayerStats` - Gets the player's base stats (without equipment bonuses).
  *  `spendTalentPoint(talentId: string): boolean` - Attempts to spend a talent point on a talent.
  *  `resetTalents(): void` - Resets all talents and refunds points.
  *  `markTileExplored(mapId: string, x: number, y: number): void` - Marks a tile as explored.
  *  `isTileExplored(mapId: string, x: number, y: number): boolean` - Checks if a tile has been explored.
  *  `markSurroundingTilesExplored(mapId: string, visionRadius: number): void` - Marks tiles around player as explored.
  *  `applyStatusEffect(newEffect: StatusEffect): void` - Applies a status effect to the player.
  *  `updateStatusEffects(): void` - Updates active status effects.
* **EquipmentSlotType** - `type EquipmentSlotType = 'weapon' | 'armor' | 'accessory'` - Types of equipment slots.

## 3. Combat System API

* **BattleSystem**
  *  `constructor(dispatch: React.Dispatch<GameAction>)` - Initializes the battle system.
  *  `startBattle(player: Player, enemies: Enemy[]): void` - Initiates a battle.
  *  `endBattle(battle: BattleState, playerWon: boolean, playerCombatState: CombatEntity, expGained?: number, itemsDropped?: Item[]): void` - Ends the current battle.
  *  `performAttack(battle: BattleState, attackerId: string, targetId: string): BattleState | null` - Performs a basic attack action.
  *  `useAbility(battle: BattleState, casterId: string, abilityId: string, targetId?: string): BattleState | null` - Uses an ability in battle.
  *  `useItem(battle: BattleState, playerId: string, item: Item): BattleState | null` - Uses an item in battle (player only).
  *  `flee(battle: BattleState, playerId: string, playerSpeed: number, enemySpeeds: number[]): BattleState | null` - Attempts to flee from battle.
  *  `handleEnemyTurn(battle: BattleState, enemyId: string): BattleState | null` - Handles an enemy's turn in battle.
* **Enemy**
  *  `constructor(id: string, variant: EnemyVariant, startPosition: Position)` - Creates an instance of an Enemy.
  *  **Properties**
      *  `id: string` - Unique identifier.
      *  `name: string` - Enemy's name.
      *  `position: Position` - Current position.
      *  `statusEffects: StatusEffect[]` - Active status effects.
      *  `type: EnemyType` - Type of enemy (e.g., 'bug', 'virus').
      *  `stats: CombatStats` - Current combat statistics.
      *  `abilities: Ability[]` - Abilities the enemy can use.
      *  `expReward: number` - Experience awarded upon defeat.
  *  `takeDamage(amount: number): void` - Reduces enemy's HP.
  *  `calculateDamageOutput(ability: Ability, targetDefense: number): number` - Calculates potential damage.
  *  `getAbility(abilityId: string): Ability | undefined` - Retrieves an ability by its ID.
  *  `useAbility(ability: Ability): boolean` - Simulates enemy using an ability.
  *  `chooseAction(battleState: BattleState): { ability: Ability; targetId: string } | null` - Determines the enemy's action.
  *  `applyStatusEffect(newEffect: StatusEffect): void` - Applies a new status effect.
  *  `updateStatusEffects(): string[]` - Updates all active status effects.
* **EnemyVariant** - `enum EnemyVariant` - Defines specific enemy types.

## 4. Quest System API

* **QuestManager**
  *  `getInstance(): QuestManager` - Returns the singleton instance.
  *  **Properties**
      *  `allQuests: Quest[]` - All quests defined in the game.
      *  `activeQuests: Quest[]` - Quests currently in progress.
      *  `completedQuestIds: string[]` - IDs of completed quests.
  *  `setPlayer(player: Player): void` - Sets the player reference for applying consequences.
  *  `initializeQuests(): void` - Initializes all quests from variants.
  *  `getAvailableQuests(): Quest[]` - Gets quests available to start.
  *  `startQuest(questId: string): boolean` - Starts a quest by ID.
  *  `updateQuestProgress(objectiveType: ObjectiveType, target: string, amount?: number): void` - Updates quest progress for active quests.
  *  `makeChoice(questId: string, choiceId: string): boolean` - Makes a choice for a branching quest.
  *  `getActiveQuestChoices(questId: string): QuestChoice[] | null` - Gets active choices for a quest.
  *  `completeQuest(questId: string, player: Player): boolean` - Completes a quest and gives rewards.
  *  `failQuest(questId: string): boolean` - Fails a quest.
  *  `getActiveQuests(): Quest[]` - Gets all active quests.
  *  `getQuestById(questId: string): Quest | undefined` - Gets a quest by ID.
  *  `getPlayerReputation(factionId: string): number` - Gets player reputation with a faction.
  *  `saveState(): QuestManagerState` - Saves the quest manager state.
  *  `loadState(state: QuestManagerState): void` - Loads the quest manager state.
* **Quest**
  *  `constructor(id: string, name: string, description: string, objectives: Omit<QuestObjective, 'id' | 'currentProgress' | 'isCompleted'>[], rewards: QuestRewards, prerequisites: string[], factionRequirements?: FactionRequirement[], branches?: Record<string, QuestBranch> | null, initialBranchId?: string | null)` - Creates a new Quest instance.
  *  **Properties**
      *  `id: string` - Unique identifier.
      *  `name: string` - Display name.
      *  `description: string` - Quest description.
      *  `objectives: QuestObjective[]` - Quest objectives.
      *  `currentObjectiveIndex: number` - Index of the current objective.
      *  `status: QuestStatus` - Current status ('not_started', 'in_progress', 'completed', 'failed').
      *  `rewards: QuestRewards` - Rewards upon completion.
      *  `prerequisites: string[]` - IDs of prerequisite quests.
      *  `factionRequirements: FactionRequirement[]` - Faction reputation requirements.
      *  `currentBranchId: string | null` - ID of the currently active branch.
      *  `branches: Record<string, QuestBranch> | null` - All branches for this quest.
      *  `currentChoices: QuestChoice[] | null` - Choices presented to the player.
  *  `registerQuestData(questId: string, data: QuestData): void` - Static: Registers additional quest data.
  *  `createQuest(variant: QuestVariant): Quest` - Static: Creates a new Quest instance from a variant.
  *  `startQuest(): boolean` - Sets quest status to 'in_progress'.
  *  `updateObjectiveProgress(objectiveType: ObjectiveType, targetIdentifier: string, progressAmount?: number): boolean` - Updates objective progress.
  *  `handleChoice(choiceId: string): boolean` - Processes a player's choice at a branching objective.
  *  `checkCompletion(): boolean` - Checks if the quest is completed.
  *  `giveRewards(player: Player): void` - Grants quest rewards to the player.
  *  `isAvailable(completedQuests: string[], playerFactionReputations?: Record<string, number>): boolean` - Checks if the quest is available to be started.
  *  `getCurrentObjective(): QuestObjective | null` - Returns the currently active objective.
  *  `resetQuest(): void` - Resets the quest to its initial state.
* **QuestVariant** - `enum QuestVariant` - Defines specific quest types.
* **QuestChoice** - `interface QuestChoice` - Represents a choice option in a branching quest.
* **QuestConsequence** - `interface QuestConsequence` - Represents an effect from a quest choice.
* **ConsequenceType** - `enum ConsequenceType` - Defines types of consequences.

## 5. Inventory & Equipment API

* **Inventory**
  *  `constructor()` - Creates a new inventory instance.
  *  `addItem(item: Item): boolean` - Adds an item to the inventory.
  *  `removeItem(itemId: string): boolean` - Removes one instance of an item.
  *  `getItem(itemId: string): Item | undefined` - Retrieves an item by its ID.
  *  `hasItem(itemId: string): boolean` - Checks if an item exists in inventory.
  *  `getItems(): Item[]` - Returns an array of all unique Item instances.
  *  `getItemCount(itemId: string): number` - Gets the current count of a specific item.
  *  `useItem(itemId: string): Item | undefined` - "Uses" an item, removing it from inventory.
  *  `isFull(): boolean` - Checks if inventory is at max capacity.
  *  `getCurrentSize(): number` - Returns current number of unique item slots occupied.
* **Item**
  *  `constructor(variant: ItemVariant, startPosition?: Position)` - Creates an instance of an Item.
  *  **Properties**
      *  `id: string` - Unique identifier.
      *  `name: string` - Item's name.
      *  `description: string` - Item's description.
      *  `type: ItemType` - Type of item ('consumable', 'equipment', 'key', 'quest').
      *  `position?: Position` - Optional: If item is on the map.
      *  `stats?: { attack?: number; defense?: number; speed?: number; }` - For equipment items.
      *  `equipmentSlotType?: EquipmentSlotType` - For equipment items.
      *  `effect?: string` - Effect of consumable items.
      *  `value?: number` - Value associated with the effect.
      *  `targetId?: string` - For key items, what it unlocks.
  *  `createItem(variant: ItemVariant, position?: Position): Item` - Static: Factory method to create an Item.
  *  `use(player: Player): { success: boolean; message: string }` - Attempts to use the item.
* **ItemVariant** - `enum ItemVariant` - Defines specific item types.

## 6. Zone-Based Map System API

### Overview

The new AI-first map system revolutionizes how maps are defined and understood. Instead of visual tile grids, maps are now collections of **purposeful zones** with explicit behaviors, connections, and properties. This enables AI agents to understand and work with maps logically without needing to interpret visual patterns.

### Key Benefits

* **Behavior Over Appearance**: Define what happens in a zone, not what it looks like
* **Explicit Over Implicit**: No guessing if tiles are walkable - it's defined clearly
* **AI-Friendly Queries**: Natural language pathfinding and location descriptions
* **Testable Without Rendering**: Validate maps programmatically

### Core Interfaces

#### Map Structure

* **AIFirstMap**
  *  **Properties**
      *  `id: string` - Unique identifier for the map
      *  `name: string` - Display name of the map
      *  `description: string` - What is this place?
      *  `zones: Zone[]` - Logical zones that compose the map
      *  `connections: ZoneConnection[]` - Connections between zones
      *  `behaviors: MapBehavior[]` - Global behaviors for the map
      *  `renderHints?: RenderConfiguration` - Optional visual hints for renderer

* **Zone**
  *  **Properties**
      *  `id: string` - Unique identifier for the zone
      *  `name: string` - Display name of the zone
      *  `purpose: ZonePurpose` - The functional purpose of this zone
      *  `bounds: Rectangle` - The bounding box of the zone
      *  `walkableAreas: Rectangle[]` - Explicit walkable areas (if empty, entire zone is walkable)
      *  `blockedAreas?: Rectangle[]` - Explicit blocked areas within walkable areas
      *  `entities: ZoneEntity[]` - What belongs in this zone
      *  `behaviors: ZoneBehavior[]` - Zone-specific behaviors
      *  `environment?: ZoneEnvironment` - Environmental properties

* **Rectangle**
  *  **Properties**
      *  `x: number` - X coordinate of top-left corner
      *  `y: number` - Y coordinate of top-left corner
      *  `width: number` - Width of the rectangle
      *  `height: number` - Height of the rectangle

* **Position**
  *  **Properties**
      *  `x: number` - X coordinate
      *  `y: number` - Y coordinate

* **ZonePurpose** - `type ZonePurpose` - Defines the functional purpose of a zone
  *  `'social_hub'` - NPCs gather, shops, quests
  *  `'combat_area'` - Enemy spawns, battles
  *  `'transition'` - Connects areas
  *  `'safe_zone'` - No combat, healing
  *  `'puzzle_area'` - Environmental challenges
  *  `'boss_arena'` - Special combat rules
  *  `'secret_area'` - Hidden content
  *  `'residential'` - NPC homes
  *  `'commercial'` - Shops and services
  *  `'industrial'` - Crafting, work areas
  *  `'natural'` - Forests, caves, etc.

* **ZoneEntity**
  *  **Properties**
      *  `type: 'npc' | 'enemy' | 'item' | 'structure' | 'interaction_point'` - Entity type
      *  `id: string` - Unique identifier
      *  `position: Position` - Position relative to zone origin
      *  `behavior?: EntityBehavior` - Optional behavior configuration

* **ZoneConnection**
  *  **Properties**
      *  `fromZoneId: string` - Source zone ID
      *  `toZoneId: string` - Destination zone ID
      *  `type: 'adjacent' | 'portal' | 'stairs' | 'door'` - Connection type
      *  `bidirectional: boolean` - Whether connection works both ways
      *  `requirements?: ConnectionRequirement[]` - Optional requirements to use connection
      *  `fromPoint: Position` - Exit point in source zone
      *  `toPoint: Position` - Entry point in destination zone

* **ZoneBehavior**
  *  **Properties**
      *  `type: string` - Behavior type identifier
      *  `trigger: BehaviorTrigger` - What triggers this behavior
      *  `action: BehaviorAction` - What happens when triggered

* **MapBehavior**
  *  **Properties**
      *  `type: 'time_based' | 'weather' | 'faction' | 'quest_state'` - Global behavior type
      *  `config: Record<string, any>` - Configuration for the behavior

* **ZoneEnvironment**
  *  **Properties**
      *  `type: 'indoor' | 'outdoor' | 'underground'` - Environment type
      *  `lighting?: 'bright' | 'dim' | 'dark'` - Lighting conditions
      *  `weather?: boolean` - Whether weather affects this zone

#### Behavior Interfaces

* **BehaviorTrigger**
  *  **Properties**
      *  `type: 'time' | 'player_enter' | 'player_exit' | 'interaction' | 'quest_state'` - Trigger type
      *  `conditions?: Record<string, any>` - Additional trigger conditions

* **BehaviorAction**
  *  **Properties**
      *  `type: string` - Action type identifier
      *  `parameters: Record<string, any>` - Action-specific parameters

* **EntityBehavior**
  *  **Properties**
      *  `type: string` - Behavior type (e.g., 'shopkeeper', 'guard', 'wanderer')
      *  `config?: Record<string, any>` - Behavior-specific configuration

* **ConnectionRequirement**
  *  **Properties**
      *  `type: 'key' | 'quest' | 'level' | 'custom'` - Requirement type
      *  `value: string | number` - What's required (key ID, quest ID, level, etc.)

### Advanced Zone Interfaces

* **Coordinate**
  *  **Properties**
      *  `x: number` - X coordinate
      *  `y: number` - Y coordinate  
      *  `z?: number` - Optional Z coordinate for multi-level maps

* **Bounds**
  *  **Properties**
      *  `min: Coordinate` - Minimum corner coordinate
      *  `max: Coordinate` - Maximum corner coordinate

* **TileProperties** (For hybrid approach)
  *  **Properties**
      *  `walkability: WalkabilityType` - Walkability state
      *  `interaction: InteractionType` - Interaction type
      *  `conditions?: Record<string, any>` - Conditional access requirements
      *  `interactionData?: Record<string, any>` - Data for interactions
      *  `environment?: Record<string, any>` - Environmental properties
      *  `aiHints?: AIHints` - Hints for AI understanding

* **AIHints**
  *  **Properties**
      *  `description: string` - Natural language description
      *  `keywords: string[]` - Searchable keywords
      *  `suggestedActions: string[]` - Possible actions here

* **WalkabilityType** - `enum WalkabilityType`
  *  `WALKABLE` - Freely walkable
  *  `BLOCKED` - Cannot walk
  *  `CONDITIONAL` - Requires condition check
  *  `HAZARDOUS` - Walkable but dangerous

* **InteractionType** - `enum InteractionType`
  *  `NONE` - No interaction
  *  `DOOR` - Door interaction
  *  `CHEST` - Container interaction
  *  `NPC` - NPC interaction
  *  `SHOP` - Shop interface
  *  `SIGN` - Readable sign
  *  `PORTAL` - Map transition
  *  `TRIGGER` - Event trigger
  *  `PICKUP` - Item pickup

### AI-Friendly Query Interface

* **AIMapQueries**
  *  `getConnectedZones(zoneId: string): Zone[]` - Get all zones connected to a specific zone
  *  `getZonesByPurpose(purpose: ZonePurpose): Zone[]` - Find all zones with a specific purpose
  *  `getZoneBehaviors(zoneId: string, time?: number): ZoneBehavior[]` - Get behaviors active in a zone
  *  `findPath(from: Position, to: Position): Position[] | null` - Find walkable path between positions
  *  `getZoneAtPosition(pos: Position): Zone | null` - Get the zone containing a position
  *  `canWalkBetweenZones(fromZoneId: string, toZoneId: string): boolean` - Check if zones are connected
  *  `getEntitiesInZone(zoneId: string, type?: string): ZoneEntity[]` - Get entities in a zone
  *  `describeLocation(position: Position): string` - Get natural language description of location
  *  `getMovementOptions(position: Position): MovementOption[]` - Get available movement directions
  *  `findNearbyFeatures(position: Position, radius?: number): Feature[]` - Find interactive features nearby

* **MapAI** (Natural Language Interface)
  *  `constructor(map: AIFirstMap)` - Create AI interface for a map
  *  `describeLocation(coordinate: Coordinate): string` - Returns natural language description like "You are in Terminal Town. A wooden door leading north. Nearby: fountain, merchant"
  *  `getMovementOptions(coordinate: Coordinate): MovementOption[]` - Returns available movements with descriptions
  *  `findNearbyFeatures(coordinate: Coordinate, radius?: number): Feature[]` - Returns nearby interactive features sorted by distance
  *  `findPath(from: Coordinate, to: Coordinate): PathResult` - Returns step-by-step natural language directions
  *  `suggestActions(coordinate: Coordinate): string[]` - Suggests contextual actions based on location

#### Query Result Types

* **MovementOption**
  *  **Properties**
      *  `direction: string` - Direction name ("north", "east", etc.)
      *  `coordinate: Coordinate` - Target coordinate
      *  `description: string` - What's in that direction

* **Feature**
  *  **Properties**
      *  `type: InteractionType` - Type of feature
      *  `coordinate: Coordinate` - Location of feature
      *  `distance: number` - Manhattan distance from query point
      *  `description: string` - Natural language description
      *  `keywords: string[]` - Associated keywords

* **PathResult**
  *  **Properties**
      *  `found: boolean` - Whether a path was found
      *  `steps: string[]` - Natural language step-by-step directions
      *  `distance: number` - Total path length
      *  `estimatedTime: number` - Estimated time in seconds

### Map Validation System

* **MapValidator**
  *  `validateMap(map: AIFirstMap): ValidationResult` - Comprehensive map validation
  *  `validateStructure(map: AIFirstMap): ValidationError[]` - Check structural integrity
  *  `validateReferences(map: AIFirstMap): ValidationError[]` - Verify all references exist
  *  `validatePathfinding(map: AIFirstMap): ValidationError[]` - Ensure all areas are reachable
  *  `validateAIReadability(map: AIFirstMap): ValidationError[]` - Check AI hints and descriptions

* **ValidationResult**
  *  **Properties**
      *  `isValid: boolean` - Overall validation status
      *  `errors: ValidationError[]` - List of errors found
      *  `warnings: ValidationWarning[]` - List of warnings

* **ValidationError**
  *  **Properties**
      *  `type: 'STRUCTURAL' | 'LOGICAL' | 'REFERENCE' | 'PATHFINDING'` - Error category
      *  `location: string` - Where the error occurred (e.g., "Zone:town_square")
      *  `message: string` - Error description
      *  `severity: 'ERROR' | 'WARNING'` - Severity level
      *  `suggestedFix?: string` - How to fix the issue

### Zone Analysis Tools

* **ZoneAnalyzer**
  *  `analyzeMap(tileMap: Tile[][]): SuggestedZone[]` - Analyzes tile-based maps and suggests zones
  *  `detectWalkableAreas(tiles: Tile[][]): Rectangle[]` - Identifies connected walkable regions
  *  `suggestZonePurpose(area: Rectangle, tiles: Tile[][]): ZonePurpose` - Suggests purpose based on content
  *  `findNaturalBoundaries(tiles: Tile[][]): Rectangle[]` - Detects walls and natural divisions

* **ZoneToTileConverter**
  *  `convertToTiles(map: AIFirstMap, width: number, height: number): Tile[][]` - Generates tile array from zones
  *  `applyZoneToGrid(zone: Zone, tiles: Tile[][]): void` - Applies a single zone to tile grid
  *  `generateTileType(zone: Zone, pos: Position): TileType` - Determines tile type for position

### Migration Guide

#### Phase 1: Dual System
Run both tile-based and zone-based systems side by side:

```typescript
class DualModeMap {
    private aiFirstMap: AIFirstMap;
    private tileMap?: Tile[][];
    
    constructor(aiFirstMap: AIFirstMap) {
        this.aiFirstMap = aiFirstMap;
    }
    
    // Generate tiles on demand for rendering
    getTiles(): Tile[][] {
        if (!this.tileMap) {
            const converter = new ZoneToTileConverter();
            this.tileMap = converter.convertToTiles(this.aiFirstMap, 200, 200);
        }
        return this.tileMap;
    }
    
    // Use zones for all logic
    isWalkable(pos: Position): boolean {
        const zone = this.getZoneAtPosition(pos);
        if (!zone) return false;
        
        // Check if position is in walkable area
        return zone.walkableAreas.some(area => 
            this.isPositionInRectangle(pos, area)
        );
    }
}
```

#### Phase 2: Zone-First Development
* New maps use zone definitions exclusively
* Tile arrays generated from zones for rendering only
* All game logic queries zones, not tiles

#### Phase 3: Complete Migration
* Convert all existing maps to zone format
* Remove tile-based logic entirely
* Renderer uses zones directly with optimizations

### Migration Examples

#### Converting from Tile-Based to Zone-Based

```typescript
// Old tile-based approach
const oldMap: GameMap = {
    tiles: [
        [WALL, WALL, WALL, WALL],
        [WALL, FLOOR, FLOOR, WALL],
        [WALL, FLOOR, FLOOR, WALL],
        [WALL, WALL, WALL, WALL]
    ],
    // NPCs positioned individually
    npcs: [
        { id: 'merchant', position: { x: 1, y: 1 } }
    ]
};

// New zone-based approach
const newMap: AIFirstMap = {
    id: 'shop_interior',
    name: 'Merchant Shop',
    description: 'A cozy shop filled with useful items',
    zones: [
        {
            id: 'shop_floor',
            name: 'Shop Floor',
            purpose: 'commercial',
            bounds: { x: 0, y: 0, width: 4, height: 4 },
            walkableAreas: [
                { x: 1, y: 1, width: 2, height: 2 }
            ],
            entities: [
                {
                    type: 'npc',
                    id: 'merchant',
                    position: { x: 1, y: 1 },
                    behavior: {
                        type: 'shopkeeper',
                        shopId: 'general_store'
                    }
                }
            ],
            behaviors: [
                {
                    type: 'shop_hours',
                    trigger: { type: 'time', hours: [20, 21, 22] },
                    action: { type: 'close_shop' }
                }
            ]
        }
    ],
    connections: [],
    behaviors: []
};
```

#### Zone-Based Map Creation

```typescript
// Creating a new map with multiple connected zones
const terminalTownV2: AIFirstMap = {
    id: 'terminal_town_v2',
    name: 'Terminal Town',
    description: 'The digital hub where programs live and work',
    
    zones: [
        // Town square - the social center
        {
            id: 'town_square',
            name: 'Central Square',
            purpose: 'social_hub',
            bounds: { x: 100, y: 100, width: 50, height: 50 },
            walkableAreas: [{ x: 100, y: 100, width: 50, height: 50 }],
            blockedAreas: [
                { x: 120, y: 120, width: 10, height: 10 } // Fountain
            ],
            entities: [
                {
                    type: 'structure',
                    id: 'fountain',
                    position: { x: 125, y: 125 }
                },
                {
                    type: 'npc',
                    id: 'town_crier',
                    position: { x: 110, y: 110 },
                    behavior: { type: 'information_giver' }
                }
            ],
            behaviors: [
                {
                    type: 'crowd_spawner',
                    trigger: { type: 'time_period', period: 'day' },
                    action: { type: 'spawn_wandering_npcs', count: 5 }
                }
            ]
        },
        
        // Market district
        {
            id: 'market_district',
            name: 'Market District',
            purpose: 'commercial',
            bounds: { x: 150, y: 100, width: 40, height: 50 },
            walkableAreas: [{ x: 150, y: 100, width: 40, height: 50 }],
            entities: [
                {
                    type: 'npc',
                    id: 'weapon_merchant',
                    position: { x: 160, y: 110 }
                },
                {
                    type: 'npc',
                    id: 'potion_merchant',
                    position: { x: 170, y: 110 }
                }
            ],
            environment: {
                type: 'outdoor',
                weather: true
            }
        }
    ],
    
    connections: [
        {
            fromZoneId: 'town_square',
            toZoneId: 'market_district',
            type: 'adjacent',
            bidirectional: true,
            fromPoint: { x: 150, y: 125 },
            toPoint: { x: 150, y: 125 }
        }
    ],
    
    behaviors: [
        {
            type: 'time_based',
            config: {
                dayNightCycle: true,
                npcSchedules: true
            }
        }
    ]
};
```

### Best Practices

1. **Define Zones by Purpose**: Always start with what the zone is FOR, not what it looks like
2. **Explicit Walkability**: Define walkable areas explicitly rather than inferring from tile types
3. **Behavioral Grouping**: Group related entities and behaviors within zones
4. **Clear Connections**: Make zone connections explicit with entry/exit points
5. **Environment Matters**: Specify indoor/outdoor for weather and lighting effects

### Zone Design Patterns

#### Hub and Spoke
```typescript
{
    zones: [
        { id: 'central_hub', purpose: 'social_hub' },
        { id: 'north_district', purpose: 'residential' },
        { id: 'east_district', purpose: 'commercial' },
        { id: 'south_district', purpose: 'industrial' },
        { id: 'west_district', purpose: 'natural' }
    ],
    connections: [
        // All districts connect to central hub
        { fromZoneId: 'central_hub', toZoneId: 'north_district', type: 'adjacent' },
        { fromZoneId: 'central_hub', toZoneId: 'east_district', type: 'adjacent' },
        // ... etc
    ]
}
```

#### Linear Progression
```typescript
{
    zones: [
        { id: 'entrance', purpose: 'transition' },
        { id: 'challenge_1', purpose: 'puzzle_area' },
        { id: 'combat_gauntlet', purpose: 'combat_area' },
        { id: 'boss_chamber', purpose: 'boss_arena' }
    ],
    connections: [
        // One-way progression
        { fromZoneId: 'entrance', toZoneId: 'challenge_1', bidirectional: false },
        { fromZoneId: 'challenge_1', toZoneId: 'combat_gauntlet', bidirectional: false },
        // ... etc
    ]
}
```

### Why This Architecture is Superior

#### For AI Development
* **No Visual Pattern Matching**: AI understands maps through logical structure
* **Clear Intent**: Every zone has an explicit purpose and behavior
* **Natural Language**: Built-in support for describing locations and giving directions
* **Easy Content Generation**: AI can create new zones by defining behavior, not drawing tiles

#### For Testing
* **No Rendering Required**: Test walkability, connections, and behaviors programmatically
* **Validation Built-In**: Comprehensive validation catches issues before runtime
* **Deterministic**: Zone definitions are explicit, reducing edge cases

#### For Maintenance
* **Self-Documenting**: Zone purposes and descriptions explain the map
* **Modular**: Zones can be modified independently
* **Extensible**: New zone types and behaviors are easy to add

### Implementation Checklist

1. ✅ Define your map's zones by purpose first
2. ✅ Set explicit walkable areas for each zone
3. ✅ Place entities with clear behavior definitions
4. ✅ Connect zones with typed connections
5. ✅ Add AI hints for better natural language support
6. ✅ Validate the map before using
7. ✅ Test pathfinding between key locations
8. ✅ Generate tiles only for rendering (if needed)

## 7. NPC & Dialogue API

* **NPCModel**
  *  `constructor(id: string, name: string, position: Position, statusEffects: StatusEffect[], role: NPCRole, dialogueId: string, questStatus?: 'not_started' | 'in_progress' | 'completed', factionId?: string)` - Constructs a new NPCModel.
  *  **Properties (Getters)**
      *  `id: string` - Unique identifier.
      *  `name: string` - NPC's name.
      *  `position: Position` - Current position.
      *  `statusEffects: StatusEffect[]` - Active status effects.
      *  `role: NPCRole` - Role of the NPC.
      *  `dialogueId: string` - Key to retrieve dialogue lines.
      *  `questStatus?: 'not_started' | 'in_progress' | 'completed'` - Current quest status.
      *  `factionId?: string` - Faction affiliation.
  *  `updatePosition(newPosition: Position): void` - Updates the NPC's position.
  *  `addStatusEffect(effect: StatusEffect): void` - Adds a status effect.
  *  `removeStatusEffect(effectType: string): void` - Removes a status effect.
  *  `updateQuestStatus(status: 'not_started' | 'in_progress' | 'completed'): void` - Updates quest status.
  *  `create(name: string, role: NPCRole, dialogueId: string, position?: Position, statusEffects?: StatusEffect[], questStatus?: 'not_started' | 'in_progress' | 'completed', factionId?: string): NPCModel` - Static: Creates a new NPCModel.
  *  `createWizard(name: string, dialogueId: string, position?: Position): NPCModel` - Static: Creates a Wizard NPC.
  *  `createDebugger(name: string, dialogueId: string, position?: Position): NPCModel` - Static: Creates a Debugger NPC.
  *  `createLostProgram(name: string, dialogueId: string, position?: Position): NPCModel` - Static: Creates a Lost Program NPC.
  *  `createCompilerCat(name: string, dialogueId: string, position?: Position): NPCModel` - Static: Creates a Compiler Cat NPC.
  *  `createTutorial(name: string, dialogueId: string, position?: Position): NPCModel` - Static: Creates a Tutorial NPC.
  *  `createBard(name: string, dialogueId: string, position?: Position): NPCModel` - Static: Creates a Bard NPC.
  *  `createHealer(name: string, dialogueId: string, position?: Position): NPCModel` - Static: Creates a Healer NPC.
  *  `createQuestGiver(name: string, dialogueId: string, questStatus?: 'not_started' | 'in_progress' | 'completed', position?: Position): NPCModel` - Static: Creates a Quest Giver NPC.
* **DialogueBox (React Component)** - See React Components Props section.

## 8. Save/Load API

* **SaveGameService** (Accessed via `GameContext` `SAVE_GAME` and `LOAD_GAME` actions)
  *  `saveGame(gameState: any): boolean` - Static: Saves the game state to local storage.
  *  `loadGame(): any | null` - Static: Loads the game state from local storage.
  *  `hasSaveGame(): boolean` - Static: Checks if a save game exists.
  *  `clearSaveGame(): void` - Static: Clears the saved game data.
* **QuestManager** - `saveState()`, `loadState()` (See Quest System API).
* **FactionManager** - `serialize()`, `deserialize()` (See Hidden Systems API).
* **TimeSystem** - `serialize()`, `deserialize()` (See Hidden Systems API).
* **WeatherSystem** - `serialize()`, `deserialize()` (See Hidden Systems API).
* **PuzzleSystem** - `getSaveData()`, `loadSaveData()` (See Hidden Systems API).

## 9. Hidden Systems

* **PatrolSystem**
  *  `constructor(timeSystem: TimeSystem, weatherSystem: WeatherSystem, gameMap: GameMap)` - Initializes the patrol system.
  *  `initializeEnemy(enemy: IEnemy, type: EnemyVariant, storeOriginal?: boolean): void` - Initializes an enemy with patrol data.
  *  `update(deltaTime: number, playerPosition: Position): void` - Updates all enemy positions and states.
  *  `markEnemyDefeated(enemyId: string): void` - Marks an enemy as defeated.
  *  `getEnemyPosition(enemyId: string): Position | undefined` - Gets the current position of an enemy.
  *  `getEnemyData(id: string): EnemyPatrolData | undefined` - Gets enemy patrol data.
  *  `getAllEnemies(): Map<string, EnemyPatrolData>` - Gets all enemies managed by the system.
  *  `getEnemiesToRespawn(): IEnemy[]` - Gets enemies ready to respawn.
* **FactionManager**
  *  `getInstance(): FactionManager` - Gets the singleton instance.
  *  `loadFactions(): void` - Initializes or re-initializes default factions.
  *  `adjustReputation(factionId: string, amount: number): number` - Adjusts reputation for a faction.
  *  `getReputation(factionId: string): number` - Retrieves numerical reputation.
  *  `getReputationTier(factionId: string): string` - Determines reputation tier name.
  *  `isHostile(factionId: string): boolean` - Checks if reputation is hostile.
  *  `isNeutral(factionId: string): boolean` - Checks if reputation is neutral.
  *  `isAllied(factionId: string): boolean` - Checks if reputation is allied.
  *  `getAttitudeModifier(factionId: string): number` - Calculates numerical modifier based on reputation.
  *  `serialize(): SerializedFactionManagerState` - Serializes current state.
  *  `deserialize(data: SerializedFactionManagerState): void` - Deserializes faction data.
  *  `onReputationChange(callback: ReputationChangeCallback): void` - Registers a callback for reputation changes.
  *  **Events**
      *  `ReputationChangeCallback(factionId: string, oldRep: number, newRep: number, tierChanged: boolean)` - Callback for reputation changes.
* **UIManager**
  *  `getInstance(): UIManager` - Gets the singleton instance.
  *  `getOpenPanelAction(panel: UIPanel): any[]` - Static: Gets actions to open a panel.
  *  `getCloseAllPanelsAction(): any[]` - Static: Gets actions to close all panels.
  *  `isAnyPanelOpen(state: any): boolean` - Static: Checks if any modal panel is open.
  *  `getActivePanel(state: any): UIPanel | null` - Static: Gets the currently active panel.
  *  **Properties**
      *  `Z_INDEX: { GAME_BOARD: 1, MINIMAP: 100, QUEST_TRACKER: 100, WEATHER_DISPLAY: 100, HOTBAR: 200, PANELS: 500, SHOP: 600, DIALOGUE: 1000, NOTIFICATION: 1100, DEBUG: 9999 }` - Z-index values for layering.
* **StableUIManager**
  *  `openPanelSafely(panel: UIPanel, dispatch: (action: any) => void): Promise<void>` - Static: Opens a panel with stability checks.
  *  `closeAllPanelsSafely(dispatch: (action: any) => void): Promise<void>` - Static: Closes all panels with stability checks.
  *  `togglePanelSafely(panel: UIPanel, currentState: any, dispatch: (action: any) => void): Promise<void>` - Static: Toggles a panel with stability checks.
  *  `isPanelOpen(panel: UIPanel, state: any): boolean` - Static: Checks if a specific panel is open.
  *  `getPanelTransitionState(): { isTransitioning: boolean; canAcceptInput: boolean; }` - Static: Gets panel transition state for animations.
  *  `emergencyReset(): void` - Static: Force clear all locks and queues.
* **TimeSystem**
  *  `constructor()` - Creates an instance of TimeSystem.
  *  `on(eventName: 'timeChanged' | 'periodChanged', listener: Function): void` - Registers an event listener.
  *  `off(eventName: 'timeChanged' | 'periodChanged', listener: Function): void` - Removes an event listener.
  *  `pause(): void` - Pauses time progression.
  *  `resume(): void` - Resumes time progression.
  *  `setTime(hours: number, minutes: number): void` - Sets current game time.
  *  `addGameMinutes(minutes: number): void` - Adds game minutes to current time.
  *  `serialize(): TimeData` - Serializes current state.
  *  `deserialize(data: TimeData): void` - Deserializes state.
  *  `stop(): void` - Stops the time progression loop.
  *  `currentTime: { hours: number; minutes: number }` - Getter for current game time.
  *  `currentPeriod: TimeOfDay` - Getter for current time period.
  *  `timeString: string` - Getter for formatted time string.
  *  `isPaused: boolean` - Getter for pause status.
  *  **Events**
      *  `timeChanged` - Emitted when time changes.
      *  `periodChanged` - Emitted when time period changes.
* **WeatherSystem**
  *  `constructor()` - Creates an instance of WeatherSystem.
  *  `start(timeSystem: ITimeSystem, isOutdoorMap: boolean): void` - Initializes and starts the system.
  *  `stop(): void` - Stops weather progression.
  *  `setMapType(isOutdoor: boolean): void` - Sets current map type.
  *  `on(eventName: 'weatherChangeStarted' | 'weatherTransition' | 'weatherTransitionComplete', listener: (...args: unknown[]) => void): void` - Registers an event listener.
  *  `off(eventName: 'weatherChangeStarted' | 'weatherTransition' | 'weatherTransitionComplete', listener: (...args: unknown[]) => void): void` - Removes an event listener.
  *  `getCurrentWeather(): WeatherType` - Gets current weather type.
  *  `getTransitionProgress(): number` - Gets current transition progress (0-1).
  *  `getPreviousWeather(): WeatherType | null` - Gets previous weather type during transition.
  *  `getWeatherEffects(): WeatherEffects` - Gets current weather effects.
  *  `serialize(): WeatherData` - Serializes current state.
  *  `deserialize(data: WeatherData, timeSystem: ITimeSystem, isOutdoorMap: boolean): void` - Deserializes state.
  *  **Events**
      *  `weatherChangeStarted` - Emitted when a new weather change begins.
      *  `weatherTransition` - Emitted continuously during a transition.
      *  `weatherTransitionComplete` - Emitted when a weather transition finishes.
* **PuzzleSystem**
  *  `constructor()` - Initializes the puzzle system.
  *  `registerPuzzle(mapId: string, puzzleId: string, initialState: PuzzleState): void` - Registers a new puzzle.
  *  `getPuzzleState(mapId: string, puzzleId: string): PuzzleState | undefined` - Retrieves the current state of a puzzle.
  *  `updatePuzzleState(mapId: string, puzzleId: string, newState: PuzzleState): void` - Updates the state of a puzzle.
  *  `isPuzzleSolved(mapId: string, puzzleId: string): boolean` - Checks if a puzzle is solved.
  *  `resetPuzzle(mapId: string, puzzleId: string): void` - Resets a single puzzle.
  *  `resetMapPuzzles(mapId: string): void` - Resets all puzzles on a map.
  *  `getSaveData(): PuzzleSystemSaveData` - Generates serializable save data.
  *  `loadSaveData(data: PuzzleSystemSaveData): void` - Loads state from save data.
* **PuzzleInteractionHandler**
  *  `constructor(puzzleSystem: PuzzleSystem, currentMapId: string)` - Creates a handler for map puzzles.
  *  `handlePushBlockInteraction(puzzleId: string, oldPosition: Position, newPosition: Position): boolean` - Handles push block movement.
  *  `handleSwitchToggle(puzzleId: string, switchId: string): boolean` - Handles switch activation.
  *  `handleCodeArrangementChange(puzzleId: string, newArrangement: string[]): boolean` - Handles code arrangement changes.
  *  `isPuzzleSolved(puzzleId: string): boolean` - Checks if a puzzle is solved on the current map.
* **TalentTree**
  *  `constructor()` - Initializes the talent tree.
  *  **Properties**
      *  `availablePoints: number` - Getter for available talent points.
  *  `addAvailablePoints(points: number): void` - Adds points to the available pool.
  *  `addPoints(points: number): void` - Alias for `addAvailablePoints`.
  *  `investPoint(talentId: string): boolean` - Attempts to invest a point into a talent.
  *  `resetTalents(): void` - Resets all talents and refunds points.
  *  `getTalentBonus(abilityId: string, effectType: 'damage_bonus' | 'heal_bonus' | 'cost_reduction' | 'defense_bonus'): number` - Calculates total numerical bonus for an ability.
  *  `getTalentSpecialEffects(abilityId: string): TalentEffect[]` - Retrieves all active special effects for an ability.
  *  `getTalent(talentId: string): Talent | undefined` - Returns a specific talent by ID.
  *  `getAllTalents(): Map<string, Talent>` - Returns all talents in the tree.

## 10. React Components Props

* **Notification**
  *  (No explicit props, uses `useGameContext` directly)
* **PlayerProgressBar**
  *  `level: number` - Player's current level.
  *  `currentXP: number` - Player's current experience.
  *  `maxXpForLevel: number` - XP needed for next level.
  *  `currentHP: number` - Player's current HP.
  *  `maxHP: number` - Player's maximum HP.
  *  `currentEnergy: number` - Player's current energy.
  *  `maxEnergy: number` - Player's maximum energy.
* **ErrorBoundary**
  *  `children: ReactNode` - Child components to protect.
  *  `fallbackComponent?: ReactNode` - Optional fallback UI.
  *  `onError?: (error: Error, errorInfo: ErrorInfo) => void` - Optional error handler.
* **QuestLog**
  *  (No explicit props, uses `useGameContext` and `useKeyboard` directly)
* **CharacterScreen**
  *  `player: Player` - The player instance.
  *  `onClose: () => void` - Callback to close the screen.
  *  `onEquipItem: (itemId: string) => void` - Callback to equip an item.
  *  `onUnequipItem: (slotType: EquipmentSlotType) => void` - Callback to unequip an item.
  *  `onSpendTalentPoint: (talentId: string) => void` - Callback to spend a talent point.
  *  `onResetTalents: () => void` - Callback to reset talents.
* **Shop**
  *  (No explicit props, uses `useGameContext` and `useKeyboard` directly)
* **FloorTileTest**
  *  (Internal test component, no public props)
* **StatusBar**
  *  (No explicit props, uses `useGameContext` directly)
* **EquipmentDisplay**
  *  `player: PlayerClass` - The player instance.
  *  `onClose: () => void` - Callback to close the display.
  *  `onUnequip: (slotType: EquipmentSlotType) => void` - Callback to unequip an item.
* **WeatherEffects**
  *  `weatherType: 'rain' | 'storm' | 'fog' | 'codeSnow' | 'clear'` - Current weather type.
  *  `transitionProgress: number` - Transition progress (0 to 1).
* **Hotbar**
  *  `inventory: Inventory` - The player's inventory instance.
  *  `player: Player` - The player instance.
  *  `onUseItem: (itemId: string, quantity?: number) => void` - Callback to use an item.
  *  `initialHotbarConfig: (string | null)[]` - Initial hotbar setup.
  *  `onHotbarConfigChange: (newConfig: (string | null)[]) => void` - Callback for config changes.
* **DebugPanel**
  *  (No explicit props, uses `useGame` directly)
* **SplashScreen**
  *  `onStart: () => void` - Callback to start the game.
* **FactionStatus**
  *  (No explicit props, uses `useGameContext` and `useKeyboard` directly)
* **InventoryComponent**
  *  `inventory: Inventory` - The player's inventory instance.
  *  `onClose: () => void` - Callback to close the inventory.
  *  `onUseItem: (itemId: string, quantity?: number) => void` - Callback to use an item.
  *  `player: Player` - The player instance.
  *  `onEquipItem: (itemId: string) => void` - Callback to equip/unequip an item.
  *  `onDropItem?: (itemId: string, quantity: number) => void` - Optional callback to drop an item.
* **Battle**
  *  (No explicit props, uses `useGameContext` directly)
* **QuestJournal**
  *  (No explicit props, uses `useGameContext` and `useKeyboard` directly)
* **VisualEffectsProvider**
  *  `children: React.ReactNode` - Child components.
  *  **Context Hooks**
      *  `useScreenShake(): () => void` - Triggers screen shake.
      *  `useParticle(): (text: string, x: number, y: number) => void` - Triggers a particle effect.
      *  `useGlow(): { triggerGlow: (objectId: string, duration?: number) => void; isGlowing: (objectId: string) => boolean; }` - Triggers/checks glow effect.
      *  `useMapTransition(): (direction: 'in' | 'out', durationMs?: number) => Promise<void>` - Starts map fade transition.
      *  `useLevelUpSparkle(): () => void` - Triggers level-up sparkle effect.
      *  `useCombatHitFlash(): () => void` - Triggers combat hit flash.
* **ItemTooltip**
  *  `item: Item | null` - The item to display tooltip for.
  *  `player: Player | null` - The player instance (for comparison).
  *  `mouseX: number` - Mouse X coordinate.
  *  `mouseY: number` - Mouse Y coordinate.
* **FastTravelModal**
  *  `options: Array<{ mapId: string; position: Position; name: string }>` - Fast travel destinations.
  *  `onSelect: (mapId: string, position: Position) => void` - Callback on selection.
  *  `onClose: () => void` - Callback to close modal.
* **Minimap**
  *  `player: Player` - The player instance.
  *  `currentMap: GameMap` - The current game map.
  *  `npcs: NPC[]` - NPCs on the map.
  *  `onFastTravel: (mapId: string, position: Position) => void` - Callback for fast travel.
* **WeatherDisplay**
  *  `weatherType: WeatherType` - Current weather type.
  *  `effects: WeatherEffects` - Current weather effects.
* **MiniCombatLog**
  *  `logEntries: CombatLogEntry[]` - Array of combat log messages.
* **GameBoard**
  *  (No explicit props, uses `useGameContext` and `useKeyboard` directly)
* **MapGrid**
  *  `currentMap: GameMap` - The current game map.
  *  `playerPos: Position` - Player's position.
  *  `enemies: Enemy[]` - Enemies to display.
  *  `npcs: NPC[]` - NPCs to display.
  *  `items: IItem[]` - Items to display.
  *  `display_width: number` - Display width in tiles.
  *  `display_height: number` - Display height in tiles.
  *  `isAsciiMode: boolean` - Whether to render in ASCII mode.
* **TimeDisplay**
  *  (No explicit props, uses `useGameContext` directly)
* **QuestTracker**
  *  `onOpenJournal: () => void` - Callback to open the quest journal.
  *  `playerPosition: Position` - Player's current position.
* **OpeningScene**
  *  `onComplete: () => void` - Callback when the scene is completed.