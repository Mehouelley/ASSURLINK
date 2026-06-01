import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'agent')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@CurrentUser() user: { companyId?: string | null; role: string }) {
    return this.clientsService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: { companyId?: string | null; sub: string }, @Body() body: CreateClientDto) {
    return this.clientsService.create(user, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { companyId?: string | null; sub: string },
    @Param('id') id: string,
    @Body() body: UpdateClientDto,
  ) {
    return this.clientsService.update(user, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { companyId?: string | null; sub: string }, @Param('id') id: string) {
    return this.clientsService.remove(user, id);
  }
}
