// src/engine/TimeSystem.ts

/**
 * Represents the different periods of the day in the game.
 */
type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

/**
 * Interface for the data structure used to serialize/deserialize the TimeSystem state.
 */
interface TimeData {
  hours: number;
  minutes: number;
  isPaused: boolean;
  // total real milliseconds elapsed since the last game minute tick,
  // used to maintain precise time progression across frames/pauses.
  gameTimeElapsedMs: number;
}

/**
 * A simple custom event emitter for the TimeSystem.
 */
class EventEmitter {
  private listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  on(eventName: string, listener: (...args: unknown[]) => void): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);
  }

  off(eventName: string, listener: (...args: unknown[]) => void): void {
    if (!this.listeners.has(eventName)) {
      return;
    }
    const currentListeners = this.listeners.get(eventName)!;
    this.listeners.set(eventName, currentListeners.filter(l => l !== listener));
  }

  emit(eventName: string, ...args: unknown[]): void {
    if (!this.listeners.has(eventName)) {
      return;
    }
    this.listeners.get(eventName)!.forEach(listener => listener(...args));
  }
}

/**
 * Manages the in-game time, day/night cycles, and emits time-related events.
 */
export class TimeSystem {
  private _hours: number; // 0-23
  private _minutes: number; // 0-59
  private _currentPeriod: TimeOfDay;
  private _isPaused: boolean;

  private _lastUpdateTime: DOMHighResTimeStamp = 0;
  private _gameTimeElapsedMs: number = 0; // Accumulates real milliseconds for game minute progression
  private _animationFrameId: number | null = null;

  private _eventEmitter: EventEmitter;

  // Constants for time conversion: 1 real minute = 1 game hour
  // This means 1 real second = 1 game minute
  private readonly MS_PER_GAME_MINUTE: number = 1000; // 1 real second
  private readonly MS_PER_GAME_HOUR: number = this.MS_PER_GAME_MINUTE * 60;
  private readonly MS_PER_GAME_DAY: number = this.MS_PER_GAME_HOUR * 24;

  constructor() {
    this._hours = 6; // Start at Dawn (6:00 AM)
    this._minutes = 0;
    this._isPaused = false;
    this._eventEmitter = new EventEmitter();
    this._currentPeriod = 'dawn'; // Initialize with default value

    this._updatePeriod(); // Update to correct period based on time
    this._startLoop();
  }

  /**
   * Starts the internal animation frame loop for time progression.
   */
  private _startLoop(): void {
    if (this._animationFrameId === null) {
      this._lastUpdateTime = performance.now(); // Initialize timestamp on start
      this._animationFrameId = requestAnimationFrame(this._gameLoop);
    }
  }

  /**
   * The main time progression loop, called by requestAnimationFrame.
   * @param timestamp The DOMHighResTimeStamp provided by requestAnimationFrame.
   */
  private _gameLoop = (timestamp: DOMHighResTimeStamp): void => {
    if (this._isPaused) {
      this._animationFrameId = requestAnimationFrame(this._gameLoop); // Keep requesting frames even if paused
      this._lastUpdateTime = timestamp; // Update last timestamp to prevent large delta on resume
      return;
    }

    if (this._lastUpdateTime === 0) {
      this._lastUpdateTime = timestamp;
      this._animationFrameId = requestAnimationFrame(this._gameLoop);
      return;
    }

    const deltaTime = timestamp - this._lastUpdateTime;
    this._lastUpdateTime = timestamp;

    this._gameTimeElapsedMs += deltaTime;

    // Calculate how many game minutes have passed
    const gameMinutesToAdd = Math.floor(this._gameTimeElapsedMs / this.MS_PER_GAME_MINUTE);

    if (gameMinutesToAdd > 0) {
      this._gameTimeElapsedMs %= this.MS_PER_GAME_MINUTE; // Keep the remainder for the next frame
      this._addMinutes(gameMinutesToAdd);
    }

    this._animationFrameId = requestAnimationFrame(this._gameLoop);
  };

  /**
   * Adds a specified number of game minutes to the current time.
   * Handles hour and day rollovers and emits events.
   * @param minutes The number of game minutes to add.
   */
  private _addMinutes(minutes: number): void {
    const oldPeriod = this._currentPeriod;
    const oldHours = this._hours;
    const oldMinutes = this._minutes;

    this._minutes += minutes;

    // Handle minute rollover to hours
    this._hours += Math.floor(this._minutes / 60);
    this._minutes %= 60;

    // Handle hour rollover to days (24-hour cycle)
    this._hours %= 24;

    // Only emit if time actually changed
    if (this._hours !== oldHours || this._minutes !== oldMinutes) {
      this._eventEmitter.emit('timeChanged', this.currentTime, this.timeString);
    }

    this._updatePeriod();
    if (this._currentPeriod !== oldPeriod) {
      this._eventEmitter.emit('periodChanged', this._currentPeriod);
    }
  }

