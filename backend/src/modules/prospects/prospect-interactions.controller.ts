import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ProspectInteractionsService } from './prospect-interactions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('prospect-interactions')
export class ProspectInteractionsController {
  constructor(private readonly service: ProspectInteractionsService) {}

  @Get()
  list(@CurrentUser() user: { companyId?: string }, @Query('prospect_id') prospectId?: string) {
    const companyId = user.companyId ?? '';
    if (!prospectId) return [];
    return this.service.listByProspect(prospectId, companyId);
  }

  @Post()
  create(@CurrentUser() user: { sub: string; companyId?: string }, @Body() body: Record<string, unknown>) {
    const companyId = user.companyId ?? '';
    const prospectId = String(body.prospect_id ?? '');
    return this.service.create(prospectId, companyId, user.sub, body);
  }
}
