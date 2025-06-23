// src/types/global.types.ts

/**
 * Represents 2D coordinates in the game grid.
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Defines the possible directions for movement.
 */
export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Defines the types of tiles that can exist on a game map.
 */
export type TileType = 'walkable' | 'wall' | 'door' | 'water' | 'grass' | 'tree' | 'exit' | 'shop' | 'healer' | 'path' | 'path_one' | 'path_zero' | 'floor' | 'dungeon_floor' | 'locked_door' | 'hidden_area' | 'tech_floor' | 'metal_floor';

/**
 * Represents a single tile on the game map.
 */
export interface Tile {
  walkable: boolean;
  type: TileType;
  /** Optional: The ID of an entity currently occupying this tile. Used for rendering/collision. */
  occupyingEntityId?: string;
}

/**
 * Defines an exit point on a map leading to another map.
 */
export interface Exit {
  position: Position; // The position of the exit tile on the current map
  targetMapId: string; // The ID of the map to transition to
  targetPosition: Position; // The position on the target map where the player will appear
}

/**
 * Defines the categories of items in the game.
 */
export type ItemType = 'consumable' | 'key' | 'equipment' | 'quest';

/**
 * Represents an item in the game world or inventory.
 */
export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  position?: Position; // Optional: If the item is placed on the map
  /** Properties specific to equipment items. */
  stats?: {
    attack?: number;
    defense?: number;
    speed?: number;
  };
  /** Effect of consumable items (e.g., 'restoreHp', 'restoreEnergy'). */
  effect?: string;
  /** Value associated with the effect (e.g., amount of HP/Energy restored). */
  value?: number;
  /** For key items, the ID of what it unlocks (e.g., 'door_id'). */
  targetId?: string;
}

/**
 * Defines the types of equipment slots available to a player.
 */
export type EquipmentSlotType = 'weapon' | 'armor' | 'accessory';

/**
 * Represents an item that can be equipped by the player.
 */
export interface EquippableItem extends Item {
  type: 'equipment';
  equipmentSlotType?: EquipmentSlotType; // Optional: Explicitly defines the slot type
}

/**
 * Defines the categories of abilities.
 */
export type AbilityType = 'attack' | 'heal' | 'utility' | 'buff' | 'debuff';

/**
 * Represents an ability that can be used by players or enemies.
 */
export interface Ability {
  id: string;
  name: string;
  description: string;
  type: AbilityType;
  cost: number; // Energy cost to use the ability
  effect: {
    damage?: number;
    heal?: number;
    statusEffect?: StatusEffectType; // Type of status effect applied by the ability
    target?: 'self' | 'singleEnemy' | 'allEnemies';
    duration?: number; // For buffs/debuffs, in turns
  };
}

/**
 * Defines the types of status effects that can be applied to characters.
 */
export type StatusEffectType = 'frozen' | 'corrupted' | 'optimized' | 'encrypted';

/**
 * Represents an active status effect on a character.
 */
export interface StatusEffect {
  type: StatusEffectType;
  duration: number; // Turns remaining for the effect
  damagePerTurn?: number; // For 'corrupted' effect
  speedMultiplier?: number; // For 'optimized' effect
}

/**
 * Base interface for any character or entity that exists on the map.
 */
export interface BaseCharacter {
  id: string;
  name: string;
  position: Position; // Current position on the map
  statusEffects: StatusEffect[]; // Active status effects on the character
}

/**
 * Represents a character's combat-relevant statistics.
 */
export interface CombatStats {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  attack: number;
  defense: number;
  speed: number;
}

/**
 * Represents a character's full statistics, including progression.
 */
export interface PlayerStats extends CombatStats {
  level: number;
  exp: number;
}

/**
 * Represents the player character, Claude.
 */
export interface Player extends BaseCharacter {
  stats: PlayerStats;
  inventory: Item[];
  abilities: Ability[]; // All abilities learned by the player
  weaponSlot?: EquippableItem;
  armorSlot?: EquippableItem;
  accessorySlot?: EquippableItem;
  activeQuestIds: string[];
  completedQuestIds: string[];
  talentTree: any; // Using 'any' to avoid circular dependency with TalentTree class
  talentPoints: number;
  exploredMaps?: Map<string, Set<string>>; // Map of mapId to Set of explored tile coordinates as "x,y" strings
}

/**
 * Represents an entity participating in combat. This is a flattened view of Player or Enemy for battle.
 */
export interface CombatEntity {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  abilities: Ability[];
  statusEffects: StatusEffect[];
  attack: number;
  defense: number;
  speed: number;
  expReward?: number; // Experience points awarded upon defeating this entity (for enemies)
}

/**
 * Defines the categories of enemies.
 */
export type EnemyType = 'bug' | 'virus' | 'corrupted_data' | 'logic_error' | 'boss';

/**
 * Represents an enemy character.
 */
export interface Enemy extends BaseCharacter {
  type: EnemyType;
  stats: CombatStats; // Enemies also have combat stats
  abilities: Ability[]; // Enemies can have abilities
  expReward: number; // Experience points awarded upon defeating this enemy
}

/**
 * Defines the roles of Non-Player Characters.
 */
export type NPCRole = 'wizard' | 'debugger' | 'lost_program' | 'compiler_cat' | 'tutorial' | 'bard' | 'healer' | 'quest_giver' | 'merchant';

/**
 * NPC Schedule entry - where they should be at what time
 */
export interface NPCScheduleEntry {
  startHour: number; // 0-23
  endHour: number; // 0-23
  position: Position;
  activity?: string; // Optional description like "sleeping", "working", etc.
}

