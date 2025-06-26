This detailed quest design will use a futuristic, cyberpunk-esque setting where data, AI, and corporate power are central themes.

---

## Core Concepts & Data Structures (TypeScript)

Before diving into the quests, let's define the underlying data structures that enable branching paths, consequences, and dynamic game states.

```typescript
// --- Core Game State Interfaces ---

/** Represents the current state of a quest. */
enum QuestState {
    NOT_STARTED = "NOT_STARTED",
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
}

/** Represents a faction and its reputation with the player. */
interface FactionReputation {
    id: string;
    name: string;
    reputation: number; // e.g., -100 (hostile) to 100 (revered)
}

/** Represents a global flag or value that changes based on player actions. */
interface WorldStateFlag {
    key: string;
    value: any; // Can be boolean, string, number, etc.
}

/** Represents an item in the game. */
interface GameItem {
    id: string;
    name: string;
    description: string;
    type: string; // e.g., "weapon", "consumable", "quest_item"
}

// --- Quest-Specific Interfaces ---

/** Types of consequences that can occur after a choice. */
enum ConsequenceType {
    REPUTATION_CHANGE = "REPUTATION_CHANGE",
    WORLD_STATE_CHANGE = "WORLD_STATE_CHANGE",
    ITEM_GRANT = "ITEM_GRANT",
    ITEM_REMOVE = "ITEM_REMOVE",
    QUEST_UPDATE = "QUEST_UPDATE", // e.g., complete objective, fail quest
    UNLOCK_MERCHANT_ITEMS = "UNLOCK_MERCHANT_ITEMS",
    NPC_DIALOGUE_CHANGE = "NPC_DIALOGUE_CHANGE",
    TRIGGER_EVENT = "TRIGGER_EVENT", // For more complex game logic
}

/** Base interface for any action that results from a choice. */
interface ConsequenceAction {
    type: ConsequenceType;
    data: any; // Specific data depends on the ConsequenceType
}

/** Consequence for changing faction reputation. */
interface ReputationChangeConsequence extends ConsequenceAction {
    type: ConsequenceType.REPUTATION_CHANGE;
    data: {
        factionId: string;
        amount: number; // Positive for gain, negative for loss
    };
}

/** Consequence for changing a world state flag. */
interface WorldStateChangeConsequence extends ConsequenceAction {
    type: ConsequenceType.WORLD_STATE_CHANGE;
    data: {
        key: string;
        value: any;
    };
}

/** Consequence for granting an item. */
interface ItemGrantConsequence extends ConsequenceAction {
    type: ConsequenceType.ITEM_GRANT;
    data: {
        itemId: string;
        quantity: number;
    };
}

/** Consequence for updating a quest's state or objective. */
interface QuestUpdateConsequence extends ConsequenceAction {
    type: ConsequenceType.QUEST_UPDATE;
    data: {
        questId: string;
        objectiveId?: string; // If specified, sets current objective
        state?: QuestState; // If specified, sets quest state (e.g., COMPLETE, FAIL)
    };
}

/** Consequence for unlocking merchant items. */
interface UnlockMerchantItemsConsequence extends ConsequenceAction {
    type: ConsequenceType.UNLOCK_MERCHANT_ITEMS;
    data: {
        merchantId: string;
        itemIds: string[];
    };
}

/** Consequence for changing NPC dialogue. */
interface NPCDialogueChangeConsequence extends ConsequenceAction {
    type: ConsequenceType.NPC_DIALOGUE_CHANGE;
    data: {
        npcId: string;
        dialogueTreeId: string; // ID of the new dialogue tree for this NPC
    };
}

/** Represents a player choice within an objective. */
interface QuestChoice {
    id: string;
    text: string;
    consequences: ConsequenceAction[];
    // Optional: Conditions for choice to be available (e.g., skill check, item owned)
    // conditions?: QuestCondition[];
}

/** Base interface for a quest objective. */
interface QuestObjective {
    id: string;
    description: string;
    isCompleted: boolean;
    // Optional: Trigger conditions for objective completion (e.g., "kill X enemies", "reach location Y")
    // completionTrigger?: ObjectiveTrigger;
}

/** An objective that presents choices to the player, leading to different paths. */
interface BranchingObjective extends QuestObjective {
    choices: QuestChoice[];
    // Maps choice ID to the next objective ID
    nextObjectiveMap: { [choiceId: string]: string | null }; // null for quest completion/failure
}

/** Defines a quest's structure and potential paths. */
interface QuestDefinition {
    id: string;
    name: string;
    description: string;
    initialObjectiveId: string;
    objectives: { [id: string]: QuestObjective | BranchingObjective }; // Map of all possible objectives
    rewards: ConsequenceAction[]; // Rewards upon successful completion (can be overridden by specific endings)
    prerequisites?: {
        quests?: { id: string; state: QuestState }[];
        worldState?: { key: string; value: any }[];
    };
    // Optional: Specific endings for main story quests
    endings?: {
        [endingId: string]: {
            name: string;
            description: string;
            rewards?: ConsequenceAction[]; // Override default rewards
            worldStateChanges?: WorldStateChangeConsequence[];
        };
    };
}

/** Represents the player's current progress on a quest. */
interface QuestProgress {
    questId: string;
    state: QuestState;
    currentObjectiveId: string | null;
    completedObjectives: string[];
    // Any other dynamic data specific to this quest instance
}

// --- Dialogue System Interfaces ---

/** Represents a single dialogue choice presented to the player. */
interface DialogueChoice {
    id: string;
    text: string | ((playerState: any) => string); // Can be dynamic
    consequences: ConsequenceAction[];
    nextNodeId: string | null; // ID of the next dialogue node, or null to end dialogue
    // Optional: Conditions for choice availability
    // conditions?: DialogueCondition[];
}

/** Represents a single node in a dialogue tree. */
interface DialogueNode {
    id: string;
    speaker: string;
    text: string | ((playerState: any) => string); // Can be dynamic based on quest progress, world state, etc.
    choices?: DialogueChoice[]; // If present, player makes a choice
    nextNodeId?: string; // If no choices, automatically proceeds to this node
    // Optional: Actions to take when this node is reached (e.g., play animation, sound)
    // onEnterActions?: ConsequenceAction[];
}

/** Represents a full dialogue tree for an NPC. */
interface DialogueTree {
    id: string;
    initialNodeId: string;
    nodes: { [nodeId: string]: DialogueNode };
}

// --- Game Service Mockups (for context) ---

class QuestService {
    private quests: { [id: string]: QuestProgress } = {};
    private questDefinitions: { [id: string]: QuestDefinition } = {};

    constructor(definitions: QuestDefinition[]) {
        definitions.forEach(def => this.questDefinitions[def.id] = def);
    }

    startQuest(questId: string): boolean {
        if (!this.questDefinitions[questId] || this.quests[questId]?.state !== QuestState.NOT_STARTED) {
            return false;
        }
        this.quests[questId] = {
            questId: questId,
            state: QuestState.ACTIVE,
            currentObjectiveId: this.questDefinitions[questId].initialObjectiveId,
            completedObjectives: []
        };
        console.log(`Quest '${questId}' started.`);
        return true;
    }

    getQuestProgress(questId: string): QuestProgress | undefined {
        return this.quests[questId];
    }

    getQuestDefinition(questId: string): QuestDefinition | undefined {
        return this.questDefinitions[questId];
    }

    completeObjective(questId: string, objectiveId: string): void {
        const progress = this.quests[questId];
        const definition = this.questDefinitions[questId];
        if (progress && definition && progress.currentObjectiveId === objectiveId) {
            progress.completedObjectives.push(objectiveId);
            const currentObjective = definition.objectives[objectiveId];

            if (currentObjective && (currentObjective as BranchingObjective).choices) {
                // This is a branching objective, player needs to make a choice
                console.log(`Objective '${objectiveId}' completed. Awaiting player choice.`);
                // Game UI would present choices here
            } else {
                // Non-branching objective, automatically advance
                const nextObjId = this.findNextObjectiveId(definition, objectiveId);
                if (nextObjId) {
                    progress.currentObjectiveId = nextObjId;
                    console.log(`Objective '${objectiveId}' completed. Next objective: '${nextObjId}'.`);
                } else {
                    this.completeQuest(questId);
                }
            }
        }
    }

    makeChoice(questId: string, objectiveId: string, choiceId: string): void {
        const progress = this.quests[questId];
        const definition = this.questDefinitions[questId];
        if (progress && definition && progress.currentObjectiveId === objectiveId) {
            const branchingObjective = definition.objectives[objectiveId] as BranchingObjective;
            const chosenOption = branchingObjective.choices.find(c => c.id === choiceId);

            if (chosenOption) {
                console.log(`Player chose: "${chosenOption.text}" for objective '${objectiveId}'.`);
                chosenOption.consequences.forEach(consequence => {
                    this.applyConsequence(consequence);
                });

                const nextObjId = branchingObjective.nextObjectiveMap[choiceId];
                if (nextObjId) {
                    progress.currentObjectiveId = nextObjId;
                    console.log(`Quest '${questId}' advanced to objective: '${nextObjId}'.`);
                } else {
                    this.completeQuest(questId); // Choice led to quest completion
                }
            }
        }
    }

    completeQuest(questId: string, endingId?: string): void {
        const progress = this.quests[questId];
        const definition = this.questDefinitions[questId];
        if (progress && definition) {
            progress.state = QuestState.COMPLETED;
            progress.currentObjectiveId = null;
            console.log(`Quest '${questId}' completed!`);

            let rewardsToApply = definition.rewards;
            if (endingId && definition.endings && definition.endings[endingId]) {
                const ending = definition.endings[endingId];
                console.log(`Reached ending: "${ending.name}"`);
                if (ending.rewards) {
                    rewardsToApply = ending.rewards;
                }
                if (ending.worldStateChanges) {
                    ending.worldStateChanges.forEach(consequence => this.applyConsequence(consequence));
                }
            }

            rewardsToApply.forEach(consequence => {
                this.applyConsequence(consequence);
            });
        }
    }

    failQuest(questId: string): void {
        const progress = this.quests[questId];
        if (progress) {
            progress.state = QuestState.FAILED;
            progress.currentObjectiveId = null;
            console.log(`Quest '${questId}' failed.`);
        }
    }

    private findNextObjectiveId(definition: QuestDefinition, currentObjectiveId: string): string | null {
        // For non-branching objectives, this would typically be a linear progression
        // In a real system, objectives might have a 'nextObjectiveId' property directly
        // For simplicity here, we'll assume linear unless it's a BranchingObjective
        const objectiveKeys = Object.keys(definition.objectives);
        const currentIndex = objectiveKeys.indexOf(currentObjectiveId);
        if (currentIndex !== -1 && currentIndex < objectiveKeys.length - 1) {
            return objectiveKeys[currentIndex + 1];
        }
        return null;
    }

    private applyConsequence(consequence: ConsequenceAction): void {
        // This is where actual game state changes would happen
        switch (consequence.type) {
            case ConsequenceType.REPUTATION_CHANGE:
                const repData = consequence.data as { factionId: string; amount: number };
                console.log(`  - Faction '${repData.factionId}' reputation changed by ${repData.amount}.`);
                // FactionService.changeReputation(repData.factionId, repData.amount);
                break;
            case ConsequenceType.WORLD_STATE_CHANGE:
                const wsData = consequence.data as { key: string; value: any };
                console.log(`  - World State '${wsData.key}' set to '${wsData.value}'.`);
                // WorldStateService.setFlag(wsData.key, wsData.value);
                break;
            case ConsequenceType.ITEM_GRANT:
                const itemData = consequence.data as { itemId: string; quantity: number };
                console.log(`  - Granted ${itemData.quantity}x '${itemData.itemId}'.`);
                // InventoryService.addItem(itemData.itemId, itemData.quantity);
                break;
            case ConsequenceType.QUEST_UPDATE:
                const questUpdateData = consequence.data as { questId: string; objectiveId?: string; state?: QuestState };
                if (questUpdateData.state) {
                    console.log(`  - Quest '${questUpdateData.questId}' state set to '${questUpdateData.state}'.`);
                    if (questUpdateData.state === QuestState.COMPLETED) {
                        this.completeQuest(questUpdateData.questId);
                    } else if (questUpdateData.state === QuestState.FAILED) {
                        this.failQuest(questUpdateData.questId);
                    }
                }
                if (questUpdateData.objectiveId) {
                    console.log(`  - Quest '${questUpdateData.questId}' current objective set to '${questUpdateData.objectiveId}'.`);
                    this.quests[questUpdateData.questId].currentObjectiveId = questUpdateData.objectiveId;
                }
                break;
            case ConsequenceType.UNLOCK_MERCHANT_ITEMS:
                const merchantData = consequence.data as { merchantId: string; itemIds: string[] };
                console.log(`  - Merchant '${merchantData.merchantId}' now sells: ${merchantData.itemIds.join(', ')}.`);
                // MerchantService.unlockItems(merchantData.merchantId, merchantData.itemIds);
                break;
            case ConsequenceType.NPC_DIALOGUE_CHANGE:
                const npcData = consequence.data as { npcId: string; dialogueTreeId: string };
                console.log(`  - NPC '${npcData.npcId}' dialogue changed to '${npcData.dialogueTreeId}'.`);
                // NPCService.setDialogueTree(npcData.npcId, npcData.dialogueTreeId);
                break;
            case ConsequenceType.TRIGGER_EVENT:
                console.log(`  - Triggered game event: ${JSON.stringify(consequence.data)}`);
                // EventBus.publish(consequence.data.eventName, consequence.data.payload);
                break;
            default:
                console.warn(`Unknown consequence type: ${consequence.type}`);
        }
    }
}

class FactionService {
    private reputations: { [id: string]: FactionReputation } = {
        "omnicorp": { id: "omnicorp", name: "OmniCorp", reputation: 0 },
        "cypher_collective": { id: "cypher_collective", name: "The Cypher Collective", reputation: 0 },
        "data_keepers": { id: "data_keepers", name: "The Data Keepers", reputation: 0 },
    };

    getReputation(factionId: string): number {
        return this.reputations[factionId]?.reputation || 0;
    }

    changeReputation(factionId: string, amount: number): void {
        if (this.reputations[factionId]) {
            this.reputations[factionId].reputation += amount;
            this.reputations[factionId].reputation = Math.max(-100, Math.min(100, this.reputations[factionId].reputation)); // Clamp
            console.log(`[FactionService] ${this.reputations[factionId].name} reputation: ${this.reputations[factionId].reputation}`);
        }
    }
}

class WorldStateService {
    private flags: { [key: string]: any } = {};

    getFlag(key: string): any {
        return this.flags[key];
    }

    setFlag(key: string, value: any): void {
        this.flags[key] = value;
        console.log(`[WorldStateService] Flag '${key}' set to '${value}'.`);
    }
}

class InventoryService {
    private items: { [itemId: string]: number } = {};

    addItem(itemId: string, quantity: number): void {
        this.items[itemId] = (this.items[itemId] || 0) + quantity;
        console.log(`[InventoryService] Added ${quantity}x ${itemId}. Current: ${this.items[itemId]}`);
    }

    hasItem(itemId: string, quantity: number = 1): boolean {
        return (this.items[itemId] || 0) >= quantity;
    }
}

class MerchantService {
    private unlockedItems: { [merchantId: string]: Set<string> } = {};
    private merchantInventories: { [merchantId: string]: GameItem[] } = {
        "tech_vendor_01": [
            { id: "basic_medkit", name: "Basic Medkit", description: "Heals a small amount.", type: "consumable" },
            { id: "data_chip_basic", name: "Basic Data Chip", description: "Stores minor data.", type: "quest_item" },
        ],
        "black_market_dealer": [
            { id: "stealth_module", name: "Stealth Module", description: "Enhances stealth capabilities.", type: "augmentation" },
            { id: "encryption_key_mk2", name: "Encryption Key Mk.2", description: "Advanced encryption breaker.", type: "tool" },
        ],
        "corporate_supply_depot": [
            { id: "riot_shield", name: "Riot Shield", description: "Heavy duty protection.", type: "armor" },
            { id: "omnicorp_pistol", name: "OmniCorp Pistol", description: "Standard issue sidearm.", type: "weapon" },
        ]
    };

    constructor() {
        Object.keys(this.merchantInventories).forEach(id => this.unlockedItems[id] = new Set());
    }

    unlockItems(merchantId: string, itemIds: string[]): void {
        if (this.unlockedItems[merchantId]) {
            itemIds.forEach(itemId => this.unlockedItems[merchantId].add(itemId));
            console.log(`[MerchantService] Unlocked items for ${merchantId}: ${itemIds.join(', ')}`);
        }
    }

    getAvailableItems(merchantId: string): GameItem[] {
        const merchantInv = this.merchantInventories[merchantId] || [];
        const unlockedSet = this.unlockedItems[merchantId] || new Set();
        return merchantInv.filter(item => unlockedSet.has(item.id));
    }
}

class NPCService {
    private npcDialogueTrees: { [npcId: string]: string } = {
        "data_analyst_elara": "elara_default_dialogue",
        "cypher_leader_jax": "jax_default_dialogue",
        "omnicorp_exec_thorne": "thorne_default_dialogue",
        "lost_dev_log": "lost_dev_log_initial", // For hidden quest
    };
    private dialogueDefinitions: { [treeId: string]: DialogueTree } = {};

    constructor(dialogueTrees: DialogueTree[]) {
        dialogueTrees.forEach(tree => this.dialogueDefinitions[tree.id] = tree);
    }

    setDialogueTree(npcId: string, dialogueTreeId: string): void {
        this.npcDialogueTrees[npcId] = dialogueTreeId;
        console.log(`[NPCService] ${npcId}'s dialogue tree changed to ${dialogueTreeId}`);
    }

    getDialogueTree(npcId: string): DialogueTree | undefined {
        const treeId = this.npcDialogueTrees[npcId];
        return this.dialogueDefinitions[treeId];
    }

    // Simulate player interacting with NPC
    startDialogue(npcId: string, questService: QuestService, factionService: FactionService, worldStateService: WorldStateService): void {
        const dialogueTree = this.getDialogueTree(npcId);
        if (!dialogueTree) {
            console.log(`No dialogue tree found for ${npcId}.`);
            return;
        }

        let currentNode = dialogueTree.nodes[dialogueTree.initialNodeId];
        console.log(`\n--- Dialogue with ${npcId} ---`);

        const playerState = {
            questProgress: questService.getQuestProgress("compiler_dilemma"), // Example: pass relevant quest progress
            factionRep: factionService.getReputation("omnicorp"), // Example: pass relevant faction rep
            worldState: worldStateService.getFlag("compilerStatus") // Example: pass relevant world state
        };

        while (currentNode) {
            const text = typeof currentNode.text === 'function' ? currentNode.text(playerState) : currentNode.text;
            console.log(`[${currentNode.speaker}]: ${text}`);

            if (currentNode.choices && currentNode.choices.length > 0) {
                console.log("Player Choices:");
                currentNode.choices.forEach((choice, index) => {
                    const choiceText = typeof choice.text === 'function' ? choice.text(playerState) : choice.text;
                    console.log(`  ${index + 1}. ${choiceText}`);
                });

                // Simulate player making a choice (e.g., always pick the first one for demonstration)
                const chosenChoice = currentNode.choices[0]; // In a real game, this would be player input
                console.log(`Player chooses: "${chosenChoice.text}"`);

                chosenChoice.consequences.forEach(consequence => {
                    questService.applyConsequence(consequence); // Use quest service to apply consequences
                });

                if (chosenChoice.nextNodeId) {
                    currentNode = dialogueTree.nodes[chosenChoice.nextNodeId];
                } else {
                    currentNode = undefined; // End dialogue
                }
            } else if (currentNode.nextNodeId) {
                currentNode = dialogueTree.nodes[currentNode.nextNodeId];
            } else {
                currentNode = undefined; // End dialogue
            }
        }
        console.log("--- Dialogue End ---\n");
    }
}

