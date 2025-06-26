#!/bin/bash

# Smart Documentation Loader
# Dynamically creates a minimal context file for each agent based on their role
# Usage: source smart-doc-loader.sh "agent-name" > agent-context.md

AGENT_NAME="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS_DIR="$SCRIPT_DIR/../../docs/documentation-modules"
REVOLUTION_DIR="$SCRIPT_DIR/../../REVOLUTION"

if [ -z "$AGENT_NAME" ]; then
    echo "Usage: $0 <agent-name>"
    echo "Example: $0 'leslie-token-optimizer'"
    exit 1
fi

echo "# Documentation Context for $AGENT_NAME"
echo "Generated: $(date)"
echo ""

# Detect role from agent name
detect_role() {
    local name="$1"
    
    # Team leads/orchestrators (check first)
    if [[ "$name" =~ lead|orchestrat|coordinat|manag ]]; then
        echo "team-lead"
    # Bug fixers
    elif [[ "$name" =~ fix|debug|repair|patch|emergency|critical ]]; then
        echo "bug-fixer"
    # Test writers
    elif [[ "$name" =~ test|spec|verification|quality ]]; then
        echo "test-writer"
    # Knowledge/documentation
    elif [[ "$name" =~ knowledge|document|consolidat|manual ]]; then
        echo "knowledge-worker"
    # System/architecture
    elif [[ "$name" =~ system|architect|infrastructure ]]; then
        echo "system-architect"
    # Integration specialists
    elif [[ "$name" =~ integration && ! "$name" =~ test ]]; then
        echo "system-architect"
    # Visual/UI (check after other specific roles, avoid "build" matching "ui")
    elif [[ "$name" =~ visual|[^b]ui|layout|style|design|color|animation ]]; then
        echo "visual-ui"
    # Code builders (check for explicit builder/coder patterns)
    elif [[ "$name" =~ build|code|implement|develop|program ]]; then
        echo "code-builder"
    # Default
    else
        echo "code-builder"
    fi
}

ROLE=$(detect_role "$AGENT_NAME")
echo "## Your Role: $ROLE"
echo ""

# Always include core essentials
echo "## Core Essentials"
echo '```markdown'
cat "$DOCS_DIR/core-docs/core-essentials.md" 2>/dev/null || echo "Core essentials not found"
echo '```'
echo ""

