// src/utils/inputStabilizer.ts

/**
 * @file inputStabilizer.ts
 * @description Provides utility functions for debouncing, throttling,
 *              managing critical sections for state transition guards,
 *              and queuing actions for sequential processing.
 */

/**
 * Debounces a function, ensuring it's only called after a specified delay
 * since the last invocation. Includes a `cancel` method to clear any pending calls.
 *
 * @template T The type of the function to debounce.
 * @param {T} func The function to debounce.
 * @param {number} delay The delay in milliseconds.
 * @returns {T & { cancel: () => void }} The debounced function with a `cancel` method.
 */
export const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): T & { cancel: () => void } => {
    let timeout: NodeJS.Timeout | null = null;

    const debounced = ((...args: Parameters<T>) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            func(...args);
            timeout = null; // Clear timeout after execution
        }, delay);
    }) as T & { cancel: () => void };

    debounced.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    return debounced;
};

/**
 * Throttles a function, ensuring it's called at most once within a specified time window.
 * Includes a `cancel` method to clear any pending calls.
 *
 * @template T The type of the function to throttle.
 * @param {T} func The function to throttle.
 * @param {number} delay The delay in milliseconds.
 * @returns {T & { cancel: () => void }} The throttled function with a `cancel` method.
 */
export const throttle = <T extends (...args: any[]) => any>(func: T, delay: number): T & { cancel: () => void } => {
    let timeout: NodeJS.Timeout | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastThis: ThisParameterType<T> | null = null;
    let lastResult: ReturnType<T> | undefined;

    const throttled = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        lastArgs = args;
        lastThis = this;

        if (!timeout) {
            timeout = setTimeout(() => {
                lastResult = func.apply(lastThis, lastArgs!);
                timeout = null;
                lastArgs = null;
                lastThis = null;
            }, delay);
        }
        return lastResult; // Return the result of the last successful call
    } as T & { cancel: () => void };

    throttled.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
            lastArgs = null;
            lastThis = null;
        }
    };

    return throttled;
};

/**
 * Manages critical sections to prevent concurrent operations that could lead to state conflicts.
 * Useful for UI transitions, complex interactions, or any operation that should not be interrupted or overlapped.
 */
class CriticalSectionManager {
    // Stores active critical sections with their associated timeout IDs.
    private lockedSections: Map<string, NodeJS.Timeout> = new Map();

    /**
     * Attempts to acquire a lock for a given critical section key.
     * If the section is already locked, it returns false. Otherwise, it locks the section
     * for the specified duration and returns true.
     *
     * @param {string} key A unique identifier for the critical section (e.g., 'ui_panel_transition').
     * @param {number} durationMs The duration in milliseconds for which the section will be locked.
     * @returns {boolean} True if the lock was acquired, false if it was already locked.
     */
    public lock(key: string, durationMs: number): boolean {
        if (this.lockedSections.has(key)) {
            return false; // Already locked
        }
        const timeoutId = setTimeout(() => {
            this.release(key); // Automatically release the lock after duration
        }, durationMs);
        this.lockedSections.set(key, timeoutId);
        // console.log(`[CriticalSection] Locked: ${key} for ${durationMs}ms`);
        return true;
    }

    /**
     * Checks if a specific critical section is currently locked.
     * @param {string} key The identifier of the critical section.
     * @returns {boolean} True if the section is locked, false otherwise.
     */
    public isLocked(key: string): boolean {
        return this.lockedSections.has(key);
    }

    /**
     * Manually releases a lock for a given critical section.
     * This is useful for cases where an operation completes earlier than its `durationMs`.
     * @param {string} key The identifier of the critical section to release.
     */
    public release(key: string): void {
        const timeoutId = this.lockedSections.get(key);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.lockedSections.delete(key);
            // console.log(`[CriticalSection] Released: ${key}`);
        }
    }
}

/**
 * Singleton instance of CriticalSectionManager for global access.
 */
export const criticalSectionManager = new CriticalSectionManager();

/**
 * Defines the structure for an action to be queued.
 */
type QueuedAction = {
    action: () => Promise<void> | void; // The function to execute. Can be async.
    id?: string; // Optional ID for tracking/deduplication of actions.
};

/**
 * Manages a queue of actions, ensuring they are processed sequentially.
 * This prevents "multiple dispatch calls queuing up" and ensures order of operations.
 */
class ActionQueueManager {
    private queue: QueuedAction[] = [];
    private isProcessing = false; // Flag to prevent concurrent processing

    /**
     * Enqueues an action to be processed. If an ID is provided, it prevents
     * adding duplicate actions with the same ID if one is already in the queue.
     *
     * @param {() => Promise<void> | void} action The function to enqueue.
     * @param {string} [id] An optional unique ID for the action.
     */
    public enqueue(action: () => Promise<void> | void, id?: string): void {
        if (id && this.queue.some(item => item.id === id)) {
            // console.warn(`Action with ID '${id}' already in queue. Skipping.`);
            return; // Prevent duplicate actions with the same ID
        }
        this.queue.push({ action, id });
        this.processQueue(); // Attempt to process the queue immediately
    }

    /**
     * Processes actions from the queue one by one