/**
 * Sandbox Execution MCP Tool (TypeScript)
 * Runs bug reproduction or executes test suites in isolated sandbox processes.
 * Co-located tool definition and identifier.
 */

import { execSync } from 'child_process';
import path from 'path';
import { SANDBOX_ACTIONS, EXECUTION_STATUS } from '@/core/constants';

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
        description: "Test execution command line (e.g., 'npm test' or 'node target-services/checkout-node/tests/checkout.test.js')"
      },
      payload: {
        type: "object",
        description: "Dynamic payload to test in sandbox reproduction"
      },
      service_path: {
        type: "string",
        description: "Relative service module path to load (e.g. 'target-services/checkout-node/checkoutService')"
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
    const isReproduceBugAction = action === SANDBOX_ACTIONS.REPRODUCE_BUG;
    const isRunUnitTestsAction = action === SANDBOX_ACTIONS.RUN_UNIT_TESTS;

    if (isReproduceBugAction) {
      const targetServicePath = service_path || 'target-services/checkout-node/checkoutService';
      const resolvedServicePath = path.resolve(process.cwd(), targetServicePath);
      const targetModule = require(resolvedServicePath);

      const testPayload = payload || {
        items: [{ price: 50, quantity: 1 }],
        discountCode: null
      };

      try {
        const handlerName = Object.keys(targetModule).find(k => typeof targetModule[k] === 'function') || 'processCheckout';
        const res = targetModule[handlerName](testPayload);
        return {
          reproduced: false,
          result: res,
          status: EXECUTION_STATUS.SUCCESS,
          message: "Sandbox reproduction executed cleanly without exception (200 OK)."
        };
      } catch (err: any) {
        return {
          reproduced: true,
          status: EXECUTION_STATUS.FAILED,
          error: err.message,
          stack: err.stack,
          message: "🔥 BUG CONFIRMED REPRODUCED IN SANDBOX! Dynamic payload triggered exception."
        };
      }
    }

    if (isRunUnitTestsAction) {
      const testCommand = command || process.env.TEST_COMMAND || 'node target-services/checkout-node/tests/checkout.test.js';

      try {
        const output = execSync(testCommand, { encoding: 'utf8', cwd: process.cwd() });
        return {
          passed: true,
          status: EXECUTION_STATUS.SUCCESS,
          output: output.trim(),
          summary: "100% Tests Passed!"
        };
      } catch (err: any) {
        return {
          passed: false,
          status: EXECUTION_STATUS.FAILED,
          output: err.stdout ? err.stdout.trim() : err.message,
          summary: "Test suite execution failed!"
        };
      }
    }

    throw new Error(`Unsupported sandbox action '${action}'.`);
  }
};
