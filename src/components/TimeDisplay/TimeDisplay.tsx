import React from 'react';
import { useGameContext } from '../../context/GameContext';
import { TimeOfDay } from '../../types/global.types';
import styles from './TimeDisplay.module.css';

const TimeDisplay: React.FC = () => {
  const { state } = useGameContext();
  const { timeData } = state;

  if (!timeData) {
    return null;
  }

  // Format time as HH:MM
  const timeString = `${timeData.hours.toString().padStart(2, '0')}:${timeData.minutes.toString().padStart(2, '0')}`;

  // Determine time period and icon
  let periodIcon = '☀️';
  let periodClass = styles.day;
  const hour = timeData.hours;

  if (hour >= 6 && hour < 8) {
    periodIcon = '🌅';
    periodClass = styles.dawn;
  } else if (hour >= 8 && hour < 18) {
    periodIcon = '☀️';
    periodClass = styles.day;
  } else if (hour >= 18 && hour < 20) {
    periodIcon = '🌅';
    periodClass = styles.dusk;
  } else {
    periodIcon = '🌙';
    periodClass = styles.night;
  }

  return (
    <div className={`${styles.timeDisplay} ${periodClass}`}>
      <span className={styles.timeString}>{timeString}</span>
      <span className={styles.periodIcon}>{periodIcon}</span>
    </div>
  );
};

export default TimeDisplay;