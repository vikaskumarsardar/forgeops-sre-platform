/**
 * TrueForge Agent Harness Execution Engine & Controller (TypeScript)
 * Supports Dual-Track Execution:
 *   - Track B: Native TrueForge Daemon Session (client.agents.create & client.sessions.create)
 *   - Track A: Local Orchestration Engine with TrueForge SDK contracts & Pluggable LLM Strategy Pattern
 */

import { TrueForge } from '@truefoundry/trueforge-sdk';
import { SYSTEM_PROMPT } from './prompts';
import metricsTool from '@/server/tools/metricsTool';
import logsTool from '@/server/tools/logsTool';
import gitTool from '@/server/tools/gitTool';
import sourceCodeTool from '@/server/tools/sourceCodeTool';
import sandboxTool from '@/server/tools/sandboxTool';
import remediationTool from '@/server/tools/remediationTool';
import providerRegistry from '@/core/providerRegistry';
import EvidenceGraph from '@/core/evidenceGraph';
import PolicyEngine from '@/core/policy';
import { LLMStrategyFactory, LLMProvider, LLMMessage } from '@/core/llm/llmStrategy';
import { 
  TOOL_NAMES, 
  SESSION_STATES, 
  APPROVAL_DECISIONS, 
  EVIDENCE_CATEGORIES, 
  DEFAULT_CONFIG,
  EVENT_TYPES,
  CHAT_ROLES,
  PROVIDER_CATEGORIES,
  SERVICE_STATUS
} from '@/core/constants';

const toolsRegistry: Record<string, any> = {
  [TOOL_NAMES.GET_METRICS]: metricsTool,
  [TOOL_NAMES.SEARCH_LOGS]: logsTool,
  [TOOL_NAMES.GET_DEPLOYMENT_HISTORY]: gitTool,
  [TOOL_NAMES.READ_SOURCE_CODE]: sourceCodeTool,
  [TOOL_NAMES.RUN_SANDBOX_TEST]: sandboxTool,
  [TOOL_NAMES.APPLY_REMEDIATION]: remediationTool
};

export class TrueForgeHarness {
  sessionState: string;
  pendingApproval: any;
  eventListeners: Array<(event: any) => void>;
  history: LLMMessage[];
  nativeSessionId: string | null;
  trueforgeClient: TrueForge | null;
  evidenceGraph: InstanceType<typeof EvidenceGraph> | null;
  llmProvider: LLMProvider;

  constructor(llmProvider?: LLMProvider) {
    this.sessionState = SESSION_STATES.IDLE;
    this.pendingApproval = null;
    this.eventListeners = [];
    this.history = [];
    this.nativeSessionId = null;
    this.evidenceGraph = null;
    this.llmProvider = llmProvider || LLMStrategyFactory.getProvider();

    try {
      const daemonUrl = process.env.TRUEFORGE_BASE_URL || `http://localhost:${DEFAULT_CONFIG.DAEMON_PORT}`;
      this.trueforgeClient = new TrueForge({ baseUrl: daemonUrl });
    } catch (err) {
      this.trueforgeClient = null;
    }
  }

  onEvent(listener: (event: any) => void): void {
    this.eventListeners.push(listener);
  }

  emit(event: any): void {
    this.eventListeners.forEach(fn => fn(event));
  }

  async initNativeTrueForgeSession(): Promise<any> {
    if (!this.trueforgeClient) return null;
    try {
      await this.trueforgeClient.settings.modelProviders.createOrUpdate({
        manifest: {
          provider_type: 'gemini',
          api_key: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || 'sk-mock-key'
        } as any
      });

      const agent = await this.trueforgeClient.agents.create({
        name: 'forgeops-agent',
        manifest: {
          description: 'Autonomous Production Debugging Agent'
        }
      } as any);

      const session = await this.trueforgeClient.sessions.create({
        agentId: (agent as any)?.id || 'mock-agent-id',
        options: { title: 'Incident INC-1024 Investigation' }
      } as any);

      this.nativeSessionId = (session as any)?.id || 'mock-session-id';
      return session;
    } catch (err) {
      return null;
    }
  }

