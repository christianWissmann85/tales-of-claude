// src/components/DialogueBox/DialogueBox.tsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './DialogueBox.module.css';
import { useGameContext } from '../../context/GameContext'; // FIX 1: Corrected import path
import { DialogueState } from '../../types/global.types'; // Adjust path based on your project structure
import { useKeyboard } from '../../hooks/useKeyboard'; // Adjust path based on your project structure

const TYPE_SPEED = 30; // Milliseconds per character for typewriter effect

const DialogueBox: React.FC = () => {
    const { state, dispatch } = useGameContext();
    const dialogue = state.dialogue;

    // State for typewriter effect
    const [displayedText, setDisplayedText] = useState('');
    const [isTypingComplete, setIsTypingComplete] = useState(false);
    const typingIntervalRef = useRef<number | null>(null); // Ref to store interval ID

    // For single key press detection using useKeyboard hook
    const { pressedKeys, isInteracting } = useKeyboard();
    const prevPressedKeys = useRef(new Set<string>());
    const prevIsInteracting = useRef(false);

    // Effect for typewriter animation
    useEffect(() => {
        if (!dialogue) {
            // If dialogue ends, clear any ongoing typing interval
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
                typingIntervalRef.current = null;
            }
            return;
        }

        const currentLine = dialogue.text[dialogue.currentLineIndex];
        if (!currentLine) {
            // Handle case where currentLine might be undefined (e.g., empty text array)
            setDisplayedText('');
            setIsTypingComplete(true);
            return;
        }

        // Reset state for new line
        setDisplayedText('');
        setIsTypingComplete(false);

        let charIndex = 0;
        // Clear previous interval if any
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
        }

        // Start new typewriter interval
        typingIntervalRef.current = window.setInterval(() => {
            setDisplayedText((prev) => {
                if (charIndex < currentLine.length) {
                    return prev + currentLine.charAt(charIndex++);
                } else {
                    // Typing complete for this line
                    if (typingIntervalRef.current) {
                        clearInterval(typingIntervalRef.current);
                        typingIntervalRef.current = null;
                    }
                    setIsTypingComplete(true);
                    return prev; // Return current text to avoid extra render after completion
                }
            });
        }, TYPE_SPEED);

        // Cleanup function: clear interval when component unmounts or dialogue changes
        return () => {
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
        };
    }, [dialogue]); // Re-run this effect whenever the dialogue state object changes

    // Effect for keyboard input handling
    useEffect(() => {
        if (!dialogue) {
            // If no dialogue, update previous states and return
            prevIsInteracting.current = isInteracting;
            prevPressedKeys.current = new Set(pressedKeys);
            return;
        }

        const currentLine = dialogue.text[dialogue.currentLineIndex];

        // Handle Space/Enter (isInteracting) for advancing text or skipping typewriter
        // We check for the "rising edge" (key just pressed) to avoid continuous actions
        if (isInteracting && !prevIsInteracting.current) {
            if (!isTypingComplete) {
                // If typing is not complete, skip to full text
                setDisplayedText(currentLine);
                setIsTypingComplete(true);
                if (typingIntervalRef.current) {
                    clearInterval(typingIntervalRef.current);
                    typingIntervalRef.current = null;
                }
            } else if (!dialogue.options || dialogue.options.length === 0) {
                // If typing is complete AND no options are displayed, advance line or end dialogue
                if (dialogue.currentLineIndex < dialogue.text.length - 1) {
                    // Advance to the next line
                    dispatch({
                        type: 'START_DIALOGUE',
                        payload: {
                            dialogueState: {
                                ...dialogue,
                                currentLineIndex: dialogue.currentLineIndex + 1,
                            },
                        },
                    });
                } else {
                    // Last line, end dialogue
                    dispatch({ type: 'END_DIALOGUE' });
                }
            }
            // If options are present, Space/Enter does nothing (player must choose with numbers)
        }
        prevIsInteracting.current = isInteracting; // Update previous state for next render

        // Handle number keys for choices
        if (isTypingComplete && dialogue.options && dialogue.options.length > 0) {
            for (let i = 1; i <= dialogue.options.length; i++) {
                const key = `Digit${i}`; // e.g., 'Digit1', 'Digit2'
                // Check for rising edge of number key press
                if (pressedKeys.has(key) && !prevPressedKeys.current.has(key)) {
                    // If a valid option number is pressed
                    if (i - 1 < dialogue.options.length) {
                        // In a more complex system, the chosen option's 'action' would be dispatched.
                        // For this component, as per requirement, we simply end the dialogue.
                        // The game's main logic would then pick up the consequence of the choice.
                        dispatch({ type: 'END_DIALOGUE' });
                        // Example of dispatching choice action (requires new GameAction type):
                        // dispatch({ type: 'DIALOGUE_CHOICE_MADE', payload: { choiceAction: dialogue.options[i-1].action } });
                    }
                    break; // Only process one number key press at a time
                }
            }
        }

        prevPressedKeys.current = new Set(pressedKeys); // Update previous pressed keys for next render
    }, [isInteracting, pressedKeys, isTypingComplete, dialogue, dispatch]); // Dependencies for this effect

    // Don't render the component if no dialogue is active
    if (!dialogue) {
        return null;
    }

    // The length of the ASCII border string should be adjusted to fit the `width` defined in CSS.
    // For a 600px width with a monospace font, roughly 75 characters (including corners) works well.
    // FIX: Changed to a template literal and ensured it is correctly terminated.
    const borderString = `───────────────────────────────────────────────────────────────────────────`; // 75 dashes

    return (
        <div className={styles.dialogueBox}>
            <div className={styles.borderTop}>┌{borderString}┐</div>
            <div className={styles.contentWrapper}>
                <div className={styles.borderLeft}>│</div>
                <div className={styles.content}>
                    <div className={styles.speaker}>{dialogue.speaker}:</div>
                    <div className={styles.text}>{displayedText}</div>
                    {/* Display choices only when typing is complete and options exist */}
                    {isTypingComplete && dialogue.options && dialogue.options.length > 0 && (
                        <div className={styles.options}>
                            {/* FIX 2: Added types to map function parameters */}
                            {dialogue.options.map((option: { text: string }, index: number) => (
                                <div key={index} className={styles.option}>
                                    {index + 1}. {option.text}
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Display prompt to continue or choose */}
                    {isTypingComplete && (!dialogue.options || dialogue.options.length === 0) && (
                        <div className={styles.prompt}>[Press SPACE/ENTER to continue]</div>
                    )}
                    {isTypingComplete && dialogue.options && dialogue.options.length > 0 && (
                        <div className={styles.prompt}>[Press number for choice]</div>
                    )}
                </div>
                <div className={styles.borderRight}>│</div>
            </div>
            <div className={styles.borderBottom}>└{borderString}┘</div>
        </div>
    );
};

export default DialogueBox;
