import React from 'react';
import styles from './WeatherDisplay.module.css';
import { WeatherType, WeatherEffects } from '../../types/global.types';

interface WeatherDisplayProps {
  weatherType: WeatherType;
  effects: WeatherEffects;
}

// Map WeatherType to display name and icon
const weatherInfoMap: Record<WeatherType, { name: string; icon: string }> = {
  'clear': { name: 'Clear', icon: '☀️' },
  'rain': { name: 'Rain', icon: '🌧️' },
  'storm': { name: 'Storm', icon: '⛈️' },
  'fog': { name: 'Fog', icon: '🌫️' },
  'codeSnow': { name: 'Code Snow', icon: '❄️' },
};

// Fallback for unknown weather types
const defaultWeatherInfo = {
  name: 'Unknown',
  icon: '❓',
};

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ weatherType, effects }) => {
  let currentWeatherInfo = weatherInfoMap[weatherType];

  // Defensive check: If weatherType is not in the map, use a fallback and log a warning.
  if (!currentWeatherInfo) {
    console.warn(`WeatherDisplay: Unknown weather type "${weatherType}" received. Using fallback.`);
    currentWeatherInfo = defaultWeatherInfo;
  }

  const { name, icon } = currentWeatherInfo;

  // Defensive check for effects prop
  const safeEffects = effects || {
    movementSpeedModifier: 1.0,
    visibilityRadius: 3,
    combatAccuracyModifier: 0,
  };

  // Determine if speed modifier should be shown
  const showSpeedModifier = safeEffects.movementSpeedModifier !== 1.0;

  // Determine if visibility should be shown (show if reduced from normal 3)
  const showVisibility = safeEffects.visibilityRadius < 3;

  return (
    <div className={styles.weatherDisplay}>
      <div className={styles.weatherMain}>
        <span className={styles.weatherIcon}>{icon}</span>
        <span className={styles.weatherName}>{name}</span>
      </div>

      {showSpeedModifier && (
        <div className={styles.weatherEffect}>
          Speed: {safeEffects.movementSpeedModifier.toFixed(1)}x
        </div>
      )}

      {showVisibility && (
        <div className={styles.weatherEffect}>
          Vision: {safeEffects.visibilityRadius}
        </div>
      )}
    </div>
  );
};

export default WeatherDisplay;