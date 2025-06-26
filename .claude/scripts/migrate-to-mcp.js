#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import chalk from 'chalk';
import { parseArgs } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  sourceRoot: path.resolve(__dirname, '../..'),
  memoryDir: path.resolve(__dirname, '../../memory'),
  databases: {
    diaries: 'agent_diary.db',
    reports: 'field_reports.db',
    roadmap: 'project_tracker.db',
    memory: 'team_memory.db'
  },
  chunkSize: 2500,
  maxChunkSize: 3500
};

// Parse command line arguments
const { values: args } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    'backup': { type: 'boolean', default: true },
    'verbose': { type: 'boolean', default: false },
    'rollback': { type: 'string' }
  }
});

// Logger class for colored output and statistics
class MigrationLogger {
  constructor(verbose = false) {
    this.verbose = verbose;
    this.stats = {
      diaries: { processed: 0, entries: 0, errors: 0 },
      reports: { processed: 0, entries: 0, errors: 0 },
      roadmap: { processed: 0, entries: 0, errors: 0 },
      memory: { processed: 0, entries: 0, errors: 0 }
    };
  }

  info(message) {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message) {
    console.log(chalk.green('✓'), message);
  }

  warning(message) {
    console.log(chalk.yellow('⚠'), message);
  }

  error(message) {
    console.log(chalk.red('✗'), message);
  }

  debug(message) {
    if (this.verbose) {
      console.log(chalk.gray('  →'), message);
    }
  }

  updateStats(type, processed = 0, entries = 0, errors = 0) {
    this.stats[type].processed += processed;
    this.stats[type].entries += entries;
    this.stats[type].errors += errors;
  }

  printSummary() {
    console.log(chalk.bold('\n📊 Migration Summary:'));
    console.log('═'.repeat(50));
    
    Object.entries(this.stats).forEach(([type, stats]) => {
      const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
      console.log(`${chalk.cyan(typeLabel.padEnd(10))} ${stats.processed} files → ${stats.entries} entries (${stats.errors} errors)`);
    });
    
    const totalFiles = Object.values(this.stats).reduce((sum, s) => sum + s.processed, 0);
    const totalEntries = Object.values(this.stats).reduce((sum, s) => sum + s.entries, 0);
    const totalErrors = Object.values(this.stats).reduce((sum, s) => sum + s.errors, 0);
    
    console.log('─'.repeat(50));
    console.log(`${chalk.bold('Total:')} ${totalFiles} files → ${totalEntries} entries (${totalErrors} errors)`);
    
    if (totalErrors === 0) {
      console.log(chalk.green('\n🎉 Migration completed successfully!'));
    } else {
      console.log(chalk.yellow(`\n⚠️  Migration completed with ${totalErrors} errors`));
    }
  }
}

// Base database manager class
class DatabaseManager {
  constructor(dbPath, logger) {
    this.dbPath = dbPath;
    this.logger = logger;
    this.db = null;
  }

  async init() {
    try {
      // Ensure memory directory exists
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 10000');
      this.db.pragma('foreign_keys = ON');
      
      await this.createTables();
      this.logger.debug(`Database initialized: ${this.dbPath}`);
    } catch (error) {
      throw new Error(`Failed to initialize database ${this.dbPath}: ${error.message}`);
    }
  }

  async createTables() {
    // Override in subclasses
    throw new Error('createTables must be implemented by subclass');
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  transaction(fn) {
    return this.db.transaction(fn)();
  }
}

// Database class for diary entries
class DiaryDatabase extends DatabaseManager {
  async createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_name TEXT NOT NULL,
        date TEXT NOT NULL,
        content TEXT NOT NULL,
        session_number INTEGER,
        word_count INTEGER,
        emotion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_entries_agent_date ON entries(agent_name, date);
      CREATE INDEX IF NOT EXISTS idx_entries_session ON entries(session_number);
    `);

    this.insertEntry = this.db.prepare(`
      INSERT INTO entries (agent_name, date, content, session_number, word_count, emotion)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    this.insertAgent = this.db.prepare(`
      INSERT OR IGNORE INTO agents (name) VALUES (?)
    `);
  }

  insertDiaryEntry(agentName, date, content, sessionNumber, wordCount, emotion) {
    this.insertAgent.run(agentName);
    return this.insertEntry.run(agentName, date, content, sessionNumber, wordCount, emotion);
  }
}

