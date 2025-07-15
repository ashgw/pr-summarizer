# 🤖 Agentic PR Summarizer Features

## Overview

The PR summarizer now includes an advanced agentic system with memory, learning capabilities, and deep codebase context understanding. This transforms the simple PR summarizer into an intelligent assistant that learns from your team's preferences and provides increasingly better summaries over time.

## 🏗️ Architecture

The agentic system consists of multiple specialized agents working together:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Memory        │    │   Codebase      │    │   Context       │
│   Service       │    │   Analyzer      │    │   Builder       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Summary       │
                    │   Generator     │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Learning      │
                    │   Service       │
                    └─────────────────┘
```

## 🧠 Key Features

### 1. **Persistent Memory System**

- **User Preferences**: Remembers each user's preferred summary style, detail level, and focus areas
- **Historical Patterns**: Tracks common changes, frequent issues, and team preferences per repository
- **Codebase Context**: Maintains understanding of project architecture and conventions
- **Interaction History**: Stores all interactions for continuous learning

### 2. **Multi-Agent Workflow**

- **Codebase Analyzer**: Analyzes file types, patterns, and complexity
- **Context Builder**: Combines technical, user, historical, and architectural contexts
- **Summary Generator**: Creates intelligent, personalized summaries
- **Learning Service**: Processes feedback and updates preferences

### 3. **Learning Capabilities**

- **Feedback Processing**: Learns from user feedback to improve future summaries
- **Pattern Recognition**: Identifies common patterns in code changes
- **Preference Adaptation**: Adapts summary style based on user preferences
- **Continuous Improvement**: Each interaction improves the system's understanding

### 4. **Enhanced Context Understanding**

- **Technical Context**: Detailed analysis of changes, file types, and complexity
- **User Context**: Individual preferences and style requirements
- **Historical Context**: Patterns from previous reviews and team preferences
- **Architectural Context**: Understanding of codebase structure and conventions

## 🚀 Usage

### Basic Setup

```yaml
name: PR Summarizer
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  summarize:
    runs-on: ubuntu-latest
    steps:
      - name: PR Summarizer
        uses: ashgw/pr-summarizer@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ENABLE_AGENTIC_MODE: "true" # Enable agentic features
```

### Advanced Configuration

```yaml
- name: PR Summarizer
  uses: ashgw/pr-summarizer@v1
  with:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    OPENAI_API_MODEL: "gpt-4o"
    ENABLE_AGENTIC_MODE: "true"
    exclude: "**/*.lock,dist/**/*,**/*.min.js"
    owner: "author"
    override_summary: "true"
