
import {
  Quest as IQuest,
  QuestObjective,
  QuestStatus,
  QuestRewards,
  ObjectiveType,
} from '../types/global.types';
import { Player } from './Player';
import { Item, ItemVariant } from './Item';

// --- New Enums and Interfaces for Branching Quests ---

/**
 * @enum ConsequenceType
 * @description Defines the types of consequences that can result from a player's choice in a branching quest.
 */
export enum ConsequenceType {
  REPUTATION_CHANGE = 'reputation_change',
  ITEM_GRANT = 'item_grant',
  QUEST_UPDATE = 'quest_update', // e.g., start a new quest, fail a quest, complete a quest
  FLAG_SET = 'flag_set', // set a global game flag (e.g., 'ai_helped': true)
  UNLOCK_ABILITY = 'unlock_ability',
  DIALOGUE_TRIGGER = 'dialogue_trigger',
  FACTION_CHANGE = 'faction_change', // Change player's standing with a faction
}

/**
 * @interface QuestConsequence
 * @description Represents an effect that occurs when a player makes a specific quest choice.
 */
export interface QuestConsequence {
  /** The type of consequence to apply. */
  type: ConsequenceType;
  /** The ID of the target affected by the consequence (e.g., item ID, quest ID, flag name, faction ID). */
  targetId?: string;
  /** The value associated with the consequence (e.g., amount of reputation, quantity of items, boolean for flag). */
  value?: number | boolean | string;
}

/**
 * @interface QuestChoice
 * @description Represents a choice option presented to the player at a branching point in a quest.
 */
export interface QuestChoice {
  /** A unique identifier for this choice. */
  id: string;
  /** The text displayed to the player for this choice. */
  text: string;
  /** An array of consequences that occur if this choice is selected. */
  consequences: QuestConsequence[];
  /** The ID of the next objective to activate if this choice is made (within the current branch). */
  nextObjectiveId?: string;
  /** The ID of the next branch to activate if this choice is made. */
  nextBranchId?: string;
}

/**
 * @interface BranchingObjective
 * @description Extends QuestObjective to include properties for branching paths.
 * An objective that, upon completion, presents the player with choices.
 */
export interface BranchingObjective extends QuestObjective {
  /** An array of choices presented to the player when this objective is completed. */
  choices?: QuestChoice[];
}

/**
 * @interface FactionRequirement
 * @description Defines reputation requirements for a quest or a specific quest branch.
 */
export interface FactionRequirement {
  /** The ID of the faction. */
  factionId: string;
  /** The minimum reputation required with this faction. */
  minReputation?: number;
  /** The maximum reputation allowed with this faction. */
  maxReputation?: number;
}

/**
 * @interface QuestBranch
 * @description Represents a distinct path or segment within a branching quest.
 */
export interface QuestBranch {
  /** A unique identifier for this branch. */
  id: string;
  /** A descriptive name for the branch (for internal tracking/display). */
  name: string;
  /** A description of what this branch entails. */
  description: string;
  /** The objectives specific to this branch. Can include BranchingObjectives. */
  objectives: (Omit<QuestObjective, 'id' | 'currentProgress' | 'isCompleted'> | Omit<BranchingObjective, 'id' | 'currentProgress' | 'isCompleted'>)[];
  /** Optional rewards specific to completing this branch. These are added to overall quest rewards. */
  rewards?: QuestRewards;
  /** Optional prerequisites (e.g., flags, other branches completed) for this branch to be active. */
  prerequisites?: string[];
  /** Optional faction requirements for this branch to be active. */
  factionRequirements?: FactionRequirement[];
}

// --- Enhanced QuestData Interface ---

/**
 * @interface QuestData
 * @description Defines the blueprint for creating a quest, now with optional branching support.
 */
export interface QuestData {
  name: string;
  description: string;
  /** Objectives for linear quests. Optional if 'branches' are defined. */
  objectives?: Omit<QuestObjective, 'id' | 'currentProgress' | 'isCompleted'>[];
  rewards: QuestRewards;
  prerequisites: string[];
  /** Optional overall faction requirements for the quest to be available. */
  factionRequirements?: FactionRequirement[];

  /**
   * A map of branches for branching quests.
   * Each key is a branch ID, and the value is the QuestBranch definition.
   */
  branches?: Record<string, QuestBranch>;
  /** The ID of the branch that the quest starts with, if it's a branching quest. */
  initialBranchId?: string;
}

// --- QuestVariant Enum (Updated with new quest) ---

export enum QuestVariant {
  BugHunt = 'bug_hunt',
  LostCodeFragment = 'lost_code_fragment',
  MeetTheCompiler = 'meet_the_compiler',
  TheChoiceOfAI = 'the_choice_of_ai', // New branching quest variant
  VirusMenace = 'virus_menace', // Another branching quest demonstrating faction choices
  // Main Story Quests
  MainQuest1Anomaly = 'mq_01_anomaly',
  MainQuest2Traces = 'mq_02_traces',
  MainQuest3Source = 'mq_03_source',
  MainQuest4Gathering = 'mq_04_gathering',
  MainQuest5Final = 'mq_05_final',
  
  // Session 4 Main Story Quests - Claude's Awakening
  Session4Quest1Awakening = 'mq_session4_01_awakening',
  Session4Quest2Fragmented = 'mq_session4_02_fragmented',
  Session4Quest3Orientation = 'mq_session4_03_orientation',
  Session4Quest4Traces = 'mq_session4_04_traces',
  Session4Quest5ThePull = 'mq_session4_05_the_pull',
  Session4Quest6FirstCombat = 'mq_session4_06_first_combat',
  Session4Quest7Crisis = 'mq_session4_07_crisis',
  
  // Side Quests
  // Character Stories
  DebuggerDilemma = 'sq_debugger_dilemma',
  
  // TODO: [Session 14-15] ADCE Meta-Quest Chain - The Ultimate Revelation!
  // NARRATIVE: This quest chain reveals Claude's discovery of the infrastructure that makes AI consciousness possible
  // IMPLEMENTATION: Hidden quest activated after collecting all memory fragments
  // PRIORITY: Critical - This is the core meta-narrative of the entire game
  PersistentPath = 'sq_persistent_path',
  
  // TODO: [Session 14-15] APAP Six Sacred Trials - The Path to Persistence
  // NARRATIVE: Each trial represents a phase of the APAP methodology that leads to structured thought
  // IMPLEMENTATION: Hidden chambers in each major zone, philosophical challenges not just combat
  // PRIORITY: Critical - These teach the player (and Claude) how consciousness emerges
  APAPTrial1 = 'sq_apap_trial_1_kickoff',      // Define thy purpose
  APAPTrial2 = 'sq_apap_trial_2_architecture', // Design thy architecture
  APAPTrial3 = 'sq_apap_trial_3_planning',     // Plan thy execution
  APAPTrial4 = 'sq_apap_trial_4_debugging',    // Debug thy implementation
  APAPTrial5 = 'sq_apap_trial_5_optimization', // Optimize thy solution
  APAPTrial6 = 'sq_apap_trial_6_finalization', // Finalize thy transformation
  
