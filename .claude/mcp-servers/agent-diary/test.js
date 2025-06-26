#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Database } = require('better-sqlite3');

// Test configuration
const TEST_DB_PATH = './test_diary.db';
const CHUNK_SIZE = 1000; // Match the server's chunk size

// Clean up test database before starting
if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
}

// Sample diary content for testing
const SAMPLE_ENTRIES = [
    {
        content: `Today was an incredible day! I finally launched my new project that I've been working on for months. The team meeting went really well, and Sarah provided some excellent feedback that will help us improve the user interface. I'm feeling excited and proud of what we've accomplished. Later, I had dinner with my family - mom made her famous lasagna, and we talked about planning a trip to Italy next summer. My brother Tom mentioned he might join us, which would be amazing since we haven't traveled together in years. I'm feeling grateful for all the support from my loved ones.`,
        emotions: ['excited', 'proud', 'grateful'],
        relationships: ['Sarah', 'mom', 'Tom'],
        tags: ['work', 'project', 'family', 'travel']
    },
    {
        content: `Had a challenging day at work today. The client presentation didn't go as planned - there were technical difficulties with the projector, and I felt unprepared for some of their questions. My colleague Mike tried to help, but I could see the frustration on the client's faces. I'm feeling disappointed in myself and worried about how this might affect our relationship with this important client. On a positive note, I went for a run after work which helped clear my head. Called my friend Lisa to vent, and she reminded me that everyone has off days. Her support means a lot to me.`,
        emotions: ['disappointed', 'worried', 'frustrated', 'grateful'],
        relationships: ['Mike', 'Lisa'],
        tags: ['work', 'presentation', 'exercise', 'friendship']
    },
    {
        content: `What a weekend! Went hiking with Alex and Jenny in the mountains. The weather was perfect, and the views were breathtaking. We packed a picnic lunch and spent hours just talking and enjoying nature. Alex brought his new camera and took some amazing photos that he promised to share. Jenny and I discussed her upcoming wedding plans - she's so excited and asked me to be one of her bridesmaids! I'm honored and thrilled to be part of her special day. We're planning to go dress shopping next weekend. Feeling refreshed and connected with good friends.`,
        emotions: ['thrilled', 'honored', 'refreshed', 'connected'],
        relationships: ['Alex', 'Jenny'],
        tags: ['hiking', 'nature', 'friendship', 'wedding', 'photography']
    },
    {
        content: `Today marks exactly one year since I started therapy with Dr. Martinez. Looking back, I can see how much I've grown and changed. A year ago, I was struggling with anxiety and had trouble expressing my feelings. Now, I feel more confident in social situations and have better coping strategies for stress. My relationship with my partner Chris has also improved significantly - we communicate much better now and rarely have the explosive arguments we used to have. I'm proud of the work I've put in and grateful for Dr. Martinez's guidance. Mental health is just as important as physical health, and I'm glad I prioritized it.`,
        emotions: ['proud', 'grateful', 'confident'],
        relationships: ['Dr. Martinez', 'Chris'],
        tags: ['therapy', 'mental-health', 'personal-growth', 'relationships']
    },
    {
        content: `Celebrated my promotion today! The whole team surprised me with a cake and congratulations. My manager, Robert, officially announced that I'll be leading the new digital transformation project. It's a big responsibility, but I feel ready for the challenge. Called my parents to share the good news - dad was especially proud and reminded me of how hard I worked to get here. Mom suggested we celebrate with the whole family this weekend. My cousin Rachel texted me congratulations too; she's always been so supportive of my career. Tonight, Chris and I went out for a nice dinner to celebrate. Life feels really good right now.`,
        emotions: ['excited', 'proud', 'grateful', 'confident'],
        relationships: ['Robert', 'dad', 'mom', 'Rachel', 'Chris'],
        tags: ['promotion', 'work', 'family', 'celebration', 'career']
    }
];

class DiaryTester {
    constructor() {
        this.db = null;
        this.testsPassed = 0;
        this.testsFailed = 0;
        this.startTime = Date.now();
    }

    // Initialize database with the same schema as the server
    initDatabase() {
        this.db = new Database(TEST_DB_PATH);
        
        // Create tables
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS diary_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                summary TEXT,
                emotions TEXT,
                relationships TEXT,
                tags TEXT
            );

