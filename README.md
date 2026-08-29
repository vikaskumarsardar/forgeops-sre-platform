# 🚀 ForgeOps: Universal AI SRE Control Plane

> **"ForgeOps is an AI SRE control plane that investigates incidents, proves root cause through reproducible evidence, validates remediation in isolation, and safely recovers production through policy-driven human approval. Its provider architecture allows the same agent to operate across different observability, source-control, sandbox, and deployment systems."**

---

## 🌟 Pitch & Core Value Proposition

When production outages occur, SRE teams spend critical minutes toggling between Datadog metrics, CloudWatch logs, GitHub commits, and local terminal sandboxes.

**ForgeOps** is an autonomous AI SRE agent powered by the **TrueForge Agent Harness**. It does not just summarize alerts — it:
1. **Normalizes** alerts into a canonical Incident Contract (`INC-XXXX`).
2. **Correlates Telemetry** across pluggable Observability, Source Control, and APM Adapters.
3. **Builds an Evidence Graph** (`EvidenceStrength: HIGH`) connecting stack traces to commit diffs.
4. **Reproduces Bugs** safely in an isolated sandbox runner.
5. **Verifies Candidate Patches** against regression test suites.
6. **Enforces Policy-Driven Safety** (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL` risk tiers) to pause execution for explicit **Human-in-the-Loop (HITL)** approval.
7. **Closed-Loop Deployment & Auto-Rollback:** Performs post-deployment health checks and triggers automated rollbacks if metrics remain degraded.

---

## 🏗️ Universal 3-Layer Architecture

```text
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                      FORGEOPS CONTROL PLANE                             │
 │                    (TrueForge Agent Harness)                            │
 │  • Incident Contract Manager  • Multi-Tier Policy Engine (SAFE/HIGH/CRIT) │
 │  • Evidence Graph Builder     • Decoupled Event Bus (SSE / Webhooks)    │
 └───────────────────────────────────┬─────────────────────────────────────┘
                                     │  Standard MCP Tool Protocol
                                     ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                     UNIVERSAL PROVIDER REGISTRY                         │
 │           (Dynamic Infrastructure Switching via /api/provider-mode)     │
 ├─────────────────────┬───────────────────────┬───────────────────────────┤
 │  OBSERVABILITY      │    SOURCE CONTROL     │    DEPLOYMENT & SANDBOX  │
 │  PROVIDER           │    PROVIDER           │    PROVIDER               │
 │ (Prometheus/Datadog)│ (Git / GitHub / GitLab│ (Docker / k8s / Process)  │
 └──────────┬──────────┴───────────┬───────────┴─────────────┬─────────────┘
            │                      │                         │
            ▼                      ▼                         ▼
 ┌─────────────────────┐┌─────────────────────┐   ┌────────────────────────┐
 │   PYTHON / FASTAPI  ││     GO / FIBER      │   │   JAVA / SPRING BOOT   │
 │   Microservice      ││    Microservice     │   │      Microservice      │
 └─────────────────────┘└─────────────────────┘   └────────────────────────┘
```

---

## 🔌 Provider Abstraction Architecture & Config Switcher

ForgeOps decouples the AI Agent from target technology stacks using 4 core provider contracts:

```text
src/
├── core/
│   ├── incident.js              # Canonical Incident Contract (INC-XXXX)
│   ├── policy.js                # Policy Risk Engine (LOW, MEDIUM, HIGH, CRITICAL Tiers)
│   ├── evidenceGraph.js         # Evidence Chain Builder & Evidence Strength Rating
│   ├── providerRegistry.js      # Provider Registry & Dynamic Config Switcher
│   └── eventBus.js              # Decoupled Event Bus (SSE, CLI, Webhooks)
│
├── contracts/
│   ├── observability.js         # Interface for Metrics & Logs (Prometheus, Datadog, Elastic)
│   ├── sourceControl.js         # Interface for Git & Commits (Git, GitHub, GitLab)
│   ├── sandbox.js               # Interface for Isolated Testing (Docker, Process, k8s)
│   └── deployment.js            # Interface for Deployment & Auto-Rollback (Local, k8s, ArgoCD)
│
└── providers/
    ├── local/                   # Zero-Dependency Local Provider (Hackathon Demo)
    └── prometheus/              # Universal Telemetry / Docker Container Provider
```

### ⚡ Infrastructure Provider Switching Demo:
You can switch the underlying infrastructure provider live without modifying a single line of agent code:

```bash
# Switch to Prometheus / Docker Container Provider
curl -X POST http://localhost:4000/api/provider-mode \
  -H "Content-Type: application/json" \
  -d '{"mode":"prometheus"}'

# Output:
# {"status":"PROVIDER_MODE_UPDATED","activeMode":"prometheus","message":"ForgeOps infrastructure provider switched to 'prometheus' mode without modifying agent core logic."}
```

---

## 📜 Canonical Incident Contract (`INC-XXXX`)

ForgeOps normalizes incoming alerts from Datadog, Prometheus, CloudWatch, PagerDuty, or Webhooks into a standardized schema:

```json
{
  "id": "INC-1024",
  "source": "prometheus",
  "severity": "CRITICAL",
  "service": {
    "name": "checkout-service",
    "environment": "production",
    "region": "us-east-1"
  },
  "symptoms": [
    {
      "type": "error_rate",
      "value": 38.0,
      "threshold": 5.0,
      "unit": "percent"
    }
  ],
  "timestamp": "2026-08-28T06:00:00Z"
}
```

---

## 🚨 Policy Engine & Closed-Loop Remediation

Before executing any action, the **Policy Engine** classifies tool risk:

* **`RISK: LOW` (Auto-Executed):** Read-only metrics inspection, log search, source code inspection, and sandbox test runs.
* **`RISK: HIGH / CRITICAL` (Human Approval Required):** Physical code patches, Git commits, production rollbacks, and server restarts.

```text
               AI Agent Proposes Action
                          │
                          ▼
                    Policy Engine
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
       RISK: LOW                   RISK: HIGH / CRITICAL
      (Auto-Run)               (Freeze Execution Loop)
                                        │
                                        ▼
                            🚨 Human Approval Gate
                            (Web Dashboard / CLI)
                                        │
                             ┌──────────┴──────────┐
                             ▼                     ▼
                        [APPROVE]              [REJECT]
                             │
                             ▼
                    Physical File Patch &
                     Git Commit on Disk
                             │
                             ▼
                 Post-Deploy Health Check
                 (Auto-Rollback if Degraded)
```

---

## 🚦 Dual-Track Architecture

ForgeOps is built to showcase both enterprise daemon integration and 100% reliable local demo execution:

* **Track B (TrueForge Daemon SDK Integration):**  
  Uses `@truefoundry/trueforge-sdk` to programmatically register model providers (`client.settings.modelProviders.createOrUpdate`), agents (`client.agents.create`), and native sessions (`client.sessions.create`) against the TrueForge daemon listening on `http://localhost:8790`.
* **Track A (Guaranteed Local Engine):**  
  Uses local orchestration contracts with **Google GenAI (`@google/genai`) Gemini 2.5 Flash** to guarantee a 100% reliable live presentation.

---

## 🧪 Qodo Code Review Evidence

> **Hackathon Submission Trail:**

- **PR #1:** Core Provider Abstraction & Incident Contract ([Merged](#))
- **PR #2:** Policy Engine & Human Approval Gate Integration ([Merged](#))
- **PR #3:** Glassmorphic Command Center Dashboard ([Merged](#))

---

## 🚀 Quickstart

### Prerequisites
* Node.js v18+
* TrueForge CLI (`npx @truefoundry/trueforge --port 8790`)

### 1. Installation
```bash
git clone https://github.com/your-username/trueforge.git
cd trueforge
npm install
```

### 2. Run in Web Dashboard Mode (Preferred)
```bash
# Terminal 1: Backend Control Plane (Port 4000)
npm run server

# Terminal 2: Next.js Command Center (Port 3000)
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 3. Run in CLI Terminal Mode
```bash
npm run agent:cli
```
