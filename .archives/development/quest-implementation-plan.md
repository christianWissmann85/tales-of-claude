This technical implementation plan outlines the necessary modifications and new systems to introduce dynamic choices, consequences, and a faction reputation system into the Quest Writers Guild's game agents.

---

## Technical Implementation Plan: Quest Writers Guild Agents

### 1. File Structure Plan

This section details the new files and enhancements to existing type definitions and data organization.

**New Files:**

*   `src/types/QuestChoice.ts`: Defines the structure for a player choice within a quest step.
    ```typescript
    // src/types/QuestChoice.ts
    export enum QuestConsequenceType {
        REPUTATION_CHANGE = "REPUTATION_CHANGE",
        ITEM_GRANT = "ITEM_GRANT",
        QUEST_UNLOCK = "QUEST_UNLOCK",
        QUEST_FAIL = "QUEST_FAIL",
        STATE_CHANGE = "STATE_CHANGE", // e.g., set a global flag
        ADVANCE_QUEST_STEP = "ADVANCE_QUEST_STEP", // For non-branching choices
    }

    export interface IQuestConsequence {
        type: QuestConsequenceType;
        targetId: string; // Faction ID, Item ID, Quest ID, State Flag ID
        value?: number | string | boolean; // Amount, quantity, new state value
        description?: string; // For UI feedback
    }

    export interface IQuestChoice {
        id: string; // Unique ID for the choice within a step
        text: string; // The text displayed to the player for this choice
        consequences: IQuestConsequence[]; // Array of effects this choice has
        nextStepId?: string; // Optional: If this choice leads to a specific next step in the same quest
        unlockQuestId?: string; // Optional: If this choice directly unlocks a new quest
        failQuestId?: string; // Optional: If this choice directly fails a quest
    }
    ```
*   `src/types/QuestStep.ts`: Defines a single step within a quest, now including choices.
    ```typescript
    // src/types/QuestStep.ts
    import { IQuestChoice } from './QuestChoice';
    import { IQuestObjective } from './Quest'; // Assuming IQuestObjective is defined in Quest.ts

    export interface IQuestStep {
        id: string; // Unique ID for the step within its quest
        description: string; // Description of the current step's goal
        objectives: IQuestObjective[]; // What needs to be done to complete this step
        choices?: IQuestChoice[]; // Optional: Choices presented at the end of this step
        nextStepId?: string; // Optional: ID of the next step if no choices or a default path
        isCompletionStep?: boolean; // True if completing this step completes the quest
        isFailureStep?: boolean; // True if reaching this step fails the quest
    }
    ```
*   `src/types/Faction.ts`: Defines a game faction.
    ```typescript
    // src/types/Faction.ts
    export interface IFaction {
        id: string; // Unique ID for the faction (e.g., "guild_of_mages", "bandit_clan")
        name: string;
        description: string;
        initialReputation: number; // Starting reputation for a new player
        reputationTiers: { // Define thresholds for reputation levels
            [tierName: string]: {
                min: number;
                max: number;
                description: string;
            };
        };
    }
    ```
*   `src/managers/FactionManager.ts`: Manages all faction data and player reputation.
    ```typescript
    // src/managers/FactionManager.ts
    import { IFaction } from '../types/Faction';
    import { IPlayerSaveData } from '../types/SaveGame'; // For loading/saving

    export class FactionManager {
        private factions: Map<string, IFaction> = new Map();
        private playerReputation: Map<string, number> = new Map();

        constructor() {
            // Load initial faction data from JSON
            // Example: this.loadFactions(factionDataJson);
        }

        loadFactions(factionsData: IFaction[]) {
            factionsData.forEach(faction => {
                this.factions.set(faction.id, faction);
                this.playerReputation.set(faction.id, faction.initialReputation);
            });
        }

        adjustReputation(factionId: string, amount: number): void {
            const currentRep = this.playerReputation.get(factionId) || 0;
            const newRep = currentRep + amount;
            this.playerReputation.set(factionId, newRep);
            console.log(`Reputation with ${factionId} changed by ${amount}. New rep: ${newRep}`);
            // TODO: Emit event for UI update
        }

        getReputation(factionId: string): number {
            return this.playerReputation.get(factionId) || 0;
        }

        getReputationTier(factionId: string): string {
            const faction = this.factions.get(factionId);
            if (!faction) return "Unknown";

            const rep = this.getReputation(factionId);
            for (const tierName in faction.reputationTiers) {
                const tier = faction.reputationTiers[tierName];
                if (rep >= tier.min && rep <= tier.max) {
                    return tierName;
                }
            }
            return "Undefined"; // Should not happen if tiers cover all ranges
        }

        // Serialization for SaveGame
        serialize(): { [factionId: string]: number } {
            return Object.fromEntries(this.playerReputation);
        }

        deserialize(data: { [factionId: string]: number }): void {
            this.playerReputation = new Map(Object.entries(data));
        }
    }
    ```

