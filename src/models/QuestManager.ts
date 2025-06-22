// src/models/QuestManager.ts

import { Quest, QuestVariant } from './Quest'; // Import Quest class and QuestVariant enum
import { Player } from './Player'; // Import Player class for rewards
import {
  QuestStatus,
  ObjectiveType,
  Quest as IQuest,
} from '../types/global.types';

interface QuestManagerState {
  allQuests: IQuest[];
  activeQuestIds: string[];
  completedQuestIds: string[];
}

export class QuestManager {
  private static instance: QuestManager;

  // Make allQuests public so QuestLog can access it to filter completed quests
  public allQuests: Quest[] = [];
  private activeQuests: Quest[] = [];
  private completedQuestIds: string[] = [];

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): QuestManager {
    if (!QuestManager.instance) {
      QuestManager.instance = new QuestManager();
    }
    return QuestManager.instance;
  }

  public initializeQuests(): void {
    this.allQuests = [];
    this.activeQuests = [];
    this.completedQuestIds = [];

    for (const variant of Object.values(QuestVariant)) {
      try {
        const quest = Quest.createQuest(variant);
        this.allQuests.push(quest);
      } catch (error) {
      }
    }
  }

  public getAvailableQuests(): Quest[] {
    return this.allQuests.filter(quest =>
      quest.isAvailable(this.completedQuestIds) && quest.status === 'not_started'
    );
  }

  public startQuest(questId: string): boolean {
    const quest = this.getQuestById(questId);
    if (!quest) {
      return false;
    }

    if (!quest.isAvailable(this.completedQuestIds)) {
      return false;
    }

    const started = quest.startQuest();
    if (started) {
      this.activeQuests.push(quest);
    }
    return started;
  }

  public updateQuestProgress(objectiveType: ObjectiveType, target: string, amount: number = 1): void {
    let questCompleted = false;

    for (const quest of this.activeQuests) {
      const updated = quest.updateObjectiveProgress(objectiveType, target, amount);
      if (updated) {

        if (quest.status === 'completed' && !this.completedQuestIds.includes(quest.id)) {
          questCompleted = true;
          this.completedQuestIds.push(quest.id);
        }
      }
    }

    if (questCompleted) {
      this.activeQuests = this.activeQuests.filter(q => q.status !== 'completed');
    }
  }

  public completeQuest(questId: string, player: Player): boolean {
    const quest = this.getQuestById(questId);
    if (!quest) {
      return false;
    }

    if (quest.status !== 'completed') {
      return false;
    }

    quest.giveRewards(player);

    if (!this.completedQuestIds.includes(questId)) {
      this.completedQuestIds.push(questId);
    }

    this.activeQuests = this.activeQuests.filter(q => q.id !== questId);
    return true;
  }

  public getActiveQuests(): Quest[] {
    return [...this.activeQuests];
  }

  public getQuestById(questId: string): Quest | undefined {
    return this.allQuests.find(quest => quest.id === questId);
  }

  public saveState(): QuestManagerState {
    return {
      allQuests: this.allQuests.map(quest => ({
        id: quest.id,
        name: quest.name,
        description: quest.description,
        objectives: quest.objectives.map(obj => ({ ...obj })),
        currentObjectiveIndex: quest.currentObjectiveIndex,
        status: quest.status,
        rewards: {
          exp: quest.rewards.exp,
          items: quest.rewards.items.map(item => ({ ...item })),
        },
        prerequisites: [...quest.prerequisites],
      })),
      activeQuestIds: this.activeQuests.map(q => q.id),
      completedQuestIds: [...this.completedQuestIds],
    };
  }

  public loadState(state: QuestManagerState): void {
    this.initializeQuests();

    for (const savedQuest of state.allQuests) {
      const quest = this.getQuestById(savedQuest.id);
      if (quest) {
        quest.status = savedQuest.status;
        quest.currentObjectiveIndex = savedQuest.currentObjectiveIndex;

        for (let i = 0; i < quest.objectives.length; i++) {
          if (savedQuest.objectives[i]) {
            quest.objectives[i].currentProgress = savedQuest.objectives[i].currentProgress;
            quest.objectives[i].isCompleted = savedQuest.objectives[i].isCompleted;
          }
        }
      }
    }

    this.activeQuests = state.activeQuestIds
      .map(id => this.getQuestById(id))
      .filter(quest => quest !== undefined) as Quest[];

    this.completedQuestIds = [...state.completedQuestIds];

  }
}