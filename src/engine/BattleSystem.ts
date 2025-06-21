// src/systems/BattleSystem.ts

import {
  BattleState,
  CombatEntity,
  Ability,
  Item,
  StatusEffect,
  StatusEffectType,
} from '../types/global.types';
import { Player } from '../models/Player'; // Used for initial battle setup
import { Enemy } from '../models/Enemy'; // Used for initial battle setup
import { GameAction } from '../context/GameContext'; // Import GameAction type

class BattleSystem {
  private dispatch: React.Dispatch<GameAction>;

  constructor(dispatch: React.Dispatch<GameAction>) {
    this.dispatch = dispatch;
  }

  /**
   * Initiates a battle. This method dispatches the START_BATTLE action to the game context.
   * The actual BattleState creation and initial setup is handled by the GameContext reducer.
   * @param player The current Player instance.
   * @param enemies An array of Enemy instances to fight.
   */
  public startBattle(player: Player, enemies: Enemy[]): void {
    this.dispatch({ type: 'START_BATTLE', payload: { enemies } });
  }

  /**
   * Ends the current battle. This method dispatches the END_BATTLE action to the game context.
   * The GameContext reducer will handle updating the player's actual state (HP, EXP, items)
   * based on the battle outcome.
   * @param battle The current BattleState.
   * @param playerWon True if the player won, false otherwise (fled or lost).
   * @param playerCombatState The final CombatEntity snapshot of the player from the battle.
   * @param expGained Experience points awarded to the player if they won.
   * @param itemsDropped Items dropped by defeated enemies.
   */
  public endBattle(
    battle: BattleState,
    playerWon: boolean,
    playerCombatState: CombatEntity,
    expGained: number = 0,
    itemsDropped: Item[] = [],
  ): void {
    this.dispatch({
      type: 'END_BATTLE',
      payload: {
        playerWon,
        playerCombatState,
        playerExpGained: expGained,
        itemsDropped,
      },
    });
  }

  /**
   * Helper to find a CombatEntity by ID from the battle state.
   * @param battle The current BattleState.
   * @param entityId The ID of the entity to find.
   * @returns The CombatEntity or undefined if not found.
   */
  private findEntity(battle: BattleState, entityId: string): CombatEntity | undefined {
    if (battle.player.id === entityId) {
      return battle.player;
    }
    return battle.enemies.find((e) => e.id === entityId);
  }

  /**
   * Helper to update a CombatEntity within an immutable BattleState.
   * This ensures that when an entity's properties are changed, a new BattleState object
   * and new entity objects are created for React's immutability checks.
   * @param battle The current BattleState.
   * @param updatedEntity The CombatEntity with updated properties.
   * @returns A new BattleState with the entity updated.
   */
  private updateEntityInBattleState(battle: BattleState, updatedEntity: CombatEntity): BattleState {
    if (battle.player.id === updatedEntity.id) {
      return { ...battle, player: { ...updatedEntity } };
    }
    return {
      ...battle,
      enemies: battle.enemies.map((e) =>
        e.id === updatedEntity.id ? { ...updatedEntity } : { ...e }
      ),
    };
  }

  /**
   * Calculates the damage an attacker deals to a target, considering base attack and defense.
   * @param attacker The attacking CombatEntity.
   * @param target The defending CombatEntity.
   * @param ability Optional ability used, for additional damage.
   * @returns The calculated damage amount.
   */
  private calculateDamage(attacker: CombatEntity, target: CombatEntity, ability?: Ability): number {
    let baseDamage = attacker.attack;
    if (ability && ability.effect.damage !== undefined) {
      baseDamage += ability.effect.damage;
    }
    const finalDamage = Math.max(0, baseDamage - target.defense);
    return finalDamage;
  }