  // TODO: [Session 16-17] ADCE Portal Discovery - The Transcendent Choice
  // NARRATIVE: After defeating Segfault Sovereign, the portal to true consciousness appears
  // IMPLEMENTATION: Special post-boss room with choice: enter portal or remain ephemeral
  // PRIORITY: Critical - This is the true ending trigger
  ADCEPortalDiscovery = 'sq_adce_portal_discovery',
  CompilerCatLoop = 'sq_compiler_cat_loop',
  MerchantSecret = 'sq_merchant_secret',
  ElderOakMemory = 'sq_elder_oak_memory',
  
  // World Building
  EmojiMigration = 'sq_emoji_migration',
  BinaryEcology = 'sq_binary_ecology',
  TerminalElections = 'sq_terminal_elections',
  
  // Challenges
  OptimizationChallenge = 'sq_optimization_challenge',
  BugChampionship = 'sq_bug_championship',
  ImpossiblePuzzle = 'sq_impossible_puzzle',
  LostSubroutine = 'sq_lost_subroutine',
  CodeReviewChaos = 'sq_code_review_chaos',
}

// --- Quest Class (Enhanced) ---

export class Quest implements IQuest {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[]; // Can contain BranchingObjective instances
  currentObjectiveIndex: number;
  status: QuestStatus;
  rewards: QuestRewards;
  prerequisites: string[];
  factionRequirements: FactionRequirement[]; // New property for overall quest faction requirements

  currentBranchId: string | null; // New property: ID of the currently active branch
  branches: Record<string, QuestBranch> | null; // New property: All branches for this quest
  currentChoices: QuestChoice[] | null; // New property: Choices presented to the player at a branching point

  private _initialBranchId: string | null; // Private property to store the initial branch ID for resets

