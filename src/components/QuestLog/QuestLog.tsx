// src/components/QuestLog/QuestLog.tsx

import React, { useState, useEffect } from 'react';
import styles from './QuestLog.module.css';
import { useGameContext } from '../../context/GameContext';
import { useKeyboard } from '../../hooks/useKeyboard';
import { QuestManager } from '../../models/QuestManager';
import { Quest } from '../../models/Quest';

type QuestCategory = 'active' | 'available' | 'completed';

const QuestLog: React.FC = () => {
  const { dispatch } = useGameContext();
  const { pressedKeys } = useKeyboard();
  const questManager = QuestManager.getInstance();
  
  const [selectedCategory, setSelectedCategory] = useState<QuestCategory>('active');
  const [selectedQuestIndex, setSelectedQuestIndex] = useState(0);
  const [prevPressedKeys, setPrevPressedKeys] = useState(new Set<string>());

  // Get quests by category
  const activeQuests = questManager.getActiveQuests();
  const availableQuests = questManager.getAvailableQuests();
  const completedQuests = questManager.allQuests.filter(
    quest => quest.status === 'completed',
  );

  // Get current category's quests
  const getCurrentCategoryQuests = (): Quest[] => {
    switch (selectedCategory) {
      case 'active':
        return activeQuests;
      case 'available':
        return availableQuests;
      case 'completed':
        return completedQuests;
      default:
        return [];
    }
  };

  const currentQuests = getCurrentCategoryQuests();
  const selectedQuest = currentQuests[selectedQuestIndex] || null;

  // Handle keyboard navigation
  useEffect(() => {
    // Tab to switch categories
    if (pressedKeys.has('Tab') && !prevPressedKeys.has('Tab')) {
      const categories: QuestCategory[] = ['active', 'available', 'completed'];
      const currentIndex = categories.indexOf(selectedCategory);
      const nextIndex = (currentIndex + 1) % categories.length;
      setSelectedCategory(categories[nextIndex]);
      setSelectedQuestIndex(0); // Reset selection when switching categories
    }

    // Arrow keys for quest selection
    if (pressedKeys.has('ArrowUp') && !prevPressedKeys.has('ArrowUp')) {
      setSelectedQuestIndex(prev => Math.max(0, prev - 1));
    }

    if (pressedKeys.has('ArrowDown') && !prevPressedKeys.has('ArrowDown')) {
      setSelectedQuestIndex(prev => 
        Math.min(currentQuests.length - 1, prev + 1),
      );
    }

    // Enter to start available quest
    if (pressedKeys.has('Enter') && !prevPressedKeys.has('Enter')) {
      if (selectedCategory === 'available' && selectedQuest) {
        const started = questManager.startQuest(selectedQuest.id);
        if (started) {
          dispatch({
            type: 'SHOW_NOTIFICATION',
            payload: { message: `Quest started: ${selectedQuest.name}` },
          });
          // Move to active quests
          setSelectedCategory('active');
          setSelectedQuestIndex(activeQuests.length); // Select the newly started quest
        }
      }
    }

    // Q to close quest log
    if (pressedKeys.has('KeyQ') && !prevPressedKeys.has('KeyQ')) {
      dispatch({ type: 'UPDATE_GAME_FLAG', payload: { key: 'showQuestLog', value: false } });
    }

    setPrevPressedKeys(new Set(pressedKeys));
  }, [pressedKeys, selectedCategory, selectedQuest, currentQuests.length, dispatch]);

  // Render quest objective progress
  const renderObjectiveProgress = (quest: Quest) => {
    const currentObjective = quest.getCurrentObjective();
    if (!currentObjective) { return null; }

    return (
      <div className={styles.objectiveProgress}>
        {currentObjective.description}
        {currentObjective.quantity > 1 && (
          <span className={styles.progress}>
            {' '}({currentObjective.currentProgress}/{currentObjective.quantity})
          </span>
        )}
      </div>
    );
  };

  // ASCII border (similar to DialogueBox)
  const borderString = '─'.repeat(60);

  return (
    <div className={styles.questLogOverlay}>
      <div className={styles.questLog}>
        <div className={styles.borderTop}>┌{borderString}┐</div>
        
        <div className={styles.header}>
          <div className={styles.borderLeft}>│</div>
          <div className={styles.title}>Quest Log</div>
          <div className={styles.borderRight}>│</div>
        </div>

        <div className={styles.categories}>
          <div className={styles.borderLeft}>│</div>
          <div className={styles.categoryTabs}>
            <span className={selectedCategory === 'active' ? styles.activeTab : styles.tab}>
              Active ({activeQuests.length})
            </span>
            <span className={selectedCategory === 'available' ? styles.activeTab : styles.tab}>
              Available ({availableQuests.length})
            </span>
            <span className={selectedCategory === 'completed' ? styles.activeTab : styles.tab}>
              Completed ({completedQuests.length})
            </span>
          </div>
          <div className={styles.borderRight}>│</div>
        </div>

        <div className={styles.contentWrapper}>
          <div className={styles.borderLeft}>│</div>
          
          <div className={styles.content}>
            <div className={styles.questList}>
              <div className={styles.listHeader}>Quests:</div>
              {currentQuests.length === 0 ? (
                <div className={styles.emptyMessage}>
                  No {selectedCategory} quests
                </div>
              ) : (
                currentQuests.map((quest, index) => (
                  <div
                    key={quest.id}
                    className={`${styles.questItem} ${
                      index === selectedQuestIndex ? styles.selected : ''
                    } ${quest.status === 'completed' ? styles.completed : ''}`}
                  >
                    {index === selectedQuestIndex ? '> ' : '  '}
                    {quest.name}
                    {quest.status === 'in_progress' && renderObjectiveProgress(quest)}
                  </div>
                ))
              )}
            </div>

            {selectedQuest && (
              <div className={styles.questDetails}>
                <div className={styles.detailsHeader}>{selectedQuest.name}</div>
                <div className={styles.description}>{selectedQuest.description}</div>
                
                <div className={styles.objectives}>
                  <div className={styles.objectivesHeader}>Objectives:</div>
                  {selectedQuest.objectives.map((obj, _index) => (
                    <div
                      key={obj.id}
                      className={`${styles.objective} ${
                        obj.isCompleted ? styles.completedObjective : ''
                      }`}
                    >
                      {obj.isCompleted ? '✓' : '•'} {obj.description}
                      {!obj.isCompleted && obj.quantity > 1 && (
                        <span className={styles.progress}>
                          {' '}({obj.currentProgress}/{obj.quantity})
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.rewards}>
                  <div className={styles.rewardsHeader}>Rewards:</div>
                  <div>• {selectedQuest.rewards.exp} EXP</div>
                  {selectedQuest.rewards.items.map((item, index) => (
                    <div key={index}>
                      • {item.quantity}x {item.itemId}
                    </div>
                  ))}
                </div>

                {selectedCategory === 'available' && (
                  <div className={styles.startPrompt}>
                    [Press ENTER to start this quest]
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.borderRight}>│</div>
        </div>

        <div className={styles.controls}>
          <div className={styles.borderLeft}>│</div>
          <div className={styles.controlText}>
            [TAB] Switch Category | [↑↓] Select | [Q] Close
          </div>
          <div className={styles.borderRight}>│</div>
        </div>

        <div className={styles.borderBottom}>└{borderString}┘</div>
      </div>
    </div>
  );
};

export default QuestLog;