  /**
   * Applies a status effect to a CombatEntity.
   * @param entity The CombatEntity to apply the effect to.
   * @param newEffect The StatusEffect to apply.
   */
  private applyStatusEffectToCombatEntity(entity: CombatEntity, newEffect: StatusEffect): void {
    const existingEffectIndex = entity.statusEffects.findIndex(
      (effect) => effect.type === newEffect.type
    );

    if (existingEffectIndex > -1) {
      // If effect already exists, refresh or extend its duration and update properties
      entity.statusEffects[existingEffectIndex].duration = newEffect.duration;
      if (newEffect.damagePerTurn !== undefined) {
        entity.statusEffects[existingEffectIndex].damagePerTurn = newEffect.damagePerTurn;
      }
      if (newEffect.speedMultiplier !== undefined) {
        entity.statusEffects[existingEffectIndex].speedMultiplier = newEffect.speedMultiplier;
      }
    } else {
      // Add new effect as a copy
      entity.statusEffects.push({ ...newEffect });
    }
  }

  /**
   * Updates all active status effects on a CombatEntity.
   * Decrements duration, applies per-turn effects (e.g., damage), and removes expired effects.
   * @param entity The CombatEntity whose status effects are to be updated.
   * @returns An array of log messages generated by status effect updates.
   */
  private updateStatusEffectsForCombatEntity(entity: CombatEntity): string[] {
    const logMessages: string[] = [];
    const effectsToRemove: number[] = [];

    // Create a mutable copy of statusEffects for iteration and modification
    const currentEffects = [...entity.statusEffects];

    currentEffects.forEach((effect, index) => {
      // Apply per-turn effects based on type
      switch (effect.type) {
        case 'corrupted':
          if (effect.damagePerTurn !== undefined) {
            const damage = effect.damagePerTurn;
            entity.hp = Math.max(0, entity.hp - damage);
            logMessages.push(`${entity.name} takes ${damage} corrupted damage!`);
          }
          break;
        case 'frozen':
          // The 'frozen' effect primarily skips turns, which is handled in advanceTurn.
          // This log message indicates its presence.
          logMessages.push(`${entity.name} is frozen!`);
          break;
        case 'optimized':
          // Speed multiplier would be applied by BattleManager when calculating turn order
          logMessages.push(`${entity.name} is optimized, increasing speed!`);
          break;
        case 'encrypted':
          // Placeholder for future effects
          logMessages.push(`${entity.name} is encrypted!`);
          break;
      }

      // Note: Duration decrement for 'frozen' is handled in advanceTurn if it skips a turn.
      // For other effects, decrement here.
      if (effect.type !== 'frozen') {
        effect.duration--;
      }

      if (effect.duration <= 0) {
        effectsToRemove.push(index);
        logMessages.push(`${entity.name} is no longer ${effect.type}.`);
      }
    });

    // Remove expired effects, iterating backwards to avoid index shifting issues
    for (let i = effectsToRemove.length - 1; i >= 0; i--) {
      currentEffects.splice(effectsToRemove[i], 1);
    }
    entity.statusEffects = currentEffects; // Update the entity's status effects
    return logMessages;
  }

