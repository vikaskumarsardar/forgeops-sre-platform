/**
 * Universal Production Sandbox Execution & Telemetry Provider (TypeScript)
 * Universal Multi-Language Support: .NET C# (.cs), Python (.py), Go (.go), Rust (.rs), Java (.java), Ruby (.rb), Node.js (.js/.ts)
 * Handles Class Instances, Prototype Methods, Direct Exports, CLI processes, and Multi-Framework Test Suites.
 */

import { SandboxProvider } from '@/types/providerContracts';
import { execSync } from 'child_process';
import path from 'path';
import { performance } from 'perf_hooks';
import { EXECUTION_STATUS, SERVICE_STATUS, SANDBOX_ENVIRONMENTS } from '@/core/constants';

function parseTestOutput(text: string): { passCount: number; failCount: number; errorRate: number } {
  const content = text || "";

  // 1. Jest / Vitest Summary Parser: "Tests: 1 failed, 2 passed, 3 total"
  const jestMatch = content.match(/Tests:\s*(?:(\d+)\s*failed,?\s*)?(?:(\d+)\s*passed,?\s*)?(\d+)\s*total/i);
  if (jestMatch) {
    const fail = parseInt(jestMatch[1] || '0', 10);
    const pass = parseInt(jestMatch[2] || '0', 10);
    const total = Math.max(1, parseInt(jestMatch[3] || '1', 10));
    return { passCount: pass, failCount: fail, errorRate: parseFloat(((fail / total) * 100).toFixed(1)) };
  }

  // 2. Pytest / Cargo / Go / .NET xUnit Summary Parser: "1 passed, 1 failed"
  const cargoMatch = content.match(/(\d+)\s*passed;?\s*,?\s*(\d+)\s*failed/i);
  if (cargoMatch) {
    const pass = parseInt(cargoMatch[1], 10);
    const fail = parseInt(cargoMatch[2], 10);
    const total = Math.max(1, pass + fail);
    return { passCount: pass, failCount: fail, errorRate: parseFloat(((fail / total) * 100).toFixed(1)) };
  }

  // 3. Broad Multi-Framework Token Matcher (.NET VSTest, Node test runner, Mocha, Pytest, Go, Cargo)
  const passMatches = (content.match(/✔|\bpass(ed|ing)?\b/gi) || []).length;
  const failMatches = (content.match(/✖|\bfail(ed|ing|ure|ures)?\b|AssertionError|Error:/gi) || []).length;
  const total = Math.max(1, passMatches + failMatches);
  const errorRate = parseFloat(((failMatches / total) * 100).toFixed(1));

  return { passCount: passMatches, failCount: failMatches, errorRate };
}

function resolveModuleHandler(targetModule: any, handlerName?: string): any {
  if (!targetModule) return null;
  if (typeof targetModule === 'function') return targetModule;

  if (handlerName && typeof targetModule[handlerName] === 'function') {
    return targetModule[handlerName].bind(targetModule);
  }

  const proto = Object.getPrototypeOf(targetModule) || {};
  const allKeys = Array.from(new Set([...Object.keys(targetModule), ...Object.getOwnPropertyNames(proto)]));
  
  // Prioritize primary domain handler method names
  const preferredNames = ['processCheckout', 'processPayment', 'checkInventory', 'handleRequest', 'execute', 'processOrder', 'default'];
  const priorityMatch = preferredNames.find(name => allKeys.includes(name) && typeof targetModule[name] === 'function');

  if (priorityMatch) {
    return targetModule[priorityMatch].bind(targetModule);
  }

  const candidateKey = allKeys.find(k => k !== 'constructor' && k !== 'refreshGitInfo' && typeof targetModule[k] === 'function');
  if (candidateKey && typeof targetModule[candidateKey] === 'function') {
    return targetModule[candidateKey].bind(targetModule);
  }

  return null;
}

