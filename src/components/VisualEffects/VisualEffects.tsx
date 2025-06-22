import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import styles from './VisualEffects.module.css';

interface VisualEffectsContextType {
  triggerScreenShake: () => void;
  triggerParticle: (text: string, x: number, y: number) => void;
  triggerGlow: (objectId: string, duration?: number) => void;
  isGlowing: (objectId: string) => boolean;
  startMapFade: (direction: 'in' | 'out', durationMs?: number) => Promise<void>;
  triggerLevelUpSparkle: () => void;
  triggerCombatHitFlash: () => void;
}

const VisualEffectsContext = createContext<VisualEffectsContextType | undefined>(undefined);

export const useScreenShake = () => {
  const context = useContext(VisualEffectsContext);
  if (!context) throw new Error('useScreenShake must be used within a VisualEffectsProvider');
  return context.triggerScreenShake;
};

export const useParticle = () => {
  const context = useContext(VisualEffectsContext);
  if (!context) throw new Error('useParticle must be used within a VisualEffectsProvider');
  return context.triggerParticle;
};

export const useGlow = () => {
  const context = useContext(VisualEffectsContext);
  if (!context) throw new Error('useGlow must be used within a VisualEffectsProvider');
  return {
    triggerGlow: context.triggerGlow,
    isGlowing: context.isGlowing,
  };
};

export const useMapTransition = () => {
  const context = useContext(VisualEffectsContext);
  if (!context) throw new Error('useMapTransition must be used within a VisualEffectsProvider');
  return context.startMapFade;
};

export const useLevelUpSparkle = () => {
  const context = useContext(VisualEffectsContext);
  if (!context) throw new Error('useLevelUpSparkle must be used within a VisualEffectsProvider');
  return context.triggerLevelUpSparkle;
};

export const useCombatHitFlash = () => {
  const context = useContext(VisualEffectsContext);
  if (!context) throw new Error('useCombatHitFlash must be used within a VisualEffectsProvider');
  return context.triggerCombatHitFlash;
};

interface Particle {
  id: string;
  text: string;
  x: number;
  y: number;
}

interface VisualEffectsProviderProps {
  children: React.ReactNode;
}

export const VisualEffectsProvider: React.FC<VisualEffectsProviderProps> = ({ children }) => {
  const [isShaking, setIsShaking] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [glowingObjects, setGlowingObjects] = useState<Set<string>>(new Set());
  const [mapFadeActive, setMapFadeActive] = useState(false);
  const [mapFadeDirection, setMapFadeDirection] = useState<'to-black' | 'from-black' | null>(null);
  const [isLevelUpSparkling, setIsLevelUpSparkling] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const triggerScreenShake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  }, []);

  const triggerParticle = useCallback((text: string, x: number, y: number) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    setParticles(prev => [...prev, { id, text, x, y }]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, 1500);
  }, []);

  const glowTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const triggerGlow = useCallback((objectId: string, duration: number = 2000) => {
    setGlowingObjects(prev => new Set(prev).add(objectId));
    if (glowTimeouts.current.has(objectId)) {
      clearTimeout(glowTimeouts.current.get(objectId)!);
    }
    const timeoutId = setTimeout(() => {
      setGlowingObjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(objectId);
        return newSet;
      });
      glowTimeouts.current.delete(objectId);
    }, duration);
    glowTimeouts.current.set(objectId, timeoutId);
  }, []);

  const isGlowing = useCallback((objectId: string) => {
    return glowingObjects.has(objectId);
  }, [glowingObjects]);

  useEffect(() => {
    return () => {
      glowTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, []);

  const startMapFade = useCallback((direction: 'in' | 'out', durationMs: number = 1000): Promise<void> => {
    return new Promise(resolve => {
      if (direction === 'out') {
        setMapFadeDirection('to-black');
        setMapFadeActive(true);
      } else {
        setMapFadeDirection('from-black');
        setMapFadeActive(true);
      }
      setTimeout(() => {
        if (direction === 'in') {
          setMapFadeActive(false);
          setMapFadeDirection(null);
        }
        resolve();
      }, durationMs);
    });
  }, []);

  const triggerLevelUpSparkle = useCallback(() => {
    setIsLevelUpSparkling(true);
    setTimeout(() => setIsLevelUpSparkling(false), 1500);
  }, []);

  const triggerCombatHitFlash = useCallback(() => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 100);
  }, []);

  const contextValue = {
    triggerScreenShake,
    triggerParticle,
    triggerGlow,
    isGlowing,
    startMapFade,
    triggerLevelUpSparkle,
    triggerCombatHitFlash,
  };

  return (
    <VisualEffectsContext.Provider value={contextValue}>
      <div className={`${styles.gameContainer} ${isShaking ? styles.screenShake : ''}`}>
        {children}

        {particles.map(p => (
          <div
            key={p.id}
            className={styles.particle}
            style={{ left: p.x, top: p.y }}
          >
            {p.text}
          </div>
        ))}

        {mapFadeActive && (
          <div className={`${styles.mapFadeOverlay} ${mapFadeDirection === 'to-black' ? styles.toBlack : styles.fromBlack}`}></div>
        )}

        {isLevelUpSparkling && (
          <div className={styles.levelUpSparkleOverlay}>
            <div className={styles.sparkleEffect}></div>
          </div>
        )}

        {isFlashing && (
          <div className={styles.hitFlashOverlay}></div>
        )}
      </div>
    </VisualEffectsContext.Provider>
  );
};