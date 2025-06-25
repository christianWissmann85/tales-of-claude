// src/engine/StableUIManager.ts

import { UIManager, UIPanel } from './UIManager';
import { criticalSectionManager, actionQueueManager } from '../utils/inputStabilizer';

/**
 * Enhanced UIManager with stability features
 * - Prevents race conditions during panel transitions
 * - Queues panel actions to prevent conflicts
 * - Uses critical sections to block input during transitions
 */
export class StableUIManager {
  private static TRANSITION_DURATION = 150; // ms for panel transition animations
  
  /**
   * Open a panel with stability checks
   * Uses critical sections to prevent input during transition
   */
  static async openPanelSafely(
    panel: UIPanel, 
    dispatch: (action: any) => void
  ): Promise<void> {
    // Try to acquire lock for UI transition
    if (!criticalSectionManager.lock('ui_transition', this.TRANSITION_DURATION)) {
      console.warn(`[StableUIManager] Cannot open ${panel} - UI transition in progress`);
      return;
    }
    
    // Queue the panel opening actions
    actionQueueManager.enqueue(async () => {
      const actions = UIManager.getOpenPanelAction(panel);
      actions.forEach(action => dispatch(action));
    }, `open_panel_${panel}`);
  }
  
  /**
   * Close all panels with stability checks
   */
  static async closeAllPanelsSafely(dispatch: (action: any) => void): Promise<void> {
    // Try to acquire lock for UI transition
    if (!criticalSectionManager.lock('ui_transition', this.TRANSITION_DURATION)) {
      console.warn('[StableUIManager] Cannot close panels - UI transition in progress');
      return;
    }
    
    // Queue the close actions
    actionQueueManager.enqueue(async () => {
      const actions = UIManager.getCloseAllPanelsAction();
      actions.forEach(action => dispatch(action));
    }, 'close_all_panels');
  }
  
  /**
   * Toggle a panel with stability checks
   * Prevents rapid toggling that could cause state conflicts
   */
  static async togglePanelSafely(
    panel: UIPanel,
    currentState: any,
    dispatch: (action: any) => void
  ): Promise<void> {
    // Check if we're already in a transition
    if (criticalSectionManager.isLocked('ui_transition')) {
      console.warn(`[StableUIManager] Cannot toggle ${panel} - UI transition in progress`);
      return;
    }
    
    const isCurrentlyOpen = this.isPanelOpen(panel, currentState);
    
    if (isCurrentlyOpen) {
      await this.closeAllPanelsSafely(dispatch);
    } else {
      await this.openPanelSafely(panel, dispatch);
    }
  }
  
  /**
   * Check if a specific panel is open
   */
  static isPanelOpen(panel: UIPanel, state: any): boolean {
    switch (panel) {
      case 'inventory':
        return state.showInventory;
      case 'questLog':
        return state.showQuestLog;
      case 'characterScreen':
        return state.showCharacterScreen;
      case 'factionStatus':
        return state.showFactionStatus;
      case 'shop':
        return state.shopState !== null;
      case 'dialogue':
        return state.dialogue !== null;
      default:
        return false;
    }
  }
  
  /**
   * Get panel transition state for animations
   */
  static getPanelTransitionState(): {
    isTransitioning: boolean;
    canAcceptInput: boolean;
  } {
    const isTransitioning = criticalSectionManager.isLocked('ui_transition');
    const queueSize = actionQueueManager.size();
    
    return {
      isTransitioning,
      canAcceptInput: !isTransitioning && queueSize === 0
    };
  }
  
  /**
   * Force clear all locks and queues (emergency recovery)
   */
  static emergencyReset(): void {
    console.warn('[StableUIManager] Emergency reset triggered');
    criticalSectionManager.release('ui_transition');
    actionQueueManager.clear();
  }
}