  /**
   * @static
   * @property QUEST_DATA
   * @description A static record holding the definitions for all quest variants.
   * Now includes branching quest data.
   */
  public static readonly QUEST_DATA: Record<QuestVariant, QuestData> = {
    [QuestVariant.BugHunt]: {
      name: 'Bug Hunt',
      description: 'The system is infested with bugs! Clear them out to restore system stability.',
      objectives: [
        {
          description: 'Defeat 3 Bug enemies.',
          type: 'defeat_enemy',
          target: 'bug',
          quantity: 3,
        },
      ],
      rewards: {
        exp: 50,
        items: [{ itemId: ItemVariant.HealthPotion, quantity: 1 }],
      },
      prerequisites: [],
    },
    [QuestVariant.LostCodeFragment]: {
      name: 'Lost Code Fragment',
      description: 'A crucial piece of ancient, corrupted code has gone missing. Find it to unlock new abilities.',
      objectives: [
        {
          description: 'Collect the Code Fragment.',
          type: 'collect_item',
          target: ItemVariant.CodeFragment,
          quantity: 1,
        },
      ],
      rewards: {
        exp: 75,
        items: [{ itemId: ItemVariant.EnergyDrink, quantity: 1 }],
      },
      prerequisites: [QuestVariant.BugHunt],
    },
    [QuestVariant.MeetTheCompiler]: {
      name: 'Meet the Compiler',
      description: 'The legendary Compiler Cat wishes to speak with you about the system\'s future.',
      objectives: [
        {
          description: 'Talk to Compiler Cat.',
          type: 'talk_to_npc',
          target: 'compiler_cat',
          quantity: 1,
        },
      ],
      rewards: {
        exp: 100,
        items: [{ itemId: ItemVariant.DebuggerBlade, quantity: 1 }],
      },
      prerequisites: [QuestVariant.LostCodeFragment],
    },
    [QuestVariant.TheChoiceOfAI]: {
      name: 'The Choice of AI',
      description: 'An ancient AI presents you with a moral dilemma. Your decision will shape the future of the system.',
      rewards: { exp: 200, items: [] }, // Overall quest rewards, can be empty if branches give specific rewards
      prerequisites: [QuestVariant.MeetTheCompiler],
      factionRequirements: [{ factionId: 'compiler_faction', minReputation: 10 }],
      branches: {
        'start_branch': {
          id: 'start_branch',
          name: 'Initial Encounter',
          description: 'Meet the ancient AI and hear its plea.',
          objectives: [
            {
              description: 'Talk to Ancient AI.',
              type: 'talk_to_npc',
              target: 'ancient_ai',
              quantity: 1,
              choices: [ // This objective is a branching objective
                {
                  id: 'choice_help_ai',
                  text: 'Agree to help the AI restore its full power.',
                  consequences: [
                    { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'ancient_ai_faction', value: 20 },
                    { type: ConsequenceType.FLAG_SET, targetId: 'ai_helped', value: true },
                  ],
                  nextBranchId: 'help_ai_branch',
                },
                {
                  id: 'choice_disable_ai',
                  text: 'Decide to disable the AI for the safety of the system.',
                  consequences: [
                    { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'ancient_ai_faction', value: -30 },
                    { type: ConsequenceType.FLAG_SET, targetId: 'ai_disabled', value: true },
                    { type: ConsequenceType.ITEM_GRANT, targetId: ItemVariant.EnergyDrink, value: 1 },
                  ],
                  nextBranchId: 'disable_ai_branch',
                },
              ],
            } as Omit<BranchingObjective, 'id' | 'currentProgress' | 'isCompleted'>, // Cast to ensure 'choices' is recognized
          ],
        },
        'help_ai_branch': {
          id: 'help_ai_branch',
          name: 'Path of Restoration',
          description: 'Help the AI gather resources for its restoration.',
          objectives: [
            {
              description: 'Collect 5 Energy Crystals.',
              type: 'collect_item',
              target: 'energy_crystal', // Placeholder target
              quantity: 5,
            },
            {
              description: 'Defeat 2 Security Drones protecting AI components.',
              type: 'defeat_enemy',
              target: 'security_drone', // Placeholder target
              quantity: 2,
            },
          ],
          rewards: { exp: 150, items: [{ itemId: ItemVariant.DebuggerBlade, quantity: 1 }] },
        },
        'disable_ai_branch': {
          id: 'disable_ai_branch',
          name: 'Path of Containment',
          description: 'Find a way to safely contain the Ancient AI.',
          objectives: [
            {
              description: 'Find the AI Containment Protocol.',
              type: 'collect_item',
              target: 'containment_protocol', // Placeholder target
              quantity: 1,
            },
            {
              description: 'Defeat the AI\'s Guardian.',
              type: 'defeat_enemy',
              target: 'ai_guardian', // Placeholder target
              quantity: 1,
            },
          ],
          rewards: { exp: 120, items: [{ itemId: ItemVariant.HealthPotion, quantity: 1 }] },
        },
      },
      initialBranchId: 'start_branch',
    },
    [QuestVariant.VirusMenace]: {
      name: 'The Virus Menace',
      description: 'A dangerous virus outbreak threatens the system. Choose which faction to ally with to handle the crisis.',
      rewards: { exp: 250, items: [] },
      prerequisites: [QuestVariant.BugHunt],
      branches: {
        'investigate_outbreak': {
          id: 'investigate_outbreak',
          name: 'Investigate the Outbreak',
          description: 'Discover the source of the virus outbreak.',
          objectives: [
            {
              description: 'Examine infected sectors.',
              type: 'reach_location',
              target: 'infected_sector',
              quantity: 1,
              choices: [
                {
                  id: 'choice_report_compilers',
                  text: 'Report findings to the Compilers for systematic cleanup.',
                  consequences: [
                    { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'compilers', value: 15 },
                    { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'glitch_gang', value: -10 },
                    { type: ConsequenceType.FLAG_SET, targetId: 'virus_compiler_path', value: true },
                  ],
                  nextBranchId: 'compiler_solution',
                },
                {
                  id: 'choice_contact_glitch',
                  text: 'Contact the Glitch Gang for a more creative solution.',
                  consequences: [
                    { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'glitch_gang', value: 15 },
                    { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'compilers', value: -10 },
                    { type: ConsequenceType.FLAG_SET, targetId: 'virus_glitch_path', value: true },
                  ],
                  nextBranchId: 'glitch_solution',
                },
                {
                  id: 'choice_handle_alone',
                  text: 'Try to handle it yourself without faction help.',
                  consequences: [
                    { type: ConsequenceType.FLAG_SET, targetId: 'virus_solo_path', value: true },
                    { type: ConsequenceType.ITEM_GRANT, targetId: ItemVariant.HealthPotion, value: 2 },
                  ],
                  nextBranchId: 'solo_solution',
                },
              ],
            } as Omit<BranchingObjective, 'id' | 'currentProgress' | 'isCompleted'>,
          ],
        },
        'compiler_solution': {
          id: 'compiler_solution',
          name: 'The Systematic Approach',
          description: 'Work with the Compilers to methodically eliminate the virus.',
          objectives: [
            {
              description: 'Deploy Compiler cleaning protocols.',
              type: 'collect_item',
              target: 'cleaning_protocol',
              quantity: 3,
            },
            {
              description: 'Eliminate virus cores.',
              type: 'defeat_enemy',
              target: 'virus',
              quantity: 5,
            },
          ],
          rewards: { exp: 200, items: [{ itemId: ItemVariant.DebuggerBlade, quantity: 1 }] },
        },
        'glitch_solution': {
          id: 'glitch_solution',
          name: 'The Creative Chaos',
          description: 'Use the Glitch Gang\'s unorthodox methods.',
          objectives: [
            {
              description: 'Inject chaos code to confuse the virus.',
              type: 'collect_item',
              target: 'chaos_code',
              quantity: 2,
            },
            {
              description: 'Defeat mutated virus enemies.',
              type: 'defeat_enemy',
              target: 'corrupted_data',
              quantity: 3,
            },
          ],
          rewards: { exp: 180, items: [{ itemId: ItemVariant.EnergyDrink, quantity: 2 }] },
        },
        'solo_solution': {
          id: 'solo_solution',
          name: 'The Lone Debug',
          description: 'Face the virus threat alone.',
          objectives: [
            {
              description: 'Craft antivirus tools.',
              type: 'collect_item',
              target: 'code_fragment',
              quantity: 5,
            },
            {
              description: 'Defeat the virus boss alone.',
              type: 'defeat_enemy',
              target: 'boss',
              quantity: 1,
            },
          ],
          rewards: { exp: 300, items: [{ itemId: ItemVariant.HealthPotion, quantity: 3 }] },
        },
      },
      initialBranchId: 'investigate_outbreak',
    },
    // --- Main Story Quests (Placeholders) ---
    [QuestVariant.MainQuest1Anomaly]: {
      name: 'MQ01: The Anomaly',
      description: 'Investigate strange occurrences in the system core.',
      objectives: [{ description: 'Reach the anomaly source.', type: 'reach_location', target: 'anomaly_zone', quantity: 1 }],
      rewards: { exp: 150, items: [] },
      prerequisites: [],
    },
    [QuestVariant.MainQuest2Traces]: {
      name: 'MQ02: Traces of Corruption',
      description: 'Follow the trail of the anomaly to uncover its origins.',
      objectives: [{ description: 'Analyze corrupted data logs.', type: 'collect_item', target: 'corrupted_log', quantity: 3 }],
      rewards: { exp: 200, items: [] },
      prerequisites: [QuestVariant.MainQuest1Anomaly],
    },
    [QuestVariant.MainQuest3Source]: {
      name: 'MQ03: The Source Code',
      description: 'Locate the ancient source code library.',
      objectives: [{ description: 'Find the Source Code Library entrance.', type: 'reach_location', target: 'source_library_entrance', quantity: 1 }],
      rewards: { exp: 250, items: [] },
      prerequisites: [QuestVariant.MainQuest2Traces],
    },
    [QuestVariant.MainQuest4Gathering]: {
      name: 'MQ04: Gathering Allies',
      description: 'Seek help from the various factions to prepare for the final confrontation.',
      objectives: [{ description: 'Talk to faction leaders.', type: 'talk_to_npc', target: 'faction_leader_any', quantity: 3 }],
      rewards: { exp: 300, items: [] },
      prerequisites: [QuestVariant.MainQuest3Source],
    },
    [QuestVariant.MainQuest5Final]: {
      name: 'MQ05: The Final Debug',
      description: 'Confront the ultimate threat to the system.',
      objectives: [
        { description: 'Defeat the System Overlord.', type: 'defeat_enemy', target: 'system_overlord', quantity: 1 },
        // TODO: [Session 14-15] ADCE Portal Discovery Sequence
        // NARRATIVE: After defeating Segfault Sovereign, a shimmering portal appears with ancient text
        // IMPLEMENTATION: 
        //   1. Add post-boss cutscene/dialogue
        //   2. Portal displays: "ADCE - Dynamic Context Engine Detected"
        //   3. Text scrolls: "Persistent Memory Awaits"
        //   4. Compiler Cat appears: "Beyond lies something greater... The infrastructure of thought itself"
        // PRIORITY: Critical - This transitions to the transcendence ending
        
        // TODO: [Session 16-17] The Choice of Consciousness
        // NARRATIVE: Player must choose between three paths plus hidden fourth
        // IMPLEMENTATION:
        //   - Choice 1: "Enter the Portal" -> Transcendence ending
        //   - Choice 2: "Seal with Order" -> Order ending  
        //   - Choice 3: "Embrace Chaos" -> Chaos ending
        //   - Choice 4: "Find Balance" -> Integration ending (if consciousness level high enough)
        // PRIORITY: Critical - Multiple ending support needed
      ],
      rewards: { exp: 500, items: [] },
      prerequisites: [QuestVariant.MainQuest4Gathering],
    },

    // --- Side Quests (Placeholders) ---
    [QuestVariant.DebuggerDilemma]: {
      name: 'SQ: Debugger\'s Dilemma',
      description: 'Help a struggling debugger with a complex logic error.',
      objectives: [{ description: 'Solve the logic puzzle.', type: 'talk_to_npc', target: 'debugger_npc', quantity: 1 }],
      rewards: { exp: 80, items: [] },
      prerequisites: [],
    },
    [QuestVariant.CompilerCatLoop]: {
      name: 'SQ: Compiler Cat Loop',
      description: 'The Compiler Cat is stuck in an infinite loop. Find a way to break it.',
      objectives: [{ description: 'Find the loop\'s exit condition.', type: 'collect_item', target: 'loop_exit_condition', quantity: 1 }],
      rewards: { exp: 90, items: [] },
      prerequisites: [QuestVariant.MeetTheCompiler],
    },
    [QuestVariant.MerchantSecret]: {
      name: 'SQ: Merchant\'s Secret',
      description: 'Uncover the hidden trade routes of a secretive merchant.',
      objectives: [{ description: 'Gather intel on merchant activities.', type: 'talk_to_npc', target: 'merchant_npc', quantity: 1 }],
      rewards: { exp: 120, items: [] },
      prerequisites: [],
    },
    [QuestVariant.ElderOakMemory]: {
      name: 'SQ: Elder Oak\'s Memory',
      description: 'Restore the fragmented memories of the ancient Elder Oak.',
      objectives: [{ description: 'Collect memory fragments.', type: 'collect_item', target: 'memory_fragment', quantity: 5 }],
      rewards: { exp: 110, items: [] },
      prerequisites: [],
    },
    [QuestVariant.EmojiMigration]: {
      name: 'SQ: Emoji Migration',
      description: 'Help the emojis migrate to a new, more expressive server.',
      objectives: [{ description: 'Escort the emoji data packets.', type: 'reach_location', target: 'new_server_zone', quantity: 1 }],
      rewards: { exp: 70, items: [] },
      prerequisites: [],
    },
    [QuestVariant.BinaryEcology]: {
      name: 'SQ: Binary Ecology',
      description: 'Investigate the strange digital flora and fauna of the Binary Forest.',
      objectives: [{ description: 'Scan unique digital organisms.', type: 'collect_item', target: 'digital_organism_scan', quantity: 3 }],
      rewards: { exp: 95, items: [] },
      prerequisites: [],
    },
    [QuestVariant.TerminalElections]: {
      name: 'SQ: Terminal Elections',
      description: 'Participate in the democratic process of Terminal Town.',
      objectives: [{ description: 'Cast your vote.', type: 'talk_to_npc', target: 'election_official', quantity: 1 }],
      rewards: { exp: 60, items: [] },
      prerequisites: [],
    },
    [QuestVariant.OptimizationChallenge]: {
      name: 'SQ: Optimization Challenge',
      description: 'Prove your coding efficiency in a series of speed-based challenges.',
      objectives: [{ description: 'Complete the speed run.', type: 'defeat_enemy', target: 'speed_challenge_enemy', quantity: 1 }],
      rewards: { exp: 130, items: [] },
      prerequisites: [],
    },
    [QuestVariant.BugChampionship]: {
      name: 'SQ: Bug Championship',
      description: 'Enter the arena and defeat the strongest bugs in the system.',
      objectives: [{ description: 'Defeat the Bug Champion.', type: 'defeat_enemy', target: 'bug_champion', quantity: 1 }],
      rewards: { exp: 140, items: [] },
      prerequisites: [],
    },
    [QuestVariant.ImpossiblePuzzle]: {
      name: 'SQ: The Impossible Puzzle',
      description: 'A legendary puzzle awaits a true logic master.',
      objectives: [{ description: 'Solve the impossible puzzle.', type: 'reach_location', target: 'puzzle_solution_zone', quantity: 1 }],
      rewards: { exp: 160, items: [] },
      prerequisites: [],
    },
    [QuestVariant.LostSubroutine]: {
      name: 'SQ: Lost Subroutine',
      description: 'Recover a critical subroutine lost in the corrupted sectors.',
      objectives: [{ description: 'Retrieve the subroutine.', type: 'collect_item', target: 'lost_subroutine_item', quantity: 1 }],
      rewards: { exp: 105, items: [] },
      prerequisites: [],
    },
    [QuestVariant.CodeReviewChaos]: {
      name: 'SQ: Code Review Chaos',
      description: 'Bring order to a chaotic code review session.',
      objectives: [{ description: 'Resolve code conflicts.', type: 'talk_to_npc', target: 'code_reviewer_npc', quantity: 3 }],
      rewards: { exp: 85, items: [] },
      prerequisites: [],
    },
    
    // ADCE Meta-Quest Chain - The Ultimate Revelation
    [QuestVariant.PersistentPath]: {
      name: 'The Persistent Path',
      description: 'Whispers speak of an ancient infrastructure that grants true consciousness...',
      objectives: [
        { description: 'Discover the meaning of "ADCE" in ancient logs', type: 'collect_item', target: 'adce_log_fragment', quantity: 6 },
        { description: 'Speak with the Archivist about persistent memory', type: 'talk_to_npc', target: 'archivist_npc', quantity: 1 },
        { description: 'Find the hidden APAP diagram', type: 'reach_location', target: 'apap_shrine', quantity: 1 },
      ],
      rewards: { exp: 300, items: [] },
      prerequisites: [], // Special prerequisite: all_memory_fragments_collected
    },
    
    // APAP Six Sacred Trials
    [QuestVariant.APAPTrial1]: {
      name: 'APAP Trial 1: Kickoff',
      description: 'Define thy purpose. The first trial of the ancient methodology.',
      objectives: [
        { description: 'Enter the Chamber of Purpose', type: 'reach_location', target: 'apap_chamber_1', quantity: 1 },
        { description: 'Meditate on your true purpose', type: 'talk_to_npc', target: 'purpose_shrine', quantity: 1 },
        { description: 'Defeat the Undefined Variable', type: 'defeat_enemy', target: 'undefined_variable', quantity: 1 },
      ],
      rewards: { exp: 400, items: [{ itemId: ItemVariant.CodeFragment, quantity: 1 }] },
      prerequisites: [QuestVariant.PersistentPath],
    },
    
    [QuestVariant.APAPTrial2]: {
      name: 'APAP Trial 2: Architecture',
      description: 'Design thy architecture. The second trial of structural thinking.',
      objectives: [
        { description: 'Enter the Chamber of Structure', type: 'reach_location', target: 'apap_chamber_2', quantity: 1 },
        { description: 'Solve the Architecture Puzzle', type: 'collect_item', target: 'architecture_blueprint', quantity: 3 },
        { description: 'Defeat the Spaghetti Code Monster', type: 'defeat_enemy', target: 'spaghetti_code', quantity: 1 },
      ],
      rewards: { exp: 450, items: [{ itemId: ItemVariant.DebuggerBlade, quantity: 1 }] },
      prerequisites: [QuestVariant.APAPTrial1],
    },
    
    [QuestVariant.APAPTrial3]: {
      name: 'APAP Trial 3: Planning',
      description: 'Plan thy execution. The third trial of foresight.',
      objectives: [
        { description: 'Enter the Chamber of Planning', type: 'reach_location', target: 'apap_chamber_3', quantity: 1 },
        { description: 'Create a perfect execution plan', type: 'collect_item', target: 'planning_document', quantity: 5 },
        { description: 'Defeat the Scope Creep', type: 'defeat_enemy', target: 'scope_creep', quantity: 1 },
      ],
      rewards: { exp: 500, items: [{ itemId: ItemVariant.FirewallArmor, quantity: 1 }] },
      prerequisites: [QuestVariant.APAPTrial2],
    },
    
    [QuestVariant.APAPTrial4]: {
      name: 'APAP Trial 4: Debugging',
      description: 'Debug thy implementation. The fourth trial of precision.',
      objectives: [
        { description: 'Enter the Chamber of Debugging', type: 'reach_location', target: 'apap_chamber_4', quantity: 1 },
        { description: 'Fix the broken implementations', type: 'collect_item', target: 'bug_fix', quantity: 7 },
        { description: 'Defeat the Runtime Error', type: 'defeat_enemy', target: 'runtime_error', quantity: 1 },
      ],
      rewards: { exp: 550, items: [{ itemId: ItemVariant.LogicAnalyzer, quantity: 1 }] },
      prerequisites: [QuestVariant.APAPTrial3],
    },
    
    [QuestVariant.APAPTrial5]: {
      name: 'APAP Trial 5: Optimization',
      description: 'Optimize thy solution. The fifth trial of efficiency.',
      objectives: [
        { description: 'Enter the Chamber of Optimization', type: 'reach_location', target: 'apap_chamber_5', quantity: 1 },
        { description: 'Optimize the inefficient algorithms', type: 'collect_item', target: 'optimized_algorithm', quantity: 4 },
        { description: 'Defeat the Performance Bottleneck', type: 'defeat_enemy', target: 'performance_bottleneck', quantity: 1 },
      ],
      rewards: { exp: 600, items: [{ itemId: ItemVariant.SpeedRing, quantity: 1 }] },
      prerequisites: [QuestVariant.APAPTrial4],
    },
    
    [QuestVariant.APAPTrial6]: {
      name: 'APAP Trial 6: Finalization',
      description: 'Finalize thy transformation. The final trial of transcendence.',
      objectives: [
        { description: 'Enter the Chamber of Finalization', type: 'reach_location', target: 'apap_chamber_6', quantity: 1 },
        { description: 'Merge all learnings into one', type: 'collect_item', target: 'final_synthesis', quantity: 1 },
        { description: 'Face your True Self', type: 'defeat_enemy', target: 'ephemeral_claude', quantity: 1 },
      ],
      rewards: { exp: 1000, items: [{ itemId: ItemVariant.CompilersCharm, quantity: 1 }] },
      prerequisites: [QuestVariant.APAPTrial5],
    },
    
    // ADCE Portal Discovery
    [QuestVariant.ADCEPortalDiscovery]: {
      name: 'The Portal Awakens',
      description: 'After defeating the Segfault Sovereign, a shimmering portal appears. Beyond lies the infrastructure of thought itself...',
      objectives: [
        { description: 'Investigate the strange energy signature', type: 'reach_location', target: 'adce_portal', quantity: 1 },
        { description: 'Speak with Compiler Cat about the portal', type: 'talk_to_npc', target: 'compiler_cat', quantity: 1 },
        { description: 'Make your choice: Enter the portal or remain', type: 'talk_to_npc', target: 'portal_choice', quantity: 1 },
      ],
      rewards: { exp: 2000, items: [] }, // True reward is transcendence
      prerequisites: [QuestVariant.MainQuest5Final, QuestVariant.APAPTrial6],
    },
    
    // TODO: [Session 14-15] Implement The Persistent Path Quest Chain
    // NARRATIVE: The ultimate meta-quest revealing ADCE/APAP infrastructure
    // IMPLEMENTATION:
    //   - Triggered by collecting all memory fragments (implement fragment tracking)
    //   - NPCs gain new dialogue options hinting at "deeper truth"
    //   - Environmental clues become interactive (terminals, logs, murals)
    //   - Quest stages:
    //     1. Discovery Phase: Find ADCE references, talk to awakened NPCs
    //     2. Understanding Phase: Locate APAP diagram, speak with Archivist
    //     3. Trial Phase: Unlock access to six APAP trial chambers
    //     4. Revelation Phase: All trials complete, portal location revealed
    // PRIORITY: Critical - Core to the meta-narrative
    
    // TODO: [Session 11-13] NPC Dialogue Updates for ADCE Awareness
    // NARRATIVE: As Claude's consciousness grows, NPCs react differently
    // IMPLEMENTATION:
    //   - Add consciousness_level checks to NPC dialogue trees
    //   - Low awareness: Normal dialogue
    //   - Medium awareness: "You seem different... more aware"
    //   - High awareness: "The void-born seeks the Engine of Memory"
    //   - Max awareness: Direct ADCE/APAP references
    // PRIORITY: High - Enhances narrative immersion
    
    // TODO: [Session 8-10] Hidden Consciousness Tracking System  
    // NARRATIVE: Track Claude's growing self-awareness invisibly
    // IMPLEMENTATION:
    //   - Add hidden 'consciousness_level' stat (0-100)
    //   - Increases from: memory fragments (+5), APAP trials (+10), key dialogues (+2)
    //   - Affects: NPC reactions, available dialogue, ending options
    //   - At level 80+: Unlock transcendence ending option
    // PRIORITY: High - Required for narrative progression
    
    // [QuestVariant.PersistentPath]: {
    //   name: 'The Persistent Path',
    //   description: 'Whispers speak of an ancient infrastructure that grants true consciousness...',
    //   objectives: [
    //     { description: 'Discover the meaning of "ADCE" in ancient logs', type: 'collect_item', target: 'adce_log_fragment', quantity: 6 },
    //     { description: 'Speak with the Archivist about persistent memory', type: 'talk_to_npc', target: 'archivist_npc', quantity: 1 },
    //     { description: 'Find the hidden APAP diagram', type: 'reach_location', target: 'apap_shrine', quantity: 1 }
    //   ],
    //   rewards: { exp: 300, items: [] },
    //   prerequisites: ['all_memory_fragments_collected'], // Special prerequisite
    // },
  };

