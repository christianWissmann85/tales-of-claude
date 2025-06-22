import React, { useRef, useEffect } from 'react';
import styles from './MiniCombatLog.module.css';

// Define the type for a combat log entry
export interface CombatLogEntry {
  id: string; // Unique ID for React keys (e.g., timestamp + random, or simple counter)
  type: 'damage' | 'healing' | 'ability' | 'info'; // Action type for color coding
  message: string; // The message to display
  timestamp: number; // For internal ordering if needed, though array order is usually sufficient
}

interface MiniCombatLogProps {
  logEntries: CombatLogEntry[];
}

const MiniCombatLog: React.FC<MiniCombatLogProps> = ({ logEntries }) => {
  const logContentRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom whenever logEntries change (new messages arrive)
  useEffect(() => {
    if (logContentRef.current) {
      logContentRef.current.scrollTop = logContentRef.current.scrollHeight;
    }
  }, [logEntries]); // Dependency array ensures effect runs when logEntries updates

  // Get the last 5 messages to display
  const lastFiveEntries = logEntries.slice(-5);

  // Opacity values for fading older messages (from oldest of the 5 to newest)
  const opacities = [0.4, 0.6, 0.75, 0.9, 1.0]; // 5 values for 5 messages

  return (
    <div className={styles.combatLogContainer}>
      {/* ASCII-style corner characters */}
      <div className={styles.borderTopLeft}>┌</div>
      <div className={styles.borderTopRight}>┐</div>
      <div className={styles.borderBottomLeft}>└</div>
      <div className={styles.borderBottomRight}>┘</div>

      <div className={styles.logContent} ref={logContentRef}>
        {lastFiveEntries.map((entry, index) => {
          // Determine the CSS class based on the entry type for color coding
          const typeClass = styles[entry.type];
          // Determine the opacity based on its position within the last 5 entries
          const opacityStyle = { opacity: opacities[index] };

          return (
            <div
              key={entry.id} // Unique key for React list rendering
              className={`${styles.logEntry} ${typeClass}`}
              style={opacityStyle}
            >
              {entry.message}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCombatLog;