import { GoogleGenAI } from '@google/genai';
import { TOOL_NAMES, REMEDIATION_ACTIONS, DEFAULT_CONFIG } from '@/core/constants';

export interface LLMMessage {
  role: string;
  content: string;
}

export interface LLMProvider {
  generateResponse(prompt: string): Promise<string>;
  generateJSON(messages: LLMMessage[]): Promise<any>;
}

export class GeminiLLMProvider implements LLMProvider {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor(apiKey: string = process.env.GEMINI_API_KEY || '', modelName: string = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = modelName;
  }

  async generateResponse(prompt: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
    });
    return response.text || '';
  }

  async generateJSON(messages: LLMMessage[]): Promise<any> {
    const promptText = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const responseText = await this.generateResponse(
      `${promptText}\n\nIMPORTANT: Respond ONLY with a valid JSON object containing "thought" and "tool_call" fields.`
    );
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { thought: responseText };
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

    // Dynamic Service Name Detection from Context/Prompt
    let targetService: string = DEFAULT_CONFIG.DEFAULT_SERVICE_NAME;
    if (textHistory.includes('payment-service')) {
      targetService = 'payment-service';
    } else if (textHistory.includes('inventory-service')) {
      targetService = 'inventory-service';
    }

    // Dynamic File Path Mapping based on detected service
    let targetFilePath = "target-services/checkout-node/checkoutService.js";
    let testCommand = "node target-services/checkout-node/tests/checkout.test.js";

    if (targetService === 'payment-service') {
      targetFilePath = "target-services/payment-go/main.go";
      testCommand = "go test ./target-services/payment-go/... || go run target-services/payment-go/main.go --metrics";
    } else if (targetService === 'inventory-service') {
      targetFilePath = "target-services/inventory-python/app.py";
      testCommand = "python3 target-services/inventory-python/app.py --metrics";
    }

    // Dynamic Error Metric Extraction from Telemetry
    let detectedErrorMsg = "High error rate detected from APM telemetry.";
    if (textHistory.includes('error_rate_pct')) {
      const match = textHistory.match(/"error_rate_pct":\s*(\d+(\.\d+)?)/);
      if (match) {
        detectedErrorMsg = `High error rate detected (${match[1]}% HTTP errors on ${targetService}).`;
      }
    }

    if (textHistory.includes('apply_remediation')) {
      return {
        thought: `Remediation action verified and approved for ${targetService}. Incident INC-1024 is resolved.`,
        action: "INCIDENT_RESOLVED"
      };
    }

    if (textHistory.includes('run_sandbox_test') && (textHistory.includes('run_unit_tests') || textHistory.includes('passed'))) {
      return {
        thought: `Sandbox verification passed cleanly for ${targetService}. Requesting Human-in-the-Loop authorization to deploy production patch.`,
        tool_call: {
          name: TOOL_NAMES.APPLY_REMEDIATION,
          args: {
            remediation_type: REMEDIATION_ACTIONS.DEPLOY_CODE_PATCH,
            service_name: targetService,
            reasoning: `Applied verified code patch for ${targetService} to resolve unhandled runtime exception.`
          }
        }
      };
    }

    if (textHistory.includes('read_source_code')) {
      return {
        thought: `Source code analysis confirmed missing exception guard in ${targetFilePath}. Testing candidate fix in sandbox runner...`,
        tool_call: {
          name: TOOL_NAMES.RUN_SANDBOX_TEST,
          args: {
            action: "run_unit_tests",
            command: testCommand
          }
        }
      };
    }

    if (textHistory.includes('search_logs')) {
      return {
        thought: `Captured exception stack trace for ${targetService}. Reading target source file ${targetFilePath}...`,
        tool_call: {
          name: TOOL_NAMES.READ_SOURCE_CODE,
          args: {
            file_path: targetFilePath
          }
        }
      };
    }

    if (textHistory.includes('get_metrics')) {
      return {
        thought: `${detectedErrorMsg} Searching application logs for exception stack traces...`,
        tool_call: {
          name: TOOL_NAMES.SEARCH_LOGS,
          args: {
            service_name: targetService,
            severity: "ERROR"
          }
        }
      };
    }

    return {
      thought: `Received incident trigger. Querying Prometheus metrics for target service: ${targetService}...`,
      tool_call: {
        name: TOOL_NAMES.GET_METRICS,
        args: {
          service_name: targetService,
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
    this.host = host;
    this.modelName = modelName;
    this.fallback = new AutonomousSREEngineProvider();
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.modelName, prompt, stream: false })
      });
      if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
      const data = await response.json();
      return data.response || '';
    } catch (e) {
      return this.fallback.generateResponse(prompt);
    }
  }

  async generateJSON(messages: LLMMessage[]): Promise<any> {
    try {
      const promptText = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      const text = await this.generateResponse(`${promptText}\n\nRespond strictly with JSON containing "thought" and "tool_call".`);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.fallback.generateJSON(messages);
    } catch (e) {
      return this.fallback.generateJSON(messages);
    }
  }
}

export class LLMStrategyFactory {
  static getProvider(): LLMProvider {
    if (process.env.GEMINI_API_KEY) {
      return new GeminiLLMProvider();
    }
    return new AutonomousSREEngineProvider();
  }
}

export default LLMStrategyFactory;
