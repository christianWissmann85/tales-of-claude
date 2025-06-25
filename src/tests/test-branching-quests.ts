// src/tests/test-branching-quests.ts
// Test file to demonstrate the branching quest system

import { Quest, QuestVariant } from '../models/Quest';
import { QuestManager } from '../models/QuestManager';
import { Player } from '../models/Player';

// Mock player for testing
const mockPlayer = {
  addExperience: (exp: number) => console.log(`Player gained ${exp} EXP`),
  addItem: (item: any) => console.log('Player received item:', item.name),
} as unknown as Player;

console.log('=== Testing Branching Quest System ===\n');

// Create quest manager
const questManager = QuestManager.getInstance();
questManager.initializeQuests();
questManager.setPlayer(mockPlayer);

// 1. Test creating a branching quest
console.log('1. Creating branching quest "The Choice of AI"...');
const aiQuest = Quest.createQuest(QuestVariant.TheChoiceOfAI);
console.log(`Quest created: ${aiQuest.name}`);
console.log(`Description: ${aiQuest.description}`);
console.log(`Has branches: ${aiQuest.branches !== null}`);
console.log(`Initial branch: ${aiQuest.currentBranchId}`);
console.log('');

// 2. Test quest prerequisites with faction requirements
console.log('2. Testing faction requirements...');
const isAvailable = aiQuest.isAvailable(['meet_the_compiler'], { compiler_faction: 15 });
console.log(`Quest available with 15 compiler reputation: ${isAvailable}`);
const notAvailable = aiQuest.isAvailable(['meet_the_compiler'], { compiler_faction: 5 });
console.log(`Quest available with 5 compiler reputation: ${notAvailable}`);
console.log('');

// 3. Test starting and progressing through a branching quest
console.log('3. Starting the virus menace quest...');
const virusQuest = Quest.createQuest(QuestVariant.VirusMenace);
virusQuest.startQuest();
console.log(`Quest status: ${virusQuest.status}`);
console.log(`Current objective: ${virusQuest.getCurrentObjective()?.description}`);
console.log('');

// 4. Simulate completing an objective that leads to choices
console.log('4. Simulating reaching the branching point...');
virusQuest.updateObjectiveProgress('reach_location', 'infected_sector', 1);
console.log('Objective completed!');
console.log(`Available choices: ${virusQuest.currentChoices?.length || 0}`);
if (virusQuest.currentChoices) {
  console.log('\nChoices available:');
  virusQuest.currentChoices.forEach((choice, index) => {
    console.log(`  ${index + 1}. ${choice.text}`);
  });
}
console.log('');

// 5. Test making a choice
console.log('5. Making a choice (Contact Glitch Gang)...');
const choiceSuccess = virusQuest.handleChoice('choice_contact_glitch');
console.log(`Choice handled: ${choiceSuccess}`);
console.log(`Current branch: ${virusQuest.currentBranchId}`);
console.log('New objectives:');
virusQuest.objectives.forEach(obj => {
  if (!obj.isCompleted) {
    console.log(`  - ${obj.description} (${obj.currentProgress}/${obj.quantity})`);
  }
});
console.log('');

// 6. Test quest completion with branch rewards
console.log('6. Simulating quest completion...');
// Complete the glitch solution objectives
virusQuest.updateObjectiveProgress('collect_item', 'chaos_code', 2);
virusQuest.updateObjectiveProgress('defeat_enemy', 'corrupted_data', 3);
console.log(`Quest status: ${virusQuest.status}`);
if (virusQuest.status === 'completed') {
  console.log('Quest completed! Giving rewards...');
  virusQuest.giveRewards(mockPlayer);
}
console.log('');

// 7. Test save/load with branching state
console.log('7. Testing save/load of branching quest state...');
const saveState = questManager.saveState();
console.log('Quest state saved.');
console.log('Saved faction reputations:', saveState.playerFactionReputations);

// Simulate loading
questManager.loadState(saveState);
console.log('Quest state loaded successfully!');
console.log('');

// 8. Test QuestManager integration
console.log('8. Testing QuestManager with branching quests...');
// Complete prerequisites for virus quest
questManager.completeQuest('bug_hunt', mockPlayer);
console.log('Prerequisites completed.');

// Start virus quest through manager
const started = questManager.startQuest('virus_menace');
console.log(`Virus quest started: ${started}`);

// Check for available choices
const choices = questManager.getActiveQuestChoices('virus_menace');
console.log(`Active choices through manager: ${choices ? 'None yet' : 'None'}`);

// Progress to branching point
questManager.updateQuestProgress('reach_location', 'infected_sector', 1);
const choicesAfter = questManager.getActiveQuestChoices('virus_menace');
console.log(`Choices after reaching location: ${choicesAfter?.length || 0}`);

// Make a choice through the manager
const managerChoiceSuccess = questManager.makeChoice('virus_menace', 'choice_report_compilers');
console.log(`Choice made through manager: ${managerChoiceSuccess}`);

console.log('\n=== Branching Quest System Test Complete ===');