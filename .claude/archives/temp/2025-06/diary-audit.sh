#!/bin/bash

# Extract all unique agents from roster
echo "=== AGENTS MISSING DIARIES ==="
echo

# List of all agents from roster (normalized directory names)
agents=(
"ada-map-analysis-agent"
"alan-battle-visual-artist-v2"
"alan-emergency-map-fix"
"anders-migration-script-auditor"
"annie-team-lead"
"barbara-dungeon-architect"
"bill-ui-layout-overhaul"
"bjarne-talent-system-agent"
"brendan-performance-expert"
"brian-inventory-manager"
"claude-weather-wizard"
"dennis-puzzle-master"
"donald-main-quest-writer"
"doug-memory-system-designer"
"erich-testing-strategy-analyst"
"gordon-faction-system-builder"
"grace-battle-artist"
"grace-critical-blocker-emergency"
"guido-save-specialist"
"hedy-hidden-areas-specialist"
"ivan-floor-tile-specialist"
"james-type-check-cleanup"
"john-combat-medic"
"john-map-visual-implementation"
"katherine-side-quest-specialist"
"ken-equipment-specialist"
"kent-automated-playtester"
"leslie-knowledge-consolidation"
"linus-system-cleanup-agent"
"linus-world-builder"
"lynn-minimap-engineer"
"margaret-combat-balance"
"marie-visual-clarity-specialist"
"martin-test-runner"
"nolan-visual-enhancement"
"ray-revolution-evolution-strategist"
"richard-documentation-expert"
"rob-master-roadmap-architect"
"robert-node-test-runner"
"steve-ui-visual-auditor"
"susan-ui-specialist"
"terry-quest-system-architect"
"tim-terminal-town-architect"
"vint-session-summary-writer"
)

missing_count=0
has_diary_count=0

for agent in "${agents[@]}"; do
    if [ ! -f ".claude/task-agents/$agent/diary.md" ]; then
        echo "❌ $agent"
        ((missing_count++))
    else
        ((has_diary_count++))
    fi
done

echo
echo "=== SUMMARY ==="
echo "Total agents: ${#agents[@]}"
echo "Has diary: $has_diary_count"
echo "Missing diary: $missing_count"
echo
echo "=== NEXT STEPS ==="
echo "1. Create directories for missing agents"
echo "2. Copy DIARY_TEMPLATE.md to each new directory"
echo "3. Update agent names in templates"