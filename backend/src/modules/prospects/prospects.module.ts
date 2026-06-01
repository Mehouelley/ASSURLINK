import { Module } from '@nestjs/common';
import { ProspectsService } from './prospects.service';
import { ProspectsController } from './prospects.controller';
import { ProspectInteractionsController } from './prospect-interactions.controller';
import { ProspectInteractionsService } from './prospect-interactions.service';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProspectsController, ProspectInteractionsController, QuotesController],
  providers: [ProspectsService, ProspectInteractionsService, QuotesService],
})
export class ProspectsModule {}
