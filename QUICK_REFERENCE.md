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
