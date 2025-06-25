#!/bin/bash

# Role-Based Documentation Loader
# Loads only relevant docs based on agent role
# Usage: ./load-role-docs.sh "agent-name"

AGENT_NAME="$1"
DOCS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../docs/documentation-modules"

if [ -z "$AGENT_NAME" ]; then
    echo "Usage: $0 <agent-name>"
    echo "Example: $0 'nina-system-integration'"
    exit 1
fi

echo "📚 Loading documentation for: $AGENT_NAME"
echo "========================================="

# Detect role from agent name
detect_role() {
    local name="$1"
    
    # Bug fixers
    if [[ "$name" =~ fix|debug|repair|patch ]]; then
        echo "bug-fixer"
    # Test writers
    elif [[ "$name" =~ test|spec|verification ]]; then
        echo "test-writer"
    # Visual/UI
    elif [[ "$name" =~ visual|ui|layout|style|design ]]; then
        echo "visual-ui"
    # Team leads
    elif [[ "$name" =~ lead|orchestrat|coordinat ]]; then
        echo "team-lead"
    # Default
    else
        echo "code-builder"
    fi
}

ROLE=$(detect_role "$AGENT_NAME")
echo "Detected role: $ROLE"
echo ""

# Core docs everyone needs
echo "📄 Core Documentation:"
echo "- $DOCS_DIR/core-docs/core-essentials.md"

# Role-specific docs
echo ""
echo "📑 Role-Specific Documentation:"
case "$ROLE" in
    "bug-fixer")
        echo "- $DOCS_DIR/role-modules/debugging-guide.md"
        echo "- Recent fixes: .claude/field-test-reports/*fix*.md"
        ;;
    "test-writer")
        echo "- $DOCS_DIR/role-modules/test-infrastructure.md"
        echo "- Test examples: src/tests/"
        ;;
    "visual-ui")
        echo "- $DOCS_DIR/role-modules/ui-guidelines.md"
        echo "- Screenshot guide: docs/SCREENSHOT_QUICK_REFERENCE.md"
        ;;
    "team-lead")
        echo "- REVOLUTION/05-claude-team-lead-manual-v2.md"
        echo "- Skip all coding docs!"
        ;;
    *)
        echo "- $DOCS_DIR/role-modules/architecture-patterns.md"
        echo "- Delegate guide: REVOLUTION/06-claude-task-agent-manual-v2.md"
        ;;
esac

# Memory documents
echo ""
echo "🧠 Memory & Knowledge:"
echo "- Your diary: .claude/task-agents/${AGENT_NAME}/diary.md"
echo "- Collective knowledge: REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md"

# Context recommendations
echo ""
echo "💡 When using delegate, always attach:"
case "$ROLE" in
    "bug-fixer")
        echo "- The broken file(s)"
        echo "- Error messages or type-check output"
        echo "- Working examples if available"
        ;;
    "visual-ui")
        echo "- Current component and CSS"
        echo "- Screenshots (use screenshot tool first!)"
        echo "- Design requirements"
        ;;
    *)
        echo "- Current file(s) you're modifying"
        echo "- Related type definitions"
        echo "- Similar implementations"
        ;;
esac

echo ""
echo "========================================="
echo "📊 Estimated token usage: $(case $ROLE in
    "team-lead") echo "~2,500 tokens" ;;
    "bug-fixer") echo "~4,500 tokens" ;;
    *) echo "~5,000 tokens" ;;
esac) (vs 34,000+ for everything)"
echo ""
echo "✅ Documentation loading complete!"