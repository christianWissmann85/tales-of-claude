Okay, this is a comprehensive request! I will break it down into the migration script, the updated `README.md` snippet, the agent onboarding snippet, and the quick reference card.

The key challenge is reconciling the various lists of files and directories provided, especially the "ACTUAL FILES TO MOVE FROM ROOT" with the "Current State Analysis" and the "Proposed New Structure (Detailed Tree)". I will prioritize the explicit instructions from "ACTUAL FILES TO MOVE FROM ROOT" and the "CREATE NEW DIRECTORIES" section, integrating them into the broader structure defined in the "Proposed New Structure".

Specifically:
*   `docs/game/sessions/` and `docs/game/roadmaps/` will be created and used for `SESSION_3_SUMMARY.md` and the roadmap files, respectively, as per "CREATE NEW DIRECTORIES" and "ACTUAL FILES TO MOVE FROM ROOT".
*   `docs/game/testing/` will receive `TESTING.md` in addition to `game_testing_plan.md`.
*   `archives/debug-logs/`, `archives/old-docs/`, `archives/tmp-scripts/` will be created as per "CREATE NEW DIRECTORIES".
*   `CLAUDE_KNOWLEDGE.md` will go to `REVOLUTION/knowledge/`.
*   The `REVOLUTION_templates` directory from the root will be moved and renamed to `REVOLUTION/templates/`. This means `REVOLUTION/templates` will *not* be pre-created by `mkdir -p` but will be created by the `mv` command itself.
*   All other files listed in "Current State Analysis" will be moved to their corresponding locations in the "Proposed New Structure".

---

## 1. Migration Script (`migrate_repo_structure.sh`)

This Bash script will perform the reorganization. It includes error handling, logs all actions to a report file, and stages the changes for Git.

