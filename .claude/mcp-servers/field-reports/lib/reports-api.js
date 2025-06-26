import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ReportsAPI {
  constructor(dbPath = './data/field_reports.db') {
    this.dbPath = dbPath;
    this.db = null;
    this.init();
  }

  init() {
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize database
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 10000');
    this.db.pragma('foreign_keys = ON');

    // Load schema
    this.initializeSchema();
    this.prepareStatements();
  }

  initializeSchema() {
    // Check if schema is already initialized
    const tableExists = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='agents'"
    ).get();
    
    if (!tableExists) {
      const schemaPath = path.join(__dirname, '../schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        this.db.exec(schema);
      } else {
        throw new Error('Database schema file not found');
      }
    }
  }

  prepareStatements() {
    this.stmts = {
      // Agent operations
      getAgent: this.db.prepare('SELECT * FROM agents WHERE name = ?'),
      createAgent: this.db.prepare(`
        INSERT INTO agents (name, description, is_active, metadata)
        VALUES (?, ?, ?, ?)
      `),

      // Report operations
      createReport: this.db.prepare(`
        INSERT INTO field_reports (agent_id, title, mission, report_date, status, category, tags, priority, word_count, chunk_count, has_metrics, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),

      getReports: this.db.prepare(`
        SELECT fr.*, a.name as agent_name
        FROM field_reports fr
        JOIN agents a ON fr.agent_id = a.id
        ORDER BY fr.report_date DESC, fr.created_at DESC
        LIMIT ? OFFSET ?
      `),

      getReportsByAgent: this.db.prepare(`
        SELECT fr.*, a.name as agent_name
        FROM field_reports fr
        JOIN agents a ON fr.agent_id = a.id
        WHERE a.name = ?
        ORDER BY fr.report_date DESC
        LIMIT ? OFFSET ?
      `),

      getReportsWithFilters: this.db.prepare(`
        SELECT fr.*, a.name as agent_name
        FROM field_reports fr
        JOIN agents a ON fr.agent_id = a.id
        WHERE fr.report_date BETWEEN ? AND ?
        ORDER BY fr.report_date DESC
        LIMIT ? OFFSET ?
      `),

      // Chunk operations
      insertChunk: this.db.prepare(`
        INSERT INTO report_chunks (report_id, chunk_order, content, char_count, section_type)
        VALUES (?, ?, ?, ?, ?)
      `),

      getChunks: this.db.prepare(`
        SELECT * FROM report_chunks
        WHERE report_id = ?
        ORDER BY chunk_order ASC
      `),

      // Search operations
      searchReports: this.db.prepare(`
        SELECT fr.id, fr.title, fr.report_date, fr.status, fr.category,
               a.name as agent_name, rs.content as snippet
        FROM report_search rs
        JOIN report_chunks rc ON rs.rowid = rc.id
        JOIN field_reports fr ON rc.report_id = fr.id
        JOIN agents a ON fr.agent_id = a.id
        WHERE report_search MATCH ?
        ORDER BY bm25(report_search) ASC
        LIMIT ? OFFSET ?
      `),

      // Metrics operations
      insertMetric: this.db.prepare(`
        INSERT INTO metrics (report_id, metric_type, metric_value, metric_unit, context)
        VALUES (?, ?, ?, ?, ?)
      `),

      getMetrics: this.db.prepare(`
        SELECT * FROM metrics WHERE report_id = ?
      `),

      getOverallMetrics: this.db.prepare(`
        SELECT 
          COUNT(DISTINCT fr.id) as total_reports,
          COUNT(DISTINCT fr.agent_id) as active_agents,
          SUM(CASE WHEN fr.status = 'success' THEN 1 ELSE 0 END) as success_count,
          COUNT(fr.id) as total_count,
          SUM(m.metric_value) as total_tokens_saved
        FROM field_reports fr
        LEFT JOIN metrics m ON fr.id = m.report_id AND m.metric_type = 'tokens_saved'
        WHERE fr.report_date BETWEEN ? AND ?
      `),

      // Problem/Solution operations
      insertProblem: this.db.prepare(`
        INSERT INTO problems (report_id, problem_description, severity, category)
        VALUES (?, ?, ?, ?)
      `),

      insertSolution: this.db.prepare(`
        INSERT INTO solutions (report_id, problem_id, solution_description, effectiveness)
        VALUES (?, ?, ?, ?)
      `),

      getProblems: this.db.prepare(`
        SELECT * FROM problems WHERE report_id = ?
      `),

      getSolutions: this.db.prepare(`
        SELECT * FROM solutions WHERE report_id = ?
      `),

      // Pattern operations
      getPatterns: this.db.prepare(`
        SELECT * FROM pattern_analysis
        WHERE confidence >= ?
        ORDER BY occurrence_count DESC, confidence DESC
        LIMIT ?
      `),

      updatePattern: this.db.prepare(`
        INSERT INTO pattern_analysis (pattern_type, pattern_description, occurrence_count, confidence, agents_involved, first_seen, last_seen)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(pattern_type, pattern_description) DO UPDATE SET
          occurrence_count = occurrence_count + 1,
          confidence = ?,
          agents_involved = ?,
          last_seen = ?
      `),

      // Relationship operations
      createRelationship: this.db.prepare(`
        INSERT INTO report_relationships (from_report_id, to_report_id, relationship_type, description)
        VALUES (?, ?, ?, ?)
      `)
    };
  }

  // API Method 1: Save report with automatic chunking and extraction
  async saveReport(reportData) {
    const transaction = this.db.transaction(() => {
      try {
        const {
          agentName,
          title,
          content,
          mission,
          status = 'success',
          date = new Date().toISOString().split('T')[0],
          category = 'general',
          tags = '',
          metrics = null
        } = reportData || {};

        if (!title || !content || !mission) {
          throw new Error('Title, content, and mission are required');
        }

        // Ensure agent exists
        if (!agentName) {
          throw new Error('Agent name is required');
        }
        const agent = this.ensureAgent(agentName);

        // Create report record
        const wordCount = content.split(/\s+/).length;
        const reportResult = this.stmts.createReport.run(
          agent.id,
          title,
          mission,
          date,
          status,
          category,
          tags,
          'normal',
          wordCount,
          0, // Will be updated after chunking
          metrics && typeof metrics === 'object' && Object.keys(metrics).length > 0 ? 1 : 0,
          JSON.stringify({ original_size: content.length })
        );

        const reportId = reportResult.lastInsertRowid;

        // Chunk the content
        const chunks = this.chunkContent(content, {
          targetSize: 2500,
          maxSize: 3500,
          preserveSections: true
        });

        // Insert chunks
        chunks.forEach((chunk, index) => {
          this.stmts.insertChunk.run(
            reportId,
            index + 1,
            chunk.content,
            chunk.size,
            chunk.sectionType || 'content'
          );
        });

        // Extract and store metrics
        if (metrics && typeof metrics === 'object' && Object.keys(metrics).length > 0) {
          this.extractAndStoreMetrics(reportId, metrics, content);
        }

        // Extract problems and solutions
        const problems = this.extractProblems(content);
        const solutions = this.extractSolutions(content);
        
        problems.forEach(problem => {
          const result = this.stmts.insertProblem.run(
            reportId,
            problem.description,
            problem.severity || 'medium',
            problem.category || category
          );
          
          // Link solutions to problems
          const problemId = result.lastInsertRowid;
          solutions.filter(s => s.relatedTo === problem.description).forEach(solution => {
            this.stmts.insertSolution.run(
              reportId,
              problemId,
              solution.description,
              solution.effectiveness || 'effective'
            );
          });
        });

        // Detect patterns
        this.detectAndUpdatePatterns(reportId, content, agentName);

        // Find related reports
        this.findAndLinkRelatedReports(reportId, content, agent.id);

        // Calculate token savings
        const tokenSavings = this.calculateTokenSavings(content, chunks.length);

        return {
          success: true,
          reportId,
          chunkCount: chunks.length,
          extractedData: {
            problems: problems.length,
            solutions: solutions.length,
            metrics: metrics && typeof metrics === 'object' ? Object.keys(metrics).length : 0
          },
          tokenSavings
        };

      } catch (error) {
        throw new Error(`Failed to save report: ${error.message}`);
      }
    });

    return transaction();
  }

  // API Method 2: Recall reports with filters
  async recallReports(options = {}) {
    try {
      const {
        agentName,
        dateStart = '2020-01-01',
        dateEnd = new Date().toISOString().split('T')[0],
        status,
        category,
        tags,
        limit = 10,
        offset = 0,
        includeContent = true
      } = options;

      let reports;
      
      if (agentName) {
        reports = this.stmts.getReportsByAgent.all(agentName, limit, offset);
      } else {
        reports = this.stmts.getReportsWithFilters.all(
          dateStart, dateEnd, limit, offset
        );
      }

      // Apply additional filters
      if (status) {
        reports = reports.filter(r => r.status === status);
      }
      if (category) {
        reports = reports.filter(r => r.category === category);
      }
      if (tags) {
        const tagList = tags.split(',').map(t => t.trim().toLowerCase());
        reports = reports.filter(r => 
          tagList.some(tag => r.tags && r.tags.toLowerCase().includes(tag))
        );
      }

      // Add content and metrics if requested
      if (includeContent) {
        reports = reports.map(report => {
          const chunks = this.stmts.getChunks.all(report.id);
          const content = chunks.map(c => c.content).join('');
          const metrics = this.stmts.getMetrics.all(report.id);
          
          return {
            ...report,
            content,
            summary: content.substring(0, 200) + '...',
            metrics: metrics.reduce((acc, m) => {
              acc[m.metric_type] = { value: m.metric_value, unit: m.metric_unit };
              return acc;
            }, {})
          };
        });
      }

      return {
        reports,
        total: reports.length,
        hasMore: reports.length === limit
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to recall reports: ${error.message}`,
        reports: []
      };
    }
  }

  // API Method 3: Full-text search
  async searchReports(searchOptions = {}) {
    try {
      const {
        query,
        agentFilter,
        statusFilter,
        categoryFilter,
        limit = 20,
        offset = 0
      } = searchOptions;

      if (!query) {
        throw new Error('Search query is required');
      }

      const searchResults = this.stmts.searchReports.all(query, limit * 2, offset);

      let results = searchResults.map(result => {
        const chunks = this.stmts.getChunks.all(result.id);
        const fullContent = chunks.map(c => c.content).join('');
        
        return {
          reportId: result.id,
          title: result.title,
          agent_name: result.agent_name,
          report_date: result.report_date,
          status: result.status,
          category: result.category,
          snippet: this.extractSnippet(fullContent, query),
          relevanceScore: this.calculateRelevanceScore(result, query)
        };
      });

      // Apply filters
      if (agentFilter) {
        results = results.filter(r => r.agent_name === agentFilter);
      }
      if (statusFilter) {
        results = results.filter(r => r.status === statusFilter);
      }
      if (categoryFilter) {
        results = results.filter(r => r.category === categoryFilter);
      }

      // Sort by relevance and limit
      results = results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      return {
        results,
        query,
        total: results.length,
        hasMore: results.length === limit
      };

    } catch (error) {
      return {
        success: false,
        error: `Search failed: ${error.message}`,
        results: []
      };
    }
  }

  // API Method 4: Bulk export
  async bulkExport(exportOptions = {}) {
    try {
      const {
        format = 'markdown',
        filters = {},
        groupBy,
        includeMetrics = true,
        generateSummary = true
      } = exportOptions;

      // Get reports based on filters
      const reports = await this.recallReports({
        ...filters,
        limit: 1000,
        includeContent: true
      });

      let content = '';
      let groupedReports = {};

      // Group reports if requested
      if (groupBy) {
        reports.reports.forEach(report => {
          const key = report[groupBy] || 'other';
          if (!groupedReports[key]) {
            groupedReports[key] = [];
          }
          groupedReports[key].push(report);
        });
      } else {
        groupedReports['all'] = reports.reports;
      }

      // Format based on type
      switch (format) {
        case 'markdown':
          content = this.formatMarkdownExport(groupedReports, {
            includeMetrics,
            generateSummary
          });
          break;
        case 'csv':
          content = this.formatCSVExport(reports.reports);
          break;
        case 'json':
          content = JSON.stringify(groupedReports, null, 2);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      const tokenSavings = this.calculateBulkTokenSavings(reports.reports);

      return {
        success: true,
        format,
        reportCount: reports.reports.length,
        groupCount: Object.keys(groupedReports).length,
        fileSize: `${(content.length / 1024).toFixed(2)}KB`,
        tokenSavings,
        content
      };

    } catch (error) {
      return {
        success: false,
        error: `Export failed: ${error.message}`
      };
    }
  }

  // API Method 5: Analyze patterns
  async analyzePatterns(analysisOptions = {}) {
    try {
      const {
        analysisType = 'all',
        minOccurrence = 3,
        dateRange = {},
        confidenceThreshold = 0.7
      } = analysisOptions;

      const patterns = this.stmts.getPatterns.all(
        confidenceThreshold,
        100
      );

      // Filter by analysis type
      let filteredPatterns = patterns;
      if (analysisType !== 'all') {
        filteredPatterns = patterns.filter(p => p.pattern_type === analysisType);
      }

      // Filter by occurrence
      filteredPatterns = filteredPatterns.filter(p => p.occurrence_count >= minOccurrence);

      // Enhance with additional analysis
      const enhancedPatterns = filteredPatterns.map(pattern => ({
        type: pattern.pattern_type,
        description: pattern.pattern_description,
        count: pattern.occurrence_count,
        confidence: pattern.confidence,
        agents: pattern.agents_involved ? pattern.agents_involved.split(',') : [],
        firstSeen: pattern.first_seen,
        lastSeen: pattern.last_seen,
        trend: this.calculatePatternTrend(pattern)
      }));

      return {
        success: true,
        patterns: enhancedPatterns,
        dateRange: {
          start: dateRange.start || '2020-01-01',
          end: dateRange.end || new Date().toISOString().split('T')[0]
        },
        analysisType
      };

    } catch (error) {
      return {
        success: false,
        error: `Pattern analysis failed: ${error.message}`,
        patterns: []
      };
    }
  }

  // API Method 6: Generate bundle
  async generateBundle(bundleOptions = {}) {
    try {
      const {
        bundleType = 'weekly',
        date = new Date().toISOString().split('T')[0],
        includeTimeline = true,
        includeAnalytics = true,
        format = 'markdown'
      } = bundleOptions;

      // Calculate date range based on bundle type
      const dateRange = this.calculateDateRange(bundleType, date);

      // Get all reports for the period
      const reports = await this.recallReports({
        dateStart: dateRange.start,
        dateEnd: dateRange.end,
        limit: 1000,
        includeContent: true
      });

      // Get patterns for the period
      const patterns = await this.analyzePatterns({
        dateRange,
        minOccurrence: 2
      });

      // Get metrics
      const metrics = await this.getMetrics({
        metricType: 'overview',
        dateRange
      });

      // Build bundle content
      let sections = ['overview', 'reports'];
      let bundleContent = '';

      if (format === 'markdown') {
        bundleContent = `# Field Reports Bundle: ${bundleType}\n`;
        bundleContent += `**Period**: ${dateRange.start} to ${dateRange.end}\n\n`;

        // Overview section
        bundleContent += `## Overview\n`;
        bundleContent += `- Total Reports: ${reports.reports.length}\n`;
        bundleContent += `- Success Rate: ${metrics.successRate}%\n`;
        bundleContent += `- Active Agents: ${metrics.activeAgents}\n\n`;

        // Timeline section
        if (includeTimeline) {
          sections.push('timeline');
          bundleContent += `## Timeline\n`;
          bundleContent += this.generateTimeline(reports.reports);
          bundleContent += '\n\n';
        }

        // Analytics section
        if (includeAnalytics) {
          sections.push('analytics');
          bundleContent += `## Analytics\n`;
          bundleContent += this.generateAnalytics(reports.reports, patterns.patterns);
          bundleContent += '\n\n';
        }

        // Reports section
        bundleContent += `## Reports\n`;
        reports.reports.forEach(report => {
          bundleContent += `### ${report.title}\n`;
          bundleContent += `**Agent**: ${report.agent_name} | **Date**: ${report.report_date} | **Status**: ${report.status}\n\n`;
          bundleContent += report.summary + '\n\n';
        });
      }

      return {
        success: true,
        bundleType,
        reportCount: reports.reports.length,
        sections,
        fileSize: `${(bundleContent.length / 1024).toFixed(2)}KB`,
        preview: bundleContent.substring(0, 500),
        content: bundleContent
      };

    } catch (error) {
      return {
        success: false,
        error: `Bundle generation failed: ${error.message}`
      };
    }
  }

  // API Method 7: Export by agent
  async exportByAgent(exportOptions = {}) {
    try {
      const {
        agentName,
        format = 'markdown',
        includeMetrics = true,
        generateSummary = true
      } = exportOptions;

      if (!agentName) {
        throw new Error('Agent name is required');
      }

      // Get all reports for the agent
      const reports = await this.recallReports({
        agentName,
        limit: 1000,
        includeContent: true
      });

      // Calculate agent-specific metrics
      const successCount = reports.reports.filter(r => r.status === 'success').length;
      const successRate = reports.reports.length > 0 
        ? Math.round((successCount / reports.reports.length) * 100)
        : 0;

      const totalTokensSaved = reports.reports.reduce((sum, report) => {
        const tokenMetric = report.metrics?.tokens_saved;
        return sum + (tokenMetric?.value || 0);
      }, 0);

      let content = '';

      if (format === 'markdown') {
        content = `# Agent Report: ${agentName}\n\n`;
        
        if (generateSummary) {
          content += `## Summary\n`;
          content += `- Total Reports: ${reports.reports.length}\n`;
          content += `- Success Rate: ${successRate}%\n`;
          content += `- Total Tokens Saved: ${totalTokensSaved.toLocaleString()}\n\n`;
        }

        if (includeMetrics) {
          content += `## Performance Metrics\n`;
          content += this.generateAgentMetrics(reports.reports);
          content += '\n\n';
        }

        content += `## All Reports\n\n`;
        reports.reports.forEach(report => {
          content += `### ${report.title} (${report.report_date})\n`;
          content += `**Status**: ${report.status} | **Category**: ${report.category}\n`;
          content += `**Mission**: ${report.mission}\n\n`;
          content += report.content + '\n\n---\n\n';
        });
      } else if (format === 'csv') {
        content = this.formatCSVExport(reports.reports);
      } else if (format === 'json') {
        content = JSON.stringify({
          agent: agentName,
          metrics: {
            totalReports: reports.reports.length,
            successRate,
            totalTokensSaved
          },
          reports: reports.reports
        }, null, 2);
      }

      return {
        success: true,
        agentName,
        reportCount: reports.reports.length,
        metrics: {
          successRate,
          totalTokensSaved
        },
        content
      };

    } catch (error) {
      return {
        success: false,
        error: `Agent export failed: ${error.message}`
      };
    }
  }

  // API Method 8: Export by date
  async exportByDate(exportOptions = {}) {
    try {
      const {
        startDate,
        endDate,
        format = 'markdown',
        groupBy = 'day',
        includeTimeline = true
      } = exportOptions;

      if (!startDate || !endDate) {
        throw new Error('Start and end dates are required');
      }

      const reports = await this.recallReports({
        dateStart: startDate,
        dateEnd: endDate,
        limit: 1000,
        includeContent: true
      });

      // Group reports by specified period
      const groupedReports = this.groupReportsByPeriod(reports.reports, groupBy);

      let content = '';

      if (format === 'markdown') {
        content = `# Reports: ${startDate} to ${endDate}\n\n`;
        
        if (includeTimeline) {
          content += `## Timeline\n`;
          content += this.generateTimeline(reports.reports);
          content += '\n\n';
        }

        content += `## Reports by ${groupBy}\n\n`;
        
        Object.entries(groupedReports).forEach(([period, periodReports]) => {
          content += `### ${period}\n`;
          content += `Reports: ${periodReports.length}\n\n`;
          
          periodReports.forEach(report => {
            content += `- **${report.title}** (${report.agent_name}) - ${report.status}\n`;
          });
          content += '\n';
        });
      }

      return {
        success: true,
        startDate,
        endDate,
        reportCount: reports.reports.length,
        groupCount: Object.keys(groupedReports).length,
        includesTimeline: includeTimeline,
        content
      };

    } catch (error) {
      return {
        success: false,
        error: `Date export failed: ${error.message}`
      };
    }
  }

  // API Method 9: Export by outcome
  async exportByOutcome(exportOptions = {}) {
    try {
      const {
        outcome,
        format = 'markdown',
        includeAnalysis = true,
        dateRange = {}
      } = exportOptions;

      if (!outcome) {
        throw new Error('Outcome is required');
      }

      const reports = await this.recallReports({
        status: outcome,
        dateStart: dateRange.start,
        dateEnd: dateRange.end,
        limit: 1000,
        includeContent: true
      });

      // Analyze common patterns for this outcome
      let commonPatterns = [];
      if (includeAnalysis && outcome === 'failure') {
        const problems = [];
        reports.reports.forEach(report => {
          const reportProblems = this.stmts.getProblems.all(report.id);
          problems.push(...reportProblems);
        });
        
        // Find common problems
        const problemCounts = {};
        problems.forEach(problem => {
          const key = problem.category + ':' + problem.severity;
          problemCounts[key] = (problemCounts[key] || 0) + 1;
        });
        
        commonPatterns = Object.entries(problemCounts)
          .filter(([_, count]) => count > 1)
          .map(([key, count]) => ({
            pattern: key,
            occurrences: count
          }))
          .sort((a, b) => b.occurrences - a.occurrences);
      }

      let content = '';

      if (format === 'markdown') {
        content = `# ${outcome.charAt(0).toUpperCase() + outcome.slice(1)} Reports\n\n`;
        content += `Total: ${reports.reports.length}\n\n`;

        if (includeAnalysis && commonPatterns.length > 0) {
          content += `## Common Patterns\n`;
          commonPatterns.forEach(pattern => {
            content += `- ${pattern.pattern}: ${pattern.occurrences} occurrences\n`;
          });
          content += '\n\n';
        }

        content += `## Reports\n\n`;
        reports.reports.forEach(report => {
          content += `### ${report.title}\n`;
          content += `**Agent**: ${report.agent_name} | **Date**: ${report.report_date}\n`;
          content += `**Mission**: ${report.mission}\n\n`;
          
          if (outcome === 'failure') {
            const problems = this.stmts.getProblems.all(report.id);
            if (problems.length > 0) {
              content += `**Problems**:\n`;
              problems.forEach(problem => {
                content += `- ${problem.problem_description} (${problem.severity})\n`;
              });
              content += '\n';
            }
          }
          
          content += report.summary + '\n\n---\n\n';
        });
      }

      return {
        success: true,
        outcome,
        reportCount: reports.reports.length,
        commonPatterns,
        content
      };

    } catch (error) {
      return {
        success: false,
        error: `Outcome export failed: ${error.message}`
      };
    }
  }

  // API Method 10: Get metrics
  async getMetrics(metricOptions = {}) {
    try {
      const {
        metricType = 'overview',
        dateRange = {},
        format = 'json',
        includeCharts = true
      } = metricOptions;

      const startDate = dateRange.start || '2020-01-01';
      const endDate = dateRange.end || new Date().toISOString().split('T')[0];

      let metrics = {};

      switch (metricType) {
        case 'overview': {
          const result = this.stmts.getOverallMetrics.get(startDate, endDate);
          const successRate = result.total_count > 0
            ? Math.round((result.success_count / result.total_count) * 100)
            : 0;

          metrics = {
            totalReports: result.total_reports,
            successRate,
            activeAgents: result.active_agents,
            totalTokensSaved: result.total_tokens_saved || 0,
            topAgent: this.getTopAgent(startDate, endDate)
          };
          break;
        }
        
        case 'by-agent': {
          metrics = this.getAgentMetrics(startDate, endDate);
          break;
        }
        
        case 'by-category': {
          metrics = this.getCategoryMetrics(startDate, endDate);
          break;
        }
        
        case 'trends': {
          metrics = this.getTrendMetrics(startDate, endDate);
          break;
        }
      }

      if (format === 'csv') {
        return {
          success: true,
          content: this.formatMetricsAsCSV(metrics, metricType)
        };
      } else if (format === 'markdown') {
        return {
          success: true,
          content: this.formatMetricsAsMarkdown(metrics, metricType, includeCharts)
        };
      }

      return metrics;

    } catch (error) {
      return {
        success: false,
        error: `Metrics calculation failed: ${error.message}`
      };
    }
  }

  // Helper methods

  ensureAgent(agentName) {
    let agent = this.stmts.getAgent.get(agentName);
    
    if (!agent) {
      const result = this.stmts.createAgent.run(
        agentName,
        `Agent ${agentName}`,
        1,
        JSON.stringify({ autoCreated: true })
      );
      
      agent = {
        id: result.lastInsertRowid,
        name: agentName
      };
    }
    
    return agent;
  }

  chunkContent(content, options = {}) {
    const { targetSize = 2500, maxSize = 3500, preserveSections = true } = options;
    const chunks = [];
    
    if (preserveSections) {
      // Split by common section markers
      const sections = content.split(/(?=^#{1,3}\s)/m);
      
      sections.forEach(section => {
        if (section.length <= maxSize) {
          chunks.push({
            content: section,
            size: section.length,
            sectionType: this.detectSectionType(section)
          });
        } else {
          // Further split large sections
          const words = section.split(/\s+/);
          let currentChunk = '';
          
          words.forEach(word => {
            if ((currentChunk + ' ' + word).length <= targetSize) {
              currentChunk += (currentChunk ? ' ' : '') + word;
            } else {
              if (currentChunk) {
                chunks.push({
                  content: currentChunk,
                  size: currentChunk.length,
                  sectionType: 'content'
                });
              }
              currentChunk = word;
            }
          });
          
          if (currentChunk) {
            chunks.push({
              content: currentChunk,
              size: currentChunk.length,
              sectionType: 'content'
            });
          }
        }
      });
    } else {
      // Simple chunking by size
      const words = content.split(/\s+/);
      let currentChunk = '';
      
      words.forEach(word => {
        if ((currentChunk + ' ' + word).length <= targetSize) {
          currentChunk += (currentChunk ? ' ' : '') + word;
        } else {
          chunks.push({
            content: currentChunk,
            size: currentChunk.length,
            sectionType: 'content'
          });
          currentChunk = word;
        }
      });
      
      if (currentChunk) {
        chunks.push({
          content: currentChunk,
          size: currentChunk.length,
          sectionType: 'content'
        });
      }
    }
    
    return chunks;
  }

  detectSectionType(content) {
    const firstLine = content.split('\n')[0].toLowerCase();
    
    if (firstLine.includes('summary') || firstLine.includes('executive')) return 'summary';
    if (firstLine.includes('problem') || firstLine.includes('issue')) return 'problems';
    if (firstLine.includes('solution') || firstLine.includes('fix')) return 'solutions';
    if (firstLine.includes('metric') || firstLine.includes('performance')) return 'metrics';
    if (firstLine.includes('conclusion') || firstLine.includes('result')) return 'conclusion';
    
    return 'content';
  }

  extractProblems(content) {
    const problems = [];
    const problemPatterns = [
      /problem[s]?:\s*([^\n]+)/gi,
      /issue[s]?:\s*([^\n]+)/gi,
      /bug[s]?:\s*([^\n]+)/gi,
      /error[s]?:\s*([^\n]+)/gi
    ];
    
    problemPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        problems.push({
          description: match[1].trim(),
          severity: this.detectSeverity(match[1]),
          category: this.detectProblemCategory(match[1])
        });
      }
    });
    
    return problems;
  }

  extractSolutions(content) {
    const solutions = [];
    const solutionPatterns = [
      /solution[s]?:\s*([^\n]+)/gi,
      /fix(?:ed)?:\s*([^\n]+)/gi,
      /resolved?:\s*([^\n]+)/gi,
      /implemented:\s*([^\n]+)/gi
    ];
    
    solutionPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        solutions.push({
          description: match[1].trim(),
          effectiveness: 'effective'
        });
      }
    });
    
    return solutions;
  }

  extractAndStoreMetrics(reportId, metrics, content) {
    // Store provided metrics
    if (metrics && typeof metrics === 'object') {
      Object.entries(metrics).forEach(([type, value]) => {
        let unit = 'count';
        let numericValue = value;
        
        if (typeof value === 'object' && value !== null) {
          numericValue = value.value;
          unit = value.unit || 'count';
        }
        
        // Only store if value is a number
        if (typeof numericValue === 'number' || !isNaN(parseFloat(numericValue))) {
          this.stmts.insertMetric.run(
            reportId,
            type,
            parseFloat(numericValue),
            unit,
            ''
          );
        }
      });
    }
    
    // Extract metrics from content
    const metricPatterns = [
      /tokens? saved?:\s*([\d,]+)/gi,
      /performance improvement:\s*([\d.]+)%/gi,
      /reduced? by:\s*([\d.]+)%/gi,
      /time saved?:\s*([\d.]+)\s*(hours?|minutes?)/gi
    ];
    
    metricPatterns.forEach((pattern, index) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const value = parseFloat(match[1].replace(',', ''));
        const unit = match[2] || (index === 0 ? 'tokens' : '%');
        const type = index === 0 ? 'tokens_saved' : 'performance_improvement';
        
        this.stmts.insertMetric.run(
          reportId,
          type,
          value,
          unit,
          match[0]
        );
      }
    });
  }

  detectAndUpdatePatterns(reportId, content, agentName) {
    // Pattern detection logic
    const patterns = [];
    
    // Common error patterns
    if (content.match(/timeout|timed out/i)) {
      patterns.push({
        type: 'problems',
        description: 'Timeout issues',
        confidence: 0.9
      });
    }
    
    if (content.match(/memory|out of memory|oom/i)) {
      patterns.push({
        type: 'problems',
        description: 'Memory issues',
        confidence: 0.85
      });
    }
    
    // Success patterns
    if (content.match(/successfully|completed|fixed|resolved/i)) {
      patterns.push({
        type: 'solutions',
        description: 'Successful resolution',
        confidence: 0.8
      });
    }
    
    // Update pattern database
    patterns.forEach(pattern => {
      const existingAgents = this.db.prepare(
        'SELECT agents_involved FROM pattern_analysis WHERE pattern_type = ? AND pattern_description = ?'
      ).get(pattern.type, pattern.description);
      
      let agentsInvolved = agentName;
      if (existingAgents && existingAgents.agents_involved) {
        const agentList = existingAgents.agents_involved.split(',');
        if (!agentList.includes(agentName)) {
          agentList.push(agentName);
        }
        agentsInvolved = agentList.join(',');
      }
      
      this.stmts.updatePattern.run(
        pattern.type,
        pattern.description,
        1,
        pattern.confidence,
        agentsInvolved,
        new Date().toISOString().split('T')[0],
        new Date().toISOString().split('T')[0],
        pattern.confidence,
        agentsInvolved,
        new Date().toISOString().split('T')[0]
      );
    });
  }

  findAndLinkRelatedReports(reportId, content, agentId) {
    // Extract potential references
    const references = [];
    
    // Look for report IDs
    const idPattern = /report[- ]?#?(\d+)/gi;
    const matches = content.matchAll(idPattern);
    for (const match of matches) {
      references.push({
        type: 'reference',
        targetId: parseInt(match[1])
      });
    }
    
    // Find similar reports by content
    const keywords = this.extractKeywords(content);
    if (keywords.length > 0) {
      const similarReports = this.db.prepare(`
        SELECT DISTINCT fr.id, COUNT(*) as match_count
        FROM field_reports fr
        JOIN report_chunks rc ON fr.id = rc.report_id
        WHERE fr.agent_id = ? 
        AND fr.id != ?
        AND (${keywords.map(() => 'rc.content LIKE ?').join(' OR ')})
        GROUP BY fr.id
        ORDER BY match_count DESC
        LIMIT 5
      `).all(agentId, reportId, ...keywords.map(k => `%${k}%`));
      
      similarReports.forEach(similar => {
        if (similar.match_count >= 3) {
          references.push({
            type: 'similar',
            targetId: similar.id
          });
        }
      });
    }
    
    // Create relationships
    references.forEach(ref => {
      try {
        this.stmts.createRelationship.run(
          reportId,
          ref.targetId,
          ref.type,
          `Auto-detected ${ref.type} relationship`
        );
      } catch (e) {
        // Ignore duplicate relationships
      }
    });
  }

  calculateTokenSavings(content, chunkCount) {
    // Rough token estimation: 1 token ≈ 4 characters
    const fullTokens = Math.ceil(content.length / 4);
    const chunkOverhead = chunkCount * 50; // Metadata per chunk
    const queryTokens = 200; // Average query size
    
    // Reading full content vs. querying specific chunks
    const savedTokens = fullTokens - (queryTokens + chunkOverhead);
    
    return Math.max(0, savedTokens);
  }

  calculateBulkTokenSavings(reports) {
    let totalSaved = 0;
    
    reports.forEach(report => {
      // Reading all files: ~1250 tokens per report
      const fileTokens = 1250;
      // Database query: ~50 tokens
      const queryTokens = 50;
      
      totalSaved += (fileTokens - queryTokens);
    });
    
    return totalSaved;
  }

  formatMarkdownExport(groupedReports, options) {
    let markdown = '# Field Reports Export\n\n';
    markdown += `Generated: ${new Date().toISOString()}\n\n`;
    
    if (options.generateSummary) {
      let totalReports = 0;
      let successCount = 0;
      
      Object.values(groupedReports).forEach(reports => {
        totalReports += reports.length;
        successCount += reports.filter(r => r.status === 'success').length;
      });
      
      markdown += '## Executive Summary\n\n';
      markdown += `- Total Reports: ${totalReports}\n`;
      markdown += `- Success Rate: ${Math.round((successCount / totalReports) * 100)}%\n`;
      markdown += `- Groups: ${Object.keys(groupedReports).length}\n\n`;
    }
    
    Object.entries(groupedReports).forEach(([group, reports]) => {
      markdown += `## ${group}\n\n`;
      
      reports.forEach(report => {
        markdown += `### ${report.title}\n`;
        markdown += `**Agent**: ${report.agent_name} | **Date**: ${report.report_date} | **Status**: ${report.status}\n`;
        markdown += `**Mission**: ${report.mission}\n\n`;
        
        if (options.includeMetrics && report.metrics) {
          markdown += '**Metrics**:\n';
          Object.entries(report.metrics).forEach(([key, metric]) => {
            markdown += `- ${key}: ${metric.value} ${metric.unit}\n`;
          });
          markdown += '\n';
        }
        
        markdown += report.content + '\n\n---\n\n';
      });
    });
    
    return markdown;
  }

  formatCSVExport(reports) {
    const headers = ['ID', 'Title', 'Agent', 'Date', 'Status', 'Category', 'Mission', 'Word Count'];
    const rows = [headers];
    
    reports.forEach(report => {
      rows.push([
        report.id,
        `"${report.title.replace(/"/g, '""')}"`,
        report.agent_name,
        report.report_date,
        report.status,
        report.category,
        `"${report.mission.replace(/"/g, '""')}"`,
        report.word_count
      ]);
    });
    
    return rows.map(row => row.join(',')).join('\n');
  }

  generateTimeline(reports) {
    const sortedReports = [...reports].sort((a, b) => 
      new Date(a.report_date) - new Date(b.report_date)
    );
    
    let timeline = '```\n';
    
    sortedReports.forEach(report => {
      const status = report.status === 'success' ? '✓' : '✗';
      timeline += `${report.report_date} [${status}] ${report.title} (${report.agent_name})\n`;
    });
    
    timeline += '```\n';
    return timeline;
  }

  generateAnalytics(reports, patterns) {
    let analytics = '';
    
    // Status distribution
    const statusCounts = {};
    reports.forEach(report => {
      statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
    });
    
    analytics += '### Status Distribution\n';
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = Math.round((count / reports.length) * 100);
      analytics += `- ${status}: ${count} (${percentage}%)\n`;
    });
    
    // Top patterns
    if (patterns.length > 0) {
      analytics += '\n### Top Patterns\n';
      patterns.slice(0, 5).forEach(pattern => {
        analytics += `- ${pattern.description}: ${pattern.count} occurrences\n`;
      });
    }
    
    return analytics;
  }

  extractSnippet(content, query, maxLength = 200) {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    
    const index = contentLower.indexOf(queryLower);
    if (index === -1) {
      return content.substring(0, maxLength) + '...';
    }
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 150);
    
    let snippet = content.substring(start, end).trim();
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  }

  calculateRelevanceScore(result, query) {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Title matches are most important
    if (result.title.toLowerCase().includes(queryLower)) {
      score += 100;
    }
    
    // Category and status matches
    if (result.category && result.category.toLowerCase().includes(queryLower)) {
      score += 30;
    }
    
    // Recent reports get a slight boost
    const daysSinceReport = (Date.now() - new Date(result.report_date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceReport < 7) score += 10;
    else if (daysSinceReport < 30) score += 5;
    
    return score;
  }

  detectSeverity(description) {
    const desc = description.toLowerCase();
    if (desc.includes('critical') || desc.includes('severe') || desc.includes('crash')) return 'critical';
    if (desc.includes('high') || desc.includes('major') || desc.includes('important')) return 'high';
    if (desc.includes('low') || desc.includes('minor') || desc.includes('trivial')) return 'low';
    return 'medium';
  }

  detectProblemCategory(description) {
    const desc = description.toLowerCase();
    if (desc.includes('performance') || desc.includes('slow') || desc.includes('timeout')) return 'performance';
    if (desc.includes('error') || desc.includes('bug') || desc.includes('crash')) return 'error';
    if (desc.includes('ui') || desc.includes('display') || desc.includes('visual')) return 'ui';
    if (desc.includes('data') || desc.includes('database') || desc.includes('storage')) return 'data';
    return 'general';
  }

  extractKeywords(content) {
    // Extract important keywords for similarity matching
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'may', 'might', 'must', 'shall', 'can', 'could', 'to', 'of', 'in', 'for', 'with', 'by', 'from', 'about']);
    
    const keywords = [];
    const wordCounts = {};
    
    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
    
    // Get top keywords by frequency
    Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([word, count]) => {
        if (count > 2) {
          keywords.push(word);
        }
      });
    
    return keywords;
  }

  calculateDateRange(bundleType, date) {
    const targetDate = new Date(date);
    let start, end;
    
    switch (bundleType) {
      case 'daily':
        start = date;
        end = date;
        break;
        
      case 'weekly':
        const dayOfWeek = targetDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(targetDate);
        monday.setDate(targetDate.getDate() - daysToMonday);
        start = monday.toISOString().split('T')[0];
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        end = sunday.toISOString().split('T')[0];
        break;
        
      case 'monthly':
        start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString().split('T')[0];
        end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
        
      case 'by-agent':
      case 'by-success':
        // Use last 30 days
        const thirtyDaysAgo = new Date(targetDate);
        thirtyDaysAgo.setDate(targetDate.getDate() - 30);
        start = thirtyDaysAgo.toISOString().split('T')[0];
        end = date;
        break;
        
      default:
        throw new Error(`Unknown bundle type: ${bundleType}`);
    }
    
    return { start, end };
  }

  groupReportsByPeriod(reports, period) {
    const grouped = {};
    
    reports.forEach(report => {
      let key;
      const date = new Date(report.report_date);
      
      switch (period) {
        case 'day':
          key = report.report_date;
          break;
          
        case 'week':
          const weekStart = new Date(date);
          const dayOfWeek = date.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          weekStart.setDate(date.getDate() - daysToMonday);
          key = `Week of ${weekStart.toISOString().split('T')[0]}`;
          break;
          
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
          
        case 'agent':
          key = report.agent_name;
          break;
          
        default:
          key = 'all';
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(report);
    });
    
    return grouped;
  }

  generateAgentMetrics(reports) {
    const categories = {};
    const months = {};
    
    reports.forEach(report => {
      // Category distribution
      const category = report.category || 'uncategorized';
      categories[category] = (categories[category] || 0) + 1;
      
      // Monthly activity
      const month = report.report_date.substring(0, 7);
      months[month] = (months[month] || 0) + 1;
    });
    
    let metrics = '### Category Distribution\n';
    Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        metrics += `- ${category}: ${count}\n`;
      });
    
    metrics += '\n### Monthly Activity\n';
    Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([month, count]) => {
        metrics += `- ${month}: ${count} reports\n`;
      });
    
    return metrics;
  }

  calculatePatternTrend(pattern) {
    // Simple trend calculation based on dates
    const firstDate = new Date(pattern.first_seen);
    const lastDate = new Date(pattern.last_seen);
    const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff === 0) return 'new';
    
    const occurrenceRate = pattern.occurrence_count / daysDiff;
    
    if (occurrenceRate > 1) return 'increasing';
    if (occurrenceRate > 0.5) return 'stable';
    return 'decreasing';
  }

  getTopAgent(startDate, endDate) {
    const result = this.db.prepare(`
      SELECT a.name, COUNT(fr.id) as report_count
      FROM agents a
      JOIN field_reports fr ON a.id = fr.agent_id
      WHERE fr.report_date BETWEEN ? AND ?
      GROUP BY a.id, a.name
      ORDER BY report_count DESC
      LIMIT 1
    `).get(startDate, endDate);
    
    return result ? result.name : 'N/A';
  }

  getAgentMetrics(startDate, endDate) {
    const agents = this.db.prepare(`
      SELECT 
        a.name,
        COUNT(fr.id) as total_reports,
        SUM(CASE WHEN fr.status = 'success' THEN 1 ELSE 0 END) as success_count,
        SUM(m.metric_value) as tokens_saved
      FROM agents a
      LEFT JOIN field_reports fr ON a.id = fr.agent_id
      LEFT JOIN metrics m ON fr.id = m.report_id AND m.metric_type = 'tokens_saved'
      WHERE fr.report_date BETWEEN ? AND ?
      GROUP BY a.id, a.name
      ORDER BY total_reports DESC
    `).all(startDate, endDate);
    
    return agents.map(agent => ({
      name: agent.name,
      totalReports: agent.total_reports,
      successRate: agent.total_reports > 0 
        ? Math.round((agent.success_count / agent.total_reports) * 100)
        : 0,
      tokensSaved: agent.tokens_saved || 0
    }));
  }

  getCategoryMetrics(startDate, endDate) {
    const categories = this.db.prepare(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count
      FROM field_reports
      WHERE report_date BETWEEN ? AND ?
      GROUP BY category
      ORDER BY count DESC
    `).all(startDate, endDate);
    
    return categories.map(cat => ({
      category: cat.category,
      count: cat.count,
      successRate: Math.round((cat.success_count / cat.count) * 100)
    }));
  }

  getTrendMetrics(startDate, endDate) {
    const daily = this.db.prepare(`
      SELECT 
        report_date,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count
      FROM field_reports
      WHERE report_date BETWEEN ? AND ?
      GROUP BY report_date
      ORDER BY report_date
    `).all(startDate, endDate);
    
    return {
      daily: daily.map(day => ({
        date: day.report_date,
        total: day.count,
        successRate: Math.round((day.success_count / day.count) * 100)
      }))
    };
  }

  formatMetricsAsCSV(metrics, metricType) {
    let csv = '';
    
    switch (metricType) {
      case 'overview':
        csv = 'Metric,Value\n';
        Object.entries(metrics).forEach(([key, value]) => {
          csv += `"${key}","${value}"\n`;
        });
        break;
        
      case 'by-agent':
        csv = 'Agent,Total Reports,Success Rate,Tokens Saved\n';
        metrics.forEach(agent => {
          csv += `"${agent.name}",${agent.totalReports},${agent.successRate}%,${agent.tokensSaved}\n`;
        });
        break;
        
      case 'by-category':
        csv = 'Category,Count,Success Rate\n';
        metrics.forEach(cat => {
          csv += `"${cat.category}",${cat.count},${cat.successRate}%\n`;
        });
        break;
        
      case 'trends':
        csv = 'Date,Total,Success Rate\n';
        metrics.daily.forEach(day => {
          csv += `${day.date},${day.total},${day.successRate}%\n`;
        });
        break;
    }
    
    return csv;
  }

  formatMetricsAsMarkdown(metrics, metricType, includeCharts) {
    let markdown = `# Metrics Report: ${metricType}\n\n`;
    
    switch (metricType) {
      case 'overview':
        markdown += '## Overview\n\n';
        Object.entries(metrics).forEach(([key, value]) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          markdown += `- **${label}**: ${typeof value === 'number' ? value.toLocaleString() : value}\n`;
        });
        break;
        
      case 'by-agent':
        markdown += '## Agent Performance\n\n';
        markdown += '| Agent | Reports | Success Rate | Tokens Saved |\n';
        markdown += '|-------|---------|--------------|-------------|\n';
        metrics.forEach(agent => {
          markdown += `| ${agent.name} | ${agent.totalReports} | ${agent.successRate}% | ${agent.tokensSaved.toLocaleString()} |\n`;
        });
        break;
        
      case 'by-category':
        markdown += '## Category Distribution\n\n';
        markdown += '| Category | Count | Success Rate |\n';
        markdown += '|----------|-------|-------------|\n';
        metrics.forEach(cat => {
          markdown += `| ${cat.category} | ${cat.count} | ${cat.successRate}% |\n`;
        });
        break;
        
      case 'trends':
        markdown += '## Daily Trends\n\n';
        if (includeCharts && metrics.daily.length > 0) {
          markdown += '```\n';
          // Simple ASCII chart
          const maxCount = Math.max(...metrics.daily.map(d => d.total));
          metrics.daily.forEach(day => {
            const bars = Math.round((day.total / maxCount) * 20);
            markdown += `${day.date}: ${'█'.repeat(bars)} ${day.total}\n`;
          });
          markdown += '```\n\n';
        }
        
        markdown += '| Date | Total | Success Rate |\n';
        markdown += '|------|-------|-------------|\n';
        metrics.daily.forEach(day => {
          markdown += `| ${day.date} | ${day.total} | ${day.successRate}% |\n`;
        });
        break;
    }
    
    return markdown;
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export { ReportsAPI };