**Enhanced Type Definitions:**

*   `src/types/Quest.ts`:
    *   `IQuestDefinition`:
        *   Add `steps: IQuestStep[]`: An array defining the progression of the quest.
        *   Add `prerequisites: IQuestPrerequisite[]`: Conditions to start the quest.
        *   Add `rewards: IQuestReward[]`: Rewards upon quest completion.
    *   `IQuestState`:
        *   Add `currentStepId: string`: The ID of the currently active step.
        *   Add `completedObjectiveIds: string[]`: IDs of objectives completed within the current step.
        *   Add `choicesMade: { [stepId: string]: string }`: Record of choices made at specific steps.
        *   Add `status: 'active' | 'completed' | 'failed'`: Current status of the quest.
    *   `IQuestPrerequisite`:
        *   New type definition to include `factionReputation` checks, `questCompleted`, `questFailed`, `itemOwned`, etc.
        ```typescript
        // src/types/Quest.ts (additions)
        export enum QuestPrerequisiteType {
            QUEST_COMPLETED = "QUEST_COMPLETED",
            QUEST_FAILED = "QUEST_FAILED",
            FACTION_REPUTATION = "FACTION_REPUTATION",
            ITEM_OWNED = "ITEM_OWNED",
            GLOBAL_FLAG = "GLOBAL_FLAG",
        }

        export interface IQuestPrerequisite {
            type: QuestPrerequisiteType;
            targetId: string; // Quest ID, Faction ID, Item ID, Flag ID
            value?: number | string | boolean; // Min rep, quantity, required flag value
            operator?: 'eq' | 'gt' | 'lt' | 'gte' | 'lte'; // For numerical comparisons
        }

        export interface IQuestReward {
            type: 'XP' | 'GOLD' | 'ITEM' | 'FACTION_REPUTATION' | 'QUEST_UNLOCK';
            targetId?: string; // Item ID, Faction ID, Quest ID
            value: number; // Amount of XP/Gold, quantity of item, amount of rep
        }

        export interface IQuestDefinition {
            id: string;
            name: string;
            description: string;
            steps: IQuestStep[]; // NEW
            prerequisites?: IQuestPrerequisite[]; // NEW
            rewards?: IQuestReward[]; // NEW
            // ... existing fields like category, recommendedLevel
        }
        ```
*   `src/managers/QuestManager.ts`:
    *   `activeQuests: Map<string, IQuestState>`: Stores the current state of active quests.
    *   `completedQuests: Set<string>`: Stores IDs of completed quests.
    *   `failedQuests: Set<string>`: Stores IDs of failed quests.
    *   Methods to handle `makeChoice`, `applyConsequences`, `checkPrerequisites`, `advanceQuestStep`, `completeQuest`, `failQuest`.
*   `src/core/GameContext.ts`:
    *   Add `factionManager: FactionManager`.
    *   Ensure `questManager` is initialized with access to `factionManager` (for consequences).
*   `src/system/SaveGame.ts`:
    *   `IPlayerSaveData`:
        *   Add `playerReputation: { [factionId: string]: number }`.
        *   Update `activeQuests` to store `IQuestState` objects.
        *   Update `completedQuests` and `failedQuests` to be arrays of strings.

**Data Organization:**

*   **Quest Packs:**
    *   `data/quests/main_story.json`: An array of `IQuestDefinition` objects for the main storyline.
    *   `data/quests/side_quests.json`: An array of `IQuestDefinition` objects for side quests.
    *   `data/quests/faction_quests.json`: Quests specifically tied to faction progression.
    *   Each file will contain a `JSON` array of `IQuestDefinition` objects.
