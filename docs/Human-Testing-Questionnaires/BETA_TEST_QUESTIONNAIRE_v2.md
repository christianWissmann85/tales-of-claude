Welcome back, intrepid debugger! 🤖 You've successfully compiled your v1 feedback, and we've been hard at work refactoring the Code Realm. This is **v2** of our testing protocol - now with 100% more features and (hopefully) 100% fewer bugs!

Your mission, should you choose to accept it, is to push "Tales of Claude" to its limits. Explore new systems, verify old bug fixes, and help us build the most stable, enjoyable adventure possible.

**IMPORTANT v2 NOTES:**
- Many v1 bugs have been fixed (we hope!) - please verify!
- NEW FEATURES are marked with 🆕 throughout
- Some features may still be under development - mark them as "Not Implemented Yet"
- Your feedback literally shapes the game - no pressure! 😄

Let's get to squashing! 🎮

---

### **🚀 Beta Test Questionnaire: Tales of Claude v2 🚀**

**Tester Name:** _________________________
**Date:** _________________________
**Game Version:** `[Please provide the game version you are testing]`

**Time Tracking:**
*   **Start Time:** _________________________
*   **End time:** _________________________
*   **Total Playtime:** _________________________

---

### **⌨️ Keyboard Shortcut Reference ⌨️**

| Key(s)           | Action                               |
| ---------------- | ------------------------------------ |
| `Arrow Keys/WASD`| Move Claude                          |
| `Space/Enter`    | Interact with NPCs / Advance Dialogue|
| `I`              | Toggle Inventory                     |
| `Q`              | Toggle Quest Log                     |
| `C`              | Open Character & Talent Screen       |
| `1` - `5`        | Use Hotbar Slot 1-5                  |
| `Escape`         | Close open menus (Inventory, etc.)   |

---

### **✨ Section 1: New Features Checklist (v2 Focus) ✨**

This section is a high-level check for the major new features in this version. Please mark if they are present and give your initial impression.

| Feature                               | Present? | First Impression (1=Confusing, 5=Awesome) | Notes / Initial Bugs 💭 |
| ------------------------------------- | :------: | :---------------------------------------: | ------------------------ |
| **1. 🆕 Intro/Splash Screens**        | Yes / No / N/A |                  1 2 3 4 5           |                          |
| **2. 🆕 On-Screen HUD (HP/Energy)**   | Yes / No / N/A |                  1 2 3 4 5           |                          |
| **3. 🆕 Character Screen (C Key)**    | Yes / No / N/A |                  1 2 3 4 5           |                          |
| **4. 🆕 Equipment System**            | Yes / No / N/A |                  1 2 3 4 5           |                          |
| **5. 🆕 Talent System (3pts/level)**  | Yes / No / N/A |                  1 2 3 4 5           |                          |
| **6. 🆕 Enhanced Inventory (Tabs)**   | Yes / No / N/A |                  1 2 3 4 5           |                          |
| **7. 🆕 Hotbar System (1-5 Keys)**    | Yes / No / N/A |                  1 2 3 4 5           |                          |
| **8. 🆕 Shopping/Merchant System**    | Yes / No / N/A |                  1 2 3 4 5           |                          |
| **9. 🆕 Detailed Quest UI (Q Key)**   | Yes / No / N/A |                  1 2 3 4 5           |                          |
| **10. 🆕 Battle Visuals (ASCII)**     | Yes / No / N/A |                  1 2 3 4 5           |                          |
| **11. 🆕 Battle Feedback (Damage)**   | Yes / No / N/A |                  1 2 3 4 5           |                          |
| **12. 🆕 Boss Key Mechanic**          | Yes / No / N/A |                  1 2 3 4 5           |                          |

---

### **🔧 Section 2: v1 Bug Fix Verification 🔧**

Before we dive into new features, let's verify that the critical v1 bugs have been fixed:

| v1 Bug                                    | Fixed? | Comments 💭                               |
| ----------------------------------------- | :----: | ----------------------------------------- |
| **Combat ability buttons missing**        | Yes / No |                                         |
| **NPCs missing from Binary Forest**       | Yes / No |                                         |
| **Debug Dungeon inaccessible**            | Yes / No |                                         |
| **Quest acceptance not working**          | Yes / No |                                         |
| **Map transition loses player character** | Yes / No |                                         |
| **Items consumable at full HP/Energy**    | Yes / No |                                         |
| **Code Fragment was consumable**          | Yes / No |                                         |

