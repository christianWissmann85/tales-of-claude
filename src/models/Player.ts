// src/models/Player.ts

import {
  Player as IPlayer,
  Position,
  Direction,
  Item,
  Ability,
  StatusEffect,
  PlayerStats,
} from '../types/global.types';
import { TalentTree } from './TalentTree'; // 1. Import TalentTree

/**
 * Defines the types of equipment slots available to a player.
 */
export type EquipmentSlotType = 'weapon' | 'armor' | 'accessory';

/**
 * Represents an item that can be equipped by the player.
 * For now, we'll use the item's id to determine the slot type.
 */
export interface EquippableItem extends Item {
  type: 'equipment';
  equipmentSlotType?: EquipmentSlotType;
}

export class Player implements IPlayer {
  id: string;
  name: string;
  position: Position;
  statusEffects: StatusEffect[];
  private _baseStats: PlayerStats;
  inventory: Item[];
  abilities: Ability[];

  // Equipment slots
  weaponSlot?: EquippableItem;
  armorSlot?: EquippableItem;
  accessorySlot?: EquippableItem;

  // Quest tracking
  activeQuestIds: string[];
  completedQuestIds: string[];

  // Talent System Properties
  talentTree: TalentTree; // 2. Add property: talentTree
  talentPoints: number; // 3. Add property: talentPoints
  
  // Economy
  gold: number;
  
  // Exploration tracking
  exploredMaps: Map<string, Set<string>>; // Track explored tiles per map

  constructor(id: string, name: string, startPosition: Position) {
    this.id = id;
    this.name = name;
    this.position = startPosition;
    this.statusEffects = [];
    this.inventory = [];
    this.abilities = [];

    // Initialize equipment slots
    this.weaponSlot = undefined;
    this.armorSlot = undefined;
    this.accessorySlot = undefined;

    // Initialize quest tracking
    this.activeQuestIds = [];
    this.completedQuestIds = [];

    // Starting stats from GAME_DESIGN.md
    const startingHp = 100;
    const startingEnergy = 50;
    const startingLevel = 1;

    this._baseStats = {
      hp: startingHp,
      maxHp: startingHp,
      energy: startingEnergy,
      maxEnergy: startingEnergy,
      attack: 10, // Default starting attack
      defense: 10, // Default starting defense
      speed: 10, // Default starting speed
      level: startingLevel,
      exp: 0,
    };

    // 4. Initialize talentTree and talentPoints
    this.talentTree = new TalentTree();
    this.talentPoints = 0; // Starts at 0
    
    // Initialize gold
    this.gold = 100; // Starting gold
    
    // Initialize exploration tracking
    this.exploredMaps = new Map();

    // Add initial abilities for Claude
    this.abilities.push(
      {
        id: 'debug',
        name: 'Debug',
        description: 'A basic attack that reveals enemy weaknesses and deals minor damage.',
        type: 'attack',
        cost: 5,
        effect: {
          damage: 15,
          statusEffect: 'corrupted', // Represents vulnerability/weakness
          target: 'singleEnemy',
          duration: 2, // Duration for the 'corrupted' status effect
        },
      },
      {
        id: 'refactor',
        name: 'Refactor',
        description: 'Optimizes your code, restoring a portion of your health.',
        type: 'heal',
        cost: 15,
        effect: {
          heal: 30,
          target: 'self',
        },
      },
      {
        id: 'compile',
        name: 'Compile',
        description: 'Compiles a powerful program, unleashing a devastating attack after a short charge.',
        type: 'attack',
        cost: 25,
        effect: {
          damage: 50,
          target: 'singleEnemy',
        },
      },
      {
        id: 'analyze',
        name: 'Analyze',
        description: 'Analyzes the battlefield, temporarily increasing your defensive capabilities.',
        type: 'buff',
        cost: 10,
        effect: {
          statusEffect: 'optimized', // Represents increased defense/efficiency
          target: 'self',
          duration: 3, // Duration for the 'optimized' status effect
        },
      },
    );
  }

  /**
   * Getter for player stats that includes equipment bonuses.
   */
  get stats(): PlayerStats {
    const calculatedStats: PlayerStats = { ...this._baseStats };

    // Add bonuses from equipped items
    const equippedItems = this.getEquippedItems();
    for (const item of equippedItems) {
      if (item.stats) {
        if (item.stats.attack) { calculatedStats.attack += item.stats.attack; }
        if (item.stats.defense) { calculatedStats.defense += item.stats.defense; }
        if (item.stats.speed) { calculatedStats.speed += item.stats.speed; }
      }
    }

    return calculatedStats;
  }

