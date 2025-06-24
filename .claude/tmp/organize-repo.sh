#!/bin/bash

# Repository Organization Script for Tales of Claude
# Created by Repository Architecture Analyst
# Date: 2025-06-24

set -e  # Exit on error

# --- Configuration ---
REPO_ROOT=$(pwd)
LOG_FILE="$REPO_ROOT/.claude/tmp/migration_report_$(date +%Y%m%d_%H%M%S).log"
DRY_RUN=${1:-false}  # Pass 'true' as first argument for dry run

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Helper Functions ---
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log_success() {
    log "${GREEN}✓ $1${NC}"
}

log_warning() {
    log "${YELLOW}⚠ $1${NC}"
}

log_error() {
    log "${RED}✗ $1${NC}"
}

# Safe move function with git tracking
safe_move() {
    local src="$1"
    local dest="$2"
    
    if [ "$DRY_RUN" = "true" ]; then
        if [ -e "$src" ]; then
            log "  [DRY RUN] Would move: $src → $dest"
        else
            log_warning "  [DRY RUN] Source not found: $src"
        fi
        return
    fi
    
    if [ -e "$src" ]; then
        # Create destination directory if needed
        dest_dir=$(dirname "$dest")
        mkdir -p "$dest_dir"
        
        # Use git mv if file is tracked, regular mv otherwise
        if git ls-files --error-unmatch "$src" &>/dev/null; then
            if git mv "$src" "$dest" 2>>"$LOG_FILE"; then
                log_success "Moved (git): $src → $dest"
            else
                log_error "Failed to git mv: $src"
            fi
        else
            if mv "$src" "$dest" 2>>"$LOG_FILE"; then
                log_success "Moved: $src → $dest"
            else
                log_error "Failed to move: $src"
            fi
        fi
    else
        log_warning "Source not found: $src"
    fi
}

# --- Main Script ---
log "=== Tales of Claude Repository Organization ==="
log "Started at: $(date)"
log "Dry run mode: $DRY_RUN"
log ""

# 1. Create directory structure
log "1. Creating directory structure..."

DIRS=(
    # REVOLUTION structure (enhanced)
    "REVOLUTION/guides"
    "REVOLUTION/knowledge"
    "REVOLUTION/templates"
    
    # Game documentation
    "docs/game/sessions"
    "docs/game/roadmaps"
    "docs/game/testing"
    
    # Development documentation (keeping existing)
    "docs/development"
    
    # REVOLUTION-specific docs
    "docs/revolution/examples"
    "docs/revolution/patterns"
    
    # Claude working directories
    ".claude/tmp"
    ".claude/knowledge-updates"
    
    # Archives for old content
    "archives/old-docs"
    "archives/debug-logs"
    "archives/tmp-scripts"
)

for dir in "${DIRS[@]}"; do
    if [ "$DRY_RUN" = "true" ]; then
        log "  [DRY RUN] Would create: $dir"
    else
        mkdir -p "$REPO_ROOT/$dir"
        log_success "Created: $dir"
    fi
done

log ""
log "2. Moving files to organized locations..."

# Move root level docs to proper locations
log "  Moving game documentation..."
safe_move "$REPO_ROOT/CLAUDE.md" "$REPO_ROOT/docs/game/CLAUDE.md"
safe_move "$REPO_ROOT/ROADMAP.md" "$REPO_ROOT/docs/game/roadmaps/ROADMAP.md"
safe_move "$REPO_ROOT/FEATURE_ROADMAP.md" "$REPO_ROOT/docs/game/roadmaps/FEATURE_ROADMAP.md"
safe_move "$REPO_ROOT/implementation-roadmap.md" "$REPO_ROOT/docs/game/roadmaps/implementation-roadmap.md"
safe_move "$REPO_ROOT/SESSION_3_SUMMARY.md" "$REPO_ROOT/docs/game/sessions/SESSION_3_SUMMARY.md"
safe_move "$REPO_ROOT/TESTING.md" "$REPO_ROOT/docs/game/testing/TESTING.md"

# Move REVOLUTION knowledge
log ""
log "  Moving REVOLUTION knowledge..."
safe_move "$REPO_ROOT/CLAUDE_KNOWLEDGE.md" "$REPO_ROOT/REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md"

# Move .claude files to proper locations
log ""
log "  Organizing .claude directory..."
safe_move "$REPO_ROOT/.claude/training-scenarios.md" "$REPO_ROOT/REVOLUTION/knowledge/training-scenarios.md"
safe_move "$REPO_ROOT/.claude/manual-updates.md" "$REPO_ROOT/.claude/knowledge-updates/manual-updates.md"
safe_move "$REPO_ROOT/.claude/knowledge-updates.md" "$REPO_ROOT/.claude/knowledge-updates/knowledge-updates.md"
safe_move "$REPO_ROOT/.claude/revolution-integration-plan.md" "$REPO_ROOT/docs/revolution/revolution-integration-plan.md"

# Move revolution example docs
log ""
log "  Moving REVOLUTION examples..."
safe_move "$REPO_ROOT/docs/senior-junior-examples.md" "$REPO_ROOT/docs/revolution/examples/senior-junior-examples.md"
safe_move "$REPO_ROOT/docs/marker-extraction-scripts.md" "$REPO_ROOT/docs/revolution/patterns/marker-extraction-scripts.md"

# Archive old/debug files
log ""
log "  Archiving old files..."
safe_move "$REPO_ROOT/weather effect error.txt" "$REPO_ROOT/archives/debug-logs/weather-effect-error.txt"

