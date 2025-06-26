/**
 * @file src/engine/FactionManager.ts
 * @description Manages all faction reputations, handles conflicts, and provides save/load functionality.
 */

import { Faction } from '../models/Faction';

/**
 * Defines the structure for serialized data of a single faction.
 */
export interface SerializedFactionData {
    id: string;
    reputation: number;
}

/**
 * Defines the structure for the entire serialized state of the FactionManager.
 */
interface SerializedFactionManagerState {
    factions: SerializedFactionData[];
}

/**
 * Callback type for reputation change events.
 * @param factionId The ID of the faction whose reputation changed.
 * @param oldRep The reputation value before the change.
 * @param newRep The reputation value after the change.
 * @param tierChanged True if the reputation tier also changed (e.g., from Neutral to Friendly), false otherwise.
 */
type ReputationChangeCallback = (factionId: string, oldRep: number, newRep: number, tierChanged: boolean) => void;

/**
 * The FactionManager class is responsible for:
 * 1. Initializing and storing all game factions.
 * 2. Tracking and adjusting player reputation with each faction.
 * 3. Implementing conflict logic where helping one faction might negatively impact another.
 * 4. Providing methods to query reputation levels and tiers.
 * 5. Offering save and load functionality for faction data.
 * 6. Emitting events when faction reputations change, allowing UI or other systems to react.
 */
export class FactionManager {
    private static instance: FactionManager;

    /**
     * A map storing all active Faction instances, keyed by their unique ID.
     */
    private factions: Map<string, Faction>;

    /**
     * An array of callback functions to be invoked when a faction's reputation changes.
     */
    private reputationChangeCallbacks: ReputationChangeCallback[] = [];

    // --- Constants for Reputation Management ---
    /** The minimum possible reputation value. */
    private static readonly REPUTATION_MIN = -1000;
    /** The maximum possible reputation value. */
    private static readonly REPUTATION_MAX = 1000;
    /** The percentage of reputation gain that is applied as a penalty to a conflicting faction. */
    private static readonly CONFLICT_PENALTY_PERCENT = 0.25; // 25% of gain

    /**
     * Defines the reputation tiers and their corresponding thresholds.
     * Ordered from lowest (most hostile) to highest (most allied).
     * A reputation value falls into a tier if it is less than the tier's threshold,
     * but not less than the previous tier's threshold.
     */
    private static readonly REPUTATION_TIERS = [
        { name: 'Hostile', threshold: -500 },      // Reputation < -500
        { name: 'Unfriendly', threshold: -100 },   // Reputation >= -500 and < -100
        { name: 'Neutral', threshold: 100 },       // Reputation >= -100 and < 100
        { name: 'Friendly', threshold: 500 },      // Reputation >= 100 and < 500
        { name: 'Allied', threshold: FactionManager.REPUTATION_MAX + 1 }, // Reputation >= 500 and <= REPUTATION_MAX
    ];

    /**
     * Creates an instance of FactionManager.
     * Initializes the internal map for factions and calls `loadFactions` to set up the default game factions.
     */
    private constructor() {
        this.factions = new Map<string, Faction>();
        this.loadFactions(); // Initialize default factions upon creation
    }

    /**
     * Gets the singleton instance of FactionManager.
     * @returns The FactionManager instance.
     */
    public static getInstance(): FactionManager {
        if (!FactionManager.instance) {
            FactionManager.instance = new FactionManager();
        }
        return FactionManager.instance;
    }

    /**
     * Initializes or re-initializes the default factions for the game.
     * This method sets up the core factions with their initial neutral reputation.
     * It clears any existing faction data before loading, effectively resetting the state.
     */
    public loadFactions(): void {
        // Clear existing factions to ensure a clean slate for loading or resetting
        this.factions.clear();

        // Initialize the three main factions with a neutral starting reputation (0)
        this.factions.set('order', new Faction('order', 'Order of Clean Code', 0));
        this.factions.set('chaos', new Faction('chaos', 'Chaos Coders', 0));
        this.factions.set('memory', new Faction('memory', 'Memory Guardians', 0));

        console.log('FactionManager: Factions initialized.');
    }

