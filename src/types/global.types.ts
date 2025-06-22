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
export type TileType = 'walkable' | 'wall' | 'door' | 'water' | 'grass' | 'tree' | 'exit' | 'shop' | 'healer';

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
export type NPCRole = 'wizard' | 'debugger' | 'lost_program' | 'compiler_cat' | 'tutorial';

/**
 * Represents a Non-Player Character.
 */
export interface NPC extends BaseCharacter {
  role: NPCRole;
  dialogueId: string; // Key to retrieve dialogue lines from a dialogue data source
  questStatus?: 'not_started' | 'in_progress' | 'completed'; // Optional: for quest tracking
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
  currentTurn: 'player' | 'enemy'; // Indicates whose team's turn it is
  turnOrder: string[]; // Array of CombatEntity IDs in the order of turns
  log: string[]; // Messages for the battle log
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
  notification: string | null; // Current notification message to display
}