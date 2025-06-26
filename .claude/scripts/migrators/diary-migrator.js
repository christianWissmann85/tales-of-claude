import fs from 'fs/promises';
import path from 'path';

export class DiaryMigrator {
  constructor(db, logger, config) {
    this.db = db;
    this.logger = logger;
    this.config = config;
  }

  async migrate(args) {
    const diaryPaths = await this.findDiaryFiles();
    this.logger.info(`Found ${diaryPaths.length} diary files`);

    let totalEntries = 0;
    let errors = 0;

    for (const diaryPath of diaryPaths) {
      try {
        const agentName = this.extractAgentName(diaryPath);
        const entries = await this.parseDiaryFile(diaryPath);
        
        this.logger.debug(`Processing ${entries.length} entries for ${agentName}`);

        if (!args['dry-run']) {
          await this.db.transaction(() => {
            for (const entry of entries) {
              this.db.insertDiaryEntry(
                agentName,
                entry.date,
                entry.content,
                entry.sessionNumber,
                entry.wordCount,
                entry.emotion
              );
            }
          });
        }

        totalEntries += entries.length;
        this.logger.success(`Migrated ${entries.length} entries from ${agentName}`);
      } catch (error) {
        errors++;
        this.logger.error(`Failed to process ${path.basename(diaryPath)}: ${error.message}`);
      }
    }

    this.logger.updateStats('diaries', diaryPaths.length, totalEntries, errors);
    return { files: diaryPaths.length, entries: totalEntries, errors };
  }

  async findDiaryFiles() {
    const diaryPaths = [];
    const claudeDir = path.join(this.config.sourceRoot, '.claude', 'task-agents');
    
    try {
      const entries = await fs.readdir(claudeDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const diaryPath = path.join(claudeDir, entry.name, 'diary.md');
          try {
            await fs.access(diaryPath);
            diaryPaths.push(diaryPath);
          } catch {
            // Diary file doesn't exist, skip
          }
        }
      }
    } catch (error) {
      this.logger.warning(`Could not access diary directory: ${claudeDir}`);
    }

    return diaryPaths;
  }

  extractAgentName(diaryPath) {
    const parts = diaryPath.split(path.sep);
    const agentIndex = parts.indexOf('task-agents');
    return agentIndex >= 0 && agentIndex < parts.length - 1 ? parts[agentIndex + 1] : 'unknown';
  }

  async parseDiaryFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const entries = [];
    
    // Split by session/date sections
    const sections = content.split(/^## /m).filter(s => s.trim());
    
    for (const section of sections) {
      // Skip sections that don't look like diary entries
      if (section.startsWith('Identity') || 
          section.startsWith('Accumulated Wisdom') ||
          section.startsWith('Key Learnings') ||
          section.startsWith('Technical Notes')) {
        continue;
      }
      
      const lines = section.split('\n');
      const headerLine = lines[0];
      
      // Extract session number and date
      const sessionMatch = headerLine.match(/Session\s+(\d+(?:\.\d+)?)/i);
      const dateMatch = headerLine.match(/(\d{4}-\d{2}-\d{2})/);
      
      // Also handle "June 24, 2025" format
      const monthDateMatch = headerLine.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i);
      
      let date = null;
      if (dateMatch) {
        date = dateMatch[1];
      } else if (monthDateMatch) {
        // Convert to ISO format
        const dateObj = new Date(monthDateMatch[0]);
        date = dateObj.toISOString().split('T')[0];
      }
      
      if (!date) continue;
      
      const sessionNumber = sessionMatch ? parseFloat(sessionMatch[1]) : null;
      const entryContent = lines.slice(1).join('\n').trim();
      
      if (entryContent) {
        const wordCount = entryContent.split(/\s+/).length;
        const emotion = this.detectEmotion(entryContent);
        
        // Split large entries into chunks if needed
        if (wordCount > 500) {
          const chunks = this.chunkContent(entryContent);
          for (let i = 0; i < chunks.length; i++) {
            entries.push({
              date,
              content: chunks[i],
              sessionNumber,
              wordCount: chunks[i].split(/\s+/).length,
              emotion: i === 0 ? emotion : 'neutral'
            });
          }
        } else {
          entries.push({
            date,
            content: entryContent,
            sessionNumber,
            wordCount,
            emotion
          });
        }
      }
    }
    
    return entries;
  }

  chunkContent(content) {
    const chunks = [];
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if ((currentChunk + '\n\n' + paragraph).split(/\s+/).length > 450) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = paragraph;
        } else {
          // Single paragraph is too long, split by sentences
          const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
          for (const sentence of sentences) {
            if ((currentChunk + ' ' + sentence).split(/\s+/).length > 450) {
              if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
              } else {
                chunks.push(sentence.trim());
              }
            } else {
              currentChunk += (currentChunk ? ' ' : '') + sentence;
            }
          }
        }
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  detectEmotion(content) {
    const emotionPatterns = {
      happy: /\b(happy|excited|thrilled|pleased|successful|achieved|joy|celebrate|amazing|wonderful)\b/i,
      frustrated: /\b(frustrated|stuck|difficult|blocked|annoyed|struggling|issue|problem|bug)\b/i,
      focused: /\b(focused|concentrated|working|implementing|developing|building|creating|coding)\b/i,
      confused: /\b(confused|unclear|not sure|wondering|puzzled|uncertain|mystery)\b/i,
      accomplished: /\b(completed|finished|done|accomplished|solved|fixed|success|victory)\b/i,
      curious: /\b(curious|interesting|wondering|exploring|discovering|learning)\b/i,
      worried: /\b(worried|concerned|anxious|nervous|unsure|risky)\b/i
    };

    // Count emotion matches
    const emotionScores = {};
    for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
      const matches = content.match(pattern) || [];
      if (matches.length > 0) {
        emotionScores[emotion] = matches.length;
      }
    }
    
    // Return emotion with highest score
    if (Object.keys(emotionScores).length > 0) {
      return Object.entries(emotionScores).sort((a, b) => b[1] - a[1])[0][0];
    }
    
    return 'neutral';
  }
}