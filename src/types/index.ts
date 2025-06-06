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
