import React, { useState, useEffect, useRef } from 'react';
import styles from './Shop.module.css';
import { useGameContext } from '../../context/GameContext';
import { useKeyboard } from '../../hooks/useKeyboard';
import { ShopItem, Item, ShopState } from '../../types/global.types';

// Helper function to calculate the sell price (50% of buy price)
const getSellPrice = (buyPrice: number): number => Math.floor(buyPrice * 0.5);

const Shop: React.FC = () => {
    const { state, dispatch } = useGameContext();
    const shopState = state.shopState;
    const playerGold = state.player.gold;
    const playerInventory = state.player.inventory;

    // If shopState is not active, don't render the component
    if (!shopState) {
        return null;
    }

    const { npcName, items: shopItems } = shopState;

    // Prepare player's inventory for selling:
    // Only items that are also available in the shop's buy list are considered sellable.
    // Attach their calculated sell price.
    const sellableInventory = playerInventory
        .map(item => {
            const shopItem = shopItems.find(si => si.item.id === item.id);
            if (shopItem) {
                return {
                    ...item,
                    sellPrice: getSellPrice(shopItem.price),
                };
            }
            return null; // Not sellable at this shop
        })
        .filter(Boolean) as (Item & { sellPrice: number })[]; // Filter out nulls and assert type

    const [activePanel, setActivePanel] = useState<'buy' | 'sell'>('buy');
    const [buySelectedIndex, setBuySelectedIndex] = useState(0);
    const [sellSelectedIndex, setSellSelectedIndex] = useState(0);

    const { pressedKeys } = useKeyboard();
    const prevPressedKeys = useRef(new Set<string>());

    // Keyboard input handling for navigation and actions
    useEffect(() => {
        const currentPressedKeys = new Set(pressedKeys);

        // Helper to detect a key press "rising edge" (key just went from not pressed to pressed)
        const keyPressed = (key: string) => currentPressedKeys.has(key) && !prevPressedKeys.current.has(key);

        if (keyPressed('Escape')) {
            dispatch({ type: 'CLOSE_SHOP' });
            return;
        }

        if (keyPressed('Tab')) {
            setActivePanel(prev => (prev === 'buy' ? 'sell' : 'buy'));
            // Note: Preventing default Tab behavior (browser focus change) would require
            // modifying the useKeyboard hook to expose the event object.
        }

        if (activePanel === 'buy') {
            if (keyPressed('ArrowUp')) {
                setBuySelectedIndex(prev => Math.max(0, prev - 1));
            } else if (keyPressed('ArrowDown')) {
                setBuySelectedIndex(prev => Math.min(shopItems.length - 1, prev + 1));
            } else if (keyPressed('Enter') || keyPressed('Space')) {
                if (shopItems.length > 0) {
                    const selectedItem = shopItems[buySelectedIndex];
                    if (playerGold >= selectedItem.price) {
                        if (selectedItem.quantity === -1 || selectedItem.quantity > 0) {
                            dispatch({
                                type: 'BUY_ITEM',
                                payload: { itemId: selectedItem.item.id, price: selectedItem.price },
                            });
                            // The game reducer is responsible for deducting gold, adding item to inventory,
                            // and updating the shop's item quantity.
                        } else {
                            dispatch({ type: 'SHOW_NOTIFICATION', payload: { message: 'Item is out of stock!' } });
                        }
                    } else {
                        dispatch({ type: 'SHOW_NOTIFICATION', payload: { message: 'Not enough gold!' } });
                    }
                }
            }
        } else { // activePanel === 'sell'
            if (keyPressed('ArrowUp')) {
                setSellSelectedIndex(prev => Math.max(0, prev - 1));
            } else if (keyPressed('ArrowDown')) {
                setSellSelectedIndex(prev => Math.min(sellableInventory.length - 1, prev + 1));
            } else if (keyPressed('Enter') || keyPressed('Space')) {
                if (sellableInventory.length > 0) {
                    const selectedItem = sellableInventory[sellSelectedIndex];
                    dispatch({
                        type: 'SELL_ITEM',
                        payload: { itemId: selectedItem.id, price: selectedItem.sellPrice },
                    });
                    // The game reducer is responsible for adding gold and removing item from inventory.
                }
            }
        }

        // Update previous pressed keys for the next render cycle
        prevPressedKeys.current = currentPressedKeys;
    }, [pressedKeys, activePanel, buySelectedIndex, sellSelectedIndex, shopItems, sellableInventory, playerGold, dispatch]);

    // Adjust selected index if the list of items changes (e.g., after buying/selling)
    useEffect(() => {
        setBuySelectedIndex(prev => {
            const maxIndex = shopItems.length > 0 ? shopItems.length - 1 : 0;
            return Math.min(prev, maxIndex);
        });
        setSellSelectedIndex(prev => {
            const maxIndex = sellableInventory.length > 0 ? sellableInventory.length - 1 : 0;
            return Math.min(prev, maxIndex);
        });
    }, [shopItems.length, sellableInventory.length]); // Re-run if list lengths change

    // ASCII border string (adjusted for an 800px wide container with monospace font)
    const borderString = '───────────────────────────────────────────────────────────────────────────────'; // 79 dashes

    return (
        <div className={styles.shopContainer}>
            <div className={styles.borderTop}>┌{borderString}┐</div>
            <div className={styles.contentWrapper}>
                <div className={styles.borderLeft}>│</div>
                <div className={styles.mainContent}>
                    <div className={styles.npcName}>{npcName}</div>
                    <div className={styles.panels}>
                        {/* Buy Panel */}
                        <div className={`${styles.panel} ${activePanel === 'buy' ? styles.activePanel : ''}`}>
                            <div className={styles.panelHeader}>Items for Sale</div>
                            <div className={styles.itemList}>
                                {shopItems.length === 0 ? (
                                    <div className={styles.emptyMessage}>No items available.</div>
                                ) : (
                                    shopItems.map((shopItem, index) => (
                                        <div
                                            key={shopItem.item.id}
                                            className={`${styles.itemEntry} ${buySelectedIndex === index ? styles.selected : ''}`}
                                            onClick={() => {
                                                setActivePanel('buy');
                                                setBuySelectedIndex(index);
                                            }}
                                        >
                                            <div className={styles.itemName}>{shopItem.item.name}</div>
                                            <div className={styles.itemDetails}>
                                                <span className={styles.itemPrice}>Price: {shopItem.price}G</span>
                                                <span className={styles.itemQuantity}>Qty: {shopItem.quantity === -1 ? 'Unlimited' : shopItem.quantity}</span>
                                            </div>
                                            <div className={styles.itemDescription}>{shopItem.item.description}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Sell Panel */}
                        <div className={`${styles.panel} ${activePanel === 'sell' ? styles.activePanel : ''}`}>
                            <div className={styles.panelHeader}>Your Inventory</div>
                            <div className={styles.itemList}>
                                {sellableInventory.length === 0 ? (
                                    <div className={styles.emptyMessage}>No sellable items.</div>
                                ) : (
                                    sellableInventory.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className={`${styles.itemEntry} ${sellSelectedIndex === index ? styles.selected : ''}`}
                                            onClick={() => {
                                                setActivePanel('sell');
                                                setSellSelectedIndex(index);
                                            }}
                                        >
                                            <div className={styles.itemName}>{item.name}</div>
                                            <div className={styles.itemDetails}>
                                                <span className={styles.itemPrice}>Sell: {item.sellPrice}G</span>
                                            </div>
                                            <div className={styles.itemDescription}>{item.description}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={styles.playerInfo}>
                        <div className={styles.gold}>Gold: {playerGold}G</div>
                        <div className={styles.controls}>
                            [Tab] Switch Panel | [Arrows] Navigate | [Enter/Space] Buy/Sell | [Esc] Close
                        </div>
                    </div>
                </div>
                <div className={styles.borderRight}>│</div>
            </div>
            <div className={styles.borderBottom}>└{borderString}┘</div>
        </div>
    );
};

export default Shop;