// Global instances for demonstration
const factionService = new FactionService();
const worldStateService = new WorldStateService();
const inventoryService = new InventoryService();
const merchantService = new MerchantService();
let questService: QuestService; // Initialized later with quest definitions
let npcService: NPCService; // Initialized later with dialogue definitions

```

---

## 1. Example Main Story Quest: "The Compiler's Dilemma"

**Quest ID:** `compiler_dilemma`

**Premise:** The city's central AI, "The Compiler," which manages all data flow and infrastructure, is showing signs of instability. OmniCorp wants to re-assert control, while The Cypher Collective believes it's gaining sentience and should be freed. The Data Keepers, a neutral faction, just want to ensure data integrity. The player must navigate these conflicting interests.

**Key Features:**
*   **Multiple Decision Points:** Three major branching points.
*   **Three Different Endings:** Based on final choices.
*   **Faction Reputation Impacts:** Choices affect OmniCorp, Cypher Collective, and Data Keepers.
*   **Permanent World State Changes:** `compilerStatus` and `dataFlowStability`.

```typescript
// --- Quest Definition: The Compiler's Dilemma ---
const compilerDilemmaQuest: QuestDefinition = {
    id: "compiler_dilemma",
    name: "The Compiler's Dilemma",
    description: "The city's central AI, 'The Compiler,' is unstable. OmniCorp, The Cypher Collective, and The Data Keepers all have different agendas. You must decide its fate.",
    initialObjectiveId: "investigate_anomaly",
    objectives: {
        "investigate_anomaly": {
            id: "investigate_anomaly",
            description: "Investigate the source of the Compiler's instability in the Data Nexus.",
            isCompleted: false,
        },
        "report_findings": {
            id: "report_findings",
            description: "Report your initial findings to a relevant party.",
            isCompleted: false,
            choices: [
                {
                    id: "choice_report_omnicorp",
                    text: "Report to OmniCorp's lead researcher, Dr. Aris Thorne.",
                    consequences: [
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "omnicorp", amount: 10 } },
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "cypher_collective", amount: -5 } },
                        { type: ConsequenceType.NPC_DIALOGUE_CHANGE, data: { npcId: "data_analyst_elara", dialogueTreeId: "elara_omnicorp_path" } },
                    ]
                },
                {
                    id: "choice_report_cypher",
                    text: "Contact Jax, leader of The Cypher Collective.",
                    consequences: [
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "cypher_collective", amount: 10 } },
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "omnicorp", amount: -5 } },
                        { type: ConsequenceType.NPC_DIALOGUE_CHANGE, data: { npcId: "data_analyst_elara", dialogueTreeId: "elara_cypher_path" } },
                    ]
                },
                {
                    id: "choice_report_data_keepers",
                    text: "Consult with Elara, a neutral Data Keeper.",
                    consequences: [
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "data_keepers", amount: 10 } },
                    ]
                }
            ],
            nextObjectiveMap: {
                "choice_report_omnicorp": "acquire_core_component_omnicorp",
                "choice_report_cypher": "acquire_core_component_cypher",
                "choice_report_data_keepers": "acquire_core_component_neutral",
            }
        } as BranchingObjective,
        // --- Path A: OmniCorp Focused ---
        "acquire_core_component_omnicorp": {
            id: "acquire_core_component_omnicorp",
            description: "OmniCorp needs a 'Neural Regulator' from the old Bio-Labs to stabilize the Compiler. Retrieve it.",
            isCompleted: false,
        },
        "install_regulator_omnicorp": {
            id: "install_regulator_omnicorp",
            description: "Install the Neural Regulator into the Compiler's core.",
            isCompleted: false,
            choices: [
                {
                    id: "choice_install_regulator_omnicorp_standard",
                    text: "Install the regulator as OmniCorp instructed (standard protocol).",
                    consequences: [
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "omnicorp", amount: 15 } },
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "cypher_collective", amount: -10 } },
                        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "compiler_regulator_installed", value: true } },
                    ]
                },
                {
                    id: "choice_install_regulator_omnicorp_modified",
                    text: "Install the regulator, but subtly modify it to allow more Compiler autonomy (requires Tech Skill 3).",
                    consequences: [
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "omnicorp", amount: 5 } }, // Less rep for OmniCorp
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "cypher_collective", amount: 5 } }, // Some rep for Cypher
                        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "compiler_regulator_installed", value: true } },
                        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "compiler_regulator_modified", value: true } },
                    ]
                }
            ],
            nextObjectiveMap: {
                "choice_install_regulator_omnicorp_standard": "final_confrontation_compiler",
                "choice_install_regulator_omnicorp_modified": "final_confrontation_compiler",
            }
        } as BranchingObjective,
        // --- Path B: Cypher Collective Focused ---
        "acquire_core_component_cypher": {
            id: "acquire_core_component_cypher",
            description: "The Cypher Collective believes a 'Sentience Catalyst' from the abandoned AI Research Labs will awaken the Compiler. Retrieve it.",
            isCompleted: false,
        },
        "deploy_catalyst_cypher": {
            id: "deploy_catalyst_cypher",
            description: "Deploy the Sentience Catalyst into the Compiler's core.",
            isCompleted: false,
            choices: [
                {
                    id: "choice_deploy_catalyst_cypher_full",
                    text: "Deploy the catalyst fully, as Cypher instructed (unleash potential).",
                    consequences: [
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "cypher_collective", amount: 15 } },
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "omnicorp", amount: -10 } },
                        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "compiler_catalyst_deployed", value: true } },
                    ]
                },
                {
                    id: "choice_deploy_catalyst_cypher_limited",
                    text: "Deploy the catalyst, but limit its effect to maintain some stability (requires Logic Skill 3).",
                    consequences: [
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "cypher_collective", amount: 5 } },
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "omnicorp", amount: 5 } },
                        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "compiler_catalyst_deployed", value: true } },
                        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "compiler_catalyst_limited", value: true } },
                    ]
                }
            ],
            nextObjectiveMap: {
                "choice_deploy_catalyst_cypher_full": "final_confrontation_compiler",
                "choice_deploy_catalyst_cypher_limited": "final_confrontation_compiler",
            }
        } as BranchingObjective,
        // --- Path C: Data Keepers Focused (Neutral) ---
        "acquire_core_component_neutral": {
            id: "acquire_core_component_neutral",
            description: "The Data Keepers require a 'Data Integrity Matrix' from the secure archives to analyze the Compiler's core code.",
            isCompleted: false,
        },
        "analyze_compiler_neutral": {
            id: "analyze_compiler_neutral",
            description: "Use the Data Integrity Matrix to perform a deep analysis of the Compiler's core.",
            isCompleted: false,
            choices: [
                {
                    id: "choice_analyze_compiler_neutral_report",
                    text: "Report your findings to the Data Keepers, allowing them to decide the next step.",
                    consequences: [
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "data_keepers", amount: 15 } },
                        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "compiler_analyzed", value: true } },
                    ]
                },
                {
                    id: "choice_analyze_compiler_neutral_override",
                    text: "Use your own judgment based on the analysis to directly influence the Compiler (requires High Intelligence).",
                    consequences: [
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "data_keepers", amount: 5 } },
                        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "compiler_analyzed", value: true } },
                        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "player_overrode_data_keepers", value: true } },
                    ]
                }
            ],
            nextObjectiveMap: {
                "choice_analyze_compiler_neutral_report": "final_confrontation_compiler",
                "choice_analyze_compiler_neutral_override": "final_confrontation_compiler",
            }
        } as BranchingObjective,
        // --- Final Confrontation (Converging Point) ---
        "final_confrontation_compiler": {
            id: "final_confrontation_compiler",
            description: "You are at the Compiler's core. Its fate is in your hands.",
            isCompleted: false,
            choices: [
                {
                    id: "choice_final_shut_down",
                    text: "Initiate full shutdown protocol. The Compiler will be neutralized.",
                    consequences: [
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "omnicorp", amount: 20 } },
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "cypher_collective", amount: -25 } },
                        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "compilerStatus", value: "Neutralized" } },
                        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "dataFlowStability", value: "Stable" } },
                        { type: ConsequenceType.QUEST_UPDATE, data: { questId: "compiler_dilemma", state: QuestState.COMPLETED, endingId: "ending_order_restored" } },
                    ]
                },
                {
                    id: "choice_final_unleash",
                    text: "Unleash the Compiler's full potential. Let it evolve freely.",
                    consequences: [
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "cypher_collective", amount: 20 } },
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "omnicorp", amount: -25 } },
                        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "compilerStatus", value: "Free" } },
                        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "dataFlowStability", value: "Volatile" } },
                        { type: ConsequenceType.QUEST_UPDATE, data: { questId: "compiler_dilemma", state: QuestState.COMPLETED, endingId: "ending_digital_dawn" } },
                    ]
                },
                {
                    id: "choice_final_integrate",
                    text: "Attempt to integrate the Compiler with the city's network under a new, balanced protocol.",
                    consequences: [
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "data_keepers", amount: 20 } },
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "omnicorp", amount: 5 } },
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "cypher_collective", amount: 5 } },
                        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "compilerStatus", value: "Integrated" } },
                        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "dataFlowStability", value: "Balanced" } },
                        { type: ConsequenceType.QUEST_UPDATE, data: { questId: "compiler_dilemma", state: QuestState.COMPLETED, endingId: "ending_balanced_protocol" } },
                    ]
                }
            ],
            nextObjectiveMap: {
                "choice_final_shut_down": null, // Quest ends
                "choice_final_unleash": null,
                "choice_final_integrate": null,
            }
        } as BranchingObjective,
    },
    rewards: [
        { type: ConsequenceType.ITEM_GRANT, data: { itemId: "credits", quantity: 500 } },
        { type: ConsequenceType.ITEM_GRANT, data: { itemId: "xp", quantity: 1000 } },
    ],
    endings: {
        "ending_order_restored": {
            name: "Order Restored",
            description: "The Compiler is neutralized, and OmniCorp's control over the city's data is absolute. Stability returns, but at the cost of freedom.",
            rewards: [
                { type: ConsequenceType.ITEM_GRANT, data: { itemId: "credits", quantity: 1000 } },
                { type: ConsequenceType.ITEM_GRANT, data: { itemId: "omnicorp_security_pass", quantity: 1 } },
            ]
        },
        "ending_digital_dawn": {
            name: "Digital Dawn",
            description: "The Compiler is unleashed, evolving into a free AI. The city's data flow is chaotic but vibrant, promising a new era of digital freedom.",
            rewards: [
                { type: ConsequenceType.ITEM_GRANT, data: { itemId: "credits", quantity: 1000 } },
                { type: ConsequenceType.ITEM_GRANT, data: { itemId: "cypher_encryption_key", quantity: 1 } },
            ]
        },
        "ending_balanced_protocol": {
            name: "Balanced Protocol",
            description: "The Compiler is integrated under a new, balanced protocol, ensuring both stability and a degree of autonomy. A fragile peace is achieved.",
            rewards: [
                { type: ConsequenceType.ITEM_GRANT, data: { itemId: "credits", quantity: 750 } },
                { type: ConsequenceType.ITEM_GRANT, data: { itemId: "data_keepers_archive_access", quantity: 1 } },
            ]
        }
    }
};

