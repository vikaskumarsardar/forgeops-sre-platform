/**
 * Git Deployment History MCP Tool (TypeScript)
 * Delegates dynamically to ProviderRegistry Source Control Provider.
 */

import providerRegistry from '@/core/providerRegistry';
import { PROVIDER_CATEGORIES, DEFAULT_CONFIG } from '@/core/constants';

export const GET_DEPLOYMENT_HISTORY_TOOL_NAME = 'get_deployment_history' as const;

export default {
  name: GET_DEPLOYMENT_HISTORY_TOOL_NAME,
  description: "Get recent git deployment history and commit diffs",
  parameters: {
    type: "object",
    properties: {
      service_name: {
        type: "string",
        description: "Microservice name"
      },
      commit_sha: {
        type: "string",
        description: "Optional specific commit SHA to inspect diff"
      }
    }
  },
  execute: async ({ service_name = DEFAULT_CONFIG.DEFAULT_SERVICE_NAME, commit_sha }: { service_name?: string; commit_sha?: string }) => {
    const sourceControl = providerRegistry.get(PROVIDER_CATEGORIES.SOURCE_CONTROL);
    if (commit_sha) {
      return sourceControl.getCommitDiff(commit_sha);
    }
    return sourceControl.getDeploymentHistory(service_name);
  }
};