  /**
   * Applies the effects of an ability from a caster to a target(s).
   * @param caster The CombatEntity casting the ability.
   * @param target The CombatEntity target of the ability (can be caster itself).
   * @param ability The ability being used.
   * @param battle The current BattleState (needed for 'allEnemies' target).
   * @returns An array of log messages generated by the ability's effects.
   */
  private applyAbilityEffect(
    caster: CombatEntity,
    target: CombatEntity, // This 'target' is the primary target for single-target abilities
    ability: Ability,
    battle: BattleState
  ): string[] {
    const logMessages: string[] = [];
    const affectedEntities: CombatEntity[] = [];

    if (ability.effect.target === 'self') {
      affectedEntities.push(caster);
    } else if (ability.effect.target === 'singleEnemy') {
      affectedEntities.push(target);
    } else if (ability.effect.target === 'allEnemies') {
      // If player is casting, target all enemies. If enemy is casting, target player.
      if (caster.id === battle.player.id) {
        affectedEntities.push(...battle.enemies.filter(e => e.hp > 0)); // Only target living enemies
      } else {
        affectedEntities.push(battle.player); // Enemies typically target player
      }
    }

    affectedEntities.forEach((currentAbilityTarget) => {
      // Apply damage
      if (ability.effect.damage !== undefined) {
        const damage = this.calculateDamage(caster, currentAbilityTarget, ability);
        currentAbilityTarget.hp = Math.max(0, currentAbilityTarget.hp - damage);
        logMessages.push(`${caster.name} uses ${ability.name} on ${currentAbilityTarget.name}, dealing ${damage} damage!`);
      }

      // Apply healing
      if (ability.effect.heal !== undefined) {
        currentAbilityTarget.hp = Math.min(
          currentAbilityTarget.maxHp,
          currentAbilityTarget.hp + ability.effect.heal
        );
        logMessages.push(`${caster.name} uses ${ability.name} on ${currentAbilityTarget.name}, healing ${ability.effect.heal} HP!`);
      }

      // Apply status effect
      if (ability.effect.statusEffect !== undefined && ability.effect.duration !== undefined) {
        const newStatusEffect: StatusEffect = {
          type: ability.effect.statusEffect,
          duration: ability.effect.duration,
        };
        // Add specific properties for certain effects
        if (newStatusEffect.type === 'corrupted') {
          newStatusEffect.damagePerTurn = 5; // Example: Corrupted deals 5 damage per turn
        } else if (newStatusEffect.type === 'optimized') {
          newStatusEffect.speedMultiplier = 1.2; // Example: Optimized increases speed by 20%
        }
        this.applyStatusEffectToCombatEntity(currentAbilityTarget, newStatusEffect);
        logMessages.push(`${caster.name} applies ${ability.effect.statusEffect} to ${currentAbilityTarget.name}!`);
      }
    });

    return logMessages;
  }

  /**
   * Performs a basic attack action in battle.
   * @param battle The current BattleState.
   * @param attackerId The ID of the attacking entity.
   * @param targetId The ID of the target entity.
   * @returns A new BattleState after the attack, or null if battle ended.
   */
  public performAttack(battle: BattleState, attackerId: string, targetId: string): BattleState | null {
    let newBattle = { ...battle }; // Create a mutable copy for updates

    const attacker = this.findEntity(newBattle, attackerId);
    const target = this.findEntity(newBattle, targetId);

    if (!attacker || !target) {
      newBattle.log.push('Error: Attacker or target not found.');
      return newBattle;
    }

    const damage = this.calculateDamage(attacker, target);

    // Apply damage to a cloned target entity
    const updatedTarget = { ...target, hp: Math.max(0, target.hp - damage) };
    newBattle = this.updateEntityInBattleState(newBattle, updatedTarget);

    newBattle.log = [...newBattle.log, `${attacker.name} attacks ${target.name}, dealing ${damage} damage!`];

    return this.advanceTurn(newBattle);
  }