---

### **🛠️ Section 3: Setup & First Launch 🛠️**

Let's get the game running and check the very first moments.

1.  **Environment Setup:**
    *   Did you successfully run `npm install`? ✅ Yes / No
    *   Did you successfully run `npm run dev`? ✅ Yes / No
    *   Any console errors on startup? 💭 (If yes, please describe)
        ____________________________________________________________________________________________________

2.  **Game Launch & Opening Sequence (NEW):**
    *   Does the game load correctly in your browser? ✅ Yes / No
    *   Do the splash screens appear? ✅ Yes / No
    *   Does the opening cutscene play? ✅ Yes / No
    *   Can you skip the cutscene (e.g., with `Space` or `Enter`)? ✅ Yes / No
    *   Is the transition from the cutscene to the game smooth? ✅ Yes / No
    *   Any visual or audio glitches during the intro? 💭
        ____________________________________________________________________________________________________

3.  **Initial Game State:**
    *   Do you start in Terminal Town at the correct position? ✅ Yes / No
    *   **On-Screen HUD (NEW):** Are the HP and Energy bars visible on the screen? ✅ Yes / No
    *   Do the HUD bars accurately reflect your starting HP/Energy? ✅ Yes / No
    *   Any visual glitches on the initial map (Terminal Town)? 💭
        ____________________________________________________________________________________________________

---

### **🚶 Section 3: Core Gameplay Mechanics ⚔️**

Time to test the fundamental systems of the game.

#### **3.1 Movement & Exploration 🗺️**
*   **Movement Controls (Arrow Keys/WASD):**
    *   Do all directional movements work smoothly? ✅ Yes / No
    *   Can Claude move on all walkable tiles? ✅ Yes / No
    *   Does Claude correctly stop at all non-walkable tiles (trees, walls, etc.)? ✅ Yes / No
    *   Is movement responsive? 📊 (1=Laggy, 5=Instant)
        1 2 3 4 5
    *   Any instances of getting stuck or clipping through objects? 💭
        ____________________________________________________________________________________________________

#### **3.2 Inventory System (v2) 🎒**
*   **UI & Access:**
    *   Can you open and close the inventory with the `I` key? ✅ Yes / No
*   **Tabs/Categories (NEW):**
    *   Are there tabs for `Consumables`, `Equipment`, and `Quest Items`? ✅ Yes / No
    *   Does clicking a tab correctly filter the items shown? ✅ Yes / No
    *   Do items appear in the correct tabs? (e.g., Health Potion in Consumables, Rusty Sword in Equipment) ✅ Yes / No
*   **Item Interaction:**
    *   Can you use consumable items from the inventory? ✅ Yes / No
    *   Are they consumed after use? ✅ Yes / No
    *   **v1 Bug Fix:** Can you use a quest item like `Code Fragment`? (Expected: No, it should not be consumable) ✅ Yes / No
    *   Are item descriptions and stats clear and legible? ✅ Yes / No

#### **3.3 Hotbar System (NEW) 🔥**
*   **Setup:**
    *   Is the hotbar visible on the screen? ✅ Yes / No
    *   Can you drag and drop a consumable item (e.g., Health Potion) from the inventory to a hotbar slot? ✅ Yes / No
    *   Can you drag and drop an ability from the Character Screen to a hotbar slot? ✅ Yes / No (If implemented)
*   **Usage:**
    *   Does pressing the `1` key use the item/ability in the first slot? ✅ Yes / No
    *   Test this for all hotbar keys (`1` through `5`). Do they all work? ✅ Yes / No
*   **Feedback:**
    *   Is there a visual cooldown indicator on the hotbar slot after using an item/ability? ✅ Yes / No
    *   Can you use the item again while it's on cooldown? (Expected: No) ✅ Yes / No
    *   Can you clear a hotbar slot (e.g., by right-clicking or dragging it off)? ✅ Yes / No

#### **3.4 Character & Talent System (C Key - NEW) 🌟**
*   **Character Screen UI:**
    *   Can you open and close the Character Screen with the `C` key? ✅ Yes / No
    *   Are your current stats (HP, Energy, Attack, Defense, Speed, Level, EXP) displayed correctly? ✅ Yes / No
    *   Are your equipped items displayed in the correct slots (Weapon, Armor, Accessory)? ✅ Yes / No
