import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId?: string) {
    return this.prisma.role.findMany(
      companyId ? { where: { company_id: companyId } } : undefined,
    );
  }

  async create(data: { name: string; label?: string; company_id?: string }) {
    return this.prisma.role.create({ data });
  }

  async findOne(id: string) {
    const r = await this.prisma.role.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Role not found');
    return r;
  }

  async update(id: string, data: Partial<{ name: string; label?: string }>) {
    await this.findOne(id);
    return this.prisma.role.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.role.delete({ where: { id } });
  }
}
