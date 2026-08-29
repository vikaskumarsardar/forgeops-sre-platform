/**
 * Metrics MCP Tool (TypeScript)
 * Co-located tool definition and identifier.
 */

import metricsService from '@/providers/local/metricsService';

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
  execute: async ({ service_name = "checkout-service", timeframe_minutes = 15 }: { service_name?: string; timeframe_minutes?: number }) => {
    return metricsService.getMetrics(service_name, timeframe_minutes);
  }
};
