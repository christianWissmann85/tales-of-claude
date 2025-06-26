-- Agent Diary MCP Tool Database Schema
-- SQLite database with FTS5 full-text search support

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Table: agents
-- Stores information about all agents in the system
CREATE TABLE agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSON -- Additional agent configuration/settings
);

-- Table: diary_entries
-- Main diary entries with metadata
CREATE TABLE diary_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    entry_date DATE NOT NULL,
    entry_type TEXT NOT NULL DEFAULT 'general', -- general, task, reflection, interaction, etc.
    status TEXT NOT NULL DEFAULT 'active', -- active, archived, deleted
    priority INTEGER DEFAULT 0, -- 0=normal, 1=important, 2=critical
    tags TEXT, -- Comma-separated tags
    word_count INTEGER DEFAULT 0,
    chunk_count INTEGER DEFAULT 0,
    has_summary BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata JSON, -- Additional entry-specific data
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Table: diary_chunks
-- Content chunks (2-3KB each) for efficient storage and retrieval
CREATE TABLE diary_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL,
    chunk_order INTEGER NOT NULL, -- Order within the entry
    content TEXT NOT NULL, -- 2-3KB of diary content
    content_hash TEXT, -- SHA256 hash for deduplication
    char_count INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entry_id) REFERENCES diary_entries(id) ON DELETE CASCADE,
    UNIQUE(entry_id, chunk_order)
);

-- Table: relationships
-- Cross-agent connections and interactions
CREATE TABLE relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_agent_id INTEGER NOT NULL,
    to_agent_id INTEGER NOT NULL,
    relationship_type TEXT NOT NULL, -- collaboration, mention, conflict, support, etc.
    strength REAL DEFAULT 0.5, -- 0.0 to 1.0 relationship strength
    context TEXT, -- Description of the relationship context
    first_interaction_date DATE,
    last_interaction_date DATE,
    interaction_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    FOREIGN KEY (from_agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    FOREIGN KEY (to_agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    UNIQUE(from_agent_id, to_agent_id, relationship_type)
);

-- Table: emotions
-- Sentiment and emotion tracking for diary entries
CREATE TABLE emotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL,
    chunk_id INTEGER, -- Optional: emotion for specific chunk
    emotion_type TEXT NOT NULL, -- joy, sadness, anger, fear, surprise, disgust, neutral
    intensity REAL NOT NULL, -- 0.0 to 1.0
    confidence REAL NOT NULL, -- 0.0 to 1.0 confidence in detection
    detected_keywords TEXT, -- Keywords that triggered emotion detection
    context_snippet TEXT, -- Relevant text snippet
    analysis_method TEXT DEFAULT 'auto', -- auto, manual, imported
    analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    FOREIGN KEY (entry_id) REFERENCES diary_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (chunk_id) REFERENCES diary_chunks(id) ON DELETE CASCADE
);

-- Table: summaries
-- Progressive summaries at different levels
CREATE TABLE summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    summary_type TEXT NOT NULL, -- entry, daily, weekly, monthly, yearly
    target_id INTEGER NOT NULL, -- ID of the target (entry_id, agent_id, etc.)
    agent_id INTEGER NOT NULL,
    summary_date DATE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    source_count INTEGER DEFAULT 1, -- Number of sources summarized
    summary_method TEXT DEFAULT 'auto', -- auto, manual, template
    quality_score REAL, -- 0.0 to 1.0 quality assessment
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Table: entry_relationships
-- Links between diary entries (references, follow-ups, etc.)
CREATE TABLE entry_relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_entry_id INTEGER NOT NULL,
    to_entry_id INTEGER NOT NULL,
    relationship_type TEXT NOT NULL, -- reference, follow_up, continuation, correction
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_entry_id) REFERENCES diary_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (to_entry_id) REFERENCES diary_entries(id) ON DELETE CASCADE,
    UNIQUE(from_entry_id, to_entry_id, relationship_type)
);

