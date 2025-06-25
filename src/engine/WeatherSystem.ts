// src/engine/WeatherSystem.ts

/**
 * Defines the possible weather types in the game.
 */
export type WeatherType = 'clear' | 'rain' | 'storm' | 'fog' | 'codeSnow';

/**
 * Interface for the data structure used to serialize/deserialize the WeatherSystem state.
 */
export interface WeatherData {
  currentWeather: WeatherType;
  transitionProgress: number; // 0-1 for smooth transitions
  previousWeather: WeatherType | null;
  timeUntilChange: number; // milliseconds remaining until the next weather change
}

/**
 * Interface for the effects applied by different weather types.
 */
export interface WeatherEffects {
  movementSpeedModifier: number; // e.g., 0.8 for 80% speed
  visibilityRadius: number;      // e.g., 3 units
  combatAccuracyModifier: number; // e.g., -0.10 for -10% accuracy
}

// --- EventEmitter (Copied from TimeSystem.ts for self-containment and consistency) ---
/**
 * A simple custom event emitter for the WeatherSystem.
 */
class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  /**
   * Registers an event listener for a specific event.
   * @param eventName The name of the event to listen for.
   * @param listener The function to call when the event is emitted.
   */
  on(eventName: string, listener: Function): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);
  }

  /**
   * Removes an event listener.
   * @param eventName The name of the event.
   * @param listener The function to remove.
   */
  off(eventName: string, listener: Function): void {
    if (!this.listeners.has(eventName)) {
      return;
    }
    const currentListeners = this.listeners.get(eventName)!;
    this.listeners.set(eventName, currentListeners.filter(l => l !== listener));
  }

  /**
   * Emits an event, calling all registered listeners for that event.
   * @param eventName The name of the event to emit.
   * @param args Arguments to pass to the listeners.
   */
  emit(eventName: string, ...args: any[]): void {
    if (!this.listeners.has(eventName)) {
      return;
    }
    // Create a copy of the listeners array to prevent issues if listeners are removed during iteration
    [...this.listeners.get(eventName)!].forEach(listener => listener(...args));
  }
}

// --- TimeSystem Dependency Interface ---
/**
 * Represents the different periods of the day.
 * (Copied from TimeSystem.ts for type compatibility without direct import)
 */
type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

/**
 * Minimal interface for the TimeSystem dependency,
 * allowing the WeatherSystem to interact with it without a direct circular import.
 */
interface ITimeSystem {
  currentPeriod: TimeOfDay;
  on(eventName: 'timeChanged' | 'periodChanged', listener: Function): void;
  off(eventName: 'timeChanged' | 'periodChanged', listener: Function): void;
}

/**
 * Manages the game's weather system, including types, transitions, and effects.
 * Integrates with the TimeSystem for dynamic weather patterns.
 */
export class WeatherSystem {
  // --- Constants ---
  private static readonly MIN_WEATHER_CHANGE_INTERVAL_MS = 300_000; // 5 minutes
  private static readonly MAX_WEATHER_CHANGE_INTERVAL_MS = 600_000; // 10 minutes
  private static readonly WEATHER_TRANSITION_DURATION_MS = 10_000; // 10 seconds for smooth fade

  /**
   * Defines the effects for each weather type.
   */
  private static readonly WEATHER_EFFECTS_MAP: Record<WeatherType, WeatherEffects> = {
    'clear': { movementSpeedModifier: 1.0, visibilityRadius: 3, combatAccuracyModifier: 0 },
    'rain': { movementSpeedModifier: 0.8, visibilityRadius: 2, combatAccuracyModifier: 0 },
    'storm': { movementSpeedModifier: 0.7, visibilityRadius: 2, combatAccuracyModifier: -0.10 }, // -10% accuracy
    'fog': { movementSpeedModifier: 0.9, visibilityRadius: 1, combatAccuracyModifier: -0.05 }, // -5% accuracy
    'codeSnow': { movementSpeedModifier: 1.0, visibilityRadius: 3, combatAccuracyModifier: 0 }, // Unique to Code Realm, no penalties
  };

