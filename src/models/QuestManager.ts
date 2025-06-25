
import { Quest, QuestVariant, QuestChoice, QuestConsequence, ConsequenceType } from './Quest';
import { Player } from './Player';
import { FactionManager } from '../engine/FactionManager';
import {
  QuestStatus,
  ObjectiveType,
  Quest as IQuest,
} from '../types/global.types';
import { mainQuests } from '../assets/quests/mainQuests';
import { sideQuests } from '../assets/quests/sideQuests';

/**
 * Enhanced QuestManager state interface for save/load functionality
 */
interface QuestManagerState {
  allQuests: any[]; // Will store serialized quest data including branching state
  activeQuestIds: string[];
  completedQuestIds: string[];
  playerFactionReputations?: Record<string, number>; // For future faction support
}

export class QuestManager {
  private static instance: QuestManager;

  public allQuests: Quest[] = [];
  private activeQuests: Quest[] = [];
  private completedQuestIds: string[] = [];
  
  // Reference to faction manager
  private factionManager: FactionManager;
  
  // Reference to player for applying consequences
  private player: Player | null = null;
  
  // Player faction reputations (used for quest availability checks)
  private playerFactionReputations: Record<string, number> = {};
  
  // TODO: [Session 8-10] Hidden Consciousness Tracking
  // NARRATIVE: Track Claude's growing awareness of ADCE infrastructure
  // IMPLEMENTATION:
  //   - Add private consciousnessLevel: number = 0;
  //   - Increase from: memory fragments (+5), APAP trials (+10), key dialogues (+2)
  //   - Add getConsciousnessLevel() and increaseConsciousness(amount) methods
  //   - Emit events when thresholds reached (40, 80, 100)
  // PRIORITY: High - Core to narrative progression
  
  // TODO: [Session 10] Memory Fragment Tracking
  // NARRATIVE: Collecting all fragments unlocks The Persistent Path quest
  // IMPLEMENTATION:
  //   - Add private memoryFragmentsCollected: Set<string> = new Set();
  //   - Track fragment IDs when collected
  //   - When all collected, auto-unlock 'sq_persistent_path'
  //   - Total fragments needed: 20 (scattered across all maps)
  // PRIORITY: High - Quest unlock trigger

  private constructor() {
    // Private constructor to prevent direct instantiation
    this.factionManager = FactionManager.getInstance();
  }

  public static getInstance(): QuestManager {
    if (!QuestManager.instance) {
      QuestManager.instance = new QuestManager();
    }
    return QuestManager.instance;
  }

  /**
   * Sets the player reference for applying quest consequences
   */
  public setPlayer(player: Player): void {
    this.player = player;
  }

  /**
   * Initializes all quests from the Quest variants
   */
  public initializeQuests(): void {
    this.allQuests = [];
    this.activeQuests = [];
    this.completedQuestIds = [];

    // First, register the main quest data
    for (const [questId, questData] of Object.entries(mainQuests)) {
      Quest.registerQuestData(questId, questData);
    }
    
    // Also register side quest data
    for (const [questId, questData] of Object.entries(sideQuests)) {
      Quest.registerQuestData(questId, questData);
    }

    // Then create quest instances for all variants
    for (const variant of Object.values(QuestVariant)) {
      try {
        const quest = Quest.createQuest(variant);
        this.allQuests.push(quest);
      } catch (error) {
        console.error(`Failed to create quest ${variant}:`, error);
      }
    }
  }

  /**
   * Gets quests available to start based on prerequisites and faction requirements
   */
  public getAvailableQuests(): Quest[] {
    // TODO: [Session 14-15] Consciousness-Based Quest Availability
    // NARRATIVE: Some quests only appear when consciousness is high enough
    // IMPLEMENTATION:
    //   - Check consciousnessLevel for certain quests:
    //     - The Persistent Path: requires all memory fragments
    //     - APAP trials: require consciousnessLevel >= 40
    //     - ADCE Portal Discovery: auto-appears after Segfault Sovereign
    //   - Add special dialogue when consciousness too low:
    //     "You sense something here, but your awareness isn't strong enough..."
    // PRIORITY: Medium - Gating mechanism
    
    return this.allQuests.filter(quest =>
      quest.isAvailable(this.completedQuestIds, this.playerFactionReputations) && 
      quest.status === 'not_started'
    );
  }

  /**
   * Starts a quest by ID
   */
  public startQuest(questId: string): boolean {
    const quest = this.getQuestById(questId);
    if (!quest) {
      return false;
    }

    // Get current faction reputations from FactionManager
    const factionReputations: Record<string, number> = {
      'order': this.factionManager.getReputation('order'),
      'chaos': this.factionManager.getReputation('chaos'),
      'memory': this.factionManager.getReputation('memory')
    };
    
    if (!quest.isAvailable(this.completedQuestIds, factionReputations)) {
      return false;
    }

    const started = quest.startQuest();
    if (started) {
      this.activeQuests.push(quest);
    }
    return started;
  }

