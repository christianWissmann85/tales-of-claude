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

export class Player implements IPlayer {
  id: string;
  name: string;
  position: Position;
  statusEffects: StatusEffect[];
  stats: PlayerStats;
  inventory: Item[];
  abilities: Ability[];

  constructor(id: string, name: string, startPosition: Position) {
    this.id = id;
    this.name = name;
    this.position = startPosition;
    this.statusEffects = [];
    this.inventory = [];
    this.abilities = [];

    // Starting stats from GAME_DESIGN.md
    const startingHp = 100;
    const startingEnergy = 50;
    const startingLevel = 1;

    this.stats = {
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
    this.stats.hp = Math.max(0, this.stats.hp - amount);
  }

  /**
   * Restores the player's HP by the specified amount.
   * HP will not exceed max HP.
   * @param amount The amount of HP to restore.
   */
  heal(amount: number): void {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
  }

  /**
   * Consumes the player's energy by the specified amount.
   * Returns true if energy was successfully used, false otherwise (not enough energy).
   * @param amount The amount of energy to use.
   * @returns True if energy was used, false if not enough energy.
   */
  useEnergy(amount: number): boolean {
    if (this.stats.energy >= amount) {
      this.stats.energy -= amount;
      return true;
    }
    return false;
  }

  /**
   * Adds experience points to the player.
   * If enough experience is gained, the player will level up.
   * @param amount The amount of experience to add.
   */
  addExperience(amount: number): void {
    this.stats.exp += amount;
    const expNeededForNextLevel = this.stats.level * 100;

    while (this.stats.exp >= expNeededForNextLevel) {
      this.stats.exp -= expNeededForNextLevel; // Carry over excess XP
      this.levelUp();
    }
  }

  /**
   * Levels up the player, increasing stats.
   * +10 HP, +5 Energy per level.
   */
  levelUp(): void {
    this.stats.level++;
    this.stats.maxHp += 10;
    this.stats.maxEnergy += 5;
    // Restore HP and Energy to new max values upon level up
    this.stats.hp = this.stats.maxHp;
    this.stats.energy = this.stats.maxEnergy;
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
   * Teaches the player a new ability.
   * Prevents learning the same ability multiple times.
   * @param ability The ability to learn.
   */
  learnAbility(ability: Ability): void {
    if (!this.abilities.some(a => a.id === ability.id)) {
      this.abilities.push(ability);
    }
  }
}