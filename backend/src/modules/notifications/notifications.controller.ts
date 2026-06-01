import { Body, Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'agent', 'expert', 'client')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: { companyId?: string | null; sub: string }) {
    return this.notificationsService.findAll(user);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: { companyId?: string | null; sub: string }, @Param('id') id: string) {
    return this.notificationsService.markRead(user, id);
  }
}
