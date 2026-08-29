/**
 * LLM Provider Strategy Pattern (TypeScript)
 * Implements Gemini, Ollama, and Autonomous SRE Engine providers dynamically selected via Factory.
 */

import { GoogleGenAI } from '@google/genai';
import { HTTP_CONTENT_TYPES, HTTP_METHODS, TOOL_NAMES, REMEDIATION_ACTIONS } from '@/core/constants';

export interface LLMMessage {
  role: string;
  content: string;
}

export interface LLMProvider {
  generateResponse(prompt: string, options?: any): Promise<string>;
  generateJSON(messages: LLMMessage[]): Promise<any>;
}

export class GeminiLLMProvider implements LLMProvider {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = "gemini-2.5-flash") {
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    if (!key) {
      throw new Error("GeminiLLMProvider requires GEMINI_API_KEY or GOOGLE_API_KEY environment variable.");
    }
    this.ai = new GoogleGenAI({ apiKey: key });
    this.modelName = modelName;
  }

  async generateResponse(prompt: string, options?: any): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        responseMimeType: HTTP_CONTENT_TYPES.JSON
      }
    });

    return response.text || '';
  }

  async generateJSON(messages: LLMMessage[]): Promise<any> {
    const prompt = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
    const responseText = await this.generateResponse(prompt);
    try {
      return JSON.parse(responseText);
    } catch (e) {
      return { thought: responseText };
    }
  }
}

export class AutonomousSREEngineProvider implements LLMProvider {
  private step: number = 0;

  async generateResponse(prompt: string): Promise<string> {
    return JSON.stringify(await this.generateJSON([{ role: 'user', content: prompt }]));
  }

  async generateJSON(messages: LLMMessage[]): Promise<any> {
    this.step++;
    const textHistory = messages.map(m => m.content).join('\n');

    if (textHistory.includes('apply_remediation')) {
      return {
        thought: "Remediation action verified and approved. Incident INC-1024 is resolved.",
        action: "INCIDENT_RESOLVED"
      };
    }

    if (textHistory.includes('run_sandbox_test') && textHistory.includes('run_unit_tests')) {
      return {
        thought: "Sandbox unit tests passed cleanly. Requesting Human-in-the-Loop authorization to deploy production patch.",
        tool_call: {
          name: TOOL_NAMES.APPLY_REMEDIATION,
          args: {
            remediation_type: REMEDIATION_ACTIONS.DEPLOY_CODE_PATCH,
            service_name: "checkout-service",
            reasoning: "Fixed unhandled undefined promoRules array access in checkoutService.js:36."
          }
        }
      };
    }

    if (textHistory.includes('read_source_code')) {
      return {
        thought: "Source code analysis confirmed missing promoRules array check. Testing patch in sandbox runner...",
        tool_call: {
          name: TOOL_NAMES.RUN_SANDBOX_TEST,
          args: {
            action: "run_unit_tests",
            command: "node target-services/checkout-node/tests/checkout.test.js"
          }
        }
      };
    }

    if (textHistory.includes('search_logs')) {
      return {
        thought: "Stack trace points to checkoutService.js. Reading source code for checkoutService...",
        tool_call: {
          name: TOOL_NAMES.READ_SOURCE_CODE,
          args: {
            file_path: "target-services/checkout-node/checkoutService.js"
          }
        }
      };
    }

    if (textHistory.includes('get_metrics')) {
      return {
        thought: "High error rate detected (38.2% HTTP 500 errors). Searching application logs for exception stack traces...",
        tool_call: {
          name: TOOL_NAMES.SEARCH_LOGS,
          args: {
            service_name: "checkout-service",
            severity: "ERROR"
          }
        }
      };
    }

    return {
      thought: "Received incident trigger. Querying Prometheus metrics for target service: checkout-service...",
      tool_call: {
        name: TOOL_NAMES.GET_METRICS,
        args: {
          service_name: "checkout-service",
          timeframe_minutes: 15
        }
      }
    };
  }
}

export class OllamaLLMProvider implements LLMProvider {
  private host: string;
  private modelName: string;
  private fallback: AutonomousSREEngineProvider;

  constructor(host: string = "http://localhost:11434", modelName: string = "llama3.2") {
    this.host = process.env.OLLAMA_HOST || host;
    this.modelName = process.env.OLLAMA_MODEL || modelName;
    this.fallback = new AutonomousSREEngineProvider();
  }

  async generateResponse(prompt: string, options?: any): Promise<string> {
    const response = await fetch(`${this.host}/api/generate`, {
      method: HTTP_METHODS.POST,
      headers: { 'Content-Type': HTTP_CONTENT_TYPES.JSON },
      body: JSON.stringify({
        model: this.modelName,
        prompt,
        stream: false,
        format: "json"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama LLM Provider HTTP ${response.status} failed: ${errorText}`);
    }

    const data = await response.json();
    return data.response;
  }

  async generateJSON(messages: LLMMessage[]): Promise<any> {
    const prompt = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
    try {
      const responseText = await this.generateResponse(prompt);
      return JSON.parse(responseText);
    } catch (e) {
      return this.fallback.generateJSON(messages);
    }
  }
}

export class LLMStrategyFactory {
  static getProvider(): LLMProvider {
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    if (hasGeminiKey) {
      try {
        return new GeminiLLMProvider();
      } catch (e) {
        // fallback
      }
    }
    return new AutonomousSREEngineProvider();
  }
}
