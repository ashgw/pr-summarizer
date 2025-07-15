export interface PrData {
  commitMessages: string;
  diffSummary: string;
  filesChanged: string;
  prDescription: string;
  prTitle: string;
}

export interface PRDetails {
  owner: string;
  repo: string;
  pull_number: number;
  title: string;
  description: string;
  author: string;
  commits: {
    sha: string;
    message: string;
  }[];
}

export type Optional<T> = T | null;

// Agent-related types
export interface CodebaseContext {
  architecture: string;
  patterns: string[];
  conventions: string[];
  techStack: string[];
  complexity: "low" | "medium" | "high";
}

export interface UserPreferences {
  summaryStyle: "technical" | "narrative" | "concise";
  focusAreas: string[];
  detailLevel: "high" | "medium" | "low";
  includeSuggestions: boolean;
  preferredLanguage: string;
}

export interface HistoricalPatterns {
  commonChanges: string[];
  frequentIssues: string[];
  teamPreferences: string[];
  successfulPatterns: string[];
}

export interface AgentContext {
  prDetails: PRDetails;
  parsedDiff: import("parse-diff").File[];
  codebaseContext: CodebaseContext;
  userPreferences: UserPreferences;
  historicalPatterns: HistoricalPatterns;
}

export interface EnhancedContext {
  technicalContext: string;
  userContext: string;
  historicalContext: string;
  architecturalContext: string;
  recommendations: string[];
}

export interface InteractionRecord {
  timestamp: number;
  prNumber: number;
  author: string;
  repo: string;
  summary: string;
  feedback?: string;
  userPreferences: UserPreferences;
  codebaseContext: CodebaseContext;
}
