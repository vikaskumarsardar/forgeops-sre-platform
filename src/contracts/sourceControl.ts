/**
 * Source Control Provider Contract Abstract Class (TypeScript)
 */

import { SourceControlProvider } from '@/types/providerContracts';

export abstract class AbstractSourceControlProvider implements SourceControlProvider {
  abstract getDeploymentHistory(serviceName: string): Promise<any>;
  abstract getCommitDiff(commitSha: string): Promise<any>;
  abstract readSourceCode(filePath: string): Promise<any>;
}