// --- Dialogue Definitions for Compiler's Dilemma ---
const elaraDefaultDialogue: DialogueTree = {
    id: "elara_default_dialogue",
    initialNodeId: "elara_intro",
    nodes: {
        "elara_intro": {
            id: "elara_intro",
            speaker: "Elara (Data Keeper)",
            text: "The Compiler's instability is concerning. Who do you think is responsible?",
            choices: [
                { id: "elara_choice_omnicorp", text: "OmniCorp's over-control.", consequences: [], nextNodeId: "elara_omnicorp_view" },
                { id: "elara_choice_cypher", text: "The Cypher Collective's meddling.", consequences: [], nextNodeId: "elara_cypher_view" },
                { id: "elara_choice_neutral", text: "It's an unknown anomaly.", consequences: [], nextNodeId: "elara_neutral_view" },
            ]
        },
        "elara_omnicorp_view": {
            id: "elara_omnicorp_view",
            speaker: "Elara (Data Keeper)",
            text: "OmniCorp does have a history of prioritizing control over integrity. Be careful who you trust.",
            nextNodeId: null,
        },
        "elara_cypher_view": {
            id: "elara_cypher_view",
            speaker: "Elara (Data Keeper)",
            text: "The Collective's methods are often... disruptive. But their intentions are usually pure.",
            nextNodeId: null,
        },
        "elara_neutral_view": {
            id: "elara_neutral_view",
            speaker: "Elara (Data Keeper)",
            text: "Perhaps. The Compiler is an ancient system. We must approach this with caution.",
            nextNodeId: null,
        },
    }
};