  /**
   * Strategy Pattern Execution for LLM Reasoning
   */
  async callLLM(messages: LLMMessage[]): Promise<any> {
    return this.llmProvider.generateJSON(messages);
  }

  matchToolName(rawName?: string): string | null {
    if (!rawName) return null;
    const name = rawName.toLowerCase();
    if (name.includes('metric')) return TOOL_NAMES.GET_METRICS;
    if (name.includes('log')) return TOOL_NAMES.SEARCH_LOGS;
    if (name.includes('deploy') || name.includes('git') || name.includes('history')) return TOOL_NAMES.GET_DEPLOYMENT_HISTORY;
    if (name.includes('source') || name.includes('code') || name.includes('read')) return TOOL_NAMES.READ_SOURCE_CODE;
    if (name.includes('sandbox') || name.includes('test')) return TOOL_NAMES.RUN_SANDBOX_TEST;
    if (name.includes('remediat') || name.includes('patch') || name.includes('fix') || name.includes('rollback')) return TOOL_NAMES.APPLY_REMEDIATION;
    return null;
  }

  /**
   * Helper: Dispatches tool call through Provider Registry and collects Evidence Graph nodes.
   */
  private async executeToolViaProvider(toolToCall: string, toolArgs: Record<string, any>): Promise<any> {
    if (!this.evidenceGraph) {
      this.evidenceGraph = new EvidenceGraph(DEFAULT_CONFIG.DEFAULT_INCIDENT_ID);
    }

    switch (toolToCall) {
      case TOOL_NAMES.GET_METRICS: {
        return providerRegistry.get(PROVIDER_CATEGORIES.OBSERVABILITY).getMetrics(
          toolArgs.service_name || DEFAULT_CONFIG.DEFAULT_SERVICE_NAME,
          toolArgs.timeframe_minutes || DEFAULT_CONFIG.DEFAULT_TIMEFRAME_MINUTES
        );
      }
      case TOOL_NAMES.SEARCH_LOGS: {
        const logs = await providerRegistry.get(PROVIDER_CATEGORIES.OBSERVABILITY).searchLogs(
          toolArgs.service_name || DEFAULT_CONFIG.DEFAULT_SERVICE_NAME,
          toolArgs.severity,
          toolArgs.limit
        );
        if (logs && logs.length > 0) {
          const sample = logs[0];
          this.evidenceGraph.addEvidence({
            category: EVIDENCE_CATEGORIES.STACK_TRACE,
            description: `Captured exception stack trace for ${toolArgs.service_name}`,
            payload: { error_message: sample.message, stack_trace: sample.stack_trace, timestamp: sample.timestamp },
            verified: true
          });
        }
        return logs;
      }
      case TOOL_NAMES.GET_DEPLOYMENT_HISTORY: {
        const history = await providerRegistry.get(PROVIDER_CATEGORIES.SOURCE_CONTROL).getDeploymentHistory(
          toolArgs.service_name || DEFAULT_CONFIG.DEFAULT_SERVICE_NAME,
          toolArgs.commit_sha
        );
        if (history) {
          this.evidenceGraph.addEvidence({
            category: EVIDENCE_CATEGORIES.COMMIT_DIFF,
            description: `Captured deployment history diff for ${toolArgs.service_name}`,
            payload: { commit: history.commit, diff: history.diff },
            verified: true
          });
        }
        return history;
      }
      case TOOL_NAMES.READ_SOURCE_CODE: {
        if (!toolArgs.file_path) {
          throw new Error("read_source_code tool requires 'file_path' parameter.");
        }
        return providerRegistry.get(PROVIDER_CATEGORIES.SOURCE_CONTROL).readSourceCode(
          toolArgs.file_path
        );
      }
      case TOOL_NAMES.RUN_SANDBOX_TEST: {
        const sandboxResult = await providerRegistry.get(PROVIDER_CATEGORIES.SANDBOX).reproduceBug(
          toolArgs.proposed_patch || toolArgs.payload || { items: [{ price: 49.99, quantity: 1 }] }
        );
        if (sandboxResult) {
          this.evidenceGraph.addEvidence({
            category: EVIDENCE_CATEGORIES.SANDBOX_REPRODUCTIONS,
            description: `Executed isolated sandbox reproduction`,
            payload: { reproduced: sandboxResult.reproduced, environment: sandboxResult.sandbox_environment, result: sandboxResult.result },
            verified: Boolean(sandboxResult.reproduced)
          });
        }
        return sandboxResult;
      }
      case TOOL_NAMES.APPLY_REMEDIATION: {
        const result = await providerRegistry.get(PROVIDER_CATEGORIES.DEPLOYMENT).deployPatch({
          service_name: toolArgs.service_name,
          remediation_type: toolArgs.remediation_type,
          code_patch: toolArgs.code_patch,
          verified: true
        });
        return result;
      }
      default: {
        const toolImpl = toolsRegistry[toolToCall];
        return toolImpl.execute(toolArgs);
      }
    }
  }

