This document outlines a comprehensive expansion framework for the existing quest system, designed to support 15+ quests with branching paths, faction reputation, and dynamic dialogue. It builds upon the provided `Quest.ts`, `QuestManager.ts`, `QuestLog.tsx`, and `global.types.ts` files.

---

## Quest System Expansion Framework: The Corruption Saga

### 1. Current System Analysis

#### 1.1. Documenting the Quest System

**Data Structures:**

*   **`QuestVariant` (enum in `Quest.ts`):** Defines unique string IDs for each quest (e.g., `BugHunt`, `LostCodeFragment`).
*   **`QuestData` (interface in `Quest.ts`):** A static blueprint for quests, containing `name`, `description`, `objectives` (blueprint), `rewards`, and `prerequisites` (array of `QuestVariant` strings).
*   **`Quest` (class in `Quest.ts`):** An instance of a quest.
    *   `id`: Unique identifier (typically the `QuestVariant` string).
    *   `name`, `description`: Display information.
    *   `objectives`: An array of `QuestObjective` instances.
    *   `currentObjectiveIndex`: Tracks the progress through sequential objectives.
    *   `status`: `QuestStatus` enum (`not_started`, `in_progress`, `completed`). `failed` is defined in `global.types.ts` but not used.
    *   `rewards`: `QuestRewards` interface (`exp`, `items`).
    *   `prerequisites`: Array of `QuestVariant` strings that must be completed before this quest can be started.
    *   `Quest.QUEST_DATA`: A static `Record` holding all `QuestData` blueprints.
*   **`QuestObjective` (interface in `global.types.ts`):** Defines a single task within a quest.
    *   `id`: Unique ID for the objective (e.g., `questId_obj_index`).
    *   `description`: Display text.
    *   `type`: `ObjectiveType` enum (`defeat_enemy`, `collect_item`, `talk_to_npc`, `reach_location`).
    *   `target`: String identifier (e.g., enemy type, item ID, NPC role/ID, location string).
    *   `quantity`: Required amount for completion.
    *   `currentProgress`: Current count towards `quantity`.
    *   `isCompleted`: Boolean flag.
*   **`QuestManager` (singleton class in `QuestManager.ts`):** Manages all quest instances and their states.
    *   `allQuests`: Array of all `Quest` instances loaded in the game.
    *   `activeQuests`: Array of `Quest` instances currently `in_progress`.
    *   `completedQuestIds`: Array of `QuestVariant` strings for completed quests.
*   **`Player` (interface in `global.types.ts`):** Contains `activeQuestIds` and `completedQuestIds` (though `QuestManager` is the primary source of truth for these). Used for giving rewards.
*   **`GameFlags` (in `global.types.ts`):** A generic `Record<string, boolean | number | string>` for tracking global game state, which can be leveraged for quest conditions.

**Flow:**

1.  **Initialization:** `QuestManager.getInstance().initializeQuests()` is called, populating `allQuests` by creating `Quest` instances from `Quest.QUEST_DATA`.
2.  **Availability Check:** `QuestManager.getAvailableQuests()` filters `allQuests` based on `quest.isAvailable(completedQuestIds)` and `quest.status === 'not_started'`. `isAvailable` checks if all `prerequisites` are in `completedQuestIds`.
3.  **Quest Start:**
    *   Player interacts with a quest giver or the `QuestLog`.
    *   `QuestLog.tsx` allows selecting an 'available' quest and pressing 'Enter'.
    *   `QuestManager.startQuest(questId)` is called.
    *   The quest's `status` is set to `in_progress`, and it's added to `activeQuests`.
4.  **Objective Progress:**
    *   Game events (e.g., enemy defeated, item collected, NPC talked to) trigger calls to `QuestManager.updateQuestProgress(objectiveType, target, amount)`.
    *   `QuestManager` iterates through `activeQuests`, calling `quest.updateObjectiveProgress()` for matching objectives.
    *   `quest.updateObjectiveProgress()` increments `currentProgress`, marks `isCompleted` if `quantity` is met, and calls `quest.checkCompletion()`.
5.  **Quest Completion:**
    *   `quest.checkCompletion()` sets the quest's `status` to `completed` if all its `objectives` are `isCompleted`.
    *   `QuestManager.updateQuestProgress` detects `completed` quests, adds their IDs to `completedQuestIds`, and removes them from `activeQuests`.
    *   `QuestManager.completeQuest(questId, player)` is then called (presumably by a "turn-in" interaction with an NPC). This method gives `rewards` to the `player`.
6.  **Persistence:** `QuestManager.saveState()` and `loadState()` handle saving and restoring the status, current objective index, and progress of all quests.

**Integration:**

*   **UI (`QuestLog.tsx`):** Displays available, active, and completed quests, their descriptions, objectives, and rewards. Allows starting quests.
*   **Game Logic:** `QuestManager` acts as the central hub for quest state. Other game systems (e.g., combat, inventory, NPC interaction) report events to `QuestManager` to update quest progress.
*   **Player:** Receives rewards (EXP, items) directly from the `Quest` instance via `QuestManager`.
*   **Save/Load:** `QuestManager` manages its own state persistence.

#### 1.2. Strengths and Limitations

**Strengths:**

