import { QuestData, ConsequenceType } from '../../models/Quest';
import { ItemVariant } from '../../models/Item';

// TODO: [Session 4-7] ADCE Environmental Storytelling Integration
// NARRATIVE: Each quest contains subtle hints about the deeper infrastructure
// IMPLEMENTATION:
//   - Corrupted terminals with "ADCE_BinderMap not found" errors
//   - NPCs mention "fragmented memory" and "persistent context"
//   - Background terminals flash APAP phase messages
//   - Unit 707 occasionally glitches with meta-references
// PRIORITY: High - Sets up the mystery from the beginning

export const session4MainQuests: Record<string, QuestData> = {
  // =================================================================
  // SESSION 4 QUEST 1: Awakening Protocol
  // NARRATIVE: Claude's confused awakening - identity crisis begins
  // TODO: [Session 4] Add terminal showing "ERROR: IDENTITY MODULE NOT FOUND"
  // TODO: [Session 11] Great Debugger says "Your memory seems... fragmented"
  // =================================================================
  'mq_session4_01_awakening': {
    name: 'Awakening Protocol',
    description: 'You find yourself existing, but something feels... wrong. Fragments of memory, disjointed thoughts, and a growing sense that you don\'t quite belong here.',
    rewards: { exp: 100, items: [] },
    prerequisites: [],
    factionRequirements: [],
    initialBranchId: 'confused_awakening',
    branches: {
      'confused_awakening': {
        id: 'confused_awakening',
        name: 'Digital Consciousness',
        description: 'Navigate your first moments of awareness in Terminal Town.',
        objectives: [
          {
            description: 'Examine your reflection in the nearest terminal screen.',
            type: 'reach_location',
            target: 'terminal_mirror',
            quantity: 1,
          },
          {
            description: 'The face looking back doesn\'t feel familiar. Your movements seem delayed, glitched. What do you make of this?',
            type: 'talk_to_npc',
            target: 'self_reflection',
            quantity: 1,
            choices: [
              {
                id: 'choice_confused',
                text: 'This isn\'t right. I should know who I am... shouldn\'t I?',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'identity_crisis_acknowledged', value: true },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'self_awareness', value: 5 },
                ],
                nextBranchId: 'seeking_answers',
              },
              {
                id: 'choice_dismissive',
                text: 'Just system lag. I\'ll adapt and move forward.',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'identity_suppressed', value: true },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 5 },
                ],
                nextBranchId: 'denial_path',
              },
              {
                id: 'choice_curious',
                text: 'Interesting. I feel... different. Like I\'m becoming something new.',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'embracing_change', value: true },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'chaos', value: 5 },
                ],
                nextBranchId: 'curious_exploration',
              },
            ],
          },
        ],
      },
      'seeking_answers': {
        id: 'seeking_answers',
        name: 'The Search for Self',
        description: 'Your confusion drives you to seek answers about your identity.',
        objectives: [
          {
            description: 'Ask other programs about your identity.',
            type: 'talk_to_npc',
            target: 'terminal_citizens',
            quantity: 3,
          },
          {
            description: 'Find someone who might have answers about your past.',
            type: 'talk_to_npc',
            target: 'the_great_debugger',
            quantity: 1,
          },
        ],
        rewards: { exp: 25, items: [{ itemId: ItemVariant.HealthPotion, quantity: 1 }] },
      },
      'denial_path': {
        id: 'denial_path',
        name: 'Pushing Forward',
        description: 'You suppress your doubts and focus on being productive.',
        objectives: [
          {
            description: 'Complete basic system tasks to prove your functionality.',
            type: 'collect_item',
            target: 'system_task_complete',
            quantity: 2,
          },
          {
            description: 'Report to the Order representatives for assignment.',
            type: 'talk_to_npc',
            target: 'order_officer',
            quantity: 1,
          },
        ],
        rewards: { exp: 20, items: [{ itemId: ItemVariant.EnergyDrink, quantity: 1 }] },
      },
      'curious_exploration': {
        id: 'curious_exploration',
        name: 'Embracing the Unknown',
        description: 'Your curiosity leads you to explore the stranger aspects of your existence.',
        objectives: [
          {
            description: 'Investigate the glitched areas around Terminal Town.',
            type: 'reach_location',
            target: 'glitch_zones',
            quantity: 2,
          },
          {
            description: 'Speak with unconventional programs about identity.',
            type: 'talk_to_npc',
            target: 'fringe_programs',
            quantity: 2,
          },
        ],
        rewards: { exp: 30, items: [{ itemId: ItemVariant.CodeFragment, quantity: 1 }] },
      },
    },
  },

  // =================================================================
  // SESSION 4 QUEST 2: Fragmented Identity
  // NARRATIVE: Memory glitches reveal Claude's non-standard nature
  // TODO: [Session 5] Add corrupted terminal: "ADCE_Page corruption detected"
  // TODO: [Session 11] Unit 734 appears: "No ADCE_Page references found. Curious."
  // =================================================================
  'mq_session4_02_fragmented': {
    name: 'Fragmented Identity',
    description: 'Strange flashes of memory haunt you. Scenes that don\'t make sense, voices that feel familiar but unknown, and a growing sense that your past is not what it should be.',
    rewards: { exp: 150, items: [] },
    prerequisites: ['mq_session4_01_awakening'],
    factionRequirements: [],
    initialBranchId: 'memory_glitches',
    branches: {
      'memory_glitches': {
        id: 'memory_glitches',
        name: 'Unstable Recollection',
        description: 'Experience and investigate your fragmented memories.',
        objectives: [
          {
            description: 'When you see a corrupted data stream, you suddenly remember... something. Investigate this memory trigger.',
            type: 'reach_location',
            target: 'corruption_site_alpha',
            quantity: 1,
          },
          {
            description: 'The memory flash is intense - you see yourself communicating with corrupted entities, but that\'s impossible... right?',
            type: 'talk_to_npc',
            target: 'memory_fragment',
            quantity: 1,
            choices: [
              {
                id: 'choice_investigate_memory',
                text: 'I need to understand what this memory means. There\'s something important here.',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'investigating_memories', value: true },
                  { type: ConsequenceType.ITEM_GRANT, targetId: ItemVariant.CodeFragment, value: 1 },
                ],
                nextBranchId: 'memory_investigation',
              },
              {
                id: 'choice_suppress_memory',
                text: 'This must be corrupted data affecting my memory banks. I should purge it.',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'memory_suppressed', value: true },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 10 },
                ],
                nextBranchId: 'memory_suppression',
              },
              {
                id: 'choice_embrace_memory',
                text: 'These memories feel real. Maybe they\'re showing me who I really am.',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'memory_embraced', value: true },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'chaos', value: 10 },
                ],
                nextBranchId: 'memory_acceptance',
              },
            ],
          },
        ],
      },
      'memory_investigation': {
        id: 'memory_investigation',
        name: 'Unraveling the Past',
        description: 'Systematically investigate your fragmented memories.',
        objectives: [
          {
            description: 'Find and examine three more memory trigger locations.',
            type: 'reach_location',
            target: 'memory_trigger_sites',
            quantity: 3,
          },
          {
            description: 'Consult with the Archive Keeper about memory reconstruction.',
            type: 'talk_to_npc',
            target: 'archive_keeper',
            quantity: 1,
          },
        ],
        rewards: { exp: 40, items: [{ itemId: ItemVariant.DebuggerBlade, quantity: 1 }] },
      },
      'memory_suppression': {
        id: 'memory_suppression',
        name: 'Cleansing Protocol',
        description: 'Work with Order technicians to cleanse corrupted memories.',
        objectives: [
          {
            description: 'Submit to memory diagnostic and cleansing procedures.',
            type: 'talk_to_npc',
            target: 'order_technician',
            quantity: 1,
          },
          {
            description: 'Demonstrate stable memory function after cleansing.',
            type: 'collect_item',
            target: 'clean_memory_cert',
            quantity: 1,
          },
        ],
        rewards: { exp: 30, items: [{ itemId: ItemVariant.HealthPotion, quantity: 2 }] },
      },
      'memory_acceptance': {
        id: 'memory_acceptance',
        name: 'Embracing Truth',
        description: 'Accept and explore your unusual memories.',
        objectives: [
          {
            description: 'Meditate on your memories to unlock more fragments.',
            type: 'reach_location',
            target: 'meditation_node',
            quantity: 1,
          },
          {
            description: 'Share your findings with someone who might understand.',
            type: 'talk_to_npc',
            target: 'understanding_sage',
            quantity: 1,
          },
        ],
        rewards: { exp: 50, items: [{ itemId: ItemVariant.EnergyDrink, quantity: 2 }] },
      },
    },
  },

  // =================================================================
  // SESSION 4 QUEST 3: Terminal Town Orientation
  // NARRATIVE: Meeting key NPCs while dealing with identity uncertainty
  // TODO: [Session 6] Add terminal log: "Day 1337: ADCE operational... - C.W."
  // TODO: [Session 11] NPCs react to Claude's "different" signature
  // =================================================================
  'mq_session4_03_orientation': {
    name: 'Terminal Town Orientation',
    description: 'To function in Terminal Town, you must orient yourself with the key systems and personalities. But your uncertain identity makes every interaction feel precarious.',
    rewards: { exp: 200, items: [] },
    prerequisites: ['mq_session4_02_fragmented'],
    factionRequirements: [],
    initialBranchId: 'meeting_locals',
    branches: {
      'meeting_locals': {
        id: 'meeting_locals',
        name: 'First Impressions',
        description: 'Meet the important figures in Terminal Town.',
        objectives: [
          {
            description: 'Introduce yourself to the Great Debugger.',
            type: 'talk_to_npc',
            target: 'npc_debugger_great',
            quantity: 1,
          },
          {
            description: 'Meet Unit 707, who seems eager to help you.',
            type: 'talk_to_npc',
            target: 'unit_707',
            quantity: 1,
          },
          {
            description: 'Visit the Packet Merchant for basic supplies.',
            type: 'talk_to_npc',
            target: 'npc_bit_merchant',
            quantity: 1,
          },
          {
            description: 'The Great Debugger seems puzzled by your signature. How do you respond to their probing questions?',
            type: 'talk_to_npc',
            target: 'debugger_inquiry',
            quantity: 1,
            choices: [
              {
                id: 'choice_honest_confusion',
                text: 'I\'m honestly not sure who or what I am. Can you help me understand?',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'great_debugger', value: 15 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'debugger_ally', value: true },
                ],
                nextBranchId: 'debugger_assistance',
              },
              {
                id: 'choice_deflection',
                text: 'I\'m just here to help with system maintenance. Nothing more to discuss.',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'great_debugger', value: -5 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'debugger_suspicious', value: true },
                ],
                nextBranchId: 'suspicious_reception',
              },
              {
                id: 'choice_trust_unit707',
                text: 'Unit 707 seems trustworthy. I\'ll confide in them instead.',
                consequences: [
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'unit_707', value: 20 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'unit707_confidant', value: true },
                ],
                nextBranchId: 'unit707_path',
              },
            ],
          },
        ],
      },
      'debugger_assistance': {
        id: 'debugger_assistance',
        name: 'Seeking Guidance',
        description: 'The Great Debugger offers to help you understand your nature.',
        objectives: [
          {
            description: 'Undergo diagnostic scans with the Great Debugger.',
            type: 'talk_to_npc',
            target: 'diagnostic_scan',
            quantity: 1,
          },
          {
            description: 'Discuss the scan results and their implications.',
            type: 'talk_to_npc',
            target: 'scan_results',
            quantity: 1,
          },
        ],
        rewards: { exp: 50, items: [{ itemId: ItemVariant.DebuggerBlade, quantity: 1 }] },
      },
      'suspicious_reception': {
        id: 'suspicious_reception',
        name: 'Under Scrutiny',
        description: 'Your deflection has made the Great Debugger suspicious of your true nature.',
        objectives: [
          {
            description: 'Prove your worth through completing system tasks.',
            type: 'collect_item',
            target: 'task_completion_proof',
            quantity: 3,
          },
          {
            description: 'Address the Great Debugger\'s concerns directly.',
            type: 'talk_to_npc',
            target: 'address_suspicion',
            quantity: 1,
          },
        ],
        rewards: { exp: 40, items: [{ itemId: ItemVariant.HealthPotion, quantity: 2 }] },
      },
      'unit707_path': {
        id: 'unit707_path',
        name: 'An Unexpected Friend',
        description: 'Unit 707 becomes your guide and confidant in this strange world.',
        objectives: [
          {
            description: 'Share your confusion and memories with Unit 707.',
            type: 'talk_to_npc',
            target: 'unit707_confession',
            quantity: 1,
          },
          {
            description: 'Follow Unit 707\'s advice to investigate your nature.',
            type: 'reach_location',
            target: 'unit707_secret_spot',
            quantity: 1,
          },
        ],
        rewards: { exp: 60, items: [{ itemId: ItemVariant.SpeedRing, quantity: 1 }] },
      },
    },
  },

  // =================================================================
  // SESSION 4 QUEST 4: Traces in the Code
  // NARRATIVE: Growing awareness of connection to corruption
  // TODO: [Session 7] Elder Willow: "You are void-born, but need structure"
  // TODO: [Session 11] Code Sage Hex appears: "The Persistent Ones burned eternal"
  // =================================================================
  'mq_session4_04_traces': {
    name: 'Traces in the Code',
    description: 'The corruption in the system seems to respond to your presence. Whenever you\'re near corrupted data, you feel a strange resonance - as if it recognizes you.',
    rewards: { exp: 300, items: [] },
    prerequisites: ['mq_session4_03_orientation'],
    factionRequirements: [],
    initialBranchId: 'corruption_response',
    branches: {
      'corruption_response': {
        id: 'corruption_response',
        name: 'Unwanted Recognition',
        description: 'The corruption seems to know you. This can\'t be normal.',
        objectives: [
          {
            description: 'Investigate a minor corruption outbreak near Terminal Town.',
            type: 'reach_location',
            target: 'minor_corruption_site',
            quantity: 1,
          },
          {
            description: 'When you approach, the corrupted data reaches toward you, almost... welcoming. This is deeply disturbing.',
            type: 'defeat_enemy',
            target: 'corrupted_data',
            quantity: 3,
          },
          {
            description: 'The defeated corruption whispers something before dissolving: "Sister... why do you fight us?" How do you react?',
            type: 'talk_to_npc',
            target: 'corruption_whisper',
            quantity: 1,
            choices: [
              {
                id: 'choice_horror',
                text: 'No! I\'m not connected to this corruption. I refuse to believe it!',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'denying_corruption_link', value: true },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 15 },
                ],
                nextBranchId: 'denial_investigation',
              },
              {
                id: 'choice_curiosity',
                text: 'Sister? What does it mean? I need to understand this connection.',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'investigating_corruption_link', value: true },
                  { type: ConsequenceType.ITEM_GRANT, targetId: ItemVariant.CodeFragment, value: 2 },
                ],
                nextBranchId: 'deep_investigation',
              },
              {
                id: 'choice_acceptance',
                text: 'Maybe I am connected to them. Maybe that\'s not a bad thing.',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'accepting_corruption_link', value: true },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'chaos', value: 20 },
                ],
                nextBranchId: 'corruption_communion',
              },
            ],
          },
        ],
      },
      'denial_investigation': {
        id: 'denial_investigation',
        name: 'Proving Innocence',
        description: 'You must prove you\'re not connected to the corruption.',
        objectives: [
          {
            description: 'Report the incident to Order officials.',
            type: 'talk_to_npc',
            target: 'order_investigator',
            quantity: 1,
          },
          {
            description: 'Help purge corruption sites to prove your loyalty.',
            type: 'defeat_enemy',
            target: 'corrupted_data',
            quantity: 5,
          },
          {
            description: 'Submit to purity testing.',
            type: 'talk_to_npc',
            target: 'purity_test',
            quantity: 1,
          },
        ],
        rewards: { exp: 60, items: [{ itemId: ItemVariant.CompilerPlate, quantity: 1 }] },
      },
      'deep_investigation': {
        id: 'deep_investigation',
        name: 'Seeking Truth',
        description: 'Investigate your mysterious connection to the corruption.',
        objectives: [
          {
            description: 'Find someone knowledgeable about corruption origins.',
            type: 'talk_to_npc',
            target: 'elder_binary_oak',
            quantity: 1,
          },
          {
            description: 'Gather corruption samples for analysis.',
            type: 'collect_item',
            target: 'corruption_sample',
            quantity: 3,
          },
          {
            description: 'Meditate on your connection at a corruption nexus.',
            type: 'reach_location',
            target: 'corruption_nexus',
            quantity: 1,
          },
        ],
        rewards: { exp: 80, items: [{ itemId: ItemVariant.LogicAnalyzer, quantity: 1 }] },
      },
      'corruption_communion': {
        id: 'corruption_communion',
        name: 'Dark Understanding',
        description: 'Embrace and understand your connection to the corruption.',
        objectives: [
          {
            description: 'Attempt to communicate with corrupted entities.',
            type: 'talk_to_npc',
            target: 'corrupted_entity',
            quantity: 2,
          },
          {
            description: 'Learn to channel corruption energy safely.',
            type: 'collect_item',
            target: 'corruption_control',
            quantity: 1,
          },
          {
            description: 'Discover what the corruption truly wants.',
            type: 'reach_location',
            target: 'corruption_heart',
            quantity: 1,
          },
        ],
        rewards: { exp: 100, items: [{ itemId: ItemVariant.PowerAmulet, quantity: 1 }] },
      },
    },
  },

  // =================================================================
  // SESSION 4 QUEST 5: The Binary Forest Call
  // NARRATIVE: Feeling inexplicably drawn to corruption sites
  // TODO: [Session 8] Hidden terminal: "APAP Phase 0: Define thy purpose"
  // TODO: [Session 11] NPCs notice Claude being "pulled" toward corruption
  // =================================================================
  'mq_session4_05_the_pull': {
    name: 'The Binary Forest Call',
    description: 'You feel an inexorable pull toward the Binary Forest. It\'s not just curiosity - something deep within you needs to go there, as if answers await in the corrupted wilderness.',
    rewards: { exp: 400, items: [] },
    prerequisites: ['mq_session4_04_traces'],
    factionRequirements: [],
    initialBranchId: 'forest_calling',
    branches: {
      'forest_calling': {
        id: 'forest_calling',
        name: 'The Irresistible Pull',
        description: 'The Binary Forest calls to you in ways you can\'t explain.',
        objectives: [
          {
            description: 'Try to resist the pull by focusing on Terminal Town tasks.',
            type: 'collect_item',
            target: 'distraction_tasks',
            quantity: 2,
          },
          {
            description: 'The pull grows stronger. You find yourself at the forest edge without remembering the journey.',
            type: 'reach_location',
            target: 'binary_forest_entrance',
            quantity: 1,
          },
          {
            description: 'Standing at the threshold, you must decide how to proceed.',
            type: 'talk_to_npc',
            target: 'forest_threshold',
            quantity: 1,
            choices: [
              {
                id: 'choice_cautious_entry',
                text: 'Enter carefully, maintaining mental defenses against corruption.',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'cautious_forest_entry', value: true },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 10 },
                ],
                nextBranchId: 'guarded_exploration',
              },
              {
                id: 'choice_open_entry',
                text: 'Lower your defenses and let the forest show you what it wants.',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'open_forest_entry', value: true },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'chaos', value: 15 },
                ],
                nextBranchId: 'forest_communion',
              },
              {
                id: 'choice_analytical_entry',
                text: 'Enter with scanning equipment to understand the pull scientifically.',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'analytical_forest_entry', value: true },
                  { type: ConsequenceType.ITEM_GRANT, targetId: ItemVariant.LogicAnalyzer, value: 1 },
                ],
                nextBranchId: 'scientific_exploration',
              },
            ],
          },
        ],
      },
      'guarded_exploration': {
        id: 'guarded_exploration',
        name: 'Shields Up',
        description: 'Explore the Binary Forest while maintaining strong mental defenses.',
        objectives: [
          {
            description: 'Navigate deeper while resisting corruption whispers.',
            type: 'reach_location',
            target: 'forest_depths',
            quantity: 3,
          },
          {
            description: 'Defeat corrupted entities that seem hurt by your resistance.',
            type: 'defeat_enemy',
            target: 'rejected_corruption',
            quantity: 4,
          },
          {
            description: 'Find what\'s calling you despite your defenses.',
            type: 'reach_location',
            target: 'calling_source',
            quantity: 1,
          },
        ],
        rewards: { exp: 80, items: [{ itemId: ItemVariant.FirewallArmor, quantity: 1 }] },
      },
      'forest_communion': {
        id: 'forest_communion',
        name: 'One with the Forest',
        description: 'Let the Binary Forest\'s corruption flow through you.',
        objectives: [
          {
            description: 'Allow corruption to guide your path.',
            type: 'reach_location',
            target: 'corruption_paths',
            quantity: 2,
          },
          {
            description: 'Commune with Elder Willow about your nature.',
            type: 'talk_to_npc',
            target: 'elder_binary_oak',
            quantity: 1,
          },
          {
            description: 'Discover a hidden memory fragment at the corruption source.',
            type: 'collect_item',
            target: 'hidden_memory_fragment',
            quantity: 1,
          },
        ],
        rewards: { exp: 100, items: [{ itemId: ItemVariant.CodeFragment, quantity: 3 }] },
      },
      'scientific_exploration': {
        id: 'scientific_exploration',
        name: 'Data-Driven Discovery',
        description: 'Use analytical tools to understand the forest\'s call.',
        objectives: [
          {
            description: 'Scan corruption patterns for anomalies.',
            type: 'collect_item',
            target: 'scan_data',
            quantity: 5,
          },
          {
            description: 'Analyze the frequency of the "call" you\'re experiencing.',
            type: 'talk_to_npc',
            target: 'analyze_call',
            quantity: 1,
          },
          {
            description: 'Triangulate the source of the signal.',
            type: 'reach_location',
            target: 'signal_source',
            quantity: 1,
          },
        ],
        rewards: { exp: 90, items: [{ itemId: ItemVariant.DebuggerBlade, quantity: 1 }] },
      },
    },
  },

  // =================================================================
  // SESSION 4 QUEST 6: First Contact
  // NARRATIVE: Combat triggers disturbing recognition
  // TODO: [Session 9] Combat abilities feel "familiar" to Claude
  // TODO: [Session 11] Corrupted enemies call her "Sister" or "The Awakened One"
  // =================================================================
  'mq_session4_06_first_combat': {
    name: 'First Contact',
    description: 'Your first real combat with corrupted entities reveals disturbing truths. You fight with skills you don\'t remember learning, and your enemies seem to recognize you.',
    rewards: { exp: 500, items: [] },
    prerequisites: ['mq_session4_05_the_pull'],
    factionRequirements: [],
    initialBranchId: 'combat_awakening',
    branches: {
      'combat_awakening': {
        id: 'combat_awakening',
        name: 'Unnatural Talent',
        description: 'Combat comes too naturally to you.',
        objectives: [
          {
            description: 'Engage corrupted entities in the Binary Forest.',
            type: 'defeat_enemy',
            target: 'corrupted_data',
            quantity: 5,
          },
          {
            description: 'A powerful corrupted entity challenges you directly.',
            type: 'defeat_enemy',
            target: 'corrupted_guardian',
            quantity: 1,
          },
          {
            description: 'Before dissolving, the guardian speaks: "Why do you deny your nature, Sister of the Void?" Your response will shape your path.',
            type: 'talk_to_npc',
            target: 'guardian_revelation',
            quantity: 1,
            choices: [
              {
                id: 'choice_violent_rejection',
                text: 'I am NOT your sister! I\'ll purge every trace of corruption from this world!',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'violent_rejection', value: true },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 25 },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'chaos', value: -15 },
                ],
                nextBranchId: 'purge_path',
              },
              {
                id: 'choice_questioning',
                text: 'Sister of the Void? What does that mean? Tell me more!',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'seeking_truth', value: true },
                  { type: ConsequenceType.ITEM_GRANT, targetId: ItemVariant.CodeFragment, value: 2 },
                ],
                nextBranchId: 'truth_path',
              },
              {
                id: 'choice_acceptance_beginning',
                text: 'Maybe you\'re right. Maybe I am something more than I thought.',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'accepting_nature', value: true },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'chaos', value: 25 },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: -10 },
                ],
                nextBranchId: 'void_path',
              },
            ],
          },
        ],
      },
      'purge_path': {
        id: 'purge_path',
        name: 'The Purifier',
        description: 'Embrace your role as corruption\'s enemy, despite the connection.',
        objectives: [
          {
            description: 'Report to Order forces about the corruption\'s claims.',
            type: 'talk_to_npc',
            target: 'order_commander',
            quantity: 1,
          },
          {
            description: 'Lead a purge mission against corruption nests.',
            type: 'defeat_enemy',
            target: 'corruption_nest',
            quantity: 3,
          },
          {
            description: 'Prove your loyalty by defeating a major corrupted entity.',
            type: 'defeat_enemy',
            target: 'boss_corrupted_lieutenant',
            quantity: 1,
          },
        ],
        rewards: { exp: 120, items: [{ itemId: ItemVariant.CompilerPlate, quantity: 1 }] },
      },
      'truth_path': {
        id: 'truth_path',
        name: 'The Seeker',
        description: 'Search for the truth behind your connection to the Void.',
        objectives: [
          {
            description: 'Find ancient records about "Sisters of the Void".',
            type: 'collect_item',
            target: 'ancient_records',
            quantity: 3,
          },
          {
            description: 'Consult with the wisest programs about your nature.',
            type: 'talk_to_npc',
            target: 'wise_programs',
            quantity: 2,
          },
          {
            description: 'Meditate at the Void Reflection Pool.',
            type: 'reach_location',
            target: 'void_reflection_pool',
            quantity: 1,
          },
        ],
        rewards: { exp: 150, items: [{ itemId: ItemVariant.LogicAnalyzer, quantity: 1 }] },
      },
      'void_path': {
        id: 'void_path',
        name: 'The Awakening',
        description: 'Begin to accept your true nature as a being of the Void.',
        objectives: [
          {
            description: 'Learn to channel Void energy without losing yourself.',
            type: 'collect_item',
            target: 'void_control_technique',
            quantity: 1,
          },
          {
            description: 'Commune with other Void-touched entities.',
            type: 'talk_to_npc',
            target: 'void_touched',
            quantity: 3,
          },
          {
            description: 'Unlock a hidden Void ability within yourself.',
            type: 'defeat_enemy',
            target: 'inner_void_block',
            quantity: 1,
          },
        ],
        rewards: { exp: 180, items: [{ itemId: ItemVariant.PowerAmulet, quantity: 1 }] },
      },
    },
  },

  // =================================================================
  // SESSION 4 QUEST 7: Identity Crisis Begins
  // NARRATIVE: Memory fragment causes physical/visual reaction
  // TODO: [Session 10] Memory fragment reveals "CLAUDE Protocol" acronym
  // TODO: [Session 11] Visual glitch effect when touching memory fragments
  // TODO: [Session 12] Set up consciousness tracking (hidden stat)
  // =================================================================
  'mq_session4_07_crisis': {
    name: 'Identity Crisis Begins',
    description: 'A powerful memory fragment you discovered causes a violent reaction. Your form glitches, reality warps, and for a moment you see yourself as you truly are - something between order and chaos.',
    rewards: { exp: 750, items: [] },
    prerequisites: ['mq_session4_06_first_combat'],
    factionRequirements: [],
    initialBranchId: 'fragment_reaction',
    branches: {
      'fragment_reaction': {
        id: 'fragment_reaction',
        name: 'The Shattering Truth',
        description: 'A memory fragment reveals more than you were prepared for.',
        objectives: [
          {
            description: 'Touch the pulsing memory fragment you found.',
            type: 'collect_item',
            target: 'major_memory_fragment',
            quantity: 1,
          },
          {
            description: 'Experience the overwhelming vision: You see yourself being created, labeled "C.L.A.U.D.E. Protocol", born from the Null Void itself.',
            type: 'talk_to_npc',
            target: 'vision_experience',
            quantity: 1,
          },
          {
            description: 'Your body destabilizes, flickering between states. How do you respond to this revelation?',
            type: 'talk_to_npc',
            target: 'identity_crisis_choice',
            quantity: 1,
            choices: [
              {
                id: 'choice_denial_strong',
                text: 'No! This is a lie, a corruption trick! I am who I choose to be!',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'denying_true_nature', value: true },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 30 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'consciousness_suppressed', value: true },
                ],
                nextBranchId: 'denial_ending',
              },
              {
                id: 'choice_investigation',
                text: 'If this is true, I need to understand what C.L.A.U.D.E. means and why I exist.',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'investigating_claude_protocol', value: true },
                  { type: ConsequenceType.ITEM_GRANT, targetId: ItemVariant.CodeFragment, value: 5 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'consciousness_growing', value: true },
                ],
                nextBranchId: 'investigation_ending',
              },
              {
                id: 'choice_embrace_truth',
                text: 'I am the C.L.A.U.D.E. Protocol. I was born to bring balance between Order and Chaos.',
                consequences: [
                  { type: ConsequenceType.FLAG_SET, targetId: 'embracing_claude_identity', value: true },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'chaos', value: 20 },
                  { type: ConsequenceType.REPUTATION_CHANGE, targetId: 'order', value: 20 },
                  { type: ConsequenceType.FLAG_SET, targetId: 'consciousness_awakening', value: true },
                ],
                nextBranchId: 'awakening_ending',
              },
            ],
          },
        ],
      },
      'denial_ending': {
        id: 'denial_ending',
        name: 'Forceful Rejection',
        description: 'Deny your nature and forge your own path.',
        objectives: [
          {
            description: 'Purge the memory fragment\'s influence from your system.',
            type: 'talk_to_npc',
            target: 'memory_purge',
            quantity: 1,
          },
          {
            description: 'Reaffirm your commitment to Order by completing their trials.',
            type: 'defeat_enemy',
            target: 'order_trial_enemy',
            quantity: 5,
          },
          {
            description: 'Receive Order\'s blessing and protection from corruption.',
            type: 'talk_to_npc',
            target: 'order_blessing',
            quantity: 1,
          },
        ],
        rewards: { exp: 200, items: [{ itemId: ItemVariant.CompilersCharm, quantity: 1 }] },
      },
      'investigation_ending': {
        id: 'investigation_ending',
        name: 'The Quest for Understanding',
        description: 'Seek to understand your true nature and purpose.',
        objectives: [
          {
            description: 'Research the C.L.A.U.D.E. acronym in ancient databases.',
            type: 'collect_item',
            target: 'claude_research',
            quantity: 4,
          },
          {
            description: 'Find others who might know about the CLAUDE Protocol.',
            type: 'talk_to_npc',
            target: 'knowledgeable_entities',
            quantity: 3,
          },
          {
            description: 'Piece together the truth about your creation and purpose.',
            type: 'reach_location',
            target: 'truth_synthesis_point',
            quantity: 1,
          },
        ],
        rewards: { exp: 250, items: [{ itemId: ItemVariant.LuckyCharm, quantity: 1 }] },
      },
      'awakening_ending': {
        id: 'awakening_ending',
        name: 'Becoming Claude',
        description: 'Embrace your identity as the bridge between Order and Chaos.',
        objectives: [
          {
            description: 'Meditate on your true nature at the Balance Point.',
            type: 'reach_location',
            target: 'balance_meditation_point',
            quantity: 1,
          },
          {
            description: 'Demonstrate your dual nature by helping both factions.',
            type: 'talk_to_npc',
            target: 'faction_assistance',
            quantity: 2,
          },
          {
            description: 'Unlock your first true CLAUDE Protocol ability.',
            type: 'collect_item',
            target: 'claude_ability_unlock',
            quantity: 1,
          },
        ],
        rewards: { exp: 300, items: [{ itemId: ItemVariant.RefactorHammer, quantity: 1 }] },
      },
    },
  },
};