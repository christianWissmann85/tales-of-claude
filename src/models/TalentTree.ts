// src/models/TalentTree.ts

/**
 * Defines the types of effects a talent can have.
 */
export type TalentEffectType = 'damage_bonus' | 'heal_bonus' | 'cost_reduction' | 'defense_bonus' | 'special';

/**
 * Defines a special effect that a talent can grant.
 */
export type TalentSpecialEffect = 'remove_buffs' | 'group_heal' | 'stun' | 'reveal_weakness';

/**
 * Represents a specific effect granted by a talent.
 */
export interface TalentEffect {
  type: TalentEffectType;
  /**
   * The numerical value of the effect.
   * For 'damage_bonus', 'heal_bonus', 'defense_bonus': a percentage (e.g., 0.1 for 10%).
   * For 'cost_reduction': a flat amount.
   * For 'special': can be 0 or a magnitude if the special effect has a numerical component.
   */
  value: number;
  /**
   * The specific type of special effect. Required if `type` is 'special'.
   */
  specialEffect?: TalentSpecialEffect;
  /**
   * The chance (0-1) for the special effect to occur. Applies only if `type` is 'special'.
   */
  chance?: number;
  /**
   * The minimum talent rank required for this effect to become active.
   * Primarily used for 'special' effects that unlock at a specific rank (e.g., max rank).
   * If undefined, the effect is considered active as long as `currentRank > 0`.
   */
  appliesAtRank?: number;
}

/**
 * Represents a single talent in the talent tree.
 */
export interface Talent {
  id: string;
  name: string;
  description: string;
  abilityId: string; // The ID of the ability this talent enhances (e.g., 'debug', 'refactor')
  maxRank: number; // Maximum points that can be invested in this talent
  currentRank: number; // Current points invested in this talent
  effects: TalentEffect[]; // List of effects this talent provides
}

/**
 * Implements the talent tree system for Tales of Claude.
 * Manages talent definitions, point investment, and bonus calculation.
 */
export class TalentTree {
  private talents: Map<string, Talent>;
  private _availablePoints: number;

  constructor() {
    this.talents = new Map<string, Talent>();
    this._availablePoints = 0; // Player starts with 0 points, gains them through gameplay

    this.initializeTalents();
  }

  /**
   * Getter for available talent points.
   */
  get availablePoints(): number {
    return this._availablePoints;
  }

  /**
   * Adds points to the available pool.
   * @param points The number of points to add. Must be a positive integer.
   */
  addAvailablePoints(points: number): void {
    if (points > 0) {
      this._availablePoints += points;
      console.log(`Added ${points} talent points. Total available: ${this._availablePoints}`);
    } else {
      console.warn('Cannot add non-positive talent points.');
    }
  }

  /**
   * Initializes the predefined talents for the game.
   */
  private initializeTalents(): void {
    // Debug Talent: +10% damage per rank, 20% chance to remove buffs at max rank
    const debugTalent: Talent = {
      id: 'talent_debug_optimize',
      name: 'Optimized Debugging',
      description: 'Increases the damage of Debug by 10% per rank and grants a 20% chance to remove enemy buffs at max rank.',
      abilityId: 'debug',
      maxRank: 5,
      currentRank: 0,
      effects: [
        { type: 'damage_bonus', value: 0.10 }, // 10% per rank
        { type: 'special', specialEffect: 'remove_buffs', chance: 0.20, appliesAtRank: 5, value: 0 }, // Value 0 as it's not a numerical special effect
      ],
    };
    this.talents.set(debugTalent.id, debugTalent);

    // Refactor Talent: +15% healing per rank, 25% chance for group heal at max rank
    const refactorTalent: Talent = {
      id: 'talent_refactor_efficiency',
      name: 'Efficient Refactoring',
      description: 'Increases the healing of Refactor by 15% per rank and grants a 25% chance for group healing at max rank.',
      abilityId: 'refactor',
      maxRank: 5,
      currentRank: 0,
      effects: [
        { type: 'heal_bonus', value: 0.15 }, // 15% per rank
        { type: 'special', specialEffect: 'group_heal', chance: 0.25, appliesAtRank: 5, value: 0 },
      ],
    };
    this.talents.set(refactorTalent.id, refactorTalent);

    // Compile Talent: +20% damage per rank, 15% chance to stun at max rank
    const compileTalent: Talent = {
      id: 'talent_compile_acceleration',
      name: 'Accelerated Compilation',
      description: 'Increases the damage of Compile by 20% per rank and grants a 15% chance to stun enemies at max rank.',
      abilityId: 'compile',
      maxRank: 5,
      currentRank: 0,
      effects: [
        { type: 'damage_bonus', value: 0.20 }, // 20% per rank
        { type: 'special', specialEffect: 'stun', chance: 0.15, appliesAtRank: 5, value: 0 },
      ],
    };
    this.talents.set(compileTalent.id, compileTalent);

    // Analyze Talent: +10% defense boost per rank, reveals weaknesses at max rank
    const analyzeTalent: Talent = {
      id: 'talent_analyze_depth',
      name: 'Deep Analysis',
      description: 'Increases the defense boost from Analyze by 10% per rank and reveals enemy weaknesses at max rank.',
      abilityId: 'analyze',
      maxRank: 5,
      currentRank: 0,
      effects: [
        { type: 'defense_bonus', value: 0.10 }, // 10% per rank
        { type: 'special', specialEffect: 'reveal_weakness', appliesAtRank: 5, value: 0 }, // No chance specified, assume 100% at max rank
      ],
    };
    this.talents.set(analyzeTalent.id, analyzeTalent);
  }