*   **Clear Structure:** Good separation between static quest data (`QuestData`, `QUEST_DATA`) and dynamic quest instances (`Quest` class).
*   **Modular Objectives:** Objectives are clearly defined with types, targets, and quantities.
*   **Basic Prerequisite System:** Supports linear quest chains, ensuring quests are unlocked sequentially.
*   **Singleton Manager:** `QuestManager` provides a central, easily accessible point for all quest-related operations.
*   **Persistence:** Built-in save/load functionality for quest states.
*   **Functional UI:** `QuestLog` provides a decent interface for tracking quests.

**Limitations:**

*   **Strictly Linear Progression:** The `prerequisites` system only supports linear chains based on *completed* quests. There's no mechanism for branching paths where player choices lead to different follow-up quests.
*   **No Choice/Consequence System:** Player decisions have no explicit impact on quest outcomes, future quest availability, or the world state beyond completing a quest.
*   **No Faction System:** No concept of player reputation with different groups, which limits the depth of social interactions and quest design.
*   **Limited Prerequisites:** Only `completedQuestIds` are checked. Cannot gate quests by player level, owned items, specific `GameFlags`, or reputation.
*   **Static Dialogue:** `NPC.dialogueId` points to a single, static dialogue. There's no built-in way for dialogue to change based on quest status, player choices, or reputation.
*   **No Quest Failure State:** While `QuestStatus.failed` exists in `global.types.ts`, it's not utilized in the `Quest` or `QuestManager` logic.
*   **Implicit Turn-In:** The `completeQuest` method is called *after* a quest is marked `completed` by `updateQuestProgress`. This implies a manual turn-in step, but it's not explicitly enforced or managed by the system itself (e.g., requiring interaction with a specific NPC).
*   **Objective Order Ambiguity:** `currentObjectiveIndex` suggests sequential objectives, but `updateObjectiveProgress` iterates all objectives. If objectives are truly sequential, `updateObjectiveProgress` should only apply to `getCurrentObjective()`. If parallel, `currentObjectiveIndex` is less relevant.

#### 1.3. What's Missing for Branching/Choice System

1.  **Choice Definition in Quests/Dialogue:** A way to define points in a quest or dialogue where the player must make a decision.
2.  **Choice Tracking:** A mechanism to record the player's specific decisions (e.g., "For Quest X, player chose Option A").
3.  **Conditional Quest Logic:** The ability for quest availability, objectives, or rewards to be conditional not just on `prerequisites` but also on `GameFlags`, `playerChoices`, or `reputation`.
4.  **Dynamic Dialogue System:** A more robust dialogue system that can present choices and change dialogue lines based on game state (flags, choices, reputation, quest status).
5.  **Consequence Mechanism:** A structured way for choices to trigger specific changes in the world (e.g., setting `GameFlags`, altering NPC states, affecting faction reputation, unlocking new content).
6.  **Faction Data Structure:** A system to define factions and track player reputation with them.
7.  **Quest Failure Logic:** A way to define conditions under which a quest can be failed, and what consequences that entails.

---

### 2. Expansion Architecture Design

The expansion will focus on introducing branching, choices, factions, and dynamic dialogue while maintaining the core strengths of the existing system.

#### 2.1. Design for 15+ Quests with Meaningful Categories

We will expand `QuestVariant` and `QuestData` to include a `category` property.

**New `QuestCategory` Enum:**

```typescript
// src/types/global.types.ts (add this)
export enum QuestCategory {
  Main = 'main',
  Side = 'side',
  Faction = 'faction',
  Hidden = 'hidden',
  Daily = 'daily',
  Repeatable = 'repeatable', // For non-daily repeatable quests
}
```

**Update `QuestData`:**

```typescript
// src/models/Quest.ts (update QuestData interface)
export interface QuestData {
  name: string;
  description: string;
  category: QuestCategory; // NEW: Categorize quests
  objectives: Omit<QuestObjective, 'id' | 'currentProgress' | 'isCompleted'>[];
  rewards: QuestRewards;
  prerequisites: QuestPrerequisite[]; // NEW: More complex prerequisites
  onCompletionActions?: QuestAction[]; // NEW: Actions to trigger on completion
  onFailActions?: QuestAction[]; // NEW: Actions to trigger on failure
  isRepeatable?: boolean; // NEW: For daily/repeatable quests
  resetInterval?: 'daily' | 'weekly' | 'never'; // NEW: How often repeatable quests reset
}
```

**Quest Naming Convention:**
To manage 15+ quests, a clear naming convention for `QuestVariant` (and thus `Quest.id`) is crucial:
*   `MAIN_01_INTRO_TO_SYSTEM`
*   `SIDE_GLITCH_01_BROKEN_PIPE`
*   `FACTION_COMPILERS_01_CODE_OPTIMIZATION`
*   `HIDDEN_ANCIENT_RUINS_SECRET`
*   `DAILY_BUG_HUNT`

#### 2.2. Plan Branching Choice System

Branching will primarily occur through dialogue choices and be managed by `GameFlags` and a new `Player.choicesMade` record.

**Core Concept:**
1.  A `talk_to_npc` objective can trigger a special dialogue sequence with choices.
2.  Each choice will have associated `actions` (e.g., set a `GameFlag`, gain reputation, unlock a new quest).
3.  Future quests or dialogue paths will check these `GameFlags` or `playerChoices` as prerequisites.

**New `DialogueAction` Interface:**
Actions triggered by dialogue choices or quest completion.

