/**
 * Source Code Inspection MCP Tool (TypeScript)
 * Co-located tool definition and identifier.
 */

import fs from 'fs';
import path from 'path';
import { EXECUTION_STATUS } from '@/core/constants';

export const READ_SOURCE_CODE_TOOL_NAME = 'read_source_code' as const;

export default {
  name: READ_SOURCE_CODE_TOOL_NAME,
  description: "Read physical source code files from disk to inspect implementation details and line numbers",
  parameters: {
    type: "object",
    properties: {
      file_path: {
        type: "string",
        description: "Relative file path (e.g. target-services/checkout-node/checkoutService.js)"
      }
    },
    required: ["file_path"]
  },
  execute: async ({ file_path }: { file_path: string }) => {
    try {
      const fullPath = path.resolve(process.cwd(), file_path);
      const content = fs.readFileSync(fullPath, 'utf8');
      return {
        file_path,
        status: EXECUTION_STATUS.SUCCESS,
        lines: content.split('\n').length,
        content
      };
    } catch (err: any) {
      return {
        file_path,
        status: EXECUTION_STATUS.FAILED,
        error: `Failed to read file ${file_path}: ${err.message}`
      };
    }
  }
};
