// src/components/StatusBar/StatusBar.tsx
import React from 'react';
import styles from './StatusBar.module.css';
import { useGameContext } from '../../context/GameContext'; // Fixed import path

const StatusBar: React.FC = () => {
  const { state } = useGameContext();
  const { player } = state;

  if (!player) {
    return null; // Or a loading state
  }

  const { stats } = player;

  // Calculate XP needed for next level based on GameContext's Player.addExperience logic
  const expToNextLevel = stats.level * 100;
  const xpPercentage = expToNextLevel > 0 ? (stats.exp / expToNextLevel) : 0;

  const barLength = 10; // Number of block characters for the bars

  const renderProgressBar = (current: number, max: number, barClass: string) => {
    const percentage = max > 0 ? (current / max) : 0;
    const filledBlocks = Math.floor(percentage * barLength);
    const emptyBlocks = barLength - filledBlocks;

    return (
      <div className={`${styles.progressBar} ${barClass}`}>
        {'█'.repeat(filledBlocks)}{'░'.repeat(emptyBlocks)}
      </div>
    );
  };

  return (
    <div className={styles.statusBar}>
      <div className={styles.barContent}>
        <div className={styles.statItem}>
          <span>HP: ❤️</span>
          {renderProgressBar(stats.hp, stats.maxHp, styles.hpBar)}
          <span className={styles.barText}>{stats.hp}/{stats.maxHp}</span>
        </div>

        <div className={styles.statItem}>
          <span>EN: ⚡</span>
          {renderProgressBar(stats.energy, stats.maxEnergy, styles.energyBar)}
          <span className={styles.barText}>{stats.energy}/{stats.maxEnergy}</span>
        </div>

        <div className={styles.statItem}>
          <span>LV: ⭐</span>
          <span className={styles.barText}>{stats.level}</span>
        </div>

        <div className={styles.statItem}>
          <span>XP:</span>
          {renderProgressBar(stats.exp, expToNextLevel, styles.xpBar)}
          <span className={styles.barText}>{Math.floor(xpPercentage * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;