*   **Faction Data:**
    *   `data/factions.json`: An array of `IFaction` objects.
    *   Example:
        ```json
        [
            {
                "id": "guild_of_mages",
                "name": "The Arcane Conclave",
                "description": "A secretive order of mages...",
                "initialReputation": 0,
                "reputationTiers": {
                    "Hostile": { "min": -100, "max": -20, "description": "They will attack you on sight." },
                    "Neutral": { "min": -19, "max": 19, "description": "They tolerate your presence." },
                    "Friendly": { "min": 20, "max": 100, "description": "They offer discounts and aid." }
                }
            },
            {
                "id": "bandit_clan",
                "name": "The Crimson Skulls",
                "description": "A notorious band of brigands...",
                "initialReputation": 0,
                "reputationTiers": { /* ... */ }
            }
        ]
        ```

### 2. Core System Modifications

**`Quest.ts` Enhancements:**

*   As detailed in the `Enhanced Type Definitions` section, `IQuestDefinition` will now include `steps`, `prerequisites`, and `rewards`.
*   `IQuestState` will track `currentStepId`, `completedObjectiveIds`, and `choicesMade`.

**`QuestManager.ts` Extensions:**

*   **Loading:**
    *   `loadQuestDefinitions(questPacks: IQuestDefinition[])`: Populates a `Map<string, IQuestDefinition>` of all available quests.