    /**
     * Adjusts the reputation for a specified faction by a given amount.
     * This method also handles inter-faction conflicts:
     * - Helping 'Order of Clean Code' slightly decreases 'Chaos Coders' reputation.
     * - Helping 'Chaos Coders' slightly decreases 'Order of Clean Code' reputation.
     * - 'Memory Guardians' are neutral and do not cause conflicts.
     * Reputation values are clamped between `REPUTATION_MIN` and `REPUTATION_MAX`.
     * An event is emitted for the target faction and any affected conflict factions.
     *
     * @param factionId The unique ID of the faction whose reputation is being adjusted.
     * @param amount The amount to adjust the reputation by. Positive values increase reputation, negative values decrease it.
     * @returns The new reputation value for the target faction after adjustment and clamping.
     * @throws Error if the provided `factionId` does not correspond to an existing faction.
     */
    public adjustReputation(factionId: string, amount: number): number {
        const targetFaction = this.factions.get(factionId);
        if (!targetFaction) {
            throw new Error(`FactionManager: Faction with ID '${factionId}' not found.`);
        }

        const oldReputation = targetFaction.reputation;
        const oldTier = this.getReputationTier(factionId);

        // Apply reputation change and clamp the value within defined bounds
        targetFaction.reputation = Math.min(
            FactionManager.REPUTATION_MAX,
            Math.max(FactionManager.REPUTATION_MIN, targetFaction.reputation + amount),
        );

        // Handle inter-faction conflicts if the reputation increased (player helped the faction)
        if (amount > 0) {
            const conflictPenalty = amount * FactionManager.CONFLICT_PENALTY_PERCENT;
            switch (factionId) {
                case 'order':
                    // Helping Order slightly decreases Chaos Coders' reputation
                    this.adjustReputationInternal('chaos', -conflictPenalty);
                    break;
                case 'chaos':
                    // Helping Chaos slightly decreases Order of Clean Code's reputation
                    this.adjustReputationInternal('order', -conflictPenalty);
                    break;
                case 'memory':
                    // Memory Guardians are neutral; helping them does not directly impact other factions negatively.
                    break;
            }
        }

        const newReputation = targetFaction.reputation;
        const newTier = this.getReputationTier(factionId);
        const tierChanged = oldTier !== newTier;

        // Emit an event if the reputation actually changed
        if (oldReputation !== newReputation) {
            this.emitReputationChange(factionId, oldReputation, newReputation, tierChanged);
        }

        return newReputation;
    }

    /**
     * Internal helper method to adjust a faction's reputation without triggering the
     * conflict resolution logic or external event emissions (beyond its own change).
     * This is used specifically for applying conflict penalties to prevent infinite loops
     * and ensure only the primary `adjustReputation` call handles the conflict logic.
     *
     * @param factionId The ID of the faction to adjust.
     * @param amount The amount to adjust reputation by.
     */
    private adjustReputationInternal(factionId: string, amount: number): void {
        const faction = this.factions.get(factionId);
        if (faction) {
            const oldReputation = faction.reputation;
            const oldTier = this.getReputationTier(factionId); // Get tier before change

            faction.reputation = Math.min(
                FactionManager.REPUTATION_MAX,
                Math.max(FactionManager.REPUTATION_MIN, faction.reputation + amount),
            );

            const newReputation = faction.reputation;
            const newTier = this.getReputationTier(factionId); // Get tier after change
            const tierChanged = oldTier !== newTier;

            // Emit event for this internal change, but without triggering further conflict logic
            if (oldReputation !== newReputation) {
                this.emitReputationChange(factionId, oldReputation, newReputation, tierChanged);
            }
        }
    }

    /**
     * Retrieves the current numerical reputation value for a specified faction.
     * @param factionId The ID of the faction.
     * @returns The current reputation value.
     * @throws Error if the provided `factionId` does not correspond to an existing faction.
     */
    public getReputation(factionId: string): number {
        const faction = this.factions.get(factionId);
        if (!faction) {
            throw new Error(`FactionManager: Faction with ID '${factionId}' not found.`);
        }
        return faction.reputation;
    }

    /**
     * Determines and returns the string name of the reputation tier (e.g., "Hostile", "Neutral", "Allied")
     * for a given faction based on its current reputation value.
     * @param factionId The ID of the faction.
     * @returns The string name of the reputation tier.
     * @throws Error if the provided `factionId` does not correspond to an existing faction.
     */
    public getReputationTier(factionId: string): string {
        // Reuses getReputation to ensure factionId validity and get the current value
        const reputation = this.getReputation(factionId);

        // Iterate through the defined tiers to find the matching one
        for (const tier of FactionManager.REPUTATION_TIERS) {
            if (reputation < tier.threshold) {
                return tier.name;
            }
        }
        // This line should theoretically not be reached if REPUTATION_MAX + 1 is the last threshold
        return 'Unknown';
    }

    /**
     * Checks if the player's reputation with a specific faction is currently "Hostile".
     * @param factionId The ID of the faction.
     * @returns True if the reputation tier is "Hostile", false otherwise.
     */
    public isHostile(factionId: string): boolean {
        return this.getReputationTier(factionId) === 'Hostile';
    }