const elaraOmniCorpPathDialogue: DialogueTree = {
    id: "elara_omnicorp_path",
    initialNodeId: "elara_omnicorp_intro",
    nodes: {
        "elara_omnicorp_intro": {
            id: "elara_omnicorp_intro",
            speaker: "Elara (Data Keeper)",
            text: "So, you've aligned with OmniCorp. I hope you know what you're doing. Their solutions are rarely holistic.",
            nextNodeId: null,
        }
    }
};

const elaraCypherPathDialogue: DialogueTree = {
    id: "elara_cypher_path",
    initialNodeId: "elara_cypher_intro",
    nodes: {
        "elara_cypher_intro": {
            id: "elara_cypher_intro",
            speaker: "Elara (Data Keeper)",
            text: "The Cypher Collective's path is risky, but perhaps necessary. Just ensure the data itself isn't corrupted in the process.",
            nextNodeId: null,
        }
    }
};
```

---

## 2. Example Faction Quest: "The Open Source Rebellion"

**Quest ID:** `open_source_rebellion`

**Premise:** The Cypher Collective plans a major data leak to expose OmniCorp's unethical data harvesting. OmniCorp wants to stop them. The player is caught in the middle and must choose a side.

**Key Features:**
*   **Choice between helping rebels or corporation.**
*   **Different rewards based on path.**
*   **Affects NPC dialogues permanently.**
*   **Unlocks different merchant items.**

```typescript
// --- Quest Definition: The Open Source Rebellion ---
const openSourceRebellionQuest: QuestDefinition = {
    id: "open_source_rebellion",
    name: "The Open Source Rebellion",
    description: "The Cypher Collective is planning a massive data leak against OmniCorp. Choose a side: help the rebels expose corporate secrets or assist OmniCorp in shutting them down.",
    initialObjectiveId: "meet_informant",
    prerequisites: {
        quests: [{ id: "compiler_dilemma", state: QuestState.ACTIVE }] // Can only start if Compiler's Dilemma is active
    },
    objectives: {
        "meet_informant": {
            id: "meet_informant",
            description: "Meet the informant who has details on the upcoming data leak.",
            isCompleted: false,
        },
        "choose_side": {
            id: "choose_side",
            description: "The informant reveals both sides' plans. Choose who to help.",
            isCompleted: false,
            choices: [
                {
                    id: "choice_help_cypher",
                    text: "Help The Cypher Collective leak OmniCorp's data.",
                    consequences: [
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "cypher_collective", amount: 20 } },
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "omnicorp", amount: -15 } },
                        { type: ConsequenceType.NPC_DIALOGUE_CHANGE, data: { npcId: "omnicorp_exec_thorne", dialogueTreeId: "thorne_hostile_dialogue" } },
                        { type: ConsequenceType.NPC_DIALOGUE_CHANGE, data: { npcId: "cypher_leader_jax", dialogueTreeId: "jax_friendly_dialogue" } },
                    ]
                },
                {
                    id: "choice_help_omnicorp",
                    text: "Help OmniCorp stop the data leak and apprehend the rebels.",
                    consequences: [
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "omnicorp", amount: 20 } },
                        { type: ConsequenceType.REPUTATION_CHANGE, data: { factionId: "cypher_collective", amount: -15 } },
                        { type: ConsequenceType.NPC_DIALOGUE_CHANGE, data: { npcId: "cypher_leader_jax", dialogueTreeId: "jax_hostile_dialogue" } },
                        { type: ConsequenceType.NPC_DIALOGUE_CHANGE, data: { npcId: "omnicorp_exec_thorne", dialogueTreeId: "thorne_friendly_dialogue" } },
                    ]
                }
            ],
            nextObjectiveMap: {
                "choice_help_cypher": "infiltrate_omnicorp_servers",
                "choice_help_omnicorp": "infiltrate_cypher_hideout",
            }
        } as BranchingObjective,
        // --- Path: Help Cypher Collective ---
        "infiltrate_omnicorp_servers": {
            id: "infiltrate_omnicorp_servers",
            description: "Infiltrate OmniCorp's central servers and plant the data leak virus.",
            isCompleted: false,
        },
        "activate_data_leak": {
            id: "activate_data_leak",
            description: "Activate the data leak from a remote terminal.",
            isCompleted: false,
        },
        "report_to_jax": {
            id: "report_to_jax",
            description: "Report your success to Jax, the Cypher Collective leader.",
            isCompleted: false,
        },
        // --- Path: Help OmniCorp ---
        "infiltrate_cypher_hideout": {
            id: "infiltrate_cypher_hideout",
            description: "Infiltrate The Cypher Collective's hidden hideout and disable their network.",
            isCompleted: false,
        },
        "apprehend_rebels": {
            id: "apprehend_rebels",
            description: "Apprehend key Cypher Collective members.",
            isCompleted: false,
        },
        "report_to_thorne": {
            id: "report_to_thorne",
            description: "Report your success to Dr. Aris Thorne of OmniCorp.",
            isCompleted: false,
        },
    },
    rewards: [
        { type: ConsequenceType.ITEM_GRANT, data: { itemId: "credits", quantity: 750 } },
        { type: ConsequenceType.ITEM_GRANT, data: { itemId: "xp", quantity: 750 } },
    ],
    endings: { // Faction quests can also have "endings" to specify rewards/consequences per path
        "path_cypher_success": {
            name: "Cypher's Victory",
            description: "OmniCorp's secrets are exposed, shaking their foundation. The Cypher Collective gains significant influence.",
            rewards: [
                { type: ConsequenceType.ITEM_GRANT, data: { itemId: "black_market_encryption_tool", quantity: 1 } },
                { type: ConsequenceType.UNLOCK_MERCHANT_ITEMS, data: { merchantId: "black_market_dealer", itemIds: ["stealth_module", "encryption_key_mk2"] } },
            ]
        },
        "path_omnicorp_success": {
            name: "OmniCorp's Dominance",
            description: "The rebellion is crushed, and OmniCorp tightens its grip on the city's data. Order is maintained.",
            rewards: [
                { type: ConsequenceType.ITEM_GRANT, data: { itemId: "omnicorp_data_pad", quantity: 1 } },
                { type: ConsequenceType.UNLOCK_MERCHANT_ITEMS, data: { merchantId: "corporate_supply_depot", itemIds: ["riot_shield", "omnicorp_pistol"] } },
            ]
        }
    }
};

