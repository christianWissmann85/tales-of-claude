import React, { useState, useEffect } from 'react';
import styles from './FactionStatus.module.css';
import { useGameContext } from '../../context/GameContext';
import { useKeyboard } from '../../hooks/useKeyboard'; // Adjust path as needed

// Type definitions for faction data
interface FactionData {
  id: string;
  name: string;
  reputation: number;
  tier: string;
}

// Faction configuration
const FACTION_IDS = ['order', 'chaos', 'memory'];
const FACTION_NAMES: Record<string, string> = {
  'order': 'Order of Clean Code',
  'chaos': 'Chaos Coders',
  'memory': 'Memory Guardians',
};


const FactionStatus: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const { pressedKeys } = useKeyboard();
  const prevPressedKeys = React.useRef(new Set<string>());
  
  // Check if faction status should be visible
  const isVisible = state.showFactionStatus;

  // Handle 'F' key press to toggle visibility
  React.useEffect(() => {
    const currentPressedKeys = new Set(pressedKeys);
    
    // Check for 'f' key press (rising edge)
    if (currentPressedKeys.has('KeyF') && !prevPressedKeys.current.has('KeyF')) {
      dispatch({ type: 'TOGGLE_FACTION_STATUS' });
    }
    
    // Check for 'ESC' key press to close
    if (currentPressedKeys.has('Escape') && !prevPressedKeys.current.has('Escape') && isVisible) {
      dispatch({ type: 'SHOW_FACTION_STATUS', payload: { show: false } });
    }
    
    prevPressedKeys.current = currentPressedKeys;
  }, [pressedKeys, dispatch, isVisible]);

  if (!isVisible || !state.factionManager) {
    return null;
  }

  // Get faction data from the FactionManager
  const factionData: FactionData[] = FACTION_IDS.map(id => {
    const reputation = state.factionManager.getReputation(id);
    const tier = state.factionManager.getReputationTier(id);
    return {
      id,
      name: FACTION_NAMES[id],
      reputation,
      tier,
    };
  });

  // Helper function to render a single faction's status block
  const renderFaction = (faction: FactionData) => {
    const { id, name, reputation, tier } = faction;

    // Calculate progress for the bar
    let progress = 0;
    let minRep = -100;
    let maxRep = 100;
    let nextThreshold = 0;

    // Determine progress based on tier
    if (tier === 'Hostile') {
      minRep = -100;
      nextThreshold = -20;
      progress = (reputation - minRep) / (nextThreshold - minRep);
    } else if (tier === 'Neutral') {
      minRep = -20;
      nextThreshold = 20;
      progress = (reputation - minRep) / (nextThreshold - minRep);
    } else if (tier === 'Allied') {
      minRep = 20;
      maxRep = 100;
      progress = (reputation - minRep) / (maxRep - minRep);
    } else if (tier === 'Unfriendly') {
      minRep = -100;
      nextThreshold = -20;
      progress = (reputation - minRep) / (nextThreshold - minRep);
    } else if (tier === 'Friendly') {
      minRep = 20;
      maxRep = 100;
      progress = (reputation - minRep) / (maxRep - minRep);
    }

    // Ensure progress is within bounds [0, 1]
    progress = Math.max(0, Math.min(1, progress));

    const progressBarLength = 20; // ASCII characters for the bar
    const filledLength = Math.floor(progress * progressBarLength);
    const emptyLength = progressBarLength - filledLength;

    const progressBar = '[' + '#'.repeat(filledLength) + '-'.repeat(emptyLength) + ']';

    // Determine tier color class
    const tierClass = tier === 'Hostile' ? 'hostile' : 
                     tier === 'Allied' ? 'allied' : 'neutral';

    return (
      <div key={id} className={styles.factionEntry}>
        <div className={styles.factionName}>{name}</div>
        <div className={`${styles.reputationTier} ${styles[tierClass]}`}>
          {tier} ({reputation})
        </div>
        <div className={styles.progressBar}>
          {progressBar}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.factionStatusPanel}>
      <pre className={styles.asciiBorder}>
        {`+---------------------------------------+
|          FACTION STATUS           |
+---------------------------------------+`}
      </pre>
      <div className={styles.content}>
        {factionData.map(renderFaction)}
      </div>
      <pre className={styles.asciiBorder}>
        {'+---------------------------------------+'}
      </pre>
    </div>
  );
};

export default FactionStatus;
