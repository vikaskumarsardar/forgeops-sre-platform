/**
 * Local Source Control Provider (TypeScript)
 * Implements SourceControlProvider using real git CLI execution.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { SourceControlProvider } from '@/types/providerContracts';
import { DEFAULT_CONFIG, EXECUTION_STATUS } from '@/core/constants';

export class LocalGitProvider implements SourceControlProvider {
  async getDeploymentHistory(serviceName: string = DEFAULT_CONFIG.DEFAULT_SERVICE_NAME): Promise<any> {
    try {
      const rawLog = execSync(
        `git log -n 5 --pretty=format:"%H|%an <%ae>|%ad|%s"`,
        { encoding: 'utf8', cwd: process.cwd() }
      ).trim();

      const lines = rawLog.split('\n').filter(Boolean);
      const deployments = lines.map((line) => {
        const [sha, author, date, message] = line.split('|');
        return {
          commit_sha: sha ? sha.substring(0, 7) : sha,
          full_sha: sha,
          deployed_at: date,
          author,
          message,
          diff_summary: `Git commit ${sha ? sha.substring(0, 7) : ""}`
        };
      });

      return {
        service: serviceName,
        status: EXECUTION_STATUS.SUCCESS,
        total_commits: deployments.length,
        deployments
      };
    } catch (err: any) {
      throw new Error(`Git deployment history log failed for service '${serviceName}': ${err.message}`);
    }
  }

  async getCommitDiff(commitSha?: string): Promise<any> {
    try {
      const shaToInspect = commitSha || "HEAD";
      const diffOutput = execSync(
        `git show ${shaToInspect} --stat --patch`,
        { encoding: 'utf8', cwd: process.cwd() }
      ).trim();

      const showOutput = execSync(
        `git show ${shaToInspect} --pretty=format:"%H|%an <%ae>|%s" -s`,
        { encoding: 'utf8', cwd: process.cwd() }
      ).trim();

      const [sha, author, message] = showOutput.split('|');

      const filesOutput = execSync(
        `git show ${shaToInspect} --name-only --format=""`,
        { encoding: 'utf8', cwd: process.cwd() }
      ).trim();
      const files = filesOutput.split('\n').filter(Boolean);

      return {
        commit_sha: sha ? sha.substring(0, 7) : shaToInspect,
        full_sha: sha,
        status: EXECUTION_STATUS.SUCCESS,
        author,
        message,
        files,
        primary_file: files[0] || null,
        diff: diffOutput
      };
    } catch (err: any) {
      throw new Error(`Failed to fetch git diff for commit '${commitSha || "HEAD"}': ${err.message}`);
    }
  }

  async readSourceCode(filePath: string): Promise<any> {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return {
      file_path: filePath,
      status: EXECUTION_STATUS.SUCCESS,
      lines: content.split('\n').length,
      content
    };
  }
}

export const localGitProvider = new LocalGitProvider();
export default localGitProvider;
