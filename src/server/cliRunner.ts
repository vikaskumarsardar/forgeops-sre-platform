/**
 * CLI Terminal Agent Runner (TypeScript)
 * Runs ForgeOps agent investigation directly in terminal with colorized output.
 */

import harness from './agent/harness';
import { EVENT_TYPES, APPROVAL_DECISIONS } from '@/core/constants';

async function runCli() {
  console.log("\n=======================================================");
  console.log("  🚀 FORGEOPS: AUTONOMOUS PRODUCTION DEBUGGING AGENT  ");
  console.log("=======================================================\n");

  harness.onEvent((event: any) => {
    if (event.type === EVENT_TYPES.SESSION_STARTED) {
      console.log(`[SESSION STARTED] Instruction: "${event.instruction}"`);
    } else if (event.type === EVENT_TYPES.AGENT_THOUGHT) {
      console.log(`\n🤔 [TURN ${event.turn}] THOUGHT: ${event.thought}`);
    } else if (event.type === EVENT_TYPES.TOOL_CALL_COMPLETED) {
      console.log(`✅ [TOOL DONE] Result:`, JSON.stringify(event.result).substring(0, 180) + "...");
    } else if (event.type === EVENT_TYPES.TOOL_APPROVAL_REQUIRED) {
      console.log(`\n🚨 [HITL APPROVAL REQUIRED] Risk: ${event.approval.riskLevel}`);
      console.log(`   Reason: ${event.approval.reason}`);
      console.log(`   Tool: ${event.approval.toolName}`);
      console.log(`   Args:`, JSON.stringify(event.approval.toolArgs, null, 2));
      console.log("\n   Simulating Human Operator Approval via CLI...");
      harness.resolveApproval(event.approval.approvalId, APPROVAL_DECISIONS.APPROVE);
    } else if (event.type === EVENT_TYPES.INCIDENT_RESOLVED) {
      console.log(`\n🎉 [INCIDENT RESOLVED] Remediation successfully deployed and verified!`);
    }
  });

  await harness.runAgentLoop("Checkout API is returning 500 error spikes on guest checkouts. Investigate and fix.");
}

runCli().catch(console.error);