```bash
#!/bin/bash

# --- Configuration ---
REPO_ROOT=$(pwd)
LOG_FILE="$REPO_ROOT/migration_report_$(date +%Y%m%d_%H%M%S).log"
SUCCESS_COUNT=0
FAILURE_COUNT=0
declare -a MOVED_ITEMS # Stores successfully moved items for the report
declare -a FAILED_ITEMS # Stores items that failed to move or were not found

# --- Helper Functions ---

# Logs a message to stdout and the log file
log_message() {
    echo "$1" | tee -a "$LOG_FILE"
}

# Attempts to move a file or directory using 'mv'.
# Logs success/failure and updates counts/arrays.
# Arguments: $1 = source path, $2 = destination path (can be a directory or new name)
move_item() {
    local src="$1"
    local dest="$2"

    if [ -e "$src" ]; then
        log_message "Attempting to move: $src -> $dest"
        if mv "$src" "$dest" &>> "$LOG_FILE"; then
            log_message "  SUCCESS: Moved $src"
            MOVED_ITEMS+=("$src -> $dest")
            ((SUCCESS_COUNT++))
        else
            log_message "  ERROR: Failed to move $src. Check log file for details."
            FAILED_ITEMS+=("$src -> $dest (mv command failed)")
            ((FAILURE_COUNT++))
        fi
    else
        log_message "  SKIP: Source not found: $src"
        FAILED_ITEMS+=("$src -> $dest (source not found)")
        # We count this as a 'failure' in the sense that the intended move didn't happen.
        ((FAILURE_COUNT++))
    fi
}

# --- Main Script Execution ---

log_message "Starting repository reorganization for Tales of Claude..."
log_message "Log file: $LOG_FILE"
log_message ""

# 1. Create new directories
log_message "1. Creating new directories..."
# Directories that need to be explicitly created (or ensured they exist)
# Note: REVOLUTION/templates is intentionally excluded here as it will be created by the 'mv' command
# when REVOLUTION_templates is moved and renamed.
NEW_DIRS=(
    "docs/game/sessions"
    "docs/game/testing"
    "docs/game/roadmaps"
    "docs/game/design"
    "docs/game/technical"
    "docs/development/map-design"
    "docs/development/quest-design"
    "docs/development/world-design"
    "docs/human-testing"
    "REVOLUTION/guides"
    "REVOLUTION/knowledge"
    ".claude/tmp"
    ".claude/field-test-reports" # Ensure this exists if not already
    "archives/debug-logs"
    "archives/beta-tests"       # Ensure this exists if not already
    "archives/analysis"         # Ensure this exists if not already
    "archives/old-docs"
    "archives/tmp-scripts"
    "tests/unit"
    "tests/browser"
    "tests/integration"
)

for dir in "${NEW_DIRS[@]}"; do
    log_message "  Creating: $REPO_ROOT/$dir"
    mkdir -p "$REPO_ROOT/$dir" &>> "$LOG_FILE"
    if [ $? -ne 0 ]; then
        log_message "  WARNING: Could not create directory $dir. It might already exist or permissions issue."
    fi
done
log_message ""

# 2. Move files to proper locations
log_message "2. Moving files and directories..."

log_message "  Moving REVOLUTION methodology documentation..."
move_item "$REPO_ROOT/REVOLUTION_README.md" "$REPO_ROOT/REVOLUTION/README.md"
move_item "$REPO_ROOT/01-practical-guide-human-users.md" "$REPO_ROOT/REVOLUTION/guides/"
move_item "$REPO_ROOT/02-prompt-patterns-cookbook.md" "$REPO_ROOT/REVOLUTION/guides/"
move_item "$REPO_ROOT/03-workflow-examples.md" "$REPO_ROOT/REVOLUTION/guides/"
move_item "$REPO_ROOT/04-multi-agent-best-practices.md" "$REPO_ROOT/REVOLUTION/guides/"
move_item "$REPO_ROOT/05-claude-team-lead-manual.md" "$REPO_ROOT/REVOLUTION/guides/"
move_item "$REPO_ROOT/06-claude-task-agent-manual.md" "$REPO_ROOT/REVOLUTION/guides/"
move_item "$REPO_ROOT/CLAUDE_KNOWLEDGE.md" "$REPO_ROOT/REVOLUTION/knowledge/"
move_item "$REPO_ROOT/training-scenarios.md" "$REPO_ROOT/REVOLUTION/knowledge/"
move_item "$REPO_ROOT/field-test-insights.md" "$REPO_ROOT/REVOLUTION/knowledge/"
# Move and rename the REVOLUTION_templates directory
move_item "$REPO_ROOT/REVOLUTION_templates" "$REPO_ROOT/REVOLUTION/templates"
log_message ""

log_message "  Moving Tales of Claude game documentation..."
move_item "$REPO_ROOT/CLAUDE.md" "$REPO_ROOT/docs/game/"
move_item "$REPO_ROOT/ROADMAP.md" "$REPO_ROOT/docs/game/roadmaps/"
move_item "$REPO_ROOT/FEATURE_ROADMAP.md" "$REPO_ROOT/docs/game/roadmaps/"
move_item "$REPO_ROOT/implementation-roadmap.md" "$REPO_ROOT/docs/game/roadmaps/"
move_item "$REPO_ROOT/SESSION_3_SUMMARY.md" "$REPO_ROOT/docs/game/sessions/"
move_item "$REPO_ROOT/TESTING.md" "$REPO_ROOT/docs/game/testing/"
move_item "$REPO_ROOT/game_design_notes.md" "$REPO_ROOT/docs/game/design/"
move_item "$REPO_ROOT/technical_specs.md" "$REPO_ROOT/docs/game/technical/"
move_item "$REPO_ROOT/game_testing_plan.md" "$REPO_ROOT/docs/game/testing/"
move_item "$REPO_ROOT/map_design_v1.md" "$REPO_ROOT/docs/development/map-design/"
move_item "$REPO_ROOT/quest_design_principles.md" "$REPO_ROOT/docs/development/quest-design/"
move_item "$REPO_ROOT/world_lore_draft.md" "$REPO_ROOT/docs/development/world-design/"
move_item "$REPO_ROOT/human_testing_feedback.md" "$REPO_ROOT/docs/human-testing/"
log_message ""

log_message "  Moving test runner files and scripts..."
move_item "$REPO_ROOT/run_all_tests.sh" "$REPO_ROOT/tests/unit/"
move_item "$REPO_ROOT/browser_test_suite.js" "$REPO_ROOT/tests/browser/"
move_item "$REPO_ROOT/integration_test_config.json" "$REPO_ROOT/tests/integration/"
log_message ""

log_message "  Moving temporary/work files to .claude/tmp/ or archives/..."
move_item "$REPO_ROOT/temp_log.txt" "$REPO_ROOT/.claude/tmp/"
move_item "$REPO_ROOT/scratchpad.md" "$REPO_ROOT/.claude/tmp/"
move_item "$REPO_ROOT/test_output.json" "$REPO_ROOT/.claude/tmp/"
move_item "$REPO_ROOT/old_draft.bak" "$REPO_ROOT/archives/old-docs/" # Moved to old-docs
move_item "$REPO_ROOT/weather effect error.txt" "$REPO_ROOT/archives/debug-logs/" # Specific request
log_message ""

# Handle generic temporary file patterns
log_message "  Moving other common temporary files based on patterns..."
# Enable nullglob to prevent patterns from expanding to literal strings if no matches
shopt -s nullglob
for f in "$REPO_ROOT"/*.tmp; do move_item "$f" "$REPO_ROOT/.claude/tmp/"; done
for f in "$REPO_ROOT"/*.log; do
    if [[ "$(basename "$f")" != "npm-debug.log" ]]; then # Exclude npm-debug.log
        move_item "$f" "$REPO_ROOT/.claude/tmp/"
    fi
done
for f in "$REPO_ROOT"/*_temp.*; do move_item "$f" "$REPO_ROOT/.claude/tmp/"; done
for f in "$REPO_ROOT"/debug_*.log; do move_item "$f" "$REPO_ROOT/.claude/tmp/"; done
shopt -u nullglob # Disable nullglob

log_message ""

# 3. Update git (stage moves)
log_message "3. Staging all changes for Git..."
# `git add -A` stages all modifications, deletions, and additions, including renames.
if git add -A "$REPO_ROOT" &>> "$LOG_FILE"; then
    log_message "  SUCCESS: All changes staged for Git."
else
    log_message "  ERROR: Failed to stage changes for Git. Please check manually."
    ((FAILURE_COUNT++))
fi
log_message ""

# 4. Create a migration report
log_message "4. Creating migration report..."
log_message "----------------------------------------------------"
log_message "Repository Reorganization Report"
log_message "----------------------------------------------------"
log_message "Date: $(date)"
log_message "Total attempted operations: $((SUCCESS_COUNT + FAILURE_COUNT))"
log_message "Successfully moved items: $SUCCESS_COUNT"
log_message "Skipped/Failed items: $FAILURE_COUNT"
log_message ""

if [ ${#MOVED_ITEMS[@]} -gt 0 ]; then
    log_message "Successfully moved items details:"
    for item in "${MOVED_ITEMS[@]}"; do
        log_message "  - $item"
    done
else
    log_message "No items were successfully moved (or list is empty)."
fi
log_message ""

if [ ${#FAILED_ITEMS[@]} -gt 0 ]; then
    log_message "Skipped/Failed items details (source not found or move error):"
    for item in "${FAILED_ITEMS[@]}"; do
        log_message "  - $item"
    done
else
    log_message "No items were skipped or failed to move."
fi
log_message ""

log_message "Migration script finished."
if [ "$FAILURE_COUNT" -gt 0 ]; then
    log_message "WARNING: Some operations failed or files were not found. Please review the log file: $LOG_FILE"
    exit 1
else
    log_message "All specified operations completed successfully (or skipped gracefully if source not found)."
    log_message "Please review the staged changes with 'git status' and 'git diff --staged' before committing."
    log_message "Remember to manually update any internal file references within documentation (e.g., in READMEs)."
    exit 0
fi
```

