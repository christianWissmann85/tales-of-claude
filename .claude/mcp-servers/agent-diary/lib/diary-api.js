import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Chunker } from './chunker.js';
import { DiarySummarizer } from './summarizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DiaryAPI {
  constructor(dbPath = './data/diary.db') {
    this.dbPath = dbPath;
    this.db = null;
    this.chunker = new Chunker();
    this.summarizer = new DiarySummarizer();
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
    // Agent operations
    this.stmts = {
      // Agent management
      getAgent: this.db.prepare('SELECT * FROM agents WHERE name = ?'),
      createAgent: this.db.prepare(`
        INSERT INTO agents (name, description, is_active, metadata)
        VALUES (?, ?, ?, ?)
      `),

      // Entry operations
      createEntry: this.db.prepare(`
        INSERT INTO diary_entries (agent_id, title, entry_date, entry_type, status, priority, tags, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `),
      
      getEntries: this.db.prepare(`
        SELECT de.*, a.name as agent_name
        FROM diary_entries de
        JOIN agents a ON de.agent_id = a.id
        WHERE de.agent_id = ? AND de.status = 'active'
        ORDER BY de.entry_date DESC, de.created_at DESC
        LIMIT ? OFFSET ?
      `),

      getEntriesWithFilters: this.db.prepare(`
        SELECT de.*, a.name as agent_name
        FROM diary_entries de
        JOIN agents a ON de.agent_id = a.id
        WHERE de.agent_id = ? AND de.status = 'active'
        AND de.entry_date BETWEEN ? AND ?
        ORDER BY de.entry_date DESC, de.created_at DESC
        LIMIT ? OFFSET ?
      `),

      // Chunk operations
      insertChunk: this.db.prepare(`
        INSERT INTO diary_chunks (entry_id, chunk_order, content, char_count)
        VALUES (?, ?, ?, ?)
      `),

      getChunks: this.db.prepare(`
        SELECT * FROM diary_chunks
        WHERE entry_id = ?
        ORDER BY chunk_order ASC
      `),

      getChunksForEntries: this.db.prepare(`
        SELECT dc.*, de.title, de.entry_date, a.name as agent_name
        FROM diary_chunks dc
        JOIN diary_entries de ON dc.entry_id = de.id
        JOIN agents a ON de.agent_id = a.id
        WHERE de.id IN (${Array(10).fill('?').join(',')}) 
        ORDER BY de.entry_date DESC, dc.chunk_order ASC
      `),

      // Search operations
      searchEntries: this.db.prepare(`
        SELECT de.id, de.title, de.entry_date, de.entry_type, de.tags,
               a.name as agent_name, ds.content as snippet
        FROM diary_search ds
        JOIN diary_chunks dc ON ds.rowid = dc.id
        JOIN diary_entries de ON dc.entry_id = de.id
        JOIN agents a ON de.agent_id = a.id
        WHERE diary_search MATCH ?
        ORDER BY bm25(diary_search) ASC
        LIMIT ? OFFSET ?
      `),

      // Summary operations
      getSummary: this.db.prepare(`
        SELECT * FROM summaries
        WHERE agent_id = ? AND summary_type = ? AND summary_date = ?
      `),

      createSummary: this.db.prepare(`
        INSERT INTO summaries (summary_type, target_id, agent_id, summary_date, title, content, word_count, source_count, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),

      // Emotion operations
      insertEmotion: this.db.prepare(`
        INSERT INTO emotions (entry_id, chunk_id, emotion_type, intensity, confidence, detected_keywords, context_snippet)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `),

      getEmotions: this.db.prepare(`
        SELECT e.*, de.entry_date, a.name as agent_name
        FROM emotions e
        JOIN diary_entries de ON e.entry_id = de.id
        JOIN agents a ON de.agent_id = a.id
        WHERE de.agent_id = ? AND de.entry_date BETWEEN ? AND ?
        ORDER BY de.entry_date DESC, e.intensity DESC
      `),

      // Relationship operations
      upsertRelationship: this.db.prepare(`
        INSERT INTO relationships (from_agent_id, to_agent_id, relationship_type, strength, context, first_interaction_date, last_interaction_date, interaction_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(from_agent_id, to_agent_id, relationship_type) DO UPDATE SET
          strength = ?,
          context = ?,
          last_interaction_date = ?,
          interaction_count = interaction_count + 1,
          updated_at = CURRENT_TIMESTAMP
      `),

      getRelationships: this.db.prepare(`
        SELECT r.*, a1.name as from_agent_name, a2.name as to_agent_name
        FROM relationships r
        JOIN agents a1 ON r.from_agent_id = a1.id
        JOIN agents a2 ON r.to_agent_id = a2.id
        WHERE r.from_agent_id = ?
        ORDER BY r.strength DESC, r.interaction_count DESC
      `)
    };
  }

  // API Method 1: Save diary entry with automatic chunking
  async saveEntry(agentName, entryData) {
    const transaction = this.db.transaction(() => {
      try {
        // Ensure agent exists
        const agent = this.ensureAgent(agentName);
        
        // Validate entry data
        const {
          title,
          content,
          entryDate = new Date().toISOString().split('T')[0],
          entryType = 'general',
          priority = 0,
          tags = '',
          metadata = {}
        } = entryData;

        if (!title || !content) {
          throw new Error('Title and content are required');
        }

        // Create entry record
        const entryResult = this.stmts.createEntry.run(
          agent.id,
          title,
          entryDate,
          entryType,
          'active',
          priority,
          tags,
          JSON.stringify(metadata)
        );

        const entryId = entryResult.lastInsertRowid;

        // Chunk the content
        const chunks = this.chunker.chunkContent(content, {
          targetSize: 2500,
          maxSize: 3500,
          preserveCodeBlocks: true
        });

        // Insert chunks
        chunks.forEach((chunk, index) => {
          this.stmts.insertChunk.run(
            entryId,
            index + 1,
            chunk.content,
            chunk.size
          );
        });

        // Analyze emotions for the entry
        this.analyzeAndStoreEmotions(entryId, chunks);

        // Extract and store relationships
        this.extractRelationships(agent.id, content, entryDate);

        return {
          success: true,
          entryId: entryId,
          chunkCount: chunks.length,
          totalChars: content.length,
          agent: agentName
        };

      } catch (error) {
        throw new Error(`Failed to save entry: ${error.message}`);
      }
    });

    return transaction();
  }

  // API Method 2: Recall specific entries with filters
  async recallEntries(agentName, options = {}) {
    try {
      const agent = this.ensureAgent(agentName);
      
      const {
        limit = 10,
        offset = 0,
        dateStart = '2020-01-01',
        dateEnd = new Date().toISOString().split('T')[0],
        entryType = null,
        tags = null,
        includeContent = true,
        query = null
      } = options;

      let entries;
      
      if (query) {
        // Use full-text search if query provided
        const searchResults = this.stmts.searchEntries.all(query, limit, offset);
        const entryIds = searchResults.map(r => r.id);
        
        if (entryIds.length === 0) {
          return { entries: [], total: 0, hasMore: false };
        }

        // Get full entry details
        entries = this.getEntriesByIds(entryIds);
      } else {
        // Standard filtered query
        entries = this.stmts.getEntriesWithFilters.all(
          agent.id, dateStart, dateEnd, limit, offset
        );
      }

      // Apply additional filters
      if (entryType) {
        entries = entries.filter(e => e.entry_type === entryType);
      }
      
      if (tags) {
        const tagList = tags.split(',').map(t => t.trim().toLowerCase());
        entries = entries.filter(e => 
          tagList.some(tag => 
            e.tags && e.tags.toLowerCase().includes(tag)
          )
        );
      }

      // Add content if requested
      if (includeContent) {
        entries = entries.map(entry => {
          const chunks = this.stmts.getChunks.all(entry.id);
          return {
            ...entry,
            content: chunks.map(c => c.content).join(''),
            chunkCount: chunks.length,
            metadata: entry.metadata ? JSON.parse(entry.metadata) : {}
          };
        });
      }

      return {
        entries,
        total: entries.length,
        hasMore: entries.length === limit,
        agent: agentName
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to recall entries: ${error.message}`,
        entries: []
      };
    }
  }

  // API Method 3: Full-text search across all diaries
  async searchDiaries(searchOptions = {}) {
    try {
      const {
        query,
        agentFilter = null,
        dateStart = '2020-01-01',
        dateEnd = new Date().toISOString().split('T')[0],
        entryTypes = [],
        limit = 20,
        offset = 0,
        includeSnippets = true
      } = searchOptions;

      if (!query) {
        throw new Error('Search query is required');
      }

      // Build FTS5 query - for simple search, just use the query
      // FTS5 doesn't support column filters with : syntax by default
      let ftsQuery = query;

      const searchResults = this.stmts.searchEntries.all(ftsQuery, limit * 2, offset); // Get extra for filtering

      let results = searchResults.map(result => ({
        entryId: result.id,
        title: result.title,
        agent: result.agent_name,
        date: result.entry_date,
        type: result.entry_type,
        tags: result.tags,
        snippet: includeSnippets ? this.extractSnippet(result.snippet, query) : null,
        relevanceScore: this.calculateRelevanceScore(result, query)
      }));

      // Apply post-search filters
      if (agentFilter) {
        results = results.filter(r => r.agent === agentFilter);
      }
      if (entryTypes.length > 0) {
        results = results.filter(r => entryTypes.includes(r.type));
      }
      
      // Limit results after filtering
      results = results.slice(0, limit);

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      return {
        results,
        query,
        total: results.length,
        hasMore: results.length === limit,
        searchTime: Date.now()
      };

    } catch (error) {
      return {
        success: false,
        error: `Search failed: ${error.message}`,
        results: []
      };
    }
  }

  // API Method 4: Get agent summaries (daily/weekly/monthly)
  async getSummary(agentName, summaryType, date) {
    try {
      const agent = this.ensureAgent(agentName);
      
      // Check if summary already exists
      const existing = this.stmts.getSummary.get(agent.id, summaryType, date);
      if (existing) {
        return {
          ...existing,
          metadata: existing.metadata ? JSON.parse(existing.metadata) : {},
          cached: true
        };
      }

      // Generate new summary
      const summary = await this.generateSummary(agent.id, summaryType, date);
      
      if (!summary) {
        return {
          success: false,
          error: 'No content available for summary generation'
        };
      }

      // Store the generated summary
      const summaryResult = this.stmts.createSummary.run(
        summaryType,
        agent.id,
        agent.id,
        date,
        summary.title,
        summary.content,
        summary.wordCount,
        summary.sourceCount,
        JSON.stringify(summary.metadata || {})
      );

      return {
        id: summaryResult.lastInsertRowid,
        ...summary,
        agent: agentName,
        cached: false
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to generate summary: ${error.message}`
      };
    }
  }

  // API Method 5: Track cross-agent relationships
  async trackRelationships(fromAgent, toAgent, relationshipData) {
    try {
      const fromAgentRecord = this.ensureAgent(fromAgent);
      const toAgentRecord = this.ensureAgent(toAgent);

      const {
        type = 'collaboration',
        strength = 0.5,
        context = '',
        date = new Date().toISOString().split('T')[0]
      } = relationshipData;

      // Validate strength
      const validStrength = Math.max(0, Math.min(1, parseFloat(strength)));

      this.stmts.upsertRelationship.run(
        fromAgentRecord.id,
        toAgentRecord.id,
        type,
        validStrength,
        context,
        date,
        date,
        validStrength,
        context,
        date
      );

      return {
        success: true,
        relationship: {
          from: fromAgent,
          to: toAgent,
          type,
          strength: validStrength,
          context,
          date
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to track relationship: ${error.message}`
      };
    }
  }

  // API Method 6: Get emotion analysis for entries
  async getEmotions(agentName, options = {}) {
    try {
      const agent = this.ensureAgent(agentName);
      
      const {
        dateStart = '2020-01-01',
        dateEnd = new Date().toISOString().split('T')[0],
        emotionType = null,
        limit = 100
      } = options;

      let emotions = this.stmts.getEmotions.all(
        agent.id,
        dateStart,
        dateEnd
      );

      // Filter by emotion type if specified
      if (emotionType) {
        emotions = emotions.filter(e => e.emotion_type === emotionType);
      }

      // Limit results
      emotions = emotions.slice(0, limit);

      // Group by date and calculate daily trends
      const dailyTrends = {};
      emotions.forEach(emotion => {
        const date = emotion.entry_date;
        if (!dailyTrends[date]) {
          dailyTrends[date] = {
            positive: 0,
            negative: 0,
            neutral: 0,
            total: 0
          };
        }

        // Categorize emotions
        const category = this.categorizeEmotion(emotion.emotion_type);
        dailyTrends[date][category] += emotion.intensity;
        dailyTrends[date].total++;
      });

      // Calculate averages
      Object.keys(dailyTrends).forEach(date => {
        const trend = dailyTrends[date];
        trend.positive /= trend.total;
        trend.negative /= trend.total;
        trend.neutral /= trend.total;
        trend.overallMood = trend.positive - trend.negative;
      });

      return {
        emotions,
        dailyTrends,
        summary: {
          totalEmotions: emotions.length,
          dateRange: { start: dateStart, end: dateEnd },
          averageMood: this.calculateAverageMood(emotions)
        },
        agent: agentName
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get emotions: ${error.message}`,
        emotions: []
      };
    }
  }

  // Helper Methods

  ensureAgent(agentName) {
    let agent = this.stmts.getAgent.get(agentName);
    
    if (!agent) {
      // Create new agent
      const result = this.stmts.createAgent.run(
        agentName,
        `Agent ${agentName}`,
        1, // is_active
        JSON.stringify({ autoCreated: true })
      );
      
      agent = {
        id: result.lastInsertRowid,
        name: agentName,
        description: `Agent ${agentName}`,
        is_active: 1
      };
    }
    
    return agent;
  }

  analyzeAndStoreEmotions(entryId, chunks) {
    chunks.forEach((chunk, index) => {
      const emotions = this.detectEmotions(chunk.content);
      
      emotions.forEach(emotion => {
        this.stmts.insertEmotion.run(
          entryId,
          null, // chunk_id would be set if we had chunk IDs
          emotion.type,
          emotion.intensity,
          emotion.confidence,
          emotion.keywords.join(','),
          chunk.content.substring(0, 200)
        );
      });
    });
  }

  detectEmotions(text) {
    const emotionPatterns = {
      joy: /\b(happy|excited|thrilled|delighted|pleased|cheerful|joyful|elated)\b/gi,
      sadness: /\b(sad|unhappy|depressed|melancholy|sorrowful|dejected|miserable)\b/gi,
      anger: /\b(angry|furious|mad|irritated|annoyed|frustrated|enraged|livid)\b/gi,
      fear: /\b(afraid|scared|terrified|anxious|worried|nervous|frightened|alarmed)\b/gi,
      surprise: /\b(surprised|amazed|astonished|shocked|stunned|bewildered|startled)\b/gi,
      disgust: /\b(disgusted|revolted|repulsed|sickened|nauseated|appalled)\b/gi
    };

    const emotions = [];
    
    for (const [emotionType, pattern] of Object.entries(emotionPatterns)) {
      const matches = text.match(pattern) || [];
      if (matches.length > 0) {
        emotions.push({
          type: emotionType,
          intensity: Math.min(1, matches.length * 0.2),
          confidence: 0.7 + (matches.length * 0.1),
          keywords: [...new Set(matches)]
        });
      }
    }

    // Default neutral emotion if no specific emotions detected
    if (emotions.length === 0) {
      emotions.push({
        type: 'neutral',
        intensity: 0.5,
        confidence: 0.8,
        keywords: []
      });
    }

    return emotions;
  }

  extractRelationships(agentId, content, entryDate) {
    // Pattern to detect mentions of other agents
    const agentMentionPattern = /\b([A-Z][a-z]+(?:-[A-Z][a-z]+)*)\b/g;
    const mentions = content.match(agentMentionPattern) || [];
    
    const commonNames = new Set(['The', 'This', 'That', 'Here', 'There', 'When', 'Where', 'What', 'Why', 'How']);
    
    mentions.forEach(mention => {
      if (!commonNames.has(mention)) {
        // Check if this might be an agent name
        const potentialAgent = this.stmts.getAgent.get(mention);
        if (potentialAgent && potentialAgent.id !== agentId) {
          // Determine relationship type based on context
          const context = this.extractContext(content, mention);
          const relationshipType = this.inferRelationshipType(context);
          
          this.stmts.upsertRelationship.run(
            agentId,
            potentialAgent.id,
            relationshipType,
            0.5, // default strength
            context,
            entryDate,
            entryDate,
            0.5,
            context,
            entryDate
          );
        }
      }
    });
  }

  extractContext(content, mention, windowSize = 50) {
    const index = content.indexOf(mention);
    if (index === -1) return '';
    
    const start = Math.max(0, index - windowSize);
    const end = Math.min(content.length, index + mention.length + windowSize);
    
    return content.substring(start, end).trim();
  }

  inferRelationshipType(context) {
    const contextLower = context.toLowerCase();
    
    if (/\b(worked with|collaborated|paired|teamed)\b/.test(contextLower)) {
      return 'collaboration';
    } else if (/\b(helped|assisted|supported)\b/.test(contextLower)) {
      return 'support';
    } else if (/\b(learned from|taught by|mentored)\b/.test(contextLower)) {
      return 'mentorship';
    } else if (/\b(disagreed|conflicted|argued)\b/.test(contextLower)) {
      return 'conflict';
    } else {
      return 'mention';
    }
  }

  getEntriesByIds(entryIds) {
    const placeholders = entryIds.map(() => '?').join(',');
    const query = `
      SELECT de.*, a.name as agent_name
      FROM diary_entries de
      JOIN agents a ON de.agent_id = a.id
      WHERE de.id IN (${placeholders})
      ORDER BY de.entry_date DESC, de.created_at DESC
    `;
    
    return this.db.prepare(query).all(...entryIds);
  }

  extractSnippet(content, query, maxLength = 200) {
    if (!content) return '';
    
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    
    const index = contentLower.indexOf(queryLower);
    if (index === -1) {
      // Try to find individual query words
      const words = queryLower.split(/\s+/);
      for (const word of words) {
        const wordIndex = contentLower.indexOf(word);
        if (wordIndex !== -1) {
          const start = Math.max(0, wordIndex - 50);
          const end = Math.min(content.length, wordIndex + word.length + 150);
          return '...' + content.substring(start, end).trim() + '...';
        }
      }
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
    const titleLower = (result.title || '').toLowerCase();
    const tagsLower = (result.tags || '').toLowerCase();
    
    // Title matches are most important
    if (titleLower.includes(queryLower)) {
      score += 100;
    }
    
    // Tag matches are also valuable
    if (tagsLower.includes(queryLower)) {
      score += 50;
    }
    
    // Individual word matches
    const queryWords = queryLower.split(/\s+/);
    queryWords.forEach(word => {
      if (titleLower.includes(word)) score += 20;
      if (tagsLower.includes(word)) score += 10;
    });
    
    // Recent entries get a slight boost
    const daysSinceEntry = (Date.now() - new Date(result.entry_date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceEntry < 7) score += 10;
    else if (daysSinceEntry < 30) score += 5;
    
    return score;
  }

  async generateSummary(agentId, summaryType, date) {
    // Get entries for the summary period
    const entries = this.getEntriesForSummary(agentId, summaryType, date);
    
    if (entries.length === 0) {
      return null;
    }
    
    // Combine all content
    const allContent = entries.map(entry => {
      const chunks = this.stmts.getChunks.all(entry.id);
      return chunks.map(c => c.content).join('');
    }).join('\n\n---\n\n');
    
    // Use the summarizer
    const summary = await this.summarizer.generateSummary(allContent, {
      type: summaryType,
      maxLength: summaryType === 'daily' ? 500 : summaryType === 'weekly' ? 1000 : 1500
    });
    
    return {
      title: `${summaryType.charAt(0).toUpperCase() + summaryType.slice(1)} Summary - ${date}`,
      content: summary.text,
      wordCount: summary.wordCount,
      sourceCount: entries.length,
      metadata: {
        keyTopics: summary.topics,
        sentiment: summary.sentiment,
        entryIds: entries.map(e => e.id)
      }
    };
  }

  getEntriesForSummary(agentId, summaryType, date) {
    let startDate, endDate;
    const targetDate = new Date(date);
    
    switch (summaryType) {
      case 'daily':
        startDate = date;
        endDate = date;
        break;
      
      case 'weekly':
        // Get start of week (Monday)
        const dayOfWeek = targetDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(targetDate);
        startDate.setDate(targetDate.getDate() - daysToMonday);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        startDate = startDate.toISOString().split('T')[0];
        endDate = endDate.toISOString().split('T')[0];
        break;
      
      case 'monthly':
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        startDate = startDate.toISOString().split('T')[0];
        endDate = endDate.toISOString().split('T')[0];
        break;
      
      default:
        throw new Error(`Unknown summary type: ${summaryType}`);
    }
    
    return this.stmts.getEntriesWithFilters.all(
      agentId,
      startDate,
      endDate,
      1000, // Get all entries for the period
      0
    );
  }

  categorizeEmotion(emotionType) {
    const positiveEmotions = ['joy', 'surprise', 'love', 'excitement', 'gratitude'];
    const negativeEmotions = ['sadness', 'anger', 'fear', 'disgust', 'disappointment'];
    
    if (positiveEmotions.includes(emotionType)) return 'positive';
    if (negativeEmotions.includes(emotionType)) return 'negative';
    return 'neutral';
  }

  calculateAverageMood(emotions) {
    if (emotions.length === 0) return 0;
    
    let totalMood = 0;
    emotions.forEach(emotion => {
      const category = this.categorizeEmotion(emotion.emotion_type);
      if (category === 'positive') {
        totalMood += emotion.intensity;
      } else if (category === 'negative') {
        totalMood -= emotion.intensity;
      }
    });
    
    return totalMood / emotions.length;
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export { DiaryAPI };