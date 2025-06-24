import { QuestManager } from '../models/QuestManager';
import { QuestVariant } from '../models/Quest';

/**
 * Mapping of NPC IDs to their associated quest variants and dialogue IDs.
 */
const npcQuestDialogueMappings: Record<string, {
  questId: QuestVariant | null;
  offerDialogueId: string;
  regularDialogueId: string;
}> = {
  'npc_debugger_great': {
    questId: QuestVariant.DebuggerDilemma,
    offerDialogueId: 'debugger_offer_dilemma',
    regularDialogueId: 'debugger_intro',
  },
  'npc_compiler_cat': {
    questId: QuestVariant.MainQuest1Anomaly,
    offerDialogueId: 'compiler_cat_offer_mq1',
    regularDialogueId: 'compiler_cat_save',
  },
  'elder_binary_oak': {
    questId: QuestVariant.ElderOakMemory,
    offerDialogueId: 'elder_oak_intro_offer_sq',
    regularDialogueId: 'elder_oak_intro', // Default dialogue if quest not available
  },
  'npc_bit_merchant': {
    questId: QuestVariant.MerchantSecret,
    offerDialogueId: 'bit_merchant_offer_secret',
    regularDialogueId: 'bit_merchant_intro',
  }
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
export function getNPCDialogueId(npcId: string, questManager: QuestManager): string {
  const mapping = npcQuestDialogueMappings[npcId];

  // If NPC is not mapped to a specific quest, return null (use default dialogue)
  if (!mapping || mapping.questId === null) {
    return '';
  }

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