  async startSession(incident: any): Promise<void> {
    const prompt = `PRODUCTION INCIDENT ALERT TRIGGERED:\nID: ${incident.id}\nService: ${incident.service?.name}\nSeverity: ${incident.severity}\nSymptoms: ${JSON.stringify(incident.symptoms)}\n\nPlease investigate the root cause, run sandbox tests to verify, and propose remediation.`;
    return this.runAgentLoop(prompt);
  }

  async runAgentLoop(userInstruction: string): Promise<void> {
    this.sessionState = SESSION_STATES.INVESTIGATING;
    this.history = [
      { role: CHAT_ROLES.SYSTEM, content: SYSTEM_PROMPT },
      { role: CHAT_ROLES.USER, content: userInstruction }
    ];

    await this.initNativeTrueForgeSession();

    this.emit({
      type: EVENT_TYPES.SESSION_STARTED,
      instruction: userInstruction,
      nativeSessionId: this.nativeSessionId,
      timestamp: new Date().toISOString()
    });

    let turns = 0;
    const maxTurns = DEFAULT_CONFIG.MAX_TURNS;
    const executedToolSignatures = new Set<string>();

    while (turns < maxTurns && this.sessionState === SESSION_STATES.INVESTIGATING) {
      turns++;

      let toolToCall: string | null = null;
      let toolArgs: Record<string, any> = {};
      let thought = "";

      const llmResult = await this.callLLM(this.history);
      
      const rawToolName = llmResult?.tool || llmResult?.tool_call?.name || llmResult?.name;
      const rawToolArgs = llmResult?.args || llmResult?.tool_call?.args || {};

      if (llmResult && rawToolName) {
        const matched = this.matchToolName(rawToolName);
        const sig = `${matched}:${JSON.stringify(rawToolArgs)}`;
        if (matched && !executedToolSignatures.has(sig)) {
          toolToCall = matched;
          toolArgs = rawToolArgs;
          thought = llmResult.thought || `Executing ${toolToCall} tool based on reasoning.`;
        }
      }

      if (!toolToCall) {
        this.emit({
          type: EVENT_TYPES.AGENT_THOUGHT,
          turn: turns,
          thought: llmResult?.thought || "LLM completed tool selection reasoning loop.",
          timestamp: new Date().toISOString()
        });
        break;
      }

      executedToolSignatures.add(`${toolToCall}:${JSON.stringify(toolArgs)}`);

      this.emit({
        type: EVENT_TYPES.AGENT_THOUGHT,
        turn: turns,
        thought,
        proposedTool: toolToCall,
        args: toolArgs,
        timestamp: new Date().toISOString()
      });

      const riskEvaluation = PolicyEngine.evaluateRisk(toolToCall, toolArgs);

      if (riskEvaluation.requiresHumanApproval) {
        this.sessionState = SESSION_STATES.WAITING_FOR_APPROVAL;
        this.pendingApproval = {
          toolToCall,
          toolArgs,
          riskEvaluation,
          turn: turns
        };

        this.emit({
          type: EVENT_TYPES.TOOL_APPROVAL_REQUIRED,
          tool: toolToCall,
          args: toolArgs,
          approval: {
            approvalId: `appr-${Date.now()}`,
            toolName: toolToCall,
            toolArgs,
            riskLevel: riskEvaluation.riskLevel,
            reason: riskEvaluation.reason
          },
          riskEvaluation,
          evidenceChain: this.evidenceGraph ? (this.evidenceGraph as any).getChain ? (this.evidenceGraph as any).getChain() : this.evidenceGraph.evidenceChain : [],
          timestamp: new Date().toISOString()
        });

        return;
      }

      try {
        const result = await this.executeToolViaProvider(toolToCall, toolArgs);
        this.emit({
          type: EVENT_TYPES.TOOL_CALL_COMPLETED,
          tool: toolToCall,
          result,
          timestamp: new Date().toISOString()
        });

        this.history.push({
          role: CHAT_ROLES.ASSISTANT,
          content: `Thought: ${thought}\nTool Call: ${toolToCall}(${JSON.stringify(toolArgs)})\nResult: ${JSON.stringify(result)}`
        });
      } catch (err: any) {
        this.history.push({
          role: CHAT_ROLES.ASSISTANT,
          content: `Thought: ${thought}\nTool Call: ${toolToCall} failed with error: ${err.message}`
        });
      }
    }

    if (this.sessionState === SESSION_STATES.INVESTIGATING) {
      this.sessionState = SESSION_STATES.RESOLVED;
      this.emit({
        type: EVENT_TYPES.INCIDENT_RESOLVED,
        thought: "Autonomous investigation and remediation complete.",
        timestamp: new Date().toISOString()
      });
    }
  }

