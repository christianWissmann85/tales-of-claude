import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BattleState, CombatEntity, Ability, Item, StatusEffect, StatusEffectType } from '../../types/global.types';
import { useGameContext } from '../../context/GameContext';
import BattleSystem from '../../engine/BattleSystem';
import styles from './Battle.module.css';

// ASCII Art Backgrounds
const ASCII_BACKGROUNDS: Record<string, string> = {
  terminalTown: `
  +-----------------------------------------------------------------+
  |  _.-._                                _.-._                    |
  | ( ___ )------------------------------( ___ )                   |
  |  '-.-'                                 '-.-'                    |
  |   _|_                                   _|_                     |
  |  /   \\                                 /   \\                    |
  | |  _  |  [ ] [ ] [ ] [ ] [ ] [ ] [ ]  |  _  |                   |
  | | (_) |  [ ] [ ] [ ] [ ] [ ] [ ] [ ]  | (_) |                   |
  |  \\___/                                 \\___/                    |
  |                                                                 |
  |  [C:\\>_]  [C:\\>_]  [C:\\>_]  [C:\\>_]  [C:\\>_]  [C:\\>_]  [C:\\>_]  |
  |                                                                 |
  |  .-----------------------------------------------------------.  |
  |  |                                                           |  |
  |  |                                                           |  |
  |  '-----------------------------------------------------------'  |
  +-----------------------------------------------------------------+
  `,
  binaryForest: `
  +-----------------------------------------------------------------+
  |     101010101010101010101010101010101010101010101010101010101   |
  |   01  /\\  01  /\\  01  /\\  01  /\\  01  /\\  01  /\\  01  /\\  01  |
  |  10  /  \\  10  /  \\  10  /  \\  10  /  \\  10  /  \\  10  /  \\  10 |
  | 01  ||||  01  ||||  01  ||||  01  ||||  01  ||||  01  ||||  01  |
  | 10  ||||  10  ||||  10  ||||  10  ||||  10  ||||  10  ||||  10  |
  |  01 \\  /  01 \\  /  01 \\  /  01 \\  /  01 \\  /  01 \\  /  01 \\  / |
  |   10 \\/   10 \\/   10 \\/   10 \\/   10 \\/   10 \\/   10 \\/   10  |
  |     010101010101010101010101010101010101010101010101010101010   |
  |                                                                 |
  |  1010101010101010101010101010101010101010101010101010101010101  |
  |                                                                 |
  |   010101010101010101010101010101010101010101010101010101010101  |
  +-----------------------------------------------------------------+
  `,
  debugDungeon: `
  +-----------------------------------------------------------------+
  | ############################################################### |
  | #   _   _   _   _   _   _   _   _   _   _   _   _   _   _   # |
  | #  | | | | | | | | | | | | | | | | | | | | | | | | | | | |  # |
  | #  |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| |_|  # |
  | #                                                             # |
  | #  _   _   _   _   _   _   _   _   _   _   _   _   _   _   _  # |
  | # | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | # |
  | # |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| # |
  | #                                                             # |
  | ############################################################### |
  | #   _   _   _   _   _   _   _   _   _   _   _   _   _   _   # |
  | #  | | | | | | | | | | | | | | | | | | | | | | | | | | | |  # |
  | #  |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| |_|  # |
  | ############################################################### |
  +-----------------------------------------------------------------+
  `,
  default: `
  +-----------------------------------------------------------------+
  |  .-----------------------------------------------------------.  |
  |  |  [SYSTEM ONLINE]                                          |  |
  |  |  > Initializing combat sequence...                         |  |
  |  |  > Detecting anomalies...                                  |  |
  |  |                                                           |  |
  |  |  ---------------------------------------------------------  |
  |  |  |                                                       |  |
  |  |  |                                                       |  |
  |  |  |                                                       |  |
  |  |  ---------------------------------------------------------  |
  |  |                                                           |  |
  |  |  > Processing...                                          |  |
  |  |  > Awaiting input...                                      |  |
  |  '-----------------------------------------------------------'  |
  +-----------------------------------------------------------------+
  `,
};

