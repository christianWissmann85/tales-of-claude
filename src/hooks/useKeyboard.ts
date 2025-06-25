// src/hooks/useKeyboard.ts
import { useEffect, useState, useCallback } from 'react';
import { Direction } from '@/types/global.types';

// Define key groups for easier management and readability
const UP_KEYS = ['ArrowUp', 'KeyW'];
const DOWN_KEYS = ['ArrowDown', 'KeyS'];
const LEFT_KEYS = ['ArrowLeft', 'KeyA'];
const RIGHT_KEYS = ['ArrowRight', 'KeyD'];
const INTERACT_KEYS = ['Space', 'Enter'];
const CANCEL_KEYS = ['Escape', 'KeyX'];
const MENU_KEYS = ['KeyM', 'Tab'];
const CHARACTER_KEYS = ['KeyC'];
const INVENTORY_KEYS = ['KeyI'];
const QUEST_KEYS = ['KeyQ'];
const FACTION_KEYS = ['KeyF'];

/**
 * A custom React hook for handling keyboard input in a game context.
 * It tracks currently pressed keys and provides derived states for common game actions.
 *
 * @returns An object containing:
 * - `pressedKeys`: A Set of all currently pressed keyboard event codes (e.g., 'KeyW', 'Space').
 * - `isMoving`: A boolean indicating if any directional movement key (arrows or WASD) is pressed.
 * - `isInteracting`: A boolean indicating if the interaction key (Space or Enter) is pressed.
 * - `isCancelling`: A boolean indicating if the cancel key (Escape or X) is pressed.
 * - `isMenuOpen`: A boolean indicating if the menu key (M or Tab) is pressed.
 * - `isCharacterOpen`: A boolean indicating if the character key (C) is pressed.
 * - `getDirection`: A function that returns the current unambiguous cardinal Direction ('up', 'down', 'left', 'right')
 *                   if only one is pressed, otherwise returns `null`.
 */
export const useKeyboard = () => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Memoized event handler for keydown events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Prevent default browser behavior for common game input keys (e.g., scrolling)
    if (
      UP_KEYS.includes(event.code) ||
      DOWN_KEYS.includes(event.code) ||
      LEFT_KEYS.includes(event.code) ||
      RIGHT_KEYS.includes(event.code) ||
      INTERACT_KEYS.includes(event.code) ||
      CANCEL_KEYS.includes(event.code) ||
      MENU_KEYS.includes(event.code) ||
      CHARACTER_KEYS.includes(event.code) ||
      INVENTORY_KEYS.includes(event.code) ||
      QUEST_KEYS.includes(event.code) ||
      FACTION_KEYS.includes(event.code)
    ) {
      event.preventDefault();
    }

    setPressedKeys((prevKeys) => {
      const newKeys = new Set(prevKeys);
      newKeys.add(event.code);
      return newKeys;
    });
  }, []);

  // Memoized event handler for keyup events
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    setPressedKeys((prevKeys) => {
      const newKeys = new Set(prevKeys);
      newKeys.delete(event.code);
      return newKeys;
    });
  }, []);

  // Effect to add and remove event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup function: remove event listeners when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]); // Dependencies ensure handlers are stable

  // Helper function to check if any key from a given list is currently pressed
  const isAnyOfKeysPressed = useCallback((keys: string[]) => {
    return keys.some(key => pressedKeys.has(key));
  }, [pressedKeys]); // Re-runs only if pressedKeys Set changes

  // Derived boolean states based on current pressed keys
  const isMoving =
    isAnyOfKeysPressed(UP_KEYS) ||
    isAnyOfKeysPressed(DOWN_KEYS) ||
    isAnyOfKeysPressed(LEFT_KEYS) ||
    isAnyOfKeysPressed(RIGHT_KEYS);

  const isInteracting = isAnyOfKeysPressed(INTERACT_KEYS);
  const isCancelling = isAnyOfKeysPressed(CANCEL_KEYS);
  const isMenuOpen = isAnyOfKeysPressed(MENU_KEYS);
  const isCharacterOpen = isAnyOfKeysPressed(CHARACTER_KEYS);

  /**
   * Determines the current unambiguous cardinal direction based on pressed keys.
   * Returns 'up', 'down', 'left', or 'right' if only one cardinal direction
   * (or its alias) is pressed. Returns `null` if no directional keys are pressed,
   * or if conflicting/diagonal directions are pressed (e.g., 'up' and 'down' simultaneously,
   * or 'up' and 'left' for diagonal movement which is not supported by `Direction` type).
   *
   * @returns {Direction | null} The current cardinal direction or null.
   */
  const getDirection = useCallback((): Direction | null => {
    const upActive = isAnyOfKeysPressed(UP_KEYS);
    const downActive = isAnyOfKeysPressed(DOWN_KEYS);
    const leftActive = isAnyOfKeysPressed(LEFT_KEYS);
    const rightActive = isAnyOfKeysPressed(RIGHT_KEYS);

    // Check for a single, unambiguous cardinal direction
    if (upActive && !downActive && !leftActive && !rightActive){ return 'up'; }
    if (downActive && !upActive && !leftActive && !rightActive){ return 'down'; }
    if (leftActive && !rightActive && !upActive && !downActive){ return 'left'; }
    if (rightActive && !leftActive && !upActive && !downActive){ return 'right'; }

    // If multiple or conflicting directional keys are pressed, return null
    return null;
  }, [isAnyOfKeysPressed]); // Re-runs only if isAnyOfKeysPressed (and thus pressedKeys) changes

  return {
    pressedKeys,
    isMoving,
    isInteracting,
    isCancelling,
    isMenuOpen,
    isCharacterOpen,
    getDirection, // Return the function itself
  };
};