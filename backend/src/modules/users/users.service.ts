import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(currentUser: { role?: string; companyId?: string }) {
    const isSuperAdmin = currentUser.role === 'super_admin';
    return this.prisma.profile.findMany({
      ...(isSuperAdmin ? {} : { where: { company_id: currentUser.companyId ?? '' } }),
      include: { company: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(currentUser: { role?: string; companyId?: string }, body: CreateUserDto) {
    const existing = await this.prisma.profile.findUnique({ where: { email: body.email } });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const isSuperAdmin = currentUser.role === 'super_admin';
    const companyId = isSuperAdmin ? (body.company_id ?? currentUser.companyId ?? null) : (currentUser.companyId ?? null);

    const passwordHash = await bcrypt.hash(body.password, 10);
    const profile = await this.prisma.profile.create({
      data: {
        email: body.email,
        password_hash: passwordHash,
        first_name: body.first_name,
        last_name: body.last_name,
        phone: body.phone,
        role: body.role ?? 'client',
        company_id: companyId,
        is_active: true,
      },
      include: { company: true },
    });

    // If a commission_rate is provided and we have a company, create the Agent record
    if (body.commission_rate != null && companyId) {
      try {
        await this.prisma.agent.create({
          data: {
            profile_id: profile.id,
            company_id: companyId,
            commission_rate: Number(body.commission_rate),
            is_active: true,
          },
        });
      } catch (err) {
        // If agent creation fails, we don't want to leave the profile inconsistent.
        // For now, rethrow to let the controller handle it (transaction could be used later).
        throw err;
      }
    }

    return profile;
  }

  async update(currentUser: { sub: string; role?: string; companyId?: string }, id: string, body: UpdateUserDto) {
    const existing = await this.prisma.profile.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Utilisateur introuvable');

    const isSuperAdmin = currentUser.role === 'super_admin';
    if (!isSuperAdmin && existing.company_id !== currentUser.companyId) {
      throw new ForbiddenException('Accès refusé');
    }

    return this.prisma.profile.update({
      where: { id },
      data: {
        ...body,
        updated_at: new Date(),
      },
    });
  }
}
