// src/models/Enemy.ts

import {
  Enemy as IEnemy, // Renaming to IEnemy to avoid class/interface name collision
  Position,
  CombatStats,
  Ability,
  StatusEffect,
  StatusEffectType,
  BattleState,
  EnemyType,
  CombatEntity, // Used for targets in combat methods
  AbilityType, // Used in defining enemy abilities
} from '../types/global.types';

/**
 * Defines the specific variants of enemies that can exist in the game.
 */
export enum EnemyVariant {
  BasicBug = 'BasicBug',
  SyntaxError = 'SyntaxError',
  RuntimeError = 'RuntimeError',
  NullPointer = 'NullPointer',
}

/**
 * Defines the static data structure for each enemy variant.
 */
export interface EnemyVariantData {
  name: string;
  type: EnemyType;
  baseStats: CombatStats; // Initial stats for this variant
  abilities: Ability[];
  expReward: number; // Experience points awarded upon defeating this enemy
}

/**
 * Represents an enemy character in the game, implementing the IEnemy interface.
 */
export class Enemy implements IEnemy {
  id: string;
  name: string;
  position: Position;
  statusEffects: StatusEffect[];
  type: EnemyType;
  stats: CombatStats;
  abilities: Ability[];
  expReward: number; // Experience points awarded upon defeat

  /**
   * Static data for all enemy variants. This acts as a blueprint for creating enemies.
   */
  public static readonly ENEMY_DATA: Record<EnemyVariant, EnemyVariantData> = {
    [EnemyVariant.BasicBug]: {
      name: 'Basic Bug',
      type: 'bug',
      baseStats: {
        hp: 30, maxHp: 30, energy: 10, maxEnergy: 10, attack: 8, defense: 5, speed: 7,
      },
      abilities: [
        {
          id: 'bug_bite',
          name: 'Bug Bite',
          description: 'A basic bite attack.',
          type: 'attack',
          cost: 0,
          effect: { damage: 5, target: 'singleEnemy' },
        },
      ],
      expReward: 10,
    },
    [EnemyVariant.SyntaxError]: {
      name: 'Syntax Error',
      type: 'logic_error',
      baseStats: {
        hp: 45, maxHp: 45, energy: 20, maxEnergy: 20, attack: 10, defense: 7, speed: 8,
      },
      abilities: [
        {
          id: 'parse_error',
          name: 'Parse Error',
          description: 'Confuses the target, dealing damage and corrupting them.',
          type: 'attack',
          cost: 5,
          effect: { damage: 8, statusEffect: 'corrupted', duration: 3, target: 'singleEnemy' },
        },
        {
          id: 'syntax_strike',
          name: 'Syntax Strike',
          description: 'A quick, precise strike.',
          type: 'attack',
          cost: 0,
          effect: { damage: 6, target: 'singleEnemy' },
        },
      ],
      expReward: 25,
    },
    [EnemyVariant.RuntimeError]: {
      name: 'Runtime Error',
      type: 'virus',
      baseStats: {
        hp: 60, maxHp: 60, energy: 30, maxEnergy: 30, attack: 12, defense: 10, speed: 6,
      },
      abilities: [
        {
          id: 'crash_program',
          name: 'Crash Program',
          description: 'Deals heavy damage, but costs a lot of energy.',
          type: 'attack',
          cost: 15,
          effect: { damage: 20, target: 'singleEnemy' },
        },
        {
          id: 'system_overload',
          name: 'System Overload',
          description: 'Boosts own attack for a few turns.',
          type: 'buff',
          cost: 10,
          effect: { target: 'self', duration: 2 }, // Actual buff effect (e.g., attack increase) would be applied by BattleManager
        },
        {
          id: 'runtime_strike',
          name: 'Runtime Strike',
          description: 'A standard attack.',
          type: 'attack',
          cost: 0,
          effect: { damage: 7, target: 'singleEnemy' },
        },
      ],
      expReward: 40,
    },
    [EnemyVariant.NullPointer]: {
      name: 'Null Pointer',
      type: 'corrupted_data',
      baseStats: {
        hp: 50, maxHp: 50, energy: 25, maxEnergy: 25, attack: 15, defense: 8, speed: 9,
      },
      abilities: [
        {
          id: 'dereference',
          name: 'Dereference',
          description: 'Attempts to dereference the target, dealing massive damage.',
          type: 'attack',
          cost: 10,
          effect: { damage: 18, target: 'singleEnemy' },
        },
        {
          id: 'void_gaze',
          name: 'Void Gaze',
          description: 'Freezes the target, preventing actions.',
          type: 'debuff',
          cost: 8,
          effect: { statusEffect: 'frozen', duration: 2, target: 'singleEnemy' },
        },
        {
          id: 'null_strike',
          name: 'Null Strike',
          description: 'A quick, unsettling strike.',
          type: 'attack',
          cost: 0,
          effect: { damage: 9, target: 'singleEnemy' },
        },
      ],
      expReward: 60,
    },
  };

  /**
   * Creates an instance of an Enemy.
   * @param id A unique identifier for this enemy instance.
   * @param variant The type of enemy to create (e.g., BasicBug, SyntaxError).
   * @param startPosition The initial position of the enemy on the map.
   */
  constructor(id: string, variant: EnemyVariant, startPosition: Position) {
    this.id = id;
    this.position = startPosition;
    this.statusEffects = [];

    const data = Enemy.ENEMY_DATA[variant];
    if (!data) {
      throw new Error(`Enemy variant ${variant} not found in ENEMY_DATA.`);
    }

    this.name = data.name;
    this.type = data.type;
    // Deep copy baseStats to ensure mutable stats for this instance
    this.stats = { ...data.baseStats };
    // Shallow copy abilities array to avoid modifying static data
    this.abilities = [...data.abilities];
    this.expReward = data.expReward;
  }

