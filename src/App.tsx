import React, { useEffect } from 'react';
import { GameProvider, useGameContext } from './context/GameContext';
import StatusBar from './components/StatusBar/StatusBar';
import GameBoard from './components/GameBoard/GameBoard';
import DialogueBox from './components/DialogueBox/DialogueBox';
import Battle from './components/Battle/Battle';
import Notification from './components/Notification/Notification';
import SplashScreen from './components/SplashScreen/SplashScreen';
import OpeningScene from './components/OpeningScene/OpeningScene';
import { NotificationSystem } from './components/NotificationSystem/NotificationSystem';
import TimeDisplay from './components/TimeDisplay/TimeDisplay';
import FloorTileTest from './components/TestPages/FloorTileTest';

// Import the new UIFramework styles
import styles from './styles/UIFramework.module.css';

// Separate component to access game context
const GameContent: React.FC = () => {
  const { state, dispatch } = useGameContext();

  // Check for agent/nosplash flag on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isAgentMode = urlParams.get('agent') === 'true' || urlParams.get('nosplash') === 'true';
    
    if (isAgentMode && state.gamePhase !== 'playing') {
      // Skip directly to playing phase for agent testing
      dispatch({ type: 'SET_GAME_PHASE', payload: { phase: 'playing' } });
      console.log('[AGENT MODE] Skipping splash and intro screens');
    }
  }, []); // Run once on mount

  // Handle splash screen completion
  const handleSplashComplete = () => {
    dispatch({ type: 'SET_GAME_PHASE', payload: { phase: 'intro' } });
  };

  // Handle opening scene completion
  const handleIntroComplete = () => {
    dispatch({ type: 'SET_GAME_PHASE', payload: { phase: 'playing' } });
  };

  // Remove duplicate key handler - GameEngine handles all keyboard input
  // This was causing conflicts with the GameEngine's keyboard handling

  // Render different screens based on game phase
  if (state.gamePhase === 'splash') {
    return <SplashScreen onStart={handleSplashComplete} />;
  }

  if (state.gamePhase === 'intro') {
    return <OpeningScene onComplete={handleIntroComplete} />;
  }

  // Render the main game UI using the new framework styles
  return (
    <div className={styles.mainLayout}>
      {/* Left Sidebar */}
      <div className={styles.leftSidebar}>
        {/* Status Panel */}
        <div className={`${styles.uiPanel} ${styles.statusPanel}`}>
          <StatusBar />
        </div>
        
        {/* Minimap Panel - Placeholder for now */}
        <div className={`${styles.uiPanel} ${styles.minimapPanel}`}>
          <h3>Map</h3>
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#666',
          }}>
            {state.currentMap.name || 'Unknown Area'}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        <div className={styles.gameBoard}>
          {/* Conditionally render Battle or GameBoard based on battle state */}
          {state.battle ? <Battle /> : <GameBoard />}
          {/* Overlay components */}
          <DialogueBox />
          <Notification />
          <TimeDisplay />
        </div>
      </div>

      {/* Bottom Panel */}
      <div className={styles.bottomPanel}>
        <div className={`${styles.uiPanel} ${styles.hotbarPanel}`}>
          {/* Simple hotbar display */}
          <div className={styles.hotbarSlot}>
            <span className={styles.hotbarKey}>1</span>
            <span className={styles.hotbarIcon}>⚔️</span>
          </div>
          <div className={styles.hotbarSlot}>
            <span className={styles.hotbarKey}>2</span>
            <span className={styles.hotbarIcon}>🛡️</span>
          </div>
          <div className={styles.hotbarSlot}>
            <span className={styles.hotbarKey}>3</span>
            <span className={styles.hotbarIcon}>🧪</span>
          </div>
          <div className={`${styles.hotbarSlot} ${styles.inventory}`}>
            <span className={styles.hotbarKey}>I</span>
            <span className={styles.hotbarIcon}>🎒</span>
          </div>
          <div className={styles.hotbarSlot}>
            <span className={styles.hotbarKey}>M</span>
            <span className={styles.hotbarIcon}>🗺️</span>
          </div>
          <div className={styles.hotbarSlot}>
            <span className={styles.hotbarKey}>ESC</span>
            <span className={styles.hotbarIcon}>⚙️</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // Check URL parameters for test pages
  const urlParams = new URLSearchParams(window.location.search);
  const testPage = urlParams.get('test');

  // Render test pages if requested
  if (testPage === 'floor-tiles') {
    return (
      <div className={styles.gameContainer}>
        <FloorTileTest />
      </div>
    );
  }

  return (
    <div className={styles.gameContainer}>
      <GameProvider>
        <NotificationSystem>
          <GameContent />
        </NotificationSystem>
      </GameProvider>
    </div>
  );
};

export default App;