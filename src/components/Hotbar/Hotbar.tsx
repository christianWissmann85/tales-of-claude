import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Hotbar.module.css';

// Import necessary models and types
import { Item, ItemVariant } from '../../models/Item';
import { Inventory } from '../../models/Inventory';
import { Player } from '../../models/Player';

// Define ITEM_EMOJIS for the hotbar
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

// Define Cooldowns type: maps itemId to the timestamp (ms) when its cooldown ends
interface Cooldowns {
  [itemId: string]: number;
}

interface HotbarProps {
  inventory: Inventory; // The player's inventory instance
  player: Player; // The player instance to check equipped items
  onUseItem: (itemId: string, quantity?: number) => void; // Callback to use an item
  // The hotbar configuration is an array of item IDs (or null for empty slots)
  initialHotbarConfig: (string | null)[];
  // Callback to notify the parent component when the hotbar configuration changes
  onHotbarConfigChange: (newConfig: (string | null)[]) => void;
}

const HOTBAR_SIZE = 5; // Number of hotbar slots
const ITEM_COOLDOWN_MS = 1000; // Default cooldown duration for items in milliseconds (e.g., 1 second)

const Hotbar: React.FC<HotbarProps> = ({
  inventory,
  player,
  onUseItem,
  initialHotbarConfig,
  onHotbarConfigChange,
}) => {
  // State to manage the items in each hotbar slot (stores item IDs)
  const [hotbarSlots, setHotbarSlots] = useState<(string | null)[]>(initialHotbarConfig);
  // State to highlight the currently active slot (e.g., when a key is pressed)
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  // State to manage item cooldowns
  const [cooldowns, setCooldowns] = useState<Cooldowns>({});

  // Ref for the hotbar container to handle outside clicks for context menu
  const hotbarRef = useRef<HTMLDivElement>(null);

  // Sync internal hotbarSlots state with the initialHotbarConfig prop
  useEffect(() => {
    setHotbarSlots(initialHotbarConfig);
  }, [initialHotbarConfig]);

  // Helper function to get the appropriate emoji for an item
  const getItemEmoji = useCallback((item: Item): string => {
    return ITEM_EMOJIS[item.id as ItemVariant] || ITEM_EMOJIS[item.type] || ITEM_EMOJIS['default'];
  }, []);

  // Helper function to check if an item is currently equipped by the player
  const isItemEquipped = useCallback((itemId: string): boolean => {
    return player.getEquippedItems().some(equippedItem => equippedItem.id === itemId);
  }, [player]);

  // --- Drag and Drop Handlers ---

  // Prevents default behavior to allow dropping
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add(styles.dragOver); // Add visual feedback
  };

  // Removes visual feedback when dragging leaves the slot
  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove(styles.dragOver);
  };

  // Handles dropping an item onto a hotbar slot
  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dragOver);

    const itemId = e.dataTransfer.getData('text/plain'); // Get the item ID from the dragged data
    if (!itemId) { return; }

    // Check if the item exists in the inventory before adding to hotbar
    if (inventory.getItemCount(itemId) === 0) {
      console.warn(`Cannot add ${itemId} to hotbar: not found in inventory.`);
      return;
    }

    // Update the hotbar slots state
    const newHotbarSlots = [...hotbarSlots];
    newHotbarSlots[slotIndex] = itemId;
    setHotbarSlots(newHotbarSlots);
    onHotbarConfigChange(newHotbarSlots); // Notify parent of the change
  };

  // Handles starting a drag operation from a hotbar slot (e.g., to clear it by dragging out)
  const handleHotbarItemDragStart = (e: React.DragEvent, slotIndex: number) => {
    const itemId = hotbarSlots[slotIndex];
    if (itemId) {
      e.dataTransfer.setData('text/plain', itemId); // Set item ID for potential drops elsewhere
      e.dataTransfer.setData('hotbar/slot-index', String(slotIndex)); // Indicate source slot
      e.dataTransfer.effectAllowed = 'move'; // Suggests a move operation
      e.currentTarget.classList.add(styles.dragging); // Visual feedback for the dragged item
    } else {
      e.preventDefault(); // Prevent dragging empty slots
    }
  };

  // Handles the end of a drag operation from a hotbar slot
  const handleHotbarItemDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove(styles.dragging);
    // Note: Clearing a slot by dragging out is complex.
    // It would require a global drop target (e.g., the game canvas) to listen for drops
    // from hotbar items and then call a clear function.
    // For simplicity, clearing is primarily handled by right-click.
  };

  // --- Item Usage and Cooldowns ---

  // Function to use an item from a specific hotbar slot
  const useItemFromHotbar = useCallback((slotIndex: number) => {
    const itemId = hotbarSlots[slotIndex];
    if (!itemId) { return; } // Do nothing if slot is empty

    const currentTime = Date.now();
    const cooldownEndTime = cooldowns[itemId];

    // Check if item is on cooldown
    if (cooldownEndTime && currentTime < cooldownEndTime) {
      console.log(`${Item.ITEM_DATA[itemId as ItemVariant]?.name || itemId} is on cooldown.`);
      return;
    }

    // Check if item is available in inventory
    const itemQuantity = inventory.getItemCount(itemId);
    if (itemQuantity === 0) {
      console.log(`${Item.ITEM_DATA[itemId as ItemVariant]?.name || itemId} is out of stock. Clearing hotbar slot.`);
      // If item is out of stock, clear it from the hotbar
      const newHotbarSlots = [...hotbarSlots];
      newHotbarSlots[slotIndex] = null;
      setHotbarSlots(newHotbarSlots);
      onHotbarConfigChange(newHotbarSlots); // Notify parent
      return;
    }

    // Trigger the parent's onUseItem callback (always use 1 from hotbar)
    onUseItem(itemId, 1);

    // Set cooldown for the item
    setCooldowns(prev => ({
      ...prev,
      [itemId]: currentTime + ITEM_COOLDOWN_MS,
    }));
  }, [hotbarSlots, inventory, onUseItem, cooldowns, onHotbarConfigChange]);

  // --- Keyboard Event Listener ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = parseInt(e.key, 10);
      // Check if the pressed key is between 1 and HOTBAR_SIZE
      if (key >= 1 && key <= HOTBAR_SIZE) {
        setActiveSlot(key - 1); // Set active slot (0-indexed)
        useItemFromHotbar(key - 1); // Use the item in that slot
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = parseInt(e.key, 10);
      if (key >= 1 && key <= HOTBAR_SIZE) {
        setActiveSlot(null); // Clear active slot highlight on key release
      }
    };

    // Add event listeners to the window
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup function to remove event listeners on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [useItemFromHotbar]); // Re-run effect if useItemFromHotbar changes

  // --- Cooldown Timer Update ---
  // This effect periodically updates the cooldowns state to show progress
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const newCooldowns: Cooldowns = {};
      let changed = false;

      // Filter out expired cooldowns
      for (const itemId in cooldowns) {
        if (cooldowns[itemId] > currentTime) {
          newCooldowns[itemId] = cooldowns[itemId];
        } else {
          changed = true; // Mark as changed if any cooldown expired
        }
      }
      // Only update state if there was a change (to prevent unnecessary re-renders)
      if (changed) {
        setCooldowns(newCooldowns);
      }
    }, 100); // Update every 100ms for smooth cooldown animation

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [cooldowns]); // Re-run effect if cooldowns state changes

  // --- Context Menu for Clearing Slots ---
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; slotIndex: number | null }>({
    visible: false,
    x: 0,
    y: 0,
    slotIndex: null,
  });

  // Handles right-click on a hotbar slot to open context menu
  const handleSlotRightClick = (e: React.MouseEvent, slotIndex: number) => {
    e.preventDefault(); // Prevent default browser context menu
    // Only show context menu if the slot is not empty
    if (hotbarSlots[slotIndex]) {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        slotIndex: slotIndex,
      });
    }
  };

  // Handles clearing the selected hotbar slot via context menu
  const handleClearSlot = () => {
    if (contextMenu.slotIndex !== null) {
      const newHotbarSlots = [...hotbarSlots];
      newHotbarSlots[contextMenu.slotIndex] = null; // Set slot to null
      setHotbarSlots(newHotbarSlots);
      onHotbarConfigChange(newHotbarSlots); // Notify parent
    }
    setContextMenu({ visible: false, x: 0, y: 0, slotIndex: null }); // Close context menu
  };

  // Effect to close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu.visible && hotbarRef.current && !hotbarRef.current.contains(event.target as Node)) {
        setContextMenu({ visible: false, x: 0, y: 0, slotIndex: null });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu]); // Re-run effect if contextMenu state changes

  return (
    <div className={styles.hotbarContainer} ref={hotbarRef}>
      {Array.from({ length: HOTBAR_SIZE }).map((_, index) => {
        const itemId = hotbarSlots[index];
        // Create a temporary Item instance for display purposes (name, type, emoji)
        const item = itemId ? Item.createItem(itemId as ItemVariant) : null;
        // Get the current quantity of the item from the inventory
        const quantity = itemId ? inventory.getItemCount(itemId) : 0;
        // Check if the item is equipped (only applicable for equipment type items)
        const equipped = item?.type === 'equipment' && isItemEquipped(itemId!);

        // Calculate cooldown remaining and percentage for visual feedback
        const cooldownRemaining = itemId ? Math.max(0, (cooldowns[itemId] || 0) - Date.now()) : 0;
        const isOnCooldown = cooldownRemaining > 0;
        const cooldownPercentage = isOnCooldown ? (cooldownRemaining / ITEM_COOLDOWN_MS) * 100 : 0;

        return (
          <div
            key={index}
            className={`${styles.hotbarSlot} ${activeSlot === index ? styles.active : ''} ${isOnCooldown ? styles.onCooldown : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onContextMenu={(e) => handleSlotRightClick(e, index)}
            draggable={!!item} // Only allow dragging if there's an item in the slot
            onDragStart={(e) => handleHotbarItemDragStart(e, index)}
            onDragEnd={handleHotbarItemDragEnd}
            onClick={() => item && useItemFromHotbar(index)} // Allow clicking to use item
          >
            {item ? (
              <>
                <div className={styles.itemIcon}>{getItemEmoji(item)}</div>
                <span className={styles.itemName}>{item.name}</span>
                {quantity > 1 && (
                  <span className={styles.quantityBadge}>x{quantity}</span>
                )}
                {item.type === 'equipment' && equipped && (
                  <span className={styles.equippedIndicator}>E</span>
                )}
                {isOnCooldown && (
                  <div className={styles.cooldownOverlay} style={{ height: `${cooldownPercentage}%` }}>
                    {/* Display cooldown timer if remaining time is significant */}
                    {cooldownRemaining > 100 && (
                      <span className={styles.cooldownTimer}>{Math.ceil(cooldownRemaining / 1000)}s</span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptySlotContent}></div> // Empty content for empty slots
            )}
            <span className={styles.keybind}>{index + 1}</span> {/* Keybind number */}
          </div>
        );
      })}

      {/* Context Menu for Hotbar Slots */}
      {contextMenu.visible && contextMenu.slotIndex !== null && hotbarSlots[contextMenu.slotIndex] && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button onClick={handleClearSlot}>Clear Slot</button>
        </div>
      )}
    </div>
  );
};

export default Hotbar;