  /**
   * List of weather types allowed on outdoor maps.
   */
  private static readonly OUTDOOR_WEATHER_TYPES: WeatherType[] = ['clear', 'rain', 'storm', 'fog', 'codeSnow'];

  /**
   * List of weather types allowed on indoor maps (e.g., dungeons).
   */
  private static readonly INDOOR_WEATHER_TYPES: WeatherType[] = ['clear', 'fog'];

  /**
   * Base probabilities for outdoor weather types. These will be adjusted by time of day.
   * Sum should ideally be 1.0.
   */
  private static readonly BASE_OUTDOOR_WEATHER_PROBABILITIES: Record<WeatherType, number> = {
    'clear': 0.4,
    'rain': 0.25,
    'storm': 0.15,
    'fog': 0.1,
    'codeSnow': 0.1,
  };

  // --- Private Members ---
  private _currentWeather: WeatherType;
  private _previousWeather: WeatherType | null;
  private _transitionProgress: number; // 0-1, indicates how far into the transition we are
  private _timeUntilNextChange: number; // milliseconds remaining until the next weather change
  private _weatherChangeTimer: ReturnType<typeof setTimeout> | null; // Timer for the next weather change
  private _transitionAnimationFrameId: number | null; // RequestAnimationFrame ID for transitions
  private _lastTransitionUpdateTime: DOMHighResTimeStamp; // Timestamp for calculating transition delta time

  private _eventEmitter: EventEmitter;
  private _timeSystem: ITimeSystem | null; // Dependency on TimeSystem for time-based events
  private _isOutdoorMap: boolean; // Flag indicating if the current map is outdoor or indoor

  /**
   * Creates an instance of WeatherSystem.
   * Initializes with default 'clear' weather and sets up internal state.
   */
  constructor() {
    this._currentWeather = 'clear';
    this._previousWeather = null;
    this._transitionProgress = 1; // Start with transition complete
    this._timeUntilNextChange = 0; // Will be set on start or deserialize
    this._weatherChangeTimer = null;
    this._transitionAnimationFrameId = null;
    this._lastTransitionUpdateTime = 0;

    this._eventEmitter = new EventEmitter();
    this._timeSystem = null;
    this._isOutdoorMap = true; // Default to outdoor map, should be set explicitly on game start
  }

  /**
   * Initializes and starts the weather system.
   * This method must be called once the TimeSystem is available and the initial map type is known.
   * @param timeSystem The TimeSystem instance to integrate with.
   * @param isOutdoorMap Initial map type (true for outdoor, false for indoor).
   */
  public start(timeSystem: ITimeSystem, isOutdoorMap: boolean): void {
    if (this._timeSystem) {
      console.warn('WeatherSystem already started. Calling stop() first for a clean restart.');
      this.stop(); // Ensure clean restart if already running
    }

    this._timeSystem = timeSystem;
    this._isOutdoorMap = isOutdoorMap;

    // Listen for time period changes to influence weather probabilities
    this._timeSystem.on('periodChanged', this._handlePeriodChange);

    // Ensure initial weather is valid for the map type
    if (!this._isValidWeatherForMap(this._currentWeather, this._isOutdoorMap)) {
      this._currentWeather = this._isOutdoorMap ? 'clear' : 'clear'; // Default to clear if invalid
      this._transitionProgress = 1; // No transition needed for initial state
      this._previousWeather = null;
    }

    this._scheduleNextWeatherChange();
    console.log(`WeatherSystem started. Initial weather: ${this._currentWeather}, Map Type: ${this._isOutdoorMap ? 'Outdoor' : 'Indoor'}`);
  }

  /**
   * Stops the weather progression and cleans up all associated resources.
   * This should be called when the game engine is shut down or the weather system is no longer needed.
   */
  public stop(): void {
    if (this._weatherChangeTimer) {
      clearTimeout(this._weatherChangeTimer);
      this._weatherChangeTimer = null;
    }
    if (this._transitionAnimationFrameId) {
      cancelAnimationFrame(this._transitionAnimationFrameId);
      this._transitionAnimationFrameId = null;
    }
    if (this._timeSystem) {
      this._timeSystem.off('periodChanged', this._handlePeriodChange);
      this._timeSystem = null;
    }
    this._eventEmitter = new EventEmitter(); // Clear all registered listeners
    this._currentWeather = 'clear';
    this._previousWeather = null;
    this._transitionProgress = 1;
    this._timeUntilNextChange = 0;
    this._lastTransitionUpdateTime = 0;
    console.log('WeatherSystem stopped.');
  }