*   **Talent System:**
    *   Does the screen show your available Talent Points? ✅ Yes / No
    *   Do you gain 3 talent points when you level up? ✅ Yes / No
    *   Can you spend a talent point on a talent? ✅ Yes / No
    *   Does the talent's rank increase and your available points decrease? ✅ Yes / No
    *   Can you invest past the max rank of a talent? (Expected: No) ✅ Yes / No
    *   Is there a "Reset Talents" button? ✅ Yes / No
    *   Does resetting talents return all your spent points? ✅ Yes / No
    *   Do the talent descriptions clearly explain their effects? ✅ Yes / No

#### **3.5 Quest Log & Tracking (Q Key - v2) 📜**
*   **UI & Access:**
    *   Can you open and close the Quest Log with the `Q` key? ✅ Yes / No
*   **Detailed UI (NEW):**
    *   Does the UI show a list of quests? ✅ Yes / No
    *   Are there tabs for `Active` and `Completed` quests? ✅ Yes / No
    *   When you select a quest, does it show its full description, objectives, and rewards? ✅ Yes / No
*   **Functionality:**
    *   **v1 Bug Fix:** Does accepting a quest make it appear in the `Active` tab? ✅ Yes / No
    *   Does the objective progress (e.g., "Defeat 0/3 Bugs") update correctly? ✅ Yes / No
    *   When a quest is finished, does it move to the `Completed` tab? ✅ Yes / No

---

### **💥 Section 4: Combat System (v2) 💥**

The core of the battle experience has been overhauled.

#### **4.1 Initiation & Flow**
*   Does combat start correctly when you walk onto an enemy? ✅ Yes / No
*   Is the turn order clear (Player vs. Enemy)? ✅ Yes / No

#### **4.2 Visuals & Feedback (NEW)**
*   **Layout:** Is the battle screen laid out in a Final Fantasy 1 style (player on the right, enemies on the left)? ✅ Yes / No
*   **ASCII Art:** Is there a cool ASCII art background for the battle? ✅ Yes / No
*   **Damage Numbers:** Do damage numbers appear above characters when they take damage? ✅ Yes / No
*   **Healing Numbers:** Do healing numbers appear when a character is healed? ✅ Yes / No
*   **Status Indicators:** Do icons or text appear next to characters to show status effects (e.g., Corrupted ☠️, Frozen ❄️)? ✅ Yes / No

#### **4.3 Player Actions & v1 Bug Fix**
*   **v1 BUG FIX:** Are the ability buttons (`Debug`, `Refactor`, `Compile`, `Analyze`) **VISIBLE and CLICKABLE** during your turn? ✅ Yes / No
*   Can you select and use each of your abilities? ✅ Yes / No
*   Do abilities correctly consume Energy? ✅ Yes / No
*   Do your talent point investments affect your abilities in combat? (e.g., does a talent-boosted "Debug" do more damage?) ✅ Yes / No
*   Can you use items from your inventory during combat? ✅ Yes / No

#### **4.4 Combat Outcomes**
*   Does the game register a victory when all enemies are defeated? ✅ Yes / No
*   Are EXP and loot awarded correctly? ✅ Yes / No
*   Does the game register a defeat when your HP reaches 0? ✅ Yes / No
*   Is the transition back to the map smooth after combat ends? ✅ Yes / No

---

### **🤝 Section 5: World & Interaction 🌍**

Let's explore the world and its inhabitants.

#### **5.1 NPC Interactions & v1 Bug Fix**
*   **Terminal Town:** Can you talk to `The Great Debugger` and `Compiler Cat`? ✅ Yes / No
*   **v1 BUG FIX (Binary Forest):**
    *   Is the `Binary Bard` present in the Binary Forest? ✅ Yes / No
    *   Is the `Data Druid` present in the Binary Forest? ✅ Yes / No
    *   Is the `Circuit Sage` present in the Binary Forest? ✅ Yes / No
    *   Is the `Lost Debugger` present in the Binary Forest? ✅ Yes / No
    *   Is the `Bit Merchant` present in the Binary Forest? ✅ Yes / No
*   **Debug Dungeon:** Can you find and talk to all NPCs in the dungeon? (`Imprisoned Program`, `Memory Leak`, `Corrupted Core`) ✅ Yes / No
*   Do all dialogue options work as expected? ✅ Yes / No

