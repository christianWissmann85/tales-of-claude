import { QuestData, ConsequenceType } from '../../models/Quest';
import { ItemVariant } from '../../models/Item';

export const mainQuests: Record<string, QuestData> = {
  // =================================================================
  // QUEST 1: The First Anomaly
  // =================================================================
  'mq_01_anomaly': {
    name: 'The First Anomaly',
    description: 'A strange energy signature has been detected in the Binary Forest. It feels different from the usual system bugs. You should investigate.',
    rewards: { exp: 250, items: [] },
    prerequisites: [],
    factionRequirements: [],
    initialBranchId: 'start_investigation',
    branches: {
      'start_investigation': {
        id: 'start_investigation',
        name: 'Initial Investigation',
        description: 'Find the source of the strange energy signature in the Binary Forest.',
        objectives: [
          {
            description: 'Go to the marked location in the Binary Forest.',
            type: 'reach_location',
            target: 'binary_forest_anomaly_site',
            quantity: 1,
          },
          {
            description: 'Defeat the strange, glitching entity.',
            type: 'defeat_enemy',
            target: 'corrupted_data',
            quantity: 1,
          },
          {
            description: 'The entity dissolved into a flickering data fragment. You feel a sense of wrongness emanating from it. What should you do?',
            type: 'talk_to_npc', // Using talk_to_npc as a trigger for a choice prompt
            target: 'self_prompt', // A special target to indicate a player decision point
            quantity: 1,
            choices: [
              {
                id: 'choice_report',
                text: 'This is beyond me. I should report this to Compiler Cat in the Capital.',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 10 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'mq01_reported_to_order', value: true },
                ],
                nextBranchId: 'path_report',
              },
              {
                id: 'choice_investigate',
                text: 'This is fascinating. I\'ll keep this quiet and see what I can find on my own.',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'chaos', value: 5 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'mq01_investigated_alone', value: true },
                  { type: ConsequenceType.ITEM_GRANT, targetId: ItemVariant.CodeFragment, value: 1 },
                ],
                nextBranchId: 'path_investigate',
              },
            ],
          },
        ],
      },
      'path_report': {
        id: 'path_report',
        name: 'The Official Report',
        description: 'You\'ve decided to report your findings. Travel to the Capital and speak with Compiler Cat.',
        objectives: [
          {
            description: 'Speak with Compiler Cat in the Capital.',
            type: 'talk_to_npc',
            target: 'compiler_cat',
            quantity: 1,
          },
        ],
        rewards: { exp: 50, items: [{ itemId: ItemVariant.HealthPotion, quantity: 2 }] },
      },
      'path_investigate': {
        id: 'path_investigate',
        name: 'A Secret Investigation',
        description: 'You\'ve chosen to investigate alone. The data fragment you hold seems to resonate with other corrupted code. Perhaps a rogue program in the Glitch District would know more.',
        objectives: [
          {
            description: 'Speak with the rogue AI, Glitch, in the Glitch District.',
            type: 'talk_to_npc',
            target: 'npc_glitch',
            quantity: 1,
          },
        ],
        rewards: { exp: 50, items: [{ itemId: ItemVariant.EnergyDrink, quantity: 2 }] },
      },
    },
  },

  // =================================================================
  // QUEST 2: Traces in the Code
  // =================================================================
  'mq_02_traces': {
    name: 'Traces in the Code',
    description: 'The corruption is more widespread than a single anomaly. You must find other traces of it to understand its nature and origin.',
    rewards: { exp: 500, items: [] },
    prerequisites: ['mq_01_anomaly'],
    factionRequirements: [],
    initialBranchId: 'start_trace', // This will be immediately redirected by flags
    branches: {
      'start_trace': {
        id: 'start_trace',
        name: 'Picking up the Trail',
        description: 'Based on your previous actions, you must now find the source of the corruption.',
        objectives: [
          // This is a dummy objective. The game logic should check flags and immediately jump to the correct branch.
          {
            description: 'Determine your next course of action.',
            type: 'talk_to_npc',
            target: 'self_prompt',
            quantity: 1,
          },
        ],
      },
      'order_path': {
        id: 'order_path',
        name: 'The Compiler\'s Mandate',
        description: 'Compiler Cat has tasked you with using an official Logic Analyzer to find three major corrupted nodes. The device will lead you to their locations.',
        prerequisites: ['flag:mq01_reported_to_order'],
        objectives: [
          {
            description: 'Use the Logic Analyzer to find the corrupted node in the Syntax Steppes.',
            type: 'reach_location',
            target: 'syntax_steppes_node',
            quantity: 1,
          },
          {
            description: 'Use the Logic Analyzer to find the corrupted node in the Logic Lake.',
            type: 'reach_location',
            target: 'logic_lake_node',
            quantity: 1,
          },
          {
            description: 'Use the Logic Analyzer to find the corrupted node in the RAM Wastes.',
            type: 'reach_location',
            target: 'ram_wastes_node',
            quantity: 1,
          },
          {
            description: 'All nodes have been analyzed. Report back to Compiler Cat.',
            type: 'talk_to_npc',
            target: 'compiler_cat',
            quantity: 1,
          },
        ],
        rewards: { exp: 100, items: [{ itemId: ItemVariant.DebuggerBlade, quantity: 1 }] },
      },
      'chaos_path': {
        id: 'chaos_path',
        name: 'The Unraveled Thread',
        description: 'Glitch has given you clues to find three major corrupted nodes where the system\'s fabric is thin. You\'ll have to decipher the clues and deal with whatever you find.',
        prerequisites: ['flag:mq01_investigated_alone'],
        objectives: [
          {
            description: 'Find the corrupted node "where logic drowns" (Logic Lake).',
            type: 'reach_location',
            target: 'logic_lake_node',
            quantity: 1,
          },
          {
            description: 'Find the corrupted node "amidst forgotten memories" (RAM Wastes).',
            type: 'reach_location',
            target: 'ram_wastes_node',
            quantity: 1,
          },
          {
            description: 'Find the corrupted node "on the plains of rigid thought" (Syntax Steppes).',
            type: 'reach_location',
            target: 'syntax_steppes_node',
            quantity: 1,
          },
          {
            description: 'You\'ve found all the nodes. The combined resonance points to a single location. Discuss your findings with Glitch.',
            type: 'talk_to_npc',
            target: 'npc_glitch',
            quantity: 1,
          },
        ],
        rewards: { exp: 100, items: [{ itemId: ItemVariant.SpeedRing, quantity: 1 }] },
      },
    },
  },

  // =================================================================
  // QUEST 3: The Source Revealed
  // =================================================================
  'mq_03_source': {
    name: 'The Source Revealed',
    description: 'The traces of corruption all point to a single, terrifying origin point: a tear in the fabric of the Code Realm itself, leading to the Null Void.',
    rewards: { exp: 1000, items: [] },
    prerequisites: ['mq_02_traces'],
    initialBranchId: 'enter_the_breach',
    branches: {
      'enter_the_breach': {
        id: 'enter_the_breach',
        name: 'The Null Breach',
        description: 'Venture into the corrupted zone and find the source of the breach.',
        objectives: [
          {
            description: 'Navigate the Null-Corrupted Caverns.',
            type: 'reach_location',
            target: 'null_breach_entrance',
            quantity: 1,
          },
          {
            description: 'Defeat the Null Sentinel guarding the breach.',
            type: 'defeat_enemy',
            target: 'boss_null_sentinel',
            quantity: 1,
          },
          {
            description: 'With the Sentinel defeated, the leaders of the main factions arrive, drawn by the immense power surge. They each have a plan. You must decide the fate of the Code Realm.',
            type: 'talk_to_npc',
            target: 'self_prompt',
            quantity: 1,
            choices: [
              {
                id: 'choice_order',
                text: '[Order] "We must seal the breach and purge the corruption. A clean slate is the only way." - Compiler Cat',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 50 },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'chaos', value: -30 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'mq03_chose_order', value: true },
                ],
                nextBranchId: 'faction_decision_made',
              },
              {
                id: 'choice_chaos',
                text: '[Chaos] "Seal it? Are you mad? This is power! We can harness it, become more!" - Glitch',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'chaos', value: 50 },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: -30 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'mq03_chose_chaos', value: true },
                ],
                nextBranchId: 'faction_decision_made',
              },
              {
                id: 'choice_memory',
                text: '[Memory] "Both paths risk destruction. We must contain it, study it, understand our enemy." - Archivist Prime',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'memory', value: 50 },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: -10 },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'chaos', value: -10 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'mq03_chose_memory', value: true },
                ],
                nextBranchId: 'faction_decision_made',
              },
            ],
          },
        ],
      },
      'faction_decision_made': {
        id: 'faction_decision_made',
        name: 'A Path is Chosen',
        description: 'Your decision has been made. The factions will now prepare. Speak with your chosen ally to begin.',
        objectives: [
          {
            description: 'Speak with your chosen faction leader to learn the next step.',
            type: 'talk_to_npc',
            target: 'faction_leader', // This would be dynamically resolved by the game engine based on flags
            quantity: 1,
          },
        ],
      },
    },
  },

  // =================================================================
  // QUEST 4: Rallying the Forces
  // =================================================================
  'mq_04_gathering': {
    name: 'Rallying the Forces',
    description: 'The plan is set. Now you must gather the necessary components and allies to see it through.',
    rewards: { exp: 2000, items: [] },
    prerequisites: ['mq_03_source'],
    initialBranchId: 'start_gathering', // Will be redirected
    branches: {
      'start_gathering': {
        id: 'start_gathering',
        name: 'Preparations for the End',
        description: 'Your chosen faction has a grand task for you.',
        objectives: [{ description: 'Begin the preparations.', type: 'talk_to_npc', target: 'self_prompt', quantity: 1 }],
      },
      'order_gathering': {
        id: 'order_gathering',
        name: 'Gathering the Compilers',
        description: 'To perform the Great Reset, you must awaken the three legendary Prime Compilers from their ancient slumber.',
        prerequisites: ['flag:mq03_chose_order'],
        objectives: [
          { description: 'Reactivate the GCC Compiler in the Data Forges.', type: 'defeat_enemy', target: 'guardian_gcc', quantity: 1 },
          { description: 'Reactivate the Clang Compiler in the Logic Libraries.', type: 'defeat_enemy', target: 'guardian_clang', quantity: 1 },
          { description: 'Reactivate the JIT Compiler in the Volatile Volcano.', type: 'defeat_enemy', target: 'guardian_jit', quantity: 1 },
        ],
        rewards: { exp: 500, items: [{ itemId: ItemVariant.CompilerPlate, quantity: 1 }] },
      },
      'chaos_gathering': {
        id: 'chaos_gathering',
        name: 'Embracing the Glitch',
        description: 'To harness the Null Void, you must find three Chaos Catalysts to channel its unstable energy.',
        prerequisites: ['flag:mq03_chose_chaos'],
        objectives: [
          { description: 'Retrieve the Unbound Loop from the rogue AI, Ouroboros.', type: 'collect_item', target: 'item_unbound_loop', quantity: 1 },
          { description: 'Steal the Shard of Randomness from the Order\'s Probability Engine.', type: 'collect_item', target: 'item_shard_of_randomness', quantity: 1 },
          { description: 'Survive the Recursion Depths to claim the Core of Infinite Recursion.', type: 'collect_item', target: 'item_core_of_recursion', quantity: 1 },
        ],
        rewards: { exp: 500, items: [{ itemId: ItemVariant.RefactorHammer, quantity: 1 }] },
      },
      'memory_gathering': {
        id: 'memory_gathering',
        name: 'Constructing the Aegis',
        description: 'To contain the breach, you must help the Archivists construct the Aegis field generator by finding three unique components.',
        prerequisites: ['flag:mq03_chose_memory'],
        objectives: [
          { description: 'Defeat the Segfault Sovereign to claim its Quantum Core.', type: 'collect_item', target: ItemVariant.QuantumCore, quantity: 1 },
          { description: 'Find the lost Stabilizer Schematics in the Sunken Archives.', type: 'collect_item', target: 'item_stabilizer_schematics', quantity: 1 },
          { description: 'Assemble Chrono-sync Resonators from the time-distorted ruins.', type: 'collect_item', target: 'item_chrono_resonators', quantity: 3 },
        ],
        rewards: { exp: 500, items: [{ itemId: ItemVariant.FirewallArmor, quantity: 1 }] },
      },
    },
  },

  // =================================================================
  // QUEST 5: The Final Compilation
  // =================================================================
  'mq_05_finale': {
    name: 'The Final Compilation',
    description: 'The time has come. Lead your allies to the Null Breach and execute the final plan. The fate of the Code Realm rests on your shoulders.',
    rewards: { exp: 5000, items: [] },
    prerequisites: ['mq_04_gathering'],
    initialBranchId: 'final_assault',
    branches: {
      'final_assault': {
        id: 'final_assault',
        name: 'The Final Assault',
        description: 'Breach the final defenses of the Null Void and confront the entity at its heart.',
        objectives: [
          {
            description: 'Fight your way to the heart of the Null Breach.',
            type: 'reach_location',
            target: 'null_breach_core',
            quantity: 1,
          },
          {
            description: 'Defeat the Avatar of Null.',
            type: 'defeat_enemy',
            target: 'boss_avatar_of_null',
            quantity: 1,
          },
        ],
      },
      // The following are not traditional branches, but represent the final state/epilogue of the quest.
      // The game engine would trigger the appropriate one based on flags.
      'ending_order': {
        id: 'ending_order',
        name: 'Ending: The Great Reset',
        description: 'With the Avatar defeated, the Prime Compilers execute the Great Reset. The corruption is purged, and the Code Realm is restored to a pristine, stable state. It is safe, but simpler... quieter. The age of chaos is over.',
        prerequisites: ['flag:mq03_chose_order'],
        objectives: [{ description: 'Witness the restoration of the Code Realm.', type: 'reach_location', target: 'epilogue_scene', quantity: 1 }],
        rewards: { exp: 0, items: [{ itemId: ItemVariant.CompilersCharm, quantity: 1 }] },
      },
      'ending_chaos': {
        id: 'ending_chaos',
        name: 'Ending: The Glitch Cascade',
        description: 'The Chaos Catalysts absorb the Avatar\'s power, unleashing it across the realm. The world is reborn in a vibrant, unpredictable cascade of code. It is a new age of infinite potential and infinite danger. The Code Realm will never be the same.',
        prerequisites: ['flag:mq03_chose_chaos'],
        objectives: [{ description: 'Witness the transformation of the Code Realm.', type: 'reach_location', target: 'epilogue_scene', quantity: 1 }],
        rewards: { exp: 0, items: [{ itemId: ItemVariant.PowerAmulet, quantity: 1 }] },
      },
      'ending_memory': {
        id: 'ending_memory',
        name: 'Ending: The Watchful Peace',
        description: 'The Aegis activates, containing the raw power of the Null Void. The breach is sealed, but not destroyed. The corruption recedes, but the threat remains, a silent, caged god at the edge of reality. The Realm is safe, for now, living under a watchful peace.',
        prerequisites: ['flag:mq03_chose_memory'],
        objectives: [{ description: 'Witness the containment of the Null Void.', type: 'reach_location', target: 'epilogue_scene', quantity: 1 }],
        rewards: { exp: 0, items: [{ itemId: ItemVariant.LuckyCharm, quantity: 1 }] },
      },
      'ending_bad': {
        id: 'ending_bad',
        name: 'Ending: The Unraveling',
        description: 'You faced the Avatar of Null alone and unprepared. Your defeat was swift. Without a unified plan, the Null Void consumes everything, unraveling the Code Realm into silent, static-filled entropy. There is nothing left.',
        prerequisites: ['flag:player_is_alone_finale'], // A flag set if player failed to complete Q4 properly
        objectives: [{ description: 'Witness the end of everything.', type: 'reach_location', target: 'epilogue_scene', quantity: 1 }],
        rewards: { exp: 0, items: [] },
      },
    },
  },
};

