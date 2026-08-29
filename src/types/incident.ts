/**
 * Canonical Incident Contract TypeScript Definitions
 */

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ServiceTarget {
  name: string;
  environment: string;
  region?: string;
}

export interface Symptom {
  type: string;
  value: number;
  threshold: number;
  unit?: string;
}

export interface Incident {
  id: string;
  source: string;
  severity: Severity;
  service: ServiceTarget;
  symptoms: Symptom[];
  timestamp: string;
  context?: Record<string, any>;
}
