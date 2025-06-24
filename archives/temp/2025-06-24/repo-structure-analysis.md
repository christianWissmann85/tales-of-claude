The "Tales of Claude" repository has grown organically, leading to a disorganized structure that hinders efficient development and knowledge discovery. This reorganization plan aims to establish a clear, logical, and maintainable repository architecture, separating core application code from documentation, methodology, and temporary assets.

---

## Repository Reorganization Plan: Tales of Claude

### 1. Current State Analysis

The current repository root is cluttered with a mix of application files, REVOLUTION methodology documentation, game-specific documentation, temporary files, and scattered test scripts.

**Files Identified for Movement from Root:**

*   **REVOLUTION Methodology Documentation (mixed with game docs):**
    *   `REVOLUTION_README.md` (Assumed methodology overview)
    *   `01-practical-guide-human-users.md`
    *   `02-prompt-patterns-cookbook.md`
    *   `03-workflow-examples.md`
    *   `04-multi-agent-best-practices.md`
    *   `05-claude-team-lead-manual.md`
    *   `06-claude-task-agent-manual.md`
    *   `CLAUDE_KNOWLEDGE.md`
    *   `training-scenarios.md`
    *   `field-test-insights.md`
    *   `REVOLUTION_templates/` (Assumed directory of templates)
*   **Tales of Claude Game Documentation (mixed with methodology docs):**
    *   `CLAUDE.md` (Assumed game development history)
    *   `ROADMAP.md`
    *   `game_design_notes.md` (Example game design document)
    *   `technical_specs.md` (Example game technical document)
    *   `game_testing_plan.md` (Example game testing document)
    *   `map_design_v1.md`
    *   `quest_design_principles.md`
    *   `world_lore_draft.md`
    *   `human_testing_feedback.md`
*   **Test Runner Files and Scripts (scattered):**
    *   `run_all_tests.sh` (Example unit test runner)
    *   `browser_test_suite.js` (Example browser test runner)
    *   `integration_test_config.json` (Example integration test configuration)
*   **Temporary/Work Files (scattered):**
    *   `temp_log.txt`
    *   `scratchpad.md`
    *   `test_output.json`
    *   `old_draft.bak`
    *   (Any other files matching patterns like `*.tmp`, `*.log` not essential, `*_temp.*`, `_old.*`, `debug_*.log`)

**Documentation Categorization:**

*   **REVOLUTION Methodology:** `REVOLUTION_README.md`, `01-practical-guide-human-users.md`, `02-prompt-patterns-cookbook.md`, `03-workflow-examples.md`, `04-multi-agent-best-practices.md`, `05-claude-team-lead-manual.md`, `06-claude-task-agent-manual.md`, `CLAUDE_KNOWLEDGE.md`, `training-scenarios.md`, `field-test-insights.md`, `REVOLUTION_templates/`.
*   **Tales of Claude Game:** `CLAUDE.md`, `ROADMAP.md`, `game_design_notes.md`, `technical_specs.md`, `game_testing_plan.md`, `map_design_v1.md`, `quest_design_principles.md`, `world_lore_draft.md`, `human_testing_feedback.md`.

### 2. Proposed New Structure (Detailed Tree)

The new structure provides clear separation, logical grouping, and designated areas for different types of assets.

