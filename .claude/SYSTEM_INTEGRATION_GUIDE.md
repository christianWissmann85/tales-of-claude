# 🔗 System Integration Guide

*How all memory and documentation systems work together*

## Overview

Our memory and documentation systems form an interconnected web. This guide shows how each piece connects and provides clear workflows for using the complete system.

## The Four Pillars

### 1. Personal Memory (Diaries)
- **Location**: `.claude/task-agents/[your-name]/diary.md`
- **Purpose**: Personal experiences and learning
- **Updated**: After each deployment
- **Connects to**: Field reports, other diaries

### 2. Technical Documentation (Field Reports)  
- **Location**: `.claude/field-test-reports/[name]-[date].md`
- **Purpose**: Technical solutions and metrics
- **Updated**: After each task
- **Connects to**: Knowledge base, future agents

### 3. Collective Intelligence (CLAUDE_KNOWLEDGE.md)
- **Location**: `REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md`
- **Purpose**: Consolidated wisdom from all agents
- **Updated**: Every 3-4 agents by Knowledge Consolidator
- **Connects to**: All agents read this

### 4. Operational Guides (Manuals)
- **Location**: `REVOLUTION/` directory
- **Purpose**: How-to guides and patterns
- **Updated**: When new patterns emerge
- **Connects to**: Agent workflows

## How They Work Together

```
Your Task
    ↓
Read Diary → Remember past experiences
    ↓
Read CLAUDE_KNOWLEDGE → Learn from others
    ↓
Do Work → Apply combined wisdom
    ↓
Write Field Report → Share technical details
    ↓
Update Diary → Record personal insights
    ↓
Knowledge Consolidator → Updates CLAUDE_KNOWLEDGE
    ↓
Next Agent Benefits → Cycle continues
```

## Standard Workflow for Task Agents

### 1. Starting Your Task
```bash
# First, read your operational guides
Read REVOLUTION/06-claude-task-agent-manual-v2.md

# Then check your personal memory
Read .claude/task-agents/[your-role-name]/diary.md

# Review collective knowledge
Read REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md (Sections relevant to your task)

# Check recent related field reports
ls -la .claude/field-test-reports/ | grep -i [relevant-keyword]
```

### 2. During Your Task

#### Referencing Other Agents' Work
```markdown
# In your diary or report:
"Building on Ivan's discovery (diary 2025-06-24) about 50% opacity..."
"Applied Grace's delegate recursion pattern (field report 2025-06-22)..."
```

#### Attaching Context for Delegate
```bash
# ALWAYS attach relevant files when using delegate
delegate_invoke(
  prompt="Your prompt here",
  files=[
    "current-file.ts",           # What you're working on
    "related-types.ts",          # Type definitions
    "../reports/similar-fix.md", # Previous solution
    "error-log.txt"             # Current problem
  ]
)
```

### 3. After Your Task

#### Write Field Report
```bash
# Create your technical report
Write .claude/field-test-reports/[your-name]-[role]-2025-06-25.md

# Include:
- What worked/didn't work
- Token savings
- Code examples
- Tips for future agents
```

#### Update Your Diary
```bash
# Add personal entry to your diary
Edit .claude/task-agents/[your-role-name]/diary.md

# Include:
- Personal reflections
- What you learned
- References to others' work
- Notes for your future self
```

## Cross-Reference Patterns

### Diary → Field Report
```markdown
### 2025-06-25 - Deployment #3
See my full technical solution in field report: nina-integration-2025-06-25.md
```

### Field Report → Diary
```markdown
## Personal Notes
For my learning journey and struggles with this, see my diary entry 2025-06-25.
```

### Agent → Agent
```markdown
# Reference specific insights
"Ivan (diary 2025-06-24): 'Floor tiles at 50% opacity'"
"Grace (report 2025-06-22): 'Delegate recursion pattern'"
```

## Documentation Loading Guide

### For Different Agent Roles

#### Bug Fixers
- Load: debugging sections of CLAUDE_KNOWLEDGE
- Skip: architecture guides, UI guidelines
- Focus: Problem→Solution entries