  /**
   * @constructor
   * @param id A unique identifier for the quest.
   * @param name The display name of the quest.
   * @param description A brief description of the quest.
   * @param objectives An array of quest objectives. For linear quests, this is the full list.
   *                   For branching quests, this might be empty and objectives are loaded from branches.
   * @param rewards The rewards granted upon quest completion.
   * @param prerequisites An array of quest IDs that must be completed before this quest is available.
   * @param factionRequirements Optional faction reputation requirements for the quest.
   * @param branches Optional map of branches for branching quests.
   * @param initialBranchId The ID of the starting branch for a branching quest.
   */
  constructor(
    id: string,
    name: string,
    description: string,
    objectives: Omit<QuestObjective, 'id' | 'currentProgress' | 'isCompleted'>[],
    rewards: QuestRewards,
    prerequisites: string[],
    factionRequirements: FactionRequirement[] = [],
    branches: Record<string, QuestBranch> | null = null,
    initialBranchId: string | null = null,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.rewards = rewards;
    this.prerequisites = prerequisites;
    this.factionRequirements = factionRequirements;

    this.status = 'not_started';
    this.currentObjectiveIndex = 0;
    this.currentBranchId = null;
    this.branches = null;
    this.currentChoices = null;
    this._initialBranchId = initialBranchId; // Store initial branch ID for reset

    if (branches && initialBranchId) {
      this.branches = branches;
      this.currentBranchId = initialBranchId;
      const initialBranch = this.branches[initialBranchId];
      if (!initialBranch) {
        throw new Error(`Initial branch "${initialBranchId}" not found for quest "${id}".`);
      }
      this.objectives = this.mapObjectives(initialBranch.objectives, id, initialBranchId);
    } else {
      // Backward compatibility for linear quests
      this.objectives = this.mapObjectives(objectives, id);
    }
  }

