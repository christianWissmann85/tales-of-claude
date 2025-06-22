// src/models/Item.ts

import { Item as IItem, ItemType, Position } from '../types/global.types';

/**
 * Defines the specific variants of items that can exist in the game.
 */
export enum ItemVariant {
  HealthPotion = 'health_potion',
  EnergyDrink = 'energy_drink',
  DebugTool = 'debug_tool',
  MegaPotion = 'mega_potion',
  CompilerKey = 'compiler_key',
  CodeFragment = 'code_fragment',
}

/**
 * Defines the static data structure for each item variant.
 * This omits 'id' and 'position' as they are instance-specific or derived from the enum key.
 */
export interface ItemData {
  name: string;
  description: string;
  type: ItemType;
  effect?: string; // For consumable items (e.g., 'restoreHp', 'restoreEnergy')
  value?: number; // For consumable items, the amount of effect
  targetId?: string; // For key items, the ID of what it unlocks (e.g., 'door_id', 'quest_id')
  // stats?: { attack?: number; defense?: number; speed?: number; }; // For equipment items, not used by current requirements
}

/**
 * Represents an item in the game world or inventory, implementing the IItem interface.
 */
export class Item implements IItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  position?: Position; // Optional: If the item is placed on the map
  stats?: { attack?: number; defense?: number; speed?: number; }; // Properties specific to equipment items
  effect?: string; // Effect of consumable items
  value?: number; // Value associated with the effect
  targetId?: string; // For key items, the ID of what it unlocks

  /**
   * Static data for all item variants. This acts as a blueprint for creating items.
   */
  public static readonly ITEM_DATA: Record<ItemVariant, ItemData> = {
    [ItemVariant.HealthPotion]: {
      name: 'Health Potion',
      description: 'Restores 30 HP. A basic remedy for minor wounds.',
      type: 'consumable',
      effect: 'restoreHp',
      value: 30,
    },
    [ItemVariant.EnergyDrink]: {
      name: 'Energy Drink',
      description: 'Restores 20 energy. Get that code compiled faster!',
      type: 'consumable',
      effect: 'restoreEnergy',
      value: 20,
    },
    [ItemVariant.DebugTool]: {
      name: 'Debug Tool',
      description: 'A specialized tool for debugging complex systems. Key item for a quest.',
      type: 'key',
      targetId: 'quest_debug_tool_01', // Example quest ID
    },
    [ItemVariant.MegaPotion]: {
      name: 'Mega Potion',
      description: 'Restores 100 HP. For when you\'re really in a bind.',
      type: 'consumable',
      effect: 'restoreHp',
      value: 100,
    },
    [ItemVariant.CompilerKey]: {
      name: 'Compiler Key',
      description: 'A unique key used to unlock restricted compiler areas.',
      type: 'key',
      targetId: 'area_compiler_room_entrance', // Example area/door ID
    },
    [ItemVariant.CodeFragment]: {
      name: 'Code Fragment',
      description: 'A small piece of ancient, corrupted code. Might be useful for a quest.',
      type: 'quest',
    },
  };

  /**
   * Creates an instance of an Item.
   * @param variant The specific variant of the item to create (e.g., ItemVariant.HealthPotion).
   * @param startPosition Optional: The initial position of the item on the map.
   */
  constructor(variant: ItemVariant, startPosition?: Position) {
    const data = Item.ITEM_DATA[variant];
    if (!data) {
      throw new Error(`Item variant ${variant} not found in ITEM_DATA.`);
    }

    this.id = variant; // The enum value string serves as the item's ID
    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.position = startPosition; // Assign optional position
    this.effect = data.effect;
    this.value = data.value;
    this.targetId = data.targetId;
    // stats is optional and not defined for these specific items, so it will be undefined by default, which is fine.
  }

  /**
   * Factory method to create an Item instance by its ItemVariant.
   * This is useful for creating new items from their static definitions.
   * @param variant The ItemVariant enum value (e.g., ItemVariant.HealthPotion).
   * @param position Optional: The position where the item should be created on the map.
   * @returns A new Item instance.
   */
  public static createItem(variant: ItemVariant, position?: Position): Item {
    return new Item(variant, position);
  }
}