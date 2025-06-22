import React from 'react';
import styles from './CharacterScreen.module.css';
import { Player, EquipmentSlotType } from '../../models/Player';
import { Item } from '../../types/global.types';
import { TalentTree, Talent, TalentEffectType, TalentSpecialEffect } from '../../models/TalentTree'; // Import TalentTree and Talent

interface CharacterScreenProps {
  player: Player;
  onClose: () => void;
  onEquipItem: (itemId: string) => void;
  onUnequipItem: (slotType: EquipmentSlotType) => void;
  // Add new props for talent system
  onSpendTalentPoint: (talentId: string) => void;
  onResetTalents: () => void;
}

const CharacterScreen: React.FC<CharacterScreenProps> = ({
  player,
  onClose,
  onEquipItem,
  onUnequipItem,
  onSpendTalentPoint, // Destructure new props
  onResetTalents,     // Destructure new props
}) => {
  // Get player stats
  const stats = player.stats;
  const baseStats = player.getBaseStats();

  // Define the structure for equipment slots
  const slots: { label: string; type: EquipmentSlotType; item?: any }[] = [
    { label: 'Weapon', type: 'weapon', item: player.weaponSlot },
    { label: 'Armor', type: 'armor', item: player.armorSlot },
    { label: 'Accessory', type: 'accessory', item: player.accessorySlot },
  ];

  // Filter inventory to show only equipment items
  const equipmentItems = player.inventory.filter(item => item.type === 'equipment');

  // Get talent data
  const availableTalentPoints = player.talentPoints; // Player's master pool of points
  const talents = Array.from(player.talentTree.getAllTalents().values()); // Get all talents as an array

  // Helper to check if any talent has points invested for reset button
  const hasInvestedTalentPoints = talents.some(talent => talent.currentRank > 0);

  // Helper function to render talent effects
  const renderTalentEffects = (talent: Talent) => {
    if (talent.currentRank === 0) {
      return <div className={styles.talentEffect}>Invest points to unlock effects.</div>;
    }

    return talent.effects.map((effect, index) => {
      let effectText = '';
      if (effect.type === 'damage_bonus' || effect.type === 'heal_bonus' || effect.type === 'defense_bonus') {
        // These are cumulative per rank
        const totalBonusPercentage = (effect.value * talent.currentRank * 100).toFixed(0);
        effectText = `+${totalBonusPercentage}% ${effect.type.replace('_bonus', '')}`;
      } else if (effect.type === 'cost_reduction') {
        // Assuming cost reduction is flat per rank
        const totalReductionAmount = (effect.value * talent.currentRank).toFixed(0);
        effectText = `-${totalReductionAmount} cost`;
      } else if (effect.type === 'special' && effect.specialEffect) {
        let specialEffectDescription = '';
        switch (effect.specialEffect) {
          case 'remove_buffs': specialEffectDescription = 'remove enemy buffs'; break;
          case 'group_heal': specialEffectDescription = 'group healing'; break;
          case 'stun': specialEffectDescription = 'stun enemies'; break;
          case 'reveal_weakness': specialEffectDescription = 'reveal enemy weaknesses'; break;
          default: specialEffectDescription = effect.specialEffect; break;
        }

        // Special effects only apply if currentRank meets appliesAtRank
        if (effect.appliesAtRank && talent.currentRank < effect.appliesAtRank) {
          // If not yet active, show what it unlocks
          effectText = `Unlocks: ${specialEffectDescription} at Rank ${effect.appliesAtRank}`;
          if (effect.chance) {
            effectText += ` (${(effect.chance * 100).toFixed(0)}% chance)`;
          }
        } else {
          // If active, show the effect
          effectText = `Active: ${specialEffectDescription}`;
          if (effect.chance) {
            effectText += ` (${(effect.chance * 100).toFixed(0)}% chance)`;
          }
        }
      }
      return effectText ? <div key={index} className={styles.talentEffect}>{effectText}</div> : null;
    });
  };


  return (
    <div className={styles.overlay}>
      <div className={styles.characterScreenContainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Character Screen</h2>
          <button className={styles.closeButton} onClick={onClose}>
            X
          </button>
        </div>

        <div className={styles.content}>
          {/* Stats Section */}
          <div className={styles.statsSection}>
            <h3>Player Stats</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Level:</span>
                <span className={styles.statValue}>{stats.level}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Experience:</span>
                <span className={styles.statValue}>{stats.exp} XP</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>HP:</span>
                <span className={styles.statValue}>{stats.hp} / {stats.maxHp}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Energy:</span>
                <span className={styles.statValue}>{stats.energy} / {stats.maxEnergy}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Attack:</span>
                <span className={styles.statValue}>
                  {stats.attack}
                  {stats.attack !== baseStats.attack && (
                    <span className={styles.statBonus}> ({baseStats.attack} + {stats.attack - baseStats.attack})</span>
                  )}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Defense:</span>
                <span className={styles.statValue}>
                  {stats.defense}
                  {stats.defense !== baseStats.defense && (
                    <span className={styles.statBonus}> ({baseStats.defense} + {stats.defense - baseStats.defense})</span>
                  )}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Speed:</span>
                <span className={styles.statValue}>
                  {stats.speed}
                  {stats.speed !== baseStats.speed && (
                    <span className={styles.statBonus}> ({baseStats.speed} + {stats.speed - baseStats.speed})</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Equipment Section */}
          <div className={styles.equipmentSection}>
            <h3>Equipment</h3>
            <div className={styles.equipmentSlots}>
              {slots.map((slot) => (
                <div
                  key={slot.type}
                  className={`${styles.equipmentSlot} ${slot.item ? styles.equippedSlot : styles.emptySlot}`}
                  onClick={() => slot.item && onUnequipItem(slot.type)}
                >
                  <div className={styles.slotLabel}>{slot.label}</div>
                  {slot.item ? (
                    <>
                      <div className={styles.itemName}>{slot.item.name}</div>
                      <div className={styles.itemStats}>
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
          </div>

          {/* Inventory Section - Equipment Only */}
          <div className={styles.inventorySection}>
            <h3>Equipment Inventory</h3>
            {equipmentItems.length === 0 ? (
              <p className={styles.emptyMessage}>No equipment in inventory</p>
            ) : (
              <div className={styles.inventoryGrid}>
                {equipmentItems.map((item) => (
                  <div
                    key={item.id}
                    className={styles.inventoryItem}
                    onClick={() => onEquipItem(item.id)}
                  >
                    <div className={styles.itemName}>{item.name}</div>
                    {item.stats && (
                      <div className={styles.itemPreview}>
                        {item.stats.attack !== undefined && item.stats.attack !== 0 && (
                          <span>ATK: {item.stats.attack > 0 ? '+' : ''}{item.stats.attack} </span>
                        )}
                        {item.stats.defense !== undefined && item.stats.defense !== 0 && (
                          <span>DEF: {item.stats.defense > 0 ? '+' : ''}{item.stats.defense} </span>
                        )}
                        {item.stats.speed !== undefined && item.stats.speed !== 0 && (
                          <span>SPD: {item.stats.speed > 0 ? '+' : ''}{item.stats.speed}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Talents Section */}
          <div className={styles.talentSection}>
            <h3>Talents</h3>
            <div className={styles.talentPoints}>Available Talent Points: {availableTalentPoints}</div>
            <div className={styles.talentGrid}>
              {talents.map((talent) => (
                <div key={talent.id} className={styles.talentItem}>
                  <div className={styles.talentName}>{talent.name}</div>
                  <div className={styles.talentDescription}>{talent.description}</div>
                  <div className={styles.talentRank}>Rank: {talent.currentRank} / {talent.maxRank}</div>
                  <div className={styles.talentEffects}>
                    {renderTalentEffects(talent)}
                  </div>
                  <div className={styles.talentControls}>
                    <button
                      className={styles.talentButton}
                      onClick={() => onSpendTalentPoint(talent.id)}
                      disabled={availableTalentPoints === 0 || talent.currentRank >= talent.maxRank}
                    >
                      Invest Point (+)
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              className={styles.resetButton}
              onClick={onResetTalents}
              disabled={!hasInvestedTalentPoints}
            >
              Reset All Talents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterScreen;