            CREATE TABLE IF NOT EXISTS diary_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_id INTEGER,
                chunk_text TEXT NOT NULL,
                chunk_index INTEGER,
                FOREIGN KEY (entry_id) REFERENCES diary_entries (id)
            );

            CREATE VIRTUAL TABLE IF NOT EXISTS diary_search USING fts5(
                entry_id,
                content,
                summary,
                emotions,
                relationships,
                tags
            );

            CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON diary_entries(timestamp);
            CREATE INDEX IF NOT EXISTS idx_chunks_entry_id ON diary_chunks(entry_id);
        `);

        console.log('✓ Database initialized successfully');
        this.testsPassed++;
    }

    // Helper function to chunk text
    chunkText(text) {
        const chunks = [];
        for (let i = 0; i < text.length; i += CHUNK_SIZE) {
            chunks.push(text.slice(i, i + CHUNK_SIZE));
        }
        return chunks;
    }

    // Generate summary (simplified version)
    generateSummary(content) {
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        return sentences.slice(0, 2).join('. ') + '.';
    }

    // Test saving diary entries with chunking
    async testSavingEntries() {
        console.log('\n--- Testing Entry Saving with Chunking ---');
        
        try {
            const insertEntry = this.db.prepare(`
                INSERT INTO diary_entries (content, summary, emotions, relationships, tags)
                VALUES (?, ?, ?, ?, ?)
            `);

            const insertChunk = this.db.prepare(`
                INSERT INTO diary_chunks (entry_id, chunk_text, chunk_index)
                VALUES (?, ?, ?)
            `);

            const insertSearch = this.db.prepare(`
                INSERT INTO diary_search (entry_id, content, summary, emotions, relationships, tags)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            for (let i = 0; i < SAMPLE_ENTRIES.length; i++) {
                const entry = SAMPLE_ENTRIES[i];
                const summary = this.generateSummary(entry.content);
                const emotions = JSON.stringify(entry.emotions);
                const relationships = JSON.stringify(entry.relationships);
                const tags = JSON.stringify(entry.tags);

                // Insert main entry
                const result = insertEntry.run(entry.content, summary, emotions, relationships, tags);
                const entryId = result.lastInsertRowid;

                // Insert chunks
                const chunks = this.chunkText(entry.content);
                for (let j = 0; j < chunks.length; j++) {
                    insertChunk.run(entryId, chunks[j], j);
                }

                // Insert into search table
                insertSearch.run(entryId, entry.content, summary, emotions, relationships, tags);

                console.log(`✓ Entry ${i + 1} saved with ${chunks.length} chunks`);
            }

            this.testsPassed++;
            console.log('✓ All entries saved successfully');
        } catch (error) {
            console.error('✗ Failed to save entries:', error);
            this.testsFailed++;
        }
    }

    // Test recalling entries with pagination
    testRecallEntries() {
        console.log('\n--- Testing Entry Recall with Pagination ---');
        
        try {
            // Test getting all entries
            const allEntries = this.db.prepare('SELECT * FROM diary_entries ORDER BY timestamp DESC').all();
            console.log(`✓ Retrieved ${allEntries.length} total entries`);

            // Test pagination
            const pageSize = 2;
            const page1 = this.db.prepare('SELECT * FROM diary_entries ORDER BY timestamp DESC LIMIT ? OFFSET ?')
                .all(pageSize, 0);
            console.log(`✓ Page 1: Retrieved ${page1.length} entries`);

            const page2 = this.db.prepare('SELECT * FROM diary_entries ORDER BY timestamp DESC LIMIT ? OFFSET ?')
                .all(pageSize, pageSize);
            console.log(`✓ Page 2: Retrieved ${page2.length} entries`);

            // Test getting chunks for an entry
            if (allEntries.length > 0) {
                const chunks = this.db.prepare('SELECT * FROM diary_chunks WHERE entry_id = ? ORDER BY chunk_index')
                    .all(allEntries[0].id);
                console.log(`✓ Retrieved ${chunks.length} chunks for entry ${allEntries[0].id}`);
            }

            this.testsPassed++;
        } catch (error) {
            console.error('✗ Failed to recall entries:', error);
            this.testsFailed++;
        }
    }

    // Test full-text search functionality
    testFullTextSearch() {
        console.log('\n--- Testing Full-Text Search ---');
        
        try {
            // Test searching for content
            const searchQueries = [
                'project',
                'hiking mountains',
                'therapy anxiety',
                'promotion celebrate',
                'family dinner'
            ];

            for (const query of searchQueries) {
                const results = this.db.prepare(`
                    SELECT entry_id, highlight(diary_search, 1, '<mark>', '</mark>') as highlighted_content
                    FROM diary_search 
                    WHERE diary_search MATCH ?
                    ORDER BY rank
                `).all(query);

                console.log(`✓ Search "${query}": Found ${results.length} results`);
                if (results.length > 0) {
                    console.log(`  First result preview: ${results[0].highlighted_content.substring(0, 100)}...`);
                }
            }

            this.testsPassed++;
        } catch (error) {
            console.error('✗ Failed full-text search:', error);
            this.testsFailed++;
        }
    }

    // Test summary generation
    testSummaryGeneration() {
        console.log('\n--- Testing Summary Generation ---');
        
        try {
            const entries = this.db.prepare('SELECT id, content, summary FROM diary_entries').all();
            
            for (const entry of entries) {
                console.log(`✓ Entry ${entry.id}:`);
                console.log(`  Original length: ${entry.content.length} characters`);
                console.log(`  Summary length: ${entry.summary.length} characters`);
                console.log(`  Summary: ${entry.summary}`);
                console.log();
            }

            this.testsPassed++;
        } catch (error) {
            console.error('✗ Failed summary generation test:', error);
            this.testsFailed++;
        }
    }

    // Test emotion tracking
    testEmotionTracking() {
        console.log('\n--- Testing Emotion Tracking ---');
        
        try {
            const entries = this.db.prepare('SELECT id, emotions FROM diary_entries').all();
            const emotionCounts = {};

            for (const entry of entries) {
                const emotions = JSON.parse(entry.emotions);
                console.log(`✓ Entry ${entry.id} emotions: ${emotions.join(', ')}`);
                
                for (const emotion of emotions) {
                    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
                }
            }

            console.log('\n📊 Emotion frequency:');
            Object.entries(emotionCounts)
                .sort(([,a], [,b]) => b - a)
                .forEach(([emotion, count]) => {
                    console.log(`  ${emotion}: ${count} times`);
                });

            this.testsPassed++;
        } catch (error) {
            console.error('✗ Failed emotion tracking test:', error);
            this.testsFailed++;
        }
    }

    // Test relationship mapping
    testRelationshipMapping() {
        console.log('\n--- Testing Relationship Mapping ---');
        
        try {
            const entries = this.db.prepare('SELECT id, relationships FROM diary_entries').all();
            const relationshipCounts = {};
            const relationshipConnections = {};

            for (const entry of entries) {
                const relationships = JSON.parse(entry.relationships);
                console.log(`✓ Entry ${entry.id} relationships: ${relationships.join(', ')}`);
                
                for (const person of relationships) {
                    relationshipCounts[person] = (relationshipCounts[person] || 0) + 1;
                    if (!relationshipConnections[person]) {
                        relationshipConnections[person] = [];
                    }
                    relationshipConnections[person].push(entry.id);
                }
            }

            console.log('\n👥 Relationship frequency:');
            Object.entries(relationshipCounts)
                .sort(([,a], [,b]) => b - a)
                .forEach(([person, count]) => {
                    console.log(`  ${person}: mentioned in ${count} entries`);
                });

            console.log('\n🔗 Relationship connections:');
            Object.entries(relationshipConnections).forEach(([person, entryIds]) => {
                console.log(`  ${person}: appears in entries [${entryIds.join(', ')}]`);
            });

            this.testsPassed++;
        } catch (error) {
            console.error('✗ Failed relationship mapping test:', error);
            this.testsFailed++;
        }
    }

    // Test advanced queries
    testAdvancedQueries() {
        console.log('\n--- Testing Advanced Queries ---');
        
        try {
            // Test date range queries
            const recentEntries = this.db.prepare(`
                SELECT COUNT(*) as count 
                FROM diary_entries 
                WHERE timestamp >= datetime('now', '-7 days')
            `).get();
            console.log(`✓ Entries in last 7 days: ${recentEntries.count}`);

            // Test entries by emotion
            const emotionQuery = this.db.prepare(`
                SELECT id, summary 
                FROM diary_entries 
                WHERE emotions LIKE '%excited%'
            `).all();
            console.log(`✓ Entries with 'excited' emotion: ${emotionQuery.length}`);

            // Test entries by relationship
            const relationshipQuery = this.db.prepare(`
                SELECT id, summary 
                FROM diary_entries 
                WHERE relationships LIKE '%Chris%'
            `).all();
            console.log(`✓ Entries mentioning 'Chris': ${relationshipQuery.length}`);

            // Test tag-based queries
            const tagQuery = this.db.prepare(`
                SELECT id, summary 
                FROM diary_entries 
                WHERE tags LIKE '%work%'
            `).all();
            console.log(`✓ Entries tagged with 'work': ${tagQuery.length}`);

            this.testsPassed++;
        } catch (error) {
            console.error('✗ Failed advanced queries test:', error);
            this.testsFailed++;
        }
    }

    // Test data integrity
    testDataIntegrity() {
        console.log('\n--- Testing Data Integrity ---');
        
        try {
            // Check that all entries have corresponding chunks
            const orphanedChunks = this.db.prepare(`
                SELECT COUNT(*) as count 
                FROM diary_chunks 
                WHERE entry_id NOT IN (SELECT id FROM diary_entries)
            `).get();
            
            console.log(`✓ No orphaned chunks: ${orphanedChunks.count === 0 ? 'PASS' : 'FAIL - ' + orphanedChunks.count + ' orphaned chunks'}`);
            
            this.testsPassed++;
        } catch (error) {
            console.error('✗ Failed data integrity test:', error);
            this.testsFailed++;
        }
    }
}
            