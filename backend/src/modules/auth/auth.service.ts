import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse, AuthUserPayload, CompanyAccessStatus } from './interfaces/auth-response.interface';
import * as bcrypt from 'bcrypt';
import { Profile } from '@prisma/client';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private toUserPayload(profile: Profile): AuthUserPayload {
    return {
      id: profile.id,
      email: profile.email ?? '',
      firstName: profile.first_name,
      lastName: profile.last_name,
      role: profile.role,
      companyId: profile.company_id,
    };
  }

  private computeAccessStatus(company: { is_active: boolean; trial_started_at?: Date | null; trial_ends_at?: Date | null; subscription_expires_at?: Date | null; }): CompanyAccessStatus {
    const now = new Date();
    const trialValid = !!company.trial_ends_at && company.trial_ends_at > now;
    const subscriptionValid = !!company.subscription_expires_at && company.subscription_expires_at > now;
    const hasAnyPlanWindow = Boolean(company.trial_ends_at || company.subscription_expires_at);
    const effectiveActive = company.is_active && (trialValid || subscriptionValid);

    return {
      is_active: effectiveActive,
      trial_started_at: company.trial_started_at ?? null,
      trial_ends_at: company.trial_ends_at ?? null,
      subscription_expires_at: company.subscription_expires_at ?? null,
      access_reason: !company.is_active
        ? 'expired'
        : subscriptionValid
          ? 'subscription'
          : trialValid
            ? 'trial'
            : !hasAnyPlanWindow
              ? 'expired'
              : 'expired',
    };
  }

  private getFrontendUrl() {
    return process.env.FRONTEND_URL?.replace(/\/$/, '') ?? 'http://localhost:5173';
  }

  private async sendWelcomeEmail(profile: Profile) {
    const loginUrl = `${this.getFrontendUrl()}/login`;
    await this.emailService.sendMail({
      to: profile.email ?? '',
      subject: 'Bienvenue sur ASSURLINK',
      html: `<p>Bonjour ${profile.first_name ?? ''},</p>
<p>Votre compte ASSURLINK a bien été créé.</p>
<p>Vous pouvez vous connecter avec votre adresse email.</p>
<p><a href="${loginUrl}">Accéder à ASSURLINK</a></p>`,
    });
  }

  private async sendPasswordResetEmail(profile: Profile, token: string) {
    const resetLink = `${this.getFrontendUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    await this.emailService.sendMail({
      to: profile.email ?? '',
      subject: 'Réinitialisation de votre mot de passe ASSURLINK',
      html: `<p>Bonjour ${profile.first_name ?? ''},</p>
<p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte ASSURLINK.</p>
<p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
<p><a href="${resetLink}">${resetLink}</a></p>
<p>Ce lien expire dans 1 heure.</p>`,
    });
  }

  async activateTrialForUser(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    if (!profile.company_id) {
      throw new UnauthorizedException('Aucune compagnie associee');
    }

    const startedAt = new Date();
    const endsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    return this.prisma.company.update({
      where: { id: profile.company_id },
      data: {
        is_active: true,
        subscription_plan: 'trial',
        trial_started_at: startedAt,
        trial_ends_at: endsAt,
        subscription_expires_at: null,
      },
    });
  }

  private async signTokens(profile: Profile): Promise<AuthResponse> {
    const payload = {
      sub: profile.id,
      email: profile.email ?? '',
      role: profile.role,
      companyId: profile.company_id,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET ?? 'dev-secret',
      expiresIn: '1h',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
      expiresIn: '7d',
    });

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { refresh_token_hash: await bcrypt.hash(refreshToken, 10) },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toUserPayload(profile),
    };
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.profile.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        email: dto.email,
        country: 'Bénin',
        currency: 'XOF',
        trial_started_at: new Date(),
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const profile = await this.prisma.profile.create({
      data: {
        email: dto.email,
        password_hash: passwordHash,
        first_name: dto.firstName,
        last_name: dto.lastName,
        phone: dto.phone,
        role: 'admin',
        company_id: company.id,
        is_active: true,
      },
    });

    this.sendWelcomeEmail(profile).catch(() => undefined);

    return this.signTokens(profile);
  }

  async forgotPassword(email: string) {
    const profile = await this.prisma.profile.findUnique({ where: { email } });
    if (!profile || !profile.email) {
      return { success: true };
    }

    const token = await this.jwtService.signAsync(
      { sub: profile.id, purpose: 'reset-password' },
      { secret: process.env.JWT_RESET_SECRET ?? 'dev-reset-secret', expiresIn: '1h' },
    );

    await this.sendPasswordResetEmail(profile, token).catch(() => undefined);
    return { success: true };
  }

  async resetPassword(dto: { token: string; password: string }) {
    let payload: { sub: string; purpose?: string };

    try {
      payload = await this.jwtService.verifyAsync<{ sub: string; purpose?: string }>(dto.token, {
        secret: process.env.JWT_RESET_SECRET ?? 'dev-reset-secret',
      });
    } catch {
      throw new UnauthorizedException('Token de réinitialisation invalide ou expiré');
    }

    if (payload.purpose !== 'reset-password') {
      throw new UnauthorizedException('Token de réinitialisation invalide');
    }

    const profile = await this.prisma.profile.findUnique({ where: { id: payload.sub } });
    if (!profile) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.profile.update({
      where: { id: profile.id },
      data: {
        password_hash: passwordHash,
        refresh_token_hash: null,
      },
    });

    return { success: true };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const profile = await this.prisma.profile.findUnique({ where: { email: dto.email } });
    if (!profile || !profile.password_hash) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isValid = await bcrypt.compare(dto.password, profile.password_hash);
    if (!isValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    return this.signTokens(profile);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    try {
      const decoded = await this.jwtService.verifyAsync<{ sub: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
      });

      const profile = await this.prisma.profile.findUnique({ where: { id: decoded.sub } });
      if (!profile || !profile.refresh_token_hash) {
        throw new UnauthorizedException('Refresh token invalide');
      }

      const matches = await bcrypt.compare(refreshToken, profile.refresh_token_hash);
      if (!matches) {
        throw new UnauthorizedException('Refresh token invalide');
      }

      return this.signTokens(profile);
    } catch {
      throw new UnauthorizedException('Refresh token invalide');
    }
  }

  async me(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!profile) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return {
      user: this.toUserPayload(profile),
      company: profile.company ? { ...profile.company, ...this.computeAccessStatus(profile.company) } : null,
    };
  }
}