  /**
   * Schedules the next random weather change.
   * Clears any existing timer before setting a new one.
   */
  private _scheduleNextWeatherChange(): void {
    if (this._weatherChangeTimer) {
      clearTimeout(this._weatherChangeTimer);
    }

    const min = WeatherSystem.MIN_WEATHER_CHANGE_INTERVAL_MS;
    const max = WeatherSystem.MAX_WEATHER_CHANGE_INTERVAL_MS;
    this._timeUntilNextChange = Math.floor(Math.random() * (max - min + 1)) + min;

    this._weatherChangeTimer = setTimeout(() => {
      this._initiateWeatherChange();
    }, this._timeUntilNextChange);

    console.log(`Next weather change scheduled in ${Math.round(this._timeUntilNextChange / 1000)} seconds.`);
  }

  /**
   * Initiates a transition to a new weather type.
   * This method is called when the scheduled timer expires.
   */
  private _initiateWeatherChange(): void {
    const newWeather = this._pickNewWeather();

    // If the picked weather is the same as current and no transition is active,
    // just reschedule the next change without starting a new transition.
    if (newWeather === this._currentWeather && this._transitionProgress === 1) {
      console.log(`Picked same weather (${newWeather}). Rescheduling next change.`);
      this._scheduleNextWeatherChange();
      return;
    }

    console.log(`Initiating weather change from ${this._currentWeather} to ${newWeather}`);
    this._previousWeather = this._currentWeather;
    this._currentWeather = newWeather;
    this._transitionProgress = 0; // Reset transition progress to start

    this._startTransitionLoop();
    this._eventEmitter.emit('weatherChangeStarted', this._currentWeather, this._previousWeather);

    // Schedule the next weather change after this one has been initiated
    this._scheduleNextWeatherChange();
  }

  /**
   * Starts the animation frame loop for smooth weather transitions.
   * Cancels any existing transition loop before starting a new one.
   */
  private _startTransitionLoop(): void {
    if (this._transitionAnimationFrameId !== null) {
      cancelAnimationFrame(this._transitionAnimationFrameId);
    }
    this._lastTransitionUpdateTime = performance.now();
    this._transitionAnimationFrameId = requestAnimationFrame(this._transitionLoop);
  }

  /**
   * The main transition loop, called by requestAnimationFrame.
   * Updates transition progress and emits `weatherTransition` events.
   * Once complete, it emits `weatherTransitionComplete` and cleans up.
   * @param timestamp The DOMHighResTimeStamp provided by requestAnimationFrame.
   */
  private _transitionLoop = (timestamp: DOMHighResTimeStamp): void => {
    // If transition is already complete or somehow overshot, ensure cleanup
    if (this._transitionProgress >= 1) {
      if (this._transitionAnimationFrameId !== null) {
        cancelAnimationFrame(this._transitionAnimationFrameId);
        this._transitionAnimationFrameId = null;
      }
      this._previousWeather = null; // Clear previous weather once transition is fully done
      this._eventEmitter.emit('weatherTransitionComplete', this._currentWeather);
      return;
    }

    const deltaTime = timestamp - this._lastTransitionUpdateTime;
    this._lastTransitionUpdateTime = timestamp;

    this._transitionProgress += deltaTime / WeatherSystem.WEATHER_TRANSITION_DURATION_MS;
    this._transitionProgress = Math.min(this._transitionProgress, 1); // Clamp progress between 0 and 1

    this._eventEmitter.emit('weatherTransition', this._currentWeather, this._previousWeather, this._transitionProgress);

    if (this._transitionProgress < 1) {
      this._transitionAnimationFrameId = requestAnimationFrame(this._transitionLoop);
    } else {
      // Transition finished
      if (this._transitionAnimationFrameId !== null) {
        cancelAnimationFrame(this._transitionAnimationFrameId);
        this._transitionAnimationFrameId = null;
      }
      this._previousWeather = null; // No longer transitioning from a previous weather
      this._eventEmitter.emit('weatherTransitionComplete', this._currentWeather);
      console.log(`Weather transition to ${this._currentWeather} complete.`);
    }
  };

