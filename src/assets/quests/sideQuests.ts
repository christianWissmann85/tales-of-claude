import { QuestData, ConsequenceType } from '../../models/Quest';
import { ItemVariant } from '../../models/Item';

export const sideQuests: Record<string, QuestData> = {

  // =================================================================
  // 1. Character Stories (4 quests)
  // =================================================================

  /**
   * Side Quest: The Debugger's Dilemma
   * Category: Character Story (The Great Debugger)
   * Tone: Touching, relatable (Imposter Syndrome)
   * Branching: Choice on how to encourage
   */
  'sq_debugger_dilemma': {
    name: 'The Debugger\'s Dilemma',
    description: 'The Great Debugger, usually a beacon of confidence, seems unusually withdrawn. He mutters about "unsolvable errors" and "losing his touch." He needs your help to regain his confidence.',
    rewards: { exp: 300, items: [{ itemId: ItemVariant.DebuggerBlade, quantity: 1 }] },
    prerequisites: [],
    factionRequirements: [],
    initialBranchId: 'debugger_start',
    branches: {
      'debugger_start': {
        id: 'debugger_start',
        name: 'A Crisis of Confidence',
        description: 'Speak with The Great Debugger in his den in Terminal Town.',
        objectives: [
          {
            description: 'Talk to The Great Debugger.',
            type: 'talk_to_npc',
            target: 'the_great_debugger',
            quantity: 1,
            // TODO: [Session 4] ADCE Seed in Debugger Dialogue
            // NARRATIVE: Debugger notices Claude's fragmented memory
            // IMPLEMENTATION: Add dialogue branch:
            //   "Your memory seems... fragmented. Like you're missing your persistent context."
            //   "I've heard whispers of an ancient infrastructure that grants true memory..."
            // PRIORITY: High - Early breadcrumb
          },
          {
            description: 'The Debugger admits to suffering from Imposter Syndrome after a particularly nasty bug. He believes he lost his "Logic Analyzer" during the incident. Find it in the Debug Dungeon.',
            type: 'collect_item',
            target: ItemVariant.LogicAnalyzer,
            quantity: 1,
          },
          {
            description: 'Return the Logic Analyzer to The Great Debugger. He asks for your advice on how to overcome his self-doubt.',
            type: 'talk_to_npc',
            target: 'the_great_debugger',
            quantity: 1,
            choices: [
              {
                id: 'debugger_choice_tough_love',
                text: '"Snap out of it! Even the best compilers have bugs. You\'re The Great Debugger for a reason!"',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 10 },
                  { type: ConsequenceType.DIALOGUE_TRIGGER, targetId: 'debugger_tough_love_response', value: 'true' },
                ],
                nextBranchId: 'debugger_tough_love_path',
              },
              {
                id: 'debugger_choice_reassurance',
                text: '"It\'s okay to feel overwhelmed. Every bug is a learning opportunity. Your experience is invaluable."',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 15 },
                  { type: ConsequenceType.DIALOGUE_TRIGGER, targetId: 'debugger_reassurance_response', value: 'true' },
                ],
                nextBranchId: 'debugger_reassurance_path',
              },
            ],
          },
        ],
      },
      'debugger_tough_love_path': {
        id: 'debugger_tough_love_path',
        name: 'The Hard Reset',
        description: 'You gave The Great Debugger a stern talking-to. Now, prove his worth by defeating a "Self-Doubt Daemon" he manifests.',
        objectives: [
          {
            description: 'Defeat the Self-Doubt Daemon (a manifestation of his internal struggle).',
            type: 'defeat_enemy',
            target: 'self_doubt_daemon',
            quantity: 1,
          },
        ],
        rewards: { exp: 100, items: [{ itemId: ItemVariant.EnergyDrink, quantity: 1 }] },
      },
      'debugger_reassurance_path': {
        id: 'debugger_reassurance_path',
        name: 'The Gentle Refactor',
        description: 'You offered gentle reassurance. Now, help him refactor a small, personal piece of code that has been bothering him.',
        objectives: [
          {
            description: 'Collect 3 "Clean Code Fragments" from the Syntax Swamp to help refactor his code.',
            type: 'collect_item',
            target: ItemVariant.CodeFragment, // Reusing CodeFragment for "Clean Code Fragment"
            quantity: 3,
          },
        ],
        rewards: { exp: 100, items: [{ itemId: ItemVariant.HealthPotion, quantity: 1 }] },
      },
    },
  },

  /**
   * Side Quest: Compiler Cat's Nine Lives
   * Category: Character Story (Compiler Cat)
   * Tone: Funny, puzzling (time-loop, recursion)
   * Branching: Choice on how to break the loop
   */
  'sq_compiler_cat_loop': {
    name: 'Compiler Cat\'s Nine Lives',
    description: 'Compiler Cat is acting strangely. It keeps repeating the same meow, then jumping onto the same desk, then falling asleep, only to wake up and do it again. It\'s stuck in a purr-petual loop!',
    rewards: { exp: 350, items: [{ itemId: ItemVariant.CompilersCharm, quantity: 1 }] },
    prerequisites: ['mq_01_anomaly'], // After meeting Compiler Cat
    factionRequirements: [],
    initialBranchId: 'cat_loop_investigate',
    branches: {
      'cat_loop_investigate': {
        id: 'cat_loop_investigate',
        name: 'Observing the Loop',
        description: 'Observe Compiler Cat\'s peculiar behavior in Terminal Town.',
        objectives: [
          {
            description: 'Observe Compiler Cat for 3 cycles.',
            type: 'talk_to_npc', // Using talk_to_npc to represent observation
            target: 'compiler_cat',
            quantity: 3,
          },
          {
            description: 'You\'ve identified a "Recursive Bug" causing the loop. You can try to forcefully terminate it or delicately refactor its logic.',
            type: 'talk_to_npc', // Triggering choice
            target: 'self_prompt',
            quantity: 1,
            choices: [
              {
                id: 'cat_choice_terminate',
                text: 'Forcefully terminate the Recursive Bug. Sometimes, you just need to kill the process.',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 5 },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'chaos', value: -5 },
                ],
                nextBranchId: 'cat_loop_terminate_path',
              },
              {
                id: 'cat_choice_refactor',
                text: 'Delicately refactor the Recursive Bug\'s logic. A clean solution is always best.',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 10 },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'nature', value: 5 },
                ],
                nextBranchId: 'cat_loop_refactor_path',
              },
            ],
          },
        ],
      },
      'cat_loop_terminate_path': {
        id: 'cat_loop_terminate_path',
        name: 'The Hard Stop',
        description: 'You\'ve chosen to terminate the bug. Prepare for a direct confrontation.',
        objectives: [
          {
            description: 'Defeat the Recursive Bug.',
            type: 'defeat_enemy',
            target: 'recursive_bug',
            quantity: 1,
          },
        ],
        rewards: { exp: 150, items: [{ itemId: ItemVariant.MegaPotion, quantity: 1 }] },
      },
      'cat_loop_refactor_path': {
        id: 'cat_loop_refactor_path',
        name: 'The Elegant Solution',
        description: 'You\'ve chosen to refactor. Gather the necessary "Temporal Code Fragments" to rewrite the loop\'s conditions.',
        objectives: [
          {
            description: 'Collect 5 Temporal Code Fragments from the Crystal Caverns.',
            type: 'collect_item',
            target: ItemVariant.CodeFragment, // Reusing CodeFragment for "Temporal Code Fragments"
            quantity: 5,
          },
        ],
        rewards: { exp: 150, items: [{ itemId: ItemVariant.SpeedRing, quantity: 1 }] },
      },
    },
  },

  /**
   * Side Quest: The Merchant's Secret
   * Category: Character Story (Bit Merchant)
   * Tone: Intriguing, slightly humorous
   * Branching: Expose vs. help keep secret
   */
  'sq_merchant_secret': {
    name: 'The Merchant\'s Secret',
    description: 'The Bit Merchant is unusually jumpy, constantly checking his back. Rumors suggest he\'s hiding a shady past involving "pirated code" and "data smuggling." An old debt might be coming due.',
    rewards: { exp: 280, items: [] }, // Rewards vary by branch
    prerequisites: [],
    factionRequirements: [],
    initialBranchId: 'merchant_rumors',
    branches: {
      'merchant_rumors': {
        id: 'merchant_rumors',
        name: 'Whispers in the Back Alley',
        description: 'Overhear rumors about the Bit Merchant in Terminal Town.',
        objectives: [
          {
            description: 'Talk to 3 gossiping NPCs in Terminal Town.',
            type: 'talk_to_npc',
            target: 'town_gossip', // Generic target for multiple NPCs
            quantity: 3,
          },
          {
            description: 'You\'ve learned the merchant is being blackmailed. Find the "Shady Data Packet" containing evidence of his past dealings in the Debug Dungeon.',
            type: 'collect_item',
            target: ItemVariant.CodeFragment, // Reusing CodeFragment for "Shady Data Packet"
            quantity: 1,
          },
          {
            description: 'You\'ve acquired the packet. Now, confront the Bit Merchant. Will you expose him or help him cover it up?',
            type: 'talk_to_npc',
            target: 'bit_merchant',
            quantity: 1,
            choices: [
              {
                id: 'merchant_choice_expose',
                text: 'Expose his past to the authorities (Compiler Cat). He deserves to face justice.',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 20 },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'merchant', value: -30 },
                  { type: ConsequenceType.ITEM_GRANT, targetId: ItemVariant.MegaPotion, value: 2 }, // Reward for "justice"
                ],
                nextBranchId: 'merchant_expose_path',
              },
              {
                id: 'merchant_choice_help',
                text: 'Help him destroy the evidence and deal with his blackmailers. Everyone deserves a second chance.',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'chaos', value: 15 },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'merchant', value: 20 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'merchant_discount_unlocked', value: true }, // Unlock permanent discount
                ],
                nextBranchId: 'merchant_help_path',
              },
            ],
          },
        ],
      },
      'merchant_expose_path': {
        id: 'merchant_expose_path',
        name: 'Justice Served',
        description: 'You\'ve exposed the merchant. Now, deliver the evidence to Compiler Cat.',
        objectives: [
          {
            description: 'Deliver the Shady Data Packet to Compiler Cat.',
            type: 'talk_to_npc',
            target: 'compiler_cat',
            quantity: 1,
          },
        ],
        rewards: { exp: 100, items: [] }, // Main quest rewards already include items
      },
      'merchant_help_path': {
        id: 'merchant_help_path',
        name: 'A Debt Repaid',
        description: 'You\'ve agreed to help the merchant. Now, deal with the "Data Enforcers" who are after him.',
        objectives: [
          {
            description: 'Defeat 3 Data Enforcers in the Debug Dungeon.',
            type: 'defeat_enemy',
            target: 'data_enforcer',
            quantity: 3,
          },
        ],
        rewards: { exp: 100, items: [{ itemId: ItemVariant.LuckyCharm, quantity: 1 }] }, // Additional item for helping
      },
    },
  },

  /**
   * Side Quest: Elder Oak's Memory
   * Category: Character Story (Elder Oak)
   * Tone: Touching, contemplative
   * Branching: Linear
   */
  'sq_elder_oak_memory': {
    name: 'Elder Oak\'s Memory',
    description: 'The ancient Elder Oak in the Binary Forest is ailing. Its leaves are flickering, and its roots are tangled with "forgotten data." It seems to be losing its memory, which is affecting the entire forest\'s stability.',
    rewards: { exp: 250, items: [{ itemId: ItemVariant.FirewallArmor, quantity: 1 }] },
    prerequisites: [],
    factionRequirements: [],
    objectives: [
      {
        description: 'Talk to Elder Oak in the Binary Forest.',
        type: 'talk_to_npc',
        target: 'elder_oak',
        quantity: 1,
      },
      {
        description: 'Elder Oak needs you to retrieve 7 "Ancient Log Files" from deep within the Binary Forest to restore its memory banks.',
        type: 'collect_item',
        target: ItemVariant.CodeFragment, // Reusing CodeFragment for "Ancient Log Files"
        quantity: 7,
      },
      {
        description: 'Return the Ancient Log Files to Elder Oak. It asks you to help it "re-sequence" its memories by navigating a specific path in its grove.',
        type: 'reach_location',
        target: 'elder_oak_memory_sequence', // A specific sub-location for the puzzle
        quantity: 1,
      },
      {
        description: 'With its memories restored, Elder Oak feels much better. Talk to it one last time.',
        type: 'talk_to_npc',
        target: 'elder_oak',
        quantity: 1,
      },
    ],
  },

  // =================================================================
  // 2. World Building (3 quests)
  // =================================================================

  /**
   * Side Quest: The Great Emoji Migration
   * Category: World Building
   * Tone: Whimsical, lighthearted
   * Branching: Linear
   */
  'sq_emoji_migration': {
    name: 'The Great Emoji Migration',
    description: 'Strange, sentient emoji tiles have begun appearing all over the Code Realm, causing minor, but amusing, disruptions. They\'re not malicious bugs, but they\'re definitely not supposed to be here. Find out where they\'re coming from!',
    rewards: { exp: 180, items: [{ itemId: ItemVariant.LuckyCharm, quantity: 1 }] },
    prerequisites: [],
    factionRequirements: [],
    objectives: [
      {
        description: 'Investigate the initial reports of emoji sightings in Terminal Town (reach location).',
        type: 'reach_location',
        target: 'terminal_town_emoji_hotspot',
        quantity: 1,
      },
      {
        description: 'The emojis seem to be multiplying! "Capture" 5 different types of rogue emojis by defeating them in the Syntax Swamp.',
        type: 'defeat_enemy',
        target: 'rogue_emoji', // Generic target for different emoji enemies
        quantity: 5,
      },
      {
        description: 'The trail leads to a hidden "Emoji Generator AI" in the Crystal Caverns. Confront it to stop the migration.',
        type: 'defeat_enemy',
        target: 'emoji_generator_ai',
        quantity: 1,
      },
      {
        description: 'The Emoji Generator AI has been subdued. Report your findings to the Bug Tracker in Terminal Town.',
        type: 'talk_to_npc',
        target: 'bug_tracker',
        quantity: 1,
      },
    ],
  },

  /**
   * Side Quest: Binary Forest Ecology
   * Category: World Building
   * Tone: Serious, environmental
   * Branching: Choice on cleansing method
   */
  'sq_binary_ecology': {
    name: 'Binary Forest Ecology',
    description: 'The Data Druid is deeply concerned. A "data blight" is spreading through the Binary Forest, corrupting the very code of its flora and fauna. The ecosystem is in peril!',
    rewards: { exp: 320, items: [] }, // Rewards vary by branch
    prerequisites: ['sq_elder_oak_memory'], // After helping Elder Oak
    factionRequirements: [],
    initialBranchId: 'ecology_investigate',
    branches: {
      'ecology_investigate': {
        id: 'ecology_investigate',
        name: 'The Spreading Blight',
        description: 'Speak with the Data Druid in the Binary Forest.',
        objectives: [
          {
            description: 'Talk to the Data Druid.',
            type: 'talk_to_npc',
            target: 'data_druid',
            quantity: 1,
          },
          {
            description: 'The Data Druid explains the blight. You need to cleanse 3 corrupted glades. How will you do it?',
            type: 'talk_to_npc', // Triggering choice
            target: 'self_prompt',
            quantity: 1,
            choices: [
              {
                id: 'ecology_choice_natural',
                text: 'Use a natural, slow-acting "Data Compost" to purify the land. It\'s gentle but takes time.',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'nature', value: 20 },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: -5 },
                ],
                nextBranchId: 'ecology_natural_path',
              },
              {
                id: 'ecology_choice_systematic',
                text: 'Deploy a systematic "Code Purifier" protocol. It\'s fast and efficient, but might leave minor "digital scars."',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 20 },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'nature', value: -5 },
                ],
                nextBranchId: 'ecology_systematic_path',
              },
            ],
          },
        ],
      },
      'ecology_natural_path': {
        id: 'ecology_natural_path',
        name: 'The Gentle Touch',
        description: 'You\'ve chosen the natural path. Collect 5 "Pure Data Samples" from uncorrupted areas to create the Data Compost, then apply it.',
        objectives: [
          {
            description: 'Collect 5 Pure Data Samples.',
            type: 'collect_item',
            target: ItemVariant.CodeFragment, // Reusing CodeFragment
            quantity: 5,
          },
          {
            description: 'Apply Data Compost to 3 Corrupted Glades in the Binary Forest.',
            type: 'reach_location',
            target: 'corrupted_glade', // Generic target for multiple locations
            quantity: 3,
          },
        ],
        rewards: { exp: 150, items: [{ itemId: ItemVariant.UltraPotion, quantity: 1 }] },
      },
      'ecology_systematic_path': {
        id: 'ecology_systematic_path',
        name: 'The Efficient Purge',
        description: 'You\'ve chosen the systematic path. Defeat 5 "Corrupted Data Sprites" to clear the way, then deploy the Code Purifier.',
        objectives: [
          {
            description: 'Defeat 5 Corrupted Data Sprites in the Binary Forest.',
            type: 'defeat_enemy',
            target: 'corrupted_data_sprite',
            quantity: 5,
          },
          {
            description: 'Deploy Code Purifier at 3 Corrupted Glades in the Binary Forest.',
            type: 'reach_location',
            target: 'corrupted_glade', // Generic target for multiple locations
            quantity: 3,
          },
        ],
        rewards: { exp: 150, items: [{ itemId: ItemVariant.DebuggerBlade, quantity: 1 }] },
      },
    },
  },

  /**
   * Side Quest: Terminal Town Elections
   * Category: World Building
   * Tone: Humorous, political satire
   * Branching: Support Order, Chaos, or Neutral
   */
  'sq_terminal_elections': {
    name: 'Terminal Town Elections',
    description: 'Terminal Town is abuzz with the upcoming System Administrator elections. Two main candidates, the rigid "Syntax Enforcer" (Order) and the chaotic "Glitch Guru" (Chaos), are vying for power. Everyone wants your endorsement!',
    rewards: { exp: 400, items: [] }, // Rewards vary by branch
    prerequisites: [],
    factionRequirements: [],
    initialBranchId: 'elections_start',
    branches: {
      'elections_start': {
        id: 'elections_start',
        name: 'The Political Divide',
        description: 'Speak with the election organizer in Terminal Town Hall.',
        objectives: [
          {
            description: 'Talk to the Election Organizer.',
            type: 'talk_to_npc',
            target: 'election_organizer',
            quantity: 1,
          },
          {
            description: 'The organizer explains the candidates. Who will you support, or will you remain neutral?',
            type: 'talk_to_npc', // Triggering choice
            target: 'self_prompt',
            quantity: 1,
            choices: [
              {
                id: 'election_choice_order',
                text: 'Support the Syntax Enforcer (Order). Stability is key!',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 25 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'election_support_order', value: true },
                ],
                nextBranchId: 'election_order_path',
              },
              {
                id: 'election_choice_chaos',
                text: 'Support the Glitch Guru (Chaos). Embrace the unexpected!',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'chaos', value: 25 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'election_support_chaos', value: true },
                ],
                nextBranchId: 'election_chaos_path',
              },
              {
                id: 'election_choice_neutral',
                text: 'Remain neutral. Your focus is on bugs, not politics.',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'neutral', value: 15 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'election_support_neutral', value: true },
                ],
                nextBranchId: 'election_neutral_path',
              },
            ],
          },
        ],
      },
      'election_order_path': {
        id: 'election_order_path',
        name: 'Campaign for Order',
        description: 'Help the Syntax Enforcer\'s campaign by ensuring "code compliance" and "bug-free" public appearances.',
        objectives: [
          {
            description: 'Collect 5 "Missing Semicolons" from the streets of Terminal Town to fix campaign posters.',
            type: 'collect_item',
            target: ItemVariant.CodeFragment, // Reusing CodeFragment
            quantity: 5,
          },
          {
            description: 'Defeat 2 "Protest Bugs" disrupting the Syntax Enforcer\'s rally.',
            type: 'defeat_enemy',
            target: 'protest_bug',
            quantity: 2,
          },
        ],
        rewards: { exp: 150, items: [{ itemId: ItemVariant.BinaryShield, quantity: 1 }] },
      },
      'election_chaos_path': {
        id: 'election_chaos_path',
        name: 'Campaign for Chaos',
        description: 'Help the Glitch Guru\'s campaign by spreading "disinformation" (harmless glitches) and "liberating" suppressed data.',
        objectives: [
          {
            description: 'Plant 3 "Minor Glitches" in public terminals in Terminal Town.',
            type: 'reach_location',
            target: 'public_terminal',
            quantity: 3,
          },
          {
            description: 'Defeat 2 "Censorship Drones" guarding suppressed data packets.',
            type: 'defeat_enemy',
            target: 'censorship_drone',
            quantity: 2,
          },
        ],
        rewards: { exp: 150, items: [{ itemId: ItemVariant.PowerAmulet, quantity: 1 }] },
      },
      'election_neutral_path': {
        id: 'election_neutral_path',
        name: 'The Unaligned Path',
        description: 'You\'ve chosen neutrality. Your task is to ensure the election process itself remains fair and uncorrupted.',
        objectives: [
          {
            description: 'Investigate 3 "Voting Irregularities" reported in Terminal Town.',
            type: 'reach_location',
            target: 'voting_booth',
            quantity: 3,
          },
          {
            description: 'Defeat the "Ballot Tamperer" (a rogue process trying to rig the vote).',
            type: 'defeat_enemy',
            target: 'ballot_tamperer',
            quantity: 1,
          },
        ],
        rewards: { exp: 150, items: [{ itemId: ItemVariant.HealthPotion, quantity: 3 }] },
      },
    },
  },

  // =================================================================
  // 3. Challenges (5 quests)
  // =================================================================

  /**
   * Side Quest: The Optimization Challenge
   * Category: Challenge (Speedrun)
   * Tone: Challenging, competitive
   * Branching: Linear (success/failure based on time)
   */
  'sq_optimization_challenge': {
    name: 'The Optimization Challenge',
    description: 'The Circuit Sage, master of efficiency, is hosting an "Optimization Challenge" in the Debug Dungeon. You must navigate a complex subroutine and "optimize" its performance by completing tasks under a strict time limit.',
    rewards: { exp: 380, items: [{ itemId: ItemVariant.SpeedRing, quantity: 1 }] },
    prerequisites: [],
    factionRequirements: [{ factionId: 'order', minReputation: 5 }],
    objectives: [
      {
        description: 'Talk to the Circuit Sage to begin the challenge.',
        type: 'talk_to_npc',
        target: 'circuit_sage',
        quantity: 1,
      },
      {
        description: 'Reach Checkpoint Alpha in the Optimization Arena within 60 seconds.',
        type: 'reach_location',
        target: 'optimization_arena_alpha',
        quantity: 1,
      },
      {
        description: 'Reach Checkpoint Beta in the Optimization Arena within 120 seconds (total).',
        type: 'reach_location',
        target: 'optimization_arena_beta',
        quantity: 1,
      },
      {
        description: 'Defeat the "Lag Monster" at the final checkpoint within 180 seconds (total).',
        type: 'defeat_enemy',
        target: 'lag_monster',
        quantity: 1,
      },
      {
        description: 'Report your success to the Circuit Sage.',
        type: 'talk_to_npc',
        target: 'circuit_sage',
        quantity: 1,
      },
    ],
  },

  /**
   * Side Quest: Bug Hunt Championship
   * Category: Challenge (Combat Tournament)
   * Tone: Action-packed, challenging
   * Branching: Linear
   */
  'sq_bug_championship': {
    name: 'Bug Hunt Championship',
    description: 'The Bug Tracker is hosting the annual "Bug Hunt Championship" in the Debug Dungeon\'s Bug Pit! Prove your combat prowess against waves of increasingly difficult bugs and claim the champion\'s title.',
    rewards: { exp: 450, items: [{ itemId: ItemVariant.DebuggerBlade, quantity: 1 }, { itemId: ItemVariant.FirewallArmor, quantity: 1 }] },
    prerequisites: [],
    factionRequirements: [{ factionId: 'tracker', minReputation: 10 }],
    objectives: [
      {
        description: 'Talk to the Bug Tracker to register for the championship.',
        type: 'talk_to_npc',
        target: 'bug_tracker',
        quantity: 1,
      },
      {
        description: 'Defeat Wave 1: 5 Minor Bugs.',
        type: 'defeat_enemy',
        target: 'minor_bug',
        quantity: 5,
      },
      {
        description: 'Defeat Wave 2: 3 Corrupted Bugs.',
        type: 'defeat_enemy',
        target: 'corrupted_bug',
        quantity: 3,
      },
      {
        description: 'Defeat Wave 3: 2 Glitch Beasts.',
        type: 'defeat_enemy',
        target: 'glitch_beast',
        quantity: 2,
      },
      {
        description: 'Defeat the Champion Bug: The "Segfault Sovereign".',
        type: 'defeat_enemy',
        target: 'segfault_sovereign',
        quantity: 1,
      },
      {
        description: 'Claim your victory from the Bug Tracker!',
        type: 'talk_to_npc',
        target: 'bug_tracker',
        quantity: 1,
      },
    ],
  },

  /**
   * Side Quest: The Impossible Puzzle
   * Category: Challenge (Puzzle)
   * Tone: Mind-bending, rewarding
   * Branching: Linear
   */
  'sq_impossible_puzzle': {
    name: 'The Impossible Puzzle',
    description: 'The enigmatic Crystal Sage in the Crystal Caverns is rumored to have created a "Logic Gate Puzzle" so complex, no one has ever solved it. Only a true master of logic can hope to crack it.',
    rewards: { exp: 420, items: [{ itemId: ItemVariant.LogicAnalyzer, quantity: 1 }] },
    prerequisites: [],
    factionRequirements: [{ factionId: 'nature', minReputation: 10 }],
    objectives: [
      {
        description: 'Talk to the Crystal Sage in the Crystal Caverns.',
        type: 'talk_to_npc',
        target: 'crystal_sage',
        quantity: 1,
      },
      {
        description: 'The Sage presents you with the puzzle. You need to find 3 "Logic Keys" hidden throughout the Crystal Labyrinth to activate the main console.',
        type: 'collect_item',
        target: ItemVariant.CodeFragment, // Reusing CodeFragment for "Logic Keys"
        quantity: 3,
      },
      {
        description: 'With the Logic Keys, activate the main puzzle console in the Crystal Labyrinth. (This objective represents solving the puzzle through an interactive UI).',
        type: 'reach_location',
        target: 'crystal_labyrinth_console',
        quantity: 1,
      },
      {
        description: 'You\'ve solved the Impossible Puzzle! Report your triumph to the Crystal Sage.',
        type: 'talk_to_npc',
        target: 'crystal_sage',
        quantity: 1,
      },
    ],
  },

  /**
   * Side Quest: The Lost Subroutine
   * Category: Challenge (Find Missing NPC)
   * Tone: Mystery, slightly eerie
   * Branching: Linear
   */
  'sq_lost_subroutine': {
    name: 'The Lost Subroutine',
    description: 'A critical "Subroutine" NPC, vital for the Syntax Swamp\'s data flow, has gone missing. Its absence is causing minor but growing errors throughout the region. You must find and rescue it!',
    rewards: { exp: 270, items: [{ itemId: ItemVariant.CodeFragment, quantity: 2 }] },
    prerequisites: [],
    factionRequirements: [],
    objectives: [
      {
        description: 'Speak with the Data Druid about the missing Subroutine.',
        type: 'talk_to_npc',
        target: 'data_druid',
        quantity: 1,
      },
      {
        description: 'Follow the "Error Trails" left by the Subroutine into the Swamp of Stagnant Code (reach 3 specific locations).',
        type: 'reach_location',
        target: 'swamp_error_trail', // Generic target for multiple locations
        quantity: 3,
      },
      {
        description: 'The trail leads to a lair of "Malicious Processes" who have captured the Subroutine. Defeat them!',
        type: 'defeat_enemy',
        target: 'malicious_process',
        quantity: 3,
      },
      {
        description: 'You\'ve rescued the Corrupted Subroutine! Escort it back to a safe zone in Terminal Town.',
        type: 'talk_to_npc',
        target: 'corrupted_subroutine', // Now it's a friendly NPC
        quantity: 1,
      },
    ],
  },

  /**
   * Side Quest: Code Review Chaos
   * Category: Challenge (Help NPCs fix code)
   * Tone: Humorous, relatable to programming
   * Branching: Perfect vs. quick-and-dirty fix
   */
  'sq_code_review_chaos': {
    name: 'Code Review Chaos',
    description: 'The Great Debugger is swamped with "code review" requests from various NPCs, and their code is a mess! From missing semicolons to infinite loops, he needs your help to clean up the chaos.',
    rewards: { exp: 350, items: [] }, // Rewards vary by branch
    prerequisites: [],
    factionRequirements: [{ factionId: 'order', minReputation: 5 }],
    initialBranchId: 'code_review_start',
    branches: {
      'code_review_start': {
        id: 'code_review_start',
        name: 'A Mountain of Bad Code',
        description: 'Talk to The Great Debugger in Terminal Town.',
        objectives: [
          {
            description: 'Talk to The Great Debugger.',
            type: 'talk_to_npc',
            target: 'the_great_debugger',
            quantity: 1,
          },
          {
            description: 'An NPC\'s code has an "Infinite Loop Demon." Will you perfectly refactor it or apply a quick-and-dirty patch?',
            type: 'talk_to_npc', // Triggering choice
            target: 'self_prompt',
            quantity: 1,
            choices: [
              {
                id: 'code_review_choice_perfect',
                text: 'Perfectly refactor the loop. It\'s the right way to do it, even if it takes longer.',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 15 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'code_review_perfect', value: true },
                ],
                nextBranchId: 'code_review_perfect_path',
              },
              {
                id: 'code_review_choice_dirty',
                text: 'Apply a quick-and-dirty patch. Get it working now, worry about elegance later!',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'chaos', value: 10 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'code_review_dirty', value: true },
                ],
                nextBranchId: 'code_review_dirty_path',
              },
            ],
          },
        ],
      },
      'code_review_perfect_path': {
        id: 'code_review_perfect_path',
        name: 'The Elegant Solution',
        description: 'You\'ve committed to perfect refactoring. First, defeat the "Infinite Loop Demon" to stop the immediate chaos, then collect "Syntax Guides" to ensure perfect code.',
        objectives: [
          {
            description: 'Defeat the Infinite Loop Demon in the Debug Dungeon.',
            type: 'defeat_enemy',
            target: 'infinite_loop_demon',
            quantity: 1,
          },
          {
            description: 'Collect 5 "Syntax Guides" (Code Fragments) from the Logic Libraries (Crystal Caverns).',
            type: 'collect_item',
            target: ItemVariant.CodeFragment,
            quantity: 5,
          },
        ],
        rewards: { exp: 150, items: [{ itemId: ItemVariant.UltraPotion, quantity: 1 }] },
      },
      'code_review_dirty_path': {
        id: 'code_review_dirty_path',
        name: 'The Quick Fix',
        description: 'You\'ve opted for a quick patch. Defeat the "Infinite Loop Demon" and then collect "Patchwork Code" to apply the fix.',
        objectives: [
          {
            description: 'Defeat the Infinite Loop Demon in the Debug Dungeon.',
            type: 'defeat_enemy',
            target: 'infinite_loop_demon',
            quantity: 1,
          },
          {
            description: 'Collect 3 "Patchwork Code" (Code Fragments) from the Glitch District (Terminal Town).',
            type: 'collect_item',
            target: ItemVariant.CodeFragment,
            quantity: 3,
          },
        ],
        rewards: { exp: 150, items: [{ itemId: ItemVariant.EnergyDrink, quantity: 2 }] },
      },
    },
  },

};