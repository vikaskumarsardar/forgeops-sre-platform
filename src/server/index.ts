/**
 * Express Backend API Server with Live Event Streaming (SSE) (TypeScript)
 * Connects Web Dashboard UI to Autonomous TrueForge Agent Harness Engine
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import harness from './agent/harness';
import metricsService from '@/providers/local/metricsService';
import logService from '@/providers/local/logService';
import providerRegistry from '@/core/providerRegistry';
import { IncidentContract } from '@/core/incident';
import { 
  DEFAULT_CONFIG, 
  API_PATHS, 
  SEVERITIES, 
  HTTP_METHODS 
} from '@/core/constants';

const checkoutService = require('../../target-services/checkout-node/checkoutService');

const app = express();
const PORT = process.env.SERVER_PORT || DEFAULT_CONFIG.SERVER_PORT;

app.use(cors());
app.use(express.json());

// Real HTTP Logger Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    if (res.statusCode >= 400 && req.path !== API_PATHS.CHECKOUT) {
      logService.log({
        service: DEFAULT_CONFIG.DEFAULT_SERVICE_NAME,
        version: checkoutService.version,
        severity: SEVERITIES.ERROR,
        message: `HTTP ${res.statusCode} on ${req.method} ${req.path}`,
        path: req.path,
        method: req.method,
        request_id: `req-${Date.now().toString(36)}`
      });
    }
  });
  next();
});

let sseClients: Array<{ id: number; res: Response }> = [];

// Broadcast event to all connected UI clients via SSE
harness.onEvent((event: any) => {
  sseClients.forEach(client => {
    client.res.write(`data: ${JSON.stringify(event)}\n\n`);
  });
});

// SSE Live Stream Endpoint
app.get('/api/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  res.write(`data: ${JSON.stringify({ type: "CONNECTED", message: "Connected to ForgeOps SRE Event Stream", timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(client => client.id !== clientId);
  });
});

// Real Microservice API Endpoint
app.post(API_PATHS.CHECKOUT, (req: Request, res: Response) => {
  try {
    const orderResult = checkoutService.processCheckout(req.body);
    res.json(orderResult);
  } catch (err: any) {
    logService.log({
      service: DEFAULT_CONFIG.DEFAULT_SERVICE_NAME,
      version: checkoutService.version,
      severity: SEVERITIES.ERROR,
      message: err.message,
      stack_trace: err.stack,
      path: req.originalUrl || req.path,
      method: req.method,
      user_type: req.body?.userId ? "registered" : "guest"
    });
    res.status(500).json({ error: err.message });
  }
});

// Get real-time APM telemetry & Harness state
app.get('/api/status', (req: Request, res: Response) => {
  const metrics = metricsService.getMetrics(DEFAULT_CONFIG.DEFAULT_SERVICE_NAME);
  res.json({
    metrics,
    service_version: checkoutService.version,
    agent_state: harness.sessionState,
    pending_approval: harness.pendingApproval
  });
});

const triggerIncidentHandler = (req: Request, res: Response) => {
  const fs = require('fs');
  const path = require('path');
  const targetFile = path.resolve(process.cwd(), 'target-services/checkout-node/checkoutService.js');
  
  const brokenCode = `/**
 * Production Checkout Microservice (Target Microservice)
 */
const { execSync } = require('child_process');
const path = require('path');

class CheckoutService {
  constructor() {
    this.version = "1.0.4";
  }

  applyPromoRules(cart) {
    // Unhandled TypeError when promoRules is undefined
    const activeRule = cart.promoRules.find(r => r.active === true);
    return activeRule ? activeRule.discount : 0;
  }

  processCheckout(cart) {
    const { userId, items, discountCode } = cart;
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const promoExtra = this.applyPromoRules(cart);
    const total = subtotal - promoExtra;

    return {
      status: "SUCCESS",
      orderId: "ORD-" + Math.floor(Math.random() * 90000 + 10000),
      subtotal,
      total,
      currency: "USD",
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new CheckoutService();
`;

  try {
    fs.writeFileSync(targetFile, brokenCode, 'utf8');
    delete require.cache[require.resolve(targetFile)];
  } catch (err: any) {
    console.error("Failed to reset target service code:", err.message);
  }

  logService.clearLogs();

  const mockPayload = { items: [{ price: 49.99, quantity: 2 }] };
  try {
    checkoutService.processCheckout(mockPayload);
  } catch (err: any) {
    logService.log({
      service: DEFAULT_CONFIG.DEFAULT_SERVICE_NAME,
      version: checkoutService.version,
      severity: SEVERITIES.ERROR,
      message: err.message,
      stack_trace: err.stack,
      path: API_PATHS.CHECKOUT,
      method: HTTP_METHODS.POST,
      user_type: "guest"
    });
  }

  const incident = IncidentContract.createFromAlert({
    id: DEFAULT_CONFIG.DEFAULT_INCIDENT_ID,
    service: DEFAULT_CONFIG.DEFAULT_SERVICE_NAME,
    alert_name: "HighErrorRateAlert",
    description: "Checkout HTTP 500 error rate spiked to 38.2%",
    severity: SEVERITIES.CRITICAL,
    timestamp: new Date().toISOString()
  });

  // Launch harness session in background
  harness.startSession(incident).catch(err => {
    console.error("Harness background execution error:", err.message);
  });

  res.json({
    status: "INCIDENT_TRIGGERED",
    message: "Production incident INC-1024 triggered. Autonomous SRE Session started.",
    incident
  });
};

// Trigger incident / start session endpoints
app.post('/api/trigger-incident', triggerIncidentHandler);
app.post('/api/start-session', triggerIncidentHandler);

const approveHandler = async (req: Request, res: Response) => {
  const decision = req.body?.decision || req.body?.approvalDecision || 'APPROVE';
  const result = await harness.handleHumanApproval(decision);
  res.json(result);
};

// Human Approval Endpoints (HITL)
app.post('/api/approve-action', approveHandler);
app.post('/api/approve', approveHandler);

// Switch Infrastructure Mode (Local vs Prometheus / GitHub / K8s)
app.post('/api/provider-mode', (req: Request, res: Response) => {
  const { mode } = req.body;
  if (!mode) {
    return res.status(400).json({ error: "Missing 'mode' parameter ('local' or 'prometheus')." });
  }

  providerRegistry.setMode(mode);
  res.json({
    status: "SUCCESS",
    active_mode: providerRegistry.activeMode,
    message: `Switched active provider mode to '${mode}'`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ForgeOps Backend API Server running on http://localhost:${PORT}`);
});
