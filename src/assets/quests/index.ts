export { mainQuests } from './mainQuests';
export { sideQuests } from './sideQuests';
export { session4MainQuests } from './session4MainQuests';

// Export a combined object with all quests
import { mainQuests } from './mainQuests';
import { sideQuests } from './sideQuests';
import { session4MainQuests } from './session4MainQuests';
import { QuestData } from '../../models/Quest';

export const allQuests: Record<string, QuestData> = {
  ...mainQuests,
  ...sideQuests,
  ...session4MainQuests,
  // Add other quest collections here as they're created
  // ...factionQuests,
};