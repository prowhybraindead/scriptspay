import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Uses the Context-Aware AI Chatbot to analyze a merchant's recent
   * API request logs and answer their support query.
   *
   * @param merchantId - The merchant UUID whose logs to fetch
   * @param userQuery  - The natural-language question from the merchant
   */
  async analyzeMerchantLogs(
    merchantId: string,
    userQuery: string,
  ): Promise<{ answer: string }> {
    // ──────────────────────────────────────────────────────────────────
    // AI CONTEXT-AWARE LOG ANALYSIS
    // ──────────────────────────────────────────────────────────────────
    // TODO:
    // 1. Fetch the last 5 ApiRequestLog entries for the merchant:
    //    const logs = await this.prisma.apiRequestLog.findMany({
    //      where: { merchantId },
    //      orderBy: { createdAt: 'desc' },
    //      take: 5,
    //    });
    //
    // 2. Format logs into a context string for the LLM prompt.
    //
    // 3. Call OpenRouter API (https://openrouter.ai/api/v1/chat/completions):
    //    - Model: meta-llama/llama-3-8b-instruct (or Mistral/Gemini)
    //    - System prompt: "You are a payment gateway support assistant.
    //      Analyze the merchant's recent API logs below and answer their question.
    //      If you see common errors (missing HMAC, invalid API key, etc.),
    //      provide a clear fix."
    //    - User message: Include the formatted logs + userQuery.
    //    - Auth: Bearer token from OPENROUTER_API_KEY env var.
    //
    // 4. Return the AI-generated answer.
    // ──────────────────────────────────────────────────────────────────

    this.logger.log(
      `analyzeMerchantLogs called: merchant=${merchantId} query="${userQuery}"`,
    );

    return { answer: "AI analysis placeholder" };
  }
}
