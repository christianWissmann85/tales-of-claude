import React from 'react';
import { GameProvider, useGameContext } from './context/GameContext';
import StatusBar from './components/StatusBar/StatusBar';
import GameBoard from './components/GameBoard/GameBoard';
import DialogueBox from './components/DialogueBox/DialogueBox'; // Import DialogueBox
import Battle from './components/Battle/Battle'; // Import Battle
import Notification from './components/Notification/Notification'; // Import Notification

// Separate component to access game context
const GameContent: React.FC = () => {
  const { state } = useGameContext();
  
  const gameFrameStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    border: '2px solid #61dafb', // A distinct border for the game frame
    borderRadius: '10px',
    boxShadow: '0 0 25px rgba(97, 218, 251, 0.6)', // Glowing effect
    backgroundColor: '#1a1a1a', // Slightly darker background for the game frame itself
    padding: '15px',
    gap: '15px', // Space between StatusBar and GameBoard
    maxWidth: 'fit-content', // Adjust width to content
    margin: 'auto', // Center the game frame horizontally on the page
  };

  return (
    <div style={gameFrameStyle}>
      <StatusBar />
      {/* Conditionally render Battle or GameBoard based on battle state */}
      {state.battle ? <Battle /> : <GameBoard />}
      {/* DialogueBox component will automatically show/hide based on game state */}
      <DialogueBox />
      {/* Notification component for game messages */}
      <Notification />
    </div>
  );
};

const App: React.FC = () => {
  const gameScreenContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', // Center children horizontally
    justifyContent: 'flex-start', // Align children to the top
    minHeight: '100vh', // Take full viewport height
    backgroundColor: '#282c34', // Dark background for the entire page
    color: 'white',
    fontFamily: 'monospace',
    padding: '20px',
    boxSizing: 'border-box',
  };

  return (
    <div style={gameScreenContainerStyle}>
      <GameProvider>
        <GameContent />
      </GameProvider>
    </div>
  );
};

export default App;