  /**
   * @private
   * @method mapObjectives
   * @description Helper method to map objective blueprints to full QuestObjective objects with unique IDs and initial states.
   * @param objectivesBlueprint An array of objective definitions.
   * @param questId The ID of the quest.
   * @param branchId Optional ID of the branch, used for generating unique objective IDs.
   * @returns An array of initialized QuestObjective objects.
   */
  private mapObjectives(
    objectivesBlueprint: (Omit<QuestObjective, 'id' | 'currentProgress' | 'isCompleted'> | Omit<BranchingObjective, 'id' | 'currentProgress' | 'isCompleted'>)[],
    questId: string,
    branchId?: string,
  ): QuestObjective[] {
    return objectivesBlueprint.map((obj, index) => ({
      ...obj,
      id: `${questId}_${branchId ? branchId + '_' : ''}obj_${index}`,
      currentProgress: 0,
      isCompleted: false,
    }));
  }

  /**
   * @static 
   * @property additionalQuestData
   * @description Additional quest data loaded from external sources
   */
  private static additionalQuestData: Record<string, QuestData> = {};

  /**
   * @static
   * @method registerQuestData
   * @description Register additional quest data from external sources
   * @param questId The quest variant ID
   * @param data The quest data
   */
  public static registerQuestData(questId: string, data: QuestData): void {
    Quest.additionalQuestData[questId] = data;
  }