  /**
   * Determines and updates the current time period (Dawn, Day, Dusk, Night) based on the current hour.
   */
  private _updatePeriod(): void {
    if (this._hours >= 6 && this._hours < 8) {
      this._currentPeriod = 'dawn';
    } else if (this._hours >= 8 && this._hours < 18) {
      this._currentPeriod = 'day';
    } else if (this._hours >= 18 && this._hours < 20) {
      this._currentPeriod = 'dusk';
    } else {
      this._currentPeriod = 'night';
    }
  }

  /**
   * Registers an event listener for time system events.
   * @param eventName The name of the event ('timeChanged' or 'periodChanged').
   * @param listener The function to call when the event is emitted.
   */
  public on(eventName: 'timeChanged' | 'periodChanged', listener: (...args: unknown[]) => void): void {
    this._eventEmitter.on(eventName, listener);
  }

  /**
   * Removes an event listener.
   * @param eventName The name of the event.
   * @param listener The function to remove.
   */
  public off(eventName: 'timeChanged' | 'periodChanged', listener: (...args: unknown[]) => void): void {
    this._eventEmitter.off(eventName, listener);
  }

  /**
   * Pauses the progression of time.
   */
  public pause(): void {
    this._isPaused = true;
  }

  /**
   * Resumes the progression of time.
   */
  public resume(): void {
    if (this._isPaused) {
      this._isPaused = false;
      this._lastUpdateTime = performance.now(); // Reset last update time to prevent a large jump
    }
  }

  /**
   * Sets the current game time to a specific hour and minute.
   * Useful for testing or specific game events.
   * @param hours The hour to set (0-23).
   * @param minutes The minute to set (0-59).
   * @throws Error if hours or minutes are out of valid range.
   */
  public setTime(hours: number, minutes: number): void {
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error('Invalid time: hours must be 0-23, minutes 0-59.');
    }

    const oldPeriod = this._currentPeriod;
    const oldHours = this._hours;
    const oldMinutes = this._minutes;

    this._hours = hours;
    this._minutes = minutes;
    this._gameTimeElapsedMs = 0; // Reset accumulated milliseconds

    if (this._hours !== oldHours || this._minutes !== oldMinutes) {
      this._eventEmitter.emit('timeChanged', this.currentTime, this.timeString);
    }

    this._updatePeriod();
    if (this._currentPeriod !== oldPeriod) {
      this._eventEmitter.emit('periodChanged', this._currentPeriod);
    }
  }

  /**
   * Adds a specified number of game minutes to the current time.
   * This is a public method for external manipulation (e.g., fast-forward).
   * @param minutes The number of game minutes to add.
   */
  public addGameMinutes(minutes: number): void {
    if (minutes < 0) {
      console.warn('Adding negative minutes is not supported. Use setTime for specific time changes.');
      return;
    }
    this._addMinutes(minutes);
  }

  /**
   * Serializes the current state of the TimeSystem for saving.
   * @returns An object containing the current time system data.
   */
  public serialize(): TimeData {
    return {
      hours: this._hours,
      minutes: this._minutes,
      isPaused: this._isPaused,
      gameTimeElapsedMs: this._gameTimeElapsedMs,
    };
  }

  /**
   * Deserializes and loads the state of the TimeSystem from saved data.
   * @param data The TimeData object to load.
   */
  public deserialize(data: TimeData): void {
    this.setTime(data.hours, data.minutes); // setTime handles period updates and events
    this._isPaused = data.isPaused;
    this._gameTimeElapsedMs = data.gameTimeElapsedMs;
    this._lastUpdateTime = performance.now(); // Re-initialize last update time on load
  }

  /**
   * Stops the time progression loop and cleans up resources.
   * Should be called when the game engine is shut down.
   */
  public stop(): void {
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
    this._lastUpdateTime = 0;
    this._gameTimeElapsedMs = 0;
    this._eventEmitter = new EventEmitter(); // Clear all listeners
  }

  /**
   * Gets the current game time as an object.
   */
  public get currentTime(): { hours: number; minutes: number } {
    return { hours: this._hours, minutes: this._minutes };
  }

  /**
   * Gets the current time period (Dawn, Day, Dusk, Night).
   */
  public get currentPeriod(): TimeOfDay {
    return this._currentPeriod;
  }

  /**
   * Gets the current game time formatted as HH:MM.
   */
  public get timeString(): string {
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(this._hours)}:${pad(this._minutes)}`;
  }

  /**
   * Checks if the time system is currently paused.
   */
  public get isPaused(): boolean {
    return this._isPaused;
  }
}