    /**
     * Checks if the player's reputation with a specific faction is considered "Neutral" or
     * within the general non-extreme range (Unfriendly, Neutral, Friendly).
     * @param factionId The ID of the faction.
     * @returns True if the reputation tier is "Unfriendly", "Neutral", or "Friendly", false otherwise.
     */
    public isNeutral(factionId: string): boolean {
        const tier = this.getReputationTier(factionId);
        return tier === 'Neutral' || tier === 'Unfriendly' || tier === 'Friendly';
    }

    /**
     * Checks if the player's reputation with a specific faction is currently "Allied".
     * @param factionId The ID of the faction.
     * @returns True if the reputation tier is "Allied", false otherwise.
     */
    public isAllied(factionId: string): boolean {
        return this.getReputationTier(factionId) === 'Allied';
    }

    /**
     * Calculates a numerical modifier based on the player's reputation with a faction.
     * This modifier can be used for things like price adjustments in shops.
     * - Allied: -0.20 (20% discount)
     * - Hostile: +0.20 (20% markup)
     * - Neutral, Unfriendly, Friendly: 0 (no modifier)
     * @param factionId The ID of the faction.
     * @returns A number representing the attitude modifier.
     */
    public getAttitudeModifier(factionId: string): number {
        const tier = this.getReputationTier(factionId);
        switch (tier) {
            case 'Allied':
                return -0.20; // 20% discount
            case 'Hostile':
                return 0.20;  // 20% markup
            default:
                return 0;    // Neutral, Unfriendly, Friendly have no direct price modifier
        }
    }

    /**
     * Serializes the current state of all managed factions into a plain JavaScript object.
     * This object can then be easily converted to JSON for saving game progress.
     * @returns An object containing an array of serialized faction data (id and reputation).
     */
    public serialize(): SerializedFactionManagerState {
        const factionData: SerializedFactionData[] = [];
        this.factions.forEach(faction => {
            factionData.push({
                id: faction.id,
                reputation: faction.reputation,
            });
        });
        return { factions: factionData };
    }

    /**
     * Deserializes faction data from a previously saved state, updating the FactionManager's
     * internal faction reputations. This method will update existing factions and emit
     * reputation change events for any factions whose reputation or tier has changed.
     *
     * @param data The serialized data object, typically loaded from a save file.
     * @throws Error if the provided `data` is not in the expected `SerializedFactionManagerState` format.
     */
    public deserialize(data: SerializedFactionManagerState): void {
        if (!data || !Array.isArray(data.factions)) {
            throw new Error('FactionManager: Invalid data format for deserialization. Expected an object with a \'factions\' array.');
        }

        data.factions.forEach(serializedFaction => {
            const faction = this.factions.get(serializedFaction.id);
            if (faction) {
                const oldReputation = faction.reputation;
                const oldTier = this.getReputationTier(faction.id);

                // Update reputation, clamping it to ensure it stays within valid bounds
                faction.reputation = Math.min(
                    FactionManager.REPUTATION_MAX,
                    Math.max(FactionManager.REPUTATION_MIN, serializedFaction.reputation),
                );

                const newReputation = faction.reputation;
                const newTier = this.getReputationTier(faction.id);
                const tierChanged = oldTier !== newTier;

                // Emit event if the reputation actually changed during deserialization
                if (oldReputation !== newReputation) {
                    this.emitReputationChange(faction.id, oldReputation, newReputation, tierChanged);
                }
            } else {
                console.warn(`FactionManager: Faction with ID '${serializedFaction.id}' from save data not found in current game setup. Skipping.`);
            }
        });
        console.log('FactionManager: Faction data deserialized.');
    }

    /**
     * Registers a callback function that will be invoked whenever a faction's reputation changes.
     * This is useful for updating UI elements, triggering game events, or logging changes.
     * Multiple callbacks can be registered.
     * @param callback The function to call when a reputation change occurs.
     */
    public onReputationChange(callback: ReputationChangeCallback): void {
        this.reputationChangeCallbacks.push(callback);
    }

    /**
     * Internal method to trigger all registered `reputationChangeCallbacks`.
     * @param factionId The ID of the faction whose reputation changed.
     * @param oldRep The reputation value before the change.
     * @param newRep The reputation value after the change.
     * @param tierChanged True if the reputation tier also changed, false otherwise.
     */
    private emitReputationChange(factionId: string, oldRep: number, newRep: number, tierChanged: boolean): void {
        this.reputationChangeCallbacks.forEach(callback => {
            callback(factionId, oldRep, newRep, tierChanged);
        });
    }
}