  /**
   * Picks a new weather type based on the current map type and time of day.
   * It attempts to pick a weather different from the current one.
   * @returns The newly selected WeatherType.
   */
  private _pickNewWeather(): WeatherType {
    let possibleWeathers: WeatherType[];
    let probabilities: Record<WeatherType, number>;

    if (this._isOutdoorMap) {
      possibleWeathers = WeatherSystem.OUTDOOR_WEATHER_TYPES;
      // Create a mutable copy of base probabilities
      probabilities = { ...WeatherSystem.BASE_OUTDOOR_WEATHER_PROBABILITIES };

      // Adjust probabilities based on time of day if TimeSystem is available
      if (this._timeSystem) {
        const period = this._timeSystem.currentPeriod;
        let totalAdjustment = 0;

        // Increase storm/fog chance at dusk/night
        if (period === 'dusk' || period === 'night') {
          const stormIncrease = 0.15; // e.g., increase storm by 15%
          const fogIncrease = 0.05;   // e.g., increase fog by 5%

          probabilities['storm'] = Math.min(probabilities['storm'] + stormIncrease, 0.5); // Cap storm chance
          probabilities['fog'] = Math.min(probabilities['fog'] + fogIncrease, 0.3);     // Cap fog chance
          totalAdjustment = stormIncrease + fogIncrease;
        }
        // Increase clear chance during day
        else if (period === 'day') {
          const clearIncrease = 0.1; // e.g., increase clear by 10%
          probabilities['clear'] = Math.min(probabilities['clear'] + clearIncrease, 0.6); // Cap clear chance
          totalAdjustment = -clearIncrease; // This is a "reduction" for others
        }

        // Normalize probabilities after adjustments
        const currentSum = Object.values(probabilities).reduce((acc, p) => acc + p, 0);
        if (Math.abs(currentSum - 1.0) > 0.001) { // Check if sum deviates significantly from 1
          const factor = 1.0 / currentSum;
          for (const key in probabilities) {
            probabilities[key as WeatherType] *= factor;
          }
        }
      }
    } else {
      possibleWeathers = WeatherSystem.INDOOR_WEATHER_TYPES;
      probabilities = { 
        'clear': 0.7, 
        'fog': 0.3,
        'rain': 0,
        'storm': 0,
        'codeSnow': 0,
      } as Record<WeatherType, number>; // Fixed probabilities for indoor
    }

    // Filter out the current weather to encourage a change, unless it's the only option
    const filteredWeathers = possibleWeathers.filter(w => w !== this._currentWeather);

    // If no other weather types are possible (e.g., only 'clear' for indoor), return current.
    if (filteredWeathers.length === 0) {
      return this._currentWeather;
    }

    // Create a temporary probability distribution for the filtered weathers
    const filteredProbabilities: Partial<Record<WeatherType, number>> = {};
    let sumFilteredProb = 0;
    for (const weather of filteredWeathers) {
      filteredProbabilities[weather] = probabilities[weather] || 0;
      sumFilteredProb += filteredProbabilities[weather];
    }

    // If the sum of probabilities for filtered weathers is zero (e.g., current weather had all probability),
    // then just pick randomly from filteredWeathers with equal probability.
    if (sumFilteredProb === 0) {
      return filteredWeathers[Math.floor(Math.random() * filteredWeathers.length)];
    }

    // Normalize filtered probabilities so they sum to 1
    for (const weather of filteredWeathers) {
      const prob = filteredProbabilities[weather];
      if (prob !== undefined) {
        filteredProbabilities[weather] = prob / sumFilteredProb;
      }
    }

    // Perform weighted random selection
    const rand = Math.random();
    let cumulativeProbability = 0;
    for (const weather of filteredWeathers) {
      const prob = filteredProbabilities[weather];
      if (prob !== undefined) {
        cumulativeProbability += prob;
        if (rand <= cumulativeProbability) {
          return weather;
        }
      }
    }

    // Fallback in case of floating point inaccuracies or if no weather was picked (should not happen with correct probabilities)
    return filteredWeathers[Math.floor(Math.random() * filteredWeathers.length)];
  }

