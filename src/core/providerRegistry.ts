/**
 * Universal Provider Registry & Config-Driven Switcher (TypeScript)
 * Manages provider registration and dynamic infrastructure switching.
 */

import localObservability from '@/providers/local/localObservability';
import localGit from '@/providers/local/localGit';
import localSandbox from '@/providers/local/localSandbox';
import localDeployment from '@/providers/local/localDeployment';
import prometheusProvider from '@/providers/prometheus/prometheusProvider';
import githubProvider from '@/providers/github/githubProvider';
import kubernetesProvider from '@/providers/kubernetes/kubernetesProvider';
import { PROVIDER_CATEGORIES } from '@/core/constants';

export class ProviderRegistry {
  private providers: Map<string, any>;
  activeMode: string;

  constructor() {
    this.providers = new Map();
    this.activeMode = "local";

    // 1. Local Zero-Dependency Demo Mode
    this.register(PROVIDER_CATEGORIES.OBSERVABILITY, "local", localObservability);
    this.register(PROVIDER_CATEGORIES.SOURCE_CONTROL, "local", localGit);
    this.register(PROVIDER_CATEGORIES.SANDBOX, "local", localSandbox);
    this.register(PROVIDER_CATEGORIES.DEPLOYMENT, "local", localDeployment);

    // 2. Production Enterprise Cloud Provider Mode (Prometheus, GitHub REST API, K8s)
    this.register(PROVIDER_CATEGORIES.OBSERVABILITY, "prometheus", prometheusProvider);
    this.register(PROVIDER_CATEGORIES.SOURCE_CONTROL, "github", githubProvider);
    this.register(PROVIDER_CATEGORIES.SANDBOX, "docker", localSandbox);
    this.register(PROVIDER_CATEGORIES.DEPLOYMENT, "kubernetes", kubernetesProvider);
  }

  register(category: string, type: string, providerInstance: any): void {
    const key = `${category}:${type}`;
    this.providers.set(key, providerInstance);
  }

  setMode(mode: string = "local"): void {
    this.activeMode = mode;
  }

  get(category: string): any {
    const key = `${category}:${this.activeMode}`;
    if (this.providers.has(key)) {
      return this.providers.get(key);
    }
    return this.providers.get(`${category}:local`);
  }
}

export default new ProviderRegistry();
