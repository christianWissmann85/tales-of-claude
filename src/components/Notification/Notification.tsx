import React, { useEffect } from 'react';
import { useGameContext } from '../../context/GameContext';
import styles from './Notification.module.css';

const Notification: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const { notification } = state;

  useEffect(() => {
    if (notification) {
      // Auto-clear notification after 3 seconds
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_NOTIFICATION' });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification, dispatch]);

  if (!notification) {
    return null;
  }

  return (
    <div className={styles.notification}>
      <div className={styles.content}>
        {notification}
      </div>
    </div>
  );
};

export default Notification;