const VICTORY_ART = `
  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _
 | |/ /| |/ /| |/ /| |/ /| |/ /| |/ /| |/ /| |/ /| |/ /| |/ /| |/ /
 | ' / | ' / | ' / | ' / | ' / | ' / | ' / | ' / | ' / | ' / | ' /
 | . \\ | . \\ | . \\ | . \\ | . \\ | . \\ | . \\ | . \\ | . \\ | . \\ | . \\
 |_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\
                                                                   
  V I C T O R Y ! ! !
                                                                   
  *   .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  *
  .   *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  .
   *   .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  *
    .   *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *
      *   .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .
        .   *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *
          *   .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .
            .   *  *  *  *  *  *  *  *  *  *  *  *  *  *  *
              *   .  .  .  .  .  .  .  .  .  .  .  .  .  .
                .   *  *  *  *  *  *  *  *  *  *  *  *  *
                  *   .  .  .  .  .  .  .  .  .  .  .  .
                    .   *  *  *  *  *  *  *  *  *  *  *
                      *   .  .  .  .  .  .  .  .  .  .
                        .   *  *  *  *  *  *  *  *  *
                          *   .  .  .  .  .  .  .  .
                            .   *  *  *  *  *  *  *
                              *   .  .  .  .  .  .
                                .   *  *  *  *  *
                                  *   .  .  .  .
                                    .   *  *  *
                                      *   .  .
                                        .   *
                                          *
`;

const DEFEAT_ART = `
  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _
 | |/ /| |/ /| |/ /| |/ /| |/ /| |/ /| |/ /| |/ /| |/ /| |/ /| |/ /
 | ' / | ' / | ' / | ' / | ' / | ' / | ' / | ' / | ' / | ' / | ' /
 | . \\ | . \\ | . \\ | . \\ | . \\ | . \\ | . \\ | . \\ | . \\ | . \\ | . \\
 |_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\|_|\\_\\
                                                                   
  G A M E   O V E R
                                                                   
  .-----------------------------------------------------------.
  |                                                           |
  |  SYSTEM FAILURE DETECTED.                                 |
  |  REBOOT REQUIRED.                                         |
  |                                                           |
  |  > PRESS ANY KEY TO RESTART...                            |
  |                                                           |
  |                                                           |
  |                                                           |
  '-----------------------------------------------------------'
`;

