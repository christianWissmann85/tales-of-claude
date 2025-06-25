```bash
#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -euo pipefail

# --- Configuration ---
BASE_DIR=".claude/task-agents"
DIARY_TEMPLATE_FILE="DIARY_TEMPLATE.md"
DEPLOYMENT_DATE="2025-06-25"

# --- Create Diary Template if it doesn't exist ---
if [[ ! -f "$DIARY_TEMPLATE_FILE" ]]; then
    echo "Creating DIARY_TEMPLATE.md..."
    cat << EOF > "$DIARY_TEMPLATE_FILE"
# Agent Diary: [Agent Role]

## Mission Log

### First Deployment: [Deployment Date]

**Mission Summary:**
[Mission Summary]

---

### Daily Entries:

**[YYYY-MM-DD]**
-
EOF
fi

# --- Function to determine mission summary based on role ---
get_mission_summary() {
    local role="$1"
    local summary="This agent is tasked with general operational duties and contributing to project success."

    case "$role" in
        *Map Analysis Agent*) summary="Responsible for in-depth analysis and interpretation of map data to inform strategic decisions and identify key features.";;
        *Battle Visual Artist*) summary="Focuses on creating compelling and immersive visual assets for battle sequences, enhancing player experience.";;
        *Emergency Map Fix*) summary="Dedicated to rapidly identifying and resolving critical issues within map structures to ensure game stability.";;
        *Migration Script Auditor*) summary="Audits and verifies migration scripts to ensure data integrity and smooth transitions between system versions.";;
        *UI Layout Overhaul*) summary="Tasked with redesigning and optimizing the user interface layout for improved usability and aesthetic appeal.";;
        *Talent System Agent*) summary="Manages and develops the in-game talent system, ensuring balanced progression and player customization.";;
        *Performance Expert*) summary="Specializes in identifying and resolving performance bottlenecks, optimizing code and assets for smooth gameplay.";;
        *Inventory Manager*) summary="Oversees the in-game inventory system, ensuring efficient item management, storage, and retrieval for players.";;
        *Puzzle Master*) summary="Designs and implements engaging and challenging puzzles to enhance gameplay and player problem-solving skills.";;
        *Main Quest Writer*) summary="Crafts compelling narratives and dialogue for the primary questline, driving the game's core story forward.";;
        *Testing Strategy Analyst*) summary="Develops and refines testing strategies to ensure comprehensive coverage and quality assurance across all game systems.";;
        *Faction System Builder*) summary="Constructs and maintains the in-game faction system, defining relationships, reputation, and player interactions.";;
        *Critical Blocker Emergency*) summary="Acts as a rapid response unit to address and resolve critical blocking issues that impede project progress.";;
        *Save Specialist*) summary="Ensures robust and reliable save/load functionality, protecting player progress and data integrity.";;
        *Hidden Areas Specialist*) summary="Designs and implements secret or hidden areas within the game world, encouraging exploration and discovery.";;
        *Combat Medic*) summary="Focuses on the design and balance of healing mechanics and support roles within the combat system.";;
        *Map Visual Implementation*) summary="Responsible for the visual implementation of map elements, ensuring aesthetic quality and functional clarity.";;
        *Side Quest Specialist*) summary="Develops engaging and diverse side quests that enrich the game world and provide additional content for players.";;
        *Equipment Specialist*) summary="Manages and balances the in-game equipment system, including item stats, progression, and acquisition.";;
        *System Cleanup Agent*) summary="Identifies and removes deprecated or unnecessary code and assets, maintaining a clean and efficient codebase.";;
        *World Builder*) summary="Constructs and populates the game world, including terrain, environments, and points of interest.";;
        *Minimap Engineer*) summary="Develops and maintains the in-game minimap system, ensuring accurate navigation and information display.";;
        *Combat Balance*) summary="Analyzes and adjusts combat mechanics to ensure fair, challenging, and enjoyable player vs. enemy encounters.";;
        *Visual Clarity Specialist*) summary="Focuses on optimizing visual elements for clarity and readability, improving player understanding and reducing cognitive load.";;
        *Test Runner*) summary="Executes automated and manual tests, reporting on outcomes and identifying regressions or new bugs.";;
        *Visual Enhancement*) summary="Implements graphical improvements and visual effects to elevate the overall aesthetic quality of the game.";;
        *Revolution Evolution Strategist*) summary="Develops long-term strategies for game evolution, incorporating new features and adapting to player feedback.";;
        *Documentation Expert*) summary="Creates and maintains comprehensive project documentation, ensuring clarity and accessibility for the team.";;
        *Node Test Runner*) summary="Specializes in running and managing tests specifically for Node.js based systems or components.";;
        *UI Specialist*) summary="Designs, implements, and refines user interface elements for optimal user experience and visual consistency.";;
        *Terminal Town Architect*) summary="Designs and builds the 'Terminal Town' area, focusing on its layout, functionality, and aesthetic theme.";;
        *Session Summary Writer*) summary="Compiles concise and informative summaries of game sessions or development meetings for record-keeping and team updates.";;
        *) summary="This agent is a versatile contributor, focusing on their specific area of expertise to advance the project.";; # Default fallback
    esac
    echo "$summary"
}

# --- List of missing agents ---
# Format: "directory_name:Agent Name - Agent Role"
AGENTS=(
    "ada-map-analysis-agent:Ada - Map Analysis Agent"
    "alan-battle-visual-artist-v2:Alan - Battle Visual Artist v2"
    "alan-emergency-map-fix:Alan - Emergency Map Fix"
    "anders-migration-script-auditor:Anders - Migration Script Auditor"
    "bill-ui-layout-overhaul:Bill - UI Layout Overhaul"
    "bjarne-talent-system-agent:Bjarne - Talent System Agent"
    "brendan-performance-expert:Brendan - Performance Expert"
    "brian-inventory-manager:Brian - Inventory Manager"
    "dennis-puzzle-master:Dennis - Puzzle Master"
    "donald-main-quest-writer:Donald - Main Quest Writer"
    "erich-testing-strategy-analyst:Erich - Testing Strategy Analyst"
    "gordon-faction-system-builder:Gordon - Faction System Builder"
    "grace-critical-blocker-emergency:Grace - Critical Blocker Emergency"
    "guido-save-specialist:Guido - Save Specialist"
    "hedy-hidden-areas-specialist:Hedy - Hidden Areas Specialist"
    "john-combat-medic:John - Combat Medic"
    "john-map-visual-implementation:John - Map Visual Implementation"
    "katherine-side-quest-specialist:Katherine - Side Quest Specialist"
    "ken-equipment-specialist:Ken - Equipment Specialist"
    "linus-system-cleanup-agent:Linus - System Cleanup Agent"
    "linus-world-builder:Linus - World Builder"
    "lynn-minimap-engineer:Lynn - Minimap Engineer"
    "margaret-combat-balance:Margaret - Combat Balance"
    "marie-visual-clarity-specialist:Marie - Visual Clarity Specialist"
    "martin-test-runner:Martin - Test Runner"
    "nolan-visual-enhancement:Nolan - Visual Enhancement"
    "ray-revolution-evolution-strategist:Ray - Revolution Evolution Strategist"
    "richard-documentation-expert:Richard - Documentation Expert"
    "robert-node-test-runner:Robert - Node Test Runner"
    "susan-ui-specialist:Susan - UI Specialist"
    "tim-terminal-town-architect:Tim - Terminal Town Architect"
    "vint-session-summary-writer:Vint - Session Summary Writer"
)

# --- Main Script Logic ---
echo "Starting agent diary creation process..."

for agent_entry in "${AGENTS[@]}"; do
    # Split the entry into directory name and full agent name/role
    IFS=':' read -r agent_dir_name full_agent_name_role <<< "$agent_entry"

    # Extract just the role for summary generation
    # Assumes format "Agent Name - Agent Role"
    agent_role=$(echo "$full_agent_name_role" | sed -E 's/^[^-]+ - (.*)/\1/')

    AGENT_PATH="$BASE_DIR/$agent_dir_name"
    DIARY_FILE="$AGENT_PATH/diary.md"

    echo "Processing agent: $full_agent_name_role (Directory: $agent_dir_name)"

    # 1. Create directories for all missing agents
    mkdir -p "$AGENT_PATH"
    echo "  - Directory created: $AGENT_PATH"

    # 2. Copy the diary template to each new directory
    cp "$DIARY_TEMPLATE_FILE" "$DIARY_FILE"
    echo "  - Diary template copied to: $DIARY_FILE"

    # 3. Customize each diary
    # Get mission summary based on role
    MISSION_SUMMARY=$(get_mission_summary "$agent_role")

    # Use sed to replace placeholders
    # Note: Using '|' as delimiter for sed to avoid issues with '/' in paths or names
    # For macOS compatibility, 'sed -i ""' might be needed instead of 'sed -i'
    sed -i "s|\[Agent Role\]|$full_agent_name_role|g" "$DIARY_FILE"
    sed -i "s|\[Deployment Date\]|$DEPLOYMENT_DATE|g" "$DIARY_FILE"
    sed -i "s|\[Mission Summary\]|$MISSION_SUMMARY|g" "$DIARY_FILE"
    echo "  - Diary customized with agent name, role, deployment date, and mission summary."
done

echo "All agent diaries have been created and customized successfully under $BASE_DIR."
```