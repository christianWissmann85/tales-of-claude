// src/components/QuestJournal/QuestJournal.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './QuestJournal.module.css';
import { useGameContext } from '../../context/GameContext';
import { useKeyboard } from '../../hooks/useKeyboard';
import { QuestManager } from '../../models/QuestManager';
import {
  Quest,
  QuestChoice,
  QuestBranch,
  ConsequenceType,
  BranchingObjective,
  QuestConsequence,
} from '../../models/Quest';

type QuestCategory = 'main' | 'side' | 'completed';

const QuestJournal: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const { pressedKeys } = useKeyboard();
  const questManager = QuestManager.getInstance();
  
  const [selectedCategory, setSelectedCategory] = useState<QuestCategory>('main');
  const [selectedQuestIndex, setSelectedQuestIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBranchVisualization, setShowBranchVisualization] = useState(true);
  const [prevPressedKeys, setPrevPressedKeys] = useState(new Set<string>());

  // Get quests by category
  const getQuestsByCategory = useCallback((): Quest[] => {
    const allQuests = questManager.allQuests;
    
    switch (selectedCategory) {
      case 'main':
        return allQuests.filter(q => 
          q.id.startsWith('mq_') && q.status !== 'completed',
        );
      case 'side':
        return allQuests.filter(q => 
          q.id.startsWith('sq_') && q.status !== 'completed',
        );
      case 'completed':
        return allQuests.filter(q => q.status === 'completed');
      default:
        return [];
    }
  }, [questManager.allQuests, selectedCategory]);

  // Filter quests by search term
  const filteredQuests = useMemo(() => {
    const quests = getQuestsByCategory();
    
    if (!searchTerm) { return quests; }
    
    const lowerSearch = searchTerm.toLowerCase();
    return quests.filter(quest => 
      quest.name.toLowerCase().includes(lowerSearch) ||
      quest.description.toLowerCase().includes(lowerSearch) ||
      quest.objectives.some(obj => 
        obj.description.toLowerCase().includes(lowerSearch),
      ),
    );
  }, [getQuestsByCategory, searchTerm]);

  const selectedQuest = filteredQuests[selectedQuestIndex] || null;

  // Handle keyboard navigation
  useEffect(() => {
    // Tab to switch categories
    if (pressedKeys.has('Tab') && !prevPressedKeys.has('Tab')) {
      const categories: QuestCategory[] = ['main', 'side', 'completed'];
      const currentIndex = categories.indexOf(selectedCategory);
      const nextIndex = (currentIndex + 1) % categories.length;
      setSelectedCategory(categories[nextIndex]);
      setSelectedQuestIndex(0);
    }

    // Arrow keys for quest selection
    if (pressedKeys.has('ArrowUp') && !prevPressedKeys.has('ArrowUp')) {
      setSelectedQuestIndex(prev => Math.max(0, prev - 1));
    }

    if (pressedKeys.has('ArrowDown') && !prevPressedKeys.has('ArrowDown')) {
      setSelectedQuestIndex(prev => 
        Math.min(filteredQuests.length - 1, prev + 1),
      );
    }

    // V to toggle branch visualization
    if (pressedKeys.has('KeyV') && !prevPressedKeys.has('KeyV')) {
      setShowBranchVisualization(prev => !prev);
    }

    // S to focus search
    if (pressedKeys.has('KeyS') && !prevPressedKeys.has('KeyS')) {
      // Would need a ref to actually focus the input
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: { message: 'Search mode activated - type to filter quests' },
      });
    }

    // Q or ESC to close journal
    if ((pressedKeys.has('KeyQ') && !prevPressedKeys.has('KeyQ')) ||
        (pressedKeys.has('Escape') && !prevPressedKeys.has('Escape'))) {
      dispatch({ type: 'UPDATE_GAME_FLAG', payload: { key: 'showQuestLog', value: false } });
    }

    setPrevPressedKeys(new Set(pressedKeys));
  }, [pressedKeys, selectedCategory, filteredQuests.length, dispatch]);

  const handleClose = () => {
    dispatch({ type: 'SHOW_QUEST_LOG', payload: { show: false } });
  };

  // Render quest type icon
  const getQuestIcon = (quest: Quest): string => {
    if (quest.id.startsWith('mq_')) { return '⭐'; } // Main quest
    if (quest.id.startsWith('sq_')) { return '◆'; } // Side quest
    if (quest.branches) { return '🌿'; } // Branching quest
    return '•';
  };

  // Render quest status color class
  const getQuestStatusClass = (quest: Quest): string => {
    if (quest.status === 'completed') { return styles.completedQuest; }
    if (quest.status === 'in_progress') { return styles.activeQuest; }
    if (quest.status === 'failed') { return styles.failedQuest; }
    return styles.availableQuest;
  };

  // Render faction impact
  const renderFactionImpact = (consequences: QuestConsequence[]) => {
    const factionChanges = consequences.filter(c => 
      c.type === ConsequenceType.FACTION_CHANGE || 
      c.type === ConsequenceType.REPUTATION_CHANGE,
    );

    if (factionChanges.length === 0) { return null; }

    return (
      <div className={styles.factionImpact}>
        {factionChanges.map((change, idx) => (
          <span 
            key={idx}
            className={
              (change.value as number) > 0 ? styles.positiveImpact : styles.negativeImpact
            }
          >
            {change.targetId}: {(change.value as number) > 0 ? '+' : ''}{change.value}
          </span>
        ))}
      </div>
    );
  };

  // Render branching visualization
  const renderBranchVisualization = (quest: Quest) => {
    if (!quest.branches || !showBranchVisualization) { return null; }

    return (
      <div className={styles.branchVisualization}>
        <div className={styles.branchTitle}>Quest Branches:</div>
        {Object.entries(quest.branches).map(([branchId, branch]) => {
          const isActive = quest.currentBranchId === branchId;
          const isCompleted = branch.objectives.every(obj => 
            quest.objectives.find(qObj => 
              qObj.description === obj.description,
            )?.isCompleted,
          );

          return (
            <div 
              key={branchId}
              className={`${styles.branchItem} ${
                isActive ? styles.activeBranch : ''
              } ${isCompleted ? styles.completedBranch : ''}`}
            >
              <div className={styles.branchName}>{branch.name}</div>
              <div className={styles.branchDescription}>{branch.description}</div>
              {branch.factionRequirements && (
                <div className={styles.branchRequirements}>
                  Requirements: {branch.factionRequirements.map(req => 
                    `${req.factionId} ${req.minReputation ? `≥${req.minReputation}` : ''}`,
                  ).join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render choice history
  const renderChoiceHistory = (quest: Quest) => {
    if (!quest.currentChoices || quest.currentChoices.length === 0) { return null; }

    return (
      <div className={styles.choiceSection}>
        <div className={styles.choiceTitle}>⚡ Critical Decision Point:</div>
        {quest.currentChoices.map((choice, idx) => (
          <div key={choice.id} className={styles.choiceItem}>
            <div className={styles.choiceText}>{idx + 1}. {choice.text}</div>
            {choice.consequences.length > 0 && (
              <div className={styles.choiceConsequences}>
                {renderFactionImpact(choice.consequences)}
              </div>
            )}
          </div>
        ))}
        <div className={styles.choiceWarning}>
          ⚠️ This choice will have lasting consequences!
        </div>
      </div>
    );
  };

  // ASCII border
  const borderString = '─'.repeat(80);

  return (
    <div 
      className={styles.questLogOverlay}
      onClick={(e) => {
        // Close quest journal when clicking on the overlay background
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className={styles.questLogContainer}
        onClick={(e) => {
          // Prevent clicks inside the journal from bubbling up
          e.stopPropagation();
        }}
      >
        <div className={styles.borderTop}>┌{borderString}┐</div>
        
        <div className={styles.header}>
          <div className={styles.borderLeft}>│</div>
          <div className={styles.title}>📜 Quest Journal - Tales of Claude</div>
          <div className={styles.borderRight}>│</div>
        </div>

        <div className={styles.categories}>
          <div className={styles.borderLeft}>│</div>
          <div className={styles.categoryTabs}>
            <span className={selectedCategory === 'main' ? styles.activeTab : styles.tab}>
              ⭐ Main Quests ({filteredQuests.filter(q => q.id.startsWith('mq_')).length})
            </span>
            <span className={selectedCategory === 'side' ? styles.activeTab : styles.tab}>
              ◆ Side Quests ({filteredQuests.filter(q => q.id.startsWith('sq_')).length})
            </span>
            <span className={selectedCategory === 'completed' ? styles.activeTab : styles.tab}>
              ✓ Completed ({questManager.allQuests.filter(q => q.status === 'completed').length})
            </span>
          </div>
          <div className={styles.borderRight}>│</div>
        </div>

        <div className={styles.searchBar}>
          <div className={styles.borderLeft}>│</div>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="🔍 Search quests... (Press S to focus)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className={styles.borderRight}>│</div>
        </div>

        <div className={styles.contentWrapper}>
          <div className={styles.borderLeft}>│</div>
          
          <div className={styles.content}>
            <div className={styles.questList}>
              <div className={styles.listHeader}>Quest List:</div>
              {filteredQuests.length === 0 ? (
                <div className={styles.emptyMessage}>
                  No quests found
                </div>
              ) : (
                filteredQuests.map((quest, index) => (
                  <div
                    key={quest.id}
                    className={`${styles.questItem} ${
                      index === selectedQuestIndex ? styles.selected : ''
                    } ${getQuestStatusClass(quest)}`}
                  >
                    {index === selectedQuestIndex ? '> ' : '  '}
                    {getQuestIcon(quest)} {quest.name}
                    {quest.status === 'in_progress' && quest.getCurrentObjective() && (
                      <div className={styles.miniProgress}>
                        {quest.getCurrentObjective()!.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {selectedQuest && (
              <div className={styles.questDetails}>
                <div className={styles.detailsHeader}>
                  {getQuestIcon(selectedQuest)} {selectedQuest.name}
                </div>
                <div className={styles.questStatus}>
                  Status: {selectedQuest.status.toUpperCase()}
                </div>
                <div className={styles.description}>{selectedQuest.description}</div>
                
                <div className={styles.objectives}>
                  <div className={styles.objectivesHeader}>Objectives:</div>
                  {selectedQuest.objectives.map((obj) => (
                    <div
                      key={obj.id}
                      className={`${styles.objective} ${
                        obj.isCompleted ? styles.completedObjective : 
                        obj === selectedQuest.getCurrentObjective() ? styles.activeObjective : ''
                      }`}
                    >
                      {obj.isCompleted ? '✓' : obj === selectedQuest.getCurrentObjective() ? '→' : '•'} 
                      {obj.description}
                      {obj.quantity > 1 && (
                        <span className={styles.progress}>
                          {' '}({obj.currentProgress}/{obj.quantity})
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {selectedQuest.branches && renderBranchVisualization(selectedQuest)}
                {renderChoiceHistory(selectedQuest)}

                <div className={styles.rewards}>
                  <div className={styles.rewardsHeader}>Rewards:</div>
                  <div>• {selectedQuest.rewards.exp} EXP</div>
                  {selectedQuest.rewards.items.map((item, index) => (
                    <div key={index}>
                      • {item.quantity}x {item.itemId}
                    </div>
                  ))}
                </div>

                {selectedQuest.prerequisites.length > 0 && (
                  <div className={styles.prerequisites}>
                    Prerequisites: {selectedQuest.prerequisites.join(', ')}
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
            [TAB] Switch Category | [↑↓] Select | [S] Search | [V] Toggle Branches | [Q] Close
          </div>
          <div className={styles.borderRight}>│</div>
        </div>

        <div className={styles.borderBottom}>└{borderString}┘</div>
      </div>
    </div>
  );
};

export default QuestJournal;