import { Module } from '@nestjs/common';
import { PaymentWebhookController } from './payment-webhook.controller';
import { PaymentWebhookService } from './payment-webhook.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PaymentWebhookController],
  providers: [PaymentWebhookService],
  exports: [PaymentWebhookService],
})
export class PaymentWebhookModule {}
