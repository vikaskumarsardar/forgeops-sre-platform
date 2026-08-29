/**
 * Deployment Provider Contract Abstract Class (TypeScript)
 */

import { DeploymentProvider } from '@/types/providerContracts';

export abstract class AbstractDeploymentProvider implements DeploymentProvider {
  abstract deploy(changeDetails: any): Promise<any>;
  abstract healthCheck(serviceName: string): Promise<{ healthy: boolean; status: string; errorRate: number; latencyP95: number }>;
  abstract rollback(targetService: string): Promise<any>;
}
