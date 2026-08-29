/**
 * Universal Infrastructure Provider Contract Interfaces (TypeScript)
 */

export interface ObservabilityProvider {
  getMetrics(serviceName: string, timeframeMinutes?: number): Promise<any>;
  searchLogs(serviceName: string, severity?: string, limit?: number): Promise<any>;
}

export interface SourceControlProvider {
  getDeploymentHistory(serviceName: string): Promise<any>;
  getCommitDiff(commitSha: string): Promise<any>;
  readSourceCode(filePath: string): Promise<any>;
}

export interface SandboxProvider {
  reproduceBug(payload: any): Promise<any>;
  runUnitTests(command?: string): Promise<any>;
  applyRemediation(patchDetails: any): Promise<any>;
}

export interface DeploymentProvider {
  deploy(changeDetails: any): Promise<any>;
  healthCheck(serviceName: string): Promise<{ healthy: boolean; status: string; errorRate: number; latencyP95: number }>;
  rollback(targetService: string): Promise<any>;
}
