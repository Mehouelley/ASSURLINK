import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'agent', 'expert')
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  findAll(@CurrentUser() user: { companyId?: string | null; role: string }) {
    return this.claimsService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: { companyId?: string | null; sub: string }, @Body() body: CreateClaimDto) {
    return this.claimsService.create(user, body);
  }

  @Patch(':id')
  update(@CurrentUser() user: { companyId?: string | null; sub: string }, @Param('id') id: string, @Body() body: UpdateClaimDto) {
    return this.claimsService.update(user, id, body);
  }

  @Post(':id/public-link')
  generatePublicLink(
    @CurrentUser() user: { companyId?: string | null; sub: string },
    @Param('id') id: string,
  ) {
    return this.claimsService.generatePublicLink(user, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { companyId?: string | null; sub: string }, @Param('id') id: string) {
    return this.claimsService.remove(user, id);
  }
}
