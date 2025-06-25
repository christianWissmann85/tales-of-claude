import { PuzzleSystem, PuzzleState, PushBlockPuzzleState, SwitchSequencePuzzleState, CodeArrangementPuzzleState } from './PuzzleSystem';
import { Position } from '../types/global.types';

/**
 * Handles interactions with various puzzle types on a specific map,
 * delegating state management to an underlying PuzzleSystem.
 */
export class PuzzleInteractionHandler {
    private puzzleSystem: PuzzleSystem;
    private currentMapId: string;

    /**
     * Creates an instance of PuzzleInteractionHandler.
     * @param puzzleSystem The actual PuzzleSystem instance to interact with.
     * @param currentMapId The ID of the map this handler instance is currently managing puzzles for.
     */
    constructor(puzzleSystem: PuzzleSystem, currentMapId: string) {
        this.puzzleSystem = puzzleSystem;
        this.currentMapId = currentMapId;
    }

    /**
     * Handles the interaction for a PushBlock puzzle.
     * Finds the block at `oldPosition` and updates its position to `newPosition`.
     * @param puzzleId The ID of the push block puzzle.
     * @param oldPosition The current position of the block being moved.
     * @param newPosition The new position for the block.
     * @returns True if the state was successfully updated, false otherwise (e.g., puzzle not found or wrong type).
     */
    public handlePushBlockInteraction(puzzleId: string, oldPosition: Position, newPosition: Position): boolean {
        const currentState = this.puzzleSystem.getPuzzleState(this.currentMapId, puzzleId);

        if (!currentState || currentState.type !== 'pushBlock') {
            console.warn(`Puzzle '${puzzleId}' not found or is not a PushBlockPuzzle on map '${this.currentMapId}'.`);
            return false;
        }

        const pushBlockState = currentState as PushBlockPuzzleState;
        const newBlockPositions = [...pushBlockState.blockPositions]; // Create a mutable copy

        // Find the index of the block at oldPosition
        const blockIndex = newBlockPositions.findIndex(pos => pos.x === oldPosition.x && pos.y === oldPosition.y);

        if (blockIndex === -1) {
            console.warn(`Block at position {x: ${oldPosition.x}, y: ${oldPosition.y}} not found in puzzle '${puzzleId}'.`);
            return false;
        }

        // Update the block's position in the copied array
        newBlockPositions[blockIndex] = newPosition;

        // Create a new state object with the updated block positions.
        // isSolved is set to false here, as the PuzzleSystem will re-evaluate it.
        const newState: PushBlockPuzzleState = {
            ...pushBlockState,
            blockPositions: newBlockPositions,
            isSolved: false, // The PuzzleSystem will determine if this new state is solved
        };

        this.puzzleSystem.updatePuzzleState(this.currentMapId, puzzleId, newState);
        return true;
    }

    /**
     * Handles the interaction for a SwitchSequence puzzle, toggling a switch.
     * Appends the `switchId` to the activated sequence.
     * @param puzzleId The ID of the switch sequence puzzle.
     * @param switchId The ID of the switch that was toggled.
     * @returns True if the state was successfully updated, false otherwise.
     */
    public handleSwitchToggle(puzzleId: string, switchId: string): boolean {
        const currentState = this.puzzleSystem.getPuzzleState(this.currentMapId, puzzleId);

        if (!currentState || currentState.type !== 'switchSequence') {
            console.warn(`Puzzle '${puzzleId}' not found or is not a SwitchSequencePuzzle on map '${this.currentMapId}'.`);
            return false;
        }

        const switchSequenceState = currentState as SwitchSequencePuzzleState;
        // Append the new switchId to a new array to maintain immutability
        const newActivatedSequence = [...switchSequenceState.activatedSequence, switchId];

        const newState: SwitchSequencePuzzleState = {
            ...switchSequenceState,
            activatedSequence: newActivatedSequence,
            isSolved: false, // The PuzzleSystem will determine if this new state is solved
        };

        this.puzzleSystem.updatePuzzleState(this.currentMapId, puzzleId, newState);
        return true;
    }

    /**
     * Handles the interaction for a CodeArrangement puzzle, setting a new arrangement.
     * This method assumes the entire `newArrangement` is provided at once.
     * @param puzzleId The ID of the code arrangement puzzle.
     * @param newArrangement The new complete sequence of code elements.
     * @returns True if the state was successfully updated, false otherwise.
     */
    public handleCodeArrangementChange(puzzleId: string, newArrangement: string[]): boolean {
        const currentState = this.puzzleSystem.getPuzzleState(this.currentMapId, puzzleId);

        if (!currentState || currentState.type !== 'codeArrangement') {
            console.warn(`Puzzle '${puzzleId}' not found or is not a CodeArrangementPuzzle on map '${this.currentMapId}'.`);
            return false;
        }

        const codeArrangementState = currentState as CodeArrangementPuzzleState;
        const newState: CodeArrangementPuzzleState = {
            ...codeArrangementState,
            currentArrangement: newArrangement,
            isSolved: false, // The PuzzleSystem will determine if this new state is solved
        };

        this.puzzleSystem.updatePuzzleState(this.currentMapId, puzzleId, newState);
        return true;
    }

    /**
     * Checks if a specific puzzle is currently solved on the current map.
     * This method directly queries the PuzzleSystem for the puzzle's solved status.
     * @param puzzleId The ID of the puzzle to check.
     * @returns True if the puzzle is solved, false otherwise.
     */
    public isPuzzleSolved(puzzleId: string): boolean {
        return this.puzzleSystem.isPuzzleSolved(this.currentMapId, puzzleId);
    }
}