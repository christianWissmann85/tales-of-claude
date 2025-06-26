import { TimeSystem } from './TimeSystem';
import { WeatherSystem } from './WeatherSystem';
import { GameMap } from '../models/Map';
import { Position, Enemy as IEnemy, WeatherType, NPC } from '../types/global.types';
import { Enemy, EnemyVariant } from '../models/Enemy';

// Data structure for patrol routes as per requirements
interface PatrolRoute {
  type: 'circular' | 'back-forth' | 'random' | 'stationary';
  waypoints: Position[];
  currentWaypointIndex: number;
  waitTime: number; // ms to wait at each waypoint
  isReversing?: boolean; // for back-forth routes
}

// Data structure for enemy state as per requirements
interface EnemyPatrolData {
  id: string;
  type: 'BasicBug' | 'SyntaxError' | 'RuntimeError' | 'NullPointer' | 'SegfaultSovereign';
  state: 'PATROL' | 'ALERT' | 'CHASE' | 'RETURNING' | 'RESPAWNING';
  currentPosition: Position;
  route: PatrolRoute;
  originalPosition: Position;
  targetPosition: Position | null;
  lastSeenPlayerPosition: Position | null;
  movementSpeed: number; // tiles per second
  visionRange: number;
  alertRadius: number;
  defeatedAt?: number; // timestamp
  waitUntil?: number; // timestamp for waypoint waits or alert state
}

// Data structure for NPC patrol state
interface NPCPatrolData {
  id: string;
  state: 'PATROL' | 'IDLE' | 'SCHEDULE_MOVE';
  currentPosition: Position;
  route: PatrolRoute;
  originalPosition: Position;
  targetPosition: Position | null;
  movementSpeed: number; // tiles per second
  waitUntil?: number; // timestamp for waypoint waits
  chatChance: number; // 0-1 chance to pause and "chat"
  scheduleIndex?: number; // Current schedule entry index
}

export class PatrolSystem {
    private enemies: Map<string, EnemyPatrolData> = new Map();
    private defeatedEnemies: Map<string, { data: EnemyPatrolData; originalEnemy: IEnemy }> = new Map();
    private npcs: Map<string, NPCPatrolData> = new Map();
    private timeSystem: TimeSystem;
    private weatherSystem: WeatherSystem;
    private gameMap: GameMap;
    private lastUpdateTime: number = 0;

    // Enemy type configurations
    private readonly ENEMY_CONFIGS = {
        BasicBug: {
            movementSpeed: 3.0, // fast
            visionRange: 5,
            alertRadius: 3,
            patrolType: 'random' as const,
            sleepDuringDay: true,
        },
        SyntaxError: {
            movementSpeed: 2.0, // medium
            visionRange: 5,
            alertRadius: 3,
            patrolType: 'circular' as const,
            sleepDuringDay: false,
        },
        RuntimeError: {
            movementSpeed: 1.5, // slow
            visionRange: 5,
            alertRadius: 3,
            patrolType: 'back-forth' as const,
            sleepDuringDay: false,
        },
        NullPointer: {
            movementSpeed: 2.5, // erratic - will vary
            visionRange: 5,
            alertRadius: 3,
            patrolType: 'random' as const,
            sleepDuringDay: false,
        },
        SegfaultSovereign: {
            movementSpeed: 1.0, // boss - slow but menacing
            visionRange: 7,
            alertRadius: 5,
            patrolType: 'stationary' as const,
            sleepDuringDay: false,
        },
    };

    // NPC type configurations
    private readonly NPC_CONFIGS = {
        townsperson: {
            movementSpeed: 1.0, // slow walk
            patrolType: 'random' as const,
            chatChance: 0.3, // 30% chance to pause
        },
        guard: {
            movementSpeed: 1.5, // steady patrol
            patrolType: 'circular' as const,
            chatChance: 0.1, // 10% chance to pause
        },
        child: {
            movementSpeed: 2.5, // runs around
            patrolType: 'random' as const,
            chatChance: 0.5, // 50% chance to pause
        },
        shopkeeper: {
            movementSpeed: 0.5, // very slow
            patrolType: 'stationary' as const,
            chatChance: 0.8, // 80% chance to stay still
        },
        merchant: {
            movementSpeed: 1.2,
            patrolType: 'back-forth' as const,
            chatChance: 0.4,
        },
    };

