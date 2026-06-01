import { Module } from '@nestjs/common';
import { ClaimsController } from './claims.controller';
import { PublicClaimsController } from './public-claims.controller';
import { ClaimsService } from './claims.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClaimsController, PublicClaimsController],
  providers: [ClaimsService],
})
export class ClaimsModule {}