  /**
   * Moves the player in the specified direction.
   * @param direction The direction to move ('up', 'down', 'left', 'right').
   */
  move(direction: Direction): void {
    switch (direction) {
      case 'up':
        this.position.y--;
        break;
      case 'down':
        this.position.y++;
        break;
      case 'left':
        this.position.x--;
        break;
      case 'right':
        this.position.x++;
        break;
    }
  }

  /**
   * Reduces the player's HP by the specified amount.
   * HP will not go below 0.
   * @param amount The amount of damage to take.
   */
  takeDamage(amount: number): void {
    this._baseStats.hp = Math.max(0, this._baseStats.hp - amount);
  }

  /**
   * Restores the player's HP by the specified amount.
   * HP will not exceed max HP.
   * @param amount The amount of HP to restore.
   */
  heal(amount: number): void {
    this._baseStats.hp = Math.min(this._baseStats.maxHp, this._baseStats.hp + amount);
  }

  /**
   * Consumes the player's energy by the specified amount.
   * Returns true if energy was successfully used, false otherwise (not enough energy).
   * @param amount The amount of energy to use.
   * @returns True if energy was used, false if not enough energy.
   */
  useEnergy(amount: number): boolean {
    if (this._baseStats.energy >= amount) {
      this._baseStats.energy -= amount;
      return true;
    }
    return false;
  }

  /**
   * Restores the player's energy by the specified amount.
   * Energy will not exceed max energy.
   * @param amount The amount of energy to restore.
   */
  restoreEnergy(amount: number): void {
    this._baseStats.energy = Math.min(this._baseStats.maxEnergy, this._baseStats.energy + amount);
  }

  /**
   * Adds experience points to the player.
   * If enough experience is gained, the player will level up.
   * @param amount The amount of experience to add.
   */
  addExperience(amount: number): void {
    this._baseStats.exp += amount;
    const expNeededForNextLevel = this._baseStats.level * 100;

    while (this._baseStats.exp >= expNeededForNextLevel) {
      this._baseStats.exp -= expNeededForNextLevel; // Carry over excess XP
      this.levelUp();
    }
  }

  /**
   * Levels up the player, increasing stats and granting talent points.
   * +10 HP, +5 Energy per level.
   * 5. Adds 3 talent points per level.
   */
  levelUp(): void {
    this._baseStats.level++;
    this._baseStats.maxHp += 10;
    this._baseStats.maxEnergy += 5;
    // Restore HP and Energy to new max values upon level up
    this._baseStats.hp = this._baseStats.maxHp;
    this._baseStats.energy = this._baseStats.maxEnergy;

    // Add talent points
    this.talentPoints += 3;
    console.log(`Player leveled up to ${this._baseStats.level}! Gained 3 talent points. Total: ${this.talentPoints}`);
  }

  /**
   * Adds an item to the player's inventory.
   * @param item The item to add.
   */
  addItem(item: Item): void {
    this.inventory.push(item);
  }

  /**
   * Removes an item from the player's inventory by its ID.
   * Returns the removed item, or undefined if not found.
   * @param itemId The ID of the item to remove.
   * @returns The removed item, or undefined if not found.
   */
  removeItem(itemId: string): Item | undefined {
    const index = this.inventory.findIndex(item => item.id === itemId);
    if (index > -1) {
      const [removedItem] = this.inventory.splice(index, 1);
      return removedItem;
    }
    return undefined;
  }

  /**
   * Checks if the player has an item with the given ID in their inventory.
   * @param itemId The ID of the item to check for.
   * @returns True if the item is found, false otherwise.
   */
  hasItem(itemId: string): boolean {
    return this.inventory.some(item => item.id === itemId);
  }
  
  /**
   * Adds gold to the player's purse.
   * @param amount The amount of gold to add.
   */
  addGold(amount: number): void {
    this.gold += amount;
  }
  
  /**
   * Removes gold from the player's purse.
   * @param amount The amount of gold to remove.
   * @returns True if successful, false if not enough gold.
   */
  removeGold(amount: number): boolean {
    if (this.gold >= amount) {
      this.gold -= amount;
      return true;
    }
    return false;
  }

