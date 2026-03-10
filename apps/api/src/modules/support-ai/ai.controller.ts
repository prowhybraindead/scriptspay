import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AiService } from "./ai.service";
import { SupabaseAuthGuard } from "../auth/auth.guard";

@ApiTags("Support AI")
@ApiBearerAuth()
@Controller("v1/support")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("merchants/:merchantId/analyze")
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: "AI-powered analysis of merchant API logs" })
  async analyzeMerchantLogs(
    @Param("merchantId") merchantId: string,
    @Body() body: { query: string },
  ) {
    return this.aiService.analyzeMerchantLogs(merchantId, body.query);
  }
}