# Role-specific content
echo "## Role-Specific Documentation"
case "$ROLE" in
    "bug-fixer")
        echo '```markdown'
        cat "$DOCS_DIR/role-modules/bug-fixer-guide.md" 2>/dev/null || echo "Bug fixer guide not found"
        echo '```'
        echo ""
        echo "## Recent Bug Fixes (Reference)"
        echo "Check these field reports for patterns:"
        ls -t "$SCRIPT_DIR/../field-test-reports/"*fix*.md 2>/dev/null | head -5 | while read f; do
            echo "- $(basename "$f")"
        done
        ;;
        
    "visual-ui")
        echo '```markdown'
        cat "$DOCS_DIR/role-modules/visual-ui-guide.md" 2>/dev/null || echo "Visual UI guide not found"
        echo '```'
        echo ""
        echo "## Screenshot Tool"
        echo "Always capture current state first:"
        echo '```'
        echo "Use browser screenshot tool or Read existing screenshots in test-reports/screenshots/"
        echo '```'
        ;;
        
    "test-writer")
        echo "## Test Infrastructure"
        echo '```'
        echo "- Test runner: npx tsx src/tests/node-test-runner.ts"
        echo "- Browser tests: npx tsx src/tests/puppeteer-test-runner.ts"
        echo "- Test location: src/tests/"
        echo '```'
        echo ""
        echo "## Testing Patterns"
        grep -A10 -B2 "test.*pattern\|testing.*tip" "$REVOLUTION_DIR/knowledge/CLAUDE_KNOWLEDGE_LEAN.md" 2>/dev/null || echo "No testing patterns found"
        ;;
        
    "team-lead")
        echo "## Team Lead Manual (Critical!)"
        echo "You orchestrate, never code. Key sections:"
        echo '```'
        head -50 "$REVOLUTION_DIR/05-claude-team-lead-manual-v2.md" 2>/dev/null | grep -E "^#|^-|orchestrat|trust|parallel"
        echo '```'
        echo ""
        echo "## Recent Team Activity"
        ls -t "$SCRIPT_DIR/../field-test-reports/"*.md 2>/dev/null | head -5 | while read f; do
            echo "- $(basename "$f" | cut -d'-' -f1-3): $(grep -m1 "Mission:" "$f" 2>/dev/null | cut -c1-60)..."
        done
        ;;
        
    "knowledge-worker")
        echo "## Knowledge Systems"
        echo '```'
        echo "- Main knowledge base: REVOLUTION/knowledge/CLAUDE_KNOWLEDGE_LEAN.md"
        echo "- Extract script: .claude/scripts/extract-knowledge.sh"
        echo "- Archive script: .claude/scripts/archive-diaries.sh"
        echo '```'
        echo ""
        echo "## Consolidation Patterns"
        grep -A5 -B2 "consolidat\|knowledge\|pattern" "$REVOLUTION_DIR/knowledge/CLAUDE_KNOWLEDGE_LEAN.md" 2>/dev/null | head -20
        ;;
        
    "system-architect")
        echo "## System Architecture (Nina's Lean Docs)"
        echo '```markdown'
        # Include ARCHITECTURE_LEAN.md for system architects
        cat "$SCRIPT_DIR/../../docs/ARCHITECTURE_LEAN.md" 2>/dev/null || echo "Architecture guide not found"
        echo '```'
        echo ""
        echo "## Integration Guide (Hidden Features)"
        echo '```markdown'
        # Show first 50 lines of integration guide
        head -50 "$SCRIPT_DIR/../../docs/INTEGRATION_GUIDE.md" 2>/dev/null || echo "Integration guide not found"
        echo '```'
        echo ""
        echo "## System Patterns"
        echo '```typescript'
        echo "// Event-driven pattern (preferred)"
        echo "eventBus.on('event', handler);"
        echo "eventBus.emit('event', data);"
        echo ""
        echo "// State management pattern"
        echo "const [state, dispatch] = useGameContext();"
        echo '```'
        echo ""
        echo "## Architecture Decisions"
        grep -A5 -B2 "architect\|system\|pattern" "$REVOLUTION_DIR/knowledge/CLAUDE_KNOWLEDGE_LEAN.md" 2>/dev/null | head -20
        ;;
        
    *)  # code-builder (default)
        echo "## API Reference (Essential Methods)"
        echo '```markdown'
        # Show key sections of API reference for builders
        grep -A20 "## [0-9]\." "$SCRIPT_DIR/../../docs/API_REFERENCE_LEAN.md" 2>/dev/null | head -100 || echo "API reference not found"
        echo '```'
        echo ""
        echo "## Delegate Best Practices"
        echo '```typescript'
        grep -A10 "Delegate.*Communication" "$REVOLUTION_DIR/knowledge/CLAUDE_KNOWLEDGE_LEAN.md" 2>/dev/null | head -15
        echo '```'
        echo ""
        echo "## Common Patterns"
        grep -A10 "Common.*Bug.*Fixes" "$REVOLUTION_DIR/knowledge/CLAUDE_KNOWLEDGE_LEAN.md" 2>/dev/null | head -15
        ;;
esac

# Personal memory reminder
echo ""
echo "## Your Personal Memory"
AGENT_DIR="$SCRIPT_DIR/../task-agents/$AGENT_NAME"
if [ -f "$AGENT_DIR/diary.md" ]; then
    echo "Your diary exists at: .claude/task-agents/$AGENT_NAME/diary.md"
    echo "Last entry:"
    echo '```'
    tail -20 "$AGENT_DIR/diary.md" | grep -A10 -m1 "^###" || echo "No recent entries"
    echo '```'
else
    echo "No diary found. Create one at: .claude/task-agents/$AGENT_NAME/diary.md"
fi

# Token estimate
echo ""
echo "---"
echo "**Estimated token usage**: ~3,000-5,000 tokens (vs 34,000+ for everything)"
echo "**Token savings**: ~85-91%"

# Make executable
chmod +x "$SCRIPT_DIR/smart-doc-loader.sh"