  /**
   * Teaches the player a new ability.
   * Prevents learning the same ability multiple times.
   * @param ability The ability to learn.
   */
  learnAbility(ability: Ability): void {
    if (!this.abilities.some(a => a.id === ability.id)) {
      this.abilities.push(ability);
    }
  }

  /**
   * Equips an item to the appropriate slot.
   * If a slot is already occupied, the old item is returned.
   * @param item The item to equip.
   * @returns The previously equipped item, or undefined.
   */
  equip(item: Item): EquippableItem | undefined {
    if (item.type !== 'equipment') {
      console.warn(`Cannot equip item ${item.name}: not an equipment type`);
      return undefined;
    }

    const equippableItem = item as EquippableItem;
    
    // Determine slot type from item id if not explicitly set
    let slotType: EquipmentSlotType;
    if (equippableItem.equipmentSlotType) {
      slotType = equippableItem.equipmentSlotType;
    } else {
      // Infer from item id
      if (item.id.includes('sword') || item.id.includes('weapon')) {
        slotType = 'weapon';
      } else if (item.id.includes('armor') || item.id.includes('shield')) {
        slotType = 'armor';
      } else if (item.id.includes('ring') || item.id.includes('amulet') || item.id.includes('accessory')) {
        slotType = 'accessory';
      } else {
        // Default to accessory if can't determine
        slotType = 'accessory';
      }
    }

    let previousItem: EquippableItem | undefined;

    switch (slotType) {
      case 'weapon':
        previousItem = this.weaponSlot;
        this.weaponSlot = equippableItem;
        break;
      case 'armor':
        previousItem = this.armorSlot;
        this.armorSlot = equippableItem;
        break;
      case 'accessory':
        previousItem = this.accessorySlot;
        this.accessorySlot = equippableItem;
        break;
    }

    // Remove equipped item from inventory
    this.removeItem(item.id);

    // Add previous item back to inventory if there was one
    if (previousItem) {
      this.addItem(previousItem);
    }

    return previousItem;
  }

  /**
   * Unequips an item from the specified slot.
   * @param slotType The slot to unequip from.
   * @returns The unequipped item, or undefined.
   */
  unequip(slotType: EquipmentSlotType): EquippableItem | undefined {
    let unequippedItem: EquippableItem | undefined;

    switch (slotType) {
      case 'weapon':
        unequippedItem = this.weaponSlot;
        this.weaponSlot = undefined;
        break;
      case 'armor':
        unequippedItem = this.armorSlot;
        this.armorSlot = undefined;
        break;
      case 'accessory':
        unequippedItem = this.accessorySlot;
        this.accessorySlot = undefined;
        break;
    }

    // Add unequipped item back to inventory
    if (unequippedItem) {
      this.addItem(unequippedItem);
    }

    return unequippedItem;
  }

  /**
   * Returns all currently equipped items.
   * @returns Array of equipped items.
   */
  getEquippedItems(): EquippableItem[] {
    const equipped: EquippableItem[] = [];
    if (this.weaponSlot) { equipped.push(this.weaponSlot); }
    if (this.armorSlot) { equipped.push(this.armorSlot); }
    if (this.accessorySlot) { equipped.push(this.accessorySlot); }
    return equipped;
  }

  /**
   * Updates the player's base stats.
   * Used for loading save games or applying permanent stat changes.
   * @param updates Partial stats to update.
   */
  updateBaseStats(updates: Partial<PlayerStats>): void {
    this._baseStats = { ...this._baseStats, ...updates };
  }

  /**
   * Gets the player's base stats (without equipment bonuses).
   * Useful for save/load operations.
   * @returns The base stats object.
   */
  getBaseStats(): PlayerStats {
    return { ...this._baseStats };
  }

  /**
   * 6. Attempts to spend a talent point on a specific talent.
   * Checks if player has talent points, calls talentTree.investPoint,
   * and decrements talentPoints if successful.
   * @param talentId The ID of the talent to invest in.
   * @returns True if the point was successfully spent, false otherwise.
   */
  spendTalentPoint(talentId: string): boolean {
    if (this.talentPoints <= 0) {
      console.warn('Player has no talent points available to spend.');
      return false;
    }

    // Try to invest the point in the talent tree
    const success = this.talentTree.investPoint(talentId);

    if (success) {
      this.talentPoints--; // Decrement player's master pool
      console.log(`Successfully spent a talent point on ${talentId}. Player talent points remaining: ${this.talentPoints}`);
    }
    return success;
  }

