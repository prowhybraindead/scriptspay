import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { WebhookService } from "./webhook.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string };
}

@ApiTags("Webhooks")
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller("v1/webhooks")
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get("endpoints")
  @ApiOperation({ summary: "List merchant webhook endpoints" })
  getEndpoints(@Req() req: AuthenticatedRequest) {
    return this.webhookService.listEndpoints(req.user.userId, req.user.email);
  }

  @Post("endpoints")
  @ApiOperation({ summary: "Create a merchant webhook endpoint" })
  createEndpoint(
    @Req() req: AuthenticatedRequest,
    @Body() body: { url: string },
  ) {
    return this.webhookService.createEndpoint(
      req.user.userId,
      req.user.email,
      body.url,
    );
  }

  @Delete("endpoints/:id")
  @ApiOperation({ summary: "Delete a merchant webhook endpoint" })
  deleteEndpoint(
    @Req() req: AuthenticatedRequest,
    @Param("id") endpointId: string,
  ) {
    return this.webhookService.deleteEndpoint(
      req.user.userId,
      req.user.email,
      endpointId,
    );
  }
}