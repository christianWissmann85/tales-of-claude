import React, { useEffect } from 'react';
import { GameProvider, useGameContext } from './context/GameContext';
import StatusBar from './components/StatusBar/StatusBar'; // This component will need internal updates to fully leverage UIFramework styles
import GameBoard from './components/GameBoard/GameBoard';
import DialogueBox from './components/DialogueBox/DialogueBox';
import Battle from './components/Battle/Battle';
import Notification from './components/Notification/Notification';
import SplashScreen from './components/SplashScreen/SplashScreen';
import OpeningScene from './components/OpeningScene/OpeningScene';
import { NotificationSystem } from './components/NotificationSystem/NotificationSystem';
import TimeDisplay from './components/TimeDisplay/TimeDisplay'; // This component likely uses absolute positioning internally
import FloorTileTest from './components/TestPages/FloorTileTest';

// Import the new UIFramework styles
import styles from './styles/UIFramework.module.css'; // Assuming the CSS is in src/styles/UIFramework.module.css

// Separate component to access game context
const GameContent: React.FC = () => {
  const { state, dispatch } = useGameContext();

  // Handle splash screen completion
  const handleSplashComplete = () => {
    dispatch({ type: 'SET_GAME_PHASE', payload: { phase: 'intro' } });
  };

  // Handle opening scene completion
  const handleIntroComplete = () => {
    dispatch({ type: 'SET_GAME_PHASE', payload: { phase: 'playing' } });
  };

  // Inventory key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'i' || event.key === 'I') {
        event.preventDefault(); // Prevent default browser behavior (e.g., search)
        // Dispatch an action to toggle inventory state.
        // This assumes your GameContext has an 'isInventoryOpen' state and 'TOGGLE_INVENTORY' action.
        // You would implement the actual inventory UI component and its visibility based on this state.
        dispatch({ type: 'TOGGLE_INVENTORY' });
        console.log("Inventory toggled!"); // For debugging
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch]); // `dispatch` is stable, but including it is good practice for `useEffect` dependencies.

  // Render different screens based on game phase
  if (state.gamePhase === 'splash') {
    return <SplashScreen onStart={handleSplashComplete} />;
  }

  if (state.gamePhase === 'intro') {
    return <OpeningScene onComplete={handleIntroComplete} />;
  }

  // Render the main game UI using the new framework styles
  return (
    // GameContent is rendered inside App's gameContainer, so it doesn't need gameContainer itself.
    // It renders the gameBoard and the uiPanelSystem, which are the two main grid rows defined by the CSS.
    <>
      <div className={styles.gameBoard}>
        {/* Conditionally render Battle or GameBoard based on battle state */}
        {state.battle ? <Battle /> : <GameBoard />}
        {/* DialogueBox, Notification, TimeDisplay are overlays that sit on top of the game board.
            They should be positioned absolutely within the gameBoard which has position: relative. */}
        <DialogueBox />
        <Notification />
        <TimeDisplay />
      </div>

      <div className={styles.uiPanelSystem}>
        {/* Status Panel (Player and Party) */}
        <div className={`${styles.uiPanel} ${styles.statusPanel}`}>
          <h3>Status</h3>
          {/* The StatusBar component is placed within playerStatus.
              It's assumed StatusBar internally renders the HP/MP/XP bars
              and might need to be updated to fully leverage .statusBars, .statusBar, etc. */}
          <div className={styles.playerStatus}>
            <h4>Claude <span style={{ color: 'var(--warning-yellow)' }}>Lv. {state.player.level}</span></h4>
            <StatusBar /> {/* Assuming StatusBar renders the actual bars */}
          </div>
          <div className={styles.partyStatus}>
            <h4>Party Members</h4>
            {/* Placeholder for actual party members' status */}
            <p>Elara (Lv. 14) - HP: 70%</p>
            <p>Kael (Lv. 13) - HP: 90%</p>
          </div>
        </div>

        {/* Minimap Panel */}
        <div className={`${styles.uiPanel} ${styles.minimapPanel}`}>
          {/* Minimap content would go here */}
        </div>

        {/* Hotbar / Controls Panel */}
        <div className={`${styles.uiPanel} ${styles.hotbarPanel}`}>
          {/* Example hotbar slots as per UIFramework.module.css conceptual HTML */}
          <div className={styles.hotbarSlot}>
            <span className={styles.hotbarKey}>1</span>
            <span className={styles.hotbarIcon}>⚔️</span>
          </div>
          <div className={styles.hotbarSlot}>
            <span className={styles.hotbarKey}>2</span>
            <span className={styles.hotbarIcon}>✨</span>
          </div>
          <div className={styles.hotbarSlot}>
            <span className={styles.hotbarKey}>3</span>
            <span className={styles.hotbarIcon}>🧪</span>
          </div>
          <div className={styles.hotbarSlot}>
            <span className={styles.hotbarKey}>4</span>
            <span className={styles.hotbarIcon}>🛡️</span>
          </div>
          {/* Inventory Hotbar Slot - 'I' key handler is implemented above */}
          <div className={`${styles.hotbarSlot} ${styles.inventory}`}>
            <span className={styles.hotbarKey}>I</span>
            <span className={styles.hotbarIcon}>🎒</span>
          </div>
          <div className={styles.hotbarSlot}>
            <span className={styles.hotbarKey}>M</span>
            <span className={styles.hotbarIcon}>🗺️</span>
          </div>
          <div className={styles.hotbarSlot}>
            <span className={styles.hotbarKey}>Q</span>
            <span className={styles.hotbarIcon}>📜</span>
          </div>
          <div className={styles.hotbarSlot}>
            <span className={styles.hotbarKey}>ESC</span>
            <span className={styles.hotbarIcon}>⚙️</span>
          </div>
        </div>
      </div>
    </>
  );
};

const App: React.FC = () => {
  // Check URL parameters for test pages
  const urlParams = new URLSearchParams(window.location.search);
  const testPage = urlParams.get('test');

  // Render test pages if requested
  if (testPage === 'floor-tiles') {
    return (
      <div className={styles.gameContainer}> {/* Apply the new container style for test pages too */}
        <FloorTileTest />
      </div>
    );
  }

  return (
    <div className={styles.gameContainer}> {/* Apply the main game container style */}
      <GameProvider>
        <NotificationSystem>
          <GameContent />
        </NotificationSystem>
      </GameProvider>
    </div>
  );
};

export default App;
