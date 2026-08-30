/**
 * Sandbox Execution MCP Tool (TypeScript)
 * Runs bug reproduction or executes test suites in isolated sandbox processes via ProviderRegistry.
 */

import providerRegistry from '@/core/providerRegistry';
import { SANDBOX_ACTIONS, PROVIDER_CATEGORIES } from '@/core/constants';

export const RUN_SANDBOX_TEST_TOOL_NAME = 'run_sandbox_test' as const;

export default {
  name: RUN_SANDBOX_TEST_TOOL_NAME,
  description: "Run bug reproduction or execute repository test suite in isolated sandbox process",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        description: "Action type: 'reproduce_bug' or 'run_unit_tests'"
      },
      command: {
        type: "string",
        description: "Test execution command line (e.g., 'npm test' or 'pytest')"
      },
      payload: {
        type: "object",
        description: "Dynamic payload to test in sandbox reproduction"
      },
      service_path: {
        type: "string",
        description: "Relative service module path to load (e.g. 'target-services/checkout-node/checkoutService.js')"
      }
    },
    required: ["action"]
  },
  execute: async ({ 
    action, 
    command, 
    payload, 
    service_path 
  }: { 
    action: string; 
    command?: string; 
    payload?: any; 
    service_path?: string;
  }) => {
    const sandboxProvider = providerRegistry.get(PROVIDER_CATEGORIES.SANDBOX);

    if (action === SANDBOX_ACTIONS.REPRODUCE_BUG) {
      return sandboxProvider.reproduceBug(payload || {}, service_path, undefined, command);
    }

    if (action === SANDBOX_ACTIONS.RUN_UNIT_TESTS) {
      return sandboxProvider.runUnitTests(command);
    }

    throw new Error(`Unsupported sandbox action '${action}'.`);
  }
};
