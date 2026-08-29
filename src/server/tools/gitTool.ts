/**
 * Git Deployment History MCP Tool (TypeScript)
 * Co-located tool definition and identifier.
 */

import gitService from '@/providers/local/gitService';

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
  execute: async ({ service_name = "checkout-service", commit_sha }: { service_name?: string; commit_sha?: string }) => {
    if (commit_sha) {
      return gitService.getCommitDiff(commit_sha);
    }
    return gitService.getDeploymentHistory(service_name);
  }
};