    constructor(timeSystem: TimeSystem, weatherSystem: WeatherSystem, gameMap: GameMap) {
        this.timeSystem = timeSystem;
        this.weatherSystem = weatherSystem;
        this.gameMap = gameMap;
    }

    /**
     * Initialize an enemy with patrol data
     */
    public initializeEnemy(enemy: IEnemy, type: EnemyVariant, storeOriginal: boolean = true): void {
        const config = this.ENEMY_CONFIGS[type];
        if (!config) {
            console.warn(`Unknown enemy type: ${type}`);
            return;
        }

        const patrolData: EnemyPatrolData = {
            id: enemy.id,
            type: type as any, // Trust that EnemyVariant matches our types
            state: 'PATROL',
            currentPosition: { ...enemy.position },
            originalPosition: { ...enemy.position },
            route: this.generatePatrolRoute(enemy.position, config.patrolType),
            targetPosition: null,
            lastSeenPlayerPosition: null,
            movementSpeed: config.movementSpeed,
            visionRange: config.visionRange,
            alertRadius: config.alertRadius,
        };

        // Check if should sleep during day
        // Replaced getCurrentTime().hours with currentPeriod check
        if (config.sleepDuringDay && this.timeSystem.currentPeriod === 'day') {
            if (Math.random() < 0.5) { // 50% chance
                patrolData.state = 'PATROL'; // But don't move (stationary)
                patrolData.route.type = 'stationary';
            }
        }

        this.enemies.set(enemy.id, patrolData);
        
        // Store original enemy data for respawning if this is first initialization
        if (storeOriginal) {
            this.defeatedEnemies.set(enemy.id, { data: patrolData, originalEnemy: enemy });
        }
    }

    /**
     * Initialize an NPC with patrol data
     */
    public initializeNPC(npc: NPC, npcType?: string): void {
        // Determine NPC type from role or use provided type
        const type = npcType || this.getNPCTypeFromRole(npc.role);
        const config = this.NPC_CONFIGS[type as keyof typeof this.NPC_CONFIGS] || this.NPC_CONFIGS.townsperson;
        
        const patrolData: NPCPatrolData = {
            id: npc.id,
            state: 'IDLE',
            currentPosition: { ...npc.position },
            originalPosition: { ...npc.position },
            route: this.generatePatrolRoute(npc.position, config.patrolType),
            targetPosition: null,
            movementSpeed: config.movementSpeed,
            chatChance: config.chatChance,
            scheduleIndex: 0,
        };

        // Start with a chat pause
        patrolData.waitUntil = Date.now() + (2000 + Math.random() * 3000); // 2-5 seconds
        
        this.npcs.set(npc.id, patrolData);
    }

    /**
     * Helper to determine NPC type from role
     */
    private getNPCTypeFromRole(role: string): string {
        const roleMap: { [key: string]: string } = {
            'guard': 'guard',
            'Guard': 'guard',
            'shopkeeper': 'shopkeeper',
            'Shopkeeper': 'shopkeeper',
            'merchant': 'merchant',
            'Merchant': 'merchant',
            'memory_merchant': 'merchant',
            'child': 'child',
            'Child': 'child',
            'villager': 'townsperson',
            'Villager': 'townsperson',
            'townsperson': 'townsperson',
            'Townsperson': 'townsperson',
            'debugger': 'townsperson',
            'pip': 'child', // Pip should move around like a child
            'compiler_cat': 'stationary', // Compiler Cat should mostly stay put
        };
        
        // Direct match first
        if (roleMap[role]) {
            return roleMap[role];
        }
        
        // Check if role contains any of these keywords
        for (const [keyword, type] of Object.entries(roleMap)) {
            if (role.toLowerCase().includes(keyword.toLowerCase())) {
                return type;
            }
        }
        
        return 'townsperson'; // Default
    }

