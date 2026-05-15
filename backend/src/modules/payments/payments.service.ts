import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentGateway, PaymentStatus, OrderStatus } from '@prisma/client';
import { InfinitepayWebhookDto } from './dto/webhook.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async initiateCheckout(orderId: string, tenantId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!order || order.tenantId !== tenantId) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        gateway: PaymentGateway.INFINITEPAY,
        status: PaymentStatus.PENDING,
        amount: order.total,
      },
    });

    // TODO: Integração real com InfinitePay Checkout API
    // Retorna o link de pagamento do gateway
    this.logger.log(`Payment initiated for order ${orderId}: ${payment.id}`);

    return {
      paymentId: payment.id,
      checkoutUrl: `https://checkout.infinitepay.io/pay/${payment.id}`, // placeholder
    };
  }

  async handleWebhook(dto: InfinitepayWebhookDto, signature: string) {
    const webhookSecret = this.configService.getOrThrow<string>(
      'INFINITEPAY_WEBHOOK_SECRET',
    );

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(dto))
      .digest('hex');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      )
    ) {
      throw new UnauthorizedException('Assinatura do webhook inválida.');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { orderId: dto.orderId },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) throw new NotFoundException('Pagamento não encontrado.');

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: dto.status,
        gatewayReference: dto.gatewayReference,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
      },
    });

    if (dto.status === PaymentStatus.PAID) {
      await this.prisma.order.update({
        where: { id: dto.orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.CONFIRMED,
        },
      });
    }

    this.logger.log(
      `Webhook processed: order=${dto.orderId} status=${dto.status}`,
    );

    return updatedPayment;
  }

  findByOrder(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
