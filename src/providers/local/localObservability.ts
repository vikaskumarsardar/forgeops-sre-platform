/**
 * Local Observability Provider (TypeScript)
 * Implements ObservabilityProvider using metricsService and logService.
 */

import { ObservabilityProvider } from '@/types/providerContracts';
import metricsService from '@/providers/local/metricsService';
import logService from '@/providers/local/logService';

export class LocalObservabilityProvider implements ObservabilityProvider {
  async getMetrics(serviceName: string, timeframeMinutes?: number): Promise<any> {
    return metricsService.getMetrics(serviceName, timeframeMinutes);
  }

  async searchLogs(serviceName: string, severity?: string, limit?: number): Promise<any> {
    return logService.searchLogs({ service: serviceName, severity, limit });
  }
}

export default new LocalObservabilityProvider();
