#!/bin/bash

# Knowledge Extraction Script
# Extracts key insights from recent field reports for consolidation
# Usage: ./extract-knowledge.sh [days-back]

DAYS_BACK=${1:-7}  # Default to last 7 days
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORTS_DIR="$SCRIPT_DIR/../field-test-reports"
OUTPUT_FILE="$SCRIPT_DIR/../tmp/knowledge-extract-$(date +%Y-%m-%d).md"

echo "🔍 Extracting knowledge from reports (last $DAYS_BACK days)"
echo "=============================================="
echo ""

# Create output file with header
cat > "$OUTPUT_FILE" << EOF
# Knowledge Extract - $(date +%Y-%m-%d)
*Automated extraction from recent field reports*

## Token-Saving Patterns
EOF

# Extract token-saving discoveries
echo "Searching for token-saving patterns..."
find "$REPORTS_DIR" -name "*.md" -mtime -$DAYS_BACK -type f | while read report; do
    agent_name=$(basename "$report" .md)
    grep -B2 -A2 -E "(saved.*tokens|token.*saving|write_to|delegate.*efficient)" "$report" 2>/dev/null | while IFS= read -r line; do
        if [[ ! "$line" =~ ^-- ]] && [[ -n "$line" ]]; then
            echo "- **$agent_name**: $line" >> "$OUTPUT_FILE"
        fi
    done
done

# Extract bug fixes and solutions
cat >> "$OUTPUT_FILE" << EOF

## Bug Fixes & Solutions
EOF

echo "Searching for bug fixes..."
find "$REPORTS_DIR" -name "*.md" -mtime -$DAYS_BACK -type f | while read report; do
    agent_name=$(basename "$report" .md)
    grep -B1 -A3 -E "(fixed|solution|solved|breakthrough|discovered)" "$report" 2>/dev/null | grep -v "^--$" | while IFS= read -r line; do
        if [[ "$line" =~ (Problem:|Solution:|Fixed:) ]] || [[ "$line" =~ \`.*\` ]]; then
            echo "- **$agent_name**: $line" | head -c 150 >> "$OUTPUT_FILE"
            echo "..." >> "$OUTPUT_FILE"
        fi
    done
done

# Extract Chris preferences
cat >> "$OUTPUT_FILE" << EOF

## Chris Communication Patterns
EOF

echo "Searching for Chris preferences..."
find "$REPORTS_DIR" -name "*.md" -mtime -$DAYS_BACK -type f | while read report; do
    grep -i -E "(chris.*said|chris.*wants|chris.*prefers|chris.*needs)" "$report" 2>/dev/null | while IFS= read -r line; do
        echo "- $line" | head -c 100 >> "$OUTPUT_FILE"
        echo "..." >> "$OUTPUT_FILE"
    done
done | sort -u | head -10 >> "$OUTPUT_FILE"

# Extract common errors
cat >> "$OUTPUT_FILE" << EOF

## Common Errors to Avoid
EOF

echo "Searching for common errors..."
find "$REPORTS_DIR" -name "*.md" -mtime -$DAYS_BACK -type f | while read report; do
    grep -B1 -A1 -E "(error|mistake|wrong|failed|broke)" "$report" 2>/dev/null | grep -v "^--$" | while IFS= read -r line; do
        if [[ -n "$line" ]] && [[ ! "$line" =~ ^# ]]; then
            echo "- $line" | head -c 120 >> "$OUTPUT_FILE"
            echo "" >> "$OUTPUT_FILE"
        fi
    done
done | sort -u | head -15 >> "$OUTPUT_FILE"

# Extract tool usage tips
cat >> "$OUTPUT_FILE" << EOF

## Tool Usage Tips
EOF

echo "Searching for tool tips..."
find "$REPORTS_DIR" -name "*.md" -mtime -$DAYS_BACK -type f | while read report; do
    grep -B1 -A2 -E "(delegate|ripgrep|rg|multiEdit|write_to|screenshot)" "$report" 2>/dev/null | grep -v "^--$" | while IFS= read -r line; do
        if [[ "$line" =~ (tip|pattern|better|instead) ]]; then
            echo "- $line" | sed 's/^[[:space:]]*//' >> "$OUTPUT_FILE"
        fi
    done
done | sort -u | head -10 >> "$OUTPUT_FILE"

# Summary
echo "" >> "$OUTPUT_FILE"
echo "## Summary Stats" >> "$OUTPUT_FILE"
reports_count=$(find "$REPORTS_DIR" -name "*.md" -mtime -$DAYS_BACK -type f | wc -l)
echo "- Reports analyzed: $reports_count" >> "$OUTPUT_FILE"
echo "- Time period: Last $DAYS_BACK days" >> "$OUTPUT_FILE"
echo "- Generated: $(date)" >> "$OUTPUT_FILE"

echo ""
echo "✅ Knowledge extraction complete!"
echo "📄 Output saved to: $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "1. Review the extract for quality"
echo "2. Run Knowledge Consolidator to update CLAUDE_KNOWLEDGE.md"
echo "3. Archive processed reports if needed"

# Make executable
chmod +x "$SCRIPT_DIR/extract-knowledge.sh"