#### **5.2 Shopping System (NEW)**
*   When you talk to the `Bit Merchant` in Binary Forest and choose "Show me your wares!", does a shop UI open? ✅ Yes / No
*   Can you see a list of items for sale? ✅ Yes / No
*   Can you buy an item? (Requires currency system) ✅ Yes / No
*   Can you sell an item from your inventory? ✅ Yes / No
*   Is your currency correctly updated after buying/selling? ✅ Yes / No

#### **5.3 Map Transitions & v1 Bug Fixes**
*   **Terminal Town ➡️ Binary Forest:** Does this transition work correctly? ✅ Yes / No
*   **v1 BUG FIX:** **Binary Forest ➡️ Terminal Town:** When you go back to Terminal Town, is your character still visible and controllable? ✅ Yes / No
*   **v1 BUG FIX:** **Binary Forest ➡️ Debug Dungeon:** Can you successfully enter the Debug Dungeon? ✅ Yes / No
*   **Debug Dungeon ➡️ Binary Forest:** Does this transition work correctly? ✅ Yes / No

#### **5.4 Boss Key Mechanic (NEW)**
*   In the Debug Dungeon, find the `Boss Key` item.
*   Locate the locked door leading to the final boss.
*   Can you walk through the locked door *without* the Boss Key? (Expected: No) ✅ Yes / No
*   After picking up the `Boss Key`, can you now walk through the locked door? ✅ Yes / No
*   Is there a notification like "You used the Boss Key"? ✅ Yes / No

---

### **📜 Section 6: Quests & Progression (v1 Bug Fix) 📜**

The quest system was broken in v1. Let's test it from start to finish.

*   **Quest: Bug Hunt**
    *   **v1 BUG FIX:** Can you accept the quest from `The Great Debugger`? ✅ Yes / No
    *   Does it appear in your Quest Log (`Q`)? ✅ Yes / No
    *   Does the objective counter update when you defeat `Basic Bug` enemies? ✅ Yes / No
    *   Does the quest complete and give you rewards (50 EXP, 1 Health Potion) after defeating 3 bugs? ✅ Yes / No
*   **Quest: Lost Code Fragment**
    *   Does this quest become available after "Bug Hunt"? ✅ Yes / No
    *   Can you find and pick up the `Code Fragment` item in Terminal Town? ✅ Yes / No
    *   Does the quest complete and give rewards (75 EXP, 1 Energy Drink)? ✅ Yes / No
*   **Quest: Meet the Compiler**
    *   Does this quest become available after "Lost Code Fragment"? ✅ Yes / No
    *   Does talking to `Compiler Cat` complete the quest? ✅ Yes / No
    *   Are rewards (100 EXP, 1 Debugger Blade) given? ✅ Yes / No
*   **Quest: Logic Analyzer Quest**
    *   Can you accept the quest from the `Lost Debugger` in Binary Forest? ✅ Yes / No
    *   Can you find the `Logic Analyzer` item in Binary Forest? ✅ Yes / No
    *   Does returning the item to the `Lost Debugger` complete the quest and give a reward? ✅ Yes / No

---

### **🛡️ Section 7: Equipment System (NEW) 🛡️**

Let's test all the new gear. For each item, equip it and check the Character Screen (`C`).

*   **Equipping/Unequipping:**
    *   Can you equip items from the inventory? ✅ Yes / No
    *   Does equipping an item remove it from inventory and place it in the correct slot on the Character Screen? ✅ Yes / No
    *   Can you unequip an item? ✅ Yes / No
    *   Does unequipping an item remove it from the slot and place it back in your inventory? ✅ Yes / No
    *   If you equip an item into an occupied slot, does it correctly swap the old item back to your inventory? ✅ Yes / No
*   **Stat Verification:**
    *   Equip `Debugger Blade`. Does your Attack stat increase by 10 and Speed by 2? ✅ Yes / No
    *   Equip `Firewall Armor`. Does your Defense stat increase by 10 and Speed by 2? ✅ Yes / No
    *   Equip `Speed Ring`. Does your Speed stat increase by 5? ✅ Yes / No
    *   (Please test a few other items and note any stat discrepancies) 💭
        ____________________________________________________________________________________________________

---

### **💾 Section 8: Save/Load Functionality 💾**

Test if progress is saved correctly, including all the new systems.

*   **Saving:**
    *   Can you save your game via `Compiler Cat`? ✅ Yes / No