  /**
   * Handles changes in the time period, potentially influencing future weather picks.
   * This method is a listener for the TimeSystem's 'periodChanged' event.
   * @param newPeriod The new time of day period.
   */
  private _handlePeriodChange = (newPeriod: TimeOfDay): void => {
    console.log(`Time period changed to: ${newPeriod}. Weather probabilities for future changes will adjust.`);
    // The _pickNewWeather method already incorporates time of day,
    // so we don't need to force a change here, just acknowledge.
  };

  /**
   * Checks if a given weather type is valid for the specified map type.
   * @param weather The weather type to check.
   * @param isOutdoor The map type (true for outdoor, false for indoor).
   * @returns True if the weather is valid for the map type, false otherwise.
   */
  private _isValidWeatherForMap(weather: WeatherType, isOutdoor: boolean): boolean {
    if (isOutdoor) {
      return WeatherSystem.OUTDOOR_WEATHER_TYPES.includes(weather);
    } else {
      return WeatherSystem.INDOOR_WEATHER_TYPES.includes(weather);
    }
  }

  /**
   * Sets the current map type (outdoor or indoor).
   * If the current weather is not valid for the new map type, it forces an immediate change
   * to a valid weather type (e.g., 'clear' or 'fog' for indoor maps).
   * @param isOutdoor True if the map is outdoor, false if indoor.
   */
  public setMapType(isOutdoor: boolean): void {
    if (this._isOutdoorMap === isOutdoor) {
      return; // No change needed
    }

    this._isOutdoorMap = isOutdoor;
    console.log(`Map type changed to ${this._isOutdoorMap ? 'Outdoor' : 'Indoor'}.`);

    // If the current weather is no longer valid for the new map type, force a change
    if (!this._isValidWeatherForMap(this._currentWeather, this._isOutdoorMap)) {
      console.log(`Current weather (${this._currentWeather}) is invalid for new map type. Forcing change.`);
      // Force a change to a valid weather type. For simplicity, default to 'clear'.
      // A more complex system might try to pick the "closest" valid weather.
      const targetWeather = this._isOutdoorMap ? 'clear' : 'clear';
      this._previousWeather = this._currentWeather;
      this._currentWeather = targetWeather;
      this._transitionProgress = 0; // Start a new transition
      this._startTransitionLoop();
      this._eventEmitter.emit('weatherChangeStarted', this._currentWeather, this._previousWeather);
      this._scheduleNextWeatherChange(); // Reschedule the next random change after this forced one
    }
  }

  /**
   * Registers an event listener for weather system events.
   * @param eventName The name of the event:
   *   - 'weatherChangeStarted': Emitted when a new weather change begins.
   *   - 'weatherTransition': Emitted continuously during a transition with progress updates.
   *   - 'weatherTransitionComplete': Emitted when a weather transition finishes.
   * @param listener The function to call when the event is emitted.
   */
  public on(eventName: 'weatherChangeStarted' | 'weatherTransition' | 'weatherTransitionComplete', listener: Function): void {
    this._eventEmitter.on(eventName, listener);
  }

  /**
   * Removes an event listener.
   * @param eventName The name of the event.
   * @param listener The function to remove.
   */
  public off(eventName: 'weatherChangeStarted' | 'weatherTransition' | 'weatherTransitionComplete', listener: Function): void {
    this._eventEmitter.off(eventName, listener);
  }

  /**
   * Gets the current weather type.
   * @returns The current WeatherType.
   */
  public getCurrentWeather(): WeatherType {
    return this._currentWeather;
  }

  /**
   * Gets the current transition progress (0-1).
   * @returns The transition progress. Returns 1 if no transition is active.
   */
  public getTransitionProgress(): number {
    return this._transitionProgress;
  }

  /**
   * Gets the previous weather type during an active transition.
   * @returns The previous WeatherType or null if no transition is active.
   */
  public getPreviousWeather(): WeatherType | null {
    return this._previousWeather;
  }

