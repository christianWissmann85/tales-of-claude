// src/hooks/useStableKeyboard.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { Direction } from '@/types/global.types';
import { debounce, criticalSectionManager } from '@/utils/inputStabilizer';

// Define key groups (same as useKeyboard.ts)
const UP_KEYS = ['ArrowUp', 'KeyW'];
const DOWN_KEYS = ['ArrowDown', 'KeyS'];
const LEFT_KEYS = ['ArrowLeft', 'KeyA'];
const RIGHT_KEYS = ['ArrowRight', 'KeyD'];
const INTERACT_KEYS = ['Space', 'Enter'];
const CANCEL_KEYS = ['Escape', 'KeyX'];
const MENU_KEYS = ['KeyM', 'Tab'];
const CHARACTER_KEYS = ['KeyC'];
const INVENTORY_KEYS = ['KeyI'];
const QUEST_KEYS = ['KeyQ', 'KeyJ'];
const FACTION_KEYS = ['KeyF'];

/**
 * Enhanced keyboard hook with stability improvements
 * - Prevents key event spam through debouncing
 * - Manages critical sections during UI transitions
 * - Prevents race conditions from rapid key presses
 * - Proper cleanup on unmount
 */
export const useStableKeyboard = () => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const keyEventQueue = useRef<string[]>([]);
  const isProcessingQueue = useRef(false);
  
  // Track last key press times for additional rate limiting
  const lastKeyPressTime = useRef<Map<string, number>>(new Map());
  const KEY_REPEAT_DELAY = 50; // Minimum ms between same key repeats

  // Process the key event queue
  const processKeyQueue = useCallback(() => {
    if (isProcessingQueue.current || keyEventQueue.current.length === 0) {
      return;
    }

    isProcessingQueue.current = true;
    
    while (keyEventQueue.current.length > 0) {
      const eventData = keyEventQueue.current.shift();
      if (!eventData) continue;
      
      const [eventType, keyCode] = eventData.split(':');
      
      if (eventType === 'down') {
        setPressedKeys(prev => {
          const newKeys = new Set(prev);
          newKeys.add(keyCode);
          return newKeys;
        });
      } else if (eventType === 'up') {
        setPressedKeys(prev => {
          const newKeys = new Set(prev);
          newKeys.delete(keyCode);
          return newKeys;
        });
      }
    }
    
    isProcessingQueue.current = false;
  }, []);

  // Debounced queue processor
  const debouncedProcessQueue = useRef(
    debounce(processKeyQueue, 10)
  ).current;

  // Handle keydown with stability checks
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const now = Date.now();
    const lastPress = lastKeyPressTime.current.get(event.code) || 0;
    
    // Rate limit same key repeats
    if (now - lastPress < KEY_REPEAT_DELAY) {
      return;
    }
    
    // Check if we're in a critical section (UI transition)
    if (criticalSectionManager.isLocked('ui_transition')) {
      event.preventDefault();
      return;
    }
    
    // Prevent default for game keys
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
    
    // Add to queue and process
    lastKeyPressTime.current.set(event.code, now);
    keyEventQueue.current.push(`down:${event.code}`);
    debouncedProcessQueue();
  }, [debouncedProcessQueue]);

  // Handle keyup
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    keyEventQueue.current.push(`up:${event.code}`);
    debouncedProcessQueue();
  }, [debouncedProcessQueue]);

  // Add event listeners with proper cleanup
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      // Cancel any pending debounced calls
      debouncedProcessQueue.cancel();
      
      // Clear the queue
      keyEventQueue.current = [];
      
      // Clear pressed keys
      setPressedKeys(new Set());
    };
  }, [handleKeyDown, handleKeyUp, debouncedProcessQueue]);

  // Helper function to check if any key from a list is pressed
  const isAnyOfKeysPressed = useCallback((keys: string[]) => {
    return keys.some(key => pressedKeys.has(key));
  }, [pressedKeys]);

  // Derived states (same as useKeyboard)
  const isMoving =
    isAnyOfKeysPressed(UP_KEYS) ||
    isAnyOfKeysPressed(DOWN_KEYS) ||
    isAnyOfKeysPressed(LEFT_KEYS) ||
    isAnyOfKeysPressed(RIGHT_KEYS);

  const isInteracting = isAnyOfKeysPressed(INTERACT_KEYS);
  const isCancelling = isAnyOfKeysPressed(CANCEL_KEYS);
  const isMenuOpen = isAnyOfKeysPressed(MENU_KEYS);
  const isCharacterOpen = isAnyOfKeysPressed(CHARACTER_KEYS);
  const isInventoryOpen = isAnyOfKeysPressed(INVENTORY_KEYS);
  const isQuestOpen = isAnyOfKeysPressed(QUEST_KEYS);
  const isFactionOpen = isAnyOfKeysPressed(FACTION_KEYS);

  // Get direction with stability checks
  const getDirection = useCallback((): Direction | null => {
    // Don't return direction during UI transitions
    if (criticalSectionManager.isLocked('ui_transition')) {
      return null;
    }
    
    const upActive = isAnyOfKeysPressed(UP_KEYS);
    const downActive = isAnyOfKeysPressed(DOWN_KEYS);
    const leftActive = isAnyOfKeysPressed(LEFT_KEYS);
    const rightActive = isAnyOfKeysPressed(RIGHT_KEYS);

    // Check for single, unambiguous direction
    if (upActive && !downActive && !leftActive && !rightActive) return 'up';
    if (downActive && !upActive && !leftActive && !rightActive) return 'down';
    if (leftActive && !rightActive && !upActive && !downActive) return 'left';
    if (rightActive && !leftActive && !upActive && !downActive) return 'right';

    return null;
  }, [isAnyOfKeysPressed]);

  return {
    pressedKeys,
    isMoving,
    isInteracting,
    isCancelling,
    isMenuOpen,
    isCharacterOpen,
    isInventoryOpen,
    isQuestOpen,
    isFactionOpen,
    getDirection,
  };
};