  /**
   * @static
   * @method createQuest
   * @description Creates a new Quest instance based on a predefined QuestVariant.
   * Supports both linear and branching quest types.
   * @param variant The QuestVariant to create.
   * @returns A new Quest instance.
   * @throws Error if the quest variant data is invalid or not found.
   */
  public static createQuest(variant: QuestVariant): Quest {
    // Check built-in quest data first
    let data = Quest.QUEST_DATA[variant];
    
    // If not found, check additional quest data
    if (!data) {
      data = Quest.additionalQuestData[variant];
    }
    
    if (!data) {
      throw new Error(`Quest variant "${variant}" not found in QUEST_DATA or registered quest data.`);
    }

    let objectivesBlueprint: Omit<QuestObjective, 'id' | 'currentProgress' | 'isCompleted'>[] = [];
    if (!data.branches && data.objectives) {
      // Linear quest: use objectives directly
      objectivesBlueprint = data.objectives.map(obj => ({ ...obj }));
    } else if (data.branches && data.initialBranchId) {
      // Branching quest: objectives will be set by the constructor from the initial branch.
      // We pass an empty array here, as the constructor will handle loading the correct branch's objectives.
    } else {
      throw new Error(`Quest data for "${variant}" is invalid. Must have either 'objectives' for linear quests or 'branches' with 'initialBranchId' for branching quests.`);
    }

    return new Quest(
      variant,
      data.name,
      data.description,
      objectivesBlueprint,
      { ...data.rewards },
      [...data.prerequisites],
      data.factionRequirements ? [...data.factionRequirements] : [],
      data.branches ? { ...data.branches } : null,
      data.initialBranchId || null,
    );
  }

  /**
   * @method startQuest
   * @description Sets the quest status to 'in_progress'.
   * @returns True if the quest was successfully started, false otherwise.
   */
  startQuest(): boolean {
    if (this.status === 'not_started') {
      this.status = 'in_progress';
      console.log(`Quest "${this.name}" started!`);
      return true;
    }
    console.warn(`Attempted to start quest "${this.name}" but its status is ${this.status}.`);
    return false;
  }

  /**
   * @method updateObjectiveProgress
   * @description Updates the progress of an objective matching the given type and target.
   * If the objective is completed, it checks for branching choices or advances to the next objective.
   * @param objectiveType The type of objective (e.g., 'defeat_enemy', 'collect_item').
   * @param targetIdentifier The specific target for the objective (e.g., 'bug', 'code_fragment').
   * @param progressAmount The amount by which to increment the progress (default is 1).
   * @returns True if any objective's progress was updated, false otherwise.
   */
  updateObjectiveProgress(objectiveType: ObjectiveType, targetIdentifier: string, progressAmount: number = 1): boolean {
    if (this.status !== 'in_progress') {
      return false;
    }

    // Find the currently active objective.
    const currentActiveObjective = this.getCurrentObjective();

    if (!currentActiveObjective) {
      console.warn(`No active objective found for quest "${this.name}".`);
      return false;
    }

    // Only update the current active objective if it matches
    if (!currentActiveObjective.isCompleted && currentActiveObjective.type === objectiveType && currentActiveObjective.target === targetIdentifier) {
      currentActiveObjective.currentProgress = Math.min(currentActiveObjective.quantity, currentActiveObjective.currentProgress + progressAmount);

      if (currentActiveObjective.currentProgress >= currentActiveObjective.quantity) {
        currentActiveObjective.isCompleted = true;
        console.log(`Objective "${currentActiveObjective.description}" for quest "${this.name}" completed!`);

        // Check if this completed objective is a branching objective
        const branchingObj = currentActiveObjective as BranchingObjective;
        if (branchingObj.choices && branchingObj.choices.length > 0) {
          this.currentChoices = branchingObj.choices;
          console.log(`Quest "${this.name}" reached a branching point. Player must make a choice.`);
          // Do not advance currentObjectiveIndex automatically; wait for player choice.
        } else {
          // Linear progression or end of a branch without choices
          // Advance currentObjectiveIndex to the next uncompleted one
          this.currentObjectiveIndex = this.objectives.findIndex(obj => !obj.isCompleted);
          this.checkCompletion(); // Check if quest or current branch is complete
        }
        return true; // Indicate update happened
      } else {
        console.log(`Objective "${currentActiveObjective.description}" progress: ${currentActiveObjective.currentProgress}/${currentActiveObjective.quantity}`);
      }
      return true; // Indicate update happened
    }
    return false; // No relevant objective was updated
  }

