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
    this.prometheusUrl = prometheusUrl || "";
    this.lokiUrl = lokiUrl || "";
  }

  private getPrometheusUrl(): string {
    return process.env.PROMETHEUS_URL || this.prometheusUrl || "http://localhost:9090";
  }

  private getLokiUrl(): string {
    return process.env.LOKI_URL || this.lokiUrl || "http://localhost:3100";
  }

  private getHeaders(overrideUser?: string): Record<string, string> {
    const user = overrideUser || process.env.GRAFANA_USER || "3549222";
    const token = process.env.GRAFANA_API_TOKEN;
    const headers: Record<string, string> = {
      "Accept": "application/json"
    };
    if (token) {
      if (user) {
        const credentials = Buffer.from(`${user}:${token}`).toString('base64');
        headers["Authorization"] = `Basic ${credentials}`;
      } else {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  async getMetrics(serviceName: string, timeframeMinutes: number = 15): Promise<any> {
    const query = encodeURIComponent(`sum(rate(http_requests_total{service="${serviceName}"}[${timeframeMinutes}m]))`);
    const baseUrl = this.getPrometheusUrl();
    const url = `${baseUrl}/api/v1/query?query=${query}`;

    try {
      const response = await fetch(url, { headers: this.getHeaders() });
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
    } catch (err: any) {
      return {
        service: serviceName,
        provider: "Prometheus API v1 (Offline)",
        timeframe: `${timeframeMinutes}m`,
        status: "OFFLINE",
        error: `Prometheus server at ${baseUrl} is unreachable (${err.message}).`
      };
    }
  }

  async searchLogs(serviceName: string, severity: string = "ERROR", limit: number = 5): Promise<any> {
    const query = encodeURIComponent(`{service="${serviceName}"} |= "${severity}"`);
    const rawBaseUrl = this.getLokiUrl().replace(/\/+$/, '');
    const baseUrl = rawBaseUrl.endsWith('/loki/api/v1') ? rawBaseUrl : `${rawBaseUrl}/loki/api/v1`;
    const url = `${baseUrl}/query_range?query=${query}&limit=${limit}`;
    const lokiUser = process.env.GRAFANA_LOKI_USER || process.env.GRAFANA_USER || "1770286";

    try {
      const response = await fetch(url, { headers: this.getHeaders(lokiUser) });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Loki API HTTP ${response.status} failed for GET ${url}: ${errorText}`);
      }

      const data = await response.json();
      return {
        service: serviceName,
        provider: "Grafana Loki v1",
        data
      };
    } catch (err: any) {
      return {
        service: serviceName,
        provider: "Grafana Loki v1 (Offline)",
        status: "OFFLINE",
        error: `Grafana Loki server at ${this.lokiUrl} is unreachable (${err.message}).`
      };
    }
  }
}

export const prometheusLokiProvider = new PrometheusLokiObservabilityProvider();
export default prometheusLokiProvider;
