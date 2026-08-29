/**
 * Observability Provider Contract Abstract Class (TypeScript)
 */

import { ObservabilityProvider } from '@/types/providerContracts';

export abstract class AbstractObservabilityProvider implements ObservabilityProvider {
  abstract getMetrics(serviceName: string, timeframeMinutes?: number): Promise<any>;
  abstract searchLogs(serviceName: string, severity?: string, limit?: number): Promise<any>;
}
