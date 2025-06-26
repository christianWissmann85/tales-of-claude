
// import { Position } from './global.types'; // Unused import // Changed import source for Position
import { JsonMapObject } from './map-schema.types';

/**
 * Represents a movable block that can be pushed by the player.
 */
export interface PushBlock extends JsonMapObject {
    type: 'push_block';
    isMovable: boolean; // True if the block can currently be pushed
    // Optional: Define movement constraints or initial/target positions if needed for specific puzzles
    // initialPosition?: Position; // For resetting the block to its starting point
    // movementAxis?: 'x' | 'y' | 'both'; // Restrict movement to a specific axis
}

/**
 * Represents a pressure plate that activates when an object (e.g., player, PushBlock) is on it.
 */
export interface PressurePlate extends JsonMapObject {
    type: 'pressure_plate';
    isActive: boolean; // True when an object is currently on the plate
    targetObjectId: string; // The ID of the object this plate activates (e.g., a PuzzleDoor, another mechanism)
    requiredWeight?: number; // Optional: A specific 'weight' value required to activate the plate
    // currentOccupantId?: string; // The ID of the object currently occupying the plate
}

/**
 * Represents a toggleable switch that can change state (on/off).
 */
export interface Switch extends JsonMapObject {
    type: 'switch';
    isOn: boolean; // The current state of the switch (true for 'on', false for 'off')
    targetObjectId: string; // The ID of the object this switch controls (e.g., a PuzzleDoor, a light)
    isToggleable?: boolean; // Optional: True if the switch can be toggled back and forth, false if one-time use
}

/**
 * Represents a terminal where the player needs to input a correct code to solve a puzzle.
 */
export interface CodeTerminal extends JsonMapObject {
    type: 'code_terminal';
    correctCode: string; // The specific code string required to solve the terminal
    isSolved: boolean; // True when the correct code has been successfully entered
    targetObjectId: string; // The ID of the object activated upon solving the terminal (e.g., a PuzzleDoor)
    // Optional: Properties for user interaction
    // currentInput?: string; // The current input string by the player
    // maxAttempts?: number; // Maximum number of incorrect attempts allowed
    // hintText?: string; // A hint displayed to the player
}

/**
 * Represents a door that is part of a puzzle and opens upon puzzle completion.
 */
export interface PuzzleDoor extends JsonMapObject {
    type: 'puzzle_door';
    isOpen: boolean; // True if the door is currently open
    isLocked: boolean; // True if the door requires a puzzle solution to open
    requiredPuzzleId?: string; // The ID of the PuzzleDefinition that must be solved to open this door
    // Optional: If the door can also be opened by a specific key or other non-puzzle means
    // requiredKeyId?: string;
}

/**
 * Represents a lever that, when interacted with, resets the state of a specific puzzle.
 */
export interface ResetLever extends JsonMapObject {
    type: 'reset_lever';
    targetPuzzleId: string; // The ID of the PuzzleDefinition that this lever will reset
    isOneTimeUse?: boolean; // Optional: True if the lever can only be pulled once, false if repeatable
}

/**
 * Defines a specific puzzle instance within a map.
 * A puzzle typically involves multiple interactive objects working together.
 */
export interface PuzzleDefinition {
    id: string; // Unique ID for this puzzle instance within the map
    name: string; // A human-readable name for the puzzle
    description?: string; // Optional: A brief description of the puzzle
    isSolved: boolean; // The overall solved state of the puzzle (true when all conditions are met)
    
    /**
     * An array of IDs of the JsonMapObjects that are part of this puzzle.
     * These objects would be defined in the map's main 'objects' array.
     */
    involvedObjectIds: string[];

    /**
     * Optional: Defines the initial state for involved objects when the puzzle is reset.
     * This allows the game to restore objects to their starting positions/states.
     * Keys are object IDs, values are partial objects containing properties to reset.
     * Example: { "pushBlock1": { position: {x: 5, y: 5} }, "pressurePlate1": { isActive: false } }
     */
    initialObjectStates?: {
        [objectId: string]: Partial<PushBlock | PressurePlate | Switch | CodeTerminal | PuzzleDoor | ResetLever>;
    };
}

/**
 * A container interface for an array of puzzle definitions,
 * typically used within a larger map data structure.
 */
export interface MapPuzzles {
    puzzles: PuzzleDefinition[];
}