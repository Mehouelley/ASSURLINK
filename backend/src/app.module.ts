import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AgentsModule } from './modules/agents/agents.module';
import { ProspectsModule } from './modules/prospects/prospects.module';
import { PaymentWebhookModule } from './modules/payment-webhooks/payment-webhook.module';
import { RolesModule } from './modules/roles/roles.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    CompaniesModule,
    UsersModule,
    ClientsModule,
    PoliciesModule,
    ClaimsModule,
    PaymentsModule,
    DocumentsModule,
    NotificationsModule,
    AgentsModule,
    ProspectsModule,
    RolesModule,
    PaymentWebhookModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
