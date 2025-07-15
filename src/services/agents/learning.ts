import { MemoryService } from "./memory";
import {
  PRDetails,
  UserPreferences,
  CodebaseContext,
  InteractionRecord,
  HistoricalPatterns,
} from "../../types";

export interface LearningData {
  prNumber: number;
  feedback: string;
  author: string;
  timestamp: number;
}

export class LearningService {
  private memoryService: MemoryService;

  constructor() {
    this.memoryService = new MemoryService();
  }

  async recordInteraction(interaction: {
    prDetails: PRDetails;
    summary: string;
    userPreferences: UserPreferences;
    codebaseContext: CodebaseContext;
  }): Promise<void> {
    const record: InteractionRecord = {
      timestamp: Date.now(),
      prNumber: interaction.prDetails.pull_number,
      author: interaction.prDetails.author,
      repo: interaction.prDetails.repo,
      summary: interaction.summary,
      userPreferences: interaction.userPreferences,
      codebaseContext: interaction.codebaseContext,
    };

    await this.memoryService.recordInteraction(record);

    // Update historical patterns based on this interaction
    await this.updateHistoricalPatterns(
      interaction.prDetails,
      interaction.codebaseContext,
    );
  }

  async processFeedback(feedback: {
    prNumber: number;
    feedback: string;
    author: string;
  }): Promise<void> {
    const { prNumber, feedback: feedbackText, author } = feedback;

    // Update user preferences based on feedback
    const currentPreferences =
      await this.memoryService.getUserPreferences(author);

    // Analyze feedback sentiment and update preferences
    const updatedPreferences = await this.analyzeFeedbackAndUpdatePreferences(
      currentPreferences,
      feedbackText,
    );

    await this.memoryService.updateUserPreferences(author, updatedPreferences);

    // Record the feedback for future learning
    const learningData: LearningData = {
      prNumber,
      feedback: feedbackText,
      author,
      timestamp: Date.now(),
    };

    // Store feedback for pattern analysis
    await this.storeFeedback(learningData);
  }

  private async analyzeFeedbackAndUpdatePreferences(
    currentPreferences: UserPreferences,
    feedback: string,
  ): Promise<Partial<UserPreferences>> {
    const updates: Partial<UserPreferences> = {};
    const feedbackLower = feedback.toLowerCase();

    // Analyze detail level feedback
    if (
      feedbackLower.includes("too detailed") ||
      feedbackLower.includes("too long")
    ) {
      updates.detailLevel = "low";
    } else if (
      feedbackLower.includes("not detailed enough") ||
      feedbackLower.includes("too short")
    ) {
      updates.detailLevel = "high";
    } else if (
      feedbackLower.includes("just right") ||
      feedbackLower.includes("good detail")
    ) {
      // Keep current detail level
    }

    // Analyze style feedback
    if (
      feedbackLower.includes("too technical") ||
      feedbackLower.includes("too complex")
    ) {
      updates.summaryStyle = "narrative";
    } else if (
      feedbackLower.includes("too casual") ||
      feedbackLower.includes("more technical")
    ) {
      updates.summaryStyle = "technical";
    } else if (
      feedbackLower.includes("concise") ||
      feedbackLower.includes("brief")
    ) {
      updates.summaryStyle = "concise";
    }

    // Analyze suggestions feedback
    if (
      feedbackLower.includes("no suggestions") ||
      feedbackLower.includes("skip recommendations")
    ) {
      updates.includeSuggestions = false;
    } else if (
      feedbackLower.includes("need suggestions") ||
      feedbackLower.includes("more recommendations")
    ) {
      updates.includeSuggestions = true;
    }

    // Analyze focus areas feedback
    if (feedbackLower.includes("focus on security")) {
      const currentFocus = currentPreferences.focusAreas || [];
      if (!currentFocus.includes("security")) {
        updates.focusAreas = [...currentFocus, "security"];
      }
    }

    if (feedbackLower.includes("focus on performance")) {
      const currentFocus = currentPreferences.focusAreas || [];
      if (!currentFocus.includes("performance")) {
        updates.focusAreas = [...currentFocus, "performance"];
      }
    }

    return updates;
  }

  private async updateHistoricalPatterns(
    prDetails: PRDetails,
    codebaseContext: CodebaseContext,
  ): Promise<void> {
    const currentPatterns = await this.memoryService.getHistoricalPatterns(
      prDetails.repo,
    );

    // Update common changes
    const newCommonChanges = [...currentPatterns.commonChanges];
    codebaseContext.patterns.forEach((pattern) => {
      if (!newCommonChanges.includes(pattern)) {
        newCommonChanges.push(pattern);
      }
    });

    // Update successful patterns (patterns that appear frequently)
    const patternCounts = new Map<string, number>();
    newCommonChanges.forEach((pattern) => {
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
    });

    const successfulPatterns = Array.from(patternCounts.entries())
      .filter(([_, count]) => count >= 3)
      .map(([pattern, _]) => pattern);

    const updatedPatterns: Partial<HistoricalPatterns> = {
      commonChanges: newCommonChanges.slice(-20), // Keep last 20 patterns
      successfulPatterns,
    };

    await this.memoryService.updateHistoricalPatterns(
      prDetails.repo,
      updatedPatterns,
    );
  }

  private async storeFeedback(learningData: LearningData): Promise<void> {
    // For now, we'll just log the feedback
    // In a more sophisticated implementation, this could be stored in a database
    // or used for more advanced learning algorithms
    console.log("Learning from feedback:", {
      prNumber: learningData.prNumber,
      author: learningData.author,
      feedback: learningData.feedback.substring(0, 100) + "...",
      timestamp: new Date(learningData.timestamp).toISOString(),
    });
  }

  async getLearningSummary(repo: string): Promise<{
    totalInteractions: number;
    uniqueUsers: number;
    commonPatterns: string[];
    recentFeedback: string[];
  }> {
    const history = await this.memoryService.getInteractionHistory(repo);
    const patterns = await this.memoryService.getHistoricalPatterns(repo);

    const uniqueUsers = new Set(history.map((record) => record.author)).size;
    const recentFeedback = history
      .filter((record) => record.feedback)
      .slice(-5)
      .map((record) => record.feedback!)
      .filter(Boolean);

    return {
      totalInteractions: history.length,
      uniqueUsers,
      commonPatterns: patterns.commonChanges.slice(0, 5),
      recentFeedback,
    };
  }
}
