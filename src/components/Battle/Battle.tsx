import React, { useState, useEffect, useRef } from 'react';
import { BattleState, CombatEntity, Ability, Item, StatusEffect } from '../../types/global.types';
import { useGameContext } from '../../context/GameContext';
import BattleSystem from '../../engine/BattleSystem'; // Fix: default export and correct path
import styles from './Battle.module.css';

const Battle: React.FC = () => {
  const { state, dispatch } = useGameContext();
  // Use local state for battle updates, initialized from global context
  const [localBattleState, setLocalBattleState] = useState<BattleState | null>(state.battle);

  // Use useRef to hold the BattleSystem instance. This ensures it's stable across renders
  // and maintains its internal state, while still having access to the latest dispatch function.
  const battleSystemRef = useRef<BattleSystem | null>(null);
  if (!battleSystemRef.current) {
    // Pass the global dispatch to BattleSystem for END_BATTLE action
    battleSystemRef.current = new BattleSystem(dispatch);
  }
  const battleSystem = battleSystemRef.current;

  // State for player action selection
  const [selectedAbilityId, setSelectedAbilityId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isSelectingTarget, setIsSelectingTarget] = useState(false);
  const [actionType, setActionType] = useState<'attack' | 'ability' | null>(null);

  // Ref for auto-scrolling the battle log
  const battleLogRef = useRef<HTMLDivElement>(null);

  // Sync local battle state with global context state.battle
  // This is important for when a battle starts (state.battle changes from null to BattleState)
  // or when it ends (state.battle changes from BattleState to null).
  useEffect(() => {
    setLocalBattleState(state.battle);
  }, [state.battle]);

  // Scroll battle log to bottom on updates
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [localBattleState?.log]); // Use localBattleState

  // Handle enemy turns
  useEffect(() => {
    // Use localBattleState
    if (!localBattleState || localBattleState.currentTurn === 'player') {
      return;
    }

    // Find the current enemy whose turn it is
    const currentEnemyId = localBattleState.turnOrder.find(id =>
      id !== localBattleState.player.id && localBattleState.enemies.some(e => e.id === id)
    );

    if (!currentEnemyId) {
      return;
    }

    const enemyTurnDelay = 1500; // 1.5 seconds delay for enemy actions for better UX

    const timer = setTimeout(() => {
      // Re-check localBattleState as it might have changed during the delay (e.g., player won)
      if (localBattleState) {
        const updatedBattleState = battleSystem.handleEnemyTurn(localBattleState, currentEnemyId);
        // Update the local battle state
        setLocalBattleState(updatedBattleState);
      }
    }, enemyTurnDelay);

    return () => clearTimeout(timer); // Cleanup timer on unmount or dependency change
  }, [localBattleState?.currentTurn, localBattleState?.turnOrder, localBattleState, battleSystem]); // Removed dispatch from dependencies

  // If localBattleState is null, it means no battle is active or it has ended.
  if (!localBattleState) {
    return <div className={styles.battleContainer}>Battle has ended or not started.</div>;
  }

  const player = localBattleState.player;
  // Filter out defeated enemies for display
  const enemies = localBattleState.enemies.filter(e => e.hp > 0);

  // Helper function to get emoji based on entity name
  const getEmojiForEntity = (entity: CombatEntity) => {
    if (entity.id === player.id) return '🤖';
    if (entity.name.includes('Bug')) return '👾';
    if (entity.name.includes('Virus')) return '🦠';
    if (entity.name.includes('Corrupted Data')) return '🗑️';
    if (entity.name.includes('Logic Error')) return '🐛';
    return '❓'; // Default emoji for unknown enemies
  };

  // Helper function to render HP bar
  const renderHpBar = (currentHp: number, maxHp: number) => {
    const percentage = (currentHp / maxHp) * 100;
    const barColor = percentage > 50 ? 'green' : percentage > 20 ? 'orange' : 'red';
    return (
      <div className={styles.hpBarContainer}>
        <div className={styles.hpBarFill} style={{ width: `${percentage}%`, backgroundColor: barColor }}></div>
        <span className={styles.hpText}>{currentHp}/{maxHp} HP</span>
      </div>
    );
  };

  // Helper function to render Energy bar
  const renderEnergyBar = (currentEnergy: number, maxEnergy: number) => {
    const percentage = (currentEnergy / maxEnergy) * 100;
    return (
      <div className={styles.energyBarContainer}>
        <div className={styles.energyBarFill} style={{ width: `${percentage}%` }}></div>
        <span className={styles.energyText}>{currentEnergy}/{maxEnergy} Energy</span>
      </div>
    );
  };

  // --- Player Action Handlers ---

  const handlePlayerAttack = (targetId: string) => {
    if (!localBattleState) return;
    const updatedBattleState = battleSystem.performAttack(localBattleState, player.id, targetId);
    setLocalBattleState(updatedBattleState); // Update local state
    setIsSelectingTarget(false);
    setActionType(null);
  };

  const handlePlayerAbility = (abilityId: string, targetId?: string) => {
    if (!localBattleState) return;
    const updatedBattleState = battleSystem.useAbility(localBattleState, player.id, abilityId, targetId);
    setLocalBattleState(updatedBattleState); // Update local state
    setSelectedAbilityId(null);
    setIsSelectingTarget(false);
    setActionType(null);
  };

  const handlePlayerItem = (item: Item) => {
    if (!localBattleState) return;
    const updatedBattleState = battleSystem.useItem(localBattleState, player.id, item);
    setLocalBattleState(updatedBattleState); // Update local state
    setSelectedItemId(null);
  };

  const handleFlee = () => {
    if (!localBattleState) return;
    const enemySpeeds = enemies.map(e => e.speed);
    const updatedBattleState = battleSystem.flee(localBattleState, player.id, player.speed, enemySpeeds);
    setLocalBattleState(updatedBattleState); // Update local state (will be null if successful flee)
  };

  // Handler for clicking on an enemy when target selection is active
  const handleTargetClick = (targetId: string) => {
    if (!isSelectingTarget) return;

    if (actionType === 'attack') {
      handlePlayerAttack(targetId);
    } else if (actionType === 'ability' && selectedAbilityId) {
      const ability = player.abilities.find(a => a.id === selectedAbilityId);
      if (ability && ability.effect.target === 'singleEnemy') {
        handlePlayerAbility(selectedAbilityId, targetId);
      }
    }
  };

  // Centralized handler for initiating player actions
  const handleActionSelect = (type: 'attack' | 'ability' | 'item' | 'flee', value?: string | Item) => {
    if (type === 'attack') {
      setIsSelectingTarget(true);
      setActionType('attack');
      setSelectedAbilityId(null);
      setSelectedItemId(null);
    } else if (type === 'ability') {
      // Fix: Check if value exists and is a string for ability ID
      if (typeof value === 'string') {
        const ability = player.abilities.find(a => a.id === value);
        if (ability) {
          setSelectedAbilityId(ability.id);
          setSelectedItemId(null);
          if (ability.effect.target === 'singleEnemy') {
            setIsSelectingTarget(true);
            setActionType('ability');
          } else {
            // For self-target or all-enemies abilities, use immediately
            handlePlayerAbility(ability.id, player.id); // player.id is passed, but BattleSystem will determine actual targets
          }
        }
      }
    } else if (type === 'item') {
      // Fix: Check if value exists and is an Item (not a string)
      if (value && typeof value !== 'string') {
        setSelectedItemId(value.id);
        setSelectedAbilityId(null);
        handlePlayerItem(value);
      }
    } else if (type === 'flee') {
      handleFlee();
    }
  };

  // Get player's full inventory from the global game state for item display
  const playerInventory = state.player.inventory;

  return (
    <div className={styles.battleContainer}>
      <h2 className={styles.battleTitle}>Battle!</h2>

      <div className={styles.turnIndicator}>
        {localBattleState.currentTurn === 'player' ? "Your Turn!" : "Enemy's Turn!"}
      </div>

      <div className={styles.combatants}>
        <div className={styles.playerSection}>
          <h3>{getEmojiForEntity(player)} {player.name}</h3>
          {renderHpBar(player.hp, player.maxHp)}
          {renderEnergyBar(player.energy, player.maxEnergy)}
          <p>ATK: {player.attack} | DEF: {player.defense} | SPD: {player.speed}</p>
          <div className={styles.statusEffects}>
            {player.statusEffects.map(effect => (
              <span key={effect.type} className={styles.statusEffect}>
                {effect.type} ({effect.duration} turns)
              </span>
            ))}
          </div>
        </div>

        <div className={styles.enemiesSection}>
          {enemies.length > 0 ? (
            enemies.map((enemy) => (
              <div
                key={enemy.id}
                className={`${styles.enemyCard} ${isSelectingTarget ? styles.targetable : ''} ${localBattleState.currentTurn === 'enemy' && localBattleState.turnOrder[0] === enemy.id ? styles.currentEnemyTurn : ''}`}
                onClick={() => handleTargetClick(enemy.id)}
              >
                <h4>{getEmojiForEntity(enemy)} {enemy.name}</h4>
                {renderHpBar(enemy.hp, enemy.maxHp)}
                {renderEnergyBar(enemy.energy, enemy.maxEnergy)}
                <p>ATK: {enemy.attack} | DEF: {enemy.defense} | SPD: {enemy.speed}</p>
                <div className={styles.statusEffects}>
                  {enemy.statusEffects.map(effect => (
                    <span key={effect.type} className={styles.statusEffect}>
                      {effect.type} ({effect.duration} turns)
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p>No enemies remaining!</p>
          )}
        </div>
      </div>

      {localBattleState.currentTurn === 'player' && (
        <div className={styles.playerActions}>
          {isSelectingTarget ? (
            <div className={styles.targetSelection}>
              <p>Select a target:</p>
              <button onClick={() => { setIsSelectingTarget(false); setActionType(null); }}>Cancel</button>
            </div>
          ) : (
            <>
              <button onClick={() => handleActionSelect('attack')} className={styles.actionButton}>Attack</button>
              <div className={styles.dropdown}>
                <button className={styles.actionButton}>Abilities</button>
                <div className={styles.dropdownContent}>
                  {player.abilities.length > 0 ? (
                    player.abilities.map((ability) => (
                      <button
                        key={ability.id}
                        onClick={() => handleActionSelect('ability', ability.id)}
                        disabled={player.energy < ability.cost}
                      >
                        {ability.name} ({ability.cost} Energy)
                      </button>
                    ))
                  ) : (
                    <span>No abilities</span>
                  )}
                </div>
              </div>
              <div className={styles.dropdown}>
                <button className={styles.actionButton}>Items</button>
                <div className={styles.dropdownContent}>
                  {playerInventory.filter(item => item.type === 'consumable').length > 0 ? (
                    playerInventory.filter(item => item.type === 'consumable').map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleActionSelect('item', item)}
                      >
                        {item.name}
                      </button>
                    ))
                  ) : (
                    <span>No consumable items</span>
                  )}
                </div>
              </div>
              <button onClick={() => handleActionSelect('flee')} className={styles.actionButton}>Flee</button>
            </>
          )}
        </div>
      )}

      <div className={styles.battleLog} ref={battleLogRef}>
        <h3>Battle Log</h3>
        {localBattleState.log.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
    </div>
  );
};

export default Battle;