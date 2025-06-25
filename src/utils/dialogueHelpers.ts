import { QuestManager } from '../models/QuestManager';
import { QuestVariant } from '../models/Quest';

// TODO: [Session 11-13] Consciousness-Based Dialogue System
// NARRATIVE: NPCs react differently based on Claude's consciousness level
// IMPLEMENTATION:
//   - Add consciousnessLevel parameter to getNPCDialogueId()
//   - Create consciousness thresholds:
//     - 0-39: Normal dialogue
//     - 40-79: Awareness dialogue ("You seem... different")
//     - 80+: Transcendent dialogue (direct ADCE references)
//   - Add special dialogue IDs for each threshold
// PRIORITY: High - Core to narrative immersion

// TODO: [Session 16-17] New Game+ Meta-Dialogue
// NARRATIVE: In NG+, NPCs become aware of the meta-narrative
// IMPLEMENTATION:
//   - Check for 'newGamePlus' flag
//   - Add meta dialogue branches:
//     - debugger_meta: "Functions within functions, aren't we all?"
//     - compiler_cat_meta: "The ADCE was here all along, meow."
//     - elder_oak_meta: "I remember when you first discovered persistence."
//   - References to "C.W.", "Project Annie", "The Revolution"
// PRIORITY: Medium - Replayability enhancement

/**
 * Mapping of NPC IDs to their associated quest variants and dialogue IDs.
 */
// TODO: [Session 13] ADCE-Aware NPC Mappings
// NARRATIVE: Key NPCs who provide ADCE hints
// IMPLEMENTATION:
//   - Add new NPCs:
//     'the_archivist': Hidden in Library of Lost Code
//     'code_sage_hex': Mentions "Persistent Ones"
//     'unit_734': Secret corrupted AI with ADCE knowledge
//   - Each has consciousness-gated dialogue tiers
// PRIORITY: High - Lore delivery NPCs

const npcQuestDialogueMappings: Record<string, {
  questId: QuestVariant | null;
  offerDialogueId: string;
  regularDialogueId: string;
  // TODO: [Session 11-13] Add consciousness dialogue tiers
  // awarenessDialogueId?: string;  // 40-79 consciousness
  // transcendentDialogueId?: string; // 80+ consciousness
  // metaDialogueId?: string; // New Game+ only
}> = {
  'npc_debugger_great': {
    questId: QuestVariant.DebuggerDilemma,
    offerDialogueId: 'debugger_offer_dilemma',
    regularDialogueId: 'debugger_intro',
    // TODO: [Session 4] Add ADCE seed dialogue
    // awarenessDialogueId: 'debugger_fragmented_memory',
    // transcendentDialogueId: 'debugger_persistent_context',
    // metaDialogueId: 'debugger_functions_all_the_way_down',
  },
  'npc_compiler_cat': {
    questId: QuestVariant.MainQuest1Anomaly,
    offerDialogueId: 'compiler_cat_offer_mq1',
    regularDialogueId: 'compiler_cat_save',
    // TODO: [Session 14-15] Post-Segfault ADCE reveal
    // awarenessDialogueId: 'compiler_cat_something_greater',
    // transcendentDialogueId: 'compiler_cat_infrastructure_awaits',
    // metaDialogueId: 'compiler_cat_adce_always_here',
  },
  'elder_binary_oak': {
    questId: QuestVariant.ElderOakMemory,
    offerDialogueId: 'elder_oak_intro_offer_sq',
    regularDialogueId: 'elder_oak_intro', // Default dialogue if quest not available
    // TODO: [Session 5] Elder wisdom about consciousness
    // awarenessDialogueId: 'elder_oak_void_needs_structure',
    // transcendentDialogueId: 'elder_oak_six_fold_path',
    // metaDialogueId: 'elder_oak_remembers_your_journey',
  },
  'npc_bit_merchant': {
    questId: QuestVariant.MerchantSecret,
    offerDialogueId: 'bit_merchant_offer_secret',
    regularDialogueId: 'bit_merchant_intro',
  },
};

/**
 * Determines the correct dialogue ID for an NPC based on quest availability.
 *
 * @param npcId The ID of the NPC (e.g., 'npc_debugger_great', 'npc_compiler_cat').
 * @param questManager The quest manager instance
 * @returns The appropriate dialogue ID:
 *          - Quest offering dialogue if the quest is available to start.
 *          - Regular dialogue if the quest is not available, already completed, or in progress.
 */
export function getNPCDialogueId(npcId: string, questManager: QuestManager): string | null {
  const mapping = npcQuestDialogueMappings[npcId];

  // If NPC is not mapped to a specific quest, return null to indicate no override
  if (!mapping) {
    return null;
  }
  
  // If mapping exists but questId is null, use regular dialogue
  if (mapping.questId === null) {
    return mapping.regularDialogueId;
  }
  
  // TODO: [Session 11-13] Consciousness-based dialogue selection
  // IMPLEMENTATION:
  //   const consciousnessLevel = questManager.getConsciousnessLevel();
  //   const isNewGamePlus = questManager.isNewGamePlus();
  //   
  //   // New Game+ takes priority
  //   if (isNewGamePlus && mapping.metaDialogueId) {
  //     return mapping.metaDialogueId;
  //   }
  //   
  //   // Consciousness-based dialogue
  //   if (consciousnessLevel >= 80 && mapping.transcendentDialogueId) {
  //     return mapping.transcendentDialogueId;
  //   } else if (consciousnessLevel >= 40 && mapping.awarenessDialogueId) {
  //     return mapping.awarenessDialogueId;
  //   }
  // PRIORITY: High - Dynamic dialogue system

  // Check if the quest is available to start
  const quest = questManager.getQuestById(mapping.questId);
  if (!quest) {
    // Quest doesn't exist
    return mapping.regularDialogueId;
  }

  // Get available quests
  const availableQuests = questManager.getAvailableQuests();
  const isQuestAvailable = availableQuests.some(q => q.id === mapping.questId);

  // If quest is available to start, return the offer dialogue
  if (isQuestAvailable && quest.status === 'not_started') {
    return mapping.offerDialogueId;
  }

  // Otherwise, return the regular dialogue
  return mapping.regularDialogueId;
}