/**
 * Content chunking utility for diary entries
 * Splits large content into manageable chunks while preserving context
 */

export class Chunker {
  constructor() {
    this.defaultOptions = {
      targetSize: 2500,
      maxSize: 3500,
      preserveCodeBlocks: true,
      preserveSentences: true
    };
  }

  /**
   * Chunk content into smaller pieces
   * @param {string} content - The content to chunk
   * @param {Object} options - Chunking options
   * @returns {Array} Array of chunks with content and metadata
   */
  chunkContent(content, options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    
    if (!content || content.length <= opts.targetSize) {
      return [{
        content: content || '',
        size: content ? content.length : 0,
        order: 1
      }];
    }

    // If we need to preserve code blocks, extract them first
    if (opts.preserveCodeBlocks) {
      return this.chunkWithCodeBlocks(content, opts);
    }

    // Otherwise, do simple sentence-based chunking
    return this.chunkBySentences(content, opts);
  }

  /**
   * Chunk content while preserving code blocks
   */
  chunkWithCodeBlocks(content, options) {
    const chunks = [];
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks = [];
    
    // Extract code blocks
    let match;
    let lastIndex = 0;
    const parts = [];
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }
      
      // Add code block
      parts.push({
        type: 'code',
        content: match[0]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }

    // Now chunk the parts
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const part of parts) {
      if (part.type === 'code') {
        // If code block is too large, it gets its own chunk
        if (part.content.length > options.maxSize) {
          if (currentChunk) {
            chunks.push({
              content: currentChunk.trim(),
              size: currentChunk.length,
              order: ++chunkIndex
            });
            currentChunk = '';
          }
          
          chunks.push({
            content: part.content,
            size: part.content.length,
            order: ++chunkIndex,
            hasCode: true
          });
        } else if (currentChunk.length + part.content.length > options.targetSize) {
          // Start new chunk
          chunks.push({
            content: currentChunk.trim(),
            size: currentChunk.length,
            order: ++chunkIndex
          });
          currentChunk = part.content;
        } else {
          currentChunk += part.content;
        }
      } else {
        // Text content - chunk by sentences
        const sentences = this.splitIntoSentences(part.content);
        
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > options.targetSize && currentChunk.length > 0) {
            chunks.push({
              content: currentChunk.trim(),
              size: currentChunk.length,
              order: ++chunkIndex
            });
            currentChunk = sentence;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          }
        }
      }
    }
    
    // Add final chunk
    if (currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        size: currentChunk.length,
        order: ++chunkIndex
      });
    }
    
    return chunks;
  }

  /**
   * Simple sentence-based chunking
   */
  chunkBySentences(content, options) {
    const chunks = [];
    const sentences = this.splitIntoSentences(content);
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > options.targetSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          size: currentChunk.length,
          order: ++chunkIndex
        });
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    
    // Add final chunk
    if (currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        size: currentChunk.length,
        order: ++chunkIndex
      });
    }
    
    return chunks;
  }

  /**
   * Split text into sentences
   */
  splitIntoSentences(text) {
    // Simple sentence splitting - can be improved
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const sentences = text.match(sentenceRegex) || [text];
    
    return sentences.map(s => s.trim()).filter(s => s.length > 0);
  }

  /**
   * Calculate chunk statistics
   */
  getChunkStats(chunks) {
    return {
      totalChunks: chunks.length,
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      averageSize: Math.round(chunks.reduce((sum, chunk) => sum + chunk.size, 0) / chunks.length),
      minSize: Math.min(...chunks.map(c => c.size)),
      maxSize: Math.max(...chunks.map(c => c.size))
    };
  }
}