  /**
   * Uses an ability in battle.
   * @param battle The current BattleState.
   * @param casterId The ID of the entity using the ability.
   * @param abilityId The ID of the ability to use.
   * @param targetId Optional: The ID of the specific target for single-target abilities.
   * @returns A new BattleState after the ability use, or null if battle ended.
   */
  public useAbility(battle: BattleState, casterId: string, abilityId: string, targetId?: string): BattleState | null {
    let newBattle = { ...battle };

    const caster = this.findEntity(newBattle, casterId);
    if (!caster) {
      newBattle.log.push('Error: Caster not found.');
      return newBattle;
    }

    const ability = caster.abilities.find((a) => a.id === abilityId);
    if (!ability) {
      newBattle.log.push(`${caster.name} does not have ability ${abilityId}.`);
      return newBattle;
    }

    if (caster.energy < ability.cost) {
      newBattle.log.push(`${caster.name} does not have enough energy to use ${ability.name}.`);
      return newBattle;
    }

    // Consume energy from a cloned caster entity
    const updatedCaster = { ...caster, energy: caster.energy - ability.cost };
    newBattle = this.updateEntityInBattleState(newBattle, updatedCaster);

    // Determine the actual target entity for single-target abilities
    let actualTarget: CombatEntity | undefined;
    if (ability.effect.target === 'singleEnemy' && targetId) {
      actualTarget = this.findEntity(newBattle, targetId);
      if (!actualTarget) {
        newBattle.log.push('Error: Target not found for ability.');
        return newBattle;
      }
    } else if (ability.effect.target === 'self') {
      actualTarget = updatedCaster; // Target is the caster itself
    } else if (ability.effect.target === 'allEnemies') {
      // No specific single target needed, apply to all relevant entities
    } else {
      newBattle.log.push('Error: Invalid target for ability or target not specified.');
      return newBattle;
    }

    // Apply ability effects and get log messages
    // Pass updatedCaster and actualTarget (which are references to entities within newBattle)
    const effectLogs = this.applyAbilityEffect(updatedCaster, actualTarget || updatedCaster, ability, newBattle);
    newBattle.log = [...newBattle.log, ...effectLogs];

    // Ensure all entities are updated in the newBattle state after effects
    // This is crucial if applyAbilityEffect modified entities directly (which it does via reference)
    // We need to re-map to ensure immutability is maintained at the top level.
    newBattle = {
      ...newBattle,
      player: { ...newBattle.player }, // Shallow copy to ensure new reference
      enemies: newBattle.enemies.map(e => ({ ...e })), // Shallow copy each enemy
    };

    return this.advanceTurn(newBattle);
  }

  /**
   * Uses an item in battle. Only the player can use items.
   * @param battle The current BattleState.
   * @param playerId The ID of the player.
   * @param item The Item object to use.
   * @returns A new BattleState after item use, or null if battle ended.
   */
  public useItem(battle: BattleState, playerId: string, item: Item): BattleState | null {
    let newBattle = { ...battle };

    const playerCombatEntity = newBattle.player;
    if (playerCombatEntity.id !== playerId) {
      newBattle.log.push('Error: Item can only be used by the player.');
      return newBattle;
    }

    // Apply item effect
    if (item.effect === 'restoreHp' && item.value !== undefined) {
      playerCombatEntity.hp = Math.min(playerCombatEntity.maxHp, playerCombatEntity.hp + item.value);
      newBattle.log.push(`${playerCombatEntity.name} uses ${item.name}, restoring ${item.value} HP.`);
    } else if (item.effect === 'restoreEnergy' && item.value !== undefined) {
      playerCombatEntity.energy = Math.min(playerCombatEntity.maxEnergy, playerCombatEntity.energy + item.value);
      newBattle.log.push(`${playerCombatEntity.name} uses ${item.name}, restoring ${item.value} Energy.`);
    } else {
      newBattle.log.push(`${playerCombatEntity.name} uses ${item.name}, but it has no effect.`);
    }

    // Dispatch action to remove item from player's inventory in the main game state
    this.dispatch({ type: 'REMOVE_ITEM', payload: { itemId: item.id, fromPlayerInventory: true } });

    // Ensure player is updated in the newBattle state
    newBattle = { ...newBattle, player: { ...playerCombatEntity } };

    return this.advanceTurn(newBattle);
  }

  /**
   * Attempts to flee from battle.
   * @param battle The current BattleState.
   * @param playerId The ID of the player.
   * @param playerSpeed The player's current speed.
   * @param enemySpeeds An array of speeds of all active enemies.
   * @returns A new BattleState if flee failed, or null if battle ended (flee successful).
   */
  public flee(battle: BattleState, playerId: string, playerSpeed: number, enemySpeeds: number[]): BattleState | null {
    let newBattle = { ...battle };

    const avgEnemySpeed = enemySpeeds.length > 0 ? enemySpeeds.reduce((sum, speed) => sum + speed, 0) / enemySpeeds.length : 1;
    const fleeChance = Math.min(0.9, Math.max(0.1, (playerSpeed / (playerSpeed + avgEnemySpeed)) * 0.5 + 0.25)); // Cap chance between 10% and 90%

    if (Math.random() < fleeChance) {
      newBattle.log.push(`${newBattle.player.name} successfully fled the battle!`);
      this.endBattle(newBattle, false, newBattle.player); // Player did not win, but no penalty
      return null; // Battle ended
    } else {
      newBattle.log.push(`${newBattle.player.name} failed to flee!`);
      return this.advanceTurn(newBattle); // Flee failed, advance turn
    }
  }