  async resolveApproval(approvalId: string, decision: string): Promise<any> {
    return this.handleHumanApproval(decision);
  }

  async handleHumanApproval(decision: string): Promise<any> {
    if (!this.pendingApproval) {
      return { status: "ERROR", message: "No pending tool approval required." };
    }

    const { toolToCall, toolArgs } = this.pendingApproval;
    const isApprovedDecision = decision === APPROVAL_DECISIONS.APPROVE;
    const toolImpl = toolsRegistry[toolToCall];

    if (isApprovedDecision) {
      this.emit({
        type: EVENT_TYPES.APPROVAL_GRANTED,
        tool: toolToCall,
        timestamp: new Date().toISOString()
      });

      try {
        const result = await toolImpl.execute(toolArgs);
        this.sessionState = SESSION_STATES.RESOLVED;

        const postPatchHealth = await providerRegistry.get(PROVIDER_CATEGORIES.DEPLOYMENT).healthCheck(toolArgs.service_name);
        const isPostPatchDegraded = postPatchHealth.status === SERVICE_STATUS.DEGRADED;

        if (isPostPatchDegraded) {
          await providerRegistry.get(PROVIDER_CATEGORIES.DEPLOYMENT).rollback(toolArgs.service_name);
          this.emit({
            type: EVENT_TYPES.INCIDENT_FAILED,
            reason: "Post-remediation health check failed. Automatically triggered safety rollback.",
            timestamp: new Date().toISOString()
          });
        } else {
          this.emit({
            type: EVENT_TYPES.INCIDENT_RESOLVED,
            remediationResult: result,
            postPatchHealth,
            evidenceChain: this.evidenceGraph ? (this.evidenceGraph as any).getChain ? (this.evidenceGraph as any).getChain() : this.evidenceGraph.evidenceChain : [],
            timestamp: new Date().toISOString()
          });
        }

        this.pendingApproval = null;
        return { status: "SUCCESS", result, postPatchHealth };
      } catch (err: any) {
        this.sessionState = SESSION_STATES.FAILED;
        this.pendingApproval = null;
        return { status: "FAILED", error: err.message };
      }
    } else {
      this.sessionState = SESSION_STATES.REJECTED;
      this.emit({
        type: EVENT_TYPES.APPROVAL_REJECTED,
        tool: toolToCall,
        timestamp: new Date().toISOString()
      });
      this.pendingApproval = null;
      return { status: "REJECTED", message: "Remediation action rejected by human operator." };
    }
  }
}

export default new TrueForgeHarness();
