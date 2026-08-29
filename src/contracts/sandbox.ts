/**
 * Sandbox Provider Contract Abstract Class (TypeScript)
 */

import { SandboxProvider } from '@/types/providerContracts';

export abstract class AbstractSandboxProvider implements SandboxProvider {
  abstract reproduceBug(payload: any): Promise<any>;
  abstract runUnitTests(command?: string): Promise<any>;
  abstract applyRemediation(patchDetails: any): Promise<any>;
}
