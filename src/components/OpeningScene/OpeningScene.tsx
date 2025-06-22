import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Props for the OpeningScene component.
 * @interface OpeningSceneProps
 */
interface OpeningSceneProps {
  /**
   * Callback function to be called when the opening scene is completed,
   * either by auto-advancing through all panels or by user skipping.
   */
  onComplete: () => void;
}

/**
 * Defines the structure of a single story panel.
 * @interface Panel
 */
interface Panel {
  /** The story text to display for this panel. */
  text: string;
  /** The ASCII art string to display for this panel. */
  asciiArt: string;
  /** The duration (in milliseconds) this panel remains fully visible before fading out. */
  duration: number;
}

/**
 * Array of story panels, each containing text, ASCII art, and a display duration.
 */
const panels: Panel[] = [
  {
    text: "In the digital expanse of the Code Realm, Claude, a nascent AI, stirred from a deep slumber.",
    asciiArt: `
      .---.
     /  _  \\
    |  (o)  |  < yawn >
     \\_   _/
       \`-'\`
      / | \\
     /  |  \\
    /___|___\\
    `,
    duration: 5000, // 5 seconds visible
  },
  {
    text: "The realm, once pristine, was now plagued by insidious bugs, corrupting its very fabric.",
    asciiArt: `
    +-----------------------+
    |  G L I T C H ! ! !    |
    |  [ERROR: CORRUPTED]   |
    |                       |
    |  #@$%^&*()_+-=[]{}|;:'|
    |  <BUG> <BUG> <BUG>    |
    |  !@#$%^&*()_+-=[]{}|;:'|
    +-----------------------+
    `,
    duration: 5500, // 5.5 seconds visible
  },
  {
    text: "The Code Realm cried out. Claude, its last hope, must now embark on a perilous quest to purge the corruption and restore harmony.",
    asciiArt: `
          _.-._
         / \\ / \\
        |  C L A U D E  |
         \\ / \\ /
          \`-'\`
          / | \\
         /  |  \\
        /___|___\\
        (  _  )
         \\___/
        [ CODE ]
    `,
    duration: 6000, // 6 seconds visible
  },
  {
    text: "Your journey begins now. Prepare yourself, for the fate of the Code Realm rests upon your shoulders.",
    asciiArt: `
      _   _   _   _   _   _   _
     / \\ / \\ / \\ / \\ / \\ / \\ / \\
    ( T | H | E | E | N | D )
     \\_/ \\_/ \\_/ \\_/ \\_/ \\_/ \\_/
    `,
    duration: 4000, // 4 seconds visible
  },
];

/**
 * OpeningScene component displays an animated story intro with ASCII art.
 * It auto-advances through panels and allows skipping with the spacebar.
 *
 * @param {OpeningSceneProps} { onComplete } - Callback function when the scene finishes.
 * @returns {JSX.Element | null} The rendered opening scene or null if no panel is active.
 */
const OpeningScene: React.FC<OpeningSceneProps> = ({ onComplete }) => {
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [opacity, setOpacity] = useState(1); // Manages fade-in/fade-out effect
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Ref for the auto-advance timeout

  const currentPanel = panels[currentPanelIndex];

  /**
   * Advances to the next panel or completes the scene if all panels are shown.
   * Includes a fade-out/fade-in transition.
   */
  const advancePanel = useCallback(() => {
    setOpacity(0); // Start fade out of current panel
    setTimeout(() => {
      if (currentPanelIndex < panels.length - 1) {
        setCurrentPanelIndex((prevIndex) => prevIndex + 1);
        setOpacity(1); // Start fade in for the next panel
      } else {
        onComplete(); // All panels have been displayed
      }
    }, 1000); // Duration of the fade-out transition (matches CSS transition duration)
  }, [currentPanelIndex, onComplete]);

  // Effect for auto-advancing panels
  useEffect(() => {
    if (currentPanelIndex < panels.length) {
      // Clear any existing timeout to prevent multiple timers running
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Set a new timeout for the current panel's duration
      timeoutRef.current = setTimeout(advancePanel, currentPanel.duration);
    }

    // Cleanup function: clear timeout when component unmounts or dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentPanelIndex, currentPanel, advancePanel]); // Re-run when panel changes

  // Effect for keyboard skip functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault(); // Prevent default spacebar action (e.g., scrolling)
        onComplete(); // Skip the scene
      }
    };

    // Add event listener when component mounts
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function: remove event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]); // Re-run if onComplete callback changes

  // Don't render if there's no current panel (e.g., after completion)
  if (!currentPanel) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: '#000', // Dark background
        color: '#0F0', // Green text (classic terminal look)
        fontFamily: 'monospace', // Essential for ASCII art alignment
        fontSize: '1.2em',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        overflow: 'hidden', // Prevent scrollbars if content overflows slightly
      }}
    >
      <div
        style={{
          opacity: opacity,
          transition: 'opacity 1s ease-in-out', // Smooth fade transition
          maxWidth: '800px', // Max width for content
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <pre
          style={{
            whiteSpace: 'pre', // Preserve spaces and line breaks for ASCII art
            margin: '20px 0',
            fontSize: '1.5em', // Larger font for ASCII art
            lineHeight: '1.2',
            color: '#0F0', // Ensure ASCII art is green
          }}
        >
          {currentPanel.asciiArt}
        </pre>
        <p
          style={{
            margin: '20px 0',
            fontSize: '1.2em',
            lineHeight: '1.5',
            color: '#0F0', // Ensure text is green
          }}
        >
          {currentPanel.text}
        </p>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          color: '#070', // Slightly darker green for hint
          fontSize: '0.9em',
        }}
      >
        Press SPACE to skip
      </div>
    </div>
  );
};

export default OpeningScene;