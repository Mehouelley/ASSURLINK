import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ActivateTrialDto } from './dto/activate-trial.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateCompanyDto) {
    return this.companiesService.update(id, body);
  }

  @Post(':id/activate-trial')
  activateTrial(@Param('id') id: string, @Body() _body: ActivateTrialDto) {
    return this.companiesService.activateTrial(id);
  }
}
