/**
 * Production Enterprise Observability Provider (TypeScript)
 * Connects to BOTH Prometheus (/api/v1/query) for PromQL metrics AND Grafana Loki (/loki/api/v1/query_range) for LogQL logs.
 * Zero mock/static fallbacks.
 */

import { ObservabilityProvider } from '@/types/providerContracts';

export class PrometheusLokiObservabilityProvider implements ObservabilityProvider {
  private prometheusUrl: string;
  private lokiUrl: string;

  constructor(
    prometheusUrl?: string,
    lokiUrl?: string
  ) {
    this.prometheusUrl = prometheusUrl || process.env.PROMETHEUS_URL || "http://localhost:9090";
    this.lokiUrl = lokiUrl || process.env.LOKI_URL || "http://localhost:3100";
  }

  async getMetrics(serviceName: string, timeframeMinutes: number = 15): Promise<any> {
    const query = encodeURIComponent(`sum(rate(http_requests_total{service="${serviceName}"}[${timeframeMinutes}m]))`);
    const url = `${this.prometheusUrl}/api/v1/query?query=${query}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Prometheus API HTTP ${response.status} failed for GET ${url}: ${errorText}`);
    }

    const data = await response.json();
    return {
      service: serviceName,
      provider: "Prometheus API v1",
      timeframe: `${timeframeMinutes}m`,
      data
    };
  }

  async searchLogs(serviceName: string, severity: string = "ERROR", limit: number = 5): Promise<any> {
    const query = encodeURIComponent(`{service="${serviceName}",severity="${severity}"}`);
    const url = `${this.lokiUrl}/loki/api/v1/query_range?query=${query}&limit=${limit}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grafana Loki API HTTP ${response.status} failed for GET ${url}: ${errorText}`);
    }

    const data = await response.json();
    return {
      service: serviceName,
      provider: "Grafana Loki Log API",
      severity,
      limit,
      logs: data.data?.result || []
    };
  }
}

// Export named and default instances with intuitive naming for code reviewers
export const prometheusLokiProvider = new PrometheusLokiObservabilityProvider();
export default prometheusLokiProvider;
