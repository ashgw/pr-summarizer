import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import {
  UserPreferences,
  HistoricalPatterns,
  CodebaseContext,
  InteractionRecord,
} from "../../types";

export interface MemoryData {
  userPreferences: Record<string, UserPreferences>;
  historicalPatterns: Record<string, HistoricalPatterns>;
  codebaseContexts: Record<string, CodebaseContext>;
  interactionHistory: InteractionRecord[];
}

export class MemoryService {
  private memoryPath: string;
  private memory: MemoryData;

  constructor() {
    this.memoryPath = join(process.cwd(), ".agent-memory.json");
    this.memory = this.loadMemory();
  }

  private loadMemory(): MemoryData {
    if (!existsSync(this.memoryPath)) {
      return {
        userPreferences: {},
        historicalPatterns: {},
        codebaseContexts: {},
        interactionHistory: [],
      };
    }

    try {
      const data = readFileSync(this.memoryPath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.warn("Failed to load memory, starting fresh:", error);
      return {
        userPreferences: {},
        historicalPatterns: {},
        codebaseContexts: {},
        interactionHistory: [],
      };
    }
  }

  private saveMemory(): void {
    try {
      writeFileSync(this.memoryPath, JSON.stringify(this.memory, null, 2));
    } catch (error) {
      console.warn("Failed to save memory:", error);
    }
  }

  async getUserPreferences(author: string): Promise<UserPreferences> {
    const preferences = this.memory.userPreferences[author];
    if (preferences) {
      return preferences;
    }

    // Default preferences
    return {
      summaryStyle: "technical",
      focusAreas: ["architecture", "performance", "security"],
      detailLevel: "medium",
      includeSuggestions: true,
      preferredLanguage: "en",
    };
  }

  async updateUserPreferences(
    author: string,
    preferences: Partial<UserPreferences>,
  ): Promise<void> {
    this.memory.userPreferences[author] = {
      ...(await this.getUserPreferences(author)),
      ...preferences,
    };
    this.saveMemory();
  }

  async getHistoricalPatterns(repo: string): Promise<HistoricalPatterns> {
    const patterns = this.memory.historicalPatterns[repo];
    if (patterns) {
      return patterns;
    }

    return {
      commonChanges: [],
      frequentIssues: [],
      teamPreferences: [],
      successfulPatterns: [],
    };
  }

  async updateHistoricalPatterns(
    repo: string,
    patterns: Partial<HistoricalPatterns>,
  ): Promise<void> {
    this.memory.historicalPatterns[repo] = {
      ...(await this.getHistoricalPatterns(repo)),
      ...patterns,
    };
    this.saveMemory();
  }

  async recordInteraction(record: InteractionRecord): Promise<void> {
    this.memory.interactionHistory.push(record);

    // Keep only last 1000 interactions to prevent memory bloat
    if (this.memory.interactionHistory.length > 1000) {
      this.memory.interactionHistory =
        this.memory.interactionHistory.slice(-1000);
    }

    this.saveMemory();
  }

  async getCodebaseContext(repo: string): Promise<CodebaseContext | null> {
    return this.memory.codebaseContexts[repo] || null;
  }

  async updateCodebaseContext(
    repo: string,
    context: CodebaseContext,
  ): Promise<void> {
    this.memory.codebaseContexts[repo] = context;
    this.saveMemory();
  }

  async getInteractionHistory(
    repo?: string,
    author?: string,
  ): Promise<InteractionRecord[]> {
    let history = this.memory.interactionHistory;

    if (repo) {
      history = history.filter((record) => record.repo === repo);
    }

    if (author) {
      history = history.filter((record) => record.author === author);
    }

    return history;
  }
}
