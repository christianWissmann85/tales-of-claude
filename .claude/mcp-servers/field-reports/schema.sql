-- Field Reports MCP Tool Database Schema
-- SQLite database with FTS5 full-text search support

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Table: agents
-- Stores information about all agents in the system
CREATE TABLE agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata JSON -- Additional agent configuration/settings
);

-- Table: field_reports
-- Main reports table with metadata
CREATE TABLE field_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    mission TEXT NOT NULL,
    report_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'success', -- success, failure, partial
    category TEXT NOT NULL DEFAULT 'general',
    outcome TEXT,
    tags TEXT, -- Comma-separated tags
    priority TEXT DEFAULT 'normal', -- normal, high, critical
    word_count INTEGER DEFAULT 0,
    chunk_count INTEGER DEFAULT 0,
    has_metrics BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata JSON, -- Additional report-specific data
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Table: report_chunks
-- Content chunks (2-3KB each) for efficient storage and retrieval
CREATE TABLE report_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    chunk_order INTEGER NOT NULL, -- Order within the report
    content TEXT NOT NULL, -- 2-3KB of report content
    char_count INTEGER NOT NULL,
    section_type TEXT DEFAULT 'content', -- summary, problems, solutions, metrics, content
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES field_reports(id) ON DELETE CASCADE,
    UNIQUE(report_id, chunk_order)
);

-- Table: problems
-- Extracted problems from reports
CREATE TABLE problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    problem_description TEXT NOT NULL,
    severity TEXT DEFAULT 'medium', -- low, medium, high, critical
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES field_reports(id) ON DELETE CASCADE
);

-- Table: solutions
-- Extracted solutions from reports
CREATE TABLE solutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    problem_id INTEGER, -- Optional link to specific problem
    solution_description TEXT NOT NULL,
    effectiveness TEXT DEFAULT 'effective', -- effective, partial, failed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES field_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE SET NULL
);

-- Table: metrics
-- Performance and impact metrics from reports
CREATE TABLE metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    metric_type TEXT NOT NULL, -- tokens_saved, performance_improvement, etc.
    metric_value REAL NOT NULL,
    metric_unit TEXT DEFAULT 'count',
    context TEXT, -- Additional context about the metric
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES field_reports(id) ON DELETE CASCADE
);

-- Table: pattern_analysis
-- Detected patterns across reports
CREATE TABLE pattern_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_type TEXT NOT NULL, -- problems, solutions, collaboration
    pattern_description TEXT NOT NULL,
    occurrence_count INTEGER DEFAULT 1,
    confidence REAL DEFAULT 0.5, -- 0.0 to 1.0
    agents_involved TEXT, -- Comma-separated agent names
    first_seen DATE,
    last_seen DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    UNIQUE(pattern_type, pattern_description)
);

-- Table: report_relationships
-- Links between related reports
CREATE TABLE report_relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_report_id INTEGER NOT NULL,
    to_report_id INTEGER NOT NULL,
    relationship_type TEXT NOT NULL, -- reference, follow_up, similar, continuation
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_report_id) REFERENCES field_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (to_report_id) REFERENCES field_reports(id) ON DELETE CASCADE,
    UNIQUE(from_report_id, to_report_id, relationship_type)
);

-- FTS5 Virtual Table: report_search
-- Full-text search across report content
CREATE VIRTUAL TABLE report_search USING fts5(
    title,
    content,
    mission,
    tags,
    agent_name,
    category,
    status,
    content='',
    contentless_delete=1
);

-- Performance Indexes
CREATE INDEX idx_agents_name ON agents(name);
CREATE INDEX idx_agents_active ON agents(is_active);

CREATE INDEX idx_field_reports_agent_date ON field_reports(agent_id, report_date DESC);
CREATE INDEX idx_field_reports_status ON field_reports(status);
CREATE INDEX idx_field_reports_category ON field_reports(category);
CREATE INDEX idx_field_reports_date ON field_reports(report_date DESC);
CREATE INDEX idx_field_reports_tags ON field_reports(tags);
CREATE INDEX idx_field_reports_updated ON field_reports(updated_at DESC);

CREATE INDEX idx_report_chunks_report ON report_chunks(report_id, chunk_order);
CREATE INDEX idx_report_chunks_section ON report_chunks(section_type);

CREATE INDEX idx_problems_report ON problems(report_id);
CREATE INDEX idx_problems_severity ON problems(severity);
CREATE INDEX idx_problems_category ON problems(category);

CREATE INDEX idx_solutions_report ON solutions(report_id);
CREATE INDEX idx_solutions_problem ON solutions(problem_id);
CREATE INDEX idx_solutions_effectiveness ON solutions(effectiveness);

CREATE INDEX idx_metrics_report ON metrics(report_id);
CREATE INDEX idx_metrics_type ON metrics(metric_type);
CREATE INDEX idx_metrics_value ON metrics(metric_value DESC);

CREATE INDEX idx_pattern_analysis_type ON pattern_analysis(pattern_type);
CREATE INDEX idx_pattern_analysis_confidence ON pattern_analysis(confidence DESC);
CREATE INDEX idx_pattern_analysis_count ON pattern_analysis(occurrence_count DESC);

CREATE INDEX idx_report_relationships_from ON report_relationships(from_report_id);
CREATE INDEX idx_report_relationships_to ON report_relationships(to_report_id);
CREATE INDEX idx_report_relationships_type ON report_relationships(relationship_type);

-- Triggers for maintaining data consistency