  /**
   * Gets the current weather effects based on the active weather type.
   * @returns An object containing movement speed, visibility, and combat accuracy modifiers.
   */
  public getWeatherEffects(): WeatherEffects {
    const effects = WeatherSystem.WEATHER_EFFECTS_MAP[this._currentWeather];
    
    // Defensive check: If current weather type is not in the map, return default effects
    if (!effects) {
      console.warn(`WeatherSystem: No effects defined for weather type "${this._currentWeather}". Returning default effects.`);
      return {
        movementSpeedModifier: 1.0,
        visibilityRadius: 3,
        combatAccuracyModifier: 0,
      };
    }
    
    return effects;
  }

  /**
   * Serializes the current state of the WeatherSystem for saving.
   * @returns An object containing the current weather system data.
   */
  public serialize(): WeatherData {
    return {
      currentWeather: this._currentWeather,
      transitionProgress: this._transitionProgress,
      previousWeather: this._previousWeather,
      timeUntilChange: this._timeUntilNextChange, // Store remaining time on the timer
    };
  }

  /**
   * Deserializes and loads the state of the WeatherSystem from saved data.
   * This method also re-initializes timers and transition loops based on the loaded data.
   * @param data The WeatherData object to load.
   * @param timeSystem The TimeSystem instance (required for proper re-initialization).
   * @param isOutdoorMap The current map type (required for proper re-initialization).
   */
  public deserialize(data: WeatherData, timeSystem: ITimeSystem, isOutdoorMap: boolean): void {
    this.stop(); // Clean up current state before loading new one

    // Validate weather types before assigning
    const validWeatherTypes: WeatherType[] = ['clear', 'rain', 'storm', 'fog', 'codeSnow'];
    
    if (validWeatherTypes.includes(data.currentWeather)) {
      this._currentWeather = data.currentWeather;
    } else {
      console.warn(`WeatherSystem: Invalid weather type "${data.currentWeather}" in save data. Defaulting to 'clear'.`);
      this._currentWeather = 'clear';
    }
    
    if (data.previousWeather && validWeatherTypes.includes(data.previousWeather)) {
      this._previousWeather = data.previousWeather;
    } else {
      this._previousWeather = null;
    }
    
    this._transitionProgress = data.transitionProgress;
    this._timeUntilNextChange = data.timeUntilChange;

    this._timeSystem = timeSystem;
    this._isOutdoorMap = isOutdoorMap;

    this._timeSystem.on('periodChanged', this._handlePeriodChange);

    // If a transition was active when saved, restart its animation loop
    if (this._previousWeather !== null && this._transitionProgress < 1) {
      this._lastTransitionUpdateTime = performance.now(); // Reset timestamp for smooth continuation
      this._transitionAnimationFrameId = requestAnimationFrame(this._transitionLoop);
      console.log(`WeatherSystem deserialized. Resuming transition from ${this._previousWeather} to ${this._currentWeather}.`);
    } else {
      // Ensure transition progress is 1 if no previous weather or transition was complete
      this._transitionProgress = 1;
      this._previousWeather = null;
      console.log(`WeatherSystem deserialized. Current weather: ${this._currentWeather}.`);
    }

    // Reschedule the weather change timer based on loaded timeUntilChange
    if (this._weatherChangeTimer) {
      clearTimeout(this._weatherChangeTimer);
    }
    // Ensure timeUntilChange is not negative if loaded from a very old/corrupted save
    this._timeUntilNextChange = Math.max(0, this._timeUntilNextChange);
    this._weatherChangeTimer = setTimeout(() => {
      this._initiateWeatherChange();
    }, this._timeUntilNextChange);

    // Ensure loaded weather is valid for the current map type.
    // If not, force a change to a valid weather for the current map.
    if (!this._isValidWeatherForMap(this._currentWeather, this._isOutdoorMap)) {
      console.warn(`Loaded weather (${this._currentWeather}) is invalid for current map type (${this._isOutdoorMap ? 'Outdoor' : 'Indoor'}). Forcing new weather.`);
      this.setMapType(this._isOutdoorMap); // This will handle the forced change and reschedule
    }
  }
}
