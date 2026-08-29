/**
 * Local Source Control Provider (TypeScript)
 * Implements SourceControlProvider using real git CLI execution.
 */

import fs from 'fs';
import path from 'path';
import { SourceControlProvider } from '@/types/providerContracts';
import gitService from '@/providers/local/gitService';

export class LocalGitProvider implements SourceControlProvider {
  async getDeploymentHistory(serviceName: string): Promise<any> {
    return gitService.getDeploymentHistory(serviceName);
  }

  async getCommitDiff(commitSha: string): Promise<any> {
    return gitService.getCommitDiff(commitSha);
  }

  async readSourceCode(filePath: string): Promise<any> {
    const fullPath = path.resolve(process.cwd(), filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return {
      file_path: filePath,
      lines: content.split('\n').length,
      content
    };
  }
}

export default new LocalGitProvider();
