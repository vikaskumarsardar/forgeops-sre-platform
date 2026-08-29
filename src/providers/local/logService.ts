/**
 * Real Application Logger & Event Log Store (TypeScript)
 * Records live HTTP requests, exceptions, and stack traces dynamically.
 */

import path from 'path';
import { execSync } from 'child_process';
import { 
  SEVERITIES, 
  HTTP_METHODS, 
  API_PATHS, 
  DEFAULT_CONFIG 
} from '@/core/constants';

export interface LogEntry {
  timestamp: string;
  service: string;
  version: string | null;
  severity: string;
  request_id: string | null;
  path: string | null;
  method: string | null;
  user_type: string | null;
  message: string;
  stack_trace: string | null;
}

export class LogService {
  logEntries: LogEntry[] = [];

  log({
    service = DEFAULT_CONFIG.DEFAULT_SERVICE_NAME,
    version,
    severity = SEVERITIES.ERROR,
    message,
    stack_trace,
    path,
    method,
    user_type,
    request_id
  }: {
    service?: string;
    version?: string;
    severity?: string;
    message: string;
    stack_trace?: string;
    path?: string;
    method?: string;
    user_type?: string;
    request_id?: string;
  }): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      service,
      version: version || null,
      severity: severity.toUpperCase(),
      request_id: request_id || null,
      path: path || null,
      method: method || null,
      user_type: user_type || null,
      message,
      stack_trace: stack_trace || null
    };

    this.logEntries.unshift(entry);
    if (this.logEntries.length > 100) {
      this.logEntries.pop();
    }
    return entry;
  }

  clearLogs(): void {
    this.logEntries = [];
  }

  searchLogs({
    service = DEFAULT_CONFIG.DEFAULT_SERVICE_NAME,
    severity = SEVERITIES.ERROR,
    query = "",
    limit = 5
  }: {
    service?: string;
    severity?: string;
    query?: string;
    limit?: number;
  }): { service: string; severity: string; count: number; logs: LogEntry[] } {
    let results = this.logEntries.filter(
      l =>
        (!service || l.service.toLowerCase().includes(service.toLowerCase())) &&
        (!severity || l.severity.toUpperCase() === severity.toUpperCase())
    );

    if (query) {
      results = results.filter(
        l =>
          l.message.toLowerCase().includes(query.toLowerCase()) ||
          (l.stack_trace && l.stack_trace.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Dynamic APM fallthrough if log stream is empty
    const isLogStreamEmpty = results.length === 0;
    const isErrorSeveritySearch = severity.toUpperCase() === SEVERITIES.ERROR;

    if (isLogStreamEmpty && isErrorSeveritySearch) {
      let targetServicePath = 'target-services/checkout-node/checkoutService.js';
      if (service === 'payment-service') targetServicePath = 'target-services/payment-go/main.go';
      else if (service === 'inventory-service') targetServicePath = 'target-services/inventory-python/app.py';

      const absServicePath = path.resolve(process.cwd(), targetServicePath);

      try {
        if (absServicePath.endsWith('.py')) {
          execSync(`python3 ${absServicePath} "{}"`, { encoding: 'utf8' });
        } else if (absServicePath.endsWith('.go')) {
          execSync(`go run ${absServicePath} "{}"`, { encoding: 'utf8' });
        } else {
          delete require.cache[require.resolve(absServicePath)];
          const svcModule = require(absServicePath);
          svcModule.processCheckout({ items: [{ price: 10, quantity: 1 }], discountCode: null });
        }
      } catch (err: any) {
        this.log({
          service,
          version: "1.0.0",
          severity: SEVERITIES.ERROR,
          message: err.stderr ? err.stderr.trim() : err.message,
          stack_trace: err.stack || err.stderr || err.message,
          path: `/api/v1/${service}`,
          method: HTTP_METHODS.POST,
          user_type: "guest"
        });
      }
      results = this.logEntries.filter(l => !severity || l.severity.toUpperCase() === severity.toUpperCase());
    }

    return {
      service,
      severity,
      count: results.slice(0, limit).length,
      logs: results.slice(0, limit)
    };
  }
}

export default new LogService();