*   **Quest Lifecycle:**
    *   `startQuest(questId: string)`:
        *   Checks `prerequisites` using `GameContext.factionManager` and other game state.
        *   If met, initializes `IQuestState` for the quest, sets `currentStepId` to the first step, and adds to `activeQuests`.
    *   `completeObjective(questId: string, objectiveId: string)`:
        *   Marks an objective as complete for the current step of an active quest.
        *   Checks if all objectives for the `currentStepId` are met.
        *   If so, it proceeds to `handleStepCompletion`.
    *   `handleStepCompletion(questId: string)`:
        *   If the current step has `choices`, the quest pauses, awaiting player input.
        *   If the current step has `nextStepId` (linear progression) or is a `completionStep`/`failureStep`, it calls `advanceQuestStep`.
    *   `makeChoice(questId: string, choiceId: string)`:
        *   Retrieves the active quest and its current step.
        *   Finds the `IQuestChoice` by `choiceId`.
        *   Calls `applyConsequences(choice.consequences)`.
        *   Records the choice in `IQuestState.choicesMade`.
        *   Determines the next step based on `choice.nextStepId`, `choice.unlockQuestId`, `choice.failQuestId`, or default quest progression.
        *   Calls `advanceQuestStep` or `startQuest`/`failQuest` as appropriate.
    *   `applyConsequences(consequences: IQuestConsequence[])`:
        *   Iterates through consequences and applies them:
            *   `REPUTATION_CHANGE`: Calls `GameContext.factionManager.adjustReputation()`.
            *   `ITEM_GRANT`: Calls `GameContext.inventoryManager.addItem()`.
            *   `QUEST_UNLOCK`: Calls `startQuest()` for the target quest.
            *   `QUEST_FAIL`: Calls `failQuest()` for the target quest.
            *   `STATE_CHANGE`: Updates a global game flag/state.
            *   `ADVANCE_QUEST_STEP`: Directly moves to a specified step.
    *   `advanceQuestStep(questId: string, nextStepId: string)`:
        *   Updates `IQuestState.currentStepId`.
        *   Resets `completedObjectiveIds` for the new step.
        *   If `isCompletionStep` is true, calls `completeQuest(questId)`.
        *   If `isFailureStep` is true, calls `failQuest(questId)`.
    *   `completeQuest(questId: string)`:
        *   Moves `IQuestState` from `activeQuests` to `completedQuests`.
        *   Applies `rewards` defined in `IQuestDefinition`.
        *   Emits a "Quest Completed" event.
    *   `failQuest(questId: string)`:
        *   Moves `IQuestState` from `activeQuests` to `failedQuests`.
        *   Emits a "Quest Failed" event.

    ```typescript
    // src/managers/QuestManager.ts (excerpt of key methods)
    import { IQuestDefinition, IQuestState, IQuestPrerequisite, IQuestReward, QuestPrerequisiteType } from '../types/Quest';
    import { IQuestChoice, IQuestConsequence, QuestConsequenceType } from '../types/QuestChoice';
    import { GameContext } from '../core/GameContext'; // Assuming GameContext provides access to other managers

    export class QuestManager {
        private questDefinitions: Map<string, IQuestDefinition> = new Map();
        private activeQuests: Map<string, IQuestState> = new Map();
        private completedQuests: Set<string> = new Set();
        private failedQuests: Set<string> = new Set();
        private context: GameContext; // Reference to the game context

        constructor(context: GameContext) {
            this.context = context;
        }

        loadQuestDefinitions(definitions: IQuestDefinition[]): void {
            definitions.forEach(q => this.questDefinitions.set(q.id, q));
        }

        checkPrerequisites(questId: string): boolean {
            const quest = this.questDefinitions.get(questId);
            if (!quest || !quest.prerequisites) return true;

            for (const prereq of quest.prerequisites) {
                switch (prereq.type) {
                    case QuestPrerequisiteType.QUEST_COMPLETED:
                        if (!this.completedQuests.has(prereq.targetId)) return false;
                        break;
                    case QuestPrerequisiteType.FACTION_REPUTATION:
                        const currentRep = this.context.factionManager.getReputation(prereq.targetId);
                        if (prereq.operator === 'gte' && currentRep < (prereq.value as number)) return false;
                        // Add other operators (gt, lt, lte, eq)
                        break;
                    // ... other prerequisite checks
                }
            }
            return true;
        }

        startQuest(questId: string): boolean {
            if (this.activeQuests.has(questId) || this.completedQuests.has(questId) || this.failedQuests.has(questId)) {
                console.warn(`Quest ${questId} is already active, completed, or failed.`);
                return false;
            }
            if (!this.checkPrerequisites(questId)) {
                console.log(`Prerequisites for quest ${questId} not met.`);
                return false;
            }

            const questDef = this.questDefinitions.get(questId);
            if (!questDef || questDef.steps.length === 0) {
                console.error(`Quest definition for ${questId} not found or has no steps.`);
                return false;
            }

            const newQuestState: IQuestState = {
                id: questId,
                currentStepId: questDef.steps[0].id,
                completedObjectiveIds: [],
                choicesMade: {},
                status: 'active'
            };
            this.activeQuests.set(questId, newQuestState);
            console.log(`Quest "${questDef.name}" started.`);
            // Emit event for UI update
            return true;
        }

        makeChoice(questId: string, choiceId: string): void {
            const questState = this.activeQuests.get(questId);
            if (!questState || questState.status !== 'active') {
                console.warn(`Cannot make choice for inactive quest ${questId}.`);
                return;
            }

            const questDef = this.questDefinitions.get(questId);
            const currentStep = questDef?.steps.find(s => s.id === questState.currentStepId);
            const choice = currentStep?.choices?.find(c => c.id === choiceId);

            if (!choice) {
                console.error(`Choice ${choiceId} not found for quest ${questId} step ${questState.currentStepId}.`);
                return;
            }

            questState.choicesMade[questState.currentStepId] = choiceId;
            this.applyConsequences(choice.consequences);

            if (choice.unlockQuestId) {
                this.startQuest(choice.unlockQuestId);
            }
            if (choice.failQuestId) {
                this.failQuest(choice.failQuestId);
            }
            if (choice.nextStepId) {
                this.advanceQuestStep(questId, choice.nextStepId);
            } else if (currentStep?.nextStepId) { // Fallback to linear if no choice-specific next step
                this.advanceQuestStep(questId, currentStep.nextStepId);
            } else if (currentStep?.isCompletionStep) {
                this.completeQuest(questId);
            } else if (currentStep?.isFailureStep) {
                this.failQuest(questId);
            } else {
                console.warn(`Quest ${questId} step ${currentStep?.id} has no clear next step after choice ${choiceId}.`);
            }
            // Emit event for UI update
        }

        private applyConsequences(consequences: IQuestConsequence[]): void {
            consequences.forEach(consequence => {
                switch (consequence.type) {
                    case QuestConsequenceType.REPUTATION_CHANGE:
                        this.context.factionManager.adjustReputation(consequence.targetId, consequence.value as number);
                        break;
                    case QuestConsequenceType.ITEM_GRANT:
                        // this.context.inventoryManager.addItem(consequence.targetId, consequence.value as number);
                        console.log(`Granted ${consequence.value} x ${consequence.targetId}`);
                        break;
                    case QuestConsequenceType.QUEST_UNLOCK:
                        this.startQuest(consequence.targetId);
                        break;
                    case QuestConsequenceType.QUEST_FAIL:
                        this.failQuest(consequence.targetId);
                        break;
                    case QuestConsequenceType.STATE_CHANGE:
                        // this.context.gameStateManager.setFlag(consequence.targetId, consequence.value as boolean);
                        console.log(`Set global flag ${consequence.targetId} to ${consequence.value}`);
                        break;
                    // ... other consequence types
                }
            });
        }

        completeQuest(questId: string): void {
            const questState = this.activeQuests.get(questId);
            if (questState) {
                questState.status = 'completed';
                this.activeQuests.delete(questId);
                this.completedQuests.add(questId);
                console.log(`Quest "${questId}" completed!`);
                // Apply rewards
                const questDef = this.questDefinitions.get(questId);
                questDef?.rewards?.forEach(reward => {
                    switch(reward.type) {
                        case 'XP': console.log(`Gained ${reward.value} XP`); break;
                        case 'GOLD': console.log(`Gained ${reward.value} Gold`); break;
                        case 'ITEM': console.log(`Received ${reward.value} ${reward.targetId}`); break;
                        case 'FACTION_REPUTATION': this.context.factionManager.adjustReputation(reward.targetId!, reward.value); break;
                        case 'QUEST_UNLOCK': this.startQuest(reward.targetId!); break;
                    }
                });
                // Emit event for UI update
            }
        }

        failQuest(questId: string): void {
            const questState = this.activeQuests.get(questId);
            if (questState) {
                questState.status = 'failed';
                this.activeQuests.delete(questId);
                this.failedQuests.add(questId);
                console.log(`Quest "${questId}" failed.`);
                // Emit event for UI update
            }
        }

        // ... other methods like getQuestState, getAvailableQuests, etc.

        // Serialization for SaveGame
        serialize(): { activeQuests: { [key: string]: IQuestState }, completedQuests: string[], failedQuests: string[] } {
            return {
                activeQuests: Object.fromEntries(this.activeQuests),
                completedQuests: Array.from(this.completedQuests),
                failedQuests: Array.from(this.failedQuests)
            };
        }

        deserialize(data: { activeQuests: { [key: string]: IQuestState }, completedQuests: string[], failedQuests: string[] }): void {
            this.activeQuests = new Map(Object.entries(data.activeQuests));
            this.completedQuests = new Set(data.completedQuests);
            this.failedQuests = new Set(data.failedQuests);
        }
    }
    ```

