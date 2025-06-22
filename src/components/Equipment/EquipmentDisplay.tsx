import React from 'react';
import styles from './Equipment.module.css'; // CSS module for styling

// Import necessary types and the Player class from their respective files
// Player class, EquippableItem interface, and EquipmentSlotType are defined in Player.ts
import { Player as PlayerClass, EquippableItem, EquipmentSlotType } from '../../models/Player';
// PlayerStats interface is defined in global.types.ts
import { PlayerStats } from '../../types/global.types';

// --- Component Props Interface ---
interface EquipmentDisplayProps {
  player: PlayerClass; // The Player class instance, providing equipped items and calculated stats
  onClose: () => void; // Function to call when the close button is clicked
  onUnequip: (slotType: EquipmentSlotType) => void; // Function to call when an equipped item is clicked
}

// --- EquipmentDisplay React Component ---
const EquipmentDisplay: React.FC<EquipmentDisplayProps> = ({ player, onClose, onUnequip }) => {
  // Define the structure for each equipment slot to easily map and render them.
  // This array holds the label, the slot type, and the currently equipped item (if any).
  const slots: { label: string; type: EquipmentSlotType; item?: EquippableItem }[] = [
    { label: 'Weapon', type: 'weapon', item: player.weaponSlot },
    { label: 'Armor', type: 'armor', item: player.armorSlot },
    { label: 'Accessory', type: 'accessory', item: player.accessorySlot },
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.equipmentContainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Equipment</h2>
          {/* Close button to exit the equipment view */}
          <button className={styles.closeButton} onClick={onClose}>
            X
          </button>
        </div>

        <div className={styles.slotsContainer}>
          {slots.map((slot) => (
            <div
              key={slot.type} // Unique key for React list rendering
              // Apply different styles based on whether the slot is empty or has an item
              className={`${styles.slot} ${slot.item ? styles.equippedSlot : styles.emptySlot}`}
              // Allow unequipping by clicking on an equipped item. Empty slots are not clickable.
              onClick={() => slot.item && onUnequip(slot.type)}
            >
              <div className={styles.slotLabel}>{slot.label}</div>
              {slot.item ? (
                <>
                  {/* Display the name of the equipped item */}
                  <div className={styles.itemName}>{slot.item.name}</div>
                  <div className={styles.itemStats}>
                    {/* Display item-specific stat bonuses.
                        Only show if the stat exists and is not zero, with a '+' prefix for positive bonuses. */}
                    {slot.item.stats?.attack !== undefined && slot.item.stats.attack !== 0 && (
                      <span>ATK: {slot.item.stats.attack > 0 ? '+' : ''}{slot.item.stats.attack} </span>
                    )}
                    {slot.item.stats?.defense !== undefined && slot.item.stats.defense !== 0 && (
                      <span>DEF: {slot.item.stats.defense > 0 ? '+' : ''}{slot.item.stats.defense} </span>
                    )}
                    {slot.item.stats?.speed !== undefined && slot.item.stats.speed !== 0 && (
                      <span>SPD: {slot.item.stats.speed > 0 ? '+' : ''}{slot.item.stats.speed}</span>
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.emptyText}>Empty</div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.totalStats}>
          <h3>Total Stats</h3>
          {/* Display the player's total stats, which are calculated by the Player class's 'stats' getter
              and include all equipment bonuses. */}
          <p>Attack: {player.stats.attack}</p>
          <p>Defense: {player.stats.defense}</p>
          <p>Speed: {player.stats.speed}</p>
          {/* Include other relevant total stats */}
          <p>Max HP: {player.stats.maxHp}</p>
          <p>Max Energy: {player.stats.maxEnergy}</p>
          <p>Level: {player.stats.level}</p>
          <p>Experience: {player.stats.exp}</p>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDisplay;