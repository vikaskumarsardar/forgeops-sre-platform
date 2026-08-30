/**
 * Source Code Inspection MCP Tool (TypeScript)
 * Delegates dynamically to ProviderRegistry Source Control Provider.
 */

import providerRegistry from '@/core/providerRegistry';
import { PROVIDER_CATEGORIES } from '@/core/constants';

export const READ_SOURCE_CODE_TOOL_NAME = 'read_source_code' as const;

export default {
  name: READ_SOURCE_CODE_TOOL_NAME,
  description: "Read physical source code files from disk to inspect implementation details and line numbers",
  parameters: {
    type: "object",
    properties: {
      file_path: {
        type: "string",
        description: "Relative file path (e.g. target-services/<service>/<file>)"
      }
    },
    required: ["file_path"]
  },
  execute: async ({ file_path }: { file_path: string }) => {
    return providerRegistry.get(PROVIDER_CATEGORIES.SOURCE_CONTROL).readSourceCode(file_path);
  }
};