// Database class for field reports
class ReportsDatabase extends DatabaseManager {
  async createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_name TEXT NOT NULL,
        date TEXT NOT NULL,
        mission TEXT,
        status TEXT,
        summary TEXT,
        problem TEXT,
        solution TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_reports_agent_date ON reports(agent_name, date);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    `);

    this.insertReport = this.db.prepare(`
      INSERT INTO reports (agent_name, date, mission, status, summary, problem, solution)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    this.insertAgent = this.db.prepare(`
      INSERT OR IGNORE INTO agents (name) VALUES (?)
    `);
  }

  insertFieldReport(agentName, date, mission, status, summary, problem, solution) {
    this.insertAgent.run(agentName);
    return this.insertReport.run(agentName, date, mission, status, summary, problem, solution);
  }
}

// Database class for roadmap/project tracking
class RoadmapDatabase extends DatabaseManager {
  async createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        task_type TEXT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority INTEGER DEFAULT 0,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_progress_session ON progress(session_id);
      CREATE INDEX IF NOT EXISTS idx_progress_status ON progress(status);
    `);

    this.insertProgress = this.db.prepare(`
      INSERT INTO progress (session_id, task_type, title, description, status, priority, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
  }

  insertProgressEntry(sessionId, taskType, title, description, status, priority, metadata) {
    return this.insertProgress.run(sessionId, taskType, title, description, status, priority, JSON.stringify(metadata || {}));
  }
}

// Database class for team memory
class MemoryDatabase extends DatabaseManager {
  async createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS solutions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        count INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_solutions_agent ON solutions(agent);
      CREATE INDEX IF NOT EXISTS idx_solutions_key ON solutions(key);
    `);

    this.insertSolution = this.db.prepare(`
      INSERT INTO solutions (agent, key, value, count)
      VALUES (?, ?, ?, ?)
    `);
  }

  insertMemoryEntry(agent, key, value, count = 1) {
    return this.insertSolution.run(agent, key, value, count);
  }
}

// Main migration orchestrator
async function runMigration() {
  const logger = new MigrationLogger(args.verbose);
  
  logger.info('Starting MCP data migration...');
  logger.info(`Source: ${CONFIG.sourceRoot}`);
  logger.info(`Target: ${CONFIG.memoryDir}`);
  logger.info(`Mode: ${args['dry-run'] ? 'DRY RUN' : 'LIVE'}`);
  
  try {
    // Import migrator modules
    const { DiaryMigrator } = await import('./migrators/diary-migrator.js');
    const { ReportsMigrator } = await import('./migrators/reports-migrator.js');
    const { RoadmapMigrator } = await import('./migrators/roadmap-migrator.js');
    const { MemoryMigrator } = await import('./migrators/memory-migrator.js');
    
    // Initialize databases
    const diaryDb = new DiaryDatabase(path.join(CONFIG.memoryDir, CONFIG.databases.diaries), logger);
    const reportsDb = new ReportsDatabase(path.join(CONFIG.memoryDir, CONFIG.databases.reports), logger);
    const roadmapDb = new RoadmapDatabase(path.join(CONFIG.memoryDir, CONFIG.databases.roadmap), logger);
    const memoryDb = new MemoryDatabase(path.join(CONFIG.memoryDir, CONFIG.databases.memory), logger);
    
    await diaryDb.init();
    await reportsDb.init();
    await roadmapDb.init();
    await memoryDb.init();
    
    // Run migrations
    logger.info('\n📚 Migrating Agent Diaries...');
    const diaryMigrator = new DiaryMigrator(diaryDb, logger, CONFIG);
    await diaryMigrator.migrate(args);
    
    logger.info('\n📄 Migrating Field Reports...');
    const reportsMigrator = new ReportsMigrator(reportsDb, logger, CONFIG);
    await reportsMigrator.migrate(args);
    
    logger.info('\n🗺️  Migrating Roadmap Data...');
    const roadmapMigrator = new RoadmapMigrator(roadmapDb, logger, CONFIG);
    await roadmapMigrator.migrate(args);
    
    logger.info('\n🧠 Migrating Team Memory...');
    const memoryMigrator = new MemoryMigrator(memoryDb, logger, CONFIG);
    await memoryMigrator.migrate(args);
    
    // Close databases
    diaryDb.close();
    reportsDb.close();
    roadmapDb.close();
    memoryDb.close();
    
    // Print summary
    logger.printSummary();
    
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    process.exit(1);
  }
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { DatabaseManager, DiaryDatabase, ReportsDatabase, RoadmapDatabase, MemoryDatabase };