**To run this script:**
1.  Save it as `migrate_repo_structure.sh` in the root of your `tales-of-claude` repository.
2.  Make it executable: `chmod +x migrate_repo_structure.sh`
3.  Run it: `./migrate_repo_structure.sh`
4.  Review the output and the generated `migration_report_*.log` file.
5.  Check `git status` and `git diff --staged` to confirm the changes before committing.
6.  **Crucially, manually update any internal links or references within your markdown files (e.g., `README.md`, `CLAUDE.md`, etc.) that point to the old file paths.**

---

## 2. Updated `README.md` Snippet

This snippet provides a high-level overview of the new repository structure for the main project `README.md`.

```markdown
# Tales of Claude

Welcome to the Tales of Claude repository! This project is an interactive narrative experience powered by advanced AI. This README provides a high-level overview of the project and its structure.

## Repository Structure

We've recently reorganized the repository to provide a cleaner, more intuitive structure. Here's a quick guide to the main top-level directories:

*   **`src/`**: Contains the core source code for the Tales of Claude application. This is where the game logic, UI components, and main application files reside.
*   **`public/`**: Stores static assets like images, fonts, and other resources served directly by the application.
*   **`dist/`**: The output directory for compiled application builds.
*   **`REVOLUTION/`**: Dedicated to the REVOLUTION methodology documentation. This includes guides for human users and AI agents, the core knowledge base, and reusable templates for our development processes.
*   **`docs/`**: General documentation for the Tales of Claude game itself. This encompasses game history, roadmaps, session summaries, design notes, technical specifications, development artifacts (like map and quest designs), and human testing feedback.
*   **`.claude/`**: Internal directory for Claude-specific configurations, temporary files generated during sessions, and field test reports.
*   **`tests/`**: All automated test suites, categorized by type (unit, browser, integration).
*   **`archives/`**: A holding area for deprecated, historical, or non-current files, including old debug logs, beta test results, and deprecated documentation.

For more detailed information on specific areas, please refer to the `README.md` files within each major directory (e.g., `REVOLUTION/README.md`).
```

---

## 3. Agent Onboarding Snippet