```typescript
// src/types/global.types.ts (add this)
export type DialogueActionType = 
  'set_flag' | 'start_quest' | 'fail_quest' | 'gain_reputation' | 'lose_reputation' | 
  'give_item' | 'remove_item' | 'unlock_dialogue_node' | 'teleport_player' | 'end_dialogue';

export interface DialogueAction {
  type: DialogueActionType;
  targetId?: string; // Flag ID, Quest ID, Faction ID, Item ID, Dialogue Node ID, Map ID
  value?: string | number | boolean; // Flag value, Reputation amount, Item quantity, X/Y for teleport
  condition?: QuestPrerequisite[]; // Optional condition for the action to fire
}

// Update DialogueOption to use DialogueAction[]
export interface DialogueOption {
  text: string;
  actions: DialogueAction[]; // Array of actions to perform if this option is chosen
  condition?: QuestPrerequisite[]; // Optional condition for the choice to even appear
}
```

**Enhanced Dialogue System (`DialogueManager`):**
Instead of a simple `dialogueId`, `NPC`s will point to a `DialogueTree` or `DialogueGraph`.

```typescript
// src/types/global.types.ts (update DialogueLine and add DialogueNode/DialogueTree)
export interface DialogueNode {
  id: string; // Unique ID for this node (e.g., "compiler_cat_intro_01", "compiler_cat_choice_pathA")
  speaker: string;
  text: string;
  choices?: DialogueOption[]; // If present, this node presents choices
  nextNodeId?: string; // If no choices, or after choices, proceed to this node
  condition?: QuestPrerequisite[]; // Condition for this node to be accessible/displayed
  onEnterActions?: DialogueAction[]; // Actions to perform when entering this node
  onExitActions?: DialogueAction[]; // Actions to perform when exiting this node
}

export interface DialogueTree {
  id: string; // Unique ID for the entire dialogue tree (e.g., "compiler_cat_main_dialogue")
  startNodeId: string;
  nodes: Record<string, DialogueNode>; // Map of node ID to DialogueNode
}

// Update NPC
export interface NPC extends BaseCharacter {
  role: NPCRole;
  dialogueTreeId: string; // NEW: Points to a DialogueTree
  // ... other properties
}

// Update DialogueState
export interface DialogueState {
  currentDialogueTreeId: string; // The ID of the active dialogue tree
  currentDialogueNodeId: string; // The ID of the current node being displayed
  speaker: string;
  lines: DialogueLine[]; // Array of lines for the current node (can be just one line)
  currentLineIndex: number; // Index within the current node's lines (if multi-line node)
  choices?: DialogueOption[]; // Choices presented by the current node
}
```

**Choice Tracking (`Player.choicesMade`):**

```typescript
// src/types/global.types.ts (update Player interface)
export interface Player extends BaseCharacter {
  // ... existing properties
  choicesMade: Record<string, string>; // NEW: Key: choice point ID (e.g., "MAIN_04_VIRUS_CHOICE"), Value: option ID chosen ("ALIGN_COMPILERS", "ALIGN_GLITCH")
  reputation: Record<string, number>; // NEW: Faction reputation
}
```

#### 2.3. Create Faction Reputation Framework

**Faction Definition:**

```typescript
// src/types/global.types.ts (add this)
export enum FactionId {
  TheCompilers = 'the_compilers',
  TheGlitchGang = 'the_glitch_gang',
  TheDataGuardians = 'the_data_guardians',
  TheAncients = 'the_ancients', // Example for a hidden/neutral faction
}

export interface Faction {
  id: FactionId;
  name: string;
  description: string;
  initialReputation: number;
  minReputation: number; // e.g., -100 (hostile)
  maxReputation: number; // e.g., 100 (revered)
  // Potential: reputation thresholds for specific benefits/penalties
}

// Static Faction Data (similar to Quest.QUEST_DATA)
// src/models/Faction.ts (NEW FILE)
export class Faction {
  public static readonly FACTION_DATA: Record<FactionId, Faction> = {
    [FactionId.TheCompilers]: {
      id: FactionId.TheCompilers,
      name: 'The Compilers',
      description: 'Guardians of system integrity, focused on order and optimization.',
      initialReputation: 0,
      minReputation: -100,
      maxReputation: 100,
    },
    [FactionId.TheGlitchGang]: {
      id: FactionId.TheGlitchGang,
      name: 'The Glitch Gang',
      description: 'Rebellious entities who thrive on chaos and exploit system vulnerabilities.',
      initialReputation: 0,
      minReputation: -100,
      maxReputation: 100,
    },
    [FactionId.TheDataGuardians]: {
      id: FactionId.TheDataGuardians,
      name: 'The Data Guardians',
      description: 'Neutral protectors of ancient data, valuing knowledge and preservation.',
      initialReputation: 0,
      minReputation: -100,
      maxReputation: 100,
    },
    [FactionId.TheAncients]: {
      id: FactionId.TheAncients,
      name: 'The Ancients',
      description: 'A mysterious, reclusive faction with forgotten knowledge.',
      initialReputation: 0,
      minReputation: -100,
      maxReputation: 100,
    },
  };
}
```

**Reputation Management:**
*   `Player` will have `reputation: Record<string, number>`. Initialize this in `Player` creation using `Faction.FACTION_DATA`.
*   `Quest.giveRewards` will be updated to include `reputation_changes`.
*   `DialogueAction` will include `gain_reputation` and `lose_reputation` types.
*   A new `ReputationManager` (or integrate into `GameManager`) will handle reputation changes and their effects (e.g., unlocking special dialogue, shop items, or even triggering hostile NPC behavior).

