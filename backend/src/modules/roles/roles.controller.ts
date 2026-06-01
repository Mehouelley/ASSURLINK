import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  list(@CurrentUser() user: { companyId?: string }, @Query('company_id') companyId?: string) {
    const cid = companyId ?? user.companyId ?? undefined;
    return this.rolesService.findAll(cid);
  }

  @Post()
  create(@CurrentUser() user: { companyId?: string }, @Body() body: { name: string; label?: string }) {
    const payload = { ...body, company_id: user.companyId ?? undefined } as any;
    return this.rolesService.create(payload);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() body: Partial<{ name: string; label?: string }>) {
    return this.rolesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