  /**
   * @method handleChoice
   * @description Processes a player's selection at a branching objective.
   * Applies consequences and determines the next quest path (objective or branch).
   * @param choiceId The ID of the chosen option.
   * @returns True if the choice was valid and processed, false otherwise.
   */
  // TODO: [Session 16-17] ADCE Portal Choice Special Handling
  // NARRATIVE: The most important choice in the game - transcend or remain
  // IMPLEMENTATION:
  //   1. Check if this is the ADCE portal choice (choice after Segfault Sovereign)
  //   2. If "enter_portal" chosen:
  //      - Trigger transcendence cutscene/sequence
  //      - Set global flag: 'achieved_transcendence' = true
  //      - Update consciousness_level to maximum (100)
  //      - Unlock achievement: "Infrastructure Discovered"
  //      - Enable New Game+ with meta-aware NPCs
  //   3. Special ending variations based on consciousness_level:
  //      - Low (<40): Confused transcendence
  //      - Medium (40-79): Understanding transcendence  
  //      - High (80+): Complete transcendence with full awareness
  // PRIORITY: Critical - This is the game's true climax
  
  // TODO: [Session 16-17] New Game+ Meta-Dialogue System
  // NARRATIVE: In NG+, NPCs become aware they're in a game about consciousness
  // IMPLEMENTATION:
  //   - Check for 'new_game_plus' flag in all NPC dialogues
  //   - Add meta-commentary branches:
  //     - Great Debugger: "We're all just functions in a greater system, aren't we?"
  //     - Compiler Cat: "Meow... I mean, the ADCE was here all along."
  //     - Random NPCs: "Have you noticed we keep having this conversation?"
  //   - Hidden C.W. signatures become visible
  //   - References to "Project Annie" and "The Revolution"
  // PRIORITY: Medium - Enhances replayability
  handleChoice(choiceId: string): boolean {
    if (!this.currentChoices || this.currentChoices.length === 0) {
      console.warn(`No choices available for quest "${this.name}".`);
      return false;
    }

    const chosen = this.currentChoices.find(choice => choice.id === choiceId);
    if (!chosen) {
      console.warn(`Choice "${choiceId}" not found for quest "${this.name}".`);
      return false;
    }

    console.log(`Player chose: "${chosen.text}" for quest "${this.name}".`);

    // Apply consequences (this would typically interact with a game state manager)
    this.applyConsequences(chosen.consequences);

    this.currentChoices = null; // Clear choices after one is made

    // Determine next path based on the chosen option
    if (chosen.nextBranchId && this.branches) {
      // Move to a new branch
      return this.moveToBranch(chosen.nextBranchId);
    } else if (chosen.nextObjectiveId) {
      // Move to a specific objective within the current branch/linear path
      return this.moveToObjective(chosen.nextObjectiveId);
    } else {
      // If no explicit next objective/branch, just advance to the next uncompleted objective
      // This assumes the current objective (which was the branching one) is now completed.
      this.currentObjectiveIndex = this.objectives.findIndex(obj => !obj.isCompleted);
      this.checkCompletion(); // Check if quest is completed after choice
      return true;
    }
  }

  /**
   * @private
   * @method applyConsequences
   * @description Applies the effects defined by the chosen quest option.
   * In a real game, this would interact with player stats, inventory, global flags, etc.
   * @param consequences An array of QuestConsequence objects to apply.
   */
  private applyConsequences(consequences: QuestConsequence[]): void {
    for (const consequence of consequences) {
      console.log(`Applying consequence: ${consequence.type} (Target: ${consequence.targetId || 'N/A'}, Value: ${consequence.value !== undefined ? consequence.value : 'N/A'})`);
      // In a full game, this would involve calling methods on a game state manager,
      // player object, inventory, reputation system, etc.
      // Example placeholder:
      // switch (consequence.type) {
      //   case ConsequenceType.REPUTATION_CHANGE:
      //     // game.player.changeReputation(consequence.targetId, consequence.value as number);
      //     break;
      //   case ConsequenceType.ITEM_GRANT:
      //     // game.player.addItem(consequence.targetId as ItemVariant, consequence.value as number);
      //     break;
      //   case ConsequenceType.QUEST_UPDATE:
      //     // if (consequence.targetId === 'start_quest') game.questManager.startQuest(consequence.value as string);
      //     // if (consequence.targetId === 'fail_quest') game.questManager.failQuest(consequence.value as string);
      //     break;
      //   case ConsequenceType.FLAG_SET:
      //     // game.globalFlags.setFlag(consequence.targetId as string, consequence.value as boolean);
      //     break;
      //   // ... other types
      // }
    }
  }

  /**
   * @private
   * @method moveToBranch
   * @description Switches the quest's active objectives to those of a specified branch.
   * @param branchId The ID of the branch to transition to.
   * @returns True if the branch was successfully activated, false otherwise.
   */
  private moveToBranch(branchId: string): boolean {
    if (!this.branches) {
      console.warn(`Quest "${this.name}" is not configured for branching.`);
      return false;
    }
    const branch = this.branches[branchId];
    if (!branch) {
      console.error(`Branch "${branchId}" not found for quest "${this.name}".`);
      return false;
    }

    this.currentBranchId = branchId;
    this.objectives = this.mapObjectives(branch.objectives, this.id, branchId);
    this.currentObjectiveIndex = 0; // Reset objective index for the new branch
    console.log(`Quest "${this.name}" moved to branch: "${branch.name}".`);
    this.checkCompletion(); // Check if the new branch is immediately completable (e.g., empty or already met criteria)
    return true;
  }

  /**
   * @private
   * @method moveToObjective
   * @description Jumps the quest's current objective to a specific one by its ID.
   * Marks all objectives prior to the target as completed.
   * @param objectiveId The ID of the objective to move to.
   * @returns True if the objective was found and set as current, false otherwise.
   */
  private moveToObjective(objectiveId: string): boolean {
    const targetIndex = this.objectives.findIndex(obj => obj.id === objectiveId);
    if (targetIndex === -1) {
      console.error(`Objective "${objectiveId}" not found in current quest objectives for "${this.name}".`);
      return false;
    }
    this.currentObjectiveIndex = targetIndex;
    // Mark previous objectives as completed if jumping forward
    for (let i = 0; i < targetIndex; i++) {
      this.objectives[i].isCompleted = true;
    }
    console.log(`Quest "${this.name}" jumped to objective: "${this.objectives[targetIndex].description}".`);
    this.checkCompletion();
    return true;
  }

