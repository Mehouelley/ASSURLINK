import { Controller, Get, UseGuards } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  findAll(@CurrentUser() user: { companyId?: string | null; role: string }) {
    return this.agentsService.findAll(user);
  }
}
