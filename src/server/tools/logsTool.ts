/**
 * Application Logs MCP Tool (TypeScript)
 * Delegates dynamically to ProviderRegistry Observability Provider.
 */

import providerRegistry from '@/core/providerRegistry';
import { PROVIDER_CATEGORIES, DEFAULT_CONFIG, SEVERITIES } from '@/core/constants';

export const SEARCH_LOGS_TOOL_NAME = 'search_logs' as const;

export default {
  name: SEARCH_LOGS_TOOL_NAME,
  description: "Query recorded application logs, exception messages, and stack traces",
  parameters: {
    type: "object",
    properties: {
      service_name: {
        type: "string",
        description: "Target microservice name"
      },
      severity: {
        type: "string",
        description: "Log severity level (ERROR, WARN, INFO)"
      },
      limit: {
        type: "number",
        description: "Max log entries to return (default: 5)"
      }
    }
  },
  execute: async ({ service_name = DEFAULT_CONFIG.DEFAULT_SERVICE_NAME, severity = SEVERITIES.ERROR, limit = 5 }: { service_name?: string; severity?: string; limit?: number }) => {
    return providerRegistry.get(PROVIDER_CATEGORIES.OBSERVABILITY).searchLogs(service_name, severity, limit);
  }
};
