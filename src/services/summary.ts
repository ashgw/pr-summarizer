import { File } from "parse-diff";

import { Optional, PRDetails } from "../types";
import { AgenticSummaryService } from "./agents";
import type { AiService } from "./ai";

export class SummaryService {
  private static agenticService: AgenticSummaryService | null = null;

  private static getAgenticService(
    aiService: AiService,
  ): AgenticSummaryService {
    if (!this.agenticService) {
      this.agenticService = new AgenticSummaryService(aiService);
    }
    return this.agenticService;
  }

  public static async summarize({
    aiService,
    parsedDiff,
    prDetails,
  }: {
    parsedDiff: File[];
    prDetails: PRDetails;
    aiService: AiService;
  }): Promise<Optional<string>> {
    // Use the new agentic system
    const agenticService = this.getAgenticService(aiService);

    const summary = await agenticService.generateAgenticSummary({
      parsedDiff,
      prDetails,
    });

    if (!summary) return null;

    // Format the summary with file changes list
    return this.formatSummaryWithFileChanges(summary, parsedDiff);
  }

  private static formatSummaryWithFileChanges(
    summary: string,
    parsedDiff: File[],
  ): string {
    const fileChangesSection =
      parsedDiff.map((file) => file.to).length > 3
        ? `\n\n#### Files Changed
${parsedDiff
  .map((file) => {
    // Check for deleted files first
    if (file.to === "/dev/null") {
      return `- \`${file.from}\` 🗑️ (deleted)`;
    }
    // Check for new files
    if (file.from === "/dev/null") {
      return `- \`${file.to}\` ✨ (new)`;
    }
    // Check for renamed files
    if (file.from && file.to && file.from !== file.to) {
      return `- \`${file.from}\` ➜ \`${file.to}\` 📝 (renamed)`;
    }
    // Modified files
    if (file.to) {
      return `- \`${file.to}\` 📝 (modified)`;
    }
    return null;
  })
  .filter(Boolean)
  .join("\n")
  // Remove any lines containing /dev/null
  .replace(/^.*\/dev\/null.*$/gm, "")}`
        : "";

    return summary + fileChangesSection;
  }

  // New method for learning from feedback
  public static async learnFromFeedback({
    prNumber,
    feedback,
    author,
    aiService,
  }: {
    prNumber: number;
    feedback: string;
    author: string;
    aiService: AiService;
  }): Promise<void> {
    const agenticService = this.getAgenticService(aiService);
    await agenticService.learnFromFeedback({
      prNumber,
      feedback,
      author,
    });
  }

  // New method to get agent status
  public static async getAgentStatus({
    repo,
    aiService,
  }: {
    repo: string;
    aiService: AiService;
  }): Promise<{
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
    const agenticService = this.getAgenticService(aiService);
    return await agenticService.getAgentStatus(repo);
  }
}
