/**
 * Centralized System Constants (Pure Primitives - Zero Circular Dependencies)
 * Defines system-wide domain constants and tool identifiers.
 */

export const TOOL_NAMES = {
  GET_METRICS: 'get_metrics',
  SEARCH_LOGS: 'search_logs',
  GET_DEPLOYMENT_HISTORY: 'get_deployment_history',
  READ_SOURCE_CODE: 'read_source_code',
  RUN_SANDBOX_TEST: 'run_sandbox_test',
  APPLY_REMEDIATION: 'apply_remediation'
} as const;

export const PROVIDER_CATEGORIES = {
  OBSERVABILITY: 'observability',
  SOURCE_CONTROL: 'sourceControl',
  SANDBOX: 'sandbox',
  DEPLOYMENT: 'deployment'
} as const;

export const REMEDIATION_ACTIONS = {
  DEPLOY_CODE_PATCH: 'deploy_code_patch',
  MODIFY_SOURCE: 'modify_source',
  ROLLBACK_DEPLOYMENT: 'rollback_deployment',
  RESTART_SERVICE: 'restart_service'
} as const;

export const SANDBOX_ACTIONS = {
  REPRODUCE_BUG: 'reproduce_bug',
  RUN_UNIT_TESTS: 'run_unit_tests'
} as const;

export const SANDBOX_ENVIRONMENTS = {
  EPHEMERAL_POD: 'ISOLATED_EPHEMERAL_POD',
  EPHEMERAL_RUNNER: 'ISOLATED_EPHEMERAL_RUNNER'
} as const;

export const EXECUTION_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED'
} as const;

export const REMEDIATION_RESULTS = {
  DEPLOY_PATCH: 'DEPLOY_PATCH',
  ROLLBACK: 'ROLLBACK',
  VERIFIED_PASSED: 'VERIFIED_PASSED'
} as const;

export const SERVICE_STATUS = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  CRITICAL: 'CRITICAL'
} as const;

export const RISK_LEVELS = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
} as const;

export const SOURCES = {
  PROMETHEUS: 'prometheus',
  DATADOG: 'datadog',
  CLOUDWATCH: 'cloudwatch'
} as const;

export const SEVERITIES = {
  CRITICAL: 'CRITICAL',
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO'
} as const;

export const SESSION_STATES = {
  IDLE: 'IDLE',
  INVESTIGATING: 'INVESTIGATING',
  WAITING_FOR_APPROVAL: 'WAITING_FOR_APPROVAL',
  RESOLVED: 'RESOLVED',
  FAILED: 'FAILED',
  REJECTED: 'REJECTED'
} as const;

export const EVENT_TYPES = {
  SESSION_STARTED: 'SESSION_STARTED',
  AGENT_THOUGHT: 'AGENT_THOUGHT',
  TOOL_APPROVAL_REQUIRED: 'TOOL_APPROVAL_REQUIRED',
  TOOL_CALL_COMPLETED: 'TOOL_CALL_COMPLETED',
  APPROVAL_GRANTED: 'APPROVAL_GRANTED',
  APPROVAL_REJECTED: 'APPROVAL_REJECTED',
  INCIDENT_RESOLVED: 'INCIDENT_RESOLVED',
  INCIDENT_FAILED: 'INCIDENT_FAILED',
  CONNECTED: 'CONNECTED'
} as const;

export const CHAT_ROLES = {
  SYSTEM: 'system',
  USER: 'user',
  ASSISTANT: 'assistant'
} as const;

export const APPROVAL_DECISIONS = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT'
} as const;

export const EVIDENCE_CATEGORIES = {
  STACK_TRACE: 'STACK_TRACE',
  COMMIT_DIFF: 'COMMIT_DIFF',
  SANDBOX_REPRODUCTIONS: 'SANDBOX_REPRODUCTIONS'
} as const;

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE'
} as const;

export const HTTP_CONTENT_TYPES = {
  JSON: 'application/json',
  STRATEGIC_MERGE_PATCH: 'application/strategic-merge-patch+json',
  GITHUB_V3_JSON: 'application/vnd.github.v3+json'
} as const;

export const API_PATHS = {
  CHECKOUT: '/api/v1/checkout'
} as const;

export const DEFAULT_CONFIG = {
  MAX_TURNS: 10,
  DEFAULT_SERVICE_NAME: 'checkout-service',
  DEFAULT_TIMEFRAME_MINUTES: 15,
  DEFAULT_INCIDENT_ID: 'INC-1024',
  DEFAULT_REGION: 'us-east-1',
  DEFAULT_ENVIRONMENT: 'production',
  DAEMON_PORT: 8790,
  SERVER_PORT: 4000
} as const;