-- FTS5 Virtual Table: diary_search
-- Full-text search across diary content
CREATE VIRTUAL TABLE diary_search USING fts5(
    title,
    content,
    tags,
    agent_name,
    entry_type,
    entry_date,
    content='',
    contentless_delete=1
);

-- Performance Indexes
CREATE INDEX idx_agents_name ON agents(name);
CREATE INDEX idx_agents_active ON agents(is_active);

CREATE INDEX idx_diary_entries_agent_date ON diary_entries(agent_id, entry_date DESC);
CREATE INDEX idx_diary_entries_type ON diary_entries(entry_type);
CREATE INDEX idx_diary_entries_status ON diary_entries(status);
CREATE INDEX idx_diary_entries_date ON diary_entries(entry_date DESC);
CREATE INDEX idx_diary_entries_tags ON diary_entries(tags);
CREATE INDEX idx_diary_entries_updated ON diary_entries(updated_at DESC);

CREATE INDEX idx_diary_chunks_entry ON diary_chunks(entry_id, chunk_order);
CREATE INDEX idx_diary_chunks_hash ON diary_chunks(content_hash);

CREATE INDEX idx_relationships_from_agent ON relationships(from_agent_id);
CREATE INDEX idx_relationships_to_agent ON relationships(to_agent_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);
CREATE INDEX idx_relationships_strength ON relationships(strength DESC);

CREATE INDEX idx_emotions_entry ON emotions(entry_id);
CREATE INDEX idx_emotions_type_intensity ON emotions(emotion_type, intensity DESC);
CREATE INDEX idx_emotions_date ON emotions(analyzed_at DESC);

CREATE INDEX idx_summaries_type_agent ON summaries(summary_type, agent_id);
CREATE INDEX idx_summaries_date ON summaries(summary_date DESC);
CREATE INDEX idx_summaries_target ON summaries(target_id, summary_type);

CREATE INDEX idx_entry_relationships_from ON entry_relationships(from_entry_id);
CREATE INDEX idx_entry_relationships_to ON entry_relationships(to_entry_id);

-- Triggers for maintaining data consistency and automation

-- Trigger: Update agents.updated_at on changes
CREATE TRIGGER tr_agents_updated_at
    AFTER UPDATE ON agents
    FOR EACH ROW
BEGIN
    UPDATE agents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger: Update diary_entries.updated_at on changes
CREATE TRIGGER tr_diary_entries_updated_at
    AFTER UPDATE ON diary_entries
    FOR EACH ROW
BEGIN
    UPDATE diary_entries SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger: Update word_count and chunk_count when chunks are added/updated
CREATE TRIGGER tr_update_entry_stats_insert
    AFTER INSERT ON diary_chunks
    FOR EACH ROW
