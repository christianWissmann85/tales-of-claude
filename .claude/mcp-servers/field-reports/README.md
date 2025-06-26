# Field Reports MCP Server

A powerful MCP (Model Context Protocol) server for managing field reports with advanced extraction and analysis capabilities. Designed specifically for Chris's analysis needs with 90%+ token savings.

## Features

### Core Capabilities
- **Smart Chunking**: Automatically chunks large reports into 2-3KB segments
- **Metadata Extraction**: Extracts problems, solutions, metrics from content
- **Full-Text Search**: Lightning-fast search with FTS5
- **Pattern Detection**: Identifies recurring patterns across reports
- **Token Optimization**: 90-95% reduction in token usage

### 10 Powerful API Endpoints

1. **saveReport** - Save reports with automatic extraction
2. **recallReports** - Query reports with advanced filters
3. **searchReports** - Full-text search across all content
4. **bulkExport** - Export in markdown, CSV, or JSON
5. **analyzePatterns** - Detect patterns and trends
6. **generateBundle** - Create smart bundles for analysis
7. **exportByAgent** - Export all reports for an agent
8. **exportByDate** - Export by date range with timeline
9. **exportByOutcome** - Export by success/failure
10. **getMetrics** - Comprehensive performance metrics

## Installation

```bash
cd .claude/mcp-servers/field-reports
npm install
```

## Configuration

Add to your `.mcp.json`:

```json
{
  "field-reports": {
    "command": "node",
    "args": [".claude/mcp-servers/field-reports/index.js"],
    "env": {
      "FIELD_REPORTS_DB_PATH": "./memory/field_reports.db"
    }
  }
}
```

## Usage Examples

### Save a Report
```javascript
mcp field-reports saveReport \
  --agentName="sarah-ui-visual-auditor" \
  --title="Quest Panel Visual Fix" \
  --content="..." \
  --mission="Fix quest panel rendering" \
  --status="success" \
  --metrics='{"tokens_saved": 5000}'
```

### Export by Agent
```javascript
mcp field-reports exportByAgent \
  --agentName="sarah-ui-visual-auditor" \
  --format="markdown" \
  --includeMetrics=true
```

### Generate Weekly Bundle
```javascript
mcp field-reports generateBundle \
  --bundleType="weekly" \
  --includeTimeline=true \
  --includeAnalytics=true
```

### Analyze Patterns
```javascript
mcp field-reports analyzePatterns \
  --analysisType="problems" \
  --minOccurrence=3 \
  --confidenceThreshold=0.8
```

### Bulk Export with Filters
```javascript
mcp field-reports bulkExport \
  --format="markdown" \
  --groupBy="agent" \
  --filters='{"status": "success", "dateStart": "2025-06-01"}'
```

## Chris's Special Features

### One-Click Export All
Export entire knowledge base with smart organization:
```javascript
mcp field-reports bulkExport \
  --format="markdown" \
  --groupBy="agent" \
  --includeMetrics=true \
  --generateSummary=true
```

### Timeline Visualization
Get chronological view of all reports:
```javascript
mcp field-reports exportByDate \
  --startDate="2025-06-01" \
  --endDate="2025-06-26" \
  --includeTimeline=true
```

### Failure Analysis
Analyze all failures with pattern detection:
```javascript
mcp field-reports exportByOutcome \
  --outcome="failure" \
  --includeAnalysis=true
```

### Performance Dashboard
Get comprehensive metrics:
```javascript
mcp field-reports getMetrics \
  --metricType="overview" \
  --includeCharts=true
```

## Database Schema

- **agents** - Track report authors
- **field_reports** - Main reports table
- **report_chunks** - Content chunks for efficiency
- **problems** - Extracted problems
- **solutions** - Extracted solutions
- **metrics** - Performance metrics
- **pattern_analysis** - Detected patterns
- **report_search** - FTS5 virtual table

## Token Savings

Traditional file-based approach:
- Reading 10 reports: ~12,500 tokens
- Full scan (166 reports): ~207,500 tokens

MCP field reports approach:
- Query 10 reports: ~200 tokens
- Search all reports: ~500 tokens
- Export filtered set: ~1,000 tokens

**Savings: 90-95% reduction!**

## Advanced Features

### Smart Bundling
- Groups reports by agent, date, outcome, or category
- Generates executive summaries
- Creates visual timelines
- Includes pattern analysis

### Pattern Detection
- Identifies recurring problems
- Tracks solution effectiveness
- Maps agent collaborations
- Detects trends over time

### Export Formats
- **Markdown**: Rich formatting with sections
- **CSV**: For spreadsheet analysis
- **JSON**: For programmatic processing

## For Developers

The tool uses:
- SQLite with FTS5 for search
- Smart chunking algorithm
- Pattern detection engine
- Markdown generation utilities
- Token calculation system

## Credits

Designed by Marcus (Performance & Optimization)
Implemented by Jordan (Integration & Cross-System Communication)
For Chris's analysis needs

---

*"Transform scattered reports into actionable insights with 90%+ token savings!"*