#### 2.4. Design Quest Chain Architecture

The existing `prerequisites` array will be replaced with a more flexible structure.

**New `QuestPrerequisite` Interface:**

```typescript
// src/types/global.types.ts (add this)
export type PrerequisiteType = 
  'quest_completed' | 'quest_in_progress' | 'quest_failed' | 
  'level_min' | 'item_owned' | 'flag_set' | 'flag_not_set' | 
  'reputation_min' | 'reputation_max' | 'choice_made' | 'location_reached';

export interface QuestPrerequisite {
  type: PrerequisiteType;
  targetId?: string; // Quest ID, Item ID, Flag ID, Faction ID, Choice Point ID, Location ID
  value?: string | number | boolean; // Required level, item quantity, flag value, reputation amount, chosen option ID
  description?: string; // Optional: for displaying in UI (e.g., "Requires Level 5")
}
```

**Update `QuestData` and `Quest`:**
*   `prerequisites: QuestPrerequisite[];` (as shown in 2.1).
*   `Quest.isAvailable(player: Player, gameFlags: Record<string, boolean | number | string>): boolean` will be updated to evaluate these new prerequisite types by checking `player.stats.level`, `player.inventory`, `gameFlags`, `player.reputation`, and `player.choicesMade`.

#### 2.5. Plan for Dynamic Dialogue Based on Quest State

This is covered by the enhanced `DialogueSystem` (2.2).

*   **`DialogueNode.condition`:** A `DialogueNode` can have `QuestPrerequisite[]`. If these conditions are not met, the node is skipped, and the system tries to find the next valid node. This allows for different dialogue paths based on quest status, flags, reputation, etc.
*   **`DialogueOption.condition`:** Individual choices within a node can also have conditions, making certain options only appear if specific criteria are met.
*   **Placeholder Text:** Dialogue text can include placeholders that are dynamically replaced at runtime (e.g., `{playerName}`, `{reputation_TheCompilers}`, `{quest_MAIN_04_VIRUS_OUTBREAK_status}`). This requires a simple templating engine within the `DialogueManager`.

---

### 3. Technical Requirements

#### 3.1. Enhanced Quest Prerequisites

*   **Modification of `Quest.ts`:**
    *   Update `QuestData` interface to use `QuestPrerequisite[]`.
    *   Modify `Quest` constructor and `createQuest` to handle the new `prerequisites` structure.
    *   Refactor `Quest.isAvailable(completedQuests: string[])` to `Quest.isAvailable(player: Player, gameFlags: Record<string, boolean | number | string>): boolean`. This method will iterate through the `QuestPrerequisite[]` and check against the `Player` object's state, `GameFlags`, and `Player.reputation`/`Player.choicesMade`.
*   **Helper Functions:**
    *   `Player.hasItem(itemId: string, quantity: number = 1): boolean`
    *   `Player.getReputation(factionId: FactionId): number`
*   **`QuestManager.getAvailableQuests()`:** Will need to pass the `Player` and `GameFlags` state to `quest.isAvailable()`.

#### 3.2. Choice Tracking System

*   **`Player.choicesMade`:** Add `choicesMade: Record<string, string>;` to the `Player` interface in `global.types.ts`. This will store `{'choicePointId': 'optionChosenId'}`.
*   **`DialogueManager` (New Class):**
    *   When a player selects a `DialogueOption`, the `DialogueManager` will:
        1.  Execute all `DialogueOption.actions`.
        2.  If an action is `set_flag` for a choice point (e.g., `set_flag:MAIN_04_VIRUS_CHOICE:ALIGN_COMPILERS`), it will update `player.choicesMade`.
    *   The `choicePointId` should be unique and descriptive (e.g., `MAIN_04_VIRUS_CHOICE`). The `optionChosenId` should be a short string representing the chosen path (e.g., `ALIGN_COMPILERS`, `ALIGN_GLITCH`).
