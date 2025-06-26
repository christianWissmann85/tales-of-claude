## Executive Summary: Tales of Claude Strategic Roadmap

This roadmap prioritizes immediate stability, core system completion, and high-impact quality-of-life features to maximize Chris's beta testing satisfaction within a realistic development timeframe.

---

### **Goal:** Deliver a stable, engaging, and feature-rich v0.6.0 build that addresses critical feedback and completes core RPG loops.

### **1. Top 5 Achievable Features (Next 2 Weeks)**

These features offer the highest impact for the effort, directly addressing Chris's feedback and unblocking core gameplay.

1.  **Fix Combat AI & Flow (Est: 5 hrs)**
    *   **Impact:** Makes combat playable and fun.
    *   **Notes:** Enemy must take its turn.
2.  **Functional Equipment System (Est: 8 hrs)**
    *   **Impact:** Enables core RPG progression (loot, stats).
    *   **Notes:** Logic for equip/unequip/swap, stat application.
3.  **Functional Hotbar System (Est: 10 hrs)**
    *   **Impact:** Improves combat usability and item management.
    *   **Notes:** UI, drag-and-drop, key-press usage.
4.  **Fix Save/Load System (Est: 12 hrs)**
    *   **Impact:** Critical for player retention and progress.
    *   **Notes:** Debug `TypeError: Cannot read properties of undefined (reading 'x')` crash.
5.  **Basic Minimap (Est: 15 hrs)**
    *   **Impact:** Significant Quality-of-Life improvement for exploration.
    *   **Notes:** Simple, non-interactive HUD element.

### **2. Best System Enhancements (Biggest Impact for Effort)**

Focus on unblocking gameplay and improving immediate feel.

*   **Combat System:** Fix enemy AI (critical). Balance "Bug Hunt" quest.
*   **Persistence:** Fix Save/Load (critical).
*   **Core RPG Loop:** Implement Equipment & Hotbar systems.
*   **UI/UX Polish:** Standardize `Esc` key, fix `I` key for inventory, consolidate HP/Energy bars.
*   **Navigation:** Implement continuous movement, fix map transition coordinates.

### **3. Realistic Timeline for Next 2 Weeks**

**Phase 1: Stability & QoL (Days 1-2)**
*   **Goal:** Stable, playable build.
*   **Tasks:**
    *   Fix Combat AI (enemy turn).
    *   Fix Inventory `I` key.
    *   Fix Debug Dungeon access & map transition coordinates.
    *   Fix Save/Load crash (`TypeError`).
    *   Implement continuous hold-to-move (WASD/Arrows).
    *   Standardize `Esc` key (close all menus).
    *   Remove redundant second HP/Energy bar.

**Phase 2: Core Systems Completion (Days 3-7)**
*   **Goal:** Fundamental RPG systems fully functional.
*   **Tasks:**
    *   Implement full **Equipment System** (equip/unequip, stat changes).
    *   Implement full **Hotbar System** (visibility, drag-and-drop, usage).
    *   Give player 3 starting talent points.
    *   Re-balance "Bug Hunt" quest (enemy stats, EXP).
    *   Add simple combat victory screen.

**Phase 3: Major Feature Introduction (Days 8-14)**
*   **Goal:** Introduce a high-impact feature.
*   **Tasks:**
    *   Implement a **Basic Minimap**.
    *   Begin expanding Terminal Town and creating "Terminal Fields" map (`src/assets/maps/terminalFields.ts`).

### **4. Quick Wins (Can Be Done TODAY)**

These are high-impact, low-effort fixes for immediate Chris happiness.

*   **Fix Combat AI:** Ensure enemies take turns. (`BattleSystem.ts`)
*   **Fix Inventory `I` Key:** Ensure `I` opens inventory. (Check global input listener).
*   **Fix Map Transition Coordinates:** Correct player placement after map changes.
*   **Implement Continuous Movement:** Hold-to-move for WASD/Arrows.
*   **Standardize `Esc` Key:** Close all open menus.
*   **Provide Starting Talent Points:** Give 3 points at game start.
*   **Remove Redundant HP/Energy Bar:** Consolidate to single HUD element.

### **5. Task Agent Deployment Recommendations**

Leverage automated agents for focused, efficient development.

*   **Bug Fixing Agent (Mission: "Operation Un-Crash")**
    *   **Primary:** `SaveGame.ts`, `GameContext.tsx`. Analyze `TypeError` on load; ensure entities are fully hydrated with positions.
    *   **Secondary:** `BattleSystem.ts`. Isolate turn logic; implement simple "attack player" action for enemy.
*   **Feature Implementation Agent (Mission: "Project Gear Up")**
    *   **Target:** `Inventory.tsx`, `CharacterScreen.tsx`, `GameContext.tsx`, `Hotbar.tsx`.
    *   **Task:** Create event handlers for equipping/unequipping (update player state, move items). Link hotbar to inventory and input.
*   **Content Creation Agent (Mission: "World Weavers")**
    *   **Target:** `src/assets/maps/`, `src/data/npcs.ts`.
    *   **Task:** Duplicate `terminalTown.ts` to `terminalFields.ts`, populate with `Basic Bug` enemies. Add 2-3 "flavor" NPCs to `npcs.ts` with witty dialogue.
*   **Testing Agent (Mission: "The Chris Protocol")**
    *   **Task:** Develop E2E test script.
        1.  **Phase 1 Verification:** Confirm `I` key, full combat turn, map transitions.
        2.  **Phase 2 Verification:** Equip item, verify stats; drag potion to hotbar, use with '1' key.
        3.  **Regression:** Run full protocol after major changes.