```
tales-of-claude/
├── README.md                                   # Main project overview (Key File 1)
├── LICENSE                                     # Project license
├── package.json                                # Node.js/TypeScript project configuration
├── tsconfig.json                               # TypeScript compiler configuration
├── vite.config.ts                              # Vite build configuration
├── index.html                                  # Main application entry point
├── public/                                     # Static assets (images, fonts, etc.)
├── src/                                        # Source code for the Tales of Claude application
├── dist/                                       # Compiled application output
│
├── REVOLUTION/                                 # Dedicated directory for REVOLUTION methodology
│   ├── README.md                               # REVOLUTION methodology overview (Key File 2)
│   ├── guides/                                 # Practical guides for human users and agents
│   │   ├── 01-practical-guide-human-users.md   # Core guide for agents (Key File 3)
│   │   ├── 02-prompt-patterns-cookbook.md
│   │   ├── 03-workflow-examples.md
│   │   ├── 04-multi-agent-best-practices.md
│   │   ├── 05-claude-team-lead-manual.md
│   │   └── 06-claude-task-agent-manual.md
│   ├── knowledge/                              # Core knowledge base and training materials
│   │   ├── CLAUDE_KNOWLEDGE.md                 # Core knowledge base for Claude (Key File 4)
│   │   ├── training-scenarios.md
│   │   └── field-test-insights.md
│   └── templates/                              # Reusable templates for REVOLUTION processes
│
├── docs/                                       # General documentation for Tales of Claude
│   ├── game/                                   # Game-specific documentation
│   │   ├── CLAUDE.md                           # Game development history/lore
│   │   ├── ROADMAP.md                          # Game development direction (Key File 5)
│   │   ├── design/                             # Game design documents
│   │   │   └── game_design_notes.md
│   │   ├── technical/                          # Game technical specifications
│   │   │   └── technical_specs.md
│   │   └── testing/                            # Game-specific testing plans/strategies
│   │       └── game_testing_plan.md
│   ├── development/                            # Detailed development artifacts
│   │   ├── map-design/                         # Map design documents
│   │   │   └── map_design_v1.md
│   │   ├── quest-design/                       # Quest design documents
│   │   │   └── quest_design_principles.md
│   │   └── world-design/                       # World lore and design documents
│   │       └── world_lore_draft.md
│   └── human-testing/                          # Reports and feedback from human playtesting
│       └── human_testing_feedback.md
│
├── .claude/                                    # Claude-specific configuration and runtime data
│   ├── field-test-reports/                     # Existing field test reports (organized by date)
│   ├── tmp/                                    # Designated for temporary session work and transient files
│   └── settings.local.json                     # Local settings for Claude's operations
│
├── tests/                                      # All automated test suites and configurations
│   ├── unit/                                   # Unit tests and their runners
│   │   └── run_all_tests.sh
│   ├── browser/                                # Browser-based tests (e.g., UI, E2E)
│   │   └── browser_test_suite.js
│   └── integration/                            # Integration tests and their configurations
│       └── integration_test_config.json
│
└── archives/                                   # For deprecated, historical, or non-current files
```

### 3. Migration Script (Bash Commands)

This script will create the new directories and move the identified files to their correct locations. It includes error handling for files that might not exist.