const Battle: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const [localBattleState, setLocalBattleState] = useState<BattleState | null>(state.battle);

  const battleSystemRef = useRef<BattleSystem | null>(null);
  if (!battleSystemRef.current) {
    battleSystemRef.current = new BattleSystem(dispatch);
  }
  const battleSystem = battleSystemRef.current;

  const [selectedAbilityId, setSelectedAbilityId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isSelectingTarget, setIsSelectingTarget] = useState(false);
  const [actionType, setActionType] = useState<'attack' | 'ability' | null>(null);

  // Refs for previous state to detect changes for animations
  const prevPlayerHpRef = useRef(localBattleState?.player.hp || 0);
  const prevPlayerEnergyRef = useRef(localBattleState?.player.energy || 0);
  const prevEnemiesRef = useRef<CombatEntity[]>(localBattleState?.enemies || []);

  // State for visual effects
  const [damageNumbers, setDamageNumbers] = useState<Array<{ id: string, value: number, type: 'damage' | 'heal', key: number }>>([]);
  const [currentAttackAnimation, setCurrentAttackAnimation] = useState<{ attackerId: string, targetId: string, key: number } | null>(null);
  const [showBattleResult, setShowBattleResult] = useState<'victory' | 'defeat' | 'flee' | null>(null);

  // Ref for auto-scrolling the battle log
  const battleLogRef = useRef<HTMLDivElement>(null);

  // Sync local battle state with global context state.battle
  useEffect(() => {
    setLocalBattleState(state.battle);
  }, [state.battle]);

  // Scroll battle log to bottom on updates
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [localBattleState?.log]);

  // Effect to detect HP/Energy changes and trigger damage numbers
  useEffect(() => {
    if (!localBattleState) return;

    const newDamageNumbers: { id: string; value: number; type: 'damage' | 'heal'; key: number; }[] = [];

    // Check player HP changes
    if (localBattleState.player.hp !== prevPlayerHpRef.current) {
      const diff = prevPlayerHpRef.current - localBattleState.player.hp;
      if (diff > 0) { // Damage
        newDamageNumbers.push({ id: localBattleState.player.id, value: diff, type: 'damage', key: Date.now() + Math.random() });
      } else if (diff < 0) { // Heal
        newDamageNumbers.push({ id: localBattleState.player.id, value: -diff, type: 'heal', key: Date.now() + Math.random() });
      }
    }
    // Check player Energy changes (for abilities/items)
    if (localBattleState.player.energy !== prevPlayerEnergyRef.current) {
      const diff = prevPlayerEnergyRef.current - localBattleState.player.energy;
      if (diff < 0) { // Energy spent (negative diff means current is less than prev)
        // Optionally show energy cost, but usually not as a floating number
      } else if (diff > 0) { // Energy restored
        newDamageNumbers.push({ id: localBattleState.player.id, value: diff, type: 'heal', key: Date.now() + Math.random() + 0.1 }); // Use heal type for energy restore
      }
    }

    // Check enemy HP changes
    localBattleState.enemies.forEach(currentEnemy => {
      const prevEnemy = prevEnemiesRef.current.find(e => e.id === currentEnemy.id);
      if (prevEnemy && currentEnemy.hp !== prevEnemy.hp) {
        const diff = prevEnemy.hp - currentEnemy.hp;
        if (diff > 0) { // Damage
          newDamageNumbers.push({ id: currentEnemy.id, value: diff, type: 'damage', key: Date.now() + Math.random() });
        } else if (diff < 0) { // Heal
          newDamageNumbers.push({ id: currentEnemy.id, value: -diff, type: 'heal', key: Date.now() + Math.random() });
        }
      }
    });

    setDamageNumbers(prev => [...prev, ...newDamageNumbers]);

    // Update refs for next render
    prevPlayerHpRef.current = localBattleState.player.hp;
    prevPlayerEnergyRef.current = localBattleState.player.energy;
    prevEnemiesRef.current = localBattleState.enemies;

  }, [localBattleState]);

  // Effect to clear damage numbers after animation
  useEffect(() => {
    if (damageNumbers.length > 0) {
      const timer = setTimeout(() => {
        setDamageNumbers([]);
      }, 1500); // Matches CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [damageNumbers]);

  // Effect to clear attack animation
  useEffect(() => {
    if (currentAttackAnimation) {
      const timer = setTimeout(() => {
        setCurrentAttackAnimation(null);
      }, 500); // Short duration for slash animation
      return () => clearTimeout(timer);
    }
  }, [currentAttackAnimation]);

  // Effect to trigger battle result display (Victory/Defeat)
  useEffect(() => {
    if (!localBattleState) return;
    
    // Check victory condition
    if (localBattleState.enemies.every(e => e.hp <= 0)) {
      setShowBattleResult('victory');
    }
    
    // Check defeat condition
    if (localBattleState.player.hp <= 0) {
      setShowBattleResult('defeat');
    }
  }, [localBattleState?.enemies, localBattleState?.player.hp]);

  // Handle enemy turns
  useEffect(() => {
    if (!localBattleState || localBattleState.currentTurn === localBattleState.player.id) {
      return;
    }

    const currentTurnIndex = localBattleState.turnOrder.findIndex(id => {
      const entity = localBattleState.enemies.find(e => e.id === id && e.hp > 0);
      return entity !== undefined;
    });

    if (currentTurnIndex === -1) {
      return;
    }

    const currentEnemyId = localBattleState.turnOrder[currentTurnIndex];
    const currentEnemy = localBattleState.enemies.find(e => e.id === currentEnemyId);

    if (!currentEnemy || currentEnemy.hp <= 0) {
      return;
    }

    const enemyTurnDelay = 1500;

    const timer = setTimeout(() => {
      if (localBattleState && localBattleState.currentTurn === currentEnemyId) {
        // Simulate enemy targeting player for attack animation
        setCurrentAttackAnimation({ attackerId: currentEnemyId, targetId: localBattleState.player.id, key: Date.now() });
        const updatedBattleState = battleSystem.handleEnemyTurn(localBattleState, currentEnemyId);
        setLocalBattleState(updatedBattleState);
      }
    }, enemyTurnDelay);

    return () => clearTimeout(timer);
  }, [localBattleState?.currentTurn, localBattleState, battleSystem]);

  // If battle has ended and result is being shown
  if (showBattleResult === 'victory') {
    return (
      <div className={`${styles.battleContainer} ${styles.victoryScreen}`}>
        <pre className={styles.victoryArt}>{VICTORY_ART}</pre>
        <button onClick={() => {
          setShowBattleResult(null);
          // Dispatch END_BATTLE action with victory
          dispatch({ 
            type: 'END_BATTLE',
            payload: {
              playerWon: true,
              playerExpGained: 100, // Example EXP
              itemsDropped: [],
              playerCombatState: localBattleState?.player
            }
          });
        }} className={styles.continueButton}>Continue</button>
      </div>
    );
  } else if (showBattleResult === 'defeat') {
    return (
      <div className={`${styles.battleContainer} ${styles.defeatScreen}`}>
        <pre className={styles.defeatArt}>{DEFEAT_ART}</pre>
        <button onClick={() => {
          setShowBattleResult(null);
          // Dispatch END_BATTLE action with defeat
          dispatch({ 
            type: 'END_BATTLE',
            payload: {
              playerWon: false,
              playerExpGained: 0,
              itemsDropped: [],
              playerCombatState: localBattleState?.player
            }
          });
        }} className={styles.continueButton}>Restart</button>
      </div>
    );
  } else if (!localBattleState) {
    return <div className={styles.battleContainer}>Battle has ended or not started.</div>;
  }

  const player = localBattleState.player;
  const enemies = localBattleState.enemies.filter(e => e.hp > 0);

  const getBattleBackground = () => {
    const mapId = state.currentMap?.id || '';
    if (mapId.includes('town') || mapId.includes('Town')) return ASCII_BACKGROUNDS.terminalTown;
    if (mapId.includes('forest') || mapId.includes('Forest')) return ASCII_BACKGROUNDS.binaryForest;
    if (mapId.includes('dungeon') || mapId.includes('Dungeon')) return ASCII_BACKGROUNDS.debugDungeon;
    return ASCII_BACKGROUNDS.default;
  };

  const getEmojiForEntity = (entity: CombatEntity) => {
    if (entity.id === player.id){ return '🤖'; }
    if (entity.name.includes('Bug')){ return '👾'; }
    if (entity.name.includes('Virus')){ return '🦠'; }
    if (entity.name.includes('Corrupted Data')){ return '🗑️'; }
    if (entity.name.includes('Logic Error')){ return '🐛'; }
    return '❓';
  };

  const getStatusEffectIcon = (type: StatusEffectType) => {
    switch (type) {
      case 'frozen': return '❄️';
      case 'corrupted': return '☠️';
      case 'optimized': return '⚡';
      case 'encrypted': return '🔒';
      default: return '❓';
    }
  };

  const renderHpBar = (currentHp: number, maxHp: number) => {
    const percentage = (currentHp / maxHp) * 100;
    const barColor = percentage > 50 ? '#00ff00' : percentage > 20 ? '#ffcc00' : '#ff0000';
    return (
      <div className={styles.hpBarContainer}>
        <div className={styles.hpBarFill} style={{ width: `${percentage}%`, backgroundColor: barColor }}></div>
        <span className={styles.hpText}>{currentHp}/{maxHp} HP</span>
      </div>
    );
  };

  const renderEnergyBar = (currentEnergy: number, maxEnergy: number) => {
    const percentage = (currentEnergy / maxEnergy) * 100;
    return (
      <div className={styles.energyBarContainer}>
        <div className={styles.energyBarFill} style={{ width: `${percentage}%` }}></div>
        <span className={styles.energyText}>{currentEnergy}/{maxEnergy} Energy</span>
      </div>
    );
  };

  const renderStatusEffects = (effects: StatusEffect[]) => (
    <div className={styles.statusEffects}>
      {effects.map(effect => (
        <span key={effect.type} className={styles.statusEffect}>
          {getStatusEffectIcon(effect.type)} {effect.type} ({effect.duration} turns)
        </span>
      ))}
    </div>
  );

  const handlePlayerAttack = useCallback((targetId: string) => {
    if (!localBattleState){ return; }
    setCurrentAttackAnimation({ attackerId: player.id, targetId: targetId, key: Date.now() });
    const updatedBattleState = battleSystem.performAttack(localBattleState, player.id, targetId);
    setLocalBattleState(updatedBattleState);
    setIsSelectingTarget(false);
    setActionType(null);
  }, [localBattleState, battleSystem, player.id]);

  const handlePlayerAbility = useCallback((abilityId: string, targetId?: string) => {
    if (!localBattleState){ return; }
    // For abilities that target enemies, trigger attack animation
    const ability = player.abilities.find(a => a.id === abilityId);
    if (ability && ability.effect.target === 'singleEnemy' && targetId) {
      setCurrentAttackAnimation({ attackerId: player.id, targetId: targetId, key: Date.now() });
    } else if (ability && ability.effect.target === 'allEnemies') {
      // For all enemies, animate on a generic target or first enemy
      setCurrentAttackAnimation({ attackerId: player.id, targetId: enemies[0]?.id || '', key: Date.now() });
    }

    const updatedBattleState = battleSystem.useAbility(localBattleState, player.id, abilityId, targetId);
    setLocalBattleState(updatedBattleState);
    setSelectedAbilityId(null);
    setIsSelectingTarget(false);
    setActionType(null);
  }, [localBattleState, battleSystem, player.id, player.abilities, enemies]);

  const handlePlayerItem = useCallback((item: Item) => {
    if (!localBattleState){ return; }
    const updatedBattleState = battleSystem.useItem(localBattleState, player.id, item);
    setLocalBattleState(updatedBattleState);
    setSelectedItemId(null);
  }, [localBattleState, battleSystem, player.id]);

  const handleFlee = useCallback(() => {
    if (!localBattleState){ return; }
    const enemySpeeds = enemies.map(e => e.speed);
    const updatedBattleState = battleSystem.flee(localBattleState, player.id, player.speed, enemySpeeds);
    setLocalBattleState(updatedBattleState);
  }, [localBattleState, battleSystem, player.id, player.speed, enemies]);

  const handleTargetClick = useCallback((targetId: string) => {
    if (!isSelectingTarget){ return; }

    if (actionType === 'attack') {
      handlePlayerAttack(targetId);
    } else if (actionType === 'ability' && selectedAbilityId) {
      const ability = player.abilities.find(a => a.id === selectedAbilityId);
      if (ability && ability.effect.target === 'singleEnemy') {
        handlePlayerAbility(selectedAbilityId, targetId);
      }
    }
  }, [isSelectingTarget, actionType, selectedAbilityId, player.abilities, handlePlayerAttack, handlePlayerAbility]);

  const handleActionSelect = useCallback((type: 'attack' | 'ability' | 'item' | 'flee', value?: string | Item) => {
    if (type === 'attack') {
      setIsSelectingTarget(true);
      setActionType('attack');
      setSelectedAbilityId(null);
      setSelectedItemId(null);
    } else if (type === 'ability') {
      if (typeof value === 'string') {
        const ability = player.abilities.find(a => a.id === value);
        if (ability) {
          setSelectedAbilityId(ability.id);
          setSelectedItemId(null);
          if (ability.effect.target === 'singleEnemy') {
            setIsSelectingTarget(true);
            setActionType('ability');
          } else {
            handlePlayerAbility(ability.id, player.id);
          }
        }
      }
    } else if (type === 'item') {
      if (value && typeof value !== 'string') {
        setSelectedItemId(value.id);
        setSelectedAbilityId(null);
        handlePlayerItem(value);
      }
    } else if (type === 'flee') {
      handleFlee();
    }
  }, [player.abilities, handlePlayerAbility, handlePlayerItem, handleFlee, player.id]);

  const playerInventory = state.player.inventory;
  const currentTurnDisplay = localBattleState.currentTurn === player.id
    ? "Claude's Turn!"
    : "Enemy Turn!";

  return (
    <div className={styles.battleContainer}>
      <pre className={styles.battleBackground}>{getBattleBackground()}</pre>

      <h2 className={styles.battleTitle}>Battle!</h2>

      <div className={styles.turnIndicator}>
        {currentTurnDisplay}
      </div>

      <div className={styles.combatants}>
        <div className={styles.playerSection}>
          <h3>{getEmojiForEntity(player)} {player.name}</h3>
          {renderHpBar(player.hp, player.maxHp)}
          {renderEnergyBar(player.energy, player.maxEnergy)}
          <p>ATK: {player.attack} | DEF: {player.defense} | SPD: {player.speed}</p>
          {renderStatusEffects(player.statusEffects)}
          {damageNumbers.filter(d => d.id === player.id).map(d => (
            <span key={d.key} className={`${styles.damageNumber} ${styles[d.type]}`}>
              {d.type === 'heal' ? '+' : '-'}{d.value}
            </span>
          ))}
          {currentAttackAnimation && currentAttackAnimation.targetId === player.id && (
            <div className={styles.attackSlash}>
              <span className={styles.slash1}>/</span>
              <span className={styles.slash2}>\</span>
              <span className={styles.slash3}>-</span>
              <span className={styles.slash4}>|</span>
            </div>
          )}
        </div>

        <div className={styles.enemiesSection}>
          {enemies.length > 0 ? (
            enemies.map((enemy) => (
              <div
                key={enemy.id}
                className={`${styles.enemyCard} ${isSelectingTarget ? styles.targetable : ''} ${localBattleState.currentTurn === enemy.id ? styles.currentEnemyTurn : ''}`}
                onClick={() => handleTargetClick(enemy.id)}
              >
                <h4>{getEmojiForEntity(enemy)} {enemy.name}</h4>
                {renderHpBar(enemy.hp, enemy.maxHp)}
                {renderEnergyBar(enemy.energy, enemy.maxEnergy)}
                <p>ATK: {enemy.attack} | DEF: {enemy.defense} | SPD: {enemy.speed}</p>
                {renderStatusEffects(enemy.statusEffects)}
                {damageNumbers.filter(d => d.id === enemy.id).map(d => (
                  <span key={d.key} className={`${styles.damageNumber} ${styles[d.type]}`}>
                    {d.type === 'heal' ? '+' : '-'}{d.value}
                  </span>
                ))}
                {currentAttackAnimation && currentAttackAnimation.targetId === enemy.id && (
                  <div className={styles.attackSlash}>
                    <span className={styles.slash1}>/</span>
                    <span className={styles.slash2}>\</span>
                    <span className={styles.slash3}>-</span>
                    <span className={styles.slash4}>|</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No enemies remaining!</p>
          )}
        </div>
      </div>

      {localBattleState.currentTurn === player.id && (
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
