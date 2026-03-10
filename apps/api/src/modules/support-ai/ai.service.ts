import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiRequestLog } from "@prisma/client";

// ── Provider URLs ────────────────────────────────────────────────────
const GROQ_URL       = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ── Timeouts ─────────────────────────────────────────────────────────
const PRIMARY_TIMEOUT_MS   = 10_000;  // Groq   — fail fast
const SECONDARY_TIMEOUT_MS = 30_000;  // OpenRouter — more lenient

const FALLBACK_ANSWER =
  "Support AI is currently busy. Please try again in a few minutes or contact support@scriptspay.dev.";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly groqApiKey: string;
  private readonly groqModel: string;
  private readonly openRouterApiKey: string;
  private readonly openRouterModel: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.groqApiKey       = this.config.get<string>("GROQ_API_KEY", "");
    this.groqModel        = this.config.get<string>("GROQ_MODEL", "openai/gpt-oss-20b");
    this.openRouterApiKey = this.config.get<string>("OPENROUTER_API_KEY", "");
    this.openRouterModel  = this.config.get<string>("OPENROUTER_MODEL", "openai/gpt-oss-20b:free");
  }

  /**
   * Context-Aware AI Debugger — analyzes a merchant's recent API request
   * logs and answers their integration support query.
   *
   * Provider waterfall:
   *   1. Groq       (primary  — 10 s timeout, env: GROQ_MODEL)
   *   2. OpenRouter (backup   — 30 s timeout, env: OPENROUTER_MODEL)
   *   3. Friendly message returned if both fail / time out.
   */
  async analyzeMerchantLogs(
    merchantId: string,
    userQuery: string,
  ): Promise<{ answer: string }> {
    // ── STEP 1: Context Retrieval ────────────────────────────────────
    const logs = await this.prisma.apiRequestLog.findMany({
      where:   { merchantId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // ── STEP 2: Context Formatting ───────────────────────────────────
    const formattedLogs = this.formatLogs(logs);
    const systemPrompt  = this.buildSystemPrompt(formattedLogs);

    // ── STEP 3: Primary — Groq ───────────────────────────────────────
    try {
      const answer = await this.callProvider(
        GROQ_URL,
        this.groqApiKey,
        this.groqModel,
        systemPrompt,
        userQuery,
        PRIMARY_TIMEOUT_MS,
        "Groq",
      );
      this.logger.log(
        `[Groq] AI analysis ok — merchant=${merchantId} logs=${logs.length}`,
      );
      return { answer };
    } catch (err) {
      this.logger.warn(
        `[Groq] Primary failed: ${err instanceof Error ? err.message : err} — trying OpenRouter`,
      );
    }

    // ── STEP 4: Backup — OpenRouter ──────────────────────────────────
    try {
      const answer = await this.callProvider(
        OPENROUTER_URL,
        this.openRouterApiKey,
        this.openRouterModel,
        systemPrompt,
        userQuery,
        SECONDARY_TIMEOUT_MS,
        "OpenRouter",
        {
          "HTTP-Referer": "https://scriptspay.dev",
          "X-Title":      "Scripts Pay AI Debugger",
        },
      );
      this.logger.log(
        `[OpenRouter] Backup AI analysis ok — merchant=${merchantId} logs=${logs.length}`,
      );
      return { answer };
    } catch (err) {
      this.logger.error(
        `[OpenRouter] Backup also failed: ${err instanceof Error ? err.message : err}`,
      );
    }

    // ── STEP 5: Both providers unavailable ───────────────────────────
    return { answer: FALLBACK_ANSWER };
  }

  // ════════════════════════════════════════════════════════════════════
  // PRIVATE — Shared LLM Caller (OpenAI-compatible)
  // ════════════════════════════════════════════════════════════════════

  /**
   * Generic OpenAI-compatible chat completion call.
   * Throws on missing key, timeout, non-2xx, or empty content so the
   * caller can fall through to the next provider.
   */
  private async callProvider(
    url: string,
    apiKey: string,
    model: string,
    systemPrompt: string,
    userQuery: string,
    timeoutMs: number,
    providerLabel: string,
    extraHeaders: Record<string, string> = {},
  ): Promise<string> {
    if (!apiKey) {
      throw new Error(`${providerLabel} API key is not configured`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${apiKey}`,
          ...extraHeaders,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: userQuery },
          ],
          max_tokens:  1024,
          temperature: 0.3,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("Empty content in response");
      }

      return content;
    } finally {
      clearTimeout(timer);
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // PRIVATE — Log Formatter
  // ════════════════════════════════════════════════════════════════════

  private formatLogs(logs: ApiRequestLog[]): string {
    if (logs.length === 0) {
      return "No recent API request logs found for this merchant.";
    }

    return logs
      .map((log, i) => {
        const ts = log.createdAt.toISOString();
        const error = log.errorMessage ? ` - Error: ${log.errorMessage}` : "";
        const reqBody = log.requestBody
          ? `\n     Request:  ${JSON.stringify(log.requestBody).slice(0, 300)}`
          : "";
        const resBody = log.responseBody
          ? `\n     Response: ${JSON.stringify(log.responseBody).slice(0, 300)}`
          : "";

        return (
          `  ${i + 1}. [${ts}] ${log.method} ${log.endpoint} — HTTP ${log.statusCode}${error}` +
          reqBody +
          resBody
        );
      })
      .join("\n");
  }

  // ════════════════════════════════════════════════════════════════════
  // PRIVATE — System Prompt Builder
  // ════════════════════════════════════════════════════════════════════

  private buildSystemPrompt(formattedLogs: string): string {
    return [
      "You are an expert technical support engineer for Scripts Pay, an enterprise payment gateway sandbox.",
      "You have deep knowledge of payment processing, REST APIs, HMAC-SHA256 webhook verification, idempotency keys, and common developer integration mistakes.",
      "",
      "Your task:",
      "1. Analyze the merchant's recent API request logs provided below.",
      "2. Identify the root cause of any errors (HTTP 4xx/5xx, missing headers, malformed payloads, HMAC failures, etc.).",
      "3. Provide a clear, actionable fix with code examples where helpful.",
      "4. If no errors are visible, answer the merchant's question using your payment gateway expertise.",
      "5. Be concise but thorough. Use markdown formatting for readability.",
      "",
      "<LogsContext>",
      formattedLogs,
      "</LogsContext>",
    ].join("\n");
  }
}
