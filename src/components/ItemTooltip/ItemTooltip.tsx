import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import styles from './ItemTooltip.module.css';
import { Item } from '../../models/Item'; // Import the Item class
import { Player } from '../../models/Player'; // Import Player
// import { ItemType } from '../../types/global.types'; // Unused import

enum ItemRarity {
  Common = 'Common',
  Uncommon = 'Uncommon',
  Rare = 'Rare',
  Epic = 'Epic',
  Legendary = 'Legendary',
  Unique = 'Unique', // For special quest/key items or very unique artifacts
}

const getItemRarity = (item: Item): ItemRarity => {
  if (item.type === 'key' || item.type === 'quest') {
    return ItemRarity.Unique;
  }

  if (item.type === 'equipment' && item.stats) {
    const totalStats = (item.stats.attack || 0) + (item.stats.defense || 0) + (item.stats.speed || 0);
    if (totalStats >= 15) { return ItemRarity.Legendary; }
    if (totalStats >= 10) { return ItemRarity.Epic; }
    if (totalStats >= 5) { return ItemRarity.Rare; }
    if (totalStats >= 1) { return ItemRarity.Uncommon; }
  }

  if (item.type === 'consumable' && item.value !== undefined) {
    if (item.value >= 999) { return ItemRarity.Legendary; }
    if (item.value >= 100) { return ItemRarity.Epic; }
    if (item.value >= 30) { return ItemRarity.Rare; }
    if (item.value >= 20) { return ItemRarity.Uncommon; }
  }

  return ItemRarity.Common;
};

const rarityClassMap: Record<ItemRarity, string> = {
  [ItemRarity.Common]: styles.rarityCommon,
  [ItemRarity.Uncommon]: styles.rarityUncommon,
  [ItemRarity.Rare]: styles.rarityRare,
  [ItemRarity.Epic]: styles.rarityEpic,
  [ItemRarity.Legendary]: styles.rarityLegendary,
  [ItemRarity.Unique]: styles.rarityUnique,
};

const consumableEffectMap: Record<string, string> = {
  restoreHp: 'Restores HP',
  restoreEnergy: 'Restores Energy',
};

interface ItemTooltipProps {
  item: Item | null;
  player: Player | null;
  mouseX: number;
  mouseY: number;
}

const ItemTooltip: React.FC<ItemTooltipProps> = ({ item, player, mouseX, mouseY }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (item && tooltipRef.current) {
      const updatePosition = () => {
        const tooltipWidth = tooltipRef.current!.offsetWidth;
        const tooltipHeight = tooltipRef.current!.offsetHeight;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let newX = mouseX + 15;
        let newY = mouseY + 15;

        if (newX + tooltipWidth > viewportWidth - 10) {
          newX = mouseX - tooltipWidth - 15;
          if (newX < 10) { newX = 10; }
        }

        if (newY + tooltipHeight > viewportHeight - 10) {
          newY = mouseY - tooltipHeight - 15;
          if (newY < 10) { newY = 10; }
        }

        setPosition({ x: newX, y: newY });
        setIsVisible(true);
      };

      const timeoutId = setTimeout(updatePosition, 0); 
      
      return () => clearTimeout(timeoutId);

    } else {
      setIsVisible(false);
    }
  }, [item, mouseX, mouseY]);

  if (!item) {
    return null;
  }

  const rarity = getItemRarity(item);
  const rarityClassName = rarityClassMap[rarity];

  const getStatDifference = (statName: 'attack' | 'defense' | 'speed') => {
    if (!player || item.type !== 'equipment' || !item.stats || !item.equipmentSlotType) {
      return null;
    }

    const equippedItem = player.getEquippedItems().find(
      (eqItem) => eqItem.equipmentSlotType === item.equipmentSlotType,
    );

    const currentStat = equippedItem?.stats?.[statName] || 0;
    const newItemStat = item.stats[statName] || 0;

    const diff = newItemStat - currentStat;

    if (diff === 0) { return null; }
    
    const sign = diff > 0 ? '+' : '';
    // const diffColor = diff > 0 ? 'green' : 'red'; // Unused variable

    return (
      <span className={diff > 0 ? styles.statPositive : styles.statNegative}>
        ({sign}{diff})
      </span>
    );
  };

  const tooltipStyle: CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.2s ease-in',
    pointerEvents: 'none',
    zIndex: 1000,
  };

  return (
    <div ref={tooltipRef} className={styles.tooltip} style={tooltipStyle}>
      <h3 className={`${styles.itemName} ${rarityClassName}`}>{item.name}</h3>
      
      <p className={styles.itemDescription}>{item.description}</p>

      {item.type === 'equipment' && item.stats && (
        <div className={styles.itemStats}>
          <h4>Stats:</h4>
          {item.stats.attack !== undefined && (
            <p>Attack: {item.stats.attack} {getStatDifference('attack')}</p>
          )}
          {item.stats.defense !== undefined && (
            <p>Defense: {item.stats.defense} {getStatDifference('defense')}</p>
          )}
          {item.stats.speed !== undefined && (
            <p>Speed: {item.stats.speed} {getStatDifference('speed')}</p>
          )}
        </div>
      )}

      {item.type === 'consumable' && item.effect && item.value !== undefined && (
        <div className={styles.itemEffect}>
          <h4>Effect:</h4>
          <p>{consumableEffectMap[item.effect] || item.effect}: {item.value}</p>
        </div>
      )}

      <div className={styles.itemMeta}>
        <p>Type: {item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
        <p>Rarity: <span className={rarityClassName}>{rarity}</span></p>
      </div>
    </div>
  );
};

export default ItemTooltip;