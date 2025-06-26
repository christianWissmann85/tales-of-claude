/**
 * Diary summarization utilities
 * Generates summaries at different levels (daily, weekly, monthly)
 */

export class DiarySummarizer {
  constructor() {
    this.summaryOptions = {
      daily: { maxLength: 500, keyPointsCount: 5 },
      weekly: { maxLength: 1000, keyPointsCount: 10 },
      monthly: { maxLength: 1500, keyPointsCount: 15 }
    };
  }

  /**
   * Generate a summary from content
   * @param {string} content - The content to summarize
   * @param {Object} options - Summary options
   * @returns {Object} Summary with metadata
   */
  async generateSummary(content, options = {}) {
    const {
      type = 'daily',
      maxLength = this.summaryOptions[type]?.maxLength || 500
    } = options;

    if (!content || content.trim().length === 0) {
      return {
        text: 'No content available for summarization.',
        wordCount: 0,
        topics: [],
        sentiment: 'neutral'
      };
    }

    // Extract key sentences
    const sentences = this.extractSentences(content);
    const scoredSentences = this.scoreSentences(sentences);
    const topSentences = this.selectTopSentences(scoredSentences, maxLength);

    // Extract topics
    const topics = this.extractTopics(content);

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(content);

    // Create summary
    const summaryText = topSentences.join(' ');

    return {
      text: summaryText,
      wordCount: summaryText.split(/\s+/).length,
      topics: topics.slice(0, 5),
      sentiment: sentiment,
      originalLength: content.length,
      compressionRatio: (1 - (summaryText.length / content.length)).toFixed(2)
    };
  }

  /**
   * Extract sentences from content
   */
  extractSentences(content) {
    // Simple sentence extraction
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const sentences = content.match(sentenceRegex) || [];
    
    return sentences
      .map(s => s.trim())
      .filter(s => s.length > 20); // Filter out very short sentences
  }

  /**
   * Score sentences based on importance
   */
  scoreSentences(sentences) {
    const importantWords = [
      'completed', 'achieved', 'learned', 'discovered', 'implemented',
      'fixed', 'solved', 'created', 'improved', 'developed',
      'challenge', 'problem', 'solution', 'insight', 'breakthrough',
      'success', 'failure', 'issue', 'feature', 'update'
    ];

    return sentences.map((sentence, index) => {
      let score = 0;

      // Position score (earlier and later sentences often more important)
      if (index < 3) score += 2;
      if (index >= sentences.length - 3) score += 1;

      // Length score
      const wordCount = sentence.split(/\s+/).length;
      if (wordCount > 10 && wordCount < 30) score += 1;

      // Important word score
      const sentenceLower = sentence.toLowerCase();
      importantWords.forEach(word => {
        if (sentenceLower.includes(word)) {
          score += 3;
        }
      });

      // Numeric content (often indicates specifics)
      if (/\d+/.test(sentence)) score += 1;

      // Question marks (often indicate important considerations)
      if (sentence.includes('?')) score += 1;

      return { sentence, score, index };
    });
  }

  /**
   * Select top sentences within length limit
   */
  selectTopSentences(scoredSentences, maxLength) {
    // Sort by score
    const sorted = scoredSentences.sort((a, b) => b.score - a.score);
    
    const selected = [];
    let currentLength = 0;

    for (const item of sorted) {
      if (currentLength + item.sentence.length <= maxLength) {
        selected.push(item);
        currentLength += item.sentence.length;
      }
    }

    // Re-sort by original order
    return selected
      .sort((a, b) => a.index - b.index)
      .map(item => item.sentence);
  }

  /**
   * Extract key topics from content
   */
  extractTopics(content) {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4); // Only consider words > 4 chars

    // Count word frequency
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Filter out common words
    const commonWords = new Set([
      'there', 'where', 'which', 'their', 'would', 'could', 'should',
      'about', 'after', 'before', 'under', 'through', 'between',
      'these', 'those', 'being', 'having', 'doing', 'going'
    ]);

    // Get top topics
    const topics = Object.entries(wordFreq)
      .filter(([word]) => !commonWords.has(word))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    return topics;
  }

  /**
   * Analyze overall sentiment
   */
  analyzeSentiment(content) {
    const sentimentWords = {
      positive: [
        'happy', 'excited', 'success', 'achieved', 'completed', 'solved',
        'improved', 'great', 'excellent', 'fantastic', 'amazing', 'good',
        'progress', 'breakthrough', 'efficient', 'productive'
      ],
      negative: [
        'difficult', 'problem', 'issue', 'bug', 'error', 'failed',
        'stuck', 'confused', 'frustrated', 'blocked', 'wrong', 'bad',
        'slow', 'inefficient', 'broken', 'complicated'
      ]
    };

    const contentLower = content.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    sentimentWords.positive.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = contentLower.match(regex);
      if (matches) positiveCount += matches.length;
    });

    sentimentWords.negative.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = contentLower.match(regex);
      if (matches) negativeCount += matches.length;
    });

    const total = positiveCount + negativeCount;
    if (total === 0) return 'neutral';

    const positiveRatio = positiveCount / total;
    if (positiveRatio > 0.6) return 'positive';
    if (positiveRatio < 0.4) return 'negative';
    return 'mixed';
  }

  /**
   * Create a progressive summary (summarize summaries)
   */
  async createProgressiveSummary(summaries, targetType) {
    const combinedContent = summaries
      .map(s => s.content)
      .join('\n\n---\n\n');

    return this.generateSummary(combinedContent, {
      type: targetType,
      maxLength: this.summaryOptions[targetType].maxLength
    });
  }
}