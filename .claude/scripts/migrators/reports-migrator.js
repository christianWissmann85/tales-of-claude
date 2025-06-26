import fs from 'fs/promises';
import path from 'path';

export class ReportsMigrator {
  constructor(db, logger, config) {
    this.db = db;
    this.logger = logger;
    this.config = config;
  }

  async migrate(args) {
    const reportPaths = await this.findReportFiles();
    this.logger.info(`Found ${reportPaths.length} field report files`);

    let totalEntries = 0;
    let errors = 0;

    for (const reportPath of reportPaths) {
      try {
        const report = await this.parseReportFile(reportPath);
        
        if (!report) {
          this.logger.warning(`Skipping non-report file: ${path.basename(reportPath)}`);
          continue;
        }
        
        this.logger.debug(`Processing report: ${report.agentName} - ${report.mission}`);

        if (!args['dry-run']) {
          await this.db.transaction(() => {
            this.db.insertFieldReport(
              report.agentName,
              report.date,
              report.mission,
              report.status,
              report.summary,
              report.problem,
              report.solution
            );
          });
        }

        totalEntries++;
        this.logger.success(`Migrated report: ${report.agentName} - ${report.date}`);
      } catch (error) {
        errors++;
        this.logger.error(`Failed to process ${path.basename(reportPath)}: ${error.message}`);
      }
    }

    this.logger.updateStats('reports', reportPaths.length, totalEntries, errors);
    return { files: reportPaths.length, entries: totalEntries, errors };
  }

  async findReportFiles() {
    const reportPaths = [];
    const reportsDir = path.join(this.config.sourceRoot, '.claude', 'field-test-reports');
    
    try {
      // Scan root directory
      const rootFiles = await fs.readdir(reportsDir);
      for (const file of rootFiles) {
        if (file.endsWith('.md') && !file.includes('index') && !file.includes('README')) {
          reportPaths.push(path.join(reportsDir, file));
        }
      }
      
      // Scan organized directory
      const organizedDir = path.join(reportsDir, 'organized');
      try {
        const dateDirs = await fs.readdir(organizedDir);
        for (const dateDir of dateDirs) {
          const datePath = path.join(organizedDir, dateDir);
          const stat = await fs.stat(datePath);
          if (stat.isDirectory()) {
            const files = await fs.readdir(datePath);
            for (const file of files) {
              if (file.endsWith('.md')) {
                reportPaths.push(path.join(datePath, file));
              }
            }
          }
        }
      } catch {
        // Organized directory doesn't exist
      }
    } catch (error) {
      this.logger.warning(`Could not access reports directory: ${reportsDir}`);
    }

    return reportPaths;
  }

  async parseReportFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Skip files that don't have the field report structure
    if (!content.includes('**Agent**:') && !content.includes('**Date**:')) {
      return null;
    }
    
    const report = {
      agentName: '',
      date: '',
      mission: '',
      status: '',
      summary: '',
      problem: '',
      solution: ''
    };
    
    // Extract metadata from headers
    for (const line of lines) {
      if (line.startsWith('**Agent**:')) {
        report.agentName = line.replace('**Agent**:', '').trim();
      } else if (line.startsWith('**Date**:')) {
        report.date = line.replace('**Date**:', '').trim();
      } else if (line.startsWith('**Mission**:')) {
        report.mission = line.replace('**Mission**:', '').trim();
      } else if (line.startsWith('**Status**:')) {
        const statusMatch = line.match(/✅|❌|⚠️|🔄/);
        report.status = statusMatch ? statusMatch[0] : 'Unknown';
      }
    }
    
    // Extract agent name from filename if not found
    if (!report.agentName) {
      const filename = path.basename(filePath, '.md');
      const agentMatch = filename.match(/^([a-z-]+)-/);
      if (agentMatch) {
        report.agentName = agentMatch[1].split('-').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' ');
      }
    }
    
    // Extract date from filename if not found
    if (!report.date) {
      const dateMatch = path.basename(filePath).match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        report.date = dateMatch[1];
      }
    }
    
    // Extract sections
    const sections = {
      summary: this.extractSection(content, ['## Executive Summary', '## Summary']),
      problem: this.extractSection(content, ['## Problem', '## The Problem', '## Challenge']),
      solution: this.extractSection(content, ['## Solution', '## The Solution', '## Approach'])
    };
    
    report.summary = sections.summary || this.extractSection(content, ['## Key Achievements']);
    report.problem = sections.problem || '';
    report.solution = sections.solution || '';
    
    // If no mission found, try to extract from summary or title
    if (!report.mission) {
      const titleMatch = content.match(/^#\s+(.+)/m);
      if (titleMatch) {
        report.mission = titleMatch[1].replace(/Field Test Report:\s*/i, '').trim();
      }
    }
    
    return report;
  }

  extractSection(content, headers) {
    for (const header of headers) {
      const regex = new RegExp(`^${header}\\s*\\n([\\s\\S]*?)(?=^##|$)`, 'mi');
      const match = content.match(regex);
      if (match) {
        return match[1].trim();
      }
    }
    return '';
  }
}