import React, { useState, useEffect, useRef } from 'react';
import styles from './PlayerProgressBar.module.css';

// Define the shape of the player stats props
interface PlayerStats {
  level: number;
  currentXP: number;
  maxXpForLevel: number;
  currentHP: number;
  maxHP: number;
  currentEnergy: number;
  maxEnergy: number;
}

// Helper component for rendering individual progress bars
const ProgressBar: React.FC<{
  label: string;
  current: number;
  max: number;
  percentage: number;
  barClass: string; // CSS class for specific bar styling (color/gradient)
}> = ({ label, current, max, percentage, barClass }) => (
  <div className={styles.progressBarContainer}>
    <div className={styles.progressBarLabel}>{label}:</div>
    <div className={styles.progressBarWrapper}>
      <div
        className={`${styles.progressBarFill} ${barClass}`}
        style={{ width: `${percentage}%` }}
      ></div>
      <span className={styles.progressBarText}>
        {current}/{max}
      </span>
    </div>
  </div>
);

const PlayerProgressBar: React.FC<PlayerStats> = ({
  level,
  currentXP,
  maxXpForLevel,
  currentHP,
  maxHP,
  currentEnergy,
  maxEnergy,
}) => {
  // State to control the level-up animation
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  // Ref to store the previous level for comparison
  const prevLevelRef = useRef(level);

  // Effect to trigger level-up animation when level increases
  useEffect(() => {
    if (level > prevLevelRef.current) {
      setIsLevelingUp(true);
      const timer = setTimeout(() => {
        setIsLevelingUp(false);
      }, 1000); // Animation duration (1 second)
      return () => clearTimeout(timer); // Cleanup timeout on unmount or re-render
    }
    // Update the previous level for the next render cycle
    prevLevelRef.current = level;
  }, [level]); // Dependency array: re-run effect when 'level' prop changes

  // Calculate percentages for each progress bar
  const xpPercentage = (currentXP / maxXpForLevel) * 100;
  const hpPercentage = (currentHP / maxHP) * 100;
  const energyPercentage = (currentEnergy / maxEnergy) * 100;

  return (
    <div className={styles.playerProgressBar}>
      {/* Level Display with Animation */}
      <div className={styles.levelInfo}>
        <span className={`${styles.levelValue} ${isLevelingUp ? styles.levelUpAnimation : ''}`}>
          Level: {level}
        </span>
      </div>

      {/* XP Progress Bar */}
      <ProgressBar
        label="XP"
        current={currentXP}
        max={maxXpForLevel}
        percentage={xpPercentage}
        barClass={styles.xpBar}
      />

      {/* HP Progress Bar */}
      <ProgressBar
        label="HP"
        current={currentHP}
        max={maxHP}
        percentage={hpPercentage}
        barClass={styles.hpBar}
      />

      {/* Energy Progress Bar */}
      <ProgressBar
        label="Energy"
        current={currentEnergy}
        max={maxEnergy}
        percentage={energyPercentage}
        barClass={styles.energyBar}
      />
    </div>
  );
};

export default PlayerProgressBar;