*   **Loading:**
    *   Can you load your saved game? ✅ Yes / No
*   **Data Integrity:** After loading, check if the following are restored correctly:
    *   Player Position, HP, Energy, Level, EXP? ✅ Yes / No
    *   Inventory contents? ✅ Yes / No
    *   Equipped items? ✅ Yes / No
    *   Quest progress (active and completed)? ✅ Yes / No
    *   **NEW:** Hotbar configuration? ✅ Yes / No
    *   **NEW:** Talent point allocation and available points? ✅ Yes / No

---

### **🐛 Section 9: General Stability & Edge Cases 🕵️‍♀️**

Try to break the game!

*   What happens if you try to drag a quest item to the hotbar? (Expected: Not allowed) 💭
    ____________________________________________________________________________________________________
*   What happens if you rapidly press `C`, `I`, and `Q` to open/close menus? Does the game freeze or glitch? ✅ Yes / No
*   What happens if a battle starts while a menu is open? (Expected: Menu should close) 💭
    ____________________________________________________________________________________________________
*   Can you get stuck anywhere on any of the maps? ✅ Yes / No
*   Does the game crash or freeze at any point? 💭 (If yes, describe when and where)
    ____________________________________________________________________________________________________
*   Are there any unhandled errors in the browser's developer console? 💭 (Please check and report any)
    ____________________________________________________________________________________________________

---

### **🎉 Section 10: Fun Factor & Final Thoughts 😄**

Your subjective experience is invaluable!

*   **Overall Enjoyment:** 📊 (1=Not Fun, 5=Extremely Fun)
    1 2 3 4 5
*   **New Features:** Which new feature did you enjoy the most? Why? 💭
    ____________________________________________________________________________________________________
*   **Pacing & Progression:** Does leveling up, getting new gear, and unlocking talents feel rewarding? ✅ Yes / No
*   **Visuals:** How do you like the new battle visuals and on-screen HUD? 📊 (1=Distracting, 5=Awesome)
    1 2 3 4 5
*   **Any other general feedback or suggestions for improvement?** 💭
    ____________________________________________________________________________________________________

---

### **🐞 Section 11: Bug Report Log 🐞**

Please use this section to report any bugs you encounter that weren't covered above. Be as specific as possible!

**Bug Report #1**
*   **Description:**
    ____________________________________________________________________________________________________
*   **Steps to Reproduce:**
    1.
    2.
    3.
*   **Expected Result:**
    ____________________________________________________________________________________________________
*   **Actual Result:**
    ____________________________________________________________________________________________________
*   **Severity:** (Critical / High / Medium / Low / Cosmetic)
*   **Screenshot/Video (if applicable):**

**(Add more Bug Report sections as needed)**

---

---

### **💻 Section 12: Developer Debug Info 💻**

For the tech-savvy testers who want to help us debug at a deeper level:

1. **Browser Console Errors:**
   - Open Developer Tools (F12)
   - Check the Console tab
   - Copy any red error messages here:
   ____________________________________________________________________________________________________
   ____________________________________________________________________________________________________

2. **Performance Metrics:**
   - In Dev Tools, go to Performance tab
   - Record a 10-second gameplay session
   - Note the average FPS: _______
   - Any frame drops during specific actions? 💭
   ____________________________________________________________________________________________________

3. **Network Requests:**
   - Are there any failed network requests? ✅ Yes / No
   - If yes, which endpoints? _______________________

4. **Memory Usage:**
   - Initial memory usage: _______ MB
   - After 30 minutes of play: _______ MB
   - Signs of memory leaks? ✅ Yes / No

---

### **🎯 Version 2 Testing Summary 🎯**

**Quick Stats:**
- Total New Features Tested: _____ / 12
- v1 Bugs Fixed: _____ / 7
- New Bugs Found: _____
- Overall v2 Stability: 📊 (1=Worse than v1, 5=Much Better)
  1 2 3 4 5

**Would you recommend this version for release?** ✅ Yes / No
**Why or why not?** 💭
____________________________________________________________________________________________________

---

Thank you for your incredible dedication and meticulous testing! Your feedback is the compiler that turns our code into a great game. Remember: every bug you find is one less bug our players will encounter!

May your code be bug-free and your adventures epic! 🚀🎮

*P.S. - Found a hilarious bug? Share it! We love a good laugh while debugging! 😄*