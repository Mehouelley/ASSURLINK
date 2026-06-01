import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { FedaPayService } from './services/fedapay.service';
import { MessagingService } from './services/messaging.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, FedaPayService, MessagingService],
})
export class PaymentsModule {}
