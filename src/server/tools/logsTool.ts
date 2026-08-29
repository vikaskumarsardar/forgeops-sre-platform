/**
 * Application Logs MCP Tool (TypeScript)
 * Co-located tool definition and identifier.
 */

import logService from '@/providers/local/logService';

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
  execute: async ({ service_name = "checkout-service", severity = "ERROR", limit = 5 }: { service_name?: string; severity?: string; limit?: number }) => {
    return logService.searchLogs({ service: service_name, severity, limit });
  }
};