    /**
     * Generate a patrol route based on type and starting position
     */
    private generatePatrolRoute(startPos: Position, type: 'circular' | 'back-forth' | 'random' | 'stationary'): PatrolRoute {
        const route: PatrolRoute = {
            type,
            waypoints: [],
            currentWaypointIndex: 0,
            waitTime: 1500, // 1.5 seconds at each waypoint
            isReversing: false,
        };

        switch (type) {
            case 'circular':
                // Create a square patrol route around the starting position
                route.waypoints = [
                    { ...startPos },
                    { x: startPos.x + 3, y: startPos.y },
                    { x: startPos.x + 3, y: startPos.y + 3 },
                    { x: startPos.x, y: startPos.y + 3 },
                ];
                break;

            case 'back-forth':
                // Create a line patrol route
                route.waypoints = [
                    { ...startPos },
                    { x: startPos.x + 4, y: startPos.y },
                ];
                break;

            case 'random':
                // Random waypoints will be generated on the fly
                route.waypoints = [{ ...startPos }];
                break;

            case 'stationary':
                // Single waypoint - the starting position
                route.waypoints = [{ ...startPos }];
                break;
        }

        return route;
    }

    /**
     * Update all enemy positions and states
     */
    public update(deltaTime: number, playerPosition: Position): void {
        // Replaced getCurrentTime() with currentTime getter
        const currentTime = this.timeSystem.currentTime;
        // Replaced isNight() with currentPeriod check
        const isNight = this.timeSystem.currentPeriod === 'night';
        const weather = this.weatherSystem.getCurrentWeather();

        this.enemies.forEach((enemyData) => {
            // Check for respawn
            if (enemyData.state === 'RESPAWNING' && enemyData.defeatedAt) {
                const respawnTime = isNight ? 120000 * 0.75 : 120000; // 1.5 min at night, 2 min during day
                // Use Date.now() for timestamp comparison
                if (Date.now() - enemyData.defeatedAt >= respawnTime) {
                    // Don't respawn boss enemies
                    if (enemyData.type !== 'SegfaultSovereign') {
                        this.respawnEnemy(enemyData);
                    }
                }
                return;
            }

            // Skip if sleeping
            if (this.isSleeping(enemyData)) {
                return;
            }

            // Check if waiting at waypoint
            // Use Date.now() for timestamp comparison
            if (enemyData.waitUntil && Date.now() < enemyData.waitUntil) {
                return;
            }

            // Update state machine
            switch (enemyData.state) {
                case 'PATROL':
                    this.updatePatrol(enemyData, playerPosition, deltaTime);
                    break;
                case 'ALERT':
                    this.updateAlert(enemyData, playerPosition);
                    break;
                case 'CHASE':
                    this.updateChase(enemyData, playerPosition, deltaTime);
                    break;
                case 'RETURNING':
                    this.updateReturning(enemyData, deltaTime);
                    break;
            }
        });

        // Update NPCs
        this.npcs.forEach((npcData) => {
            // Check if waiting (chatting)
            if (npcData.waitUntil && Date.now() < npcData.waitUntil) {
                return;
            }

            // Update NPC movement
            switch (npcData.state) {
                case 'IDLE':
                    this.updateNPCIdle(npcData, deltaTime);
                    break;
                case 'PATROL':
                    this.updateNPCPatrol(npcData, deltaTime);
                    break;
                case 'SCHEDULE_MOVE':
                    // TODO: Implement schedule-based movement
                    this.updateNPCPatrol(npcData, deltaTime);
                    break;
            }
        });
    }

    /**
     * Update enemy in patrol state
     */
    private updatePatrol(enemyData: EnemyPatrolData, playerPosition: Position, deltaTime: number): void {
        // Check for player in vision
        if (this.canSeePlayer(enemyData, playerPosition)) {
            this.transitionToAlert(enemyData, playerPosition);
            return;
        }

        // Continue patrol movement
        this.moveAlongPatrol(enemyData, deltaTime);
    }

