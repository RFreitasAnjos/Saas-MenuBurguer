import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId: null },
    });

    if (existing) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
        role: UserRole.CUSTOMER,
        tenantId: null,
      },
    });

    return this.generateAndSaveTokens(
      user.id,
      user.email,
      user.role,
      user.tenantId,
    );
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.generateAndSaveTokens(
      user.id,
      user.email,
      user.role,
      user.tenantId,
    );
  }

  async refreshTokens(user: AuthUser): Promise<AuthTokens> {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!dbUser || !dbUser.refreshToken) {
      throw new UnauthorizedException('Acesso negado.');
    }

    if (!user.refreshToken) {
      throw new UnauthorizedException('Acesso negado.');
    }

    const tokenMatches = await bcrypt.compare(
      user.refreshToken,
      dbUser.refreshToken,
    );

    if (!tokenMatches) {
      throw new UnauthorizedException('Acesso negado.');
    }

    return this.generateAndSaveTokens(
      dbUser.id,
      dbUser.email,
      dbUser.role,
      dbUser.tenantId,
    );
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async validateGoogleUser(googleUser: {
    googleId: string;
    email: string;
    name: string;
  }): Promise<AuthTokens> {
    let user = await this.prisma.user.findFirst({
      where: { googleId: googleUser.googleId },
    });

    if (!user) {
      const existingByEmail = await this.prisma.user.findFirst({
        where: { email: googleUser.email, tenantId: null },
      });

      if (existingByEmail) {
        user = await this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: { googleId: googleUser.googleId },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            name: googleUser.name,
            email: googleUser.email,
            googleId: googleUser.googleId,
            role: UserRole.CUSTOMER,
            tenantId: null,
          },
        });
      }
    }

    return this.generateAndSaveTokens(
      user.id,
      user.email,
      user.role,
      user.tenantId,
    );
  }

  private async generateAndSaveTokens(
    userId: string,
    email: string,
    role: UserRole,
    tenantId: string | null,
  ): Promise<AuthTokens> {
    const payload = { sub: userId, email, role, tenantId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    const hashedRefreshToken = await bcrypt.hash(
      refreshToken,
      this.SALT_ROUNDS,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });

    return { accessToken, refreshToken };
  }

  async validateAdminLogin(
    dto: LoginDto,
    tenantId: string,
  ): Promise<AuthTokens> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        tenantId,
        role: { in: [UserRole.ADMIN, UserRole.EMPLOYEE] },
        deletedAt: null,
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Painel admin restrito a administradores.');
    }

    return this.generateAndSaveTokens(
      user.id,
      user.email,
      user.role,
      user.tenantId,
    );
  }
}
