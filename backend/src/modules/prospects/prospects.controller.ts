import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ProspectsService } from './prospects.service';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('prospects')
export class ProspectsController {
  constructor(private readonly prospectsService: ProspectsService) {}

  @Post()
  create(
    @CurrentUser() user: { sub: string; companyId?: string },
    @Body() createProspectDto: CreateProspectDto,
  ) {
    return this.prospectsService.create(user.companyId ?? '', user.sub, { ...createProspectDto });
  }

  @Get()
  findAll(@CurrentUser() user: { companyId?: string }, @Req() req: { query: { companyId?: string } }) {
    const companyId = user.companyId || req.query.companyId || '';
    return this.prospectsService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prospectsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProspectDto: UpdateProspectDto) {
    return this.prospectsService.update(id, { ...updateProspectDto });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prospectsService.remove(id);
  }
}