    /**
     * Update enemy in alert state
     */
    private updateAlert(enemyData: EnemyPatrolData, playerPosition: Position): void {
        // Alert nearby enemies
        this.alertNearbyEnemies(enemyData.currentPosition);

        // Transition to chase
        enemyData.state = 'CHASE';
        enemyData.lastSeenPlayerPosition = { ...playerPosition };
    }

    /**
     * Update enemy in chase state
     */
    private updateChase(enemyData: EnemyPatrolData, playerPosition: Position, deltaTime: number): void {
        // Check if player escaped (8 tiles away)
        const distance = this.getDistance(enemyData.currentPosition, playerPosition);
        if (distance > 8) {
            enemyData.state = 'RETURNING';
            enemyData.targetPosition = this.findNearestWaypoint(enemyData);
            return;
        }

        // Update last seen position if can see player
        if (this.canSeePlayer(enemyData, playerPosition)) {
            enemyData.lastSeenPlayerPosition = { ...playerPosition };
        }

        // Chase toward last seen position
        if (enemyData.lastSeenPlayerPosition) {
            this.moveToward(enemyData, enemyData.lastSeenPlayerPosition, deltaTime, true);
        }
    }

    /**
     * Update enemy returning to patrol
     */
    private updateReturning(enemyData: EnemyPatrolData, deltaTime: number): void {
        if (!enemyData.targetPosition) {
            enemyData.state = 'PATROL';
            return;
        }

        // Move toward patrol route
        const reached = this.moveToward(enemyData, enemyData.targetPosition, deltaTime, false);
        if (reached) {
            enemyData.state = 'PATROL';
            enemyData.targetPosition = null;
        }
    }

    /**
     * Move enemy along its patrol route
     */
    private moveAlongPatrol(enemyData: EnemyPatrolData, deltaTime: number): void {
        if (enemyData.route.type === 'stationary') {
            return;
        }

        if (enemyData.route.type === 'random') {
            // Generate random waypoint if needed
            if (enemyData.route.waypoints.length === 1 || 
                this.getDistance(enemyData.currentPosition, enemyData.route.waypoints[0]) < 0.1) {
                const randomOffset = {
                    x: Math.floor(Math.random() * 7) - 3,
                    y: Math.floor(Math.random() * 7) - 3,
                };
                const newWaypoint = {
                    x: enemyData.originalPosition.x + randomOffset.x,
                    y: enemyData.originalPosition.y + randomOffset.y,
                };
                enemyData.route.waypoints[0] = newWaypoint;
            }
        }

        const targetWaypoint = enemyData.route.waypoints[enemyData.route.currentWaypointIndex];
        const reached = this.moveToward(enemyData, targetWaypoint, deltaTime, false);

        if (reached) {
            // Wait at waypoint
            // Use Date.now() for timestamp
            enemyData.waitUntil = Date.now() + enemyData.route.waitTime;

            // Update waypoint index
            if (enemyData.route.type === 'circular') {
                enemyData.route.currentWaypointIndex = 
                    (enemyData.route.currentWaypointIndex + 1) % enemyData.route.waypoints.length;
            } else if (enemyData.route.type === 'back-forth') {
                if (enemyData.route.isReversing) {
                    enemyData.route.currentWaypointIndex--;
                    if (enemyData.route.currentWaypointIndex < 0) {
                        enemyData.route.currentWaypointIndex = 1;
                        enemyData.route.isReversing = false;
                    }
                } else {
                    enemyData.route.currentWaypointIndex++;
                    if (enemyData.route.currentWaypointIndex >= enemyData.route.waypoints.length) {
                        enemyData.route.currentWaypointIndex = enemyData.route.waypoints.length - 2;
                        enemyData.route.isReversing = true;
                    }
                }
            }
        }
    }

    /**
     * Move enemy toward a target position
     */
    private moveToward(enemyData: EnemyPatrolData, target: Position, deltaTime: number, isChasing: boolean): boolean {
        const dx = target.x - enemyData.currentPosition.x;
        const dy = target.y - enemyData.currentPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.1) {
            return true; // Reached target
        }

