// src/engine/UIManager.ts

/**
 * UIManager - Centralized management for UI panels
 * Ensures only one modal panel is open at a time and handles proper z-index layering
 */

export type UIPanel = 
  | 'inventory'
  | 'questLog'
  | 'characterScreen'
  | 'shop'
  | 'factionStatus'
  | 'dialogue'; // Dialogue is special, can overlay other panels

export interface UIPanelState {
  activePanel: UIPanel | null;
  previousPanel: UIPanel | null; // For returning after dialogue
  isDialogueActive: boolean;
}

export class UIManager {
  private static instance: UIManager;
  
  // Z-index values for consistent layering
  static readonly Z_INDEX = {
    GAME_BOARD: 1,
    MINIMAP: 100,
    QUEST_TRACKER: 100,
    WEATHER_DISPLAY: 100,
    HOTBAR: 200,
    PANELS: 500,      // Base for all modal panels
    SHOP: 600,        // Shop is slightly higher
    DIALOGUE: 1000,   // Dialogue always on top
    NOTIFICATION: 1100,
    DEBUG: 9999,
  };

  private constructor() {}

  static getInstance(): UIManager {
    if (!UIManager.instance) {
      UIManager.instance = new UIManager();
    }
    return UIManager.instance;
  }

  /**
   * Get the appropriate action to open a panel
   * This ensures other panels are closed first
   */
  static getOpenPanelAction(panel: UIPanel): any[] {
    const actions: any[] = [];
    
    // First, close all other panels
    if (panel !== 'inventory') { actions.push({ type: 'SHOW_INVENTORY', payload: { show: false } }); }
    if (panel !== 'questLog') { actions.push({ type: 'SHOW_QUEST_LOG', payload: { show: false } }); }
    if (panel !== 'characterScreen') { actions.push({ type: 'SHOW_CHARACTER_SCREEN', payload: { show: false } }); }
    if (panel !== 'factionStatus') { actions.push({ type: 'SHOW_FACTION_STATUS', payload: { show: false } }); }
    if (panel !== 'shop') { actions.push({ type: 'CLOSE_SHOP' }); }
    
    // Then open the requested panel
    switch (panel) {
      case 'inventory':
        actions.push({ type: 'SHOW_INVENTORY', payload: { show: true } });
        break;
      case 'questLog':
        actions.push({ type: 'SHOW_QUEST_LOG', payload: { show: true } });
        break;
      case 'characterScreen':
        actions.push({ type: 'SHOW_CHARACTER_SCREEN', payload: { show: true } });
        break;
      case 'factionStatus':
        actions.push({ type: 'SHOW_FACTION_STATUS', payload: { show: true } });
        break;
      // Shop is handled differently through OPEN_SHOP action
    }
    
    return actions;
  }

  /**
   * Get the action to close all panels
   */
  static getCloseAllPanelsAction(): any[] {
    return [
      { type: 'SHOW_INVENTORY', payload: { show: false } },
      { type: 'SHOW_QUEST_LOG', payload: { show: false } },
      { type: 'SHOW_CHARACTER_SCREEN', payload: { show: false } },
      { type: 'SHOW_FACTION_STATUS', payload: { show: false } },
      { type: 'CLOSE_SHOP' },
    ];
  }

  /**
   * Check if any modal panel is currently open
   */
  static isAnyPanelOpen(state: any): boolean {
    return (
      state.showInventory ||
      state.showQuestLog ||
      state.showCharacterScreen ||
      state.showFactionStatus ||
      state.shopState !== null
    );
  }

  /**
   * Get the currently active panel
   */
  static getActivePanel(state: any): UIPanel | null {
    if (state.showInventory) { return 'inventory'; }
    if (state.showQuestLog) { return 'questLog'; }
    if (state.showCharacterScreen) { return 'characterScreen'; }
    if (state.showFactionStatus) { return 'factionStatus'; }
    if (state.shopState) { return 'shop'; }
    return null;
  }
}