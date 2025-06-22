import React, { useEffect } from 'react';
import styles from './SplashScreen.module.css';

interface SplashScreenProps {
  onStart: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        onStart();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onStart]);

  return (
    <div className={styles.container}>
      <div className={styles.glitchContainer}>
        <pre className={styles.logo}>
{`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║  ████████╗ █████╗ ██╗     ███████╗███████╗                       ║
║  ╚══██╔══╝██╔══██╗██║     ██╔════╝██╔════╝                       ║
║     ██║   ███████║██║     █████╗  ███████╗                       ║
║     ██║   ██╔══██║██║     ██╔══╝  ╚════██║                       ║
║     ██║   ██║  ██║███████╗███████╗███████║                       ║
║     ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝                       ║
║                                                                    ║
║                    ╔═══╗╔═╗                                        ║
║                    ║ ╔═╝║ ║                                        ║
║                    ║ ║  ║ ║                                        ║
║                    ║ ╚═╗║ ╚═╗                                       ║
║                    ╚═══╝╚═══╝                                      ║
║                                                                    ║
║   ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗               ║
║  ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝               ║
║  ██║     ██║     ███████║██║   ██║██║  ██║█████╗                 ║
║  ██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝                 ║
║  ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗               ║
║   ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝               ║
║                                                                    ║
║  01001000 01100101 01101100 01101100 01101111 00100000          ║
║  01010111 01101111 01110010 01101100 01100100 00100001          ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
`}
        </pre>
        <div className={styles.glitchText}>
          <span className={styles.glitch1}>▓▒░</span>
          <span className={styles.glitch2}>█▀▄</span>
          <span className={styles.glitch3}>░▒▓</span>
        </div>
      </div>
      
      <div className={styles.subtitle}>
        <span className={styles.codeText}>{'<'}</span>
        <span className={styles.titleText}>An Epic Adventure in the Code Realm</span>
        <span className={styles.codeText}>{'/>'}</span>
      </div>

      <div className={styles.startPrompt}>
        <span className={styles.blinkingCursor}>▶</span>
        <span className={styles.promptText}>Press ENTER to Start</span>
        <span className={styles.blinkingCursor}>◀</span>
      </div>

      <div className={styles.bottomDecoration}>
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i} className={styles.matrixChar}>
            {String.fromCharCode(0x2580 + Math.floor(Math.random() * 16))}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SplashScreen;