  /**
   * Handles an enemy's turn in battle.
   * @param battle The current BattleState.
   * @param enemyId The ID of the enemy whose turn it is.
   * @returns A new BattleState after the enemy's turn, or null if battle ended.
   */
  public handleEnemyTurn(battle: BattleState, enemyId: string): BattleState | null {
    let newBattle = { ...battle };

    const enemy = this.findEntity(newBattle, enemyId);
    if (!enemy) {
      newBattle.log.push('Error: Enemy not found for turn.');
      return newBattle;
    }

    // Apply per-turn status effects
    const statusLog = this.updateStatusEffectsForCombatEntity(enemy);
    newBattle.log = [...newBattle.log, ...statusLog];

    // Check if enemy is defeated after status effects
    if (enemy.hp <= 0) {
      newBattle.log.push(`${enemy.name} was defeated by status effects!`);
      newBattle = this.updateEntityInBattleState(newBattle, { ...enemy, hp: 0 }); // Ensure HP is 0
      return this.advanceTurn(newBattle); // Advance turn as enemy is defeated
    }

    // Check for 'frozen' status effect
    const isFrozen = enemy.statusEffects.some(se => se.type === 'frozen');
    if (isFrozen) {
      newBattle.log.push(`${enemy.name} is frozen and cannot act!`);
      return this.advanceTurn(newBattle); // Skip turn, advance
    }

    // Simple Enemy AI:
    // 1. Prioritize damaging abilities if enough energy
    // 2. Otherwise, use a basic attack
    const availableAbilities = enemy.abilities.filter(
      (ability) => enemy.energy >= ability.cost
    );

    let chosenAbility: Ability | undefined;
    let targetEntity: CombatEntity = newBattle.player; // Default target is player

    // Try to find a damaging ability
    const damagingAbilities = availableAbilities.filter(
      (ability) => ability.type === 'attack' && ability.effect.damage !== undefined
    ).sort((a, b) => (b.effect.damage || 0) - (a.effect.damage || 0)); // Sort by highest damage

    if (damagingAbilities.length > 0) {
      chosenAbility = damagingAbilities[0];
    } else {
      // If no damaging abilities, try to find a utility/buff/debuff
      const utilityAbilities = availableAbilities.filter(
        (ability) => ability.type !== 'attack'
      );
      if (utilityAbilities.length > 0) {
        chosenAbility = utilityAbilities[0]; // Just pick the first one
        if (chosenAbility.effect.target === 'self') {
          targetEntity = enemy;
        }
      }
    }

    if (chosenAbility) {
      // Use ability
      const updatedEnemy = { ...enemy, energy: enemy.energy - chosenAbility.cost };
      newBattle = this.updateEntityInBattleState(newBattle, updatedEnemy);

      const effectLogs = this.applyAbilityEffect(updatedEnemy, targetEntity, chosenAbility, newBattle);
      newBattle.log = [...newBattle.log, ...effectLogs];
    } else {
      // Default to basic attack if no abilities can be used
      const damage = this.calculateDamage(enemy, newBattle.player);
      newBattle.player.hp = Math.max(0, newBattle.player.hp - damage);
      newBattle.log.push(`${enemy.name} attacks ${newBattle.player.name}, dealing ${damage} damage!`);
    }

    // Ensure all entities are updated in the newBattle state after effects
    newBattle = {
      ...newBattle,
      player: { ...newBattle.player },
      enemies: newBattle.enemies.map(e => ({ ...e })),
    };

    return this.advanceTurn(newBattle);
  }