```

## 📚 Learning from Feedback

The system learns from user feedback automatically. Users can provide feedback by commenting on PRs with specific keywords:

### Style Feedback

- **"too detailed"** or **"too long"** → Reduces detail level
- **"not detailed enough"** or **"too short"** → Increases detail level
- **"too technical"** or **"too complex"** → Switches to narrative style
- **"too casual"** or **"more technical"** → Switches to technical style
- **"concise"** or **"brief"** → Switches to concise style

### Suggestion Feedback

- **"no suggestions"** or **"skip recommendations"** → Disables suggestions
- **"need suggestions"** or **"more recommendations"** → Enables suggestions

### Focus Area Feedback

- **"focus on security"** → Adds security to focus areas
- **"focus on performance"** → Adds performance to focus areas

## 🔧 Configuration Options

| Parameter             | Description                        | Default                                    | Required |
| --------------------- | ---------------------------------- | ------------------------------------------ | -------- |
| `GITHUB_TOKEN`        | GitHub token for repository access | -                                          | ✅       |
| `OPENAI_API_KEY`      | OpenAI API key for AI features     | -                                          | ✅       |
| `OPENAI_API_MODEL`    | OpenAI model to use                | `gpt-4o`                                   | ❌       |
| `ENABLE_AGENTIC_MODE` | Enable agentic learning features   | `false`                                    | ❌       |
| `exclude`             | File patterns to exclude           | `**/*.lock,dist/**/*,**/*.min.js,**/*.map` | ❌       |
| `owner`               | Summary owner (`bot` or `author`)  | `author`                                   | ❌       |
| `override_summary`    | Override existing summary          | `true`                                     | ❌       |

## 🧪 Memory Structure

The system maintains several types of memory in `.agent-memory.json`:

```json
{
  "userPreferences": {
    "username": {
      "summaryStyle": "technical",
      "focusAreas": ["architecture", "performance", "security"],
      "detailLevel": "medium",
      "includeSuggestions": true,
      "preferredLanguage": "en"
    }
  },
  "historicalPatterns": {
    "repo-name": {
      "commonChanges": ["javascript-modification", "test-modification"],
      "frequentIssues": ["missing-tests", "performance-concerns"],
      "teamPreferences": ["technical-style", "detailed-summaries"],
      "successfulPatterns": ["incremental-changes"]
    }
  },
  "codebaseContexts": {
    "repo-name": {
      "architecture": "React + TypeScript application",
      "patterns": ["component-based", "hooks-usage"],
      "conventions": ["camelCase", "functional-components"],
      "techStack": ["ts", "tsx", "json"],
      "complexity": "medium"
    }
  },
  "interactionHistory": [
    {
      "timestamp": 1699123456789,
      "prNumber": 123,
      "author": "username",
      "repo": "repo-name",
      "summary": "...",
      "userPreferences": {...},
      "codebaseContext": {...}
    }
  ]
}
```

## 🎯 Benefits

### For Individual Users

- **Personalized Summaries**: Adapts to your preferred style and detail level
- **Relevant Focus**: Emphasizes areas you care about most
- **Consistent Experience**: Maintains your preferences across all PRs

### For Teams

- **Team Consistency**: Learns team preferences and maintains consistency
- **Pattern Recognition**: Identifies common patterns and potential issues
- **Knowledge Retention**: Builds institutional knowledge over time

### For Projects

- **Architectural Understanding**: Develops deep understanding of codebase structure
- **Context-Aware Reviews**: Provides summaries that consider project-specific context
- **Continuous Improvement**: Gets better at reviewing your specific codebase

## 🔍 Monitoring and Status

The system provides detailed logging when agentic mode is enabled:

```
Agent Status:
- Users tracked: 5
- Total interactions: 47
- Has codebase context: true
- Common patterns: javascript-modification, test-modification, configuration-change
```

## 🚨 Troubleshooting

### Common Issues

1. **Memory file not persisting**: Ensure the action has write permissions to the workspace
2. **AI responses failing**: Check OpenAI API key and model availability
3. **Preferences not updating**: Verify feedback keywords are being used correctly

### Debugging

Enable debug logging by setting the `ACTIONS_STEP_DEBUG` secret to `true` in your repository settings.

## 🔄 Migration from Legacy Mode

The agentic system is fully backward compatible. To migrate:

1. Add `ENABLE_AGENTIC_MODE: 'true'` to your workflow
2. Existing functionality continues to work unchanged
3. New agentic features activate automatically
4. Memory and learning begin accumulating from the first run

## 🛡️ Privacy and Security

- **Local Storage**: All memory is stored locally in your repository's workspace
- **No External Persistence**: No data is sent to external services beyond OpenAI for AI processing
- **User Control**: Users can provide feedback to control their preferences
- **Data Retention**: Memory is automatically pruned to prevent excessive storage

## 🚀 Future Enhancements

- **Advanced Pattern Recognition**: More sophisticated pattern analysis
- **Team Analytics**: Insights into team coding patterns and preferences
- **Integration with Code Quality Tools**: Automatic integration with linting and testing tools
- **Custom Agent Behaviors**: Configurable agent behaviors for different project types

The agentic PR summarizer represents a significant evolution in automated code review, providing intelligent, personalized, and continuously improving summaries that adapt to your team's unique needs and preferences.