  /**
   * 7. Resets all talents to rank 0 and refunds all spent points to talentPoints.
   */
  resetTalents(): void {
    let spentPoints = 0;
    // Calculate points spent before resetting
    this.talentTree.getAllTalents().forEach(talent => {
      spentPoints += talent.currentRank;
    });

    // Call talentTree's reset method, which internally refunds points to its own pool
    this.talentTree.resetTalents();
    
    // Add the calculated spent points back to the player's master pool.
    // This keeps player.talentPoints in sync with talentTree.availablePoints
    // as talentTree.resetTalents() also adds these points back to its internal pool.
    this.talentPoints += spentPoints;
    console.log(`All talents reset. ${spentPoints} points refunded. Player talent points total: ${this.talentPoints}`);
  }

  /**
   * Marks a tile as explored on the current map.
   * @param mapId The ID of the map.
   * @param x The x coordinate of the tile.
   * @param y The y coordinate of the tile.
   */
  markTileExplored(mapId: string, x: number, y: number): void {
    if (!this.exploredMaps.has(mapId)) {
      this.exploredMaps.set(mapId, new Set());
    }
    const exploredTiles = this.exploredMaps.get(mapId)!;
    exploredTiles.add(`${x},${y}`);
  }

  /**
   * Checks if a tile has been explored on a specific map.
   * @param mapId The ID of the map.
   * @param x The x coordinate of the tile.
   * @param y The y coordinate of the tile.
   * @returns True if the tile has been explored, false otherwise.
   */
  isTileExplored(mapId: string, x: number, y: number): boolean {
    const exploredTiles = this.exploredMaps.get(mapId);
    if (!exploredTiles) { return false; }
    return exploredTiles.has(`${x},${y}`);
  }

  /**
   * Marks tiles around the player as explored (simulating vision radius).
   * @param mapId The ID of the current map.
   * @param visionRadius The radius of tiles to mark as explored.
   */
  markSurroundingTilesExplored(mapId: string, visionRadius: number = 3): void {
    const minX = Math.max(0, this.position.x - visionRadius);
    const maxX = this.position.x + visionRadius;
    const minY = Math.max(0, this.position.y - visionRadius);
    const maxY = this.position.y + visionRadius;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        // Calculate distance from player position
        const distance = Math.sqrt(Math.pow(x - this.position.x, 2) + Math.pow(y - this.position.y, 2));
        if (distance <= visionRadius) {
          this.markTileExplored(mapId, x, y);
        }
      }
    }
  }

  /**
   * Applies a status effect to the player.
   * If the same effect type already exists, it refreshes/updates the effect.
   * @param newEffect The status effect to apply.
   */
  applyStatusEffect(newEffect: StatusEffect): void {
    const existingEffectIndex = this.statusEffects.findIndex(
      (effect) => effect.type === newEffect.type,
    );

    if (existingEffectIndex > -1) {
      // If effect already exists, refresh or extend its duration and update properties
      this.statusEffects[existingEffectIndex].duration = newEffect.duration;
      if (newEffect.damagePerTurn !== undefined) {
        this.statusEffects[existingEffectIndex].damagePerTurn = newEffect.damagePerTurn;
      }
      if (newEffect.speedMultiplier !== undefined) {
        this.statusEffects[existingEffectIndex].speedMultiplier = newEffect.speedMultiplier;
      }
    } else {
      // If it doesn't exist, add the new effect
      this.statusEffects.push(newEffect);
    }
  }

  /**
   * Updates status effects by processing their effects and decrementing duration.
   * This should be called once per turn.
   */
  updateStatusEffects(): void {
    // Process each status effect
    this.statusEffects.forEach((effect) => {
      switch (effect.type) {
        case 'corrupted':
          // Apply damage over time
          if (effect.damagePerTurn) {
            this._baseStats.hp = Math.max(0, this._baseStats.hp - effect.damagePerTurn);
          }
          break;
        case 'frozen':
          // Frozen effect is handled in speed calculations (already done in stats getter)
          break;
        case 'optimized':
          // Optimized effect is handled in speed calculations (already done in stats getter)
          break;
      }

      // Decrement duration
      effect.duration--;
    });

    // Remove expired effects
    this.statusEffects = this.statusEffects.filter((effect) => effect.duration > 0);
  }
}