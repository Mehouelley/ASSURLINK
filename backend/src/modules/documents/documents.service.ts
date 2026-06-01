import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveCompanyId(user: { companyId?: string | null }) {
    if (!user.companyId) throw new UnauthorizedException('Company context manquant');
    return user.companyId;
  }

  findAll(user: { companyId?: string | null }) {
    const companyId = this.resolveCompanyId(user);
    return this.prisma.document.findMany({
      where: { company_id: companyId },
      include: { client: true, policy: true, claim: true },
      orderBy: { created_at: 'desc' },
    });
  }

  create(user: { companyId?: string | null; sub: string }, body: CreateDocumentDto) {
    const companyId = this.resolveCompanyId(user);
    return this.prisma.document.create({
      data: {
        company_id: companyId,
        uploaded_by: user.sub,
        name: body.name,
        document_type: body.document_type,
        file_url: body.file_url,
        client_id: body.client_id,
        policy_id: body.policy_id,
        claim_id: body.claim_id,
      },
    });
  }
}
