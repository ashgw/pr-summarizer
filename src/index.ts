import * as core from "@actions/core";
import { readFileSync } from "fs";
import parseDiff from "parse-diff";
import { minimatch } from "minimatch";

import { GitHubService } from "./services/github";
import { SummaryService } from "./services/summary";
import { AiService } from "./services/ai";
import { Optional } from "./types";

async function main() {
  core.info("Starting agentic code summarization process...");

  const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN");
  const OPENAI_API_KEY = core.getInput("OPENAI_API_KEY");
  const OPENAI_API_MODEL = core.getInput("OPENAI_API_MODEL") || "gpt-4o";
  const ENABLE_AGENTIC_MODE = true; // change after testing

  try {
    const githubService = new GitHubService({
      GITHUB_TOKEN,
    });

    const prDetails = await githubService.getPRDetails();
    core.info(`Analyzing PR #${prDetails.pull_number}: ${prDetails.title}`);

    let diff: Optional<string>;
    const eventData = JSON.parse(
      readFileSync(process.env.GITHUB_EVENT_PATH ?? "", "utf8")
    );

    if (eventData.action === "opened" || eventData.action === "synchronize") {
      diff = await githubService.getDiff(
        prDetails.owner,
        prDetails.repo,
        prDetails.pull_number
      );
    } else {
      core.info("Unsupported event: " + process.env.GITHUB_EVENT_NAME);
      return;
    }

    if (!diff) {
      core.info("No diff found");
      return;
    }

    const parsedDiff = parseDiff(diff);

    const excludePatterns = core
      .getInput("exclude")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const filteredDiff = parsedDiff.filter((file) => {
      const filePath = file.to ?? "";
      return !excludePatterns.some((pattern) => minimatch(filePath, pattern));
    });

    const aiService = new AiService({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_API_MODEL,
    });

    const summary = await SummaryService.summarize({
      aiService,
      parsedDiff: filteredDiff,
      prDetails,
    });

    if (summary) {
      const ownerType = core.getInput("owner") ?? "bot";
      const useAuthorIdentity = ownerType === "author";

      await githubService.createComment(
        prDetails.owner,
        prDetails.repo,
        prDetails.pull_number,
        summary,
        useAuthorIdentity,
        useAuthorIdentity ? prDetails.author : undefined
      );

      // If agentic mode is enabled, log additional information
      if (ENABLE_AGENTIC_MODE) {
        core.info(
          "Agentic mode enabled - enhanced learning capabilities active"
        );

        try {
          const agentStatus = await SummaryService.getAgentStatus({
            repo: prDetails.repo,
            aiService,
          });

          core.info(`Agent Status:
- Users tracked: ${agentStatus.memoryStatus.userCount}
- Total interactions: ${agentStatus.memoryStatus.interactionCount}
- Has codebase context: ${agentStatus.memoryStatus.hasCodebaseContext}
- Common patterns: ${agentStatus.learningStatus.commonPatterns.join(", ")}`);
        } catch (error) {
          core.warning(`Failed to get agent status: ${error}`);
        }
      }
    }
  } catch (error) {
    core.setFailed(
      `Action failed: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}

main().catch((error) => {
  core.setFailed(
    `Unhandled error: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
