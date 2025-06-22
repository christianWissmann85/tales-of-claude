import React from 'react';
import styles from './Inventory.module.css';

// --- Assumed Imports for Inventory and Item Types ---
// In a full project, these would be imported from their respective files:
// import { Inventory } from '../../models/Inventory';
// import { Item } from '../../models/Item'; // Assuming src/models/Item.ts exports a class named Item
// import { ItemType } from '../../types/global.types'; // Assuming this defines ItemType

// For the purpose of this single-file output, we define a minimal interface
// that the actual Item class is expected to conform to.
interface Item {
  id: string;
  name: string;
  description: string; // Not used in UI, but common for items
  type: 'consumable' | 'equipment' | 'key' | 'quest'; // Item types
}

// We also need a placeholder for the Inventory class methods used by the UI.
// In a real application, this would be the actual Inventory class imported.
// The provided Inventory.ts file defines the Inventory class.
interface Inventory {
  getItems(): Item[]; // Returns an array of unique Item instances
  getItemCount(itemId: string): number; // Returns the count for a specific item ID
  getCurrentSize(): number; // Returns the number of unique item slots
}

// --- Component Props Interface ---
interface InventoryProps {
  inventory: Inventory; // An instance of the Inventory class
  onClose: () => void; // Callback function to close the inventory UI
  onUseItem: (itemId: string) => void; // Callback function when an item is clicked to be used
}

// --- Inventory UI Component ---
const Inventory: React.FC<InventoryProps> = ({ inventory, onClose, onUseItem }) => {
  // Get all unique item instances from the inventory.
  // We cast to our local `Item[]` interface for type safety within this component.
  const items = inventory.getItems() as Item[];

  return (
    <div className={styles.inventoryContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Inventory</h2>
        {/* Close button in the top right corner */}
        <button className={styles.closeButton} onClick={onClose}>
          X
        </button>
      </div>

      {/* Conditional rendering: Show "Empty" message if no items, otherwise show the grid */}
      {items.length === 0 ? (
        <p className={styles.emptyMessage}>Your inventory is empty.</p>
      ) : (
        <div className={styles.inventoryGrid}>
          {items.map((item) => {
            // Get the current count for each item from the inventory object
            const count = inventory.getItemCount(item.id);
            return (
              <div
                key={item.id} // Unique key for React list rendering
                className={styles.gridItem}
                // Call the onUseItem callback when an item slot is clicked
                onClick={() => onUseItem(item.id)}
              >
                <span className={styles.itemName}>{item.name}</span>
                {/* Display quantity only for 'consumable' items if their count is greater than 1 */}
                {item.type === 'consumable' && count > 1 && (
                  <span className={styles.itemQuantity}>x{count}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Inventory;