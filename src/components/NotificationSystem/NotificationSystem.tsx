import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import styles from './NotificationSystem.module.css';

export type NotificationType = 'success' | 'warning' | 'info' | 'error' | 'achievement';

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
  progress?: number;
  actions?: NotificationAction[];
  persistent?: boolean;
}

interface NotificationContextType {
  notify: (notification: Omit<Notification, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationSystem provider');
  }
  return context;
};

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  isAchievement?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDismiss, isAchievement }) => {
  const { id, type, message, duration, progress, actions, persistent } = notification;
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsVisible(true);

    if (!persistent && duration !== 0) {
      const dismissDuration = duration || (isAchievement ? 4000 : 5000);
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(id), 300);
      }, dismissDuration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [id, duration, persistent, onDismiss, isAchievement]);

  const handleDismissClick = useCallback(() => {
    setIsVisible(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setTimeout(() => onDismiss(id), 300);
  }, [id, onDismiss]);

  const iconMap: Record<NotificationType, string> = {
    success: '✅',
    warning: '⚠️',
    info: '💡',
    error: '❌',
    achievement: '🏆',
  };

  return (
    <div
      className={`${styles.notificationItem} ${styles[type]} ${isVisible ? styles.visible : styles.hidden}`}
      role="alert"
    >
      <div className={styles.header}>
        <span className={styles.icon}>{iconMap[type]}</span>
        <span className={styles.message}>{message}</span>
        {(persistent || duration === 0) && !isAchievement && (
          <button onClick={handleDismissClick} className={styles.closeButton} aria-label="Dismiss notification">
            &times;
          </button>
        )}
      </div>
      {progress !== undefined && progress >= 0 && progress <= 100 && (
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }}></div>
        </div>
      )}
      {actions && actions.length > 0 && (
        <div className={styles.actions}>
          {actions.map((action, index) => (
            <button key={index} onClick={action.onClick} className={styles.actionButton}>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const NotificationSystem: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [achievementNotification, setAchievementNotification] = useState<Notification | null>(null);
  const achievementTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = { ...notification, id };

    if (newNotification.type === 'achievement') {
      setAchievementNotification(newNotification);
      if (achievementTimeoutRef.current) {
        clearTimeout(achievementTimeoutRef.current);
      }
      achievementTimeoutRef.current = setTimeout(() => {
        setAchievementNotification(null);
      }, newNotification.duration || 4000);
    } else {
      setNotifications((prev) => [...prev, newNotification]);
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      <div className={styles.notificationContainer}>
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} onDismiss={dismissNotification} />
        ))}
      </div>

      {achievementNotification && (
        <div className={`${styles.achievementOverlay} ${achievementNotification ? styles.visible : styles.hidden}`}>
          <NotificationItem
            notification={achievementNotification}
            onDismiss={() => setAchievementNotification(null)}
            isAchievement={true}
          />
        </div>
      )}
    </NotificationContext.Provider>
  );
};