import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateDocumentDto } from './dto/create-document.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'agent', 'expert')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  findAll(@CurrentUser() user: { companyId?: string | null; role: string }) {
    return this.documentsService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: { companyId?: string | null; sub: string }, @Body() body: CreateDocumentDto) {
    return this.documentsService.create(user, body);
  }
}
