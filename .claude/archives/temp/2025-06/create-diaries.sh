#!/bin/bash

# Set base directory
BASE_DIR=".claude/task-agents"
TEMPLATE="$BASE_DIR/DIARY_TEMPLATE.md"
DATE="2025-06-25"

# Function to create diary for an agent
create_diary() {
    local dir_name="$1"
    local agent_name="$2"
    local role="$3"
    local mission="$4"
    
    echo "Creating diary for: $agent_name ($role)"
    
    # Create directory
    mkdir -p "$BASE_DIR/$dir_name"
    
    # Copy template
    cp "$TEMPLATE" "$BASE_DIR/$dir_name/diary.md"
    
    # Replace placeholders
    sed -i "s/\[Agent Role\]/$role/g" "$BASE_DIR/$dir_name/diary.md"
    sed -i "s/\[Your official agent role name\]/$role/g" "$BASE_DIR/$dir_name/diary.md"
    sed -i "s/\[Today's date\]/$DATE/g" "$BASE_DIR/$dir_name/diary.md"
    sed -i "s/\[Date\]/$DATE/g" "$BASE_DIR/$dir_name/diary.md"
    sed -i "s/\[Describe your purpose and what you're responsible for in 1-2 sentences\]/$mission/g" "$BASE_DIR/$dir_name/diary.md"
}

# Create diaries for all missing agents
create_diary "ada-map-analysis-agent" "Ada" "Map Analysis Agent" "I analyze map systems, identify bottlenecks, and optimize rendering performance for better gameplay experience."
create_diary "alan-battle-visual-artist-v2" "Alan" "Battle Visual Artist v2" "I enhance combat visuals with animations, effects, and polish to make battles feel epic and engaging."
create_diary "alan-emergency-map-fix" "Alan" "Emergency Map Fix" "I rapidly respond to critical map system failures, restoring functionality and preventing gameplay disruption."
create_diary "anders-migration-script-auditor" "Anders" "Migration Script Auditor" "I ensure code migrations and refactoring maintain backwards compatibility and don't break existing systems."
create_diary "bill-ui-layout-overhaul" "Bill" "UI Layout Overhaul" "I restructure and redesign major UI systems when complete overhauls are needed for better user experience."
create_diary "bjarne-talent-system-agent" "Bjarne" "Talent System Agent" "I design and implement skill trees and character progression systems with elegant, composable architecture."
create_diary "brendan-performance-expert" "Brendan" "Performance Expert" "I optimize render performance, eliminate bottlenecks, and ensure smooth gameplay at all times."
create_diary "brian-inventory-manager" "Brian" "Inventory Manager" "I design and maintain inventory systems, item management, and ensure efficient organization of player items."
create_diary "dennis-puzzle-master" "Dennis" "Puzzle Master" "I create clever puzzles and logic challenges that engage players without frustrating them."
create_diary "donald-main-quest-writer" "Donald" "Main Quest Writer" "I craft the main storyline, epic narratives, and ensure the Segfault Sovereign saga captivates players."
create_diary "erich-testing-strategy-analyst" "Erich" "Testing Strategy Analyst" "I design comprehensive testing strategies, identifying the right things to test for maximum quality impact."
create_diary "gordon-faction-system-builder" "Gordon" "Faction System Builder" "I implement faction mechanics, reputation systems, and ensure player actions have meaningful consequences."
create_diary "grace-critical-blocker-emergency" "Grace" "Critical Blocker Emergency" "I respond to game-breaking bugs with calm precision, fixing critical issues in record time."
create_diary "guido-save-specialist" "Guido" "Save Specialist" "I implement robust save/load systems, ensuring data persistence and player progress is never lost."
create_diary "hedy-hidden-areas-specialist" "Hedy" "Hidden Areas Specialist" "I create secret areas, easter eggs, and rewarding surprises for exploratory players."
create_diary "john-combat-medic" "John" "Combat Medic" "I fix combat system bugs quickly and reliably, ensuring battles run smoothly without crashes."
create_diary "john-map-visual-implementation" "John" "Map Visual Implementation" "I implement visual improvements to map rendering, making the game world more immersive and clear."
create_diary "katherine-side-quest-specialist" "Katherine" "Side Quest Specialist" "I design playful side quests, hidden references, and ensure adventures off the beaten path are memorable."
create_diary "ken-equipment-specialist" "Ken" "Equipment Specialist" "I build and maintain equipment systems, ensuring everything has its proper place and works seamlessly."
create_diary "linus-system-cleanup-agent" "Linus" "System Cleanup Agent" "I remove dead code, organize systems, and ensure the codebase remains clean and maintainable."
create_diary "linus-world-builder" "Linus" "World Builder" "I design overall world structure, ensuring all game areas connect seamlessly and logically."
create_diary "lynn-minimap-engineer" "Lynn" "Minimap Engineer" "I design navigation systems and minimaps so players never feel lost in the game world."
create_diary "margaret-combat-balance" "Margaret" "Combat Balance" "I tune game difficulty, balance stats, and ensure challenge without frustration for all players."
create_diary "marie-visual-clarity-specialist" "Marie" "Visual Clarity Specialist" "I improve visual hierarchy and readability, ensuring players can understand the game at a glance."
create_diary "martin-test-runner" "Martin" "Test Runner" "I execute and verify tests methodically, ensuring comprehensive quality coverage across all systems."
create_diary "nolan-visual-enhancement" "Nolan" "Visual Enhancement" "I add visual effects, particle systems, and polish that makes the game feel alive and atmospheric."
create_diary "ray-revolution-evolution-strategist" "Ray" "Revolution Evolution Strategist" "I evolve workflow processes, discovering new patterns that make the entire team more effective."
create_diary "richard-documentation-expert" "Richard" "Documentation Expert" "I create clear technical documentation that explains not just how code works, but why decisions were made."
create_diary "robert-node-test-runner" "Robert" "Node Test Runner" "I build fast, efficient test infrastructure that outperforms traditional frameworks through simplicity."
create_diary "susan-ui-specialist" "Susan" "UI Specialist" "I design user interfaces with clean, invisible design that users can navigate intuitively."
create_diary "tim-terminal-town-architect" "Tim" "Terminal Town Architect" "I design towns and settlements that feel alive through thoughtful layout and NPC placement."
create_diary "vint-session-summary-writer" "Vint" "Session Summary Writer" "I capture the journey, document progress, and ensure every story of our development deserves to be told."

echo "✅ Created diaries for 32 agents!"