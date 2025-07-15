import { EnhancedContext } from "../../types";
import type { AiService } from "../ai";

export class SummaryGenerator {
  constructor(private aiService: AiService) {}

  async generateSummary(enhancedContext: EnhancedContext): Promise<string> {
    const {
      technicalContext,
      userContext,
      historicalContext,
      architecturalContext,
      recommendations,
    } = enhancedContext;

    try {
      // Generate the main summary using AI
      const summary =
        await this.aiService.generateAgenticSummary(enhancedContext);

      if (!summary) {
        return this.generateFallbackSummary(enhancedContext);
      }

      // Format the summary with context and recommendations
      return this.formatSummary(summary, enhancedContext);
    } catch (error) {
      console.warn("Failed to generate AI summary, using fallback:", error);
      return this.generateFallbackSummary(enhancedContext);
    }
  }

  private formatSummary(summary: string, context: EnhancedContext): string {
    const { recommendations } = context;

    let formattedSummary = summary;

    // Add recommendations if any and user wants them
    if (recommendations.length > 0) {
      formattedSummary += "\n\n## 🤖 AI Recommendations\n";
      recommendations.forEach((rec, index) => {
        formattedSummary += `\n${index + 1}. ${rec}`;
      });
    }

    // Add context indicators
    formattedSummary += "\n\n---\n";
    formattedSummary +=
      "*Generated with enhanced AI context and learning capabilities*";

    return formattedSummary;
  }

  private generateFallbackSummary(context: EnhancedContext): string {
    const { technicalContext, recommendations } = context;

    // Extract basic info from technical context
    const lines = technicalContext.split("\n");
    const filesModified =
      lines
        .find((l) => l.includes("Files modified:"))
        ?.split(":")[1]
        ?.trim() || "0";
    const filesAdded =
      lines
        .find((l) => l.includes("Files added:"))
        ?.split(":")[1]
        ?.trim() || "0";
    const filesDeleted =
      lines
        .find((l) => l.includes("Files deleted:"))
        ?.split(":")[1]
        ?.trim() || "0";
    const totalChanges =
      lines
        .find((l) => l.includes("Total changes:"))
        ?.split(":")[1]
        ?.trim() || "0";

    let summary = `This pull request introduces changes across ${filesModified} modified files`;

    if (filesAdded !== "0") {
      summary += `, ${filesAdded} new files`;
    }

    if (filesDeleted !== "0") {
      summary += `, and ${filesDeleted} deleted files`;
    }

    summary += `, with a total of ${totalChanges} code changes. The modifications appear to be part of ongoing development work to enhance the codebase functionality and structure.`;

    // Add recommendations if any
    if (recommendations.length > 0) {
      summary += "\n\n## 🤖 AI Recommendations\n";
      recommendations.forEach((rec, index) => {
        summary += `\n${index + 1}. ${rec}`;
      });
    }

    summary += "\n\n---\n";
    summary +=
      "*Generated with enhanced AI context and learning capabilities (fallback mode)*";

    return summary;
  }
}
