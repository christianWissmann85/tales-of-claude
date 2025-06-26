#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ReportsAPI } from './lib/reports-api.js';

// Initialize ReportsAPI with database path from environment
const dbPath = process.env.FIELD_REPORTS_DB_PATH || './memory/field_reports.db';
const reports = new ReportsAPI(dbPath);

// Create server
const server = new Server({
  name: 'field-reports',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
});

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'saveReport',
      description: 'Save a field report with automatic chunking and metadata extraction',
      inputSchema: {
        type: 'object',
        properties: {
          agentName: { type: 'string', description: 'Name of the agent filing the report' },
          title: { type: 'string', description: 'Report title' },
          content: { type: 'string', description: 'Full report content' },
          mission: { type: 'string', description: 'Mission description' },
          status: { type: 'string', description: 'Mission status (success, partial, failure)', default: 'success' },
          date: { type: 'string', description: 'Report date (YYYY-MM-DD)' },
          category: { type: 'string', description: 'Report category (bug-fix, feature, optimization, etc.)' },
          tags: { type: 'string', description: 'Comma-separated tags' },
          metrics: { type: 'object', description: 'Performance metrics (optional)' }
        },
        required: ['agentName', 'title', 'content', 'mission']
      }
    },
    {
      name: 'recallReports',
      description: 'Query specific reports with filters',
      inputSchema: {
        type: 'object',
        properties: {
          agentName: { type: 'string', description: 'Filter by agent name' },
          dateStart: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          dateEnd: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          status: { type: 'string', description: 'Filter by status' },
          category: { type: 'string', description: 'Filter by category' },
          tags: { type: 'string', description: 'Filter by tags' },
          limit: { type: 'number', description: 'Maximum results', default: 10 },
          offset: { type: 'number', description: 'Results offset', default: 0 }
        },
        required: []
      }
    },
    {
      name: 'searchReports',
      description: 'Full-text search across all field reports',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          agentFilter: { type: 'string', description: 'Filter by agent' },
          statusFilter: { type: 'string', description: 'Filter by status' },
          categoryFilter: { type: 'string', description: 'Filter by category' },
          limit: { type: 'number', description: 'Maximum results', default: 10 },
          offset: { type: 'number', description: 'Results offset', default: 0 }
        },
        required: ['query']
      }
    },
    {
      name: 'bulkExport',
      description: 'Export multiple reports in various formats',
      inputSchema: {
        type: 'object',
        properties: {
          format: { type: 'string', description: 'Export format (markdown, csv, json)', default: 'markdown' },
          filters: { type: 'object', description: 'Filter criteria (agent, date range, status, etc.)' },
          groupBy: { type: 'string', description: 'Group reports by (agent, date, status, category)' },
          includeMetrics: { type: 'boolean', description: 'Include performance metrics', default: true },
          generateSummary: { type: 'boolean', description: 'Generate executive summary', default: true }
        },
        required: ['format']
      }
    },
    {
      name: 'analyzePatterns',
      description: 'Detect patterns across field reports',
      inputSchema: {
        type: 'object',
        properties: {
          analysisType: { type: 'string', description: 'Pattern type (problems, solutions, collaborations)', default: 'all' },
          minOccurrence: { type: 'number', description: 'Minimum pattern occurrence', default: 3 },
          dateRange: { type: 'object', description: 'Date range for analysis' },
          confidenceThreshold: { type: 'number', description: 'Pattern confidence threshold (0-1)', default: 0.7 }
        },
        required: []
      }
    },
    {
      name: 'generateBundle',
      description: 'Create smart bundles of reports for Chris\'s analysis',
      inputSchema: {
        type: 'object',
        properties: {
          bundleType: { type: 'string', description: 'Bundle type (weekly, monthly, by-agent, by-success)', default: 'weekly' },
          date: { type: 'string', description: 'Target date for bundle' },
          includeTimeline: { type: 'boolean', description: 'Include visual timeline', default: true },
          includeAnalytics: { type: 'boolean', description: 'Include analytics dashboard', default: true },
          format: { type: 'string', description: 'Output format (markdown, html)', default: 'markdown' }
        },
        required: ['bundleType']
      }
    },
    {
      name: 'exportByAgent',
      description: 'Export all reports for a specific agent',
      inputSchema: {
        type: 'object',
        properties: {
          agentName: { type: 'string', description: 'Agent name to export' },
          format: { type: 'string', description: 'Export format (markdown, csv, json)', default: 'markdown' },
          includeMetrics: { type: 'boolean', description: 'Include performance metrics', default: true },
          generateSummary: { type: 'boolean', description: 'Generate agent summary', default: true }
        },
        required: ['agentName']
      }
    },
    {
      name: 'exportByDate',
      description: 'Export reports within a date range',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          format: { type: 'string', description: 'Export format', default: 'markdown' },
          groupBy: { type: 'string', description: 'Group by (day, week, agent)' },
          includeTimeline: { type: 'boolean', description: 'Include timeline view', default: true }
        },
        required: ['startDate', 'endDate']
      }
    },
    {
      name: 'exportByOutcome',
      description: 'Export reports filtered by success/failure',
      inputSchema: {
        type: 'object',
        properties: {
          outcome: { type: 'string', description: 'Outcome filter (success, partial, failure)' },
          format: { type: 'string', description: 'Export format', default: 'markdown' },
          includeAnalysis: { type: 'boolean', description: 'Include failure analysis', default: true },
          dateRange: { type: 'object', description: 'Optional date range filter' }
        },
        required: ['outcome']
      }
    },
    {
      name: 'getMetrics',
      description: 'Get performance metrics and statistics',
      inputSchema: {
        type: 'object',
        properties: {
          metricType: { type: 'string', description: 'Metric type (overview, by-agent, by-category, trends)', default: 'overview' },
          dateRange: { type: 'object', description: 'Date range for metrics' },
          format: { type: 'string', description: 'Output format (json, csv, markdown)', default: 'json' },
          includeCharts: { type: 'boolean', description: 'Include chart data', default: true }
        },
        required: []
      }
    }
  ]
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'saveReport': {
        const result = await reports.saveReport(args);
        
        return {
          content: [{
            type: 'text',
            text: `Report saved successfully!\n` +
                  `ID: ${result.reportId}\n` +
                  `Chunks: ${result.chunkCount}\n` +
                  `Extracted: ${result.extractedData ? Object.keys(result.extractedData).join(', ') : 'none'}\n` +
                  `Token savings: ${result.tokenSavings || 'N/A'}`
          }]
        };
      }
      
      case 'recallReports': {
        const results = await reports.recallReports(args);
        
        if (!results.reports || results.reports.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No reports found matching your criteria.'
            }]
          };
        }
        
        const formatted = results.reports.map(report => 
          `**${report.title}** by ${report.agent_name} (${report.report_date})\n` +
          `Status: ${report.status} | Category: ${report.category || 'none'}\n` +
          `Mission: ${report.mission}\n` +
          `${report.summary || report.content.substring(0, 200)}...\n`
        ).join('\n---\n');
        
        return {
          content: [{
            type: 'text',
            text: `Found ${results.reports.length} reports:\n\n${formatted}`
          }]
        };
      }
      
      case 'searchReports': {
        const results = await reports.searchReports(args);
        
        if (!results.results || results.results.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No reports found for query "${args.query}".`
            }]
          };
        }
        
        const formatted = results.results.map(result => 
          `**${result.title}** by ${result.agent_name} (${result.report_date})\n` +
          `Relevance: ${result.relevanceScore} | Status: ${result.status}\n` +
          `Snippet: ${result.snippet}\n`
        ).join('\n---\n');
        
        return {
          content: [{
            type: 'text',
            text: `Found ${results.results.length} reports for "${args.query}":\n\n${formatted}`
          }]
        };
      }
      
      case 'bulkExport': {
        const result = await reports.bulkExport(args);
        
        return {
          content: [{
            type: 'text',
            text: `Export completed!\n` +
                  `Format: ${result.format}\n` +
                  `Reports exported: ${result.reportCount}\n` +
                  `File size: ${result.fileSize}\n` +
                  `Groups: ${result.groupCount || 'N/A'}\n` +
                  `Token savings: ${result.tokenSavings || 'N/A'}\n\n` +
                  `${result.content.substring(0, 500)}...`
          }]
        };
      }
      
      case 'analyzePatterns': {
        const patterns = await reports.analyzePatterns(args);
        
        const formatted = patterns.patterns.map(pattern => 
          `**${pattern.type}**: ${pattern.description}\n` +
          `Occurrences: ${pattern.count} | Confidence: ${(pattern.confidence * 100).toFixed(1)}%\n` +
          `Agents: ${pattern.agents.join(', ')}\n`
        ).join('\n---\n');
        
        return {
          content: [{
            type: 'text',
            text: `Pattern Analysis Results:\n\n` +
                  `Total patterns found: ${patterns.patterns.length}\n` +
                  `Time range: ${patterns.dateRange.start} to ${patterns.dateRange.end}\n\n` +
                  formatted
          }]
        };
      }
      
      case 'generateBundle': {
        const bundle = await reports.generateBundle(args);
        
        return {
          content: [{
            type: 'text',
            text: `Bundle generated!\n` +
                  `Type: ${bundle.bundleType}\n` +
                  `Reports included: ${bundle.reportCount}\n` +
                  `Sections: ${bundle.sections.join(', ')}\n` +
                  `File size: ${bundle.fileSize}\n\n` +
                  `${bundle.preview.substring(0, 500)}...`
          }]
        };
      }
      
      case 'exportByAgent': {
        const result = await reports.exportByAgent(args);
        
        return {
          content: [{
            type: 'text',
            text: `Agent export completed!\n` +
                  `Agent: ${result.agentName}\n` +
                  `Reports: ${result.reportCount}\n` +
                  `Success rate: ${result.metrics.successRate}%\n` +
                  `Total tokens saved: ${result.metrics.totalTokensSaved || 'N/A'}\n\n` +
                  `${result.content.substring(0, 500)}...`
          }]
        };
      }
      
      case 'exportByDate': {
        const result = await reports.exportByDate(args);
        
        return {
          content: [{
            type: 'text',
            text: `Date range export completed!\n` +
                  `Period: ${result.startDate} to ${result.endDate}\n` +
                  `Reports: ${result.reportCount}\n` +
                  `Groups: ${result.groupCount || 'N/A'}\n` +
                  `Timeline included: ${result.includesTimeline ? 'Yes' : 'No'}\n\n` +
                  `${result.content.substring(0, 500)}...`
          }]
        };
      }
      
      case 'exportByOutcome': {
        const result = await reports.exportByOutcome(args);
        
        return {
          content: [{
            type: 'text',
            text: `Outcome export completed!\n` +
                  `Outcome filter: ${result.outcome}\n` +
                  `Reports: ${result.reportCount}\n` +
                  `Common patterns: ${result.commonPatterns ? result.commonPatterns.length : 0}\n\n` +
                  `${result.content.substring(0, 500)}...`
          }]
        };
      }
      
      case 'getMetrics': {
        const metrics = await reports.getMetrics(args);
        
        let formatted = '';
        if (args.metricType === 'overview') {
          formatted = `Total reports: ${metrics.totalReports}\n` +
                     `Success rate: ${metrics.successRate}%\n` +
                     `Active agents: ${metrics.activeAgents}\n` +
                     `Total tokens saved: ${metrics.totalTokensSaved || 'N/A'}\n` +
                     `Most productive agent: ${metrics.topAgent}`;
        } else {
          formatted = JSON.stringify(metrics, null, 2);
        }
        
        return {
          content: [{
            type: 'text',
            text: `Metrics (${args.metricType}):\n\n${formatted}`
          }]
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error in ${name}:`, error);
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }]
    };
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Field Reports MCP server running...');