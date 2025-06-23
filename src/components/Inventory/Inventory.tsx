import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Inventory.module.css';

// Import the actual Player and Item models
import { Inventory } from '../../models/Inventory'; // Assuming Inventory class has getTotalItemCount and getMaxCapacity
import { Item, ItemVariant } from '../../models/Item'; // ItemVariant needed for specific emojis
import { Player } from '../../models/Player';

// --- Component Props Interface ---
interface InventoryProps {
  inventory: Inventory; // An instance of the Inventory class
  onClose: () => void; // Callback function to close the inventory UI
  onUseItem: (itemId: string, quantity?: number) => void; // Callback function when an item is clicked to be used (for consumables/keys/quests)
  player: Player; // The Player instance to check equipped items
  onEquipItem: (itemId: string) => void; // Callback function to equip/unequip an item
  onDropItem?: (itemId: string, quantity: number) => void; // Optional callback to drop an item
}

// --- Constants ---
type TabType = 'consumables' | 'equipment' | 'quest';
type SortOrder = 'name' | 'type' | 'value';

// Placeholder if Inventory model doesn't provide max capacity.
// In a real application, Inventory.ts would likely have a `capacity` property.
const MAX_INVENTORY_SLOTS = 50; 

const ITEM_EMOJIS: Record<ItemVariant | 'default' | 'consumable' | 'equipment' | 'quest' | 'key', string> = {
  'default': '❓',
  'consumable': '🧪',
  'equipment': '⚔️',
  'quest': '📜',
  'key': '🔑',
  [ItemVariant.HealthPotion]: '❤️',
  [ItemVariant.EnergyDrink]: '⚡',
  [ItemVariant.DebugTool]: '🔧',
  [ItemVariant.MegaPotion]: '💖',
  [ItemVariant.CompilerKey]: '🔑',
  [ItemVariant.CodeFragment]: '📄',
  [ItemVariant.UltraPotion]: '✨',
  [ItemVariant.RustySword]: '🗡️',
  [ItemVariant.DebuggerBlade]: '🔪',
  [ItemVariant.RefactorHammer]: '🔨',
  [ItemVariant.DebugBlade]: '🔪',
  [ItemVariant.BasicShield]: '🛡️',
  [ItemVariant.FirewallArmor]: '🎽',
  [ItemVariant.CompilerPlate]: '🦺',
  [ItemVariant.BinaryShield]: '🛡️',
  [ItemVariant.SpeedRing]: '💍',
  [ItemVariant.PowerAmulet]: '💎',
  [ItemVariant.LuckyCharm]: '🍀',
  [ItemVariant.CompilersCharm]: '🌟',
  [ItemVariant.LogicAnalyzer]: '🔍',
  [ItemVariant.QuantumCore]: '⚛️',
  [ItemVariant.BossKey]: '🗝️',
};

// --- Tooltip State Interface ---
interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  item: Item | null;
}

// --- Context Menu State Interface ---
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  item: Item | null;
}