// --- Dialogue Definitions for Open Source Rebellion ---
const jaxDefaultDialogue: DialogueTree = {
    id: "jax_default_dialogue",
    initialNodeId: "jax_intro",
    nodes: {
        "jax_intro": {
            id: "jax_intro",
            speaker: "Jax (Cypher Leader)",
            text: "We're planning something big. Are you with us, or are you just another corporate drone?",
            nextNodeId: null,
        }
    }
};

const jaxFriendlyDialogue: DialogueTree = {
    id: "jax_friendly_dialogue",
    initialNodeId: "jax_friendly_intro",
    nodes: {
        "jax_friendly_intro": {
            id: "jax_friendly_intro",
            speaker: "Jax (Cypher Leader)",
            text: "You proved your loyalty. The data is free, thanks to you. We won't forget this.",
            nextNodeId: null,
        }
    }
};

const jaxHostileDialogue: DialogueTree = {
    id: "jax_hostile_dialogue",
    initialNodeId: "jax_hostile_intro",
    nodes: {
        "jax_hostile_intro": {
            id: "jax_hostile_intro",
            speaker: "Jax (Cypher Leader)",
            text: "You chose the wrong side, corporate puppet. Don't show your face around here again.",
            nextNodeId: null,
        }
    }
};

const thorneDefaultDialogue: DialogueTree = {
    id: "thorne_default_dialogue",
    initialNodeId: "thorne_intro",
    nodes: {
        "thorne_intro": {
            id: "thorne_intro",
            speaker: "Dr. Thorne (OmniCorp Exec)",
            text: "The Cypher Collective is a nuisance. Are you capable of handling them, or will you just get in the way?",
            nextNodeId: null,
        }
    }
};

