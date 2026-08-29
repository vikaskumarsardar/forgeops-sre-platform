/**
 * Canonical Incident Contract Schema (INC-XXXX) (TypeScript)
 * Normalizes incoming alerts from Datadog, Prometheus, CloudWatch, PagerDuty, or Webhooks.
 */

import { Incident, Severity, Symptom } from '@/types/incident';
import { SOURCES, SEVERITIES, DEFAULT_CONFIG } from '@/core/constants';

export class IncidentContract {
  static create({
    id,
    source = SOURCES.PROMETHEUS,
    severity = SEVERITIES.CRITICAL as Severity,
    serviceName = DEFAULT_CONFIG.DEFAULT_SERVICE_NAME,
    symptoms = [],
    context = {}
  }: {
    id?: string;
    source?: string;
    severity?: Severity;
    serviceName?: string;
    symptoms?: Symptom[];
    context?: Record<string, any>;
  }): Incident {
    const defaultSymptoms: Symptom[] = [
      {
        type: "error_rate",
        value: 38.0,
        threshold: 5.0,
        unit: "percent"
      }
    ];

    return {
      id: id || `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      source,
      severity: (severity || SEVERITIES.CRITICAL).toUpperCase() as Severity,
      service: {
        name: serviceName,
        environment: context.environment || DEFAULT_CONFIG.DEFAULT_ENVIRONMENT,
        region: context.region || DEFAULT_CONFIG.DEFAULT_REGION
      },
      symptoms: symptoms.length > 0 ? symptoms : defaultSymptoms,
      timestamp: new Date().toISOString(),
      context
    };
  }

  static createFromAlert(alert: {
    id?: string;
    service?: string;
    alert_name?: string;
    description?: string;
    severity?: any;
    timestamp?: string;
  }): Incident {
    return this.create({
      id: alert.id,
      serviceName: alert.service,
      severity: alert.severity,
      context: {
        alert_name: alert.alert_name,
        description: alert.description,
        timestamp: alert.timestamp
      }
    });
  }
}

export default IncidentContract;