This snippet is designed to be easily digestible for new or existing agents to quickly understand where to find and place different types of information.

```markdown
## Agent Onboarding: Navigating the Tales of Claude Repository

Welcome, Agent! The Tales of Claude repository has been reorganized to streamline our collaborative development process. Here's a quick guide to help you find what you need and contribute effectively:

### Where to Find Things:

*   **Core Application Code:**
    *   **Game Source Code:** `src/`
    *   **Static Assets (Images, etc.):** `public/`
*   **REVOLUTION Methodology & AI Knowledge:**
    *   **REVOLUTION Overview:** `REVOLUTION/README.md`
    *   **Practical Guides (for Human Users & Agents):** `REVOLUTION/guides/` (e.g., `01-practical-guide-human-users.md`, `05-claude-team-lead-manual.md`)
    *   **Core Claude Knowledge Base:** `REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md`
    *   **Training Scenarios & Field Test Insights:** `REVOLUTION/knowledge/`
    *   **REVOLUTION Templates:** `REVOLUTION/templates/`
*   **Tales of Claude Game Documentation (`docs/`):**
    *   **Game History & Lore:** `docs/game/CLAUDE.md`
    *   **Game Roadmaps (Feature, Implementation, General):** `docs/game/roadmaps/`
    *   **Session Summaries:** `docs/game/sessions/`
    *   **Game Testing Documentation:** `docs/game/testing/` (e.g., `TESTING.md`, `game_testing_plan.md`)
    *   **Game Design Notes:** `docs/game/design/`
    *   **Technical Specifications:** `docs/game/technical/`
    *   **Detailed Development Artifacts (Map, Quest, World Design):** `docs/development/` (e.g., `docs/development/map-design/map_design_v1.md`)
    *   **Human Testing Feedback & Reports:** `docs/human-testing/`
*   **Testing & Quality Assurance:**
    *   **All Automated Tests:** `tests/`
    *   **Unit Tests:** `tests/unit/`
    *   **Browser Tests:** `tests/browser/`
    *   **Integration Tests:** `tests/integration/`
*   **Claude Internal / Temporary & Archival Information:**
    *   **Temporary Work Files (for current session):** `.claude/tmp/` (Files here are *not* version controlled and are subject to cleanup. Do not store critical work here.)
    *   **Field Test Reports (historical):** `.claude/field-test-reports/`
    *   **Old Debug Logs:** `archives/debug-logs/`
    *   **Deprecated Documentation:** `archives/old-docs/`
    *   **Old Runner Scripts:** `archives/tmp-scripts/`

### Important Notes for Agents:

*   **Commit Messages:** Please use clear and concise commit messages, referencing the relevant documentation or task.
*   **File Placement:** Always ensure new files are placed in the correct, logical directory according to this structure. If unsure, consult the Knowledge Consolidator or your Team Lead.
*   **Temporary Files:** Utilize `.claude/tmp/` for transient data. Do not commit files from this directory.
*   **Seeking Help:** If you cannot find a specific document or are unsure where to place new content, consult the `REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md` or ask your Team Lead.
```

---

## 4. Quick Reference Card for Common Paths

This card provides a concise list of frequently accessed paths for quick lookups.

```
# Tales of Claude Repository Quick Reference

## Core Application
- **Source Code:** `src/`
- **Static Assets:** `public/`

## REVOLUTION Methodology
- **Overview:** `REVOLUTION/README.md`
- **Guides:** `REVOLUTION/guides/`
- **Claude Knowledge Base:** `REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md`
- **Templates:** `REVOLUTION/templates/`

## Game Documentation (`docs/game/`)
- **History/Lore:** `docs/game/CLAUDE.md`
- **Roadmaps:** `docs/game/roadmaps/`
- **Session Summaries:** `docs/game/sessions/`
- **Testing Docs:** `docs/game/testing/`
- **Game Design:** `docs/game/design/`
- **Technical Specs:** `docs/game/technical/`

## Development Artifacts (`docs/development/`)
- **Map Design:** `docs/development/map-design/`
- **Quest Design:** `docs/development/quest-design/`
- **World Design:** `docs/development/world-design/`

## Human Testing
- **Feedback/Reports:** `docs/human-testing/`

## Testing
- **Unit Tests:** `tests/unit/`
- **Browser Tests:** `tests/browser/`
- **Integration Tests:** `tests/integration/`

## Claude Internal / Temporary
- **Temporary Work:** `.claude/tmp/`
- **Field Test Reports:** `.claude/field-test-reports/`

## Archives
- **Debug Logs:** `archives/debug-logs/`
- **Old Docs:** `archives/old-docs/`
- **Old Scripts:** `archives/tmp-scripts/`
```