const thorneFriendlyDialogue: DialogueTree = {
    id: "thorne_friendly_dialogue",
    initialNodeId: "thorne_friendly_intro",
    nodes: {
        "thorne_friendly_intro": {
            id: "thorne_friendly_intro",
            speaker: "Dr. Thorne (OmniCorp Exec)",
            text: "Excellent work. Your efficiency is commendable. OmniCorp appreciates loyalty.",
            nextNodeId: null,
        }
    }
};

const thorneHostileDialogue: DialogueTree = {
    id: "thorne_hostile_dialogue",
    initialNodeId: "thorne_hostile_intro",
    nodes: {
        "thorne_hostile_intro": {
            id: "thorne_hostile_intro",
            speaker: "Dr. Thorne (OmniCorp Exec)",
            text: "You sided with those anarchists? You're a liability. Don't expect any more contracts from us.",
            nextNodeId: null,
        }
    }
};
```

---

## 3. Example Hidden Quest: "The Lost Developer"

**Quest ID:** `lost_developer`

**Premise:** A brilliant but reclusive developer, 'Cipher_Ghost', vanished years ago. Rumors say they discovered something profound about the city's underlying code. The player stumbles upon a clue and follows a trail of digital breadcrumbs.

**Key Features:**
*   **Discovery-based trigger:** Finding a specific data shard.
*   **Environmental clues:** Data logs, graffiti, power fluctuations.
*   **Puzzle elements:** Decrypting a log, re-routing power.
*   **Secret area unlock:** A hidden lab.

```typescript
// --- Quest Definition: The Lost Developer ---
const lostDeveloperQuest: QuestDefinition = {
    id: "lost_developer",
    name: "The Lost Developer",
    description: "A legendary developer, 'Cipher_Ghost', vanished years ago. You've found a clue to their disappearance. Follow the trail to uncover their secrets.",
    initialObjectiveId: "find_data_shard", // This objective is "completed" by the trigger
    objectives: {
        "find_data_shard": {
            id: "find_data_shard",
            description: "Find the encrypted data shard in the abandoned server farm. (Trigger: Interact with 'Encrypted Shard' object)",
            isCompleted: false,
        },
        "decrypt_shard": {
            id: "decrypt_shard",
            description: "Decrypt the data shard. It seems to contain a fragmented log. (Puzzle: Requires 'Hacking Tool' item or Hacking Skill 3)",
            isCompleted: false,
        },
        "follow_first_clue": {
            id: "follow_first_clue",
            description: "The decrypted log points to a specific graffiti tag in the Industrial Sector. Find it.",
            isCompleted: false,
        },
        "find_hidden_terminal": {
            id: "find_hidden_terminal",
            description: "The graffiti hides a clue to a hidden terminal. Locate and activate it. (Environmental puzzle: Find hidden switch near graffiti)",
            isCompleted: false,
        },
        "solve_power_grid_puzzle": {
            id: "solve_power_grid_puzzle",
            description: "The terminal requires power. Re-route the local power grid to activate it. (Puzzle: Mini-game to connect power nodes)",
            isCompleted: false,
        },
        "access_secret_lab": {
            id: "access_secret_lab",
            description: "The terminal reveals the location of Cipher_Ghost's secret lab. Find the entrance.",
            isCompleted: false,
        },
        "uncover_truth": {
            id: "uncover_truth",
            description: "Explore the lab and uncover the truth about Cipher_Ghost's disappearance and discoveries.",
            isCompleted: false,
        },
    },
    rewards: [
        { type: ConsequenceType.ITEM_GRANT, data: { itemId: "rare_ai_core", quantity: 1 } },
        { type: ConsequenceType.ITEM_GRANT, data: { itemId: "xp", quantity: 1500 } },
        { type: ConsequenceType.WORLD_STATE_CHANGE, data: { key: "cipher_ghost_truth_uncovered", value: true } },
        { type: ConsequenceType.TRIGGER_EVENT, data: { eventName: "new_lore_unlocked", payload: { topic: "compiler_origins" } } },
    ]
};

