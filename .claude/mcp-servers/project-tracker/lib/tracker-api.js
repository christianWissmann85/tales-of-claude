// tracker-api.js

const LOCAL_STORAGE_KEY = 'projectTrackerItems';
const LOCAL_STORAGE_MILESTONE_KEY = 'projectTrackerMilestone';

/**
 * Generates a unique ID (UUID v4 style).
 * @returns {string} A unique identifier.
 */
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Maps roadmap session IDs to their descriptive titles based on a hypothetical 21-session plan.
 */
const ROADMAP_SESSIONS = {
    1: "Foundation & Core Setup",
    2: "Initial Data Modeling",
    3: "User Interface Basics",
    4: "Authentication & Authorization",
    5: "CRUD Operations Implementation",
    6: "Error Handling & Logging",
    7: "Testing Fundamentals",
    8: "Advanced UI Components",
    9: "State Management Deep Dive",
    10: "API Integration (External)",
    11: "Performance Optimization",
    12: "Security Best Practices",
    13: "Deployment & CI/CD Basics",
    14: "Real-time Features",
    15: "Analytics & Monitoring",
    16: "User Feedback & Iteration",
    17: "Scalability Considerations",
    18: "Refactoring & Code Quality",
    19: "Documentation & Knowledge Transfer",
    20: "Final Polish & Release Prep",
    21: "Post-Launch & Maintenance Planning"
};

/**
 * Narrative messages for different item types and actions.
 * These provide the story-driven feedback.
 */
const NARRATIVE_MESSAGES = {
    add: {
        quest: (title) => `📜 A new Quest has begun: "${title}"! The journey unfolds...`,
        bug: (title) => `🐛 A wild Bug appeared: "${title}"! Prepare for battle!`,
        feature: (title) => `✨ A new Feature is envisioned: "${title}"! The future takes shape!`,
        refactor: (title) => `🧹 Code Refactor initiated: "${title}"! Tidying the digital scrolls.`,
        learning: (title) => `🧠 Knowledge Acquired: "${title}"! Expanding the mind's library.`,
        meeting: (title) => `🗣️ Conclave Scheduled: "${title}"! Gathering wisdom from allies.`,
        default: (title) => `📝 New task logged: "${title}". Onward!`
    },
    update: {
        completed: {
            quest: (title) => `🎉 Quest Complete! "${title}"! Claude's awakening progresses!`,
            bug: (title) => `⚔️ Bug Vanquished! "${title}"! The Code Realm grows more stable!`,
            feature: (title) => `🛠️ Feature Forged! "${title}"! New powers emerge from the digital void!`,
            refactor: (title) => `✨ Code Realm Refined! "${title}"! The architecture shines brighter!`,
            learning: (title) => `💡 Insight Gained! "${title}"! The path forward is clearer.`,
            meeting: (title) => `🤝 Conclave Concluded! "${title}"! Alliances strengthened.`,
            default: (title) => `✅ Task Accomplished! "${title}"! Another step closer to victory.`
        },
        inProgress: {
            quest: (title) => `🚀 Quest "${title}" is now In Progress! The adventure continues!`,
            bug: (title) => `🚧 Bug "${title}" is being tackled! The fix is nigh!`,
            feature: (title) => `🏗️ Feature "${title}" is under construction! Building the future, block by block.`,
            refactor: (title) => `🌀 Refactoring "${title}" in progress! Untangling the threads.`,
            learning: (title) => `📚 Learning "${title}" is underway! Absorbing new wisdom.`,
            meeting: (title) => `🗣️ Conclave "${title}" is in session! Discussions are lively.`,
            default: (title) => `➡️ Task "${title}" is now In Progress. Keep pushing!`
        },
        blocked: {
            default: (title) => `🛑 Task "${title}" is Blocked. Awaiting resources or clarification.`
        },
        abandoned: {
            default: (title) => `🗑️ Task "${title}" has been Abandoned. Shifting priorities.`
        },
        default: (title, status) => `🔄 Task "${title}" status updated to "${status}".`
    }
};

/**
 * Celebratory messages for overall project milestones.
 */
const MILESTONE_MESSAGES = {
    25: "🌟 Quarter-way Mark! The project's foundations are solid, and momentum builds! Keep soaring!",
    50: "🚀 Halfway There! You've reached the summit of the first peak! The view is magnificent, and the path ahead is clearer!",
    75: " triumphant march continues! The finish line is in sight! Push through, hero!",
    100: "🏆 Project Complete! The grand quest is fulfilled! Revel in your triumph, for the digital realm is forever changed by your hand!"
};