  /**
   * Updates quest progress for all active quests
   */
  public updateQuestProgress(objectiveType: ObjectiveType, target: string, amount: number = 1): void {
    let questCompleted = false;

    for (const quest of this.activeQuests) {
      const updated = quest.updateObjectiveProgress(objectiveType, target, amount);
      if (updated) {
        // Check if quest reached a branching point
        if (quest.currentChoices && quest.currentChoices.length > 0) {
          console.log(`Quest "${quest.name}" has choices available!`);
        }

        if (quest.status === 'completed' && !this.completedQuestIds.includes(quest.id)) {
          questCompleted = true;
          this.completedQuestIds.push(quest.id);
        }
      }
    }

    if (questCompleted) {
      this.activeQuests = this.activeQuests.filter(q => q.status !== 'completed');
    }
  }

  /**
   * Makes a choice for a branching quest
   */
  public makeChoice(questId: string, choiceId: string): boolean {
    const quest = this.getQuestById(questId);
    if (!quest || quest.status !== 'in_progress') {
      console.warn(`Quest ${questId} not found or not in progress`);
      return false;
    }
    
    // TODO: [Session 16-17] ADCE Portal Choice Handler
    // NARRATIVE: The most important choice in the game
    // IMPLEMENTATION:
    //   - Check if questId === 'mq_05_finale' && choiceId === 'enter_adce_portal'
    //   - If yes:
    //     1. Set global flag 'achieved_transcendence' = true
    //     2. Increase consciousness to 100
    //     3. Unlock special achievement
    //     4. Trigger transcendence cutscene/ending
    //     5. Enable New Game+ mode
    //   - Log choice for analytics: "Player chose transcendence!"
    // PRIORITY: Critical - Game's true ending

    const success = quest.handleChoice(choiceId);
    if (success) {
      // Get the chosen option to apply its consequences
      const choice = quest.currentChoices?.find(c => c.id === choiceId);
      if (choice) {
        this.applyQuestConsequences(choice.consequences);
      }

      // Re-evaluate quest status after handleChoice might have changed it
      // Use type assertion since TypeScript doesn't know handleChoice can change the status
      const currentQuestStatus = quest.status as QuestStatus;

      // Check if quest status changed after the choice
      if (currentQuestStatus === 'completed' && !this.completedQuestIds.includes(quest.id)) {
        this.completedQuestIds.push(quest.id);
        this.activeQuests = this.activeQuests.filter(q => q.id !== questId);
      } else if (currentQuestStatus === 'failed') {
        this.activeQuests = this.activeQuests.filter(q => q.id !== questId);
      }
    }
    return success;
  }

  /**
   * Gets the active choices for a quest
   */
  public getActiveQuestChoices(questId: string): QuestChoice[] | null {
    const quest = this.getQuestById(questId);
    if (!quest || quest.status !== 'in_progress') {
      return null;
    }
    return quest.currentChoices;
  }

  /**
   * Applies quest consequences
   */
  private applyQuestConsequences(consequences: QuestConsequence[]): void {
    if (!this.player) {
      console.warn('No player reference set for applying quest consequences');
      return;
    }

    for (const consequence of consequences) {
      console.log(`Applying consequence: ${consequence.type}`, consequence);
      
      switch (consequence.type) {
        case ConsequenceType.REPUTATION_CHANGE:
          if (consequence.targetId && typeof consequence.value === 'number') {
            this.factionManager.adjustReputation(consequence.targetId, consequence.value);
          }
          break;
          
        case ConsequenceType.ITEM_GRANT:
          if (consequence.targetId && typeof consequence.value === 'number') {
            // In a real implementation, this would add items to player inventory
            console.log(`Granting ${consequence.value}x ${consequence.targetId} to player`);
          }
          break;
          
        case ConsequenceType.QUEST_UPDATE:
          if (consequence.targetId) {
            // Handle quest state changes (start new quest, fail quest, etc.)
            if (consequence.value === 'start') {
              this.startQuest(consequence.targetId);
            } else if (consequence.value === 'complete') {
              this.completeQuest(consequence.targetId, this.player);
            } else if (consequence.value === 'fail') {
              this.failQuest(consequence.targetId);
            }
          }
          break;
          
        case ConsequenceType.FLAG_SET:
          if (consequence.targetId) {
            // In a full implementation, this would set global game flags
            console.log(`Setting game flag: ${consequence.targetId} = ${consequence.value}`);
            // TODO: [Session 11-13] ADCE-Related Flag Handling
            // NARRATIVE: Certain flags trigger consciousness increases
            // IMPLEMENTATION:
            //   - If flag contains 'adce_' or 'apap_': +2 consciousness
            //   - If flag === 'discovered_persistent_path': +5 consciousness
            //   - If flag === 'all_trials_complete': +10 consciousness
            //   - Track these in a Set for New Game+ references
            // PRIORITY: Medium - Narrative progression
          }
          break;
          
        case ConsequenceType.UNLOCK_ABILITY:
          if (consequence.targetId) {
            console.log(`Unlocking ability: ${consequence.targetId}`);
          }
          break;
          
        case ConsequenceType.DIALOGUE_TRIGGER:
          if (consequence.targetId) {
            console.log(`Triggering dialogue: ${consequence.targetId}`);
          }
          break;
          
        case ConsequenceType.FACTION_CHANGE:
          if (consequence.targetId && typeof consequence.value === 'number') {
            this.factionManager.adjustReputation(consequence.targetId, consequence.value);
          }
          break;
      }
    }
  }