**`GameContext` Quest Handling Updates:**

*   The `GameContext` will serve as the central hub, holding instances of `QuestManager` and `FactionManager`.
*   It will pass itself (or relevant sub-managers) to `QuestManager` during initialization so `QuestManager` can apply consequences that affect other systems (e.g., `FactionManager`, `InventoryManager`).
*   Example `GameContext` initialization:
    ```typescript
    // src/core/GameContext.ts
    import { QuestManager } from '../managers/QuestManager';
    import { FactionManager } from '../managers/FactionManager';
    // import { InventoryManager } from '../managers/InventoryManager'; // Assuming this exists

    export class GameContext {
        public questManager: QuestManager;
        public factionManager: FactionManager;
        // public inventoryManager: InventoryManager;

        constructor() {
            this.factionManager = new FactionManager();
            // this.inventoryManager = new InventoryManager();
            this.questManager = new QuestManager(this); // Pass context for inter-manager communication

            // Load initial data
            this.factionManager.loadFactions(require('../../data/factions.json'));
            this.questManager.loadQuestDefinitions(require('../../data/quests/main_story.json'));
            this.questManager.loadQuestDefinitions(require('../../data/quests/side_quests.json'));
            // ... load other quest packs
        }

        // Methods to access managers or trigger game events
    }
    ```

**SaveGame System Updates for Choices/Reputation:**

*   The `SaveGame` system will be extended to serialize and deserialize the state of `FactionManager` and the enhanced `QuestManager`.
*   `IPlayerSaveData` will be updated to include:
    *   `playerReputation: { [factionId: string]: number }` (serialized from `FactionManager.playerReputation`).
    *   `activeQuests: { [questId: string]: IQuestState }` (serialized from `QuestManager.activeQuests`).
    *   `completedQuests: string[]` (serialized from `QuestManager.completedQuests`).
    *   `failedQuests: string[]` (serialized from `QuestManager.failedQuests`).