BEGIN
    UPDATE diary_entries 
    SET 
        word_count = (
            SELECT SUM(LENGTH(content) - LENGTH(REPLACE(content, ' ', '')) + 1)
            FROM diary_chunks 
            WHERE entry_id = NEW.entry_id
        ),
        chunk_count = (
            SELECT COUNT(*) 
            FROM diary_chunks 
            WHERE entry_id = NEW.entry_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.entry_id;
END;

CREATE TRIGGER tr_update_entry_stats_delete
    AFTER DELETE ON diary_chunks
    FOR EACH ROW
BEGIN
    UPDATE diary_entries 
    SET 
        word_count = (
            SELECT COALESCE(SUM(LENGTH(content) - LENGTH(REPLACE(content, ' ', '')) + 1), 0)
            FROM diary_chunks 
            WHERE entry_id = OLD.entry_id
        ),
        chunk_count = (
            SELECT COUNT(*) 
            FROM diary_chunks 
            WHERE entry_id = OLD.entry_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.entry_id;
END;

-- Trigger: Populate FTS5 table when diary entries and chunks are added/updated
CREATE TRIGGER tr_diary_search_insert
    AFTER INSERT ON diary_chunks
    FOR EACH ROW
BEGIN
    INSERT INTO diary_search(rowid, title, content, tags, agent_name, entry_type, entry_date)
    SELECT 
        NEW.id,
        de.title,
        NEW.content,
        de.tags,
        a.name,
        de.entry_type,
        de.entry_date
    FROM diary_entries de
    JOIN agents a ON de.agent_id = a.id
    WHERE de.id = NEW.entry_id;
END;

CREATE TRIGGER tr_diary_search_update
    AFTER UPDATE ON diary_chunks
    FOR EACH ROW
BEGIN
    UPDATE diary_search 
    SET 
        content = NEW.content
    WHERE rowid = NEW.id;
END;

CREATE TRIGGER tr_diary_search_delete
    AFTER DELETE ON diary_chunks
    FOR EACH ROW
BEGIN
    DELETE FROM diary_search WHERE rowid = OLD.id;
END;

-- Trigger: Update relationship interaction counts
CREATE TRIGGER tr_update_relationship_stats
    AFTER INSERT ON diary_entries
    FOR EACH ROW
    WHEN NEW.tags IS NOT NULL AND NEW.tags != ''
BEGIN
    -- This would be expanded based on how agent mentions are tracked in tags
    UPDATE relationships 
    SET 
        interaction_count = interaction_count + 1,
        last_interaction_date = NEW.entry_date,
        updated_at = CURRENT_TIMESTAMP
    WHERE from_agent_id = NEW.agent_id;
END;

-- Trigger: Auto-generate content hash for chunks
CREATE TRIGGER tr_generate_content_hash
    BEFORE INSERT ON diary_chunks
    FOR EACH ROW
    WHEN NEW.content_hash IS NULL
BEGIN
    -- Note: SQLite doesn't have SHA256, so we'll use a simple hash
    -- In a real implementation, this would be handled by the application
    UPDATE diary_chunks SET content_hash = hex(randomblob(16)) WHERE rowid = NEW.rowid;
END;

-- Views for common queries

-- View: Latest diary entries with agent information
CREATE VIEW v_latest_entries AS
SELECT 
    de.id,
    de.title,
    de.entry_date,
    de.entry_type,
    de.status,
    de.word_count,
    de.chunk_count,
    de.tags,
    de.created_at,
    a.name as agent_name,
    a.description as agent_description
FROM diary_entries de
JOIN agents a ON de.agent_id = a.id
WHERE de.status = 'active'
ORDER BY de.entry_date DESC, de.created_at DESC;

-- View: Agent activity summary
CREATE VIEW v_agent_activity AS
SELECT 
    a.id,
    a.name,
    a.is_active,
    COUNT(de.id) as total_entries,
    SUM(de.word_count) as total_words,
    MAX(de.entry_date) as last_entry_date,
    COUNT(CASE WHEN de.entry_date >= date('now', '-7 days') THEN 1 END) as entries_last_week,
    COUNT(CASE WHEN de.entry_date >= date('now', '-30 days') THEN 1 END) as entries_last_month
FROM agents a
LEFT JOIN diary_entries de ON a.id = de.agent_id AND de.status = 'active'
GROUP BY a.id, a.name, a.is_active;

-- View: Emotion trends
CREATE VIEW v_emotion_trends AS
SELECT 
    a.name as agent_name,
    e.emotion_type,
    DATE(em.analyzed_at) as analysis_date,
    AVG(e.intensity) as avg_intensity,
    COUNT(*) as occurrence_count
FROM emotions e
JOIN diary_entries de ON e.entry_id = de.id
JOIN agents a ON de.agent_id = a.id
GROUP BY a.name, e.emotion_type, DATE(e.analyzed_at)
ORDER BY analysis_date DESC, avg_intensity DESC;

-- Initial data setup
INSERT INTO agents (name, description, is_active) VALUES 
('system', 'System agent for automated entries', TRUE);

-- Create initial summary entry
INSERT INTO summaries (summary_type, target_id, agent_id, summary_date, title, content, word_count, summary_method)
SELECT 
    'system',
    0,
    id,
    date('now'),
    'Database Initialized',
    'Agent diary database has been successfully initialized with full schema.',
    12,
    'auto'
FROM agents WHERE name = 'system';