```bash
#!/bin/bash

echo "Starting repository reorganization for Tales of Claude..."

# Define the root directory (assuming script is run from tales-of-claude/)
REPO_ROOT=$(pwd)

# 1. Create new directories
echo "Creating new directories..."
mkdir -p "$REPO_ROOT/REVOLUTION/guides"
mkdir -p "$REPO_ROOT/REVOLUTION/knowledge"
mkdir -p "$REPO_ROOT/REVOLUTION/templates"
mkdir -p "$REPO_ROOT/docs/game/design"
mkdir -p "$REPO_ROOT/docs/game/technical"
mkdir -p "$REPO_ROOT/docs/game/testing"
mkdir -p "$REPO_ROOT/docs/development/map-design"
mkdir -p "$REPO_ROOT/docs/development/quest-design"
mkdir -p "$REPO_ROOT/docs/development/world-design"
mkdir -p "$REPO_ROOT/docs/human-testing"
mkdir -p "$REPO_ROOT/.claude/tmp"
mkdir -p "$REPO_ROOT/tests/unit"
mkdir -p "$REPO_ROOT/tests/browser"
mkdir -p "$REPO_ROOT/tests/integration"
mkdir -p "$REPO_ROOT/archives"

# Ensure .claude/field-test-reports exists if it's not already there
mkdir -p "$REPO_ROOT/.claude/field-test-reports"

# 2. Move files to proper locations

echo "Moving REVOLUTION methodology documentation..."
mv "$REPO_ROOT/REVOLUTION_README.md" "$REPO_ROOT/REVOLUTION/README.md" 2>/dev/null || echo "  - REVOLUTION_README.md not found, skipping."
mv "$REPO_ROOT/01-practical-guide-human-users.md" "$REPO_ROOT/REVOLUTION/guides/" 2>/dev/null || echo "  - 01-practical-guide-human-users.md not found, skipping."
mv "$REPO_ROOT/02-prompt-patterns-cookbook.md" "$REPO_ROOT/REVOLUTION/guides/" 2>/dev/null || echo "  - 02-prompt-patterns-cookbook.md not found, skipping."
mv "$REPO_ROOT/03-workflow-examples.md" "$REPO_ROOT/REVOLUTION/guides/" 2>/dev/null || echo "  - 03-workflow-examples.md not found, skipping."
mv "$REPO_ROOT/04-multi-agent-best-practices.md" "$REPO_ROOT/REVOLUTION/guides/" 2>/dev/null || echo "  - 04-multi-agent-best-practices.md not found, skipping."
mv "$REPO_ROOT/05-claude-team-lead-manual.md" "$REPO_ROOT/REVOLUTION/guides/" 2>/dev/null || echo "  - 05-claude-team-lead-manual.md not found, skipping."
mv "$REPO_ROOT/06-claude-task-agent-manual.md" "$REPO_ROOT/REVOLUTION/guides/" 2>/dev/null || echo "  - 06-claude-task-agent-manual.md not found, skipping."
mv "$REPO_ROOT/CLAUDE_KNOWLEDGE.md" "$REPO_ROOT/REVOLUTION/knowledge/" 2>/dev/null || echo "  - CLAUDE_KNOWLEDGE.md not found, skipping."
mv "$REPO_ROOT/training-scenarios.md" "$REPO_ROOT/REVOLUTION/knowledge/" 2>/dev/null || echo "  - training-scenarios.md not found, skipping."
mv "$REPO_ROOT/field-test-insights.md" "$REPO_ROOT/REVOLUTION/knowledge/" 2>/dev/null || echo "  - field-test-insights.md not found, skipping."
mv "$REPO_ROOT/REVOLUTION_templates" "$REPO_ROOT/REVOLUTION/templates/" 2>/dev/null || echo "  - REVOLUTION_templates directory not found, skipping."

echo "Moving Tales of Claude game documentation..."
mv "$REPO_ROOT/CLAUDE.md" "$REPO_ROOT/docs/game/" 2>/dev/null || echo "  - CLAUDE.md not found, skipping."
mv "$REPO_ROOT/ROADMAP.md" "$REPO_ROOT/docs/game/" 2>/dev/null || echo "  - ROADMAP.md not found, skipping."
mv "$REPO_ROOT/game_design_notes.md" "$REPO_ROOT/docs/game/design/" 2>/dev/null || echo "  - game_design_notes.md not found, skipping."
mv "$REPO_ROOT/technical_specs.md" "$REPO_ROOT/docs/game/technical/" 2>/dev/null || echo "  - technical_specs.md not found, skipping."
mv "$REPO_ROOT/game_testing_plan.md" "$REPO_ROOT/docs/game/testing/" 2>/dev/null || echo "  - game_testing_plan.md not found, skipping."
mv "$REPO_ROOT/map_design_v1.md" "$REPO_ROOT/docs/development/map-design/" 2>/dev/null || echo "  - map_design_v1.md not found, skipping."
mv "$REPO_ROOT/quest_design_principles.md" "$REPO_ROOT/docs/development/quest-design/" 2>/dev/null || echo "  - quest_design_principles.md not found, skipping."
mv "$REPO_ROOT/world_lore_draft.md" "$REPO_ROOT/docs/development/world-design/" 2>/dev/null || echo "  - world_lore_draft.md not found, skipping."
mv "$REPO_ROOT/human_testing_feedback.md" "$REPO_ROOT/docs/human-testing/" 2>/dev/null || echo "  - human_testing_feedback.md not found, skipping."

echo "Moving test runner files and scripts..."
mv "$REPO_ROOT/run_all_tests.sh" "$REPO_ROOT/tests/unit/" 2>/dev/null || echo "  - run_all_tests.sh not found, skipping."
mv "$REPO_ROOT/browser_test_suite.js" "$REPO_ROOT/tests/browser/" 2>/dev/null || echo "  - browser_test_suite.js not found, skipping."
mv "$REPO_ROOT/integration_test_config.json" "$REPO_ROOT/tests/integration/" 2>/dev/null || echo "  - integration_test_config.json not found, skipping."

echo "Moving temporary/work files to .claude/tmp/ or archives/..."
# Move specific identified temporary files
mv "$REPO_ROOT/temp_log.txt" "$REPO_ROOT/.claude/tmp/" 2>/dev/null || echo "  - temp_log.txt not found, skipping."
mv "$REPO_ROOT/scratchpad.md" "$REPO_ROOT/.claude/tmp/" 2>/dev/null || echo "  - scratchpad.md not found, skipping."
mv "$REPO_ROOT/test_output.json" "$REPO_ROOT/.claude/tmp/" 2>/dev/null || echo "  - test_output.json not found, skipping."
mv "$REPO_ROOT/old_draft.bak" "$REPO_ROOT/archives/" 2>/dev/null || echo "  - old_draft.bak not found, skipping."

# Move any other common temporary patterns to tmp/
echo "  - Moving other common temporary files..."
find "$REPO_ROOT" -maxdepth 1 -type f -name "*.tmp" -exec mv {} "$REPO_ROOT/.claude/tmp/" \; 2>/dev/null
find "$REPO_ROOT" -maxdepth 1 -type f -name "*.log" -not -name "npm-debug.log" -exec mv {} "$REPO_ROOT/.claude/tmp/" \; 2>/dev/null
find "$REPO_ROOT" -maxdepth 1 -type f -name "*_temp.*" -exec mv {} "$REPO_ROOT/.claude/tmp/" \; 2>/dev/null
find "$REPO_ROOT" -maxdepth 1 -type f -name "debug_*.log" -exec mv {} "$REPO_ROOT/.claude/tmp/" \; 2>/dev/null

# 3. Update any file references (Requires manual review or more sophisticated scripting)
echo "Updating file references: This step requires manual review and content updates."
echo "  - Review README.md, REVOLUTION/README.md, and other key documentation for outdated paths."
# Example: If README.md linked to REVOLUTION_README.md, it would need updating.
# sed -i 's|REVOLUTION_README.md|REVOLUTION/README.md|g' "$REPO_ROOT/README.md"
# This is highly context-dependent and should be done carefully.

# 4. Clean up root (remove any empty directories that were moved from)
echo "Cleaning up root directory (removing empty directories if any)..."
# Example: rmdir "$REPO_ROOT/REVOLUTION_templates" 2>/dev/null # If it was an empty dir after moving content
# This step is less critical if all content was moved, but good for tidiness.

echo "Repository reorganization complete. Please review the new structure."
echo "Remember to manually update any internal file references within documentation."
```

