import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AiService } from "./ai.service";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { Request } from "express";

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string };
}

@ApiTags("Support AI")
@ApiBearerAuth()
@Controller("v1/ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("debug")
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: "AI-powered analysis of merchant API integration logs",
    description:
      "Fetches the last 5 API request logs for the authenticated merchant " +
      "and uses an LLM to diagnose integration errors in real-time.",
  })
  async debugMerchantIntegration(
    @Body() body: { query: string },
    @Req() req: AuthenticatedRequest,
  ) {
    if (!body.query?.trim()) {
      throw new BadRequestException("query must be a non-empty string.");
    }

    return this.aiService.analyzeMerchantLogs(
      req.user.userId,
      body.query.trim(),
    );
  }
}
