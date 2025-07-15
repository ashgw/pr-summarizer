import { File } from "parse-diff";
import { PRDetails, Optional, AgentContext } from "../../types";
import { MemoryService } from "./memory";
import { CodebaseAnalyzer } from "./codebase-analyzer";
import { ContextBuilder } from "./context-builder";
import { SummaryGenerator } from "./summary-generator";
import { LearningService } from "./learning";
import type { AiService } from "../ai";

export class AgenticSummaryService {
  private memoryService: MemoryService;
  private codebaseAnalyzer: CodebaseAnalyzer;
  private contextBuilder: ContextBuilder;
  private summaryGenerator: SummaryGenerator;
  private learningService: LearningService;

  constructor(private aiService: AiService) {
    this.memoryService = new MemoryService();
    this.codebaseAnalyzer = new CodebaseAnalyzer(aiService);
    this.contextBuilder = new ContextBuilder(aiService);
    this.summaryGenerator = new SummaryGenerator(aiService);
    this.learningService = new LearningService();
  }

  public async generateAgenticSummary({
    parsedDiff,
    prDetails,
  }: {
    parsedDiff: File[];
    prDetails: PRDetails;
  }): Promise<Optional<string>> {
    try {
      // Step 1: Load memory and context
      const userPreferences = await this.memoryService.getUserPreferences(
        prDetails.author,
      );
      const historicalPatterns = await this.memoryService.getHistoricalPatterns(
        prDetails.repo,
      );

      // Step 2: Analyze codebase context
      const codebaseContext = await this.codebaseAnalyzer.analyze({
        parsedDiff,
        prDetails,
      });

      // Step 3: Build comprehensive context
      const agentContext: AgentContext = {
        prDetails,
        parsedDiff,
        codebaseContext,
        userPreferences,
        historicalPatterns,
      };

      const enhancedContext =
        await this.contextBuilder.buildContext(agentContext);

      // Step 4: Generate intelligent summary
      const summary =
        await this.summaryGenerator.generateSummary(enhancedContext);

      // Step 5: Learn from this interaction
      await this.learningService.recordInteraction({
        prDetails,
        summary,
        userPreferences,
        codebaseContext,
      });

      // Step 6: Update codebase context in memory
      await this.memoryService.updateCodebaseContext(
        prDetails.repo,
        codebaseContext,
      );

      return summary;
    } catch (error) {
      console.error("Error in agentic summary generation:", error);
      return this.generateFallbackSummary(parsedDiff, prDetails);
    }
  }

  public async learnFromFeedback({
    prNumber,
    feedback,
    author,
  }: {
    prNumber: number;
    feedback: string;
    author: string;
  }): Promise<void> {
    try {
      await this.learningService.processFeedback({
        prNumber,
        feedback,
        author,
      });
    } catch (error) {
      console.error("Error processing feedback:", error);
    }
  }

  public async getAgentStatus(repo: string): Promise<{
    memoryStatus: {
      userCount: number;
      interactionCount: number;
      hasCodebaseContext: boolean;
    };
    learningStatus: {
      totalInteractions: number;
      uniqueUsers: number;
      commonPatterns: string[];
      recentFeedback: string[];
    };
  }> {
    try {
      const history = await this.memoryService.getInteractionHistory(repo);
      const codebaseContext = await this.memoryService.getCodebaseContext(repo);
      const learningSummary =
        await this.learningService.getLearningSummary(repo);

      const uniqueUsers = new Set(history.map((record) => record.author)).size;

      return {
        memoryStatus: {
          userCount: uniqueUsers,
          interactionCount: history.length,
          hasCodebaseContext: codebaseContext !== null,
        },
        learningStatus: learningSummary,
      };
    } catch (error) {
      console.error("Error getting agent status:", error);
      return {
        memoryStatus: {
          userCount: 0,
          interactionCount: 0,
          hasCodebaseContext: false,
        },
        learningStatus: {
          totalInteractions: 0,
          uniqueUsers: 0,
          commonPatterns: [],
          recentFeedback: [],
        },
      };
    }
  }

  private generateFallbackSummary(
    parsedDiff: File[],
    prDetails: PRDetails,
  ): string {
    const changedFiles = parsedDiff.filter((f) => f.to && f.to !== "/dev/null");
    const newFiles = parsedDiff.filter((f) => f.from === "/dev/null");
    const deletedFiles = parsedDiff.filter((f) => f.to === "/dev/null");
    const totalChanges = parsedDiff.reduce(
      (sum, f) => sum + (f.chunks?.length ?? 0),
      0,
    );

    let summary = `This pull request "${prDetails.title}" introduces changes across ${changedFiles.length} modified files`;

    if (newFiles.length > 0) {
      summary += `, ${newFiles.length} new files`;
    }

    if (deletedFiles.length > 0) {
      summary += `, and ${deletedFiles.length} deleted files`;
    }

    summary += `, with a total of ${totalChanges} code changes.`;

    if (prDetails.description) {
      summary += ` The PR description indicates: "${prDetails.description.substring(0, 200)}${prDetails.description.length > 200 ? "..." : ""}"`;
    }

    summary += "\n\n---\n";
    summary +=
      "*Generated with enhanced AI context and learning capabilities (fallback mode)*";

    return summary;
  }
}

// Export all the agent classes for external use
export { MemoryService } from "./memory";
export { CodebaseAnalyzer } from "./codebase-analyzer";
export { ContextBuilder } from "./context-builder";
export { SummaryGenerator } from "./summary-generator";
export { LearningService } from "./learning";
