// src/models/Inventory.ts

import { Item as IItem, ItemType } from '../types/global.types';
import { Item } from './Item';

/**
 * Represents a slot in the inventory, holding an item and its count.
 */
interface InventorySlot {
  item: Item;
  count: number;
}

/**
 * Manages a collection of items, handling stacking for consumables and a maximum inventory size.
 */
export class Inventory {
  private readonly MAX_SIZE: number = 20; // Maximum number of unique item slots
  private items: Map<string, InventorySlot>; // Key: Item.id, Value: { item: Item, count: number }

  constructor() {
    this.items = new Map<string, InventorySlot>();
  }

  /**
   * Adds an item to the inventory.
   * - Consumable items with the same ID will stack.
   * - Non-consumable items with the same ID will not stack; attempting to add a duplicate will fail.
   * - Returns false if the inventory is full (for new item types) or if a non-stackable item already exists.
   * @param item The item to add.
   * @returns True if the item was successfully added or stacked, false otherwise.
   */
  public addItem(item: Item): boolean {
    const existingSlot = this.items.get(item.id);

    if (item.type === 'consumable') {
      if (existingSlot) {
        // Stack consumable item
        existingSlot.count++;
        return true;
      } else {
        // Add new consumable type to a new slot
        if (this.isFull()) {
          return false; // Inventory full, cannot add a new unique item slot
        }
        this.items.set(item.id, { item: item, count: 1 });
        return true;
      }
    } else {
      // Non-consumable items (key, equipment, quest) do not stack by ID.
      // If an item with this ID already exists, we cannot add another one.
      if (existingSlot) {
        return false; // Item with this ID already exists and is not stackable
      } else {
        // Add new non-consumable item to a new slot
        if (this.isFull()) {
          return false; // Inventory full, cannot add a new unique item slot
        }
        this.items.set(item.id, { item: item, count: 1 });
        return true;
      }
    }
  }

  /**
   * Removes one instance of an item from the inventory.
   * - If the item is a stackable consumable with count > 1, its count is decremented.
   * - Otherwise (last item in stack or non-consumable), the item slot is removed entirely.
   * @param itemId The ID of the item to remove.
   * @returns True if the item was found and removed/decremented, false otherwise.
   */
  public removeItem(itemId: string): boolean {
    const existingSlot = this.items.get(itemId);

    if (!existingSlot) {
      return false; // Item not found
    }

    if (existingSlot.item.type === 'consumable' && existingSlot.count > 1) {
      existingSlot.count--;
      return true;
    } else {
      // Remove the slot entirely if it's the last one or a non-consumable
      this.items.delete(itemId);
      return true;
    }
  }

  /**
   * Retrieves an item by its ID without removing it.
   * @param itemId The ID of the item to retrieve.
   * @returns The Item object if found, otherwise undefined.
   */
  public getItem(itemId: string): Item | undefined {
    const slot = this.items.get(itemId);
    return slot ? slot.item : undefined;
  }

  /**
   * Checks if an item with the given ID exists in the inventory.
   * @param itemId The ID of the item to check for.
   * @returns True if the item exists, false otherwise.
   */
  public hasItem(itemId: string): boolean {
    return this.items.has(itemId);
  }

  /**
   * Returns an array of all unique Item instances currently in the inventory.
   * For stacked items, only one instance of the item is returned.
   * @returns An array of Item objects.
   */
  public getItems(): Item[] {
    return Array.from(this.items.values()).map(slot => slot.item);
  }

  /**
   * Gets the current count of a specific item in the inventory.
   * For non-stackable items, this will be 1 if present, 0 if not.
   * @param itemId The ID of the item to count.
   * @returns The number of items with the given ID, or 0 if not found.
   */
  public getItemCount(itemId: string): number {
    const slot = this.items.get(itemId);
    return slot ? slot.count : 0;
  }

  /**
   * "Uses" an item, which typically means removing one instance of it from the inventory.
   * - For consumable items, decrements the count or removes the stack if it's the last one.
   * - For non-consumable items, removes the item entirely.
   * - Returns the Item object that was used/removed, or undefined if not found.
   * @param itemId The ID of the item to use.
   * @returns The Item object that was used, or undefined if not found.
   */
  public useItem(itemId: string): Item | undefined {
    const existingSlot = this.items.get(itemId);

    if (!existingSlot) {
      return undefined; // Item not found
    }

    const itemToReturn = existingSlot.item; // Store the item before potential removal

    if (existingSlot.item.type === 'consumable' && existingSlot.count > 1) {
      existingSlot.count--;
    } else {
      // Remove the slot entirely if it's the last one or a non-consumable
      this.items.delete(itemId);
    }

    return itemToReturn;
  }

  /**
   * Checks if the inventory has reached its maximum capacity for unique item slots.
   * @returns True if the inventory is full, false otherwise.
   */
  public isFull(): boolean {
    return this.items.size >= this.MAX_SIZE;
  }

  /**
   * Returns the current number of unique item slots occupied in the inventory.
   * @returns The number of unique item slots.
   */
  public getCurrentSize(): number {
    return this.items.size;
  }

  /**
   * Returns the maximum capacity of the inventory.
   * @returns The maximum number of unique item slots.
   */
  public getMaxCapacity(): number {
    return this.MAX_SIZE;
  }
}