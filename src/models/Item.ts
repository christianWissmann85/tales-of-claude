// src/models/Item.ts

import { Item as IItem, ItemType, Position } from '../types/global.types';
import { EquipmentSlotType, Player } from './Player'; // Import EquipmentSlotType and Player from Player.ts

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

  // New Consumables
  UltraPotion = 'ultra_potion',

  // Weapons
  RustySword = 'rusty_sword',
  DebuggerBlade = 'debugger_blade',
  RefactorHammer = 'refactor_hammer',
  // New Weapons
  DebugBlade = 'debug_blade',

  // Armor
  BasicShield = 'basic_shield',
  FirewallArmor = 'firewall_armor',
  CompilerPlate = 'compiler_plate',
  // New Armor
  BinaryShield = 'binary_shield',

  // Accessories
  SpeedRing = 'speed_ring',
  PowerAmulet = 'power_amulet',
  LuckyCharm = 'lucky_charm',
  // New Accessories
  CompilersCharm = 'compilers_charm',

  // New Quest Items
  LogicAnalyzer = 'logic_analyzer',
  QuantumCore = 'quantum_core',

  // New Key Items
  BossKey = 'boss_key',
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
  stats?: { attack?: number; defense?: number; speed?: number; }; // For equipment items
  equipmentSlotType?: EquipmentSlotType; // For equipment items, specifies which slot it goes into
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
  equipmentSlotType?: EquipmentSlotType; // Properties specific to equipment items
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
      description: 'Restores 60 energy. Get that code compiled faster!',
      type: 'consumable',
      effect: 'restoreEnergy',
      value: 60,
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

    // New Consumables
    [ItemVariant.UltraPotion]: {
      name: 'Ultra Potion',
      description: 'Fully restores HP.',
      type: 'consumable',
      effect: 'restoreHp',
      value: 999,
    },

    // Weapons
    [ItemVariant.RustySword]: {
      name: 'Rusty Sword',
      description: 'A basic sword that\'s seen better days.',
      type: 'equipment',
      equipmentSlotType: 'weapon',
      stats: { attack: 5 },
    },
    [ItemVariant.DebuggerBlade]: {
      name: 'Debugger Blade',
      description: 'Sharp enough to cut through any bug.',
      type: 'equipment',
      equipmentSlotType: 'weapon',
      stats: { attack: 10, speed: 2 },
    },
    [ItemVariant.RefactorHammer]: {
      name: 'Refactor Hammer',
      description: 'Heavy but powerful.',
      type: 'equipment',
      equipmentSlotType: 'weapon',
      stats: { attack: 15, speed: -2 },
    },
    // New Weapons
    [ItemVariant.DebugBlade]: {
      name: 'Debug Blade',
      description: 'Sharp enough to slice through any bug.',
      type: 'equipment',
      equipmentSlotType: 'weapon',
      stats: { attack: 15, speed: 3 },
    },

    // Armor
    [ItemVariant.BasicShield]: {
      name: 'Basic Shield',
      description: 'Simple protection against bugs.',
      type: 'equipment',
      equipmentSlotType: 'armor',
      stats: { defense: 5 },
    },
    [ItemVariant.FirewallArmor]: {
      name: 'Firewall Armor',
      description: 'Keeps malicious code at bay.',
      type: 'equipment',
      equipmentSlotType: 'armor',
      stats: { defense: 10, speed: 2 },
    },
    [ItemVariant.CompilerPlate]: {
      name: 'Compiler Plate',
      description: 'Heavy armor forged by the Compiler.',
      type: 'equipment',
      equipmentSlotType: 'armor',
      stats: { defense: 15, speed: -3 },
    },
    // New Armor
    [ItemVariant.BinaryShield]: {
      name: 'Binary Shield',
      description: 'Shields you with the power of 1s and 0s.',
      type: 'equipment',
      equipmentSlotType: 'armor',
      stats: { defense: 10, speed: 1 },
    },

    // Accessories
    [ItemVariant.SpeedRing]: {
      name: 'Speed Ring',
      description: 'Makes your code run faster.',
      type: 'equipment',
      equipmentSlotType: 'accessory',
      stats: { speed: 5 },
    },
    [ItemVariant.PowerAmulet]: {
      name: 'Power Amulet',
      description: 'Balanced power boost.',
      type: 'equipment',
      equipmentSlotType: 'accessory',
      stats: { attack: 3, defense: 3 },
    },
    [ItemVariant.LuckyCharm]: {
      name: 'Lucky Charm',
      description: 'Fortune favors the debugged.',
      type: 'equipment',
      equipmentSlotType: 'accessory',
      stats: { attack: 2, defense: 2, speed: 2 },
    },
    // New Accessories
    [ItemVariant.CompilersCharm]: {
      name: 'Compilers Charm',
      description: 'The Compiler\'s blessing enhances all abilities.',
      type: 'equipment',
      equipmentSlotType: 'accessory',
      stats: { attack: 5, defense: 5, speed: 5 },
    },

    // New Quest Items
    [ItemVariant.LogicAnalyzer]: {
      name: 'Logic Analyzer',
      description: 'A lost debugging tool. Someone might be looking for this.',
      type: 'quest',
    },
    [ItemVariant.QuantumCore]: {
      name: 'Quantum Core',
      description: 'A mysterious core dropped by the Segfault Sovereign. It pulses with unstable energy.',
      type: 'quest',
    },

    // New Key Items
    [ItemVariant.BossKey]: {
      name: 'Boss Key',
      description: 'Opens the sealed door to the Segfault Sovereign.',
      type: 'key',
      targetId: 'boss_door',
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

    // Properties for consumable items
    this.effect = data.effect;
    this.value = data.value;

    // Properties for key/quest items
    this.targetId = data.targetId;

    // Properties for equipment items
    this.stats = data.stats;
    this.equipmentSlotType = data.equipmentSlotType;
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

  /**
   * Attempts to use the item, performing validation based on item type and player status.
   * @param player The Player instance attempting to use the item.
   * @returns An object indicating success and a message.
   */
  public use(player: Player): { success: boolean; message: string } {
    switch (this.type) {
      case 'consumable':
        if (this.effect === 'restoreHp') {
          if (player.stats.hp === player.stats.maxHp) {
            return { success: false, message: `You are already at full HP. Cannot use ${this.name}.` };
          }
          return { success: true, message: `Used ${this.name}.` };
        } else if (this.effect === 'restoreEnergy') {
          if (player.stats.energy === player.stats.maxEnergy) {
            return { success: false, message: `You are already at full energy. Cannot use ${this.name}.` };
          }
          return { success: true, message: `Used ${this.name}.` };
        }
        // For other consumable effects not explicitly checked
        return { success: true, message: `Used ${this.name}.` };

      case 'quest':
        return { success: false, message: `You examine the ${this.name}. It seems important for a quest.` };

      case 'key':
        return { success: false, message: `This is a key item. It needs to be used at the right location.` };

      case 'equipment':
        return { success: false, message: `This is an equipment item. You need to equip it, not use it directly.` };

      default:
        return { success: false, message: `This item (${this.name}) cannot be used directly.` };
    }
  }
}