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

// New component for particle effects
interface ParticleProps {
  targetId: string;
  key: number; // Unique key for React list rendering
}

const HitParticles: React.FC<ParticleProps> = ({ targetId }) => {
  const [particles, setParticles] = useState<Array<{ id: number, style: React.CSSProperties }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      style: {
        // Random initial position offset within a small area
        left: `${Math.random() * 40 - 20}px`,
        top: `${Math.random() * 40 - 20}px`,
        // Random size
        width: `${Math.random() * 5 + 3}px`,
        height: `${Math.random() * 5 + 3}px`,
        // Random color (e.g., white, light green, light red)
        backgroundColor: `hsl(${Math.random() * 360}, 100%, 70%)`,
        // Random animation delay for staggered effect
        animationDelay: `${Math.random() * 0.2}s`,
        // Random direction for burst using CSS variables
        '--x': `${(Math.random() - 0.5) * 200}px`, // Move up to 100px left/right
        '--y': `${(Math.random() - 1) * 150}px`, // Move up to 150px upwards
      }
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]); // Clear particles after animation
    }, 1000); // Matches particle animation duration in CSS

    return () => clearTimeout(timer);
  }, [targetId]); // Re-trigger when target changes (new hit)

  return (
    <div className={styles.particleContainer}>
      {particles.map(p => (
        <div key={p.id} className={styles.particle} style={p.style}></div>
      ))}
    </div>
  );
};


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
  const [damageNumbers, setDamageNumbers] = useState<Array<{ id: string, value: number, type: 'damage' | 'heal', isCritical?: boolean, key: number }>>([]);
  const [currentAttackAnimation, setCurrentAttackAnimation] = useState<{ attackerId: string, targetId: string, isCritical: boolean, key: number } | null>(null);
  const [showBattleResult, setShowBattleResult] = useState<'victory' | 'defeat' | 'flee' | null>(null);
  const [screenShake, setScreenShake] = useState(false); // New state for screen shake
  const [hitParticles, setHitParticles] = useState<Array<{ targetId: string, key: number }>>([]); // New state for particles

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

  // Effect to detect HP/Energy changes and trigger damage numbers, and critical hit for shake
  useEffect(() => {
    if (!localBattleState) return;

    const newDamageNumbers: { id: string; value: number; type: 'damage' | 'heal'; isCritical?: boolean; key: number; }[] = [];
    let criticalHitOccurred = false;

    // Check player HP changes
    if (localBattleState.player.hp !== prevPlayerHpRef.current) {
      const diff = prevPlayerHpRef.current - localBattleState.player.hp;
      if (diff > 0) { // Damage
        // Simulate critical hit for player damage (e.g., if damage is very high relative to max HP)
        const isCrit = diff > (localBattleState.player.maxHp * 0.25); // Example: 25% of max HP
        if (isCrit) criticalHitOccurred = true;
        newDamageNumbers.push({ id: localBattleState.player.id, value: diff, type: 'damage', isCritical: isCrit, key: Date.now() + Math.random() });
      } else if (diff < 0) { // Heal
        newDamageNumbers.push({ id: localBattleState.player.id, value: -diff, type: 'heal', key: Date.now() + Math.random() });
      }
    }
    // Check player Energy changes (for abilities/items)
    if (localBattleState.player.energy !== prevPlayerEnergyRef.current) {
      const diff = prevPlayerEnergyRef.current - localBattleState.player.energy;
      if (diff > 0) { // Energy restored
        newDamageNumbers.push({ id: localBattleState.player.id, value: diff, type: 'heal', key: Date.now() + Math.random() + 0.1 }); // Use heal type for energy restore
      }
    }

    // Check enemy HP changes
    localBattleState.enemies.forEach(currentEnemy => {
      const prevEnemy = prevEnemiesRef.current.find(e => e.id === currentEnemy.id);
      if (prevEnemy && currentEnemy.hp !== prevEnemy.hp) {
        const diff = prevEnemy.hp - currentEnemy.hp;
        if (diff > 0) { // Damage
          // Simulate critical hit for enemy damage
          const isCrit = diff > (currentEnemy.maxHp * 0.25); // Example: 25% of max HP
          if (isCrit) criticalHitOccurred = true;
          newDamageNumbers.push({ id: currentEnemy.id, value: diff, type: 'damage', isCritical: isCrit, key: Date.now() + Math.random() });
        } else if (diff < 0) { // Heal
          newDamageNumbers.push({ id: currentEnemy.id, value: -diff, type: 'heal', key: Date.now() + Math.random() });
        }
      }
    });

    setDamageNumbers(prev => [...prev, ...newDamageNumbers]);
    if (criticalHitOccurred) {
      setScreenShake(true);
    }

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
      }, 1800); // Matches CSS animation duration for floatUpFade
      return () => clearTimeout(timer);
    }
  }, [damageNumbers]);

  // Effect to clear attack animation and trigger particles
  useEffect(() => {
    if (currentAttackAnimation) {
      // Trigger particles on attack land
      setHitParticles(prev => [...prev, { targetId: currentAttackAnimation.targetId, key: Date.now() }]);

      const timer = setTimeout(() => {
        setCurrentAttackAnimation(null);
      }, 600); // Short duration for slash animation (0.6s)
      return () => clearTimeout(timer);
    }
  }, [currentAttackAnimation]);

  // Effect to clear screen shake
  useEffect(() => {
    if (screenShake) {
      const timer = setTimeout(() => {
        setScreenShake(false);
      }, 500); // Matches shake animation duration
      return () => clearTimeout(timer);
    }
  }, [screenShake]);

  // Effect to clear particles
  useEffect(() => {
    if (hitParticles.length > 0) {
      const timer = setTimeout(() => {
        setHitParticles([]);
      }, 1000); // Matches particle animation duration
      return () => clearTimeout(timer);
    }
  }, [hitParticles]);

  // Effect to trigger battle result display (Victory/Defeat)
  useEffect(() => {
    if (!localBattleState) return;
    
    // Check victory condition
    if (localBattleState.enemies.every(e => e.hp <= 0) && localBattleState.enemies.length > 0) { // Ensure there were enemies to begin with
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
      // All enemies defeated, or no valid enemy for current turn. Turn will advance automatically.
      return;
    }

    const currentEnemyId = localBattleState.turnOrder[currentTurnIndex];
    const currentEnemy = localBattleState.enemies.find(e => e.id === currentEnemyId);

    if (!currentEnemy || currentEnemy.hp <= 0) {
      // If current enemy is defeated, turn will advance automatically
      return;
    }

    const enemyTurnDelay = 1500;

    const timer = setTimeout(() => {
      if (localBattleState && localBattleState.currentTurn === currentEnemyId) {
        // Simulate enemy targeting player for attack animation
        // Enemy attacks are not explicitly marked as critical for the animation state,
        // but the damage number effect will still trigger shake if damage is high.
        setCurrentAttackAnimation({ attackerId: currentEnemyId, targetId: localBattleState.player.id, isCritical: false, key: Date.now() });
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
          // Collect defeated enemy IDs from the original battle state
          const defeatedEnemyIds = state.battle?.enemies.map(e => e.id) || [];
          
          // Calculate total exp from defeated enemies
          const totalExp = localBattleState?.enemies.reduce((sum, enemy) => sum + (enemy.expReward || 0), 0) || 100;
          
          // Dispatch END_BATTLE action with victory
          dispatch({ 
            type: 'END_BATTLE',
            payload: {
              playerWon: true,
              playerExpGained: totalExp,
              itemsDropped: [],
              playerCombatState: localBattleState?.player,
              defeatedEnemyIds
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
    // Simulate critical hit for player attacks (e.g., 20% chance)
    const isCritical = Math.random() < 0.2; 
    setCurrentAttackAnimation({ attackerId: player.id, targetId: targetId, isCritical: isCritical, key: Date.now() });
    // Note: In a real scenario, BattleSystem.ts would determine if it's critical.
    // For this exercise, we pass the simulated critical flag.
    const updatedBattleState = battleSystem.performAttack(localBattleState, player.id, targetId); 
    setLocalBattleState(updatedBattleState);
    setIsSelectingTarget(false);
    setActionType(null);
  }, [localBattleState, battleSystem, player.id]);

  const handlePlayerAbility = useCallback((abilityId: string, targetId?: string) => {
    if (!localBattleState){ return; }
    const ability = player.abilities.find(a => a.id === abilityId);
    // Simulate critical hit for abilities (e.g., 10% chance)
    const isCritical = Math.random() < 0.1; 
    
    if (ability && ability.effect.target === 'singleEnemy' && targetId) {
      setCurrentAttackAnimation({ attackerId: player.id, targetId: targetId, isCritical: isCritical, key: Date.now() });
    } else if (ability && ability.effect.target === 'allEnemies') {
      // For all enemies, animate on a generic target or first enemy
      setCurrentAttackAnimation({ attackerId: player.id, targetId: enemies[0]?.id || '', isCritical: isCritical, key: Date.now() });
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
    <div className={`${styles.battleContainer} ${screenShake ? styles.shake : ''}`}>
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
            <span key={d.key} className={`${styles.damageNumber} ${styles[d.type]} ${d.isCritical ? styles.criticalDamage : ''}`}>
              {d.type === 'heal' ? '+' : '-'}{d.value}
            </span>
          ))}
          {currentAttackAnimation && currentAttackAnimation.targetId === player.id && (
            <div className={styles.attackAnimationContainer}>
              {/* Using CSS variables for dynamic styling of each slash line */}
              <div className={styles.slashLine} style={{ '--slash-rotate': '15deg', '--slash-color': '#ffcc00' } as React.CSSProperties}></div>
              <div className={styles.slashLine} style={{ '--slash-rotate': '-25deg', '--slash-color': '#ffffff', animationDelay: '0.05s' } as React.CSSProperties}></div>
              <div className={styles.slashLine} style={{ '--slash-rotate': '35deg', '--slash-color': '#ff0000', animationDelay: '0.1s' } as React.CSSProperties}></div>
              <div className={styles.slashLine} style={{ '--slash-rotate': '-10deg', '--slash-color': '#00ffff', animationDelay: '0.15s' } as React.CSSProperties}></div>
            </div>
          )}
          {hitParticles.filter(p => p.targetId === player.id).map(p => (
            <HitParticles key={p.key} targetId={p.targetId} />
          ))}
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
                  <span key={d.key} className={`${styles.damageNumber} ${styles[d.type]} ${d.isCritical ? styles.criticalDamage : ''}`}>
                    {d.type === 'heal' ? '+' : '-'}{d.value}
                  </span>
                ))}
                {currentAttackAnimation && currentAttackAnimation.targetId === enemy.id && (
                  <div className={styles.attackAnimationContainer}>
                    <div className={styles.slashLine} style={{ '--slash-rotate': '15deg', '--slash-color': '#ffcc00' } as React.CSSProperties}></div>
                    <div className={styles.slashLine} style={{ '--slash-rotate': '-25deg', '--slash-color': '#ffffff', animationDelay: '0.05s' } as React.CSSProperties}></div>
                    <div className={styles.slashLine} style={{ '--slash-rotate': '35deg', '--slash-color': '#ff0000', animationDelay: '0.1s' } as React.CSSProperties}></div>
                    <div className={styles.slashLine} style={{ '--slash-rotate': '-10deg', '--slash-color': '#00ffff', animationDelay: '0.15s' } as React.CSSProperties}></div>
                  </div>
                )}
                {hitParticles.filter(p => p.targetId === enemy.id).map(p => (
                  <HitParticles key={p.key} targetId={p.targetId} />
                ))}
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
