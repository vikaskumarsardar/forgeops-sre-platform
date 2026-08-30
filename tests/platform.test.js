/**
 * ForgeOps SRE Control Plane Platform Test Suite (node:test)
 * Tests core components: EvidenceGraph, PolicyEngine, ProviderRegistry, TrueForgeHarness, LocalSandboxProvider, RemediationTool
 */

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

// Dynamic module requires via tsx module alias resolution or relative paths
const EvidenceGraph = require('../src/core/evidenceGraph').default || require('../src/core/evidenceGraph');
const PolicyEngine = require('../src/core/policy').default || require('../src/core/policy');
const providerRegistry = require('../src/core/providerRegistry').default || require('../src/core/providerRegistry');
const harness = require('../src/server/agent/harness').default || require('../src/server/agent/harness');
const localSandboxProvider = require('../src/providers/local/localSandboxProvider').default || require('../src/providers/local/localSandboxProvider');
const remediationTool = require('../src/server/tools/remediationTool').default || require('../src/server/tools/remediationTool');

test('1. EvidenceGraph adds and manages evidence nodes', () => {
  const graph = new EvidenceGraph('INC-TEST-100');
  graph.addEvidence({
    category: 'STACK_TRACE',
    description: 'TypeError: Cannot read properties of undefined',
    payload: { file: 'checkoutService.js', line: 37 },
    verified: true
  });

  const chain = graph.getChain();
  assert.strictEqual(chain.length, 1);
  assert.strictEqual(chain[0].category, 'STACK_TRACE');
  assert.strictEqual(chain[0].verified, true);
});

test('2. PolicyEngine classifies tool risk tiers correctly', () => {
  const readRisk = PolicyEngine.evaluateRisk('read_source_code', { file_path: 'checkoutService.js' });
  assert.strictEqual(readRisk.riskLevel, 'LOW');
  assert.strictEqual(readRisk.requiresHumanApproval, false);

  const metricsRisk = PolicyEngine.evaluateRisk('get_metrics', { service_name: 'checkout-service' });
  assert.strictEqual(readRisk.riskLevel, 'LOW');

  const remediationRisk = PolicyEngine.evaluateRisk('apply_remediation', { remediation_type: 'deploy_code_patch' });
  assert.strictEqual(remediationRisk.riskLevel, 'HIGH');
  assert.strictEqual(remediationRisk.requiresHumanApproval, true);
});

test('3. ProviderRegistry resolves production cloud infrastructure providers', () => {
  const obs = providerRegistry.get('observability');
  assert.ok(obs);
  const sc = providerRegistry.get('sourceControl');
  assert.ok(sc);
  const sb = providerRegistry.get('sandbox');
  assert.ok(sb);
  const dep = providerRegistry.get('deployment');
  assert.ok(dep);
});

test('4. LocalSandboxProvider reproduces bugs in Node.js microservice', async () => {
  process.env.CHECKOUT_NO_LISTEN = "true";
  const targetPath = 'checkoutService.js';
  
  // Bug reproduction test with invalid payload (missing promoRules)
  const result = await localSandboxProvider.reproduceBug(
    { items: [{ price: 10, quantity: 1 }] },
    targetPath,
    'processCheckout'
  );

  assert.ok(result);
  assert.ok(result.reproduced === true || result.status === 'SUCCESS');
  assert.strictEqual(result.sandbox_environment, 'ISOLATED_EPHEMERAL_POD');
  assert.ok(result.telemetry.execution_time_ms >= 0);
});

test('5. RemediationTool generates Qodo PR metadata & handles code patch structure', async () => {
  const testFile = path.resolve(__dirname, 'scratch_test_target.txt');
  fs.writeFileSync(testFile, 'const rate = 0;\n', 'utf8');

  const result = await remediationTool.execute({
    remediation_type: 'deploy_code_patch',
    reasoning: 'Fixed division by zero bug',
    target_file: testFile,
    search_pattern: 'const rate = 0;',
    replacement_code: 'const rate = 1.0;'
  });

  assert.strictEqual(result.status, 'SUCCESS');
  assert.ok(result.branch.startsWith('fix/sre-'));
  assert.strictEqual(result.qodo_review_meta.review_required, true);

  const updatedCode = fs.readFileSync(testFile, 'utf8');
  assert.strictEqual(updatedCode, 'const rate = 1.0;\n');

  // Clean up scratch test file
  if (fs.existsSync(testFile)) {
    fs.unlinkSync(testFile);
  }
});

test('6. TrueForgeHarness runs full autonomous SRE investigation loop', async () => {
  let approvalTriggered = false;

  const listener = (event) => {
    if (event.type === 'TOOL_APPROVAL_REQUIRED') {
      approvalTriggered = true;
      harness.resolveApproval(event.approval.approvalId, 'APPROVE');
    }
  };

  harness.onEvent(listener);

  await harness.runAgentLoop('Checkout API returning 500 error spikes on checkout-service');

  assert.strictEqual(approvalTriggered, true);
  assert.strictEqual(harness.sessionState, 'RESOLVED');
});
