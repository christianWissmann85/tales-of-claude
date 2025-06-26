# MCP Migration Scripts

This directory contains scripts for migrating existing markdown-based data to the new MCP (Model Context Protocol) tools.

## Setup

```bash
cd .claude/scripts
npm install
```

## Usage

### Dry Run (recommended first)
```bash
npm run migrate:dry
```

### Verbose Dry Run (see all details)
```bash
npm run test
```

### Live Migration
```bash
npm run migrate
```

### With Options
```bash
node migrate-to-mcp.js --dry-run --verbose
node migrate-to-mcp.js --no-backup  # Skip backup (not recommended)
```

## What Gets Migrated

1. **Agent Diaries** → `memory/agent_diary.db`
   - All `.claude/task-agents/*/diary.md` files
   - Parsed by date/session sections
   - Emotion detection and word counting
   - Automatic chunking for large entries

2. **Field Reports** → `memory/field_reports.db`
   - All `.claude/field-test-reports/*.md` files
   - Both root and organized/ subdirectories
   - Extracts agent, date, mission, status, problem/solution

3. **Roadmap Data** → `memory/project_tracker.db`
   - Primary: `docs/Roadmap/realistic-roadmap-sessions-4-21-with-adce.md`
   - Additional roadmap files for supplementary tasks
   - Session-based organization with priorities

4. **Team Memory** → `memory/team_memory.db`
   - Key patterns from REVOLUTION docs
   - Critical lessons from field reports
   - Delegate usage patterns
   - Workflow optimizations

## Features

- **Progress Tracking**: Colored output shows migration progress
- **Error Handling**: Continues on individual file errors
- **Statistics**: Summary shows total files/entries migrated
- **Dry Run Mode**: Test migration without making changes
- **Verbose Mode**: Detailed logging for debugging

## Database Schemas

### agent_diary.db
- `agents`: Agent registry
- `entries`: Diary entries with date, content, emotion, session

### field_reports.db
- `agents`: Agent registry  
- `reports`: Field reports with mission, status, problem/solution

### project_tracker.db
- `progress`: Tasks organized by session with status tracking

### team_memory.db
- `solutions`: Key-value patterns with usage counts

## Post-Migration

After migration, the MCP tools can be used via their respective commands:
- `mcp__agent-diary__*` - Diary operations
- `mcp__field-reports__*` - Report operations
- `mcp__project-tracker__*` - Progress tracking
- `mcp__team-memory__*` - Knowledge recall

## Troubleshooting

- **Permission errors**: Ensure memory/ directory is writable
- **Missing files**: Script continues on missing files
- **Parse errors**: Check verbose output for specific issues
- **Database locked**: Close any tools using the databases