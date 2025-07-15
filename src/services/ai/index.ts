import { Optional } from "ts-roids";
import OpenAI from "openai";
import { createRichSummaryPrompt } from "./prompts";
import type { PrData } from "../../types";
import type { File } from "parse-diff";

export class AiService {
  private openai: OpenAI;
  private model: string;
  constructor({
    apiKey,
    model = "gpt-4o",
  }: {
    apiKey: string;
    model?: string;
  }) {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  public async getAiSummary(input: PrData): Promise<Optional<string>> {
    const { prompt } = this.getPrompt(input);
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      seed: 69,
    });
    return response.choices[0].message?.content?.trim() ?? null;
  }

  public async analyzeArchitecture(input: {
    fileTypes: string[];
    patterns: string[];
    commitMessages: string[];
  }): Promise<{
    architecture: string;
    conventions: string[];
  }> {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert software architect. Analyze the provided file types, patterns, and commit messages to identify architectural patterns and coding conventions. Be concise and specific.",
        },
        {
          role: "user",
          content: `Analyze this codebase:
File types: ${input.fileTypes.join(", ")}
Patterns: ${input.patterns.join(", ")}
Commit messages: ${input.commitMessages.join("\n")}

Provide a JSON response with:
{
  "architecture": "brief architectural description",
  "conventions": ["convention1", "convention2", "convention3"]
}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const content = response.choices[0].message?.content?.trim() ?? "";

    try {
      const parsed = JSON.parse(content);
      return {
        architecture: parsed.architecture || "Unknown architecture",
        conventions: parsed.conventions || [],
      };
    } catch (error) {
      // Fallback parsing if JSON fails
      const lines = content.split("\n").filter((line) => line.trim());
      return {
        architecture: lines[0] || "Unknown architecture",
        conventions: lines
          .slice(1)
          .map((line) => line.replace(/^[-*]\s*/, ""))
          .filter(Boolean),
      };
    }
  }

  public async generateRecommendations(input: {
    parsedDiff: File[];
    codebaseContext: import("../../types").CodebaseContext;
    userPreferences: import("../../types").UserPreferences;
  }): Promise<string[]> {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert code reviewer. Generate 2-3 actionable recommendations based on the code changes and context provided. Focus on practical improvements.",
        },
        {
          role: "user",
          content: `Based on these changes and context, provide recommendations:
Changes: ${input.parsedDiff.length} files modified
Tech stack: ${input.codebaseContext.techStack.join(", ")}
Complexity: ${input.codebaseContext.complexity}
Patterns: ${input.codebaseContext.patterns.join(", ")}
User preferences: ${input.userPreferences.summaryStyle} style, ${input.userPreferences.detailLevel} detail

Provide a JSON array of recommendations: ["recommendation1", "recommendation2", "recommendation3"]`,
        },
      ],
      temperature: 0.4,
      max_tokens: 1024,
    });

    const content = response.choices[0].message?.content?.trim() ?? "";

    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      // Fallback parsing if JSON fails
      return content
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => line.replace(/^[-*]\s*/, ""))
        .filter(Boolean)
        .slice(0, 3);
    }
  }

  public async generateAgenticSummary(
    context: import("../../types").EnhancedContext,
  ): Promise<Optional<string>> {
    const {
      technicalContext,
      userContext,
      historicalContext,
      architecturalContext,
    } = context;

    const system = `You are an intelligent code review agent with deep contextual understanding and learning capabilities. You have access to:

1. **Technical Context**: Detailed analysis of the changes
2. **User Context**: Individual preferences and style requirements  
3. **Historical Context**: Patterns from previous reviews and team preferences
4. **Architectural Context**: Understanding of the codebase structure and conventions

Your role is to generate comprehensive, contextual summaries that:
- Match the user's preferred style and detail level
- Consider historical patterns and team preferences
- Provide insights based on architectural understanding
- Focus on the "why" and "how" of the changes, not just the "what"

Write in a confident, technical tone that demonstrates deep understanding of the codebase and the specific changes being made.

Format your response as a single, coherent technical narrative that flows naturally from introduction to conclusion.`;

    const user = `Generate a comprehensive code review summary using the following context:

${technicalContext}

${userContext}

${historicalContext}

${architecturalContext}

Write a detailed technical narrative that explains the changes, their impact, and any relevant architectural considerations.`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      max_tokens: 4096,
      seed: 69,
    });

    return response.choices[0].message?.content?.trim() ?? null;
  }

  private getPrompt(input: PrData): {
    prompt: { system: string; user: string };
  } {
    return createRichSummaryPrompt({
      prTitle: input.prTitle,
      prDescription: input.prDescription,
      commitMessages: input.commitMessages,
      diffSummary: input.diffSummary,
    });
  }
}