*   The `SaveGame.saveGame()` and `SaveGame.loadGame()` methods will call the `serialize()` and `deserialize()` methods on `QuestManager` and `FactionManager` respectively.

    ```typescript
    // src/system/SaveGame.ts (excerpt)
    import { GameContext } from '../core/GameContext';
    import { IQuestState } from '../types/Quest';

    export interface IPlayerSaveData {
        playerName: string;
        playerLocation: string;
        playerInventory: any[]; // Simplified for example
        playerReputation: { [factionId: string]: number }; // NEW
        activeQuests: { [questId: string]: IQuestState }; // ENHANCED
        completedQuests: string[]; // ENHANCED
        failedQuests: string[]; // ENHANCED
        // ... other game state
    }

    export class SaveGame {
        private context: GameContext;

        constructor(context: GameContext) {
            this.context = context;
        }

        saveGame(slot: number): void {
            const saveData: IPlayerSaveData = {
                playerName: "Hero", // Example
                playerLocation: "Town Square", // Example
                playerInventory: [], // Example
                playerReputation: this.context.factionManager.serialize(), // NEW
                activeQuests: this.context.questManager.serialize().activeQuests, // ENHANCED
                completedQuests: this.context.questManager.serialize().completedQuests, // ENHANCED
                failedQuests: this.context.questManager.serialize().failedQuests, // ENHANCED
                // ... serialize other game state
            };
            localStorage.setItem(`saveGame_${slot}`, JSON.stringify(saveData));
            console.log(`Game saved to slot ${slot}.`);
        }

        loadGame(slot: number): boolean {
            const savedData = localStorage.getItem(`saveGame_${slot}`);
            if (savedData) {
                const data: IPlayerSaveData = JSON.parse(savedData);
                // ... deserialize player data
                this.context.factionManager.deserialize(data.playerReputation); // NEW
                this.context.questManager.deserialize({ // ENHANCED
                    activeQuests: data.activeQuests,
                    completedQuests: data.completedQuests,
                    failedQuests: data.failedQuests
                });
                console.log(`Game loaded from slot ${slot}.`);
                return true;
            }
            console.log(`No save game found in slot ${slot}.`);
            return false;
        }
    }
    ```

### 3. Implementation Priority Order

1.  **Step 1: Type Definitions and Interfaces (Foundation)**
    *   Define `IQuestChoice`, `IQuestConsequence`, `IQuestStep`, `IFaction`, `IQuestPrerequisite`, `IQuestReward`.
    *   Update `IQuestDefinition`, `IQuestState`, `IPlayerSaveData` to incorporate new types.
    *   This provides the blueprint for all subsequent development.

2.  **Step 2: Core Choice/Consequence System (Central Mechanic)**
    *   Implement `QuestManager.makeChoice()`.
    *   Implement `QuestManager.applyConsequences()` to handle `REPUTATION_CHANGE`, `ITEM_GRANT`, `QUEST_UNLOCK`, `QUEST_FAIL`, `STATE_CHANGE`, `ADVANCE_QUEST_STEP`.
    *   Ensure `QuestManager` can correctly advance `currentStepId` based on choices or linear progression.
    *   Basic `QuestManager.startQuest()`, `completeQuest()`, `failQuest()` methods.

3.  **Step 3: Faction Reputation System (Dependent on Consequences)**
    *   Implement `FactionManager.ts` with `loadFactions`, `adjustReputation`, `getReputation`, `getReputationTier`.
    *   Integrate `FactionManager` into `GameContext`.
    *   Ensure `QuestManager.applyConsequences()` correctly calls `FactionManager.adjustReputation()`.

4.  **Step 4: Enhanced Quest Prerequisites (Utilizes New Systems)**
    *   Implement `QuestManager.checkPrerequisites()` to evaluate `FACTION_REPUTATION`, `QUEST_COMPLETED`, `QUEST_FAILED`, and other conditions.
    *   Integrate `checkPrerequisites` into `QuestManager.startQuest()`.

5.  **Step 5: UI Improvements (Displaying New Data)**
    *   Modify the Quest Journal UI to display `currentStepDescription`, `completedObjectives`, and `choicesMade`.
    *   Implement a choice selection UI when a quest step presents choices.
    *   Display player reputation with various factions (e.g., in a character sheet or dedicated Faction UI).
    *   Provide feedback for consequences (e.g., "Reputation with X increased!", "You received Y item!").

