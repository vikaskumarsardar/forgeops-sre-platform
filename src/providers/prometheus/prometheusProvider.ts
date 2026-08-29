/**
 * Backward compatibility alias for Prometheus & Loki Observability Provider.
 * Re-exports PrometheusLokiObservabilityProvider from @/providers/observability/prometheusLokiProvider.
 */

import prometheusLokiProvider, { PrometheusLokiObservabilityProvider } from '@/providers/observability/prometheusLokiProvider';

export { PrometheusLokiObservabilityProvider as PrometheusProvider };
export default prometheusLokiProvider;