-- Trigger: Update agents.updated_at on changes
CREATE TRIGGER tr_agents_updated_at
    AFTER UPDATE ON agents
    FOR EACH ROW
BEGIN
    UPDATE agents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger: Update field_reports.updated_at on changes
CREATE TRIGGER tr_field_reports_updated_at
    AFTER UPDATE ON field_reports
    FOR EACH ROW
BEGIN
    UPDATE field_reports SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger: Update word_count and chunk_count when chunks are added
CREATE TRIGGER tr_update_report_stats_insert
    AFTER INSERT ON report_chunks
    FOR EACH ROW
BEGIN
    UPDATE field_reports 
    SET 
        word_count = (
            SELECT SUM(LENGTH(content) - LENGTH(REPLACE(content, ' ', '')) + 1)
            FROM report_chunks 
            WHERE report_id = NEW.report_id
        ),
        chunk_count = (
            SELECT COUNT(*) 
            FROM report_chunks 
            WHERE report_id = NEW.report_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.report_id;
END;

CREATE TRIGGER tr_update_report_stats_delete
    AFTER DELETE ON report_chunks
    FOR EACH ROW
BEGIN
    UPDATE field_reports 
    SET 
        word_count = (
            SELECT COALESCE(SUM(LENGTH(content) - LENGTH(REPLACE(content, ' ', '')) + 1), 0)
            FROM report_chunks 
            WHERE report_id = OLD.report_id
        ),
        chunk_count = (
            SELECT COUNT(*) 
            FROM report_chunks 
            WHERE report_id = OLD.report_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.report_id;
END;

-- Trigger: Populate FTS5 table when reports and chunks are added
CREATE TRIGGER tr_report_search_insert
    AFTER INSERT ON report_chunks
    FOR EACH ROW
BEGIN
    INSERT INTO report_search(rowid, title, content, mission, tags, agent_name, category, status)
    SELECT 
        NEW.id,
        fr.title,
        NEW.content,
        fr.mission,
        fr.tags,
        a.name,
        fr.category,
        fr.status
    FROM field_reports fr
    JOIN agents a ON fr.agent_id = a.id
    WHERE fr.id = NEW.report_id;
END;

CREATE TRIGGER tr_report_search_update
    AFTER UPDATE ON report_chunks
    FOR EACH ROW
BEGIN
    UPDATE report_search 
    SET content = NEW.content
    WHERE rowid = NEW.id;
END;

CREATE TRIGGER tr_report_search_delete
    AFTER DELETE ON report_chunks
    FOR EACH ROW
BEGIN
    DELETE FROM report_search WHERE rowid = OLD.id;
END;

-- Trigger: Update pattern analysis updated_at
CREATE TRIGGER tr_pattern_analysis_updated_at
    AFTER UPDATE ON pattern_analysis
    FOR EACH ROW
BEGIN
    UPDATE pattern_analysis SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Views for common queries

-- View: Latest reports with agent information
CREATE VIEW v_latest_reports AS
SELECT 
    fr.id,
    fr.title,
    fr.mission,
    fr.report_date,
    fr.status,
    fr.category,
    fr.word_count,
    fr.chunk_count,
    fr.tags,
    fr.created_at,
    a.name as agent_name,
    a.description as agent_description
FROM field_reports fr
JOIN agents a ON fr.agent_id = a.id
ORDER BY fr.report_date DESC, fr.created_at DESC;

-- View: Agent activity summary
CREATE VIEW v_agent_activity AS
SELECT 
    a.id,
    a.name,
    a.is_active,
    COUNT(fr.id) as total_reports,
    SUM(fr.word_count) as total_words,
    MAX(fr.report_date) as last_report_date,
    SUM(CASE WHEN fr.status = 'success' THEN 1 ELSE 0 END) as success_count,
    COUNT(CASE WHEN fr.report_date >= date('now', '-7 days') THEN 1 END) as reports_last_week,
    COUNT(CASE WHEN fr.report_date >= date('now', '-30 days') THEN 1 END) as reports_last_month
FROM agents a
LEFT JOIN field_reports fr ON a.id = fr.agent_id
GROUP BY a.id, a.name, a.is_active;

-- View: Problem trends
CREATE VIEW v_problem_trends AS
SELECT 
    p.category,
    p.severity,
    COUNT(*) as problem_count,
    COUNT(DISTINCT fr.agent_id) as agents_affected,
    MIN(fr.report_date) as first_reported,
    MAX(fr.report_date) as last_reported
FROM problems p
JOIN field_reports fr ON p.report_id = fr.id
GROUP BY p.category, p.severity
ORDER BY problem_count DESC;

-- View: Metrics overview
CREATE VIEW v_metrics_overview AS
SELECT 
    m.metric_type,
    COUNT(*) as measurement_count,
    AVG(m.metric_value) as avg_value,
    MIN(m.metric_value) as min_value,
    MAX(m.metric_value) as max_value,
    SUM(m.metric_value) as total_value,
    m.metric_unit
FROM metrics m
GROUP BY m.metric_type, m.metric_unit
ORDER BY measurement_count DESC;

-- Initial data setup
INSERT INTO agents (name, description, is_active) VALUES 
('system', 'System agent for automated entries', TRUE);

-- Sample initial pattern entry
INSERT INTO pattern_analysis (pattern_type, pattern_description, occurrence_count, confidence, agents_involved, first_seen, last_seen)
VALUES 
('initialization', 'Database initialized', 1, 1.0, 'system', date('now'), date('now'));