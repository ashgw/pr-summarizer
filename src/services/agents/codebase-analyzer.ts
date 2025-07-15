import { File } from "parse-diff";
import { PRDetails, CodebaseContext } from "../../types";
import type { AiService } from "../ai";

export class CodebaseAnalyzer {
  constructor(private aiService: AiService) {}

  async analyze({
    parsedDiff,
    prDetails,
  }: {
    parsedDiff: File[];
    prDetails: PRDetails;
  }): Promise<CodebaseContext> {
    const fileTypes = this.analyzeFileTypes(parsedDiff);
    const complexity = this.assessComplexity(parsedDiff);
    const patterns = this.extractPatterns(parsedDiff);

    // Use AI to analyze architectural patterns
    const architecturalAnalysis = await this.aiService.analyzeArchitecture({
      fileTypes,
      patterns,
      commitMessages: prDetails.commits.map((c) => c.message),
    });

    return {
      architecture: architecturalAnalysis.architecture,
      patterns: patterns,
      conventions: architecturalAnalysis.conventions,
      techStack: fileTypes,
      complexity,
    };
  }

  private analyzeFileTypes(parsedDiff: File[]): string[] {
    const extensions = new Set<string>();

    for (const file of parsedDiff) {
      const fileName = file.to ?? file.from ?? "";
      const extension = fileName.split(".").pop()?.toLowerCase();
      if (extension) {
        extensions.add(extension);
      }
    }

    return Array.from(extensions);
  }

  private assessComplexity(parsedDiff: File[]): "low" | "medium" | "high" {
    const totalChanges = parsedDiff.reduce((sum, file) => {
      return sum + (file.chunks?.length ?? 0);
    }, 0);

    const fileCount = parsedDiff.length;

    if (totalChanges > 50 || fileCount > 10) return "high";
    if (totalChanges > 20 || fileCount > 5) return "medium";
    return "low";
  }

  private extractPatterns(parsedDiff: File[]): string[] {
    const patterns: string[] = [];

    // Analyze file patterns
    const hasNewFiles = parsedDiff.some((f) => f.from === "/dev/null");
    const hasDeletedFiles = parsedDiff.some((f) => f.to === "/dev/null");
    const hasRenamedFiles = parsedDiff.some(
      (f) => f.from && f.to && f.from !== f.to,
    );

    if (hasNewFiles) patterns.push("file-creation");
    if (hasDeletedFiles) patterns.push("file-deletion");
    if (hasRenamedFiles) patterns.push("file-renaming");

    // Analyze by file type
    const jsFiles = parsedDiff.filter(
      (f) => f.to?.endsWith(".js") || f.to?.endsWith(".ts"),
    );
    const configFiles = parsedDiff.filter(
      (f) => f.to?.includes("config") || f.to?.includes("package"),
    );
    const testFiles = parsedDiff.filter(
      (f) => f.to?.includes("test") || f.to?.includes("spec"),
    );

    if (jsFiles.length > 0) patterns.push("javascript-modification");
    if (configFiles.length > 0) patterns.push("configuration-change");
    if (testFiles.length > 0) patterns.push("test-modification");

    // Analyze directory patterns
    const srcFiles = parsedDiff.filter((f) => f.to?.includes("src/"));
    const docsFiles = parsedDiff.filter(
      (f) => f.to?.includes("doc") || f.to?.includes("README"),
    );
    const buildFiles = parsedDiff.filter(
      (f) => f.to?.includes("build") || f.to?.includes("dist"),
    );

    if (srcFiles.length > 0) patterns.push("source-code-change");
    if (docsFiles.length > 0) patterns.push("documentation-change");
    if (buildFiles.length > 0) patterns.push("build-system-change");

    return patterns;
  }
}