/**
 * Represents a Non-Player Character.
 */
export interface NPC extends BaseCharacter {
  role: NPCRole;
  dialogueId: string; // Key to retrieve dialogue lines from a dialogue data source
  questStatus?: 'not_started' | 'in_progress' | 'completed'; // Optional: for quest tracking
  schedule?: NPCScheduleEntry[]; // Optional daily schedule
  isShopkeeper?: boolean; // Whether this NPC runs a shop
  shopHours?: { open: number; close: number }; // Shop operating hours
}

/**
 * Represents a game map, including its layout and initial entities.
 */
export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: Tile[][];
  /** Initial entities placed on the map. Dynamic entities are managed by GameState. */
  entities: (Enemy | NPC | Item)[];
  exits: Exit[];
}

/**
 * Represents a choice option presented during dialogue.
 */
export interface DialogueOption {
  text: string;
  action: string; // A string representing an action to be dispatched or handled (e.g., 'start_quest_1', 'buy_item', 'end_dialogue')
}

/**
 * Represents the current state of a dialogue interaction.
 */
/**
 * Represents a single line within a dialogue, potentially including choices.
 */
export interface DialogueLine {
  text: string;
  choices?: DialogueOption[];
}

export interface DialogueState {
  speaker: string; // Name of the character speaking
  lines: DialogueLine[]; // Array of all lines for the current dialogue
  currentLineIndex: number; // Index of the current line being displayed
}

/**
 * Represents the current state of a battle.
 */
export interface BattleState {
  player: CombatEntity; // Player's combat representation in the current battle
  enemies: CombatEntity[]; // Enemies' combat representation in the current battle
  currentTurn: string; // Indicates whose entity ID's turn it is
  turnOrder: string[]; // Array of CombatEntity IDs in the order of turns
  log: string[]; // Messages for the battle log
}

/**
 * Shop related types
 */
export interface ShopItem {
  item: Item;
  price: number;
  quantity: number; // -1 for unlimited
}

export interface ShopState {
  npcId: string;
  npcName: string;
  items: ShopItem[];
  playerGold: number;
}

/**
 * Quest related types
 */
export type QuestStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

export type ObjectiveType = 'defeat_enemy' | 'collect_item' | 'talk_to_npc' | 'reach_location';

export interface QuestObjective {
  id: string; // Unique ID for this objective within the quest (e.g., "bug_hunt_obj_0")
  description: string;
  type: ObjectiveType;
  target: string; // ID of enemy type, item ID, NPC ID/role, or location identifier string
  quantity: number; // Required amount for defeat/collect, usually 1 for talk/reach
  currentProgress: number; // Current count for defeat/collect, 0 or 1 for talk/reach
  isCompleted: boolean; // True if this specific objective is met
}

export interface QuestRewards {
  exp: number;
  items: { itemId: string; quantity: number; }[]; // itemId should correspond to ItemVariant
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[];
  currentObjectiveIndex: number; // Index of the next objective to be completed (for sequential quests, or first uncompleted)
  status: QuestStatus;
  rewards: QuestRewards;
  prerequisites: string[]; // Array of quest IDs that must be completed before this one can start
}

/**
 * Combat log entry for displaying battle messages
 */
export interface CombatLogEntry {
  id: string; // Unique ID for React keys
  type: 'damage' | 'healing' | 'ability' | 'info'; // Action type for color coding
  message: string; // The message to display
  timestamp: number; // For ordering
}

/**
 * Represents the time of day in the game
 */
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

/**
 * Time data for save/load
 */
export interface TimeData {
  hours: number;
  minutes: number;
  isPaused: boolean;
  gameTimeElapsedMs?: number; // Optional for backward compatibility
}

/**
 * Represents the different weather types in the game
 */
export type WeatherType = 'clear' | 'rain' | 'storm' | 'fog' | 'codeSnow';

/**
 * Weather data for save/load and state management
 */
export interface WeatherData {
  currentWeather: WeatherType;
  transitionProgress: number; // 0-1 for smooth transitions
  previousWeather: WeatherType | null;
  timeUntilChange: number; // milliseconds
}

/**
 * Weather effects that impact gameplay
 */
export interface WeatherEffects {
  movementSpeedModifier: number;
  visibilityRadius: number;
  combatAccuracyModifier: number;
}

/**
 * The main interface representing the entire game state.
 */
export interface GameState {
  player: Player;
  currentMap: GameMap; // The full current map object
  enemies: Enemy[]; // Dynamic list of enemies currently active on the map
  npcs: NPC[]; // Dynamic list of NPCs currently active on the map
  items: Item[]; // Dynamic list of items currently active on the map (e.g., dropped loot)
  dialogue: DialogueState | null; // Current dialogue state, null if no dialogue is active
  battle: BattleState | null; // Current battle state, null if no battle is active
  gameFlags: Record<string, boolean | number | string>; // Generic flags for tracking story progress, puzzles, etc.
  showInventory: boolean; // Whether the inventory UI is currently displayed
  showQuestLog: boolean; // Whether the quest log UI is currently displayed
  showCharacterScreen: boolean; // Whether the character screen UI is currently displayed
  notification: string | null; // Current notification message to display
  questManagerState?: any; // Quest manager state for saving/loading
  hotbarConfig: (string | null)[]; // Array of item IDs in hotbar slots
  timeData?: TimeData; // Current time state for day/night cycle
  weatherData?: WeatherData; // Current weather state
}