// In-memory cache for items and milestone tracking
let items = [];
let lastAchievedMilestone = 0;

/**
 * Loads items from localStorage into the in-memory cache.
 * @private
 */
function _loadItems() {
    try {
        const storedItems = localStorage.getItem(LOCAL_STORAGE_KEY);
        items = storedItems ? JSON.parse(storedItems) : [];
    } catch (e) {
        console.error("Failed to load items from localStorage:", e);
        items = [];
    }
}

/**
 * Saves the current in-memory items to localStorage.
 * @private
 */
function _saveItems() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
        console.error("Failed to save items to localStorage:", e);
    }
}

/**
 * Loads the last achieved milestone from localStorage.
 * @private
 */
function _loadMilestone() {
    try {
        const storedMilestone = localStorage.getItem(LOCAL_STORAGE_MILESTONE_KEY);
        lastAchievedMilestone = storedMilestone ? parseInt(storedMilestone, 10) : 0;
    } catch (e) {
        console.error("Failed to load milestone from localStorage:", e);
        lastAchievedMilestone = 0;
    }
}

/**
 * Saves the current last achieved milestone to localStorage.
 * @private
 * @param {number} milestone - The milestone percentage (e.g., 25, 50).
 */
function _saveMilestone(milestone) {
    try {
        localStorage.setItem(LOCAL_STORAGE_MILESTONE_KEY, milestone.toString());
    } catch (e) {
        console.error("Failed to save milestone to localStorage:", e);
    }
}

// Initialize data on module load
_loadItems();
_loadMilestone();

