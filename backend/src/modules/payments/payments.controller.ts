import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InfinitepayWebhookDto } from './dto/webhook.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';

interface AuthUser {
  userId: string;
  role: UserRole;
  tenantId: string | null;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout/:orderId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Iniciar checkout para um pedido' })
  initiateCheckout(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentsService.initiateCheckout(orderId, user.tenantId!);
  }

  @Public()
  @Post('webhook/infinitepay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook InfinitePay (interno)' })
  handleWebhook(
    @Body() dto: InfinitepayWebhookDto,
    @Headers('x-infinitepay-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(dto, signature);
  }

  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  @ApiBearerAuth()
  findByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.findByOrder(orderId);
  }
}
