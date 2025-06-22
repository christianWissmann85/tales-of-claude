// src/models/Quest.ts

import {
  Quest as IQuest,
  QuestObjective,
  QuestStatus,
  QuestRewards,
  ObjectiveType,
  Position, // Although 'target' is string for now, Position might be used for location mapping
} from '../types/global.types';
import { Player } from './Player'; // For giveRewards method
import { Item, ItemVariant } from './Item'; // For creating reward items

/**
 * Defines the specific variants of quests that can exist in the game.
 */
export enum QuestVariant {
  BugHunt = 'bug_hunt',
  LostCodeFragment = 'lost_code_fragment',
  MeetTheCompiler = 'meet_the_compiler',
}

/**
 * Defines the static data structure for each quest variant.
 * This omits 'id', 'currentObjectiveIndex', 'status' as they are instance-specific.
 * Objectives here are blueprints, so they don't have 'id', 'currentProgress', 'isCompleted' yet.
 */
export interface QuestData {
  name: string;
  description: string;
  objectives: Omit<QuestObjective, 'id' | 'currentProgress' | 'isCompleted'>[]; // Objectives blueprint
  rewards: QuestRewards;
  prerequisites: string[];
}

export class Quest implements IQuest {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[];
  currentObjectiveIndex: number;
  status: QuestStatus;
  rewards: QuestRewards;
  prerequisites: string[];

  /**
   * Static data for all quest variants. This acts as a blueprint for creating quests.
   */
  public static readonly QUEST_DATA: Record<QuestVariant, QuestData> = {
    [QuestVariant.BugHunt]: {
      name: 'Bug Hunt',
      description: 'The system is infested with bugs! Clear them out to restore system stability.',
      objectives: [
        {
          description: 'Defeat 3 Bug enemies.',
          type: 'defeat_enemy',
          target: 'bug', // Corresponds to EnemyType
          quantity: 3,
        },
      ],
      rewards: {
        exp: 50,
        items: [{ itemId: ItemVariant.HealthPotion, quantity: 1 }],
      },
      prerequisites: [], // No prerequisites for the first quest
    },
    [QuestVariant.LostCodeFragment]: {
      name: 'Lost Code Fragment',
      description: 'A crucial piece of ancient, corrupted code has gone missing. Find it to unlock new abilities.',
      objectives: [
        {
          description: 'Collect the Code Fragment.',
          type: 'collect_item',
          target: ItemVariant.CodeFragment, // Corresponds to ItemVariant
          quantity: 1,
        },
      ],
      rewards: {
        exp: 75,
        items: [{ itemId: ItemVariant.EnergyDrink, quantity: 1 }],
      },
      prerequisites: [QuestVariant.BugHunt], // Requires "Bug Hunt" to be completed
    },
    [QuestVariant.MeetTheCompiler]: {
      name: 'Meet the Compiler',
      description: 'The legendary Compiler Cat wishes to speak with you about the system\'s future.',
      objectives: [
        {
          description: 'Talk to Compiler Cat.',
          type: 'talk_to_npc',
          target: 'compiler_cat', // Corresponds to NPCRole
          quantity: 1, // Only needs to be done once
        },
      ],
      rewards: {
        exp: 100,
        items: [{ itemId: ItemVariant.DebuggerBlade, quantity: 1 }],
      },
      prerequisites: [QuestVariant.LostCodeFragment], // Requires "Lost Code Fragment"
    },
  };

  /**
   * Creates an instance of a Quest.
   * @param id The unique ID of the quest.
   * @param name The display name of the quest.
   * @param description A brief description of the quest.
   * @param objectives An array of QuestObjective blueprints.
   * @param rewards The rewards for completing the quest.
   * @param prerequisites An array of quest IDs that must be completed first.
   */
  constructor(id: string, name: string, description: string, objectives: Omit<QuestObjective, 'id' | 'currentProgress' | 'isCompleted'>[], rewards: QuestRewards, prerequisites: string[]) {
    this.id = id;
    this.name = name;
    this.description = description;
    // Initialize objectives with unique IDs and default progress/completion status
    this.objectives = objectives.map((obj, index) => ({
      ...obj,
      id: `${id}_obj_${index}`, // Generate unique ID for each objective within this quest
      currentProgress: 0, // Objectives start with 0 progress
      isCompleted: false, // Objectives start as not completed
    }));
    this.currentObjectiveIndex = 0; // Points to the first objective initially
    this.status = 'not_started';
    this.rewards = rewards;
    this.prerequisites = prerequisites;
  }

  /**
   * Factory method to create a Quest instance from a QuestVariant.
   * This is the preferred way to instantiate quests from predefined data.
   * @param variant The QuestVariant enum value (e.g., QuestVariant.BugHunt).
   * @returns A new Quest instance.
   */
  public static createQuest(variant: QuestVariant): Quest {
    const data = Quest.QUEST_DATA[variant];
    if (!data) {
      throw new Error(`Quest variant "${variant}" not found in QUEST_DATA.`);
    }

    // Create a deep copy of objectives to ensure each quest instance has its own mutable objectives
    const objectivesBlueprint: Omit<QuestObjective, 'id' | 'currentProgress' | 'isCompleted'>[] = data.objectives.map(obj => ({ ...obj }));

    return new Quest(
      variant, // Use variant string as the quest ID
      data.name,
      data.description,
      objectivesBlueprint,
      { ...data.rewards }, // Shallow copy rewards object
      [...data.prerequisites] // Shallow copy prerequisites array
    );
  }

