import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('super_admin', 'admin', 'director')
  @Get()
  findAll(@CurrentUser() user: { sub: string; role?: string; companyId?: string }) {
    return this.usersService.findAll(user);
  }

  @Roles('super_admin', 'admin', 'director')
  @Post()
  create(@CurrentUser() user: { sub: string; role?: string; companyId?: string }, @Body() body: CreateUserDto) {
    return this.usersService.create(user, body);
  }

  @Roles('super_admin', 'admin', 'director')
  @Patch(':id')
  update(@CurrentUser() user: { sub: string; role?: string; companyId?: string }, @Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(user, id, body);
  }
}
