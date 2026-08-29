/**
 * Real Git Integration Service (TypeScript)
 * Executes real `git log` and `git show` CLI commands against the repository.
 * Zero false success responses.
 */

import { execSync } from 'child_process';
import { DEFAULT_CONFIG, EXECUTION_STATUS } from '@/core/constants';

export class GitService {
  getDeploymentHistory(serviceName: string = DEFAULT_CONFIG.DEFAULT_SERVICE_NAME): any {
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

  getCommitDiff(commitSha?: string): any {
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
}

export default new GitService();
