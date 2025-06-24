#!/bin/bash
# Knowledge Consolidator Cleanup Template
# This script is for reference - agents should adapt commands as needed

echo "=== Knowledge Consolidator Cleanup Starting ==="

# 1. Create current month's folder
CURRENT_MONTH=$(date +%Y-%m)
ORGANIZED_DIR=".claude/field-test-reports/organized/$CURRENT_MONTH"
mkdir -p "$ORGANIZED_DIR"

# 2. Move processed reports (adapt pattern as needed)
echo "Moving processed field reports to $ORGANIZED_DIR..."
for report in .claude/field-test-reports/*-2025-06-*.md; do
    if [ -f "$report" ]; then
        # Skip if it's already in organized folder
        case "$report" in
            *organized*) continue ;;
        esac
        
        mv "$report" "$ORGANIZED_DIR/"
        echo "  Moved: $(basename "$report")"
    fi
done

# 3. Update processed.log
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
REPORT_COUNT=$(ls -1 "$ORGANIZED_DIR"/*.md 2>/dev/null | wc -l)
echo "[$TIMESTAMP] Processed $REPORT_COUNT reports, moved to $ORGANIZED_DIR" >> .claude/processed.log

# 4. Clean root directory (be VERY careful)
echo "Checking root directory for stray files..."
PROTECTED_FILES="CLAUDE.md README.md TESTING.md CLAUDE_KNOWLEDGE.md"
for file in *.md; do
    if [ -f "$file" ]; then
        # Check if it's a protected file
        IS_PROTECTED=false
        for protected in $PROTECTED_FILES; do
            if [ "$file" = "$protected" ]; then
                IS_PROTECTED=true
                break
            fi
        done
        
        if [ "$IS_PROTECTED" = false ]; then
            echo "  Moving $file to archives/temp/"
            mkdir -p archives/temp
            mv "$file" archives/temp/
        fi
    fi
done

# 5. Clean tmp directory
if [ -d ".claude/tmp" ]; then
    echo "Cleaning .claude/tmp/..."
    rm -rf .claude/tmp/*
fi

# 6. Summary
echo "=== Cleanup Complete ==="
echo "Reports organized: $REPORT_COUNT"
echo "Current structure:"
tree -L 3 .claude/field-test-reports/organized/ 2>/dev/null || ls -la .claude/field-test-reports/organized/

# Note: This is a template. Agents should adapt based on actual files present.