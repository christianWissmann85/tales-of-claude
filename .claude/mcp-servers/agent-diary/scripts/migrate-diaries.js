#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');
const ProgressBar = require('progress');
const DiaryMigrator = require('../src/diary-migrator');

class DiaryMigrationScript {
    constructor(options = {}) {
        this.options = {
            dryRun: options.dryRun || false,
            resume: options.resume || false,
            verbose: options.verbose || false,
            baseDir: options.baseDir || '.claude/task-agents',
            reportFile: options.reportFile || 'migration-report.json',
            ...options
        };
        
        this.stats = {
            totalFiles: 0,
            processed: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            entries: 0,
            startTime: Date.now()
        };
        
        this.errors = [];
        this.migrator = new DiaryMigrator();
        this.progressBar = null;
    }

    async run() {
        try {
            console.log(chalk.blue.bold('\n📖 Diary Migration Tool\n'));
            
            if (this.options.dryRun) {
                console.log(chalk.yellow('🔍 Running in DRY-RUN mode - no changes will be made\n'));
            }
            
            // Find all diary files
            const diaryFiles = await this.findDiaryFiles();
            if (diaryFiles.length === 0) {
                console.log(chalk.yellow('No diary files found to migrate.'));
                return;
            }
            
            this.stats.totalFiles = diaryFiles.length;
            console.log(`Found ${chalk.cyan(diaryFiles.length)} diary files to process\n`);
            
            // Load existing migration state if resuming
            if (this.options.resume) {
                await this.loadMigrationState();
            }
            
            // Initialize progress bar
            this.initProgressBar();
            
            // Process each diary file
            for (const filePath of diaryFiles) {
                await this.processDiaryFile(filePath);
            }
            
            // Generate final report
            await this.generateReport();
            
        } catch (error) {
            console.error(chalk.red('\n❌ Migration failed:'), error.message);
            if (this.options.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    async findDiaryFiles() {
        const pattern = path.join(this.options.baseDir, '*', 'diary.md');
        
        return new Promise((resolve, reject) => {
            glob(pattern, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(files.sort());
                }
            });
        });
    }

    async processDiaryFile(filePath) {
        const agentName = this.extractAgentName(filePath);
        
        try {
            // Check if already processed (for resume functionality)
            if (await this.isAlreadyProcessed(filePath)) {
                this.stats.skipped++;
                this.updateProgress(`Skipped ${agentName} (already processed)`);
                return;
            }
            
            // Read and validate file
            const content = await this.readDiaryFile(filePath);
            if (!content.trim()) {
                this.stats.skipped++;
                this.updateProgress(`Skipped ${agentName} (empty file)`);
                return;
            }
            
            // Parse diary entries
            const entries = await this.parseDiaryEntries(content, agentName, filePath);
            
            if (!this.options.dryRun) {
                // Migrate to database
                await this.migrateToDatabse(entries, agentName);
                
                // Mark as processed
                await this.markAsProcessed(filePath);
            }
            
            this.stats.successful++;
            this.stats.entries += entries.length;
            this.updateProgress(`✓ ${agentName} (${entries.length} entries)`);
            
        } catch (error) {
            this.stats.failed++;
            this.errors.push({
                file: filePath,
                agent: agentName,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            this.updateProgress(`✗ ${agentName} (${error.message})`);
            
            if (this.options.verbose) {
                console.error(chalk.red(`\nError processing ${filePath}:`), error.stack);
            }
        } finally {
            this.stats.processed++;
        }
    }

    extractAgentName(filePath) {
        // Extract agent name from path like .claude/task-agents/agent-name/diary.md
        const parts = filePath.split(path.sep);
        const agentIndex = parts.findIndex(part => part === 'task-agents');
        
        if (agentIndex !== -1 && agentIndex + 1 < parts.length) {
            return parts[agentIndex + 1];
        }
        
        // Fallback: use parent directory name
        return path.basename(path.dirname(filePath));
    }

    async readDiaryFile(filePath) {
        try {
            const stats = await fs.stat(filePath);
            if (stats.size === 0) {
                return '';
            }
            
            const content = await fs.readFile(filePath, 'utf8');
            return content;
            
        } catch (error) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }

    async parseDiaryEntries(content, agentName, filePath) {
        try {
            const entries = await this.migrator.parseMarkdown(content);
            
            // Add metadata to each entry
            return entries.map(entry => ({
                ...entry,
                agent: agentName,
                source_file: filePath,
                migrated_at: new Date().toISOString()
            }));
            
        } catch (error) {
            throw new Error(`Failed to parse diary: ${error.message}`);
        }
    }

    async migrateToDatabse(entries, agentName) {
        try {
            for (const entry of entries) {
                await this.migrator.addEntry(
                    agentName,
                    entry.timestamp,
                    entry.content,
                    entry.metadata || {}
                );
            }
        } catch (error) {
            throw new Error(`Database migration failed: ${error.message}`);
        }
    }

    initProgressBar() {
        if (process.stdout.isTTY && !this.options.verbose) {
            this.progressBar = new ProgressBar(
                'Migrating [:bar] :current/:total (:percent) :etas :status',
                {
                    complete: '█',
                    incomplete: '░',
                    width: 30,
                    total: this.stats.totalFiles,
                    clear: false
                }
            );
        }
    }

    updateProgress(status = '') {
        if (this.progressBar) {
            this.progressBar.tick(1, { status: status.substring(0, 40) });
        } else {
            console.log(`[${this.stats.processed}/${this.stats.totalFiles}] ${status}`);
        }
    }

    async isAlreadyProcessed(filePath) {
        if (!this.options.resume) {
            return false;
        }
        
        try {
            const stateFile = '.migration-state.json';
            const state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
            return state.processed && state.processed.includes(filePath);
        } catch {
            return false;
        }
    }

    async markAsProcessed(filePath) {
        if (!this.options.resume) {
            return;
        }
        
        try {
            const stateFile = '.migration-state.json';
            let state = {};
            
            try {
                state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
            } catch {
                // File doesn't exist, start fresh
            }
            
            if (!state.processed) {
                state.processed = [];
            }
            
            if (!state.processed.includes(filePath)) {
                state.processed.push(filePath);
                await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
            }
        } catch (error) {
            // Non-critical error, just log it
            if (this.options.verbose) {
                console.warn(`Warning: Could not update migration state: ${error.message}`);
            }
        }
    }

    async loadMigrationState() {
        try {
            const stateFile = '.migration-state.json';
            const state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
            
            if (state.processed && state.processed.length > 0) {
                console.log(chalk.blue(`Resuming migration - ${state.processed.length} files already processed\n`));
            }
        } catch {
            console.log(chalk.yellow('No previous migration state found, starting fresh\n'));
        }
    }

    async generateReport() {
        const duration = Date.now() - this.stats.startTime;
        const report = {
            summary: {
                totalFiles: this.stats.totalFiles,
                processed: this.stats.processed,
                successful: this.stats.successful,
                failed: this.stats.failed,
                skipped: this.stats.skipped,
                totalEntries: this.stats.entries,
                duration: duration,
                dryRun: this.options.dryRun,
                timestamp: new Date().toISOString()
            },
            errors: this.errors,
            options: this.options
        };
        
        // Save detailed report
        if (!this.options.dryRun) {
            await fs.writeFile(
                this.options.reportFile,
                JSON.stringify(report, null, 2)
            );
        }
        
        // Display summary
        this.displaySummary(report.summary);
    }

    displaySummary(summary) {
        console.log('\n' + chalk.blue.bold('📊 Migration Summary'));
        console.log('═'.repeat(50));
        
        console.log(`${chalk.cyan('Total files found:')} ${summary.totalFiles}`);
        console.log(`${chalk.green('Successfully migrated:')} ${summary.successful}`);
        console.log(`${chalk.yellow('Skipped:')} ${summary.skipped}`);
        console.log(`${chalk.red('Failed:')} ${summary.failed}`);
        console.log(`${chalk.blue('Total diary entries:')} ${summary.totalEntries}`);
        console.log(`${chalk.gray('Duration:')} ${this.formatDuration(summary.duration)}`);
        
        if (summary.failed > 0) {
            console.log('\n' + chalk.red.bold('❌ Errors encountered:'));
            this.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${chalk.yellow(error.agent)}: ${error.error}`);
            });
        }
        
        if (summary.successful > 0) {
            console.log('\n' + chalk.green.bold('✅ Migration completed successfully!'));
            
            if (!this.options.dryRun) {
                console.log(`Detailed report saved to: ${chalk.cyan(this.options.reportFile)}`);
                
                // Clean up migration state file
                try {
                    await fs.unlink('.migration-state.json');
                } catch {
                    // Ignore cleanup errors
                }
            }
        }
        
        if (this.options.dryRun) {
            console.log('\n' + chalk.yellow.bold('🔍 This was a dry run - no changes were made'));
            console.log('Run without --dry-run to perform the actual migration');
        }
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--dry-run':
            case '-d':
                options.dryRun = true;
                break;
            case '--resume':
            case '-r':
                options.resume = true;
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--base-dir':
                options.baseDir = args[++i];
                break;
            case '--report':
                options.reportFile = args[++i];
                break;
            case '--help':
            case '-h':
                showHelp();
                return;
            default:
                if (arg.startsWith('-')) {
                    console.error(chalk.red(`Unknown option: ${arg}`));
                    showHelp();
                    process.exit(1);
                }
        }
    }
    
    const migrator = new DiaryMigrationScript(options);
    await migrator.run();
}

function showHelp() {
    console.log(`
${chalk.blue.bold('Diary Migration Tool')}

Migrates markdown diary files to SQLite database.

${chalk.yellow('Usage:')}
  node scripts/migrate-diaries.js [options]

${chalk.yellow('Options:')}
  -d, --dry-run       Preview changes without making them
  -r, --resume        Resume a previously interrupted migration
  -v, --verbose       Show detailed output and error traces
  --base-dir <path>   Base directory to search for diaries (default: .claude/task-agents)
  --report <file>     Report file name (default: migration-report.json)
  -h, --help          Show this help message

${chalk.yellow('Examples:')}
  # Preview migration
  node scripts/migrate-diaries.js --dry-run

  # Run migration with verbose output
  node scripts/migrate-diaries.js --verbose

  # Resume interrupted migration
  node scripts/migrate-diaries.js --resume

  # Custom base directory
  node scripts/migrate-diaries.js --base-dir /path/to/agents
`);
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error(chalk.red('\n💥 Unexpected error:'), error.message);
        process.exit(1);
    });
}

module.exports = DiaryMigrationScript;