-- Project Tracker Schema
-- The Chronicle of Development

-- Main tracking table
CREATE TABLE IF NOT EXISTS project_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('quest', 'feature', 'bug', 'milestone')),
  title TEXT NOT NULL,
  description TEXT,
  session REAL, -- Links to roadmap (3.5, 3.7, etc)
  status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'blocked')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  
  -- Metadata
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  completedAt INTEGER,
  blockedReason TEXT,
  
  -- Relationships
  dependencies TEXT, -- JSON array of item IDs
  relatedItems TEXT, -- JSON array of item IDs
  assignedAgent TEXT,
  
  -- Rich content
  notes TEXT,
  fieldReports TEXT -- JSON array of report paths
);

-- Session metadata
CREATE TABLE IF NOT EXISTS sessions (
  number REAL PRIMARY KEY,
  title TEXT NOT NULL,
  theme TEXT,
  estimatedHours INTEGER,
  actualHours REAL,
  startedAt INTEGER,
  completedAt INTEGER,
  notes TEXT
);

-- Milestones (major achievements)
CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  targetSession REAL,
  achievedSession REAL,
  achievedAt INTEGER,
  celebrationNotes TEXT
);

-- Full text search
CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
  title, description, notes, content=project_items
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_session ON project_items(session);
CREATE INDEX IF NOT EXISTS idx_items_status ON project_items(status);
CREATE INDEX IF NOT EXISTS idx_items_type ON project_items(type);
CREATE INDEX IF NOT EXISTS idx_items_created ON project_items(createdAt);

-- Trigger to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS items_fts_insert AFTER INSERT ON project_items BEGIN
  INSERT INTO items_fts(rowid, title, description, notes) 
  VALUES (new.rowid, new.title, new.description, new.notes);
END;

CREATE TRIGGER IF NOT EXISTS items_fts_update AFTER UPDATE ON project_items BEGIN
  UPDATE items_fts 
  SET title = new.title, description = new.description, notes = new.notes
  WHERE rowid = new.rowid;
END;

CREATE TRIGGER IF NOT EXISTS items_fts_delete AFTER DELETE ON project_items BEGIN
  DELETE FROM items_fts WHERE rowid = old.rowid;
END;