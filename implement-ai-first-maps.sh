I'll create a comprehensive bash script to implement the AI-first map system for Tales of Claude.

```bash
#!/bin/bash

# Tales of Claude - AI-First Map System Implementation Script
# This script replaces the old map system with the new AI-first architecture

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to create directory if it doesn't exist
ensure_directory() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        print_status "Created directory: $dir"
    fi
}

# Function to backup file if it exists
backup_file() {
    local file="$1"
    if [ -f "$file" ]; then
        cp "$file" "${file}.backup.$(date +%Y%m%d_%H%M%S)"
        print_status "Backed up: $file"
    fi
}

print_status "Starting Tales of Claude AI-First Map System Implementation..."

# ============================================================================
# PHASE 1: DELETE OLD MAP SYSTEM FILES
# ============================================================================

print_status "Phase 1: Removing old map system files..."

# Array of files to delete
OLD_FILES=(
    "src/models/Map.ts"
    "src/engine/MapLoader.ts"
    "src/utils/mapValidation.ts"
    "src/utils/mapPerformance.ts"
    "src/utils/mapCreator.ts"
    "src/types/map-schema.types.ts"
)

for file in "${OLD_FILES[@]}"; do
    if [ -f "$file" ]; then
        backup_file "$file"
        rm "$file"
        print_status "Deleted: $file"
    else
        print_warning "File not found (skipping): $file"
    fi
done

# Delete JSON map files
if [ -d "src/assets/maps/json" ]; then
    find src/assets/maps/json -name "*.json" -type f -delete
    print_status "Deleted all JSON files in src/assets/maps/json/"
fi

print_success "Phase 1 completed: Old map system files removed"

# ============================================================================
# PHASE 2: CREATE NEW AI-FIRST MAP SYSTEM FILES
# ============================================================================

print_status "Phase 2: Creating new AI-first map system files..."

# Ensure required directories exist
ensure_directory "src/types"
ensure_directory "src/models"
ensure_directory "src/engine"
ensure_directory "src/utils"
ensure_directory "src/maps"

# ============================================================================
# Create src/types/ai-map.types.ts
# ============================================================================

cat > src/types/ai-map.types.ts << 'EOF'
// AI-First Map System Types for Tales of Claude
// Natural language driven map architecture

export interface Position {
  x: number;
  y: number;
}

export interface AIDescription {
  brief: string;           // Short description for AI context
  detailed?: string;       // Detailed description for immersion
  contextTags: string[];   // Tags for AI understanding
  mood?: string;           // Emotional tone
  timeOfDay?: string;      // Time-specific descriptions
}

export interface Connection {
  to: string;              // Target zone ID
  description: string;     // Natural language description
  direction?: string;      // Cardinal direction
  requirements?: string[]; // Conditions to access
  hidden?: boolean;        // Hidden from obvious view
}

export interface InteractionPoint {
  id: string;
  name: string;
  description: AIDescription;
  position: Position;
  type: 'npc' | 'object' | 'location' | 'portal' | 'item';
  action?: string;         // What happens when interacted with
  conditions?: string[];   // Requirements to interact
}

export interface Zone {
  id: string;
  name: string;
  description: AIDescription;
  connections: Connection[];
  interactions: InteractionPoint[];
  features: string[];      // Special features for AI context
  safeZone: boolean;       // Can player save/rest here
}

export interface AIMapData {
  id: string;
  name: string;
  description: AIDescription;
  zones: Zone[];
  startingZone: string;
  worldContext: {
    theme: string;
    era: string;
    culture: string;
    technology: string;
  };
}

export interface NavigationRequest {
  from: string;
  to: string;
  context?: string;        // Additional context for AI
}

export interface NavigationResponse {
  success: boolean;
  path?: string[];
  description?: string;
  requirements?: string[];
  estimatedTime?: number;
}

export interface MapAIInterface {
  describeLocation(zoneId: string, context?: string): Promise<string>;
  findPath(request: NavigationRequest): Promise<NavigationResponse>;
  searchLocations(query: string): Promise<Zone[]>;
  getAvailableActions(zoneId: string): Promise<string[]>;
  processNaturalLanguageCommand(command: string, currentZone: string): Promise<any>;
}

export interface ZoneTransition {
  from: string;
  to: string;
  description: string;
  timestamp: number;
}

export interface PlayerMapState {
  currentZone: string;
  visitedZones: string[];
  discoveredConnections: string[];
  mapMemory: Record<string, any>;
  transitionHistory: ZoneTransition[];
}

export interface MapValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface MapMetrics {
  totalZones: number;
  totalConnections: number;
  averageConnections: number;
  unreachableZones: string[];
  deadEnds: string[];
  longestPath: number;
}
EOF

print_success "Created: src/types/ai-map.types.ts"

# ============================================================================
# Create src/models/MapAI.ts
# ============================================================================

cat > src/models/MapAI.ts << 'EOF'
// MapAI - Natural Language Interface for Map System
// Handles AI-driven map interactions and descriptions

import { 
  MapAIInterface, 
  NavigationRequest, 
  NavigationResponse, 
  Zone, 
  AIMapData 
} from '../types/ai-map.types';

export class MapAI implements MapAIInterface {
  private mapData: AIMapData;
  private aiContext: Map<string, any>;

  constructor(mapData: AIMapData) {
    this.mapData = mapData;
    this.aiContext = new Map();
  }

  /**
   * Generate natural language description of a location
   */
  async describeLocation(zoneId: string, context?: string): Promise<string> {
    const zone = this.findZone(zoneId);
    if (!zone) {
      return "You find yourself in an unknown location, shrouded in mystery.";
    }

    let description = zone.description.detailed || zone.description.brief;
    
    // Add contextual information
    if (context === 'first_visit') {
      description += this.generateFirstVisitDescription(zone);
    } else if (context === 'return_visit') {
      description += this.generateReturnVisitDescription(zone);
    }

    // Add available connections
    if (zone.connections.length > 0) {
      description += "\n\n" + this.generateConnectionsDescription(zone);
    }

    // Add interaction points
    if (zone.interactions.length > 0) {
      description += "\n\n" + this.generateInteractionsDescription(zone);
    }

    return description;
  }

  /**
   * Find path between two zones
   */
  async findPath(request: NavigationRequest): Promise<NavigationResponse> {
    const fromZone = this.findZone(request.from);
    const toZone = this.findZone(request.to);

    if (!fromZone || !toZone) {
      return {
        success: false,
        description: "Cannot find a path between unknown locations."
      };
    }

    // Use breadth-first search to find shortest path
    const path = this.breadthFirstSearch(request.from, request.to);
    
    if (!path) {
      return {
        success: false,
        description: `No path found from ${fromZone.name} to ${toZone.name}.`
      };
    }

    return {
      success: true,
      path: path,
      description: this.generatePathDescription(path),
      estimatedTime: path.length * 2 // Rough estimate
    };
  }

  /**
   * Search locations by natural language query
   */
  async searchLocations(query: string): Promise<Zone[]> {
    const queryLower = query.toLowerCase();
    const results: Zone[] = [];

    for (const zone of this.mapData.zones) {
      // Search in name
      if (zone.name.toLowerCase().includes(queryLower)) {
        results.push(zone);
        continue;
      }

      // Search in description
      if (zone.description.brief.toLowerCase().includes(queryLower) ||
          zone.description.detailed?.toLowerCase().includes(queryLower)) {
        results.push(zone);
        continue;
      }

      // Search in context tags
      if (zone.description.contextTags.some(tag => 
          tag.toLowerCase().includes(queryLower))) {
        results.push(zone);
        continue;
      }

      // Search in features
      if (zone.features.some(feature => 
          feature.toLowerCase().includes(queryLower))) {
        results.push(zone);
      }
    }

    return results;
  }

  /**
   * Get available actions in a zone
   */
  async getAvailableActions(zoneId: string): Promise<string[]> {
    const zone = this.findZone(zoneId);
    if (!zone) return [];

    const actions: string[] = [];

    // Movement actions
    zone.connections.forEach(conn => {
      if (!conn.hidden) {
        actions.push(`Go ${conn.direction || 'to'} ${conn.to}`);
      }
    });

    // Interaction actions
    zone.interactions.forEach(interaction => {
      if (interaction.action) {
        actions.push(interaction.action);
      } else {
        actions.push(`Examine ${interaction.name}`);
      }
    });

    // General actions
    actions.push("Look around", "Rest", "Check inventory");

    return actions;
  }

  /**
   * Process natural language commands
   */
  async processNaturalLanguageCommand(command: string, currentZone: string): Promise<any> {
    const commandLower = command.toLowerCase().trim();
    
    // Movement commands
    if (this.isMovementCommand(commandLower)) {
      return this.processMovementCommand(commandLower, currentZone);
    }

    // Interaction commands
    if (this.isInteractionCommand(commandLower)) {
      return this.processInteractionCommand(commandLower, currentZone);
    }

    // Information commands
    if (this.isInformationCommand(commandLower)) {
      return this.processInformationCommand(commandLower, currentZone);
    }

    return {
      success: false,
      message: "I don't understand that command. Try 'help' for available actions."
    };
  }

  // Private helper methods

  private findZone(zoneId: string): Zone | undefined {
    return this.mapData.zones.find(zone => zone.id === zoneId);
  }

  private generateFirstVisitDescription(zone: Zone): string {
    return "\n\nThis is your first time in this area. Take a moment to observe your surroundings.";
  }

  private generateReturnVisitDescription(zone: Zone): string {
    return "\n\nThe familiar sights of this place greet you once again.";
  }

  private generateConnectionsDescription(zone: Zone): string {
    const connections = zone.connections.filter(conn => !conn.hidden);
    if (connections.length === 0) return "";

    const descriptions = connections.map(conn => {
      const direction = conn.direction ? `to the ${conn.direction}` : "";
      return `${direction} ${conn.description}`.trim();
    });

    return `Paths lead ${descriptions.join(", ")}.`;
  }

  private generateInteractionsDescription(zone: Zone): string {
    const interactions = zone.interactions.filter(interaction => 
      !interaction.conditions || interaction.conditions.length === 0
    );

    if (interactions.length === 0) return "";

    const descriptions = interactions.map(interaction => interaction.description.brief);
    return `You notice: ${descriptions.join(", ")}.`;
  }

  private breadthFirstSearch(start: string, end: string): string[] | null {
    if (start === end) return [start];

    const queue: Array<{zone: string, path: string[]}> = [{zone: start, path: [start]}];
    const visited = new Set<string>([start]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const zone = this.findZone(current.zone);
      
      if (!zone) continue;

      for (const connection of zone.connections) {
        if (connection.to === end) {
          return [...current.path, connection.to];
        }

        if (!visited.has(connection.to)) {
          visited.add(connection.to);
          queue.push({
            zone: connection.to,
            path: [...current.path, connection.to]
          });
        }
      }
    }

    return null;
  }

  private generatePathDescription(path: string[]): string {
    if (path.length <= 1) return "You are already at your destination.";
    
    const descriptions: string[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const fromZone = this.findZone(path[i]);
      const connection = fromZone?.connections.find(conn => conn.to === path[i + 1]);
      if (connection) {
        descriptions.push(connection.description);
      }
    }

    return `Path: ${descriptions.join(" → ")}`;
  }

  private isMovementCommand(command: string): boolean {
    const movementWords = ['go', 'move', 'walk', 'travel', 'head', 'north', 'south', 'east', 'west'];
    return movementWords.some(word => command.includes(word));
  }

  private isInteractionCommand(command: string): boolean {
    const interactionWords = ['examine', 'look', 'inspect', 'talk', 'use', 'take', 'touch'];
    return interactionWords.some(word => command.includes(word));
  }

  private isInformationCommand(command: string): boolean {
    const infoWords = ['help', 'status', 'where', 'what', 'how', 'inventory'];
    return infoWords.some(word => command.includes(word));
  }

  private processMovementCommand(command: string, currentZone: string): any {
    // Implementation for movement commands
    return { success: true, message: "Movement command processed" };
  }

  private processInteractionCommand(command: string, currentZone: string): any {
    // Implementation for interaction commands
    return { success: true, message: "Interaction command processed" };
  }

  private processInformationCommand(command: string, currentZone: string): any {
    // Implementation for information commands
    return { success: true, message: "Information command processed" };
  }
}
EOF

print_success "Created: src