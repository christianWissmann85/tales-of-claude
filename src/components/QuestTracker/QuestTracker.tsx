// src/components/QuestTracker/QuestTracker.tsx

import React, { useState, useEffect, useCallback } from 'react';
import styles from './QuestTracker.module.css';
import { QuestManager } from '../../models/QuestManager';
import { Quest } from '../../models/Quest';
import { Position } from '../../types/global.types';
import { useKeyboard } from '../../hooks/useKeyboard';

interface QuestTrackerProps {
  onOpenJournal: () => void;
  playerPosition: Position;
}

const QuestTracker: React.FC<QuestTrackerProps> = ({ onOpenJournal, playerPosition }) => {
  const questManager = QuestManager.getInstance();
  const { pressedKeys } = useKeyboard();
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [selectedQuestIndex, setSelectedQuestIndex] = useState(0);
  const [prevPressedKeys, setPrevPressedKeys] = useState(new Set<string>());

  // Update active quests
  useEffect(() => {
    const updateQuests = () => {
      const quests = questManager.getActiveQuests().slice(0, 3); // Show max 3 quests
      setActiveQuests(quests);
    };

    updateQuests();
    // Update every second to catch quest progress changes
    const interval = setInterval(updateQuests, 1000);
    
    return () => clearInterval(interval);
  }, [questManager]);

  // Handle keyboard shortcuts
  useEffect(() => {
    // Q to cycle through active quests
    if (pressedKeys.has('KeyQ') && !prevPressedKeys.has('KeyQ') && !isMinimized) {
      setSelectedQuestIndex(prev => (prev + 1) % activeQuests.length);
    }

    // J to open journal
    if (pressedKeys.has('KeyJ') && !prevPressedKeys.has('KeyJ')) {
      onOpenJournal();
    }

    // M to minimize/expand tracker
    if (pressedKeys.has('KeyM') && !prevPressedKeys.has('KeyM')) {
      setIsMinimized(prev => !prev);
    }

    setPrevPressedKeys(new Set(pressedKeys));
  }, [pressedKeys, activeQuests.length, isMinimized, onOpenJournal]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const handleQuestClick = useCallback((index: number) => {
    setSelectedQuestIndex(index);
    onOpenJournal();
  }, [onOpenJournal]);

  // Calculate distance to objective (mock implementation)
  const calculateDistance = useCallback((objective: any): number | null => {
    // In a real implementation, you'd look up the target's position
    // For now, return a mock distance
    if (objective.type === 'reach_location' || objective.type === 'talk_to_npc') {
      return Math.floor(Math.random() * 200) + 50;
    }
    return null;
  }, [playerPosition]);

  const renderObjectiveProgress = (quest: Quest) => {
    const objective = quest.getCurrentObjective();
    if (!objective) { return null; }

    const distance = calculateDistance(objective);

    return (
      <div className={styles.objectiveInfo}>
        <div className={styles.objectiveText}>
          {objective.description}
        </div>
        {objective.quantity > 1 && (
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: `${(objective.currentProgress / objective.quantity) * 100}%`, 
              }}
            />
            <span className={styles.progressText}>
              {objective.currentProgress}/{objective.quantity}
            </span>
          </div>
        )}
        {distance !== null && (
          <div className={styles.distance}>
            📍 {distance}m away
          </div>
        )}
      </div>
    );
  };

  const getQuestIcon = (quest: Quest): string => {
    if (quest.id.startsWith('mq_')) { return '⭐'; }
    if (quest.id.startsWith('sq_')) { return '◆'; }
    return '•';
  };

  if (activeQuests.length === 0) {
    return null; // Don't show tracker if no active quests
  }

  return (
    <div className={`${styles.questTracker} ${isMinimized ? styles.minimized : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          Quest Tracker
          {activeQuests.length > 0 && (
            <span className={styles.questCount}>({activeQuests.length})</span>
          )}
        </h3>
        <button 
          onClick={toggleMinimize}
          className={styles.minimizeButton}
          title={isMinimized ? 'Expand (M)' : 'Minimize (M)'}
        >
          {isMinimized ? '▶' : '▼'}
        </button>
      </div>

      {!isMinimized && (
        <div className={styles.questList}>
          {activeQuests.map((quest, index) => (
            <div
              key={quest.id}
              className={`${styles.questItem} ${
                index === selectedQuestIndex ? styles.selected : ''
              }`}
              onClick={() => handleQuestClick(index)}
            >
              <div className={styles.questHeader}>
                <span className={styles.questIcon}>{getQuestIcon(quest)}</span>
                <span className={styles.questName}>{quest.name}</span>
              </div>
              {renderObjectiveProgress(quest)}
            </div>
          ))}
          
          <div className={styles.controls}>
            <span className={styles.controlHint}>[Q] Cycle</span>
            <span className={styles.controlHint}>[J] Journal</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestTracker;