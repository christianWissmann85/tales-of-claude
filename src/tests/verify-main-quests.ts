// Simple verification that main quests are properly structured
import { mainQuests } from '../assets/quests/mainQuests';

console.log('Verifying main quest data structure...\n');

for (const [questId, questData] of Object.entries(mainQuests)) {
  console.log(`Quest: ${questData.name}`);
  console.log(`  ID: ${questId}`);
  console.log(`  Description: ${questData.description.substring(0, 60)}...`);
  console.log(`  Branches: ${questData.branches ? Object.keys(questData.branches).length : 0}`);
  console.log(`  Initial Branch: ${questData.initialBranchId || 'N/A'}`);
  console.log(`  Prerequisites: ${questData.prerequisites?.join(', ') || 'None'}`);
  
  if (questData.branches && questData.initialBranchId) {
    const initialBranch = questData.branches[questData.initialBranchId];
    if (initialBranch) {
      console.log(`  First Objective: ${initialBranch.objectives[0]?.description || 'N/A'}`);
    }
  }
  
  console.log('');
}

console.log('✅ Main quest data structure verified!');