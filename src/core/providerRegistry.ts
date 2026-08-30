/**
 * Production Enterprise Provider Registry (TypeScript)
 * Registers 100% production providers: Prometheus + Loki, GitHub REST API, K8s API, and Ephemeral Sandbox.
 */

import prometheusLokiProvider from '@/providers/observability/prometheusLokiProvider';
import githubProvider from '@/providers/github/githubProvider';
import localSandboxProvider from '@/providers/local/localSandboxProvider';
import kubernetesProvider from '@/providers/kubernetes/kubernetesProvider';
import { PROVIDER_CATEGORIES } from '@/core/constants';

export class ProviderRegistry {
  private providers: Map<string, any>;

  constructor() {
    this.providers = new Map();

    // Direct Production Cloud Providers
    this.providers.set(PROVIDER_CATEGORIES.OBSERVABILITY, prometheusLokiProvider);
    this.providers.set(PROVIDER_CATEGORIES.SOURCE_CONTROL, githubProvider);
    this.providers.set(PROVIDER_CATEGORIES.SANDBOX, localSandboxProvider);
    this.providers.set(PROVIDER_CATEGORIES.DEPLOYMENT, kubernetesProvider);
  }

  get(category: string): any {
    return this.providers.get(category);
  }
}

export const providerRegistry = new ProviderRegistry();
export default providerRegistry;
