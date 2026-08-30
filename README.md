# 🚀 ForgeOps — Autonomous AI SRE Control Plane Platform

[![TrueForge SDK](https://img.shields.io/badge/TrueForge%20SDK-v0.1.3-8a2be2)](https://github.com/truefoundry/trueforge)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-1.28+-326ce5)](https://kubernetes.io/)
[![Prometheus](https://img.shields.io/badge/Prometheus-v2.45-e6522c)](https://prometheus.io/)
[![Grafana Loki](https://img.shields.io/badge/Loki-v2.9-f47820)](https://grafana.com/oss/loki/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **ForgeOps** is an enterprise-grade Autonomous Production Site Reliability Engineering (SRE) Control Plane Platform powered by **`@truefoundry/trueforge-sdk`**. It autonomously detects HTTP 500 error spikes, parses Grafana Loki logs, reads source code, proves bugs in isolated sandboxes, enforces Human-in-the-Loop (HITL) safety policies, and performs closed-loop APM health verification with auto-rollback safeguards.

---

## 🏛️ System Architecture & Workflow

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              ForgeOps Sentinel Platform                                │
 │                                                                                        │
 │  ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐  │
 │  │   Next.js 15 Web UI  │      │  Terminal Agent CLI  │      │ Express API Backend  │  │
 │  │ (http://localhost:3000)│    │ (npm run agent:cli)  │      │ (http://localhost:4000)│ │
 │  └──────────┬───────────┘      └──────────┬───────────┘      └──────────┬───────────┘  │
 └─────────────┼─────────────────────────────┼─────────────────────────────┼──────────────┘
               │                             │                             │
               ▼                             ▼                             ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                TrueForge Agent Harness                                 │
 │                              (src/server/agent/harness.ts)                             │
 │                                                                                        │
 │  • Native TrueForge Client SDK Integration (@truefoundry/trueforge-sdk)                │
 │  • Pluggable LLM Strategy Pattern (Gemini 2.5 Flash / Ollama / Autonomous SRE Engine)   │
 │  • Evidence Graph Engine (Stack Trace -> Source Lines -> Sandbox Execution Proof)      │
 │  • Policy Risk Engine & HITL Safety Gate (policy.ts)                                  │
 └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                                             ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                             Infrastructure ProviderRegistry                            │
 │                               (src/core/providerRegistry.ts)                           │
 │                                                                                        │
 │  ┌──────────────────────┐   ┌──────────────────────┐   ┌────────────────────────────┐  │
 │  │  Observability (APM) │   │  Source Control API  │   │  Ephemeral Sandbox Runner  │  │
 │  │  • Prometheus (:9090)│   │  • GitHub REST API v3│   │  • Local Process Runner    │  │
 │  │  • Grafana Loki (:3100)│ │  • Local Git Service │   │  • K8s Container Execution │  │
 │  └──────────────────────┘   └──────────────────────┘   └────────────────────────────┘  │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features & Technical Highlights

* **🧠 Pluggable Strategy Pattern Architecture (`llmStrategy.ts`):** Supports Gemini 2.5 Flash (`GeminiLLMProvider`), local Ollama (`OllamaLLMProvider`), and deterministic fallback (`AutonomousSREEngineProvider`).
* **📡 Real Prometheus PromQL & Loki Telemetry (`prometheusLokiProvider.ts`):** Queries Prometheus REST API (`:9090`) with live PromQL and Grafana Loki log query API (`:3100`). Target microservices export standard plain-text exposition metrics via `prom-client`.
* **📁 100% Path-Agnostic External Target Support (`TARGET_SERVICES_DIR`):** Supports debugging microservices located anywhere on local disk or external repositories outside the platform directory.
* **🛡️ Human-in-the-Loop (HITL) Safety Gate (`policy.ts`):** Classifies actions into risk tiers (`LOW` vs `HIGH`/`CRITICAL`). Halts execution and pops up the UI/CLI approval modal before applying code patches or rolling back deployments.
* **🔄 Closed-Loop Auto-Rollback Safeguard (`harness.ts`):** Evaluates post-patch error rates in APM. If production metrics stay degraded, ForgeOps automatically executes `kubectl rollout undo` to protect cluster health.
* **🧪 Multi-Language Sandbox Reproduction (`localSandboxProvider.ts`):** Empirically proves bugs in **10-15ms** by measuring real process CPU delta, heap memory usage, and execution latency.
* **⛵ Cloud-Native Kubernetes & Docker Stack (`deploy/k8s/deployment.yaml`):** Multi-stage Dockerfile (`forgeops-sre:v1.0.0`) and complete K8s manifests running in `namespace: forgeops-system` with ServiceAccount RBAC authorization.

---

## 🌐 Target Microservices Architecture

ForgeOps manages and debugs polyglot production microservices across standalone repositories:

| Microservice | Language | Standalone Port | Repository Link | Bug Diagnostic Scenario |
|---|---|---|---|---|
| 🛒 **`checkout-service`** | **Node.js** | **4000** | [forgeops-checkout-node](https://github.com/vikaskumarsardar/forgeops-checkout-node) | Unhandled `TypeError: Cannot read properties of undefined (reading 'find')` in promo rule calculation |
| 💳 **`payment-service`** | **Go** | **5000** | [forgeops-payment-go](https://github.com/vikaskumarsardar/forgeops-payment-go) | Division-by-zero runtime panic when `ConversionRate == 0` |
| 📦 **`inventory-service`** | **Python** | **6000** | [forgeops-inventory-python](https://github.com/vikaskumarsardar/forgeops-inventory-python) | String `ValueError` when `warehouse_id` receives non-numeric `"MAIN_ZONE_A"` |

---

## 🔑 TrueForge SDK Integration & Compliance

ForgeOps natively integrates with `@truefoundry/trueforge-sdk`:

```typescript
import { TrueForge } from '@truefoundry/trueforge-sdk';

// 1. Initialize TrueForge Client
const trueforgeClient = new TrueForge({ baseUrl: process.env.TRUEFORGE_DAEMON_URL });

// 2. Register Agent Specification
const agent = await trueforgeClient.agents.create({
  name: 'forgeops-sre-agent',
  manifest: { description: 'Autonomous Production SRE Debugging Agent' }
});

// 3. Create Investigation Session
const session = await trueforgeClient.sessions.create({
  agentId: agent.id,
  options: { title: 'Incident INC-1024 Investigation' }
});
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18.0.0+
* **npm**: v9.0.0+
* **kubectl** & **Docker** (for Kubernetes execution)

### 1. Installation

```bash
git clone https://github.com/vikaskumarsardar/forgeops-sre-platform.git
cd forgeops-sre-platform
npm install
```

### 2. Run Local Development Servers

```bash
# Terminal 1: Start Express API Backend (Port 4000)
npm run server

# Terminal 2: Start Next.js Web UI (Port 3000)
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser. Click **`🔥 Trigger Prod Outage`** to trigger the live SSE event stream!

### 3. Testing External Target Microservices (Path-Agnostic)

To test ForgeOps against microservices located outside the workspace (e.g. on Desktop):

```bash
# Run CLI against external microservice folder:
TARGET_SERVICES_DIR=/home/user/Desktop/external-target-services npx tsx src/server/cliRunner.ts --service checkout-service
```

### 4. Deploy & Verify in Production Kubernetes

```bash
# Apply Kubernetes Manifests (Prometheus, Loki, Control Plane)
kubectl apply -f deploy/k8s/deployment.yaml

# Check Pod Status in forgeops-system namespace
kubectl get pods -n forgeops-system

# Run In-Pod CLI Agent Execution
kubectl exec -n forgeops-system deployment/forgeops-control-plane -- npx tsx src/server/cliRunner.ts
```

---

## 📝 License & Commit Author

* **Author:** Swapan Kumar Sardar (`swapankumarsardar73727@gmail.com`)
* **GitHub Username:** `vikaskumarsardar`
* **License:** MIT License