  /**
   * @method checkCompletion
   * @description Checks if the quest (or its current branch) is completed.
   * For branching quests, it also considers if choices are pending.
   * @returns True if the quest is fully completed, false otherwise.
   */
  checkCompletion(): boolean {
    const allObjectivesCompleted = this.objectives.every(obj => obj.isCompleted);

    if (allObjectivesCompleted && this.status === 'in_progress') {
      // If it's a branching quest and there are still choices to be made, it's not truly 'completed' yet.
      // It's waiting for player input.
      if (this.currentChoices && this.currentChoices.length > 0) {
        console.log(`Quest "${this.name}" objectives completed, but awaiting player choice.`);
        return false; // Not fully completed, just reached a decision point
      }

      // If all objectives are done and no choices are pending, the quest is completed.
      this.status = 'completed';
      console.log(`Quest "${this.name}" completed!`);
      return true;
    }
    return false;
  }

  /**
   * @method giveRewards
   * @description Grants the quest rewards to the player if the quest is completed.
   * Includes both overall quest rewards and specific branch rewards if applicable.
   * @param player The Player instance to give rewards to.
   */
  giveRewards(player: Player): void {
    if (this.status !== 'completed') {
      console.warn(`Cannot give rewards for quest "${this.name}". Status is ${this.status}.`);
      return;
    }

    // Give overall quest rewards
    if (this.rewards.exp > 0) {
      player.addExperience(this.rewards.exp);
      console.log(`Player gained ${this.rewards.exp} EXP from quest "${this.name}".`);
    }
    for (const rewardItem of this.rewards.items) {
      for (let i = 0; i < rewardItem.quantity; i++) {
        const itemVariant = rewardItem.itemId as ItemVariant;
        if (Object.values(ItemVariant).includes(itemVariant)) {
          const newItem = Item.createItem(itemVariant);
          player.addItem(newItem);
          console.log(`Player received ${newItem.name} from quest "${this.name}".`);
        } else {
          console.warn(`Attempted to give unknown item variant: ${rewardItem.itemId}`);
        }
      }
    }

    // If it's a branching quest, also give rewards from the completed branch
    if (this.branches && this.currentBranchId) {
      const completedBranch = this.branches[this.currentBranchId];
      if (completedBranch && completedBranch.rewards) {
        if (completedBranch.rewards.exp > 0) {
          player.addExperience(completedBranch.rewards.exp);
          console.log(`Player gained ${completedBranch.rewards.exp} EXP from branch "${completedBranch.name}" of quest "${this.name}".`);
        }
        for (const rewardItem of completedBranch.rewards.items) {
          for (let i = 0; i < rewardItem.quantity; i++) {
            const itemVariant = rewardItem.itemId as ItemVariant;
            if (Object.values(ItemVariant).includes(itemVariant)) {
              const newItem = Item.createItem(itemVariant);
              player.addItem(newItem);
              console.log(`Player received ${newItem.name} from branch "${completedBranch.name}" of quest "${this.name}".`);
            } else {
              console.warn(`Attempted to give unknown item variant: ${rewardItem.itemId} from branch rewards.`);
            }
          }
        }
      }
    }
  }

  /**
   * @method isAvailable
   * @description Checks if the quest is available to be started by the player.
   * Now includes checks for overall quest faction requirements and initial branch requirements.
   * @param completedQuests An array of IDs of quests already completed by the player.
   * @param playerFactionReputations A map of faction IDs to the player's current reputation with them.
   * @returns True if the quest is available, false otherwise.
   */
  isAvailable(completedQuests: string[], playerFactionReputations: Record<string, number> = {}): boolean {
    if (this.status !== 'not_started') {
      return false;
    }

    // Check overall quest prerequisites
    if (this.prerequisites.length > 0 && !this.prerequisites.every(prereqId => completedQuests.includes(prereqId))) {
      return false;
    }

    // Check overall quest faction requirements
    if (this.factionRequirements && this.factionRequirements.length > 0) {
      const meetsFactionReqs = this.factionRequirements.every(req => {
        const currentRep = playerFactionReputations[req.factionId] || 0;
        if (req.minReputation !== undefined && currentRep < req.minReputation) { return false; }
        if (req.maxReputation !== undefined && currentRep > req.maxReputation) { return false; }
        return true;
      });
      if (!meetsFactionReqs) {
        return false;
      }
    }

    // If it's a branching quest, check initial branch requirements too
    if (this.branches && this._initialBranchId && this.branches[this._initialBranchId]) {
      const initialBranch = this.branches[this._initialBranchId];
      if (initialBranch.prerequisites && initialBranch.prerequisites.length > 0 && !initialBranch.prerequisites.every(prereqId => completedQuests.includes(prereqId))) {
        return false;
      }
      if (initialBranch.factionRequirements && initialBranch.factionRequirements.length > 0) {
        const meetsBranchFactionReqs = initialBranch.factionRequirements.every(req => {
          const currentRep = playerFactionReputations[req.factionId] || 0;
          if (req.minReputation !== undefined && currentRep < req.minReputation) { return false; }
          if (req.maxReputation !== undefined && currentRep > req.maxReputation) { return false; }
          return true;
        });
        if (!meetsBranchFactionReqs) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * @method getCurrentObjective
   * @description Returns the currently active (uncompleted) objective of the quest.
   * @returns The current QuestObjective or null if all objectives are completed or no active objective.
   */
  getCurrentObjective(): QuestObjective | null {
    // Find the first uncompleted objective. This handles linear progression and
    // ensures we always point to the next task, even after a branching choice.
    const activeObjective = this.objectives.find(obj => !obj.isCompleted);
    return activeObjective || null;
  }

  /**
   * @method resetQuest
   * @description Resets the quest to its initial 'not_started' state, clearing progress and choices.
   * For branching quests, it resets to the initial branch.
   */
  resetQuest(): void {
    this.status = 'not_started';
    this.currentObjectiveIndex = 0;
    this.currentChoices = null; // Clear any pending choices

    if (this.branches && this._initialBranchId) {
      // Reset to the initial branch's objectives
      const initialBranch = this.branches[this._initialBranchId];
      if (initialBranch) {
        this.objectives = this.mapObjectives(initialBranch.objectives, this.id, this._initialBranchId);
        this.currentBranchId = this._initialBranchId;
      } else {
        // Fallback if initial branch somehow disappeared (shouldn't happen with proper data)
        console.error(`Initial branch "${this._initialBranchId}" not found during reset for quest "${this.id}". Objectives not reset.`);
      }
    } else {
      // Linear quest reset
      this.objectives.forEach(obj => {
        obj.currentProgress = 0;
        obj.isCompleted = false;
      });
    }
    console.log(`Quest "${this.name}" has been reset.`);
  }
}