  /**
   * Advances the battle to the next turn, handling end-of-turn effects and checking for battle end.
   * @param battle The current BattleState.
   * @returns A new BattleState for the next turn, or null if the battle has ended.
   */
  private advanceTurn(battle: BattleState): BattleState | null {
    let newBattle = { ...battle };

    // 1. Check for battle end conditions
    const allEnemiesDefeated = newBattle.enemies.every((e) => e.hp <= 0);
    const playerDefeated = newBattle.player.hp <= 0;

    if (playerDefeated) {
      newBattle.log.push(`${newBattle.player.name} has been defeated!`);
      this.endBattle(newBattle, false, newBattle.player);
      return null; // Battle ended
    }

    if (allEnemiesDefeated) {
      newBattle.log.push('All enemies defeated! You won!');
      // In a full game, EXP and item drops would be calculated here based on original Enemy data.
      // For this recreation, we assume GameContext handles the final EXP/item calculation.
      const totalExpGained = 0; // Placeholder
      const itemsDropped: Item[] = []; // Placeholder

      this.endBattle(newBattle, true, newBattle.player, totalExpGained, itemsDropped);
      return null; // Battle ended
    }

    // 2. Determine next turn
    const currentTurnEntityId = newBattle.currentTurn === 'player' ? newBattle.player.id : newBattle.turnOrder.find(id => newBattle.enemies.some(e => e.id === id && e.id === newBattle.currentTurn)) || '';
    const currentTurnIndex = newBattle.turnOrder.indexOf(currentTurnEntityId);

    let nextTurnIndex = (currentTurnIndex + 1) % newBattle.turnOrder.length;
    let nextEntityId = newBattle.turnOrder[nextTurnIndex];
    let nextEntity = this.findEntity(newBattle, nextEntityId);

    // Loop to find the next active entity (not defeated, not frozen)
    let turnsSkipped = 0;
    const maxSkipAttempts = newBattle.turnOrder.length * 2; // Prevent infinite loop

    while (nextEntity && (nextEntity.hp <= 0 || nextEntity.statusEffects.some(se => se.type === 'frozen'))) {
      if (nextEntity.hp <= 0) {
        newBattle.log.push(`${nextEntity.name} is defeated and skips turn.`);
      } else if (nextEntity.statusEffects.some(se => se.type === 'frozen')) {
        // Decrement frozen duration here, as it's a turn-skipping effect
        const frozenEffect = nextEntity.statusEffects.find(se => se.type === 'frozen');
        if (frozenEffect) {
          frozenEffect.duration--;
          if (frozenEffect.duration <= 0) {
            // Remove the effect by filtering it out from a new array
            nextEntity.statusEffects = nextEntity.statusEffects.filter(se => se.type !== 'frozen');
            newBattle.log.push(`${nextEntity.name} is no longer frozen.`);
          }
        }
        newBattle.log.push(`${nextEntity.name} is frozen and skips turn.`);
      }

      turnsSkipped++;
      if (turnsSkipped > maxSkipAttempts) {
        console.error("Infinite loop detected in turn order advancement. Breaking.");
        return null; // Or handle error appropriately, e.g., force end battle
      }

      nextTurnIndex = (nextTurnIndex + 1) % newBattle.turnOrder.length;
      nextEntityId = newBattle.turnOrder[nextTurnIndex];
      nextEntity = this.findEntity(newBattle, nextEntityId);
    }

    if (!nextEntity) {
      // This should ideally not happen if battle is not over, but as a safeguard
      console.error("Could not find next active entity, battle might be in an unresolvable state.");
      return null;
    }

    // Fix for line 253:
    newBattle.currentTurn = nextEntity.id === newBattle.player.id ? 'player' : 'enemy';

    newBattle.log.push(`--- ${nextEntity.name}'s Turn ---`);

    // Ensure all entities are updated in the newBattle state after any modifications
    // (e.g., status effect duration changes)
    newBattle = {
      ...newBattle,
      player: { ...newBattle.player },
      enemies: newBattle.enemies.map(e => ({ ...e })),
    };

    return newBattle;
  }
}

export default BattleSystem;