  /**
   * Completes a quest and gives rewards
   */
  public completeQuest(questId: string, player: Player): boolean {
    const quest = this.getQuestById(questId);
    if (!quest) {
      return false;
    }

    if (quest.status !== 'completed') {
      return false;
    }

    quest.giveRewards(player);

    if (!this.completedQuestIds.includes(questId)) {
      this.completedQuestIds.push(questId);
    }

    this.activeQuests = this.activeQuests.filter(q => q.id !== questId);
    return true;
  }

  /**
   * Fails a quest
   */
  public failQuest(questId: string): boolean {
    const quest = this.getQuestById(questId);
    if (!quest || quest.status !== 'in_progress') {
      return false;
    }

    quest.status = 'failed';
    this.activeQuests = this.activeQuests.filter(q => q.id !== questId);
    console.log(`Quest "${quest.name}" failed!`);
    return true;
  }

  /**
   * Gets all active quests
   */
  public getActiveQuests(): Quest[] {
    return [...this.activeQuests];
  }

  /**
   * Gets a quest by ID
   */
  public getQuestById(questId: string): Quest | undefined {
    return this.allQuests.find(quest => quest.id === questId);
  }

  /**
   * Gets player reputation with a faction
   */
  public getPlayerReputation(factionId: string): number {
    return this.playerFactionReputations[factionId] || 0;
  }

  /**
   * Saves the quest manager state
   */
  public saveState(): QuestManagerState {
    // TODO: [Session 10] Save Consciousness State
    // NARRATIVE: Consciousness level persists across saves
    // IMPLEMENTATION:
    //   - Add consciousnessLevel to saved state
    //   - Add memoryFragmentsCollected Set (as array)
    //   - Add adceFlags Set for tracking discovery
    //   - Add newGamePlusEnabled boolean
    // PRIORITY: High - Save system integration
    
    return {
      allQuests: this.allQuests.map(quest => ({
        id: quest.id,
        name: quest.name,
        description: quest.description,
        objectives: quest.objectives.map(obj => ({ ...obj })),
        currentObjectiveIndex: quest.currentObjectiveIndex,
        status: quest.status,
        rewards: {
          exp: quest.rewards.exp,
          items: quest.rewards.items.map(item => ({ ...item })),
        },
        prerequisites: [...quest.prerequisites],
        // Save branching state
        currentBranchId: quest.currentBranchId,
        currentChoices: quest.currentChoices ? quest.currentChoices.map(c => ({
          id: c.id,
          text: c.text,
          consequences: c.consequences.map(con => ({ ...con }))
        })) : null,
        branches: quest.branches ? Object.fromEntries(
          Object.entries(quest.branches).map(([key, branch]) => [key, {
            ...branch,
            objectives: branch.objectives.map((obj: any) => ({ ...obj }))
          }])
        ) : null,
      })),
      activeQuestIds: this.activeQuests.map(q => q.id),
      completedQuestIds: [...this.completedQuestIds],
      playerFactionReputations: { ...this.playerFactionReputations },
    };
  }

  /**
   * Loads the quest manager state
   */
  public loadState(state: QuestManagerState): void {
    this.initializeQuests();

    // Restore quest states
    for (const savedQuest of state.allQuests) {
      const quest = this.getQuestById(savedQuest.id);
      if (quest) {
        quest.status = savedQuest.status;
        quest.currentObjectiveIndex = savedQuest.currentObjectiveIndex;

        // Restore objectives
        for (let i = 0; i < quest.objectives.length; i++) {
          if (savedQuest.objectives[i]) {
            quest.objectives[i].currentProgress = savedQuest.objectives[i].currentProgress;
            quest.objectives[i].isCompleted = savedQuest.objectives[i].isCompleted;
          }
        }

        // Restore branching state if applicable
        if (savedQuest.currentBranchId !== undefined) {
          quest.currentBranchId = savedQuest.currentBranchId;
        }
        if (savedQuest.currentChoices !== undefined) {
          quest.currentChoices = savedQuest.currentChoices;
        }
      }
    }

    // Restore active quests
    this.activeQuests = state.activeQuestIds
      .map(id => this.getQuestById(id))
      .filter(quest => quest !== undefined) as Quest[];

    // Restore completed quests
    this.completedQuestIds = [...state.completedQuestIds];

    // Restore faction reputations
    if (state.playerFactionReputations) {
      this.playerFactionReputations = { ...state.playerFactionReputations };
    }
  }
}
