#!/bin/bash

# Diary Archive Script
# Run monthly to keep diaries lean while preserving history
# Usage: ./archive-diaries.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$SCRIPT_DIR/../task-agents"
ARCHIVE_DATE=$(date +%Y-%m)
MAX_LINES=500

echo "🗄️  Starting diary archive process for $ARCHIVE_DATE"
echo "================================================"

archived_count=0
checked_count=0

# Process each agent's diary
for diary in "$BASE_DIR"/*/diary.md; do
    if [ -f "$diary" ]; then
        checked_count=$((checked_count + 1))
        agent_dir=$(dirname "$diary")
        agent_name=$(basename "$agent_dir")
        line_count=$(wc -l < "$diary")
        
        echo -n "Checking $agent_name (${line_count} lines)... "
        
        if [ $line_count -gt $MAX_LINES ]; then
            echo "needs archiving"
            
            # Create archive directory
            archive_dir="$agent_dir/archives/$ARCHIVE_DATE"
            mkdir -p "$archive_dir"
            
            # Extract wisdom before archiving
            echo "  Extracting wisdom patterns..."
            grep -E "(What I Learned|discovered|breakthrough|pattern|struggled with|Chris.*said)" "$diary" > "$archive_dir/wisdom-extract.md" 2>/dev/null || true
            
            # Calculate how many lines to archive
            lines_to_archive=$((line_count - MAX_LINES))
            
            # Archive old entries
            echo "  Archiving $lines_to_archive lines..."
            head -n $lines_to_archive "$diary" > "$archive_dir/diary-archive.md"
            
            # Keep recent entries
            tail -n $MAX_LINES "$diary" > "$diary.tmp"
            
            # Add archive header to remaining diary
            {
                echo "# 🧠 Personal Diary - $agent_name"
                echo ""
                echo "*Previous entries archived to archives/$ARCHIVE_DATE/*"
                echo ""
                cat "$diary.tmp"
            } > "$diary"
            
            rm -f "$diary.tmp"
            
            archived_count=$((archived_count + 1))
            echo "  ✅ Archived successfully"
        else
            echo "OK"
        fi
    fi
done

echo ""
echo "================================================"
echo "📊 Archive Summary:"
echo "  - Diaries checked: $checked_count"
echo "  - Diaries archived: $archived_count"
echo "  - Archive date: $ARCHIVE_DATE"
echo ""
echo "💡 Next steps:"
echo "  1. Review wisdom extracts in archives/$ARCHIVE_DATE/"
echo "  2. Consider adding key insights to CLAUDE_KNOWLEDGE.md"
echo "  3. Run Knowledge Consolidator if many insights found"
echo ""
echo "✅ Archive process complete!"