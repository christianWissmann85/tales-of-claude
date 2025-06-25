// src/models/NPC.ts

import { NPC, NPCRole, BaseCharacter, Position, StatusEffect } from '../types/global.types';

/**
 * Concrete implementation of the NPC interface for the Tales of Claude game.
 * This class manages an NPC's properties, including their role, dialogue, position,
 * status effects, and optional quest status.
 */
export class NPCModel implements NPC {
  // Private properties to store the NPC's data.
  private readonly _id: string;
  private readonly _name: string;
  private _position: Position;
  private _statusEffects: StatusEffect[];
  private readonly _role: NPCRole;
  private readonly _dialogueId: string;
  private _questStatus?: 'not_started' | 'in_progress' | 'completed';
  private readonly _factionId?: string;

  /**
   * Constructs a new NPCModel instance.
   * @param id A unique identifier for the NPC.
   * @param name The name of the NPC.
   * @param position The current position of the NPC on the map.
   * @param statusEffects An array of active status effects on the NPC.
   * @param role The role of the NPC (e.g., 'wizard', 'quest_giver').
   * @param dialogueId The key to retrieve dialogue lines for this NPC.
   * @param questStatus Optional. The current quest status related to this NPC.
   * @param factionId Optional. The faction this NPC is affiliated with.
   */
  constructor(
    id: string,
    name: string,
    position: Position,
    statusEffects: StatusEffect[],
    role: NPCRole,
    dialogueId: string,
    questStatus?: 'not_started' | 'in_progress' | 'completed',
    factionId?: string,
  ) {
    this._id = id;
    this._name = name;
    this._position = { ...position }; // Store a copy to prevent external modification
    this._statusEffects = [...statusEffects]; // Store a shallow copy
    this._role = role;
    this._dialogueId = dialogueId;
    this._questStatus = questStatus;
    this._factionId = factionId;
  }

  // --- Public Getters ---

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get position(): Position {
    return { ...this._position };
  }

  public get statusEffects(): StatusEffect[] {
    return [...this._statusEffects];
  }

  public get role(): NPCRole {
    return this._role;
  }

  public get dialogueId(): string {
    return this._dialogueId;
  }

  public get questStatus(): 'not_started' | 'in_progress' | 'completed' | undefined {
    return this._questStatus;
  }

  public get factionId(): string | undefined {
    return this._factionId;
  }

  // --- Public Methods ---

  /**
   * Updates the NPC's position.
   * @param newPosition The new position for the NPC.
   */
  public updatePosition(newPosition: Position): void {
    this._position = { ...newPosition };
  }

  /**
   * Adds a status effect to the NPC.
   * @param effect The status effect to add.
   */
  public addStatusEffect(effect: StatusEffect): void {
    if (!this._statusEffects.some(e => e.type === effect.type)) {
      this._statusEffects.push(effect);
    }
  }

  /**
   * Removes a status effect from the NPC by its type.
   * @param effectType The type of status effect to remove.
   */
  public removeStatusEffect(effectType: string): void {
    this._statusEffects = this._statusEffects.filter(effect => effect.type !== effectType);
  }

  /**
   * Updates the NPC's quest status.
   * @param status The new quest status.
   */
  public updateQuestStatus(status: 'not_started' | 'in_progress' | 'completed'): void {
    this._questStatus = status;
  }

  // --- Static Factory Methods ---

  /**
   * Generates a simple unique ID for an NPC.
   * @returns A unique string ID.
   */
  private static generateId(): string {
    return `npc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Creates an NPCModel instance.
   * @param name The name of the NPC.
   * @param role The role of the NPC.
   * @param dialogueId The key for the NPC's dialogue.
   * @param position The initial position of the NPC.
   * @param statusEffects Initial status effects.
   * @param questStatus Optional quest status.
   * @param factionId Optional faction affiliation.
   * @returns A new NPCModel instance.
   */
  public static create(
    name: string,
    role: NPCRole,
    dialogueId: string,
    position: Position = { x: 0, y: 0 },
    statusEffects: StatusEffect[] = [],
    questStatus?: 'not_started' | 'in_progress' | 'completed',
    factionId?: string,
  ): NPCModel {
    return new NPCModel(
      NPCModel.generateId(),
      name,
      position,
      statusEffects,
      role,
      dialogueId,
      questStatus,
      factionId,
    );
  }

  /**
   * Creates a Wizard NPC.
   */
  public static createWizard(
    name: string,
    dialogueId: string,
    position?: Position,
  ): NPCModel {
    return NPCModel.create(name, 'wizard', dialogueId, position);
  }

  /**
   * Creates a Debugger NPC.
   */
  public static createDebugger(
    name: string,
    dialogueId: string,
    position?: Position,
  ): NPCModel {
    return NPCModel.create(name, 'debugger', dialogueId, position);
  }

  /**
   * Creates a Lost Program NPC.
   */
  public static createLostProgram(
    name: string,
    dialogueId: string,
    position?: Position,
  ): NPCModel {
    return NPCModel.create(name, 'lost_program', dialogueId, position);
  }

  /**
   * Creates a Compiler Cat NPC.
   */
  public static createCompilerCat(
    name: string,
    dialogueId: string,
    position?: Position,
  ): NPCModel {
    return NPCModel.create(name, 'compiler_cat', dialogueId, position);
  }

  /**
   * Creates a Tutorial NPC.
   */
  public static createTutorial(
    name: string,
    dialogueId: string,
    position?: Position,
  ): NPCModel {
    return NPCModel.create(name, 'tutorial', dialogueId, position);
  }

  /**
   * Creates a Bard NPC.
   */
  public static createBard(
    name: string,
    dialogueId: string,
    position?: Position,
  ): NPCModel {
    return NPCModel.create(name, 'bard', dialogueId, position);
  }

  /**
   * Creates a Healer NPC.
   */
  public static createHealer(
    name: string,
    dialogueId: string,
    position?: Position,
  ): NPCModel {
    return NPCModel.create(name, 'healer', dialogueId, position);
  }

  /**
   * Creates a Quest Giver NPC.
   */
  public static createQuestGiver(
    name: string,
    dialogueId: string,
    questStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started',
    position?: Position,
  ): NPCModel {
    return NPCModel.create(name, 'quest_giver', dialogueId, position, [], questStatus);
  }
}