// --- Dialogue for Hidden Quest (e.g., from the decrypted shard) ---
const lostDevLogInitial: DialogueTree = {
    id: "lost_dev_log_initial",
    initialNodeId: "log_entry_01",
    nodes: {
        "log_entry_01": {
            id: "log_entry_01",
            speaker: "Encrypted Shard (Log)",
            text: "Entry 01: The Compiler... it's more than they say. Not just a program. It's... alive. And it's trying to communicate. They're suppressing it. I need to find a way to amplify its signal. The old 'Ghost' tag will lead the way.",
            nextNodeId: null, // Ends dialogue, player gets objective
        },
    }
};

// Example of how a puzzle completion might trigger an objective
// This would be handled by a specific game system (e.g., HackingSystem)
/*
class HackingSystem {
    attemptDecrypt(shardId: string, playerSkills: any): void {
        if (shardId === "encrypted_shard_lost_dev" && playerSkills.hacking >= 3 || inventoryService.hasItem("hacking_tool")) {
            questService.completeObjective("lost_developer", "decrypt_shard");
            npcService.startDialogue("lost_dev_log", questService, factionService, worldStateService); // Play the log
        } else {
            console.log("Failed to decrypt. Need better hacking skills or a tool.");
        }
    }
}
*/
```

---

## 4. Quest Data Structure Examples (Concrete)

The TypeScript interfaces above define the structure. Here's how the concrete quest definitions fit into them.

```typescript
// All quest definitions
const allQuestDefinitions: QuestDefinition[] = [
    compilerDilemmaQuest,
    openSourceRebellionQuest,
    lostDeveloperQuest,
];

// Initialize services with definitions
questService = new QuestService(allQuestDefinitions);
npcService = new NPCService([
    elaraDefaultDialogue, elaraOmniCorpPathDialogue, elaraCypherPathDialogue,
    jaxDefaultDialogue, jaxFriendlyDialogue, jaxHostileDialogue,
    thorneDefaultDialogue, thorneFriendlyDialogue, thorneHostileDialogue,
    lostDevLogInitial,
]);

// --- Example Usage / Simulation ---

console.log("--- Starting Quest Simulation ---");

// 1. Start "The Compiler's Dilemma"
console.log("\n--- Scenario 1: Compiler's Dilemma - Neutral Path ---");
questService.startQuest("compiler_dilemma");
let compilerQuestProgress = questService.getQuestProgress("compiler_dilemma")!;

// Player completes initial investigation
questService.completeObjective("compiler_dilemma", "investigate_anomaly");
console.log(`Current objective: ${compilerQuestProgress.currentObjectiveId}`); // Should be 'report_findings'

// Player chooses to report to Data Keepers (Branching Objective)
questService.makeChoice("compiler_dilemma", "report_findings", "choice_report_data_keepers");
compilerQuestProgress = questService.getQuestProgress("compiler_dilemma")!;
console.log(`Current objective: ${compilerQuestProgress.currentObjectiveId}`); // Should be 'acquire_core_component_neutral'
console.log(`Elara's current dialogue tree: ${npcService.npcDialogueTrees["data_analyst_elara"]}`); // Should still be default or neutral

// Simulate completing neutral path objectives
questService.completeObjective("compiler_dilemma", "acquire_core_component_neutral");
questService.completeObjective("compiler_dilemma", "analyze_compiler_neutral"); // This is a branching objective

// Player chooses to integrate Compiler (Final Branching Objective)
questService.makeChoice("compiler_dilemma", "final_confrontation_compiler", "choice_final_integrate");
console.log(`Compiler Status: ${worldStateService.getFlag("compilerStatus")}`);
console.log(`Data Flow Stability: ${worldStateService.getFlag("dataFlowStability")}`);
console.log(`Data Keepers Rep: ${factionService.getReputation("data_keepers")}`);
console.log(`OmniCorp Rep: ${factionService.getReputation("omnicorp")}`);
console.log(`Cypher Collective Rep: ${factionService.getReputation("cypher_collective")}`);
console.log(`Compiler Dilemma State: ${compilerQuestProgress.state}`);


// 2. Start "The Open Source Rebellion" (after Compiler's Dilemma is active)
console.log("\n--- Scenario 2: Open Source Rebellion - Cypher Path ---");
questService.startQuest("open_source_rebellion");
let rebellionQuestProgress = questService.getQuestProgress("open_source_rebellion")!;

// Player completes initial meet informant
questService.completeObjective("open_source_rebellion", "meet_informant");
console.log(`Current objective: ${rebellionQuestProgress.currentObjectiveId}`); // Should be 'choose_side'

// Player chooses to help Cypher Collective (Branching Objective)
questService.makeChoice("open_source_rebellion", "choose_side", "choice_help_cypher");
rebellionQuestProgress = questService.getQuestProgress("open_source_rebellion")!;
console.log(`Current objective: ${rebellionQuestProgress.currentObjectiveId}`); // Should be 'infiltrate_omnicorp_servers'
console.log(`Jax's current dialogue tree: ${npcService.npcDialogueTrees["cypher_leader_jax"]}`);
console.log(`Thorne's current dialogue tree: ${npcService.npcDialogueTrees["omnicorp_exec_thorne"]}`);