        // Calculate speed with modifiers
        let speed = enemyData.movementSpeed;
        
        // Weather effects
        const weather = this.weatherSystem.getCurrentWeather();
        if (weather === 'storm') {
            speed *= 0.8; // -20% in rain
        } 
        // Fixed WeatherType comparison - use 'codeSnow' instead of 'snow'
        else if (weather === 'codeSnow') {
            speed *= 0.7; // -30% in snow
        }

        // Chase speed bonus
        if (isChasing) {
            speed *= 1.3; // 30% faster when chasing
        }

        // Erratic movement for NullPointer
        if (enemyData.type === 'NullPointer') {
            speed *= 0.8 + Math.random() * 0.4; // 80-120% speed variation
        }

        // Calculate movement
        const moveDistance = speed * (deltaTime / 1000);
        const moveRatio = Math.min(moveDistance / distance, 1);

        const newX = enemyData.currentPosition.x + dx * moveRatio;
        const newY = enemyData.currentPosition.y + dy * moveRatio;

        // Check collision
        const tile = this.gameMap.getTile(Math.floor(newX), Math.floor(newY));
        // Replaced isObstacle() with checking !tile.walkable
        if (tile && tile.walkable) {
            enemyData.currentPosition.x = newX;
            enemyData.currentPosition.y = newY;
        } else {
            // Try to move around obstacle
            // Simple obstacle avoidance - try perpendicular movement
            const perpX = -dy / distance * moveDistance;
            const perpY = dx / distance * moveDistance;
            
            const altX1 = enemyData.currentPosition.x + perpX;
            const altY1 = enemyData.currentPosition.y + perpY;
            const altTile1 = this.gameMap.getTile(Math.floor(altX1), Math.floor(altY1));
            
            // Replaced isObstacle() with checking !tile.walkable
            if (altTile1 && altTile1.walkable) {
                enemyData.currentPosition.x = altX1;
                enemyData.currentPosition.y = altY1;
            }
        }

