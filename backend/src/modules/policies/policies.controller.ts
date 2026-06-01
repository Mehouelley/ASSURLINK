import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'agent')
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  findAll(@CurrentUser() user: { companyId?: string | null; role: string }) {
    return this.policiesService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: { companyId?: string | null; sub: string }, @Body() body: CreatePolicyDto) {
    return this.policiesService.create(user, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { companyId?: string | null; sub: string },
    @Param('id') id: string,
    @Body() body: UpdatePolicyDto,
  ) {
    return this.policiesService.update(user, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { companyId?: string | null; sub: string }, @Param('id') id: string) {
    return this.policiesService.remove(user, id);
  }
}