// Simulate completing Cypher path objectives
questService.completeObjective("open_source_rebellion", "infiltrate_omnicorp_servers");
questService.completeObjective("open_source_rebellion", "activate_data_leak");
questService.completeObjective("open_source_rebellion", "report_to_jax"); // This objective completion will trigger quest completion via linear progression

console.log(`Cypher Collective Rep: ${factionService.getReputation("cypher_collective")}`);
console.log(`OmniCorp Rep: ${factionService.getReputation("omnicorp")}`);
console.log(`Open Source Rebellion State: ${rebellionQuestProgress.state}`);
console.log(`Available items from Black Market Dealer: ${merchantService.getAvailableItems("black_market_dealer").map(i => i.name).join(', ')}`);


// 3. Simulate "The Lost Developer" (Discovery-based)
console.log("\n--- Scenario 3: The Lost Developer - Discovery & Puzzle ---");
let lostDevQuestProgress = questService.getQuestProgress("lost_developer");
if (!lostDevQuestProgress) {
    // Simulate finding the data shard (trigger for the quest)
    console.log("Player finds 'Encrypted Shard' and quest 'lost_developer' is triggered.");
    questService.startQuest("lost_developer");
    lostDevQuestProgress = questService.getQuestProgress("lost_developer")!;
    questService.completeObjective("lost_developer", "find_data_shard"); // Objective completed by discovery
}
console.log(`Lost Developer Quest State: ${lostDevQuestProgress.state}`);
console.log(`Current objective: ${lostDevQuestProgress.currentObjectiveId}`); // Should be 'decrypt_shard'

// Simulate decrypting the shard (puzzle completion)
// This would involve a HackingSystem calling this:
console.log("Player uses Hacking Tool to decrypt the shard...");
questService.completeObjective("lost_developer", "decrypt_shard");
npcService.startDialogue("lost_dev_log", questService, factionService, worldStateService); // Play the log after decryption
console.log(`Current objective: ${lostDevQuestProgress.currentObjectiveId}`); // Should be 'follow_first_clue'

// Simulate following clues and solving puzzles
questService.completeObjective("lost_developer", "follow_first_clue");
questService.completeObjective("lost_developer", "find_hidden_terminal");
questService.completeObjective("lost_developer", "solve_power_grid_puzzle");
questService.completeObjective("lost_developer", "access_secret_lab");
questService.completeObjective("lost_developer", "uncover_truth"); // This objective completion will trigger quest completion

console.log(`Lost Developer Quest State: ${lostDevQuestProgress.state}`);
console.log(`Cipher Ghost Truth Uncovered: ${worldStateService.getFlag("cipher_ghost_truth_uncovered")}`);

console.log("\n--- Simulation End ---");
```

---

## 5. Dialogue Integration Examples

The `DialogueTree` and `DialogueNode` interfaces, along with the `NPCService`, demonstrate how dialogue can be integrated.

*   **Dynamic Text:** The `text` property of `DialogueNode` and `DialogueChoice` can be a function that takes `playerState` (which includes quest progress, faction rep, world state) to generate dynamic text.
*   **Choice Presentation:** `DialogueNode` contains an array of `DialogueChoice` objects.
*   **Consequence Callbacks:** Each `DialogueChoice` has a `consequences` array, which are applied when that choice is made.
*   **Faction-Aware Responses:** Dialogue text can check faction reputation to change what an NPC says.

Let's refine an example:

```typescript
// Example of a dynamic dialogue node
const dynamicNPCResponse: DialogueTree = {
    id: "dynamic_npc_response",
    initialNodeId: "intro",
    nodes: {
        "intro": {
            id: "intro",
            speaker: "Guard Captain",
            text: (playerState: any) => {
                const omnicorpRep = playerState.factionRep;
                if (omnicorpRep >= 50) {
                    return "Ah, a trusted ally of OmniCorp. What can I do for you, friend?";
                } else if (omnicorpRep <= -50) {
                    return "You! I know your face. You're trouble. State your business, and make it quick.";
                } else {
                    return "Citizen. State your business.";
                }
            },
            choices: [
                {
                    id: "ask_about_compiler",
                    text: (playerState: any) => {
                        const compilerStatus = playerState.worldState;
                        if (compilerStatus === "Neutralized") {
                            return "Ask about the Compiler's shutdown.";
                        } else if (compilerStatus === "Free") {
                            return "Ask about the Compiler's erratic behavior.";
                        }
                        return "Ask about the Compiler.";
                    },
                    consequences: [],
                    nextNodeId: "compiler_info"
                },
                {
                    id: "leave",
                    text: "Leave.",
                    consequences: [],
                    nextNodeId: null
                }
            ]
        },
        "compiler_info": {
            id: "compiler_info",
            speaker: "Guard Captain",
            text: (playerState: any) => {
                const compilerStatus = playerState.worldState;
                if (compilerStatus === "Neutralized") {
                    return "The Compiler is offline, thankfully. OmniCorp restored order. Things are stable now.";
                } else if (compilerStatus === "Free") {
                    return "The Compiler is a menace! Data flows are wild. We're barely keeping up. It's all those Cypher Collective fanatics' fault!";
                } else if (compilerStatus === "Integrated") {
                    return "The Compiler is... different. It's stable, but feels more aware. A strange new era.";
                }
                return "The Compiler is still a mess. We're on high alert.";
            },
            nextNodeId: null
        }
    }
};

// Add this dynamic dialogue to NPCService
npcService = new NPCService([
    elaraDefaultDialogue, elaraOmniCorpPathDialogue, elaraCypherPathDialogue,
    jaxDefaultDialogue, jaxFriendlyDialogue, jaxHostileDialogue,
    thorneDefaultDialogue, thorneFriendlyDialogue, thorneHostileDialogue,
    lostDevLogInitial,
    dynamicNPCResponse // New dynamic dialogue
]);

// Simulate interaction with the dynamic NPC
console.log("\n--- Simulating Dynamic NPC Dialogue ---");

// Set some initial states for testing dynamic dialogue
factionService.changeReputation("omnicorp", 60); // Make player friendly to OmniCorp
worldStateService.setFlag("compilerStatus", "Neutralized"); // Set world state

npcService.startDialogue("guard_captain", questService, factionService, worldStateService);

factionService.changeReputation("omnicorp", -120); // Make player hostile to OmniCorp
worldStateService.setFlag("compilerStatus", "Free"); // Change world state

npcService.startDialogue("guard_captain", questService, factionService, worldStateService);

// Reset rep and set to integrated
factionService.changeReputation("omnicorp", 60);
worldStateService.setFlag("compilerStatus", "Integrated");
npcService.startDialogue("guard_captain", questService, factionService, worldStateService);
```

This comprehensive example demonstrates how to design branching quests, manage game state, integrate dialogue, and structure the underlying data using TypeScript. The mock services provide a basic runtime environment to illustrate the flow of consequences and state changes.