        return false;
    }

    /**
     * Check if enemy can see the player
     */
    private canSeePlayer(enemyData: EnemyPatrolData, playerPosition: Position): boolean {
        let visionRange = enemyData.visionRange;
        
        // Night vision bonus
        // Replaced isNight() with currentPeriod check
        if (this.timeSystem.currentPeriod === 'night') {
            visionRange += 2;
        }

        const distance = this.getDistance(enemyData.currentPosition, playerPosition);
        if (distance > visionRange) {
            return false;
        }

        // Check line of sight
        return this.hasLineOfSight(enemyData.currentPosition, playerPosition);
    }

    /**
     * Check if there's a clear line of sight between two positions
     */
    private hasLineOfSight(from: Position, to: Position): boolean {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(distance * 2); // Check twice per tile

        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const checkX = Math.floor(from.x + dx * t);
            const checkY = Math.floor(from.y + dy * t);
            
            const tile = this.gameMap.getTile(checkX, checkY);
            // Replaced isObstacle() with checking !tile.walkable
            if (!tile || !tile.walkable) {
                return false;
            }
        }

        return true;
    }

    /**
     * Alert nearby enemies
     */
    private alertNearbyEnemies(position: Position): void {
        this.enemies.forEach((otherEnemy) => {
            if (otherEnemy.state === 'PATROL' || otherEnemy.state === 'RETURNING') {
                const distance = this.getDistance(position, otherEnemy.currentPosition);
                if (distance <= otherEnemy.alertRadius) {
                    otherEnemy.state = 'ALERT';
                    // Use Date.now() for timestamp
                    otherEnemy.waitUntil = Date.now() + 500; // 0.5s alert delay
                }
            }
        });
    }

    /**
     * Find the nearest waypoint on the patrol route
     */
    private findNearestWaypoint(enemyData: EnemyPatrolData): Position {
        let nearestWaypoint = enemyData.route.waypoints[0];
        let minDistance = this.getDistance(enemyData.currentPosition, nearestWaypoint);

        for (const waypoint of enemyData.route.waypoints) {
            const distance = this.getDistance(enemyData.currentPosition, waypoint);
            if (distance < minDistance) {
                minDistance = distance;
                nearestWaypoint = waypoint;
            }
        }

        return nearestWaypoint;
    }

    /**
     * Check if enemy is sleeping
     */
    private isSleeping(enemyData: EnemyPatrolData): boolean {
        const config = this.ENEMY_CONFIGS[enemyData.type];
        if (!config.sleepDuringDay) {
            return false;
        }

        // Replaced currentTime.hours with currentPeriod check
        return this.timeSystem.currentPeriod === 'day' && enemyData.route.type === 'stationary';
    }

    /**
     * Respawn an enemy
     */
    private respawnEnemy(enemyData: EnemyPatrolData): void {
        enemyData.state = 'PATROL';
        enemyData.currentPosition = { ...enemyData.originalPosition };
        enemyData.defeatedAt = undefined;
        enemyData.route.currentWaypointIndex = 0;
        enemyData.route.isReversing = false;
    }

    /**
     * Mark an enemy as defeated
     */
    public markEnemyDefeated(enemyId: string): void {
        const enemyData = this.enemies.get(enemyId);
        if (enemyData) {
            enemyData.state = 'RESPAWNING';
            // Use Date.now() for timestamp
            enemyData.defeatedAt = Date.now();
            
            // Move to defeated enemies tracking
            const defeatedInfo = this.defeatedEnemies.get(enemyId);
            if (defeatedInfo) {
                defeatedInfo.data = enemyData;
            }
        }
    }

    /**
     * Update NPC in idle state
     */
    private updateNPCIdle(npcData: NPCPatrolData, deltaTime: number): void {
        // Decide next action
        if (npcData.route.type === 'stationary') {
            // Stationary NPCs just wait longer
            npcData.waitUntil = Date.now() + (5000 + Math.random() * 10000); // 5-15 seconds
            return;
        }

        // Transition to patrol
        npcData.state = 'PATROL';
        
        if (npcData.route.type === 'random') {
            // Pick a random destination within range
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 5; // 5 tile radius
            const targetX = npcData.originalPosition.x + Math.cos(angle) * distance;
            const targetY = npcData.originalPosition.y + Math.sin(angle) * distance;
            npcData.targetPosition = { x: Math.floor(targetX), y: Math.floor(targetY) };
        } else {
            // Move to next waypoint
            const nextIndex = (npcData.route.currentWaypointIndex + 1) % npcData.route.waypoints.length;
            npcData.route.currentWaypointIndex = nextIndex;
            npcData.targetPosition = npcData.route.waypoints[nextIndex];
        }
    }

    /**
     * Update NPC in patrol state
     */
    private updateNPCPatrol(npcData: NPCPatrolData, deltaTime: number): void {
        if (!npcData.targetPosition) {
            npcData.state = 'IDLE';
            return;
        }

        // Move toward target
        const reached = this.moveTowardNPC(npcData, npcData.targetPosition, deltaTime);
        
        if (reached) {
            // Reached destination - decide to chat or continue
            npcData.state = 'IDLE';
            
            if (Math.random() < npcData.chatChance) {
                // Pause to "chat"
                npcData.waitUntil = Date.now() + (3000 + Math.random() * 5000); // 3-8 seconds
            } else {
                // Continue moving immediately
                npcData.waitUntil = Date.now() + 500; // Brief pause
            }
        }
    }

    /**
     * Move NPC toward a target position
     */
    private moveTowardNPC(npcData: NPCPatrolData, target: Position, deltaTime: number): boolean {
        const dx = target.x - npcData.currentPosition.x;
        const dy = target.y - npcData.currentPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.1) {
            return true; // Reached target
        }

        // NPCs move at consistent speed (no weather/time effects for simplicity)
        const speed = npcData.movementSpeed;
        const moveDistance = speed * (deltaTime / 1000);
        const moveRatio = Math.min(moveDistance / distance, 1);

        const newX = npcData.currentPosition.x + dx * moveRatio;
        const newY = npcData.currentPosition.y + dy * moveRatio;

        // Check collision
        const tile = this.gameMap.getTile(Math.floor(newX), Math.floor(newY));
        if (tile && tile.walkable) {
            npcData.currentPosition.x = newX;
            npcData.currentPosition.y = newY;
        } else {
            // NPCs just stop at obstacles (no pathfinding for now)
            npcData.state = 'IDLE';
            npcData.waitUntil = Date.now() + 2000; // Wait 2 seconds
        }

        return false;
    }

    /**
     * Get the current position of an NPC
     */
    public getNPCPosition(npcId: string): Position | undefined {
        return this.npcs.get(npcId)?.currentPosition;
    }

    /**
     * Get the current position of an enemy
     */
    public getEnemyPosition(enemyId: string): Position | undefined {
        return this.enemies.get(enemyId)?.currentPosition;
    }

    /**
     * Calculate distance between two positions
     */
    private getDistance(pos1: Position, pos2: Position): number {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Transition enemy to alert state
     */
    private transitionToAlert(enemyData: EnemyPatrolData, playerPosition: Position): void {
        enemyData.state = 'ALERT';
        enemyData.lastSeenPlayerPosition = { ...playerPosition };
        // Use Date.now() for timestamp
        enemyData.waitUntil = Date.now() + 1000; // 1 second alert phase
    }

    /**
     * Clean up defeated enemies that won't respawn
     */
    public cleanupDefeatedEnemies(): void {
        const toRemove: string[] = [];
        this.enemies.forEach((enemyData, id) => {
            if (enemyData.state === 'RESPAWNING' && enemyData.type === 'SegfaultSovereign') {
                toRemove.push(id);
            }
        });
        toRemove.forEach(id => this.enemies.delete(id));
    }

    /**
     * Get enemy data for external use
     */
    public getEnemyData(id: string): EnemyPatrolData | undefined {
        return this.enemies.get(id);
    }

    public getAllEnemies(): Map<string, EnemyPatrolData> {
        return this.enemies;
    }
    
    /**
     * Get enemies that need to be respawned
     * @returns Array of enemies ready to respawn
     */
    public getEnemiesToRespawn(): IEnemy[] {
        const enemiesToRespawn: IEnemy[] = [];
        const currentTime = Date.now();
        const isNight = this.timeSystem.currentPeriod === 'night';
        
        this.defeatedEnemies.forEach((defeatedInfo, enemyId) => {
            const enemyData = defeatedInfo.data;
            if (enemyData.state === 'RESPAWNING' && enemyData.defeatedAt) {
                const respawnTime = isNight ? 120000 * 0.75 : 120000; // 1.5 min at night, 2 min during day
                
                if (currentTime - enemyData.defeatedAt >= respawnTime) {
                    // Don't respawn boss enemies
                    if (enemyData.type !== 'SegfaultSovereign') {
                        // Create new enemy object at original position (plain object, not class instance)
                        const enemyClass = new Enemy(
                            defeatedInfo.originalEnemy.id,
                            enemyData.type as EnemyVariant,
                            { ...enemyData.originalPosition },
                        );
                        
                        // Convert to plain object matching Enemy interface
                        const respawnedEnemy: IEnemy = {
                            id: enemyClass.id,
                            name: enemyClass.name,
                            position: { ...enemyClass.position },
                            statusEffects: [...enemyClass.statusEffects],
                            type: enemyClass.type,
                            stats: { ...enemyClass.stats },
                            abilities: enemyClass.abilities.map(a => ({ ...a })),
                            expReward: enemyClass.expReward,
                        };
                        
                        // Reset patrol data
                        this.respawnEnemy(enemyData);
                        this.enemies.set(enemyId, enemyData);
                        
                        enemiesToRespawn.push(respawnedEnemy);
                    }
                }
            }
        });
        
        return enemiesToRespawn;
    }
}