6.  **Step 6: Content Creation (Populating the System)**
    *   Design and write new quests leveraging the step-based structure, choices, and consequences.
    *   Define faction data, including reputation tiers.
    *   Create quest packs (JSON files) with branching narratives and faction interactions.

### 4. Agent Task Breakdown

*   **Quest System Architect (Lead Developer)**
    *   **Core System Upgrades:** Oversees and implements the `Quest.ts` (definitions, state), `QuestManager.ts` (lifecycle, step advancement, overall flow), and `GameContext` integration.
    *   Defines the overall quest data structure and interaction patterns.
    *   Ensures seamless integration between `QuestManager`, `FactionManager`, and `SaveGame`.
*   **Faction System Builder**
    *   **Reputation Mechanics:** Implements `Faction.ts` and `FactionManager.ts`.
    *   Handles loading, adjusting, and querying faction reputation.
    *   Defines reputation tiers and their effects.
    *   Works closely with the Architect for integration into `QuestManager` consequences.
*   **Choice Engine Developer**
    *   **Branching Logic:** Focuses on `QuestChoice.ts`, `QuestConsequence.ts`.
    *   Implements the `makeChoice` and `applyConsequences` logic within `QuestManager`.
    *   Ensures all consequence types are correctly handled and trigger appropriate manager calls.
*   **Quest Content Writers (3-4 Agents)**
    *   **Create Quest Packs:** Design and write detailed quest narratives using the new `IQuestDefinition` structure.
    *   Define quest steps, objectives, choices, consequences (reputation changes, item grants, quest unlocks/fails), prerequisites, and rewards.
    *   Work in parallel once the core systems and data structures are stable.
*   **UI Enhancement Agent**
    *   **Journal Improvements:** Develops the UI components for displaying quest steps, objectives, and past choices.
    *   Implements the interactive choice selection UI.
    *   Creates the Faction UI to display player reputation and tiers.
    *   Integrates with the `QuestManager` and `FactionManager` to fetch and display real-time data.

### 5. Testing Strategy

*   **Unit Tests:**
    *   **`FactionManager`:** Test `adjustReputation`, `getReputation`, `getReputationTier` with various inputs (positive, negative, zero, boundary values for tiers). Test serialization/deserialization.
    *   **`QuestManager` (isolated):**
        *   Test `startQuest` with and without prerequisites met.
        *   Test `completeObjective` and `handleStepCompletion` for linear quests.
        *   Test `makeChoice` to ensure correct `nextStepId` or `unlockQuestId`/`failQuestId` is followed.
        *   Test `applyConsequences` to ensure it correctly logs or attempts to call external managers (mock external managers for unit tests).
        *   Test `completeQuest` and `failQuest` to ensure status changes and rewards are applied.
        *   Test serialization/deserialization of `activeQuests`, `completedQuests`, `failedQuests`.
*   **Integration Tests:**
    *   **Choice Persistence Tests:** Play through a quest with choices, save the game, load, and verify that the `choicesMade` are preserved and the quest continues from the correct state.
    *   **Branching Path Validation:** Create specific test quests with multiple branches. Write tests to ensure each branch is correctly followed based on choices, and that the resulting quest states/consequences are as expected.
    *   **Save/Load with Quest States:** Perform full game saves and loads, verifying that all active, completed, and failed quests, along with their detailed states (current step, completed objectives, choices made), are correctly restored.
    *   **Faction Reputation Calculations:** Test quests that modify faction reputation. Verify that `FactionManager` correctly updates reputation and that `QuestManager` can check reputation prerequisites.
    *   **Consequence Application:** Create tests where choices trigger various consequences (item grants, quest unlocks/fails, global flags) and verify that the target systems (e.g., inventory, other quests) are affected as intended.
*   **End-to-End Tests (Manual & Automated Scenario Tests):**
    *   **Playthrough Scenarios:** Design specific test scenarios that cover complex quest chains, multiple choices, and significant faction reputation changes.
    *   **UI Navigation Tests:** Verify that the Quest Journal displays information correctly, that choice prompts appear at the right time, and that the Faction UI updates dynamically.
    *   **Regression Testing:** After new features, re-run existing tests to ensure no previous functionality has been broken.
*   **Performance Testing:** Monitor performance for large numbers of quests or complex consequence chains, especially during save/load operations.

This comprehensive plan provides a clear roadmap for implementing the advanced quest system, ensuring a robust and engaging experience for players.