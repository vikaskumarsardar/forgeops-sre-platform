/**
 * Metrics MCP Tool (TypeScript)
 * Delegates dynamically to ProviderRegistry Observability Provider.
 */

import providerRegistry from '@/core/providerRegistry';
import { PROVIDER_CATEGORIES, DEFAULT_CONFIG } from '@/core/constants';

export const GET_METRICS_TOOL_NAME = 'get_metrics' as const;

export default {
  name: GET_METRICS_TOOL_NAME,
  description: "Get real-time APM system telemetry (error rates, latency P95, CPU, heap memory)",
  parameters: {
    type: "object",
    properties: {
      service_name: {
        type: "string",
        description: "Name of the target microservice to query"
      },
      timeframe_minutes: {
        type: "number",
        description: "Time window in minutes (default: 15)"
      }
    }
  },
  execute: async ({ service_name = DEFAULT_CONFIG.DEFAULT_SERVICE_NAME, timeframe_minutes = 15 }: { service_name?: string; timeframe_minutes?: number }) => {
    return providerRegistry.get(PROVIDER_CATEGORIES.OBSERVABILITY).getMetrics(service_name, timeframe_minutes);
  }
};