  /**
   * Starts the quest, setting its status to 'in_progress'.
   * A quest can only be started if its status is 'not_started'.
   * @returns True if the quest was successfully started, false otherwise.
   */
  startQuest(): boolean {
    if (this.status === 'not_started') {
      this.status = 'in_progress';
      console.log(`Quest "${this.name}" started!`);
      return true;
    }
    console.warn(`Attempted to start quest "${this.name}" but its status is ${this.status}.`);
    return false;
  }

  /**
   * Updates the progress of a specific objective within the quest.
   * This method should be called by the game logic when relevant events occur (e.g., enemy defeated, item collected, NPC talked to).
   * @param objectiveType The type of objective being updated (e.g., 'defeat_enemy').
   * @param targetIdentifier The specific target ID (e.g., 'bug', 'code_fragment', 'compiler_cat').
   * @param progressAmount The amount to increment the current progress by (default 1).
   * @returns True if any objective was updated and potentially completed, false otherwise.
   */
  updateObjectiveProgress(objectiveType: ObjectiveType, targetIdentifier: string, progressAmount: number = 1): boolean {
    if (this.status !== 'in_progress') {
      // console.warn(`Cannot update objective for quest "${this.name}". Quest is not in progress.`);
      return false;
    }

    let updated = false;
    for (const objective of this.objectives) {
      if (!objective.isCompleted && objective.type === objectiveType && objective.target === targetIdentifier) {
        objective.currentProgress = Math.min(objective.quantity, objective.currentProgress + progressAmount);

        if (objective.currentProgress >= objective.quantity) {
          objective.isCompleted = true;
          console.log(`Objective "${objective.description}" for quest "${this.name}" completed!`);
          // Update currentObjectiveIndex to point to the next uncompleted objective
          this.currentObjectiveIndex = this.objectives.findIndex(obj => !obj.isCompleted);
          this.checkCompletion(); // Check if the entire quest is now complete
        } else {
          console.log(`Objective "${objective.description}" progress: ${objective.currentProgress}/${objective.quantity}`);
        }
        updated = true;
        // For single-target objectives (like talk_to_npc, reach_location), we might break here
        // For multi-target objectives (like defeat_enemy where multiple objectives might target 'bug'), we continue
        // For simplicity, we'll let it iterate through all matching objectives.
      }
    }
    return updated;
  }

  /**
   * Checks if all objectives are completed and updates the quest status accordingly.
   * This method is called internally after an objective's progress is updated.
   * @returns True if the quest is now completed, false otherwise.
   */
  checkCompletion(): boolean {
    const allObjectivesCompleted = this.objectives.every(obj => obj.isCompleted);

    if (allObjectivesCompleted && this.status === 'in_progress') {
      this.status = 'completed';
      return true;
    }
    return false;
  }

  /**
   * Awards the quest rewards (EXP and items) to the player.
   * This should typically be called by the game manager after the quest status is 'completed'.
   * @param player The player instance to give rewards to.
   */
  giveRewards(player: Player): void {
    if (this.status !== 'completed') {
      return;
    }

    // Give EXP
    if (this.rewards.exp > 0) {
      player.addExperience(this.rewards.exp);
    }

    // Give items
    for (const rewardItem of this.rewards.items) {
      for (let i = 0; i < rewardItem.quantity; i++) {
        // Ensure ItemVariant is correctly used for item creation
        const itemVariant = rewardItem.itemId as ItemVariant;
        if (Object.values(ItemVariant).includes(itemVariant)) {
          const newItem = Item.createItem(itemVariant);
          player.addItem(newItem);
        } else {
        }
      }
    }
  }

  /**
   * Checks if the quest is available to be started based on its prerequisites and current status.
   * @param completedQuests An array of IDs of quests that the player has already completed.
   * @returns True if the quest can be started, false otherwise.
   */
  isAvailable(completedQuests: string[]): boolean {
    if (this.status !== 'not_started') {
      return false; // Already started, in progress, or completed
    }

    if (this.prerequisites.length === 0) {
      return true; // No prerequisites, always available
    }

    // Check if all prerequisites are present in the completedQuests list
    return this.prerequisites.every(prereqId => completedQuests.includes(prereqId));
  }

  /**
   * Gets the current active objective (the first one that is not completed).
   * @returns The current active QuestObjective or null if all are completed.
   */
  getCurrentObjective(): QuestObjective | null {
    const activeObjective = this.objectives.find(obj => !obj.isCompleted);
    return activeObjective || null;
  }

  /**
   * Resets the quest to its initial 'not_started' state.
   * This method is useful for debugging or if quests are designed to be repeatable.
   */
  resetQuest(): void {
    this.status = 'not_started';
    this.currentObjectiveIndex = 0;
    this.objectives.forEach(obj => {
      obj.currentProgress = 0;
      obj.isCompleted = false;
    });
    console.log(`Quest "${this.name}" has been reset.`);
  }
}