#### Visual/UI Agents  
- Load: UI guidelines, screenshot guide
- Skip: backend patterns, test infrastructure
- Focus: Visual hierarchy tips

#### Test Writers
- Load: test infrastructure, automation patterns
- Skip: UI guidelines, game design docs
- Focus: Testing best practices

#### Team Leads
- Load: orchestration patterns, workflow guides
- Skip: ALL coding documentation
- Focus: Coordination and planning

## Diary Management

### Keeping Diaries Lean
When diary exceeds 500 lines:
```bash
# Archive old entries (monthly)
mkdir -p .claude/task-agents/[your-name]/archives/2025-06
head -n -500 diary.md > archives/2025-06/diary-archive.md
tail -n 500 diary.md > diary.tmp && mv diary.tmp diary.md
```

### Extracting Wisdom Before Archiving
```bash
# Save key insights
grep -E "(learned|discovered|breakthrough|pattern)" diary.md > wisdom-extract.md
# Add to next Knowledge Consolidator run
```

## Best Practices

### 1. Always Cross-Reference
- Your diary should mention field reports
- Field reports should reference relevant diaries
- Both should cite CLAUDE_KNOWLEDGE when building on it

### 2. Strategic File Attachment
```bash
# Good: Attach all context
files=["current.ts", "types.ts", "similar-solution.md", "error.log"]

# Bad: Just describe the problem
prompt="Fix the type error in the game engine"
```

### 3. Progressive Documentation
- Start with minimum viable docs
- Add complexity as needed
- Always prioritize clarity over completeness

### 4. Memory Hierarchy
1. Personal diary: Your unique experiences
2. Field reports: Technical solutions
3. Knowledge base: Proven patterns
4. Manuals: Operational procedures

## Automation Scripts

### archive-diaries.sh
```bash
#!/bin/bash
# Run monthly to archive old diary entries
# Usage: ./scripts/archive-diaries.sh

ARCHIVE_DATE=$(date +%Y-%m)
for diary in .claude/task-agents/*/diary.md; do
  if [ $(wc -l < "$diary") -gt 500 ]; then
    # Archive logic here
  fi
done
```

### extract-knowledge.sh
```bash
#!/bin/bash  
# Extract insights from recent field reports
# Usage: ./scripts/extract-knowledge.sh

find .claude/field-test-reports -name "*.md" -mtime -7 | while read report; do
  grep -E "(discovered|breakthrough|saves.*tokens)" "$report"
done > knowledge-extract.tmp
```

## Troubleshooting

### "Can't find relevant documentation"
1. Check CLAUDE_KNOWLEDGE.md table of contents
2. Search field reports: `grep -r "keyword" .claude/field-test-reports/`
3. Ask in your diary - future you might help!

### "Diary getting too long"
1. Run archive script
2. Extract wisdom first
3. Keep only recent 20-25 entries

### "Not sure what to attach to delegate"
1. Current file you're modifying
2. Related type definitions
3. Similar solutions from reports
4. Error messages or logs
5. When in doubt, over-include!

## The Golden Rules

1. **Read before you write** - Check existing knowledge
2. **Connect, don't isolate** - Reference others' work  
3. **Document for your future self** - You'll redeploy
4. **Share struggles and victories** - Both teach
5. **Keep it simple** - Complex systems fail

## Quick Reference Card

```bash
# Start of task
cat .claude/task-agents/[my-name]/diary.md
grep -A5 "relevant-topic" REVOLUTION/knowledge/CLAUDE_KNOWLEDGE.md

# During task  
delegate_invoke(files=["all", "relevant", "context"])

# End of task
echo "## Entry Title" >> .claude/task-agents/[my-name]/diary.md
write .claude/field-test-reports/[name]-[date].md

# Monthly maintenance
./scripts/archive-diaries.sh
```

---

*"Integration isn't about perfection - it's about connection."*

**Remember**: The system serves you, not the other way around. Use what helps, adapt what doesn't, and always keep building on our collective intelligence!