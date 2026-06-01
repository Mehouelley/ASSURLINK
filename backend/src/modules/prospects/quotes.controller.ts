import { Controller, Get, Post, Body, Query, Param, UseGuards, Patch, Delete } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly service: QuotesService) {}

  @Get()
  list(@CurrentUser() user: { companyId?: string }, @Query('prospect_id') prospectId?: string) {
    if (!prospectId) return [];
    const companyId = user.companyId ?? '';
    return this.service.listByProspect(prospectId, companyId);
  }

  @Post()
  create(@CurrentUser() user: { sub: string; companyId?: string }, @Body() body: Record<string, unknown>) {
    const companyId = user.companyId ?? '';
    const prospectId = String(body.prospect_id ?? '');
    return this.service.create(prospectId, companyId, user.sub, body);
  }

  // optional: get, update, delete can be added later
}
