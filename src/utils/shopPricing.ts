import { ShopItem, NPC } from '../types/global.types';
import { FactionManager } from '../engine/FactionManager';

/**
 * Applies faction-based price modifiers to a list of shop items.
 * The price adjustment is based on the player's reputation with the NPC's faction.
 *
 * @param items An array of ShopItem objects with their base prices.
 * @param npc The NPC running the shop, whose faction affiliation determines the reputation to check.
 * @param factionManager An instance of FactionManager to query faction reputations.
 * @returns A new array of ShopItem objects with their 'price' property adjusted according to faction reputation.
 */
export function applyFactionPricing(
    items: ShopItem[],
    npc: NPC,
    factionManager: FactionManager,
): ShopItem[] {
    // If NPC has no faction affiliation, return items unchanged
    if (!npc.factionId) {
        return items;
    }

    // Get the player's reputation with the NPC's faction
    // const reputation = factionManager.getReputation(npc.factionId); // Unused variable
    const reputationTier = factionManager.getReputationTier(npc.factionId);
    
    let priceMultiplier: number = 1.0; // Default: no change

    switch (reputationTier) {
        case 'Allied':
            priceMultiplier = 0.8; // 20% discount
            break;
        case 'Hostile':
            priceMultiplier = 1.2; // 20% markup
            break;
        // Neutral, Friendly, Unfriendly result in no change (multiplier remains 1.0)
        case 'Neutral':
        case 'Friendly':
        case 'Unfriendly':
            priceMultiplier = 1.0;
            break;
        default:
            // Should not happen if reputation tiers are exhaustive
            console.warn(`Unknown faction reputation tier '${reputationTier}' for NPC faction '${npc.factionId}'. No price change applied.`);
            priceMultiplier = 1.0;
            break;
    }

    // Apply the multiplier to each item's price and return a new array
    return items.map(item => ({
        ...item, // Copy all existing properties
        price: Math.round(item.price * priceMultiplier), // Calculate new price, round to nearest integer
    }));
}