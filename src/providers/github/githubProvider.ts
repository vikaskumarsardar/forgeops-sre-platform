/**
 * Production GitHub Source Control Provider (TypeScript)
 * Executes REAL HTTP REST API calls against GitHub REST API (v3).
 * Zero mock/static fallbacks.
 */

import { SourceControlProvider } from '@/types/providerContracts';
import { HTTP_METHODS, HTTP_CONTENT_TYPES } from '@/core/constants';

export class GitHubProvider implements SourceControlProvider {
  private token: string;
  private baseUrl: string;

  constructor(token?: string, baseUrl: string = "https://api.github.com") {
    this.token = token || process.env.GITHUB_TOKEN || "";
    this.baseUrl = process.env.GITHUB_API_URL || baseUrl;
  }

  private getHeaders(): Record<string, string> {
    const activeToken = this.token || process.env.GITHUB_TOKEN || "";
    const headers: Record<string, string> = {
      "Accept": HTTP_CONTENT_TYPES.GITHUB_V3_JSON,
      "User-Agent": "ForgeOps-SRE-Agent"
    };
    if (activeToken) {
      headers["Authorization"] = `token ${activeToken}`;
    }
    return headers;
  }

  async readSourceCode(filePath: string, owner?: string, repo?: string): Promise<any> {
    const targetOwner = owner || process.env.GITHUB_OWNER;
    const targetRepo = repo || process.env.GITHUB_REPO;

    if (!targetOwner || !targetRepo) {
      throw new Error("GitHubProvider.readSourceCode requires 'owner' and 'repo' configuration.");
    }

    const url = `${this.baseUrl}/repos/${targetOwner}/${targetRepo}/contents/${filePath}`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API HTTP ${response.status} failed for GET ${url}: ${errorText}`);
    }

    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf8');

    return {
      file_path: filePath,
      sha: data.sha,
      size: data.size,
      lines: content.split('\n').length,
      content
    };
  }

  async getCommitDiff(commitSha: string, owner?: string, repo?: string): Promise<any> {
    const targetOwner = owner || process.env.GITHUB_OWNER;
    const targetRepo = repo || process.env.GITHUB_REPO;

    if (!targetOwner || !targetRepo || !commitSha) {
      throw new Error("GitHubProvider.getCommitDiff requires 'owner', 'repo', and 'commitSha'.");
    }

    const url = `${this.baseUrl}/repos/${targetOwner}/${targetRepo}/commits/${commitSha}`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API HTTP ${response.status} failed for GET ${url}: ${errorText}`);
    }

    const data = await response.json();

    return {
      commit_sha: data.sha,
      author: data.commit.author,
      message: data.commit.message,
      stats: data.stats,
      files: data.files.map((f: any) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch
      }))
    };
  }

  async getDeploymentHistory(serviceName: string, owner?: string, repo?: string): Promise<any> {
    const targetOwner = owner || process.env.GITHUB_OWNER;
    const targetRepo = repo || process.env.GITHUB_REPO || serviceName;

    if (!targetOwner || !targetRepo) {
      throw new Error("GitHubProvider.getDeploymentHistory requires 'owner' and 'repo' configuration.");
    }

    const url = `${this.baseUrl}/repos/${targetOwner}/${targetRepo}/commits?per_page=5`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API HTTP ${response.status} failed for GET ${url}: ${errorText}`);
    }

    const commits = await response.json();

    return {
      service: serviceName,
      provider: "GitHub REST API v3",
      total_commits: commits.length,
      deployments: commits.map((c: any) => ({
        commit_sha: c.sha.substring(0, 7),
        full_sha: c.sha,
        author: c.commit.author.name,
        date: c.commit.author.date,
        message: c.commit.message
      }))
    };
  }

  async createPullRequest({
    owner,
    repo,
    title,
    body,
    headBranch,
    baseBranch = "main"
  }: {
    owner?: string;
    repo?: string;
    title: string;
    body: string;
    headBranch: string;
    baseBranch?: string;
  }): Promise<any> {
    const targetOwner = owner || process.env.GITHUB_OWNER;
    const targetRepo = repo || process.env.GITHUB_REPO;

    if (!targetOwner || !targetRepo) {
      throw new Error("GitHubProvider.createPullRequest requires 'owner' and 'repo' configuration.");
    }

    const url = `${this.baseUrl}/repos/${targetOwner}/${targetRepo}/pulls`;
    const response = await fetch(url, {
      method: HTTP_METHODS.POST,
      headers: {
        ...this.getHeaders(),
        "Content-Type": HTTP_CONTENT_TYPES.JSON
      },
      body: JSON.stringify({
        title,
        body,
        head: headBranch,
        base: baseBranch
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API HTTP ${response.status} failed for POST ${url}: ${errorText}`);
    }

    return response.json();
  }
}

export default new GitHubProvider();
