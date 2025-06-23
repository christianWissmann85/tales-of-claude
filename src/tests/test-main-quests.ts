import { Quest, QuestVariant } from '../models/Quest';

console.log('Testing Main Quest Loading...\n');

// Test creating each main quest
const mainQuestVariants = [
  QuestVariant.MainQuest1Anomaly,
  QuestVariant.MainQuest2Traces,
  QuestVariant.MainQuest3Source,
  QuestVariant.MainQuest4Gathering,
  QuestVariant.MainQuest5Final,
];

for (const variant of mainQuestVariants) {
  try {
    const quest = Quest.createQuest(variant);
    console.log(`✅ Successfully created: ${quest.name}`);
    console.log(`   Description: ${quest.description.substring(0, 80)}...`);
    console.log(`   Branches: ${quest.branches ? Object.keys(quest.branches).length : 0}`);
    console.log(`   Initial Branch: ${quest.currentBranchId || 'N/A'}`);
    console.log(`   Prerequisites: ${quest.prerequisites.join(', ') || 'None'}`);
    console.log('');
  } catch (error) {
    console.error(`❌ Failed to create quest ${variant}:`, error);
  }
}

// Test quest progression
console.log('\nTesting Quest Progression...');
const firstQuest = Quest.createQuest(QuestVariant.MainQuest1Anomaly);
firstQuest.startQuest();
console.log(`Started quest: ${firstQuest.name}`);
console.log(`Current objective: ${firstQuest.getCurrentObjective()?.description}`);

// Simulate completing first objective
firstQuest.updateObjectiveProgress('reach_location', 'binary_forest_anomaly_site', 1);
console.log(`After reaching location: ${firstQuest.getCurrentObjective()?.description}`);

// Simulate defeating enemy
firstQuest.updateObjectiveProgress('defeat_enemy', 'corrupted_data', 1);
console.log(`After defeating enemy: ${firstQuest.getCurrentObjective()?.description}`);

// Check if choices are available
if (firstQuest.currentChoices) {
  console.log('\nAvailable choices:');
  firstQuest.currentChoices.forEach((choice, index) => {
    console.log(`  ${index + 1}. ${choice.text}`);
  });
}

console.log('\n✅ Main quest system test complete!');