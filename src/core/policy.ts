/**
 * Policy Risk Engine (TypeScript)
 * Classifies proposed actions into LOW, MEDIUM, HIGH, or CRITICAL risk tiers.
 */

import { RiskAssessment } from '@/types/policy';
import { REMEDIATION_ACTIONS, RISK_LEVELS } from '@/core/constants';

export class PolicyEngine {
  static evaluateRisk(toolName: string, toolArgs: Record<string, any> = {}): RiskAssessment {
    const action = toolArgs.remediation_type || toolName;

    // Explanatory condition variables for risk classification
    const isCodeModificationAction = 
      action === REMEDIATION_ACTIONS.DEPLOY_CODE_PATCH || 
      action === REMEDIATION_ACTIONS.MODIFY_SOURCE;

    const isRollbackAction = action === REMEDIATION_ACTIONS.ROLLBACK_DEPLOYMENT;
    const isRestartAction = action === REMEDIATION_ACTIONS.RESTART_SERVICE;

    if (isCodeModificationAction) {
      return {
        riskLevel: RISK_LEVELS.HIGH,
        requiresHumanApproval: true,
        reason: "Modifying production source code files on disk requires explicit Human-in-the-Loop authorization."
      };
    }

    if (isRollbackAction) {
      return {
        riskLevel: RISK_LEVELS.CRITICAL,
        requiresHumanApproval: true,
        reason: "Rolling back production Git release affects all active microservice instances."
      };
    }

    if (isRestartAction) {
      return {
        riskLevel: RISK_LEVELS.MEDIUM,
        requiresHumanApproval: false,
        reason: "Process restart in non-production environment."
      };
    }

    // Read-Only Diagnostic Tools Default Tier
    return {
      riskLevel: RISK_LEVELS.LOW,
      requiresHumanApproval: false,
      reason: "Read-only telemetry discovery or isolated sandbox verification."
    };
  }
}

export default PolicyEngine;
