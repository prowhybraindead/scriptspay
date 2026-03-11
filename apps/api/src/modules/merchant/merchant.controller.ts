import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { MerchantService } from "./merchant.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string };
}

@ApiTags("Merchant Portal")
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller("v1/merchants")
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Get("overview")
  @ApiOperation({ summary: "Get merchant dashboard overview metrics" })
  getOverview(@Req() req: AuthenticatedRequest) {
    return this.merchantService.getOverview(req.user.userId, req.user.email);
  }

  @Get("balance")
  @ApiOperation({ summary: "Get merchant balances" })
  getBalance(@Req() req: AuthenticatedRequest) {
    return this.merchantService.getBalance(req.user.userId, req.user.email);
  }

  @Get("transactions")
  @ApiOperation({ summary: "Get recent merchant transactions" })
  getTransactions(@Req() req: AuthenticatedRequest) {
    return this.merchantService.getTransactions(req.user.userId, req.user.email);
  }

  @Get("keys")
  @ApiOperation({ summary: "Get current merchant API keys" })
  getKeys(@Req() req: AuthenticatedRequest) {
    return this.merchantService.getApiKeys(req.user.userId, req.user.email);
  }

  @Post("keys/roll")
  @ApiOperation({ summary: "Rotate merchant API keys" })
  rollKeys(@Req() req: AuthenticatedRequest) {
    return this.merchantService.rollApiKeys(req.user.userId, req.user.email);
  }

  @Get("profile")
  @ApiOperation({ summary: "Get merchant profile" })
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.merchantService.getProfile(req.user.userId, req.user.email);
  }

  @Patch("profile")
  @ApiOperation({ summary: "Update merchant profile" })
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      businessName?: string;
      taxId?: string | null;
      supportEmail?: string | null;
      statementDescriptor?: string | null;
      notificationMode?: string;
    },
  ) {
    return this.merchantService.updateProfile(
      req.user.userId,
      req.user.email,
      body,
    );
  }
}