### 4. Agent Instruction Updates

To ensure agents can efficiently navigate the reorganized repository and contribute effectively, the following instructions are crucial:

*   **New Paths for Key Files (Easily Discoverable):**
    1.  **Main Project Overview:** `tales-of-claude/README.md`
    2.  **REVOLUTION Methodology Overview:** `tales-of-claude/REVOLUTION/README.md`
    3.  **Practical Guide for Human Users:** `tales-of-claude/REVOLUTION/guides/01-practical-guide-human-users.md`
    4.  **Claude Knowledge Base:** `tales-of-claude/REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md`
    5.  **Game Development Roadmap:** `tales-of-claude/docs/game/ROADMAP.md`

*   **Where to Find Documentation:**
    *   **REVOLUTION Methodology:** All documentation related to the REVOLUTION methodology (guides, knowledge base, templates) is now consolidated under the `tales-of-claude/REVOLUTION/` directory.
        *   `guides/`: Contains practical guides, prompt patterns, workflow examples, and agent manuals.
        *   `knowledge/`: Houses core knowledge, training scenarios, and field test insights.
        *   `templates/`: Stores any reusable templates for REVOLUTION processes.
    *   **Tales of Claude Game Documentation:** All game-specific documentation is now under `tales-of-claude/docs/`.
        *   `docs/game/`: For high-level game information like history (`CLAUDE.md`), roadmap, and core design/technical/testing documentation.
        *   `docs/development/`: For detailed development artifacts like map, quest, and world design.
        *   `docs/human-testing/`: For reports and insights from human playtesting.
    *   **Test Runners & Configurations:** All test-related scripts and configurations are now located in `tales-of-claude/tests/`, categorized by type (unit, browser, integration).