const trackerAPI = {
    /**
     * Adds a new item to the tracker.
     * @param {object} itemData - The data for the new item.
     * @param {string} itemData.title - The title of the item.
     * @param {string} [itemData.description=''] - A detailed description.
     * @param {string} [itemData.type='default'] - Type of item (e.g., 'quest', 'bug', 'feature', 'refactor', 'learning', 'meeting').
     * @param {string} [itemData.status='todo'] - Initial status ('todo', 'in-progress', 'completed', 'blocked', 'abandoned').
     * @param {number} [itemData.sessionId=1] - The roadmap session ID this item belongs to.
     * @param {number} [itemData.points=1] - Points representing complexity/weight.
     * @returns {{item: object, message: string}} The added item and a narrative message.
     */
    trackItem(itemData) {
        const newItem = {
            id: uuidv4(),
            title: itemData.title,
            description: itemData.description || '',
            type: itemData.type || 'default',
            status: itemData.status || 'todo',
            sessionId: itemData.sessionId || 1,
            points: itemData.points || 1,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        items.push(newItem);
        _saveItems();

        const messageGenerator = NARRATIVE_MESSAGES.add[newItem.type] || NARRATIVE_MESSAGES.add.default;
        const message = messageGenerator(newItem.title);

        return { item: newItem, message };
    },

    /**
     * Retrieves items for the current "session" (defined as items created/completed today).
     * This is a simplified interpretation of "current items".
     * For a more robust definition, a "current session" would need to be explicitly set.
     * @returns {Array<object>} A list of items relevant to the current day.
     */
    getCurrentItems() {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        return items.filter(item => {
            const createdAtDate = new Date(item.createdAt);
            createdAtDate.setHours(0, 0, 0, 0);
            return createdAtDate.getTime() === today.getTime();
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by most recent
    },

    /**
     * Retrieves all items belonging to a specific roadmap session.
     * @param {number} sessionId - The ID of the roadmap session (1-21).
     * @returns {Array<object>} A list of items for the specified session.
     */
    getSessionItems(sessionId) {
        const sessionTitle = ROADMAP_SESSIONS[sessionId] || `Unknown Session ${sessionId}`;
        const sessionItems = items.filter(item => item.sessionId === sessionId)
                                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Sort by creation date

        return {
            sessionId,
            sessionTitle,
            items: sessionItems
        };
    },

    /**
     * Calculates the overall roadmap progress and provides celebratory messages for milestones.
     * @returns {{
     *   totalPoints: number,
     *   completedPoints: number,
     *   progressPercentage: number,
     *   milestoneMessage: string|null,
     *   sessionProgress: Array<{sessionId: number, title: string, completedItems: number, totalItems: number, percentage: number}>
     * }} The roadmap status, including progress, milestone messages, and per-session progress.
     */
    getRoadmapStatus() {
        let totalPoints = 0;
        let completedPoints = 0;
        const sessionProgressMap = {};

        // Initialize session progress map
        for (const id in ROADMAP_SESSIONS) {
            sessionProgressMap[id] = {
                sessionId: parseInt(id, 10),
                title: ROADMAP_SESSIONS[id],
                completedItems: 0,
                totalItems: 0,
                percentage: 0
            };
        }

        items.forEach(item => {
            totalPoints += item.points;
            if (item.status === 'completed') {
                completedPoints += item.points;
            }

            // Update session-specific progress
            if (sessionProgressMap[item.sessionId]) {
                sessionProgressMap[item.sessionId].totalItems++;
                if (item.status === 'completed') {
                    sessionProgressMap[item.sessionId].completedItems++;
                }
            }
        });

        const progressPercentage = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
        let milestoneMessage = null;

        // Check for milestones
        const milestones = [25, 50, 75, 100];
        for (const milestone of milestones) {
            if (progressPercentage >= milestone && lastAchievedMilestone < milestone) {
                milestoneMessage = MILESTONE_MESSAGES[milestone];
                lastAchievedMilestone = milestone;
                _saveMilestone(milestone);
                break; // Only trigger one milestone message at a time
            }
        }

        // Calculate percentage for each session
        const sessionProgress = Object.values(sessionProgressMap).map(session => ({
            ...session,
            percentage: session.totalItems > 0 ? Math.round((session.completedItems / session.totalItems) * 100) : 0
        })).sort((a, b) => a.sessionId - b.sessionId); // Ensure sessions are ordered

        return {
            totalPoints,
            completedPoints,
            progressPercentage,
            milestoneMessage,
            sessionProgress
        };
    },

    /**
     * Searches for items by title or description.
     * @param {string} query - The search string. Case-insensitive.
     * @returns {Array<object>} A list of matching items.
     */
    searchItems(query) {
        const lowerCaseQuery = query.toLowerCase();
        return items.filter(item =>
            item.title.toLowerCase().includes(lowerCaseQuery) ||
            item.description.toLowerCase().includes(lowerCaseQuery)
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by most recent
    },

    /**
     * Updates an existing item's properties.
     * @param {string} itemId - The ID of the item to update.
     * @param {object} updates - An object containing the properties to update (e.g., { status: 'completed', description: 'new text' }).
     * @returns {{item: object|null, message: string}} The updated item and a narrative message, or null if not found.
     */
    updateItem(itemId, updates) {
        const itemIndex = items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            return { item: null, message: "Item not found." };
        }

        const oldItem = { ...items[itemIndex] };
        const updatedItem = { ...oldItem, ...updates };

        // Handle status changes
        if (updates.status && updates.status !== oldItem.status) {
            if (updates.status === 'completed') {
                updatedItem.completedAt = new Date().toISOString();
            } else if (oldItem.status === 'completed' && updates.status !== 'completed') {
                // If moving out of completed, clear completedAt
                updatedItem.completedAt = null;
            }
        }

        items[itemIndex] = updatedItem;
        _saveItems();

        let message = `Item "${updatedItem.title}" updated.`; // Default message

        // Generate narrative message based on status change
        if (updates.status && updates.status !== oldItem.status) {
            const statusMessages = NARRATIVE_MESSAGES.update[updates.status];
            if (statusMessages) {
                const messageGenerator = statusMessages[updatedItem.type] || statusMessages.default;
                message = messageGenerator(updatedItem.title);
            } else {
                message = NARRATIVE_MESSAGES.update.default(updatedItem.title, updatedItem.status);
            }
        } else if (Object.keys(updates).length > 0) {
            // If other properties were updated but not status
            message = `Details for "${updatedItem.title}" have been refined.`;
        }

        return { item: updatedItem, message };
    },

    /**
     * Resets all tracker data, including items and milestones.
     * Use with caution!
     * @returns {string} A confirmation message.
     */
    resetTracker() {
        items = [];
        lastAchievedMilestone = 0;
        _saveItems();
        _saveMilestone(0);
        return "Tracker data has been reset. The quest begins anew!";
    }
};

export default trackerAPI;