# Move any test concept files
if [ -d "$REPO_ROOT/tests/concept" ]; then
    log ""
    log "  Organizing test concept files..."
    for file in playwright-runner-clean.ts playwright-test-runner.ts puppeteer-runner-clean.ts run-browser-tests.ts run-puppeteer-tests.ts simple-puppeteer-runner.ts; do
        if [ -f "$REPO_ROOT/$file" ]; then
            safe_move "$REPO_ROOT/$file" "$REPO_ROOT/tests/concept/$file"
        fi
    done
fi

# 3. Create quick reference files
log ""
log "3. Creating quick reference documentation..."

if [ "$DRY_RUN" != "true" ]; then
    # Create agent quick reference
    cat > "$REPO_ROOT/QUICK_REFERENCE.md" << 'EOF'
# 🚀 Tales of Claude - Quick Reference

## 📍 Key File Locations

### Essential Files (The Big 5)
1. **Project Overview**: `/README.md`
2. **REVOLUTION Guide**: `/REVOLUTION/README.md`
3. **Task Agent Manual**: `/REVOLUTION/guides/06-claude-task-agent-manual-v2.md`
4. **Knowledge Base**: `/REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md`
5. **Game Roadmap**: `/docs/game/roadmaps/ROADMAP.md`

### Directory Structure
```
tales-of-claude/
├── src/                        # Game source code
├── REVOLUTION/                 # Methodology & workflow
│   ├── guides/                # Agent manuals & guides
│   ├── knowledge/             # Knowledge base & training
│   └── templates/             # Reusable templates
├── docs/                      # All documentation
│   ├── game/                  # Game-specific docs
│   │   ├── sessions/         # Session summaries
│   │   ├── roadmaps/         # All roadmap documents
│   │   └── testing/          # Testing documentation
│   ├── development/          # Dev artifacts (maps, quests, etc.)
│   └── revolution/           # REVOLUTION examples & patterns
├── .claude/                   # Claude workspace
│   ├── field-test-reports/   # Agent reports (by date)
│   ├── tmp/                  # Temporary work files
│   └── knowledge-updates/    # Knowledge consolidation
└── archives/                  # Old/deprecated content
```

### For Task Agents
- **Before starting**: Read `/REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md`
- **Your manual**: `/REVOLUTION/guides/06-claude-task-agent-manual-v2.md`
- **Temp work**: Save to `/.claude/tmp/`
- **Field reports**: Save to `/.claude/field-test-reports/[agent-name]-YYYY-MM-DD.md`

### For Humans
- **Game info**: Check `/docs/game/`
- **How to use agents**: `/REVOLUTION/guides/01-practical-guide-human-users-v2.md`
- **Session summaries**: `/docs/game/sessions/`
EOF
    log_success "Created QUICK_REFERENCE.md"
    
    # Update main README with new structure info
    if [ -f "$REPO_ROOT/README.md" ]; then
        # Add structure section if not present
        if ! grep -q "Repository Structure" "$REPO_ROOT/README.md"; then
            cat >> "$REPO_ROOT/README.md" << 'EOF'

## 📁 Repository Structure

This repository is organized for clarity and efficiency:

- **`/src`** - Game source code (React/TypeScript)
- **`/REVOLUTION`** - AI development methodology and guides
- **`/docs`** - All documentation (game, development, methodology)
- **`/.claude`** - Agent workspace and reports
- **`/tests`** - Test suites and runners
- **`/archives`** - Historical/deprecated content

See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for detailed navigation help.
EOF
            log_success "Updated README.md with structure info"
        fi
    fi
fi

# 4. Generate migration report
log ""
log "4. Generating migration report..."

if [ "$DRY_RUN" != "true" ]; then
    REPORT_FILE="$REPO_ROOT/.claude/tmp/migration-report-$(date +%Y%m%d_%H%M%S).md"
    cat > "$REPORT_FILE" << EOF
# Repository Migration Report

**Date**: $(date)
**Executed by**: Repository Architecture Analyst

## Summary

The Tales of Claude repository has been reorganized for better clarity and maintainability.

### Key Changes

1. **REVOLUTION methodology** consolidated under \`/REVOLUTION\`
2. **Game documentation** organized under \`/docs/game\`
3. **Working directory** established at \`/.claude/tmp\`
4. **Archives** created for deprecated content
5. **Quick reference** added for easy navigation

### Directory Structure

\`\`\`
$(tree -d -L 3 "$REPO_ROOT" 2>/dev/null | grep -v node_modules | head -50 || echo "Tree command not available")
\`\`\`

### Next Steps

1. Review the new structure
2. Update any broken internal links
3. Commit the changes with: \`git add -A && git commit -m "chore: Reorganize repository structure for clarity"\`
4. Inform team members of the new structure

### Files Moved

See the detailed log at: $LOG_FILE
EOF
    log_success "Created migration report: $REPORT_FILE"
fi

# 5. Final summary
log ""
log "=== Migration Complete ==="
log "Finished at: $(date)"

if [ "$DRY_RUN" = "true" ]; then
    log ""
    log_warning "This was a DRY RUN. No files were actually moved."
    log "To perform the actual migration, run: ./organize-repo.sh"
else
    log ""
    log_success "Repository successfully reorganized!"
    log ""
    log "Next steps:"
    log "1. Review changes with: git status"
    log "2. Check the migration report in .claude/tmp/"
    log "3. Commit when ready with: git add -A && git commit -m \"chore: Reorganize repository structure\""
fi