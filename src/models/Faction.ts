// src/models/Faction.ts

/**
 * @interface IFaction
 * @description Defines the structure for a Faction entity in Tales of Claude.
 */
export interface IFaction {
    /**
     * A unique identifier for the faction (e.g., "order-clean-code").
     */
    id: string;
    /**
     * The display name of the faction (e.g., "Order of Clean Code").
     */
    name: string;
    /**
     * A brief description of the faction's philosophy or role.
     */
    description: string;
    /**
     * The default starting reputation value a player has with this faction.
     */
    initialReputation: number;
    /**
     * A record defining the various reputation tiers for this faction.
     * Each key is the tier name (e.g., "Hostile", "Neutral", "Allied"),
     * and its value specifies the min/max reputation range and a description.
     */
    reputationTiers: Record<string, { min: number; max: number; description: string }>;
}

/**
 * @class Faction
 * @description Represents a faction in Tales of Claude with reputation tracking and tier management.
 * Includes pre-defined factions and methods to query reputation status.
 * @implements {IFaction}
 */
export class Faction implements IFaction {
    public readonly id: string;
    public readonly name: string;
    public readonly description: string;
    public readonly initialReputation: number;
    public readonly reputationTiers: Record<string, { min: number; max: number; description: string }>;
    public reputation: number; // Current reputation value

    /**
     * Defines the standard reputation tiers used across most factions.
     * These tiers align with the `isHostile`, `isNeutral`, and `isAllied` methods.
     */
    private static readonly DEFAULT_REPUTATION_TIERS: Record<string, { min: number; max: number; description: string }> = {
        'Hostile': { min: -Infinity, max: -21, description: 'Actively opposes your goals. Actions will be met with resistance.' },
        'Neutral': { min: -20, max: 20, description: 'Indifferent towards you. Neither friend nor foe.' },
        'Allied': { min: 21, max: Infinity, description: 'Strongly supports you. A trusted ally.' },
    };

    /**
     * Constructor to create a faction instance.
     * @param id A unique identifier for the faction.
     * @param name The name of the faction.
     * @param initialReputation The starting reputation value with this faction.
     * @param description A brief description of the faction.
     * @param reputationTiers A record defining the reputation tiers for this faction.
     */
    constructor(
        id: string,
        name: string,
        initialReputation: number,
        description?: string,
        reputationTiers?: Record<string, { min: number; max: number; description: string }>,
    ) {
        this.id = id;
        this.name = name;
        this.initialReputation = initialReputation;
        this.reputation = initialReputation;
        this.description = description || '';
        this.reputationTiers = reputationTiers || Faction.DEFAULT_REPUTATION_TIERS;
    }

    // --- Faction Constants (Pre-defined Instances) ---

    /**
     * The Faction instance for the Order of Clean Code.
     * They are lawful, structured, and love perfect syntax.
     */
    private static readonly _orderOfCleanCode: Faction = new Faction(
        'order',
        'Order of Clean Code',
        0, // Neutral initial reputation
        'A lawful and structured faction that values perfect syntax, rigorous testing, and maintainable code above all else. They believe in strict adherence to coding standards.',
        Faction.DEFAULT_REPUTATION_TIERS,
    );

    /**
     * The Faction instance for the Chaos Coders.
     * They are creative, experimental, and break conventions.
     */
    private static readonly _chaosCoders: Faction = new Faction(
        'chaos',
        'Chaos Coders',
        0, // Neutral initial reputation
        'A creative and experimental faction that thrives on innovation, rapid prototyping, and breaking conventions. They prioritize functionality and speed over strict rules, often leading to \'spaghetti code\'.',
        Faction.DEFAULT_REPUTATION_TIERS,
    );

    /**
     * The Faction instance for the Memory Guardians.
     * They are protectors of data and neutral mediators.
     */
    private static readonly _memoryGuardians: Faction = new Faction(
        'memory',
        'Memory Guardians',
        0, // Neutral initial reputation
        'A neutral and ancient faction dedicated to the protection and efficient management of data. They act as mediators in disputes, ensuring data integrity and preventing memory leaks or corruption.',
        Faction.DEFAULT_REPUTATION_TIERS,
    );

    // --- Static Factory Methods ---

    /**
     * Returns the singleton instance of the Order of Clean Code faction.
     * @returns The Order of Clean Code Faction instance.
     */
    public static createOrderOfCleanCode(): Faction {
        return new Faction(
            Faction._orderOfCleanCode.id,
            Faction._orderOfCleanCode.name,
            Faction._orderOfCleanCode.initialReputation,
            Faction._orderOfCleanCode.description,
            Faction._orderOfCleanCode.reputationTiers,
        );
    }

    /**
     * Returns the singleton instance of the Chaos Coders faction.
     * @returns The Chaos Coders Faction instance.
     */
    public static createChaosCoders(): Faction {
        return new Faction(
            Faction._chaosCoders.id,
            Faction._chaosCoders.name,
            Faction._chaosCoders.initialReputation,
            Faction._chaosCoders.description,
            Faction._chaosCoders.reputationTiers,
        );
    }

    /**
     * Returns the singleton instance of the Memory Guardians faction.
     * @returns The Memory Guardians Faction instance.
     */
    public static createMemoryGuardians(): Faction {
        return new Faction(
            Faction._memoryGuardians.id,
            Faction._memoryGuardians.name,
            Faction._memoryGuardians.initialReputation,
            Faction._memoryGuardians.description,
            Faction._memoryGuardians.reputationTiers,
        );
    }

    // --- Instance Methods ---

    /**
     * Determines the name of the reputation tier for a given reputation value.
     * It iterates through the faction's defined reputation tiers to find the one
     * that encompasses the provided reputation value.
     * @param reputation The current reputation value to evaluate.
     * @returns The name of the reputation tier (e.g., "Hostile", "Neutral", "Allied"),
     *          or "Unknown" if no matching tier is found (should not happen with comprehensive tiers).
     */
    public getReputationTierName(reputation: number): string {
        for (const tierName in this.reputationTiers) {
            const tier = this.reputationTiers[tierName];
            if (reputation >= tier.min && reputation <= tier.max) {
                return tierName;
            }
        }
        return 'Unknown'; // Fallback, though tiers should cover all ranges
    }

    /**
     * Retrieves the descriptive text for a specific reputation tier name.
     * @param tierName The name of the reputation tier (e.g., "Hostile", "Neutral", "Allied").
     * @returns The description string for the specified tier, or `undefined` if the tier name does not exist.
     */
    public getTierDescription(tierName: string): string | undefined {
        return this.reputationTiers[tierName]?.description;
    }

    /**
     * Checks if the given reputation value falls within the hostile range.
     * A reputation is considered hostile if it is less than -20.
     * @param reputation The reputation value to check.
     * @returns `true` if the reputation is hostile, `false` otherwise.
     */
    public isHostile(reputation: number): boolean {
        return reputation < -20;
    }

    /**
     * Checks if the given reputation value falls within the neutral range.
     * A reputation is considered neutral if it is between -20 and 20 (inclusive).
     * @param reputation The reputation value to check.
     * @returns `true` if the reputation is neutral, `false` otherwise.
     */
    public isNeutral(reputation: number): boolean {
        return reputation >= -20 && reputation <= 20;
    }

    /**
     * Checks if the given reputation value falls within the allied range.
     * A reputation is considered allied if it is greater than 20.
     * @param reputation The reputation value to check.
     * @returns `true` if the reputation is allied, `false` otherwise.
     */
    public isAllied(reputation: number): boolean {
        return reputation > 20;
    }
}