*   **Where to Put Temporary Work:**
    *   For any temporary files, scratchpads, session logs, or intermediate outputs that are not meant for long-term storage or version control, please use the `tales-of-claude/.claude/tmp/` directory.
    *   **Important:** Files in `tmp/` are subject to regular cleanup and are *not* backed up. Do not store critical or permanent work here.
    *   Field test reports should continue to be saved in `tales-of-claude/.claude/field-test-reports/`, organized by date as before.

### 5. Knowledge Consolidator Updates

The Knowledge Consolidator role is critical in maintaining the integrity and usability of the new repository structure.

*   **New Cleanup Duties:**
    *   **Regular `tmp/` Clearance:** Periodically review and clear the `tales-of-claude/.claude/tmp/` directory. This can be automated with a scheduled script (e.g., weekly or monthly) to remove files older than a certain age (e.g., 7-30 days).
    *   **Orphaned File Identification:** Regularly scan the root directory and other top-level directories for files that do not conform to the new structure. These should either be moved to their correct location, archived, or deleted if truly temporary/obsolete.
    *   **Broken Link/Reference Check:** After any significant documentation updates or moves, perform a check for broken internal links within markdown files, especially in `README.md` files and key guides. Tools like `markdown-link-check` can assist.

*   **File Organization Rules:**
    *   **New Documentation:**
        *   New REVOLUTION methodology guides, patterns, or knowledge articles *must* be placed under `tales-of-claude/REVOLUTION/` in the appropriate sub-directory (`guides/`, `knowledge/`, `templates/`).
        *   New game-specific documentation (design, technical, testing, development, human testing) *must* be placed under `tales-of-claude/docs/` in the relevant sub-directory.
        *   New test scripts or configurations *must* be placed under `tales-of-claude/tests/` in the appropriate sub-directory.
    *   **Naming Conventions:** Encourage consistent, descriptive, and lowercase-hyphenated naming conventions within each sub-directory (e.g., `01-filename.md` for guides, `feature-x-design.md` for design docs).
    *   **Metadata/Front Matter:** Promote the use of consistent metadata (e.g., YAML front matter) in markdown files for easier indexing, searchability, and automated processing in the future.
    *   **Version Control Best Practices:** Reinforce the importance of committing changes to the correct branches, writing clear and concise commit messages, and using pull requests for significant changes to ensure review and quality.

*   **Archive Strategies:**
    *   **Deprecation:** When a document or a set of files becomes deprecated but still holds historical value, move it to the `tales-of-claude/archives/` directory. Create logical sub-directories within `archives/` if needed (e.g., `archives/deprecated-features/`, `archives/old-methodology-versions/`).
    *   **Historical Snapshots:** For major project milestones or significant architectural changes, consider creating a dated snapshot within `archives/` if a full Git tag/release is not sufficient for documentation purposes.
    *   **Clear Labeling:** When archiving, add a clear `ARCHIVED_README.md` or similar file within the archived directory explaining why the content was moved, its original location, and its continued relevance (if any).
    *   **Regular Review:** Periodically review the `archives/` directory to ensure it doesn't become a dumping ground and that its contents are still relevant for historical context. Remove truly obsolete content after a defined retention period.