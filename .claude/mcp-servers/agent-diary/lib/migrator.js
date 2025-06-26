// lib/migrator.js
const fs = require('fs').promises;
const path = require('path');
const { chunker } = require('./chunker');
const { summarizer } = require('./summarizer');
const { validateEntry } = require('./validator');

/**
 * Migrates existing markdown diary files to SQLite database
 */
class Migrator {
  constructor(db) {
    this.db = db;
    this.batchSize = 50;
    this.maxRetries = 3;
  }

  /**
   * Migrate multiple diary files
   */
  async migrateFiles(filePaths, options = {}) {
    const {
      onProgress = () => {},
      resumeFrom = null,
      validateIntegrity = true,
      generateSummaries = true
    } = options;

    const results = {
      processed: 0,
      entries: 0,
      errors: [],
      skipped: []
    };

    let startIndex = 0;
    if (resumeFrom) {
      startIndex = filePaths.findIndex(f => f === resumeFrom);
      if (startIndex === -1) startIndex = 0;
    }

    for (let i = startIndex; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      
      try {
        onProgress({
          type: 'file_start',
          file: filePath,
          index: i,
          total: filePaths.length
        });

        const result = await this.migrateFile(filePath, {
          validateIntegrity,
          generateSummaries,
          onProgress: (data) => onProgress({ ...data, file: filePath })
        });

        results.processed++;
        results.entries += result.entries;

        onProgress({
          type: 'file_complete',
          file: filePath,
          entries: result.entries,
          processed: results.processed,
          total: filePaths.length
        });

      } catch (error) {
        results.errors.push({
          file: filePath,
          error: error.message,
          stack: error.stack
        });

        onProgress({
          type: 'file_error',
          file: filePath,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Migrate a single diary file
   */
  async migrateFile(filePath, options = {}) {
    const {
      validateIntegrity = true,
      generateSummaries = true,
      onProgress = () => {}
    } = options;

    // Read file content
    const content = await fs.readFile(filePath, 'utf8');
    const agentName = this.extractAgentName(filePath);

    onProgress({ type: 'parsing', agent: agentName });

    // Parse entries from markdown
    const entries = this.parseMarkdown(content, agentName);

    onProgress({ 
      type: 'parsed', 
      agent: agentName, 
      entriesFound: entries.length 
    });

    // Process entries in batches
    let processedCount = 0;
    const batchCount = Math.ceil(entries.length / this.batchSize);

    for (let i = 0; i < entries.length; i += this.batchSize) {
      const batch = entries.slice(i, i + this.batchSize);
      
      onProgress({
        type: 'batch_start',
        batch: Math.floor(i / this.batchSize) + 1,
        totalBatches: batchCount,
        batchSize: batch.length
      });

      await this.processBatch(batch, {
        validateIntegrity,
        generateSummaries,
        onProgress
      });

      processedCount += batch.length;
      
      onProgress({
        type: 'batch_complete',
        processed: processedCount,
        total: entries.length
      });
    }

    return {
      agent: agentName,
      entries: entries.length,
      file: filePath
    };
  }

  /**
   * Process a batch of entries
   */
  async processBatch(entries, options = {}) {
    const {
      validateIntegrity = true,
      generateSummaries = true,
      onProgress = () => {}
    } = options;

    const processedEntries = [];

    for (const entry of entries) {
      try {
        // Validate entry structure
        if (validateIntegrity) {
          const validation = validateEntry(entry);
          if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
          }
        }

        // Check for chunks
        const chunks = chunker.chunkEntry(entry);
        
        if (chunks.length > 1) {
          onProgress({
            type: 'chunking',
            entryDate: entry.date,
            chunks: chunks.length
          });
        }

        // Generate summaries if requested
        if (generateSummaries && !entry.summary) {
          try {
            entry.summary = await summarizer.generateSummary(entry.content);
            onProgress({
              type: 'summary_generated',
              entryDate: entry.date
            });
          } catch (error) {
            onProgress({
              type: 'summary_error',
              entryDate: entry.date,
              error: error.message
            });
          }
        }

        // Prepare entry for database
        const dbEntry = this.prepareForDatabase(entry, chunks);
        processedEntries.push(dbEntry);

      } catch (error) {
        onProgress({
          type: 'entry_error',
          entryDate: entry.date,
          error: error.message
        });
        throw error;
      }
    }

    // Batch insert to database
    await this.batchInsert(processedEntries);
  }

  /**
   * Parse markdown content into diary entries
   */
  parseMarkdown(content, agentName) {
    const entries = [];
    
    // Split by date headers - support multiple formats
    const dateHeaderRegex = /^#{1,4}\s*(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4}|\d{4}\/\d{2}\/\d{2}|\d{2}\/\d{2}\/\d{4})/gm;
    
    const sections = content.split(dateHeaderRegex);
    
    // First section is content before any date headers
    if (sections.length <= 1) {
      // No date headers found, try alternative parsing
      return this.parseAlternativeFormat(content, agentName);
    }

    // Process sections (odd indices are dates, even indices are content)
    for (let i = 1; i < sections.length; i += 2) {
      const dateStr = sections[i];
      const content = sections[i + 1] || '';

      if (content.trim()) {
        const date = this.parseDate(dateStr);
        if (date) {
          const entry = this.createEntry(agentName, date, content.trim());
          entries.push(entry);
        }
      }
    }

    return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Parse alternative markdown formats
   */
  parseAlternativeFormat(content, agentName) {
    const entries = [];
    
    // Try to find date patterns in content
    const lines = content.split('\n');
    let currentEntry = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for date-like patterns
      const dateMatch = trimmed.match(/(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})/);
      
      if (dateMatch && (trimmed.startsWith('#') || trimmed.startsWith('**') || trimmed.length < 50)) {
        // Likely a date header
        if (currentEntry && currentEntry.content.trim()) {
          entries.push(currentEntry);
        }
        
        const date = this.parseDate(dateMatch[1]);
        if (date) {
          currentEntry = this.createEntry(agentName, date, '');
        }
      } else if (currentEntry) {
        // Add content to current entry
        currentEntry.content += line + '\n';
      }
    }
    
    // Add final entry
    if (currentEntry && currentEntry.content.trim()) {
      entries.push(currentEntry);
    }
    
    return entries;
  }

  /**
   * Create entry object
   */
  createEntry(agentName, date, content) {
    // Extract metadata from content
    const metadata = this.extractMetadata(content);
    
    return {
      agent: agentName,
      date: date.toISOString().split('T')[0],
      content: content,
      metadata: metadata,
      summary: null,
      tags: this.extractTags(content),
      wordCount: this.countWords(content),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Extract metadata from content
   */
  extractMetadata(content) {
    const metadata = {};
    
    // Extract code blocks
    const codeBlocks = content.match(/