// --- Inventory UI Component ---
const InventoryComponent: React.FC<InventoryProps> = ({ inventory, onClose, onUseItem, player, onEquipItem, onDropItem }) => {
  const [activeTab, setActiveTab] = useState<TabType>('consumables');
  const [sortOrder, setSortOrder] = useState<SortOrder>('name');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, item: null });
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, item: null });
  const [selectedQuantityItem, setSelectedQuantityItem] = useState<Item | null>(null);
  const [quantityToUse, setQuantityToUse] = useState<number>(1);

  const inventoryRef = useRef<HTMLDivElement>(null);

  // Helper function to check if a given item ID is currently equipped by the player
  const isItemEquipped = useCallback((itemId: string): boolean => {
    return player.getEquippedItems().some(equippedItem => equippedItem.id === itemId);
  }, [player]);

  // Helper to get item emoji
  const getItemEmoji = (item: Item): string => {
    return ITEM_EMOJIS[item.id as ItemVariant] || ITEM_EMOJIS[item.type] || ITEM_EMOJIS['default'];
  };

  // Helper to calculate total item count for capacity
  const calculateTotalItemCount = useCallback((): number => {
    // Assuming inventory.getItems() returns unique Item instances
    // and inventory.getItemCount(id) returns the count for that ID.
    // If Inventory model had getTotalItemCount(), it would be preferred.
    let total = 0;
    inventory.getItems().forEach(item => {
      total += inventory.getItemCount(item.id);
    });
    return total;
  }, [inventory]);

  // Filter and sort items based on current state
  const getFilteredAndSortedItems = useCallback(() => {
    let filteredItems = inventory.getItems().filter(item => {
      // Tab filtering
      if (activeTab === 'consumables' && item.type !== 'consumable') return false;
      if (activeTab === 'equipment' && item.type !== 'equipment') return false;
      if (activeTab === 'quest' && (item.type !== 'quest' && item.type !== 'key')) return false;

      // Search filtering
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      return true;
    });

    // Sort items
    filteredItems.sort((a, b) => {
      if (sortOrder === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortOrder === 'type') {
        return a.type.localeCompare(b.type);
      } else if (sortOrder === 'value') {
        // Define a simple value for sorting: sum of stats for equipment, 'value' for consumables
        const getValue = (item: Item) => {
          if (item.type === 'consumable' && item.value) return item.value;
          if (item.type === 'equipment' && item.stats) {
            return (item.stats.attack || 0) + (item.stats.defense || 0) + (item.stats.speed || 0);
          }
          return 0; // Quest/Key items have no inherent "value" for sorting
        };
        return getValue(b) - getValue(a); // Sort descending by value
      }
      return 0;
    });

    return filteredItems;
  }, [inventory, activeTab, searchQuery, sortOrder]);

  const displayedItems = getFilteredAndSortedItems();

  // Tab count badges
  const getTabCount = useCallback((tab: TabType): number => {
    let count = 0;
    inventory.getItems().forEach(item => {
      if (tab === 'consumables' && item.type === 'consumable') {
        count += inventory.getItemCount(item.id);
      } else if (tab === 'equipment' && item.type === 'equipment') {
        count += inventory.getItemCount(item.id);
      } else if (tab === 'quest' && (item.type === 'quest' || item.type === 'key')) {
        count += inventory.getItemCount(item.id);
      }
    });
    return count;
  }, [inventory]);

  // --- Event Handlers ---

  const handleItemClick = (item: Item, count: number) => {
    setContextMenu({ visible: false, x: 0, y: 0, item: null }); // Close context menu
    if (item.type === 'consumable' || item.type === 'key' || item.type === 'quest') {
      if (count > 1) {
        setSelectedQuantityItem(item);
        setQuantityToUse(1); // Reset to 1 when opening selector
      } else {
        onUseItem(item.id, 1);
      }
    }
    // For equipment, single click just shows tooltip. Double-click or context menu for actions.
  };

  const handleItemDoubleClick = (item: Item) => {
    setContextMenu({ visible: false, x: 0, y: 0, item: null }); // Close context menu
    if (item.type === 'consumable' || item.type === 'key' || item.type === 'quest') {
      onUseItem(item.id, 1); // Use one by default on double click
    } else if (item.type === 'equipment') {
      onEquipItem(item.id);
    }
  };

  const handleRightClick = (e: React.MouseEvent, item: Item) => {
    e.preventDefault(); // Prevent default browser context menu
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item: item,
    });
  };

  const handleContextMenuAction = (action: 'equip' | 'unequip' | 'use' | 'drop') => {
    if (!contextMenu.item) return;
    const item = contextMenu.item;
    const count = inventory.getItemCount(item.id);

    if (action === 'equip' && item.type === 'equipment') {
      onEquipItem(item.id);
    } else if (action === 'unequip' && item.type === 'equipment') {
      // For unequipping, just call equip again - it will swap the item back to inventory
      onEquipItem(item.id);
    } else if (action === 'use') {
      if (item.type === 'consumable' || item.type === 'key' || item.type === 'quest') {
        if (count > 1) {
          setSelectedQuantityItem(item);
          setQuantityToUse(1);
        } else {
          onUseItem(item.id, 1);
        }
      }
    } else if (action === 'drop') {
      // For dropping, always ask for quantity if > 1
      if (count > 1) {
        setSelectedQuantityItem(item);
        setQuantityToUse(1); // Set to 1 for drop quantity selector
      } else {
        onDropItem?.(item.id, 1);
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0, item: null });
  };

  const handleUseQuantity = () => {
    if (selectedQuantityItem) {
      // This function is specifically for 'use' action from quantity selector
      onUseItem(selectedQuantityItem.id, quantityToUse);
      setSelectedQuantityItem(null);
      setQuantityToUse(1);
    }
  };

  const handleDropQuantity = () => {
    if (selectedQuantityItem) {
      // This function is specifically for 'drop' action from quantity selector
      onDropItem?.(selectedQuantityItem.id, quantityToUse);
      setSelectedQuantityItem(null);
      setQuantityToUse(1);
    }
  };

  // Close context menu/quantity selector on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu.visible && inventoryRef.current && !inventoryRef.current.contains(event.target as Node)) {
        setContextMenu({ visible: false, x: 0, y: 0, item: null });
      }
      if (selectedQuantityItem && inventoryRef.current && !inventoryRef.current.contains(event.target as Node)) {
        setSelectedQuantityItem(null);
        setQuantityToUse(1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu, selectedQuantityItem]);

  // Determine current and max capacity
  const currentTotalItems = calculateTotalItemCount();
  // Assuming Inventory class has getMaxCapacity() method, otherwise use fallback
  const maxCapacity = (inventory as any).getMaxCapacity ? (inventory as any).getMaxCapacity() : MAX_INVENTORY_SLOTS;

  return (
    <div className={`${styles.inventoryOverlay} ${styles.visible}`}>
      <div className={styles.inventoryContainer} ref={inventoryRef}>
        <div className={styles.inventoryHeader}>
          <h2 className={styles.inventoryTitle}>Inventory</h2>
          <button className={styles.closeButton} onClick={onClose}>
            X
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tabButton} ${activeTab === 'consumables' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('consumables')}
          >
            Consumables <span className={styles.badge}>{getTabCount('consumables')}</span>
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'equipment' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('equipment')}
          >
            Equipment <span className={styles.badge}>{getTabCount('equipment')}</span>
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'quest' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('quest')}
          >
            Quest Items <span className={styles.badge}>{getTabCount('quest')}</span>
          </button>
        </div>

        {/* Controls: Search, Sort, Capacity */}
        <div className={styles.inventoryControls}>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button className={styles.clearSearchButton} onClick={() => setSearchQuery('')}>
                &times;
              </button>
            )}
          </div>

          <div className={styles.sortOptions}>
            <label htmlFor="sort-by">Sort by:</label>
            <select
              id="sort-by"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className={styles.sortSelect}
            >
              <option value="name">Name</option>
              <option value="type">Type</option>
              <option value="value">Value</option>
            </select>
          </div>

          <div className={styles.capacityIndicator}>
            Capacity: {currentTotalItems}/{maxCapacity}
          </div>
        </div>

        {/* Conditional rendering: Show "Empty" message if no items, otherwise show the grid */}
        {displayedItems.length === 0 ? (
          <p className={styles.emptyMessage}>No items in this category or matching your search.</p>
        ) : (
          <div className={styles.inventoryGrid}>
            {displayedItems.map((item) => {
              const count = inventory.getItemCount(item.id);
              const equipped = isItemEquipped(item.id);

              return (
                <div
                  key={item.id}
                  className={`${styles.itemSlot} ${styles[(item as any).rarity] || ''}`} // Apply rarity color class
                  onMouseEnter={(e) => setTooltip({ visible: true, x: e.clientX + 10, y: e.clientY + 10, item })}
                  onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, item: null })}
                  onClick={() => handleItemClick(item, count)}
                  onDoubleClick={() => handleItemDoubleClick(item)}
                  onContextMenu={(e) => handleRightClick(e, item)}
                >
                  <div className={styles.itemIcon}>{getItemEmoji(item)}</div>
                  <span className={styles.itemName}>{item.name}</span>
                  {count > 1 && (
                    <span className={styles.quantityBadge}>x{count}</span>
                  )}
                  {item.type === 'equipment' && (
                    <span className={`${styles.equippedIndicator} ${equipped ? styles.equipped : ''}`}>
                      {equipped ? 'E' : ''}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tooltip */}
        {tooltip.visible && tooltip.item && (
          <div
            className={styles.tooltip}
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <h3>{tooltip.item.name}</h3>
            <p className={styles.tooltipDescription}>{tooltip.item.description}</p>
            {tooltip.item.type === 'consumable' && tooltip.item.effect && (
              <p className={styles.tooltipEffect}>Effect: {tooltip.item.effect} {tooltip.item.value}</p>
            )}
            {tooltip.item.type === 'equipment' && tooltip.item.stats && (
              <div className={styles.tooltipStats}>
                {tooltip.item.stats.attack && <p>Attack: {tooltip.item.stats.attack}</p>}
                {tooltip.item.stats.defense && <p>Defense: {tooltip.item.stats.defense}</p>}
                {tooltip.item.stats.speed && <p>Speed: {tooltip.item.stats.speed}</p>}
                <p>Slot: {tooltip.item.equipmentSlotType}</p>
              </div>
            )}
            <p className={styles.tooltipType}>Type: {tooltip.item.type}</p>
            <p className={`${styles.tooltipRarity} ${styles[(tooltip.item as any).rarity]}`}>Rarity: {(tooltip.item as any).rarity || 'common'}</p>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu.visible && contextMenu.item && (
          <div
            className={styles.contextMenu}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.item.type === 'equipment' ? (
              <>
                {isItemEquipped(contextMenu.item.id) ? (
                  <button onClick={() => handleContextMenuAction('unequip')}>Unequip</button>
                ) : (
                  <button onClick={() => handleContextMenuAction('equip')}>Equip</button>
                )}
              </>
            ) : (
              <button onClick={() => handleContextMenuAction('use')}>Use</button>
            )}
            {onDropItem && <button onClick={() => handleContextMenuAction('drop')}>Drop</button>}
          </div>
        )}

        {/* Quantity Selector */}
        {selectedQuantityItem && (
          <div className={styles.quantitySelectorOverlay}>
            <div className={styles.quantitySelector}>
              <h3>{selectedQuantityItem.name}</h3>
              <p>Select Quantity ({inventory.getItemCount(selectedQuantityItem.id)} available)</p>
              <input
                type="number"
                min="1"
                max={inventory.getItemCount(selectedQuantityItem.id)}
                value={quantityToUse}
                onChange={(e) => setQuantityToUse(Math.max(1, Math.min(inventory.getItemCount(selectedQuantityItem.id), parseInt(e.target.value) || 1)))}
                className={styles.quantityInput}
              />
              <div className={styles.quantityButtons}>
                <button onClick={selectedQuantityItem.type === 'equipment' ? handleDropQuantity : handleUseQuantity}>
                  {selectedQuantityItem.type === 'equipment' ? 'Drop' : 'Use'} {quantityToUse}
                </button>
                <button onClick={() => setSelectedQuantityItem(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryComponent;