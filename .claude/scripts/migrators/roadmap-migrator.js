import fs from 'fs/promises';
import path from 'path';

export class RoadmapMigrator {
  constructor(db, logger, config) {
    this.db = db;
    this.logger = logger;
    this.config = config;
  }

  async migrate(args) {
    const roadmapFile = path.join(
      this.config.sourceRoot, 
      'docs', 
      'Roadmap', 
      'realistic-roadmap-sessions-4-21-with-adce.md'
    );
    
    try {
      await fs.access(roadmapFile);
      this.logger.info(`Processing roadmap file: ${path.basename(roadmapFile)}`);
      
      const sessions = await this.parseRoadmapFile(roadmapFile);
      let totalTasks = 0;
      
      if (!args['dry-run']) {
        await this.db.transaction(() => {
          for (const session of sessions) {
            for (const task of session.tasks) {
              this.db.insertProgressEntry(
                session.number,
                task.type,
                task.title,
                task.description,
                task.status,
                task.priority,
                task.metadata
              );
              totalTasks++;
            }
          }
        });
      } else {
        // Count tasks in dry run
        totalTasks = sessions.reduce((sum, s) => sum + s.tasks.length, 0);
      }
      
      this.logger.success(`Migrated ${sessions.length} sessions with ${totalTasks} tasks`);
      this.logger.updateStats('roadmap', 1, totalTasks, 0);
      
    } catch (error) {
      this.logger.error(`Failed to process roadmap: ${error.message}`);
      this.logger.updateStats('roadmap', 0, 0, 1);
    }
    
    // Also process other roadmap files
    await this.processAdditionalRoadmaps(args);
  }

  async parseRoadmapFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const sessions = [];
    
    // Split by session headers
    const sessionRegex = /^## Session (\d+(?:\.\d+)?)[:\s]+(.+?)$/gm;
    let match;
    const sessionStarts = [];
    
    while ((match = sessionRegex.exec(content)) !== null) {
      sessionStarts.push({
        number: parseFloat(match[1]),
        title: match[2].trim(),
        start: match.index,
        contentStart: match.index + match[0].length
      });
    }
    
    // Process each session
    for (let i = 0; i < sessionStarts.length; i++) {
      const session = sessionStarts[i];
      const endIndex = i < sessionStarts.length - 1 ? sessionStarts[i + 1].start : content.length;
      const sessionContent = content.substring(session.contentStart, endIndex);
      
      const tasks = this.parseSessionTasks(sessionContent, session.number);
      
      // Determine session status based on session number
      let status = 'pending';
      if (session.number <= 3.5) {
        status = 'completed';
      } else if (session.number === 4) {
        status = 'in_progress';
      }
      
      sessions.push({
        number: session.number,
        title: session.title,
        tasks: tasks,
        status: status
      });
    }
    
    return sessions;
  }

  parseSessionTasks(content, sessionNumber) {
    const tasks = [];
    const lines = content.split('\n');
    
    let currentPriority = 'medium';
    let inTaskList = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect priority sections
      if (trimmed.match(/high.*priority|critical|must.have/i)) {
        currentPriority = 'high';
      } else if (trimmed.match(/medium.*priority|should.have/i)) {
        currentPriority = 'medium';
      } else if (trimmed.match(/low.*priority|nice.to.have/i)) {
        currentPriority = 'low';
      }
      
      // Parse task items
      if (trimmed.startsWith('- ') || trimmed.match(/^\d+\.\s/)) {
        inTaskList = true;
        const taskText = trimmed.replace(/^[-\d.]\s+/, '').trim();
        
        if (taskText) {
          const task = this.parseTaskItem(taskText, sessionNumber, currentPriority);
          if (task) {
            tasks.push(task);
          }
        }
      } else if (trimmed.startsWith('###')) {
        // Feature section
        const featureMatch = trimmed.match(/^###\s+(.+)/);
        if (featureMatch) {
          tasks.push({
            type: 'feature',
            title: featureMatch[1].trim(),
            description: '',
            status: sessionNumber <= 3.5 ? 'completed' : 'pending',
            priority: this.mapPriority(currentPriority),
            metadata: { sessionNumber }
          });
        }
      }
    }
    
    return tasks;
  }

  parseTaskItem(text, sessionNumber, priorityText) {
    // Determine task type
    let type = 'task';
    if (text.match(/bug|fix|repair|issue/i)) {
      type = 'bug';
    } else if (text.match(/feature|implement|add|create/i)) {
      type = 'feature';
    } else if (text.match(/milestone|release|launch/i)) {
      type = 'milestone';
    } else if (text.match(/quest|story|narrative/i)) {
      type = 'quest';
    }
    
    // Clean up the title
    let title = text;
    let description = '';
    
    // Extract description if present (text in parentheses)
    const descMatch = text.match(/^(.+?)\s*\((.+)\)\s*$/);
    if (descMatch) {
      title = descMatch[1].trim();
      description = descMatch[2].trim();
    }
    
    // Remove common prefixes
    title = title.replace(/^(Implement|Add|Create|Fix|Update|Enhance)\s+/i, '');
    
    return {
      type,
      title,
      description,
      status: sessionNumber <= 3.5 ? 'completed' : 'pending',
      priority: this.mapPriority(priorityText),
      metadata: { sessionNumber }
    };
  }

  mapPriority(priorityText) {
    switch (priorityText.toLowerCase()) {
      case 'high':
      case 'critical':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
      default:
        return 2;
    }
  }

  async processAdditionalRoadmaps(args) {
    const roadmapDir = path.join(this.config.sourceRoot, 'docs', 'Roadmap');
    
    try {
      const files = await fs.readdir(roadmapDir);
      const additionalFiles = files.filter(f => 
        f.endsWith('.md') && 
        f !== 'realistic-roadmap-sessions-4-21-with-adce.md'
      );
      
      for (const file of additionalFiles) {
        try {
          const filePath = path.join(roadmapDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          // Simple task extraction for other roadmap files
          const tasks = this.extractSimpleTasks(content, file);
          
          if (tasks.length > 0 && !args['dry-run']) {
            await this.db.transaction(() => {
              for (const task of tasks) {
                this.db.insertProgressEntry(
                  99, // Special session for misc roadmap items
                  task.type,
                  task.title,
                  task.description,
                  'pending',
                  2,
                  { source: file }
                );
              }
            });
          }
          
          if (tasks.length > 0) {
            this.logger.success(`Migrated ${tasks.length} tasks from ${file}`);
            this.logger.updateStats('roadmap', 1, tasks.length, 0);
          }
          
        } catch (error) {
          this.logger.warning(`Could not process ${file}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.warning(`Could not read additional roadmap files: ${error.message}`);
    }
  }

  extractSimpleTasks(content, filename) {
    const tasks = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Look for task-like items
      if (trimmed.match(/^[-*]\s+.+/) || trimmed.match(/^\d+\.\s+.+/)) {
        const taskText = trimmed.replace(/^[-*\d.]\s+/, '').trim();
        
        if (taskText && taskText.length > 10) {
          tasks.push({
            type: 'task',
            title: taskText.substring(0, 100),
            description: taskText.length > 100 ? taskText : ''
          });
        }
      }
    }
    
    return tasks;
  }
}