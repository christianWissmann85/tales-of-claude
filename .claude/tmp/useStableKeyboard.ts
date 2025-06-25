
// src/hooks/useStableKeyboard.ts
import React, { useEffect, useCallback, useRef, useContext, createContext } from 'react';
import { debounce } from '../utils/inputStabilizer'; // Import the debounce utility

// --- Placeholder for Critical Section Context ---
// In a real application, this context would be defined in its own file (e.g., src/contexts/CriticalSectionContext.ts)
// and provided higher up in your component tree (e.g., in App.tsx).

interface CriticalSectionContextType {
  isCriticalSectionActive: boolean;
  // In a full implementation, you'd also have `enterCriticalSection` and `exitCriticalSection` functions here.
}

// Mock context for demonstration purposes.
// For a real implementation, you'd use a `useState` and `useMemo` within a `CriticalSectionProvider`.
const CriticalSectionContext = createContext<CriticalSectionContextType>({
  isCriticalSectionActive: false, // Default to not active
});

// Example of how a provider might look (not included in this file for brevity, but for context):
/*
import React, { createContext, useState, useMemo, ReactNode } from 'react';
export const CriticalSectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isCriticalSectionActive, setIsCriticalSectionActive] = useState(false);
  const value = useMemo(() => ({
    isCriticalSectionActive,
    enterCriticalSection: () => setIsCriticalSectionActive(true),
    exitCriticalSection: () => setIsCriticalSectionActive(false),
  }), [isCriticalSectionActive]);
  return <CriticalSectionContext.Provider value={value}>{children}</CriticalSectionContext.Provider>;
};
export const useCriticalSection = () => useContext(CriticalSectionContext);
*/
// --- End Placeholder ---

interface UseStableKeyboardOptions {
  /**
   * The delay in milliseconds to debounce key presses.
   * Defaults to 100ms.
   */
  debounceDelay?: number;
  /**
   * An optional array of key codes or key names to specifically listen for.
   * If not provided, all keydown events are processed.
   */
  keysToListen?: (string | number)[];
}

type KeyboardEventHandler = (event: KeyboardEvent) => void;

/**
 * A React hook for stable keyboard event handling.
 * It debounces key events to prevent spam and race conditions,
 * and integrates with a critical section manager to block input
 * during sensitive UI operations (e.g., transitions, data loading).
 *
 * @param onKeyPress - The callback function to execute on a stable key press.
 *                     This function receives the KeyboardEvent object.
 * @param options - Configuration options for the hook:
 *                  - `debounceDelay`: The delay in milliseconds to debounce key presses (default: 100ms).
 *                  - `keysToListen`: An optional array of specific keys (e.g., 'Enter', 'Escape', 13)
 *                                    to listen for. If provided, only these keys will trigger the handler.
 */
export const useStableKeyboard = (
  onKeyPress: KeyboardEventHandler,
  options?: UseStableKeyboardOptions
) => {
  const { debounceDelay = 100, keysToListen } = options || {};

  // Use useRef to store the latest onKeyPress callback.
  // This prevents the debouncedHandler from being re-created unnecessarily
  // if onKeyPress changes, while still ensuring the latest callback is used.
  const onKeyPressRef = useRef(onKeyPress);
  onKeyPressRef.current = onKeyPress;

  // Get critical section status from context.
  // In a real app, you'd use `const { isCriticalSectionActive } = useCriticalSection();`
  const { isCriticalSectionActive } = useContext(CriticalSectionContext);

  // Memoize the debounced event handler.
  // It will only be re-created if `debounceDelay` or `isCriticalSectionActive` changes.
  const debouncedHandler = useCallback(
    debounce((event: KeyboardEvent) => {
      // If specific keys are defined, check if the current key matches one of them.
      if (keysToListen && keysToListen.length > 0) {
        const isKeyMatched = keysToListen.some(key =>
          typeof key === 'string' ? event.key === key : event.keyCode === key
        );
        if (!isKeyMatched) {
          return; // If key is not in the list, do not process
        }
      }

      // Only process the event if not in a critical section
      if (!isCriticalSectionActive) {
        onKeyPressRef.current(event);
      } else {
        // Optionally log or provide feedback that input was blocked
        console.warn(`Keyboard input for key "${event.key}" blocked: Critical section active.`);
      }
    }, debounceDelay),
    [debounceDelay, isCriticalSectionActive, keysToListen] // Dependencies for useCallback
  );

  useEffect(() => {
    // Add the debounced event listener to the window.
    window.addEventListener('keydown', debouncedHandler);

    // Cleanup function: remove the event listener when the component unmounts
    // or when `debouncedHandler` changes (which happens if `debounceDelay` or
    // `isCriticalSectionActive` changes).
    return () => {
      window.removeEventListener('keydown', debouncedHandler);
    };
  }, [debouncedHandler]); // Dependency array for useEffect
};


---

### 2. `src/components/ErrorBoundary/ErrorBoundary.tsx`

This component will act as a safety net for your UI, catching rendering errors in its children and providing a graceful fallback.


// src/components/ErrorBoundary/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css'; // Import CSS module for styling

interface ErrorBoundaryProps {
  /**
   * The child components that the ErrorBoundary will protect.
   */
  children: ReactNode;
  /**
   * An optional custom fallback UI to render when an error occurs.
   * If not provided, a default fallback UI will be rendered.
   */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  /**
   * Indicates whether an error has been caught.
   */
  hasError: boolean;
  /**
   * The error object that was caught.
   */
  error: Error | null;
  /**
   * Information about the component stack where the error occurred.
   */
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch UI panel rendering errors,
 * provide a nice fallback UI, log errors for debugging,
 * and offer a reset button to recover without a full app crash.
 *
 * Usage:
 * <ErrorBoundary>
 *   <ProblematicComponent />
 * </ErrorBoundary>
 *
 * Or with a custom fallback:
 * <ErrorBoundary fallback={<div>Custom Error Message!</div>}>
 *   <ProblematicComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Static method to update state when an error is thrown by a descendant component.
   * This is called during the render phase, so side-effects (like logging) are not allowed here.
   * It returns an object to update the state.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null }; // errorInfo will be set in componentDidCatch
  }

  /**
   * This method is called after an error has been thrown in a descendant component.
   * It's suitable for logging error information to an error reporting service.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging purposes.
    // In a production environment, you would send this to an external error tracking service (e.g., Sentry, Bugsnag).
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo }); // Store errorInfo for display/debugging in the fallback UI
  }

  /**
   * Resets the error boundary state, allowing the child components to re-render.
   * This effectively "recovers" the UI without requiring a full page refresh.
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

