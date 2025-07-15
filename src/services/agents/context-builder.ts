import { File } from "parse-diff";
import {
  AgentContext,
  EnhancedContext,
  CodebaseContext,
  UserPreferences,
  HistoricalPatterns,
  PRDetails,
} from "../../types";
import type { AiService } from "../ai";

export class ContextBuilder {
  constructor(private aiService: AiService) {}

  async buildContext(agentContext: AgentContext): Promise<EnhancedContext> {
    const {
      prDetails,
      parsedDiff,
      codebaseContext,
      userPreferences,
      historicalPatterns,
    } = agentContext;

    // Build technical context
    const technicalContext = this.buildTechnicalContext(parsedDiff, prDetails);

    // Build user context
    const userContext = this.buildUserContext(
      userPreferences,
      prDetails.author,
    );

    // Build historical context
    const historicalContext = this.buildHistoricalContext(historicalPatterns);

    // Build architectural context
    const architecturalContext =
      this.buildArchitecturalContext(codebaseContext);

    // Generate AI-powered recommendations
    const recommendations = await this.generateRecommendations(agentContext);

    return {
      technicalContext,
      userContext,
      historicalContext,
      architecturalContext,
      recommendations,
    };
  }

  private buildTechnicalContext(
    parsedDiff: File[],
    prDetails: PRDetails,
  ): string {
    const changedFiles = parsedDiff.filter((f) => f.to && f.to !== "/dev/null");
    const deletedFiles = parsedDiff.filter((f) => f.to === "/dev/null");
    const newFiles = parsedDiff.filter((f) => f.from === "/dev/null");
    const renamedFiles = parsedDiff.filter(
      (f) => f.from && f.to && f.from !== f.to,
    );

    const totalChanges = parsedDiff.reduce(
      (sum, f) => sum + (f.chunks?.length ?? 0),
      0,
    );

    return `Technical Analysis:
- Files modified: ${changedFiles.length}
- Files added: ${newFiles.length}
- Files deleted: ${deletedFiles.length}
- Files renamed: ${renamedFiles.length}
- Total changes: ${totalChanges}
- Commit count: ${prDetails.commits.length}
- PR Title: "${prDetails.title}"
- PR Description: "${prDetails.description || "No description provided"}"`;
  }

  private buildUserContext(
    userPreferences: UserPreferences,
    author: string,
  ): string {
    return `User Context (${author}):
- Preferred style: ${userPreferences.summaryStyle}
- Focus areas: ${userPreferences.focusAreas.join(", ")}
- Detail level: ${userPreferences.detailLevel}
- Include suggestions: ${userPreferences.includeSuggestions}
- Language: ${userPreferences.preferredLanguage}`;
  }

  private buildHistoricalContext(
    historicalPatterns: HistoricalPatterns,
  ): string {
    const hasPatterns =
      historicalPatterns.commonChanges.length > 0 ||
      historicalPatterns.frequentIssues.length > 0 ||
      historicalPatterns.teamPreferences.length > 0;

    if (!hasPatterns) {
      return `Historical Context:
- This appears to be a new repository or user with no historical patterns yet`;
    }

    return `Historical Context:
- Common changes: ${historicalPatterns.commonChanges.slice(0, 3).join(", ") || "None recorded"}
- Frequent issues: ${historicalPatterns.frequentIssues.slice(0, 3).join(", ") || "None recorded"}
- Team preferences: ${historicalPatterns.teamPreferences.slice(0, 3).join(", ") || "None recorded"}
- Successful patterns: ${historicalPatterns.successfulPatterns.slice(0, 3).join(", ") || "None recorded"}`;
  }

  private buildArchitecturalContext(codebaseContext: CodebaseContext): string {
    return `Architecture Context:
- Architecture: ${codebaseContext.architecture}
- Tech stack: ${codebaseContext.techStack.join(", ") || "Not identified"}
- Complexity: ${codebaseContext.complexity}
- Patterns: ${codebaseContext.patterns.join(", ") || "None identified"}
- Conventions: ${codebaseContext.conventions.slice(0, 3).join(", ") || "None identified"}`;
  }

  private async generateRecommendations(
    agentContext: AgentContext,
  ): Promise<string[]> {
    const { parsedDiff, codebaseContext, userPreferences } = agentContext;

    try {
      // Use AI to generate contextual recommendations
      const recommendations = await this.aiService.generateRecommendations({
        parsedDiff,
        codebaseContext,
        userPreferences,
      });

      return recommendations;
    } catch (error) {
      console.warn("Failed to generate AI recommendations:", error);
      return this.generateFallbackRecommendations(agentContext);
    }
  }

  private generateFallbackRecommendations(
    agentContext: AgentContext,
  ): string[] {
    const { parsedDiff, codebaseContext } = agentContext;
    const recommendations: string[] = [];

    // Basic recommendations based on patterns
    if (codebaseContext.patterns.includes("test-modification")) {
      recommendations.push(
        "Consider running the test suite to ensure all tests pass",
      );
    }

    if (codebaseContext.patterns.includes("configuration-change")) {
      recommendations.push(
        "Verify configuration changes don't break existing functionality",
      );
    }

    if (codebaseContext.complexity === "high") {
      recommendations.push(
        "Consider breaking down this large change into smaller, focused PRs",
      );
    }

    if (parsedDiff.some((f) => f.to?.includes("package.json"))) {
      recommendations.push(
        "Update documentation if new dependencies were added",
      );
    }

    return recommendations.slice(0, 3);
  }
}
