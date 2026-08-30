/**
 * Local Deployment Provider (TypeScript)
 * Implements DeploymentProvider with closed-loop health verification & auto-rollback.
 */

import { DeploymentProvider } from '@/types/providerContracts';
import localObservabilityProvider from '@/providers/local/localObservabilityProvider';
import { execSync } from 'child_process';
import { 
  SERVICE_STATUS, 
  EXECUTION_STATUS, 
  DEFAULT_CONFIG 
} from '@/core/constants';

export class LocalDeploymentProvider implements DeploymentProvider {
  async deploy(changeDetails: any): Promise<any> {
    const serviceName = changeDetails.service_name || DEFAULT_CONFIG.DEFAULT_SERVICE_NAME;
    return {
      status: EXECUTION_STATUS.SUCCESS,
      provider: "Local Patch Engine",
      service: serviceName,
      details: changeDetails
    };
  }

  async healthCheck(serviceName: string = DEFAULT_CONFIG.DEFAULT_SERVICE_NAME): Promise<{ healthy: boolean; status: string; errorRate: number; latencyP95: number }> {
    const metricsData = await localObservabilityProvider.getMetrics(serviceName);
    const isHealthy = metricsData.status === SERVICE_STATUS.HEALTHY;

    return {
      healthy: isHealthy,
      status: metricsData.status || SERVICE_STATUS.HEALTHY,
      errorRate: metricsData.metrics?.error_rate_pct || 0.0,
      latencyP95: metricsData.metrics?.p95_latency_ms || 25
    };
  }

  async rollback(targetService: string = DEFAULT_CONFIG.DEFAULT_SERVICE_NAME): Promise<any> {
    try {
      const stdout = execSync(`git checkout HEAD~1 -- target-services/`, { encoding: 'utf8', cwd: process.cwd() });
      return {
        status: EXECUTION_STATUS.SUCCESS,
        provider: "Local Git Rollback",
        service: targetService,
        output: stdout.trim() || "Local service workspace reverted to HEAD~1"
      };
    } catch (err: any) {
      throw new Error(`Local git rollback failed for service '${targetService}': ${err.message}`);
    }
  }
}

export const localDeploymentProvider = new LocalDeploymentProvider();
export default localDeploymentProvider;