  /**
   * Reduces the enemy's HP by the specified amount. HP will not go below 0.
   * @param amount The amount of damage to take.
   */
  takeDamage(amount: number): void {
    this.stats.hp = Math.max(0, this.stats.hp - amount);
  }

  /**
   * Calculates the potential damage output of an ability against a target.
   * This is a simplified calculation.
   * @param ability The ability being used.
   * @param targetDefense The defense stat of the target.
   * @returns The calculated damage amount.
   */
  calculateDamageOutput(ability: Ability, targetDefense: number): number {
    if (ability.effect.damage === undefined) {
      return 0; // Ability does not deal direct damage
    }
    // Simple damage calculation: (Enemy Attack + Ability Damage) - Target Defense
    const baseDamage = this.stats.attack + ability.effect.damage;
    const finalDamage = Math.max(0, baseDamage - targetDefense); // Damage cannot be negative
    return finalDamage;
  }

  /**
   * Retrieves an ability by its ID from the enemy's learned abilities.
   * @param abilityId The ID of the ability to retrieve.
   * @returns The Ability object if found, otherwise undefined.
   */
  getAbility(abilityId: string): Ability | undefined {
    return this.abilities.find(ability => ability.id === abilityId);
  }

  /**
   * Simulates the enemy using an ability, consuming energy.
   * The actual effects on targets are handled by the BattleManager.
   * @param ability The ability to use.
   * @returns True if the ability was successfully used (energy consumed), false otherwise.
   */
  useAbility(ability: Ability): boolean {
    if (this.stats.energy >= ability.cost) {
      this.stats.energy -= ability.cost;
      return true;
    }
    return false; // Not enough energy
  }

  /**
   * Determines the enemy's action during a battle turn.
   * Implements a simple AI: prioritizes damaging abilities, then utility/debuffs.
   * @param battleState The current state of the battle.
   * @returns An object containing the chosen ability and its target ID, or null if no action can be chosen.
   */
  chooseAction(battleState: BattleState): { ability: Ability; targetId: string } | null {
    const availableAbilities = this.abilities.filter(
      (ability) => this.stats.energy >= ability.cost
    );

    // 1. Prioritize damaging abilities
    const damagingAbilities = availableAbilities.filter(
      (ability) => ability.type === 'attack' && ability.effect.damage !== undefined
    );

    if (damagingAbilities.length > 0) {
      // Sort by damage (descending), then by cost (ascending)
      damagingAbilities.sort((a, b) => {
        const damageA = a.effect.damage || 0;
        const damageB = b.effect.damage || 0;
        if (damageA !== damageB) {
          return damageB - damageA; // Higher damage first
        }
        return a.cost - b.cost; // Then lower cost
      });

      const chosenAbility = damagingAbilities[0];
      // For enemies, 'singleEnemy' target typically refers to the player.
      return { ability: chosenAbility, targetId: battleState.player.id };
    }

    // 2. If no damaging abilities, look for other useful abilities (buffs/debuffs/utility)
    const utilityAbilities = availableAbilities.filter(
      (ability) => ability.type !== 'attack'
    );

    if (utilityAbilities.length > 0) {
      // For simplicity, just pick the first available utility ability
      const chosenAbility = utilityAbilities[0];
      let targetId: string;
      if (chosenAbility.effect.target === 'self') {
        targetId = this.id;
      } else {
        targetId = battleState.player.id; // Default to player for other targets
      }
      return { ability: chosenAbility, targetId: targetId };
    }

    // If no suitable abilities can be used (e.g., out of energy or no abilities),
    // the enemy might just pass its turn or perform a very basic default action.
    // Returning null indicates no specific action was chosen by the AI.
    return null;
  }

  /**
   * Applies a new status effect to the enemy. If an effect of the same type already exists,
   * its duration is refreshed/extended, and properties are updated.
   * @param newEffect The status effect to apply.
   */
  applyStatusEffect(newEffect: StatusEffect): void {
    const existingEffectIndex = this.statusEffects.findIndex(
      (effect) => effect.type === newEffect.type
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
      // Add new effect as a copy
      this.statusEffects.push({ ...newEffect });
    }
  }

  /**
   * Updates all active status effects on the enemy.
   * Decrements duration, applies per-turn effects (e.g., damage), and removes expired effects.
   * @returns An array of log messages generated by status effect updates.
   */
  updateStatusEffects(): string[] {
    const logMessages: string[] = [];
    const effectsToRemove: number[] = [];

    this.statusEffects.forEach((effect, index) => {
      // Apply per-turn effects based on type
      switch (effect.type) {
        case 'corrupted':
          if (effect.damagePerTurn !== undefined) {
            this.takeDamage(effect.damagePerTurn);
            logMessages.push(`${this.name} takes ${effect.damagePerTurn} corrupted damage!`);
          }
          break;
        case 'frozen':
          // A frozen enemy might skip its turn, which would be handled by BattleManager based on this status
          logMessages.push(`${this.name} is frozen!`);
          break;
        case 'optimized':
          // Speed multiplier would be applied by BattleManager when calculating turn order
          logMessages.push(`${this.name} is optimized, increasing speed!`);
          break;
        case 'encrypted':
          // Placeholder for future effects
          logMessages.push(`${this.name} is encrypted!`);
          break;
      }

      effect.duration--; // Decrement duration

      if (effect.duration <= 0) {
        effectsToRemove.push(index);
        logMessages.push(`${this.name} is no longer ${effect.type}.`);
      }
    });

    // Remove expired effects, iterating backwards to avoid index shifting issues
    for (let i = effectsToRemove.length - 1; i >= 0; i--) {
      this.statusEffects.splice(effectsToRemove[i], 1);
    }
    return logMessages;
  }
}