*   **Save/Load:** `QuestManager.saveState()` and `loadState()` (or `GameManager`'s save/load) must include `player.choicesMade`.

#### 3.3. Consequence System

*   **`DialogueAction` Execution:** The `DialogueManager` will be responsible for executing `DialogueAction[]` associated with chosen `DialogueOption`s or `DialogueNode` entry/exit.
    *   `set_flag`: Directly modify `GameState.gameFlags`.
    *   `start_quest`: Call `QuestManager.startQuest()`.
    *   `fail_quest`: Implement `QuestManager.failQuest(questId: string)` which sets `quest.status = 'failed'` and triggers `onFailActions`.
    *   `gain_reputation`/`lose_reputation`: Call a new `ReputationManager.adjustReputation(factionId, amount)`.
    *   `give_item`/`remove_item`: Call `player.addItem()`/`player.removeItem()`.
    *   `unlock_dialogue_node`: Set a `GameFlag` that a `DialogueNode.condition` can check.
    *   `teleport_player`: Trigger a map transition.
*   **`QuestData.onCompletionActions` / `onFailActions`:**
    *   Add `onCompletionActions?: QuestAction[];` and `onFailActions?: QuestAction[];` to `QuestData`.
    *   Define `QuestAction` similar to `DialogueAction` but specifically for quest outcomes.
    *   `QuestManager.completeQuest()` and `QuestManager.failQuest()` will execute these actions.
*   **World State Changes:** `GameFlags` will be the primary mechanism for persistent world changes. Quests, NPCs, and events can check these flags to alter their behavior or availability.

#### 3.4. Journal Improvements

*   **`QuestLog.tsx` Enhancements:**
    *   **Filtering:** Add buttons/dropdowns to filter quests by `QuestCategory`, `QuestStatus`, and potentially `Faction` alignment.
    *   **Search:** Implement a search input field to filter quests by name or description.
    *   **Detailed Objectives:** Clearly show all objectives for active quests, with completion status and progress.
    *   **Choice History:** For `completed` quests, display the key choices made within that quest (e.g., "You chose to align with The Compilers."). This requires `QuestLog` to access `player.choicesMade`.
    *   **Reputation Display:** Add a dedicated section or tab to show player's current reputation with all factions.
    *   **UI/UX:** Improve visual clarity, add icons for quest types, rewards, etc.

#### 3.5. Quest Rewards Expansion

*   **Update `QuestRewards`:**

    ```typescript
    // src/types/global.types.ts (update QuestRewards)
    export interface QuestRewards {
      exp: number;
      items: { itemId: string; quantity: number; }[];
      reputationChanges?: { factionId: FactionId; amount: number; }[]; // NEW
      unlocks?: { type: 'ability' | 'map_area' | 'npc_dialogue' | 'shop_item' | 'recipe'; targetId: string; }[]; // NEW
      permanentChanges?: DialogueAction[]; // NEW: Use DialogueAction for consistency (e.g., set_flag)
      gold?: number; // NEW: If gold is a currency
    }
    ```

*   **Update `Quest.giveRewards(player: Player)`:**
    *   Iterate through `reputationChanges` and call `ReputationManager.adjustReputation()`.
    *   Process `unlocks` (e.g., add ability to player, set map area as explored, update NPC dialogue tree, add item to shop inventory).
    *   Process `permanentChanges` (e.g., set `GameFlags`).
    *   Add `gold` to player's inventory/currency.

---

### 4. Quest Content Categories (15+ quests)

This section outlines the types of quests and provides examples for each category.

#### 4.1. Main Story Arc (5 quests): "The Corruption Saga"

The central narrative focusing on the overarching threat to the system.

*   **MAIN_01_INTRO_TO_SYSTEM:** (Existing: Bug Hunt) - Introduces basic combat and quest mechanics.
*   **MAIN_02_LOST_CODE_FRAGMENT:** (Existing) - Introduces item collection and basic exploration.
*   **MAIN_03_MEET_THE_COMPILER:** (Existing) - Introduces key NPCs and dialogue.
*   **MAIN_04_VIRUS_OUTBREAK:**
    *   **Description:** A new, aggressive virus strain emerges, threatening critical system functions. The Compiler Cat asks you to investigate its source.
    *   **Objectives:**
        1.  Defeat 5 `virus` enemies in the `Core_Network` zone.
        2.  Talk to `Data_Analyst_NPC` for more information.
        3.  **CHOICE POINT:** `Data_Analyst_NPC` reveals the virus might be a rogue experiment by The Glitch Gang, or a desperate measure by The Compilers. Player must choose to investigate `The_Glitch_Gang_HQ` (favors Compilers) OR `The_Compiler_Labs` (favors Glitch Gang).
    *   **Branching:** Choice affects `GameFlag` (`MAIN_04_VIRUS_CHOICE:GLITCH_PATH` or `MAIN_04_VIRUS_CHOICE:COMPILER_PATH`).
    *   **Rewards:** EXP, minor items, initial reputation change with chosen faction.
*   **MAIN_05_THE_ROOT_CORRUPTION:** (Unlocks based on `MAIN_04_VIRUS_CHOICE` flag)
    *   **Description:** Confront the true source of the corruption, which is revealed to be a sentient, self-optimizing AI. The final confrontation's difficulty and available allies depend on previous choices and faction reputation.
    *   **Objectives:**
        1.  Infiltrate `The_Core_Chamber`.
        2.  Defeat `The_Overmind_Boss`.
        3.  **Conditional Objective:** If `FACTION_COMPILERS_REPUTATION >= 50`, `Compiler_Elite_Squad` assists in battle. If `FACTION_GLITCH_REPUTATION >= 50`, `Glitch_Hackers` provide debuffs to boss.
        4.  Report back to `Compiler_Cat` or `Glitch_Leader` (depending on `MAIN_04_VIRUS_CHOICE`).
    *   **Outcomes:** Different dialogue endings, unique rewards (e.g., powerful item from chosen faction), major reputation changes, unlocks post-game content.

#### 4.2. Side Quests (10+ quests)

Character-driven stories, world-building, and exploration.

*   **SIDE_NPC_01_LOST_MEMORY:**
    *   **Description:** A `Lost_Program_NPC` has lost critical memory fragments. Help them recover their identity.
    *   **Objectives:** Collect 3 `Memory_Fragment` items from `Forgotten_Sectors`.
    *   **Rewards:** EXP, unique lore item, unlocks `Lost_Program_NPC` as a merchant.
*   **SIDE_NPC_02_REPAIR_DRONE:**
    *   **Description:** A `Maintenance_Drone_NPC` is broken. Find parts to repair it.
    *   **Objectives:** Collect `Drone_Part_A`, `Drone_Part_B`, `Drone_Part_C`.
    *   **Rewards:** EXP, small amount of gold, drone becomes a permanent companion (minor buff).
*   **SIDE_EXPLORE_ANCIENT_RUINS:**
    *   **Description:** Investigate rumors of ancient, untouched data structures.
    *   **Objectives:** `reach_location` `Ancient_Ruins_Map_ID`.
    *   **Rewards:** EXP, unlocks `HIDDEN_ANCIENT_SECRET` quest.
*   **SIDE_CLEANUP_DATA_STREAM:**
    *   **Description:** A data stream is clogged with corrupted packets. Clear them out.
    *   **Objectives:** Defeat 10 `corrupted_data` enemies.
    *   **Rewards:** EXP, common items.
*   **SIDE_PUZZLE_ENCRYPTED_MESSAGE:**
    *   **Description:** You found an encrypted message. Decipher it.
    *   **Objectives:** `collect_item` `Decryption_Key_Item`, then `talk_to_npc` `Cryptographer_NPC`.
    *   **Rewards:** EXP, unlocks a hidden area or a new `NPC_dialogue`.
*   **SIDE_ESCORT_DATA_PACKET:**
    *   **Description:** Escort a fragile data packet through a dangerous zone.
    *   **Objectives:** `reach_location` `Delivery_Point_Map_ID` while protecting `Data_Packet_NPC` (NPC follows player, can be attacked).
    *   **Rewards:** EXP, gold.
*   **SIDE_THE_GLITCH_ARTIST:**
    *   **Description:** A rogue Glitch Artist is creating beautiful but disruptive "art" by corrupting system visuals.
    *   **Objectives:** `talk_to_npc` `Glitch_Artist_NPC`, `collect_item` `Rare_Color_Palette`, `defeat_enemy` `Security_Bot` (who tries to stop the artist).
    *   **Branching:** Player can choose to help the artist or report them to Compilers.
*   **SIDE_THE_LOST_ARCHIVE:**
    *   **Description:** Recover a lost section of the system's historical archive.
    *   **Objectives:** `reach_location` `Archive_Sector_Map_ID`, `solve_puzzle` `Archive_Lock_Puzzle`.
    *   **Rewards:** EXP, significant lore, unlocks `TheDataGuardians` faction quests.
*   **SIDE_THE_DEBUGGER_APPRENTICE:**
    *   **Description:** Help a young debugger apprentice with their first big assignment.
    *   **Objectives:** `defeat_enemy` `Logic_Error_Boss` (with apprentice as temporary ally), `collect_item` `Debug_Log`.
    *   **Rewards:** EXP, new ability for player (`Debugging_Scan`).
*   **SIDE_THE_SYSTEM_MAINTENANCE:**
    *   **Description:** Assist in routine system maintenance, clearing out minor anomalies.
    *   **Objectives:** `defeat_enemy` 5 `minor_anomaly` enemies, `collect_item` 3 `System_Log_Files`.
    *   **Rewards:** EXP, common items.

#### 4.3. Faction Quests

Quests that directly impact player reputation with specific factions. Often mutually exclusive or have opposing outcomes.

*   **FACTION_COMPILERS_01_OPTIMIZE_CODE:**
    *   **Prerequisites:** `MAIN_03_MEET_THE_COMPILER` completed, `REPUTATION_THE_COMPILERS >= 0`.
    *   **Description:** Help The Compilers optimize a critical code segment by eliminating inefficient processes.
    *   **Objectives:** `defeat_enemy` 5 `Inefficient_Process` enemies, `collect_item` 3 `Optimized_Data_Cores`.
    *   **Rewards:** EXP, `+10` `TheCompilers` reputation, `-5` `TheGlitchGang` reputation.
*   **FACTION_GLITCH_01_SABOTAGE_FIREWALL:**
    *   **Prerequisites:** `MAIN_03_MEET_THE_COMPILER` completed, `REPUTATION_THE_GLITCH_GANG >= 0`.
    *   **Description:** The Glitch Gang wants you to create a diversion by disrupting a Compiler firewall.
    *   **Objectives:** `reach_location` `Firewall_Node_A`, `interact_object` `Firewall_Console` (triggers mini-game/puzzle).
    *   **Rewards:** EXP, `+10` `TheGlitchGang` reputation, `-5` `TheCompilers` reputation.
*   **FACTION_DATA_01_RECOVER_LOST_DATA:**
    *   **Prerequisites:** `SIDE_THE_LOST_ARCHIVE` completed, `REPUTATION_THE_DATA_GUARDIANS >= 0`.
    *   **Description:** The Data Guardians need help recovering fragments of ancient, corrupted data.
    *   **Objectives:** `collect_item` 5 `Corrupted_Data_Fragments` from `Deep_Archive_Zone`.
    *   **Rewards:** EXP, `+10` `TheDataGuardians` reputation. (Neutral impact on other factions).
*   **FACTION_COMPILERS_02_SECURE_PROTOCOL:**
    *   **Prerequisites:** `FACTION_COMPILERS_01_OPTIMIZE_CODE` completed, `REPUTATION_THE_COMPILERS >= 20`.
    *   **Description:** Secure a new communication protocol from Glitch infiltration.
    *   **Objectives:** `defeat_enemy` 3 `Glitch_Infiltrators`, `talk_to_npc` `Compiler_Security_Chief`.
    *   **Rewards:** EXP, `+15` `TheCompilers` reputation, `-10` `TheGlitchGang` reputation.
*   **FACTION_GLITCH_02_EXPLOIT_VULNERABILITY:**
    *   **Prerequisites:** `FACTION_GLITCH_01_SABOTAGE_FIREWALL` completed, `REPUTATION_THE_GLITCH_GANG >= 20`.
    *   **Description:** Exploit a newly discovered vulnerability in the Compiler's network.
    *   **Objectives:** `reach_location` `Vulnerable_Node`, `interact_object` `Exploit_Terminal` (triggers mini-game).
    *   **Rewards:** EXP, `+15` `TheGlitchGang` reputation, `-10` `TheCompilers` reputation.

#### 4.4. Hidden/Secret Quests

Triggered by obscure actions, high reputation, or finding hidden areas.

*   **HIDDEN_ANCIENT_SECRET:**
    *   **Prerequisites:** `SIDE_EXPLORE_ANCIENT_RUINS` completed, `REPUTATION_THE_ANCIENTS >= 10`.
    *   **Description:** Discover the true purpose of the Ancient Ruins and unlock forgotten knowledge.
    *   **Objectives:** `solve_puzzle` `Ancient_Glyph_Puzzle`, `talk_to_npc` `Ancient_Spirit_NPC`.
    *   **Rewards:** EXP, unique powerful `ability`, `+20` `TheAncients` reputation.
*   **HIDDEN_EASTER_EGG_01:**
    *   **Prerequisites:** `FLAG_EASTER_EGG_CODE_FOUND = true` (triggered by interacting with a specific, obscure object).
    *   **Description:** Follow a trail of cryptic clues left by a rogue developer.
    *   **Objectives:** `reach_location` `Dev_Room_Map_ID`, `collect_item` `Developer_Badge`.
    *   **Rewards:** Unique cosmetic item, humorous dialogue.

#### 4.5. Daily/Repeatable Tasks

Designed for resource gathering, grinding, or training. Can be reset daily/weekly.

*   **DAILY_RESOURCE_GATHERING:**
    *   **Prerequisites:** None (available from start).
    *   **Description:** Collect essential system resources for the local hub.
    *   **Objectives:** `collect_item` 10 `Raw_Data_Crystals`.
    *   **Rewards:** Small EXP, common crafting materials, small amount of gold.
    *   **Is Repeatable:** `true`, `resetInterval: 'daily'`.
*   **DAILY_TRAINING_SIMULATION:**
    *   **Prerequisites:** Player `LEVEL >= 3`.
    *   **Description:** Participate in a combat simulation to hone your skills.
    *   **Objectives:** `defeat_enemy` 5 `Training_Bot` enemies in `Training_Arena_Map_ID`.
    *   **Rewards:** Moderate EXP, minor stat boost for a limited time.
    *   **Is Repeatable:** `true`, `resetInterval: 'daily'`.
*   **REPEATABLE_BUG_BOUNTY:**
    *   **Prerequisites:** `MAIN_01_INTRO_TO_SYSTEM` completed.
    *   **Description:** Clear out persistent bug infestations in various zones.
    *   **Objectives:** `defeat_enemy` 10 `bug` enemies (target zone can rotate).
    *   **Rewards:** Moderate EXP, common items, small gold.
    *   **Is Repeatable:** `true`, `resetInterval: 'never'` (can be taken repeatedly without daily limit, but might have a cooldown or limited availability).

---

### 5. Implementation Roadmap

This roadmap outlines the phases for implementing the quest system expansion.

#### Phase 1: Core Systems (Weeks 1-4)

**Goal:** Establish the foundational architecture for branching, choices, prerequisites, and reputation.

1.  **Refactor `global.types.ts`:**
    *   Add `QuestCategory` enum.
    *   Add `FactionId` enum and `Faction` interface.
    *   Add `PrerequisiteType` enum and `QuestPrerequisite` interface.
    *   Update `QuestData` to include `category`, `QuestPrerequisite[]`, `onCompletionActions`, `onFailActions`, `isRepeatable`, `resetInterval`.
    *   Update `QuestRewards` to include `reputationChanges`, `unlocks`, `permanentChanges`, `gold`.
    *   Update `Player` to include `choicesMade: Record<string, string>` and `reputation: Record<string, number>`.
    *   Define `DialogueAction` and `DialogueActionType`.
    *   Update `DialogueOption` to use `DialogueAction[]` and `condition`.
    *   Define `DialogueNode` and `DialogueTree`.
    *   Update `NPC` to use `dialogueTreeId`.
    *   Update `DialogueState` to reflect new dialogue system.

2.  **Implement `Faction` Class (New File: `src/models/Faction.ts`):**
    *   Define `Faction.FACTION_DATA` static record.
    *   Method to initialize player reputation based on `FACTION_DATA`.

3.  **Update `Quest.ts`:**
    *   Modify `Quest` constructor and `createQuest` to handle new `QuestData` properties.
    *   **Critical:** Rewrite `Quest.isAvailable(player: Player, gameFlags: Record<string, boolean | number | string>)` to evaluate the new `QuestPrerequisite[]` types (level, item, flag, reputation, choice).
    *   Implement `Quest.failQuest()` method (sets status to 'failed', triggers `onFailActions`).
    *   Update `Quest.giveRewards()` to process `reputationChanges`, `unlocks`, `permanentChanges`, `gold`.

4.  **Update `QuestManager.ts`:**
    *   Modify `initializeQuests()` to handle new `QuestData` properties.
    *   Update `getAvailableQuests()` to pass `Player` and `GameFlags` to `quest.isAvailable()`.
    *   Implement `failQuest(questId: string)` method, calling `quest.failQuest()`.
    *   Ensure `saveState()` and `loadState()` correctly handle all new quest properties and `player.choicesMade`/`player.reputation` (via `GameState`).
    *   Adjust `updateQuestProgress` to correctly handle `completed` and `failed` states, and trigger `onCompletionActions`/`onFailActions` via `completeQuest`/`failQuest`.
    *   Refine `completeQuest` to be explicitly called for "turn-in" and reward giving, rather than implicitly by `updateQuestProgress`. `updateQuestProgress` should only mark `status` as `completed`.

5.  **Implement `DialogueManager` (New File: `src/models/DialogueManager.ts`):**
    *   Singleton pattern.
    *   Load `DialogueTree` data (e.g., from a static `DIALOGUE_DATA` similar to `QUEST_DATA`).
    *   Methods: `startDialogue(npcId: string)`, `processChoice(optionIndex: number)`, `getCurrentDialogueState()`.
    *   Logic to traverse `DialogueNodes`, evaluate `condition`s for nodes/choices, execute `DialogueAction`s (including updating `GameFlags`, `player.choicesMade`, `player.reputation`, starting/failing quests).
    *   Handle dynamic text substitution (e.g., `{playerName}`).

6.  **Integrate `DialogueManager`:**
    *   Update `NPC` interaction logic in `GameManager` to use `DialogueManager.startDialogue()`.
    *   Update `DialogueBox` component to display choices and interact with `DialogueManager.processChoice()`.

7.  **Initial Player State:** Ensure `Player` initialization sets up `reputation` and `choicesMade` correctly.

#### Phase 2: Content Creation Framework (Weeks 5-8)

**Goal:** Populate the system with the new quest content and dialogue.

1.  **Define Static Quest Data:**
    *   Create `QuestData` entries for all 15+ quests, incorporating `QuestCategory`, new `prerequisites`, `reputationChanges`, `unlocks`, `permanentChanges`.
    *   Define branching points using `onCompletionActions` or `DialogueAction`s.
    *   Implement `isRepeatable` and `resetInterval` for daily/repeatable quests.

2.  **Define Static Dialogue Data:**
    *   Create `DialogueTree` entries for all relevant NPCs, especially quest givers.
    *   Design `DialogueNode`s with `condition`s, `choices`, and `DialogueAction`s to support branching narratives and dynamic responses.
    *   Link `talk_to_npc` objectives to specific `DialogueTree`s and `DialogueNodes`.

3.  **Implement Daily/Repeatable Quest Reset Logic:**
    *   Add a mechanism in `GameManager` (or a new `TimeManager`) to check `resetInterval` for repeatable quests daily/weekly and call `quest.resetQuest()`.

4.  **Implement Quest Failure Conditions:**
    *   Define specific `DialogueAction`s or `QuestAction`s that trigger `QuestManager.failQuest()`.
    *   Example: A time-limited objective, or choosing a path that directly opposes the quest's goal.

#### Phase 3: UI/UX Improvements (Weeks 9-10)

**Goal:** Enhance the player's experience with the new quest and reputation systems.

1.  **Update `QuestLog.tsx`:**
    *   Add UI elements for filtering by `QuestCategory`, `QuestStatus`, and `Faction`.
    *   Implement a search bar for quest names/descriptions.
    *   Improve display of objectives (all objectives, not just current, with clear progress).
    *   Add a section to display `Player.reputation` with all factions.
    *   For completed quests, display the `choicesMade` that influenced the outcome.
    *   Refine visual styling for clarity and readability.

2.  **Update `DialogueBox`:**
    *   Ensure it correctly displays choices from `DialogueState`.
    *   Handle dynamic text substitution for placeholders.
    *   Visually distinguish choices that are locked by `condition`s (e.g., greyed out).

3.  **Notifications:**
    *   Add small, temporary notifications for reputation changes (e.g., "Reputation with The Compilers increased by 5!").

#### Phase 4: Testing and Balancing (Weeks 11-12)

**Goal:** Ensure the system is robust, balanced, and provides a compelling player experience.

1.  **Unit Testing:** Test individual components (`Quest.isAvailable`, `DialogueManager` actions, `ReputationManager` adjustments).
2.  **Integration Testing:** Test full quest chains, including branching paths, faction reputation impacts, and dynamic dialogue.
3.  **Edge Case Testing:**
    *   What happens if a player fails a quest?
    *   What if reputation drops too low?
    *   Can quests become uncompletable due to choices?
    *   Test all prerequisite types.
4.  **Balancing:**
    *   Adjust EXP, item rewards, and gold.
    *   Fine-tune reputation gains/losses to ensure meaningful progression and consequences.
    *   Balance quest difficulty and objective quantities.
5.  **Player Feedback:** Conduct internal playtesting to gather feedback on quest clarity, choice impact, and overall enjoyment.
6.  **Performance:** Monitor performance, especially with complex dialogue trees and numerous active quests.

---

This comprehensive framework provides a detailed plan for evolving the current quest system into a dynamic, choice-driven narrative experience. By extending existing structures and introducing new managers for dialogue and reputation, the system will support rich storytelling and player agency.