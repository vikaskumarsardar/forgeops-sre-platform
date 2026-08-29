/**
 * Local Deployment Provider (TypeScript)
 * Implements DeploymentProvider with closed-loop health verification & auto-rollback.
 */

import { DeploymentProvider } from '@/types/providerContracts';
import metricsService from '@/providers/local/metricsService';
import remediationTool from '@/server/tools/remediationTool';
import { 
  SERVICE_STATUS, 
  REMEDIATION_ACTIONS, 
  DEFAULT_CONFIG 
} from '@/core/constants';

export class LocalDeploymentProvider implements DeploymentProvider {
  async deploy(changeDetails: any): Promise<any> {
    return remediationTool.execute(changeDetails);
  }

  async healthCheck(serviceName: string = DEFAULT_CONFIG.DEFAULT_SERVICE_NAME): Promise<{ healthy: boolean; status: string; errorRate: number; latencyP95: number }> {
    const metrics = metricsService.getMetrics(serviceName);
    const isServiceHealthy = metrics.status === SERVICE_STATUS.HEALTHY;

    return {
      healthy: isServiceHealthy,
      status: metrics.status,
      errorRate: metrics.metrics.error_rate_pct,
      latencyP95: metrics.metrics.p95_latency_ms
    };
  }

  async rollback(targetService: string = DEFAULT_CONFIG.DEFAULT_SERVICE_NAME): Promise<any> {
    return remediationTool.execute({
      remediation_type: REMEDIATION_ACTIONS.ROLLBACK_DEPLOYMENT,
      reasoning: "Post-deployment health check failed. Executing automatic rollback."
    });
  }
}

export default new LocalDeploymentProvider();