  /**
   * Attempts to invest a point into a specified talent.
   * @param talentId The ID of the talent to invest a point in.
   * @returns True if the point was successfully invested, false otherwise.
   */
  investPoint(talentId: string): boolean {
    const talent = this.talents.get(talentId);

    if (!talent) {
      console.warn(`Talent with ID "${talentId}" not found.`);
      return false;
    }

    if (this._availablePoints <= 0) {
      console.warn('Not enough available talent points.');
      return false;
    }

    if (talent.currentRank >= talent.maxRank) {
      console.warn(`Talent "${talent.name}" is already at max rank (${talent.maxRank}).`);
      return false;
    }

    talent.currentRank++;
    this._availablePoints--;
    console.log(`Invested point in "${talent.name}". Current rank: ${talent.currentRank}. Available points: ${this._availablePoints}`);
    return true;
  }

  /**
   * Resets all talents to rank 0 and refunds all invested points.
   */
  resetTalents(): void {
    let refundedPoints = 0;
    this.talents.forEach(talent => {
      refundedPoints += talent.currentRank;
      talent.currentRank = 0;
    });
    this._availablePoints += refundedPoints;
    console.log(`All talents reset. ${refundedPoints} points refunded. Total available points: ${this._availablePoints}`);
  }

  /**
   * Calculates the total numerical bonus for a specific ability and effect type.
   * This sums up per-rank bonuses from talents linked to the given ability.
   * @param abilityId The ID of the ability (e.g., 'debug', 'refactor').
   * @param effectType The type of numerical bonus to retrieve ('damage_bonus', 'heal_bonus', 'cost_reduction', 'defense_bonus').
   * @returns The total bonus value (e.g., 0.30 for 30% bonus).
   */
  getTalentBonus(abilityId: string, effectType: 'damage_bonus' | 'heal_bonus' | 'cost_reduction' | 'defense_bonus'): number {
    let totalBonus = 0;

    this.talents.forEach(talent => {
      if (talent.abilityId === abilityId && talent.currentRank > 0) {
        talent.effects.forEach(effect => {
          // Numerical bonuses are assumed to be cumulative per rank.
          // The 'appliesAtRank' property is primarily for 'special' effects that activate at a certain rank.
          if (effect.type === effectType) {
            totalBonus += effect.value * talent.currentRank;
          }
        });
      }
    });
    return totalBonus;
  }

  /**
   * Retrieves all active special effects for a given ability.
   * Special effects are active if the talent's current rank meets or exceeds their `appliesAtRank` requirement.
   * @param abilityId The ID of the ability.
   * @returns An array of active special TalentEffect objects.
   */
  getTalentSpecialEffects(abilityId: string): TalentEffect[] {
    const activeSpecialEffects: TalentEffect[] = [];

    this.talents.forEach(talent => {
      if (talent.abilityId === abilityId && talent.currentRank > 0) {
        talent.effects.forEach(effect => {
          if (effect.type === 'special' && effect.specialEffect) {
            // Check if the talent's current rank meets the requirement for this special effect
            if (effect.appliesAtRank === undefined || talent.currentRank >= effect.appliesAtRank) {
              activeSpecialEffects.push(effect);
            }
          }
        });
      }
    });
    return activeSpecialEffects;
  }

  /**
   * Returns a specific talent by its ID.
   * @param talentId The ID of the talent.
   * @returns The Talent object, or undefined if not found.
   */
  getTalent(talentId: string): Talent | undefined {
    return this.talents.get(talentId);
  }

  /**
   * Returns all talents in the tree as a Map.
   * @returns A Map of all talents, keyed by their ID.
   */
  getAllTalents(): Map<string, Talent> {
    // Return a copy to prevent external modification of the internal map
    return new Map(this.talents);
  }
}