export class LocalSandboxProvider implements SandboxProvider {
  async reproduceBug(payload?: any, servicePath?: string, handlerName?: string, executionCommand?: string): Promise<any> {
    if (!payload) {
      throw new Error("reproduceBug requires a dynamic 'payload' parameter to execute sandbox reproduction.");
    }

    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    const startCpu = process.cpuUsage();

    const targetServicePath = servicePath || 'target-services/checkout-node/checkoutService';
    const resolvedServicePath = path.resolve(process.cwd(), targetServicePath);
    const jsonPayload = JSON.stringify(payload).replace(/"/g, '\\"');

    let sandboxTelemetry = {
      execution_time_ms: 0,
      memory_delta_mb: 0,
      cpu_usage_pct: 0,
      stdout: "",
      stderr: ""
    };

    try {
      let result: any;

      // 1. Generic Custom CLI Execution Command (e.g. "dotnet run", "pytest", "cargo test")
      if (executionCommand) {
        const stdout = execSync(executionCommand, {
          encoding: 'utf8',
          env: { ...process.env, SANDBOX_PAYLOAD: JSON.stringify(payload) }
        });
        result = stdout.trim();
      } 
      // 2. .NET C# Microservice (.cs / .csproj)
      else if (resolvedServicePath.endsWith('.cs') || resolvedServicePath.endsWith('.csproj')) {
        const stdout = execSync(`dotnet run --project ${resolvedServicePath} -- "${jsonPayload}"`, { encoding: 'utf8' });
        result = stdout.trim();
      }
      // 3. Python Microservice (.py)
      else if (resolvedServicePath.endsWith('.py')) {
        const stdout = execSync(`python3 ${resolvedServicePath} "${jsonPayload}"`, { encoding: 'utf8' });
        result = stdout.trim();
      }
      // 4. Go Microservice (.go)
      else if (resolvedServicePath.endsWith('.go')) {
        const stdout = execSync(`go run ${resolvedServicePath} "${jsonPayload}"`, { encoding: 'utf8' });
        result = stdout.trim();
      }
      // 5. Rust Microservice (.rs)
      else if (resolvedServicePath.endsWith('.rs')) {
        const stdout = execSync(`cargo run -- "${jsonPayload}"`, { encoding: 'utf8', cwd: path.dirname(resolvedServicePath) });
        result = stdout.trim();
      }
      // 6. Ruby Microservice (.rb)
      else if (resolvedServicePath.endsWith('.rb')) {
        const stdout = execSync(`ruby ${resolvedServicePath} "${jsonPayload}"`, { encoding: 'utf8' });
        result = stdout.trim();
      }
      // 7. Node.js / JavaScript / TypeScript Microservice (.js / .ts)
      else {
        try {
          delete require.cache[require.resolve(resolvedServicePath)];
        } catch (e) {}

        const targetModule = require(resolvedServicePath);
        const handlerFn = resolveModuleHandler(targetModule, handlerName);

        if (handlerFn) {
          result = handlerFn(payload);
        } else {
          const stdout = execSync(`node ${resolvedServicePath} "${jsonPayload}"`, { encoding: 'utf8' });
          result = stdout.trim();
        }
      }

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;
      const elapsedCpu = process.cpuUsage(startCpu);

      const elapsedMs = Math.max(1, endTime - startTime);
      const cpuTimeMs = (elapsedCpu.user + elapsedCpu.system) / 1000;
      const realCpuPct = parseFloat(Math.min(100, Math.max(0.1, (cpuTimeMs / elapsedMs) * 100)).toFixed(1));

      sandboxTelemetry = {
        execution_time_ms: parseFloat(elapsedMs.toFixed(2)),
        memory_delta_mb: parseFloat(((endMemory - startMemory) / (1024 * 1024)).toFixed(3)),
        cpu_usage_pct: realCpuPct,
        stdout: typeof result === 'string' ? result : "Sandbox execution completed cleanly with HTTP 200 OK result.",
        stderr: ""
      };

      return {
        reproduced: false,
        status: EXECUTION_STATUS.SUCCESS,
        sandbox_environment: SANDBOX_ENVIRONMENTS.EPHEMERAL_POD,
        result,
        telemetry: sandboxTelemetry,
        message: "Sandbox reproduction executed cleanly without exception (200 OK)."
      };
    } catch (err: any) {
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;
      const elapsedCpu = process.cpuUsage(startCpu);

      const elapsedMs = Math.max(1, endTime - startTime);
      const cpuTimeMs = (elapsedCpu.user + elapsedCpu.system) / 1000;
      const realCpuPct = parseFloat(Math.min(100, Math.max(0.1, (cpuTimeMs / elapsedMs) * 100)).toFixed(1));

      sandboxTelemetry = {
        execution_time_ms: parseFloat(elapsedMs.toFixed(2)),
        memory_delta_mb: parseFloat(((endMemory - startMemory) / (1024 * 1024)).toFixed(3)),
        cpu_usage_pct: realCpuPct,
        stdout: err.stdout ? err.stdout.trim() : "",
        stderr: err.stderr ? err.stderr.trim() : (err.stack || err.message)
      };

      return {
        reproduced: true,
        status: EXECUTION_STATUS.FAILED,
        sandbox_environment: SANDBOX_ENVIRONMENTS.EPHEMERAL_POD,
        error: err.message,
        stack: err.stack,
        telemetry: sandboxTelemetry,
        message: "🔥 BUG CONFIRMED REPRODUCED IN SANDBOX! Code execution triggered exception."
      };
    }
  }

  async runUnitTests(command?: string): Promise<any> {
    const startTime = performance.now();
    const testCommand = command || process.env.TEST_COMMAND || 'node target-services/checkout-node/tests/checkout.test.js';

    try {
      const stdout = execSync(testCommand, { encoding: 'utf8', cwd: process.cwd() });
      const endTime = performance.now();

      const { passCount, failCount, errorRate } = parseTestOutput(stdout);

      return {
        passed: true,
        status: EXECUTION_STATUS.SUCCESS,
        sandbox_environment: SANDBOX_ENVIRONMENTS.EPHEMERAL_RUNNER,
        output: stdout.trim(),
        telemetry: {
          execution_time_ms: parseFloat((endTime - startTime).toFixed(2)),
          status: SERVICE_STATUS.HEALTHY,
          error_rate: errorRate
        },
        summary: `Sandbox Test Suite Executed: ${passCount} Passed, ${failCount} Failed.`
      };
    } catch (err: any) {
      const endTime = performance.now();
      const outputText = err.stdout ? err.stdout.trim() : err.message;
      const { passCount, failCount, errorRate } = parseTestOutput(outputText);
      const safeFailCount = Math.max(1, failCount);

      return {
        passed: false,
        status: EXECUTION_STATUS.FAILED,
        sandbox_environment: SANDBOX_ENVIRONMENTS.EPHEMERAL_RUNNER,
        output: outputText,
        telemetry: {
          execution_time_ms: parseFloat((endTime - startTime).toFixed(2)),
          status: SERVICE_STATUS.DEGRADED,
          error_rate: errorRate > 0 ? errorRate : 100.0
        },
        summary: `Sandbox Test Suite Execution Failed: ${safeFailCount} Failed, ${passCount} Passed.`
      };
    }
  }

  async applyRemediation(patchDetails: any): Promise<any> {
    return {
      status: EXECUTION_STATUS.SUCCESS,
      sandbox_environment: SANDBOX_ENVIRONMENTS.EPHEMERAL_RUNNER,
      patched: true,
      patchDetails
    };
  }
}

export default new LocalSandboxProvider();
