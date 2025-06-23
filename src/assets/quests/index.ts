export { mainQuests } from './mainQuests';
export { sideQuests } from './sideQuests';

// Export a combined object with all quests
import { mainQuests } from './mainQuests';
import { sideQuests } from './sideQuests';
import { QuestData } from '../../models/Quest';

export const allQuests: Record<string, QuestData> = {
  ...mainQuests,
  ...sideQuests,
  // Add other quest collections here as they're created
  // ...factionQuests,
};