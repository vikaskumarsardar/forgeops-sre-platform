/**
 * Policy Engine TypeScript Definitions
 */

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskAssessment {
  riskLevel: RiskLevel;
  requiresHumanApproval: boolean;
  reason: string;
}
