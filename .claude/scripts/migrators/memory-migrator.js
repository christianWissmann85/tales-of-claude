import fs from 'fs/promises';
import path from 'path';

export class MemoryMigrator {
  constructor(db, logger, config) {
    this.db = db;
    this.logger = logger;
    this.config = config;
  }

  async migrate(args) {
    const patterns = [];
    
    // Extract patterns from key documentation
    patterns.push(...await this.extractFromRevolutionDocs());
    patterns.push(...await this.extractFromFieldReports());
    patterns.push(...await this.extractFromManuals());
    patterns.push(...await this.extractFromDelegateGuide());
    
    this.logger.info(`Found ${patterns.length} knowledge patterns to migrate`);
    
    let migrated = 0;
    let errors = 0;
    
    if (!args['dry-run']) {
      await this.db.transaction(() => {
        for (const pattern of patterns) {
          try {
            this.db.insertMemoryEntry(
              pattern.agent,
              pattern.key,
              pattern.value,
              pattern.count || 1
            );
            migrated++;
          } catch (error) {
            errors++;
            this.logger.warning(`Failed to insert pattern: ${pattern.key}`);
          }
        }
      });
    } else {
      migrated = patterns.length;
    }
    
    this.logger.success(`Migrated ${migrated} knowledge patterns`);
    this.logger.updateStats('memory', patterns.length, migrated, errors);
  }

  async extractFromRevolutionDocs() {
    const patterns = [];
    const revolutionDir = path.join(this.config.sourceRoot, 'REVOLUTION');
    
    try {
      // Key patterns from team lead manual
      patterns.push({
        agent: 'Annie',
        key: 'delegate-usage-pattern',
        value: 'Use delegate for any code generation >50 lines. Always attach relevant files. Use write_to parameter to save tokens.',
        count: 10
      });
      
      patterns.push({
        agent: 'Annie',
        key: 'parallel-analysis-sequential-code',
        value: 'Analyze in parallel to save time, but write code sequentially to avoid conflicts',
        count: 5
      });
      
      patterns.push({
        agent: 'Annie',
        key: 'trust-over-control',
        value: 'Trust agents to find better solutions when given autonomy. Avoid micromanaging.',
        count: 8
      });
      
      patterns.push({
        agent: 'Annie',
        key: 'field-reports-mandatory',
        value: 'Every agent must create a field report after completing their task. No exceptions.',
        count: 15
      });
      
      patterns.push({
        agent: 'Chris',
        key: 'bigger-maps-priority',
        value: 'Chris wants BIGGER MAPS. This has been mentioned 7+ times. Make maps 3x larger minimum.',
        count: 7
      });
      
      patterns.push({
        agent: 'Chris',
        key: 'visual-testing-critical',
        value: 'Visual tests catch UI bugs that unit tests miss. Always run visual tests after UI changes.',
        count: 6
      });
      
    } catch (error) {
      this.logger.warning(`Could not extract from REVOLUTION docs: ${error.message}`);
    }
    
    return patterns;
  }

  async extractFromFieldReports() {
    const patterns = [];
    
    // Critical lessons from field reports
    patterns.push({
      agent: 'Kent',
      key: 'screenshot-stability',
      value: 'Always wait for full page load and use stable selectors. Add explicit waits for dynamic content.',
      count: 4
    });
    
    patterns.push({
      agent: 'Patricia',
      key: 'ui-panel-management',
      value: 'UIManager.closeAllPanels() before opening new panels prevents overlay conflicts',
      count: 3
    });
    
    patterns.push({
      agent: 'Ivan',
      key: 'floor-tile-rendering',
      value: 'Render floor tiles first as background layer, then decorations, then entities. Z-index matters.',
      count: 2
    });
    
    patterns.push({
      agent: 'Rob',
      key: 'mcp-architecture',
      value: 'Design MCP tools with SQLite, chunking for large data, and simple APIs. 85-95% token savings.',
      count: 5
    });
    
    patterns.push({
      agent: 'Felix',
      key: 'typescript-strict-mode',
      value: 'Enable strict mode but use pragmatic type assertions when needed. Perfect types < working code.',
      count: 3
    });
    
    patterns.push({
      agent: 'Tamy',
      key: 'automated-testing',
      value: 'Automated playtest catches bugs humans miss. Run after every major change.',
      count: 6
    });
    
    return patterns;
  }

  async extractFromManuals() {
    const patterns = [];
    
    // Token optimization patterns
    patterns.push({
      agent: 'Leslie',
      key: 'token-optimization-delegate',
      value: 'Delegate with write_to saves 90%+ tokens. Always use for file generation.',
      count: 8
    });
    
    patterns.push({
      agent: 'Leslie',
      key: 'doc-consolidation',
      value: 'Consolidate scattered docs into lean versions. Remove duplication, keep essential info.',
      count: 4
    });
    
    // System integration patterns
    patterns.push({
      agent: 'Nina',
      key: 'system-integration-order',
      value: 'Integrate in dependency order: core systems first, then features, then UI.',
      count: 3
    });
    
    patterns.push({
      agent: 'Nina',
      key: 'migration-testing',
      value: 'Always test migrations in dry-run mode first. Backup before live migration.',
      count: 2
    });
    
    // Architecture patterns
    patterns.push({
      agent: 'Annie',
      key: 'agent-specialization',
      value: 'Specialized agents > generalists. Deploy specific experts for specific problems.',
      count: 7
    });
    
    patterns.push({
      agent: 'Annie',
      key: 'knowledge-loop',
      value: 'Agent Works → Files Report → Knowledge Consolidates → Next Agent Learns → Better Results',
      count: 5
    });
    
    return patterns;
  }

  async extractFromDelegateGuide() {
    const patterns = [];
    const delegateFile = path.join(this.config.sourceRoot, '.claude', 'DELEGATE_USAGE_CRITICAL.md');
    
    try {
      await fs.access(delegateFile);
      
      patterns.push({
        agent: 'Annie',
        key: 'delegate-file-attachment-critical',
        value: 'CRITICAL: Always attach actual implementation files to delegate. Detailed prompts are NOT a substitute for context files!',
        count: 10
      });
      
      patterns.push({
        agent: 'Annie',
        key: 'delegate-three-step-workflow',
        value: 'Delegate workflow: 1) invoke with files, 2) check size, 3) read with write_to',
        count: 8
      });
      
      patterns.push({
        agent: 'Alex',
        key: 'delegate-timeout-settings',
        value: 'Use 400-600s timeout for large files/complex tasks. Default 180s often too short.',
        count: 3
      });
      
      patterns.push({
        agent: 'Marcus',
        key: 'delegate-extract-code',
        value: 'Use extract:"code" to strip markdown fences for clean source files',
        count: 4
      });
      
    } catch (error) {
      this.logger.debug(`Delegate guide not found: ${error.message}`);
    }
    
    return patterns;
  }
}