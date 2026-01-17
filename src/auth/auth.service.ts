import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { isEmail } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  AuthResponseHaveRefreshTokenDto,
  AuthUserResponseDto,
} from './dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}
  async register(dto: RegisterDto): Promise<AuthResponseHaveRefreshTokenDto> {
    // check email
    const existed = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existed) {
      throw new BadRequestException('Email already exists');
    }

    // hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: passwordHash,
        name: dto.name,
      },
    });

    // auto login after registering
    // generate token
    const accessToken = await this.signAccessToken(user.userId, user.email);
    const refreshToken = await this.signRefreshToken(user.userId, user.email);
    // add refresh token to db
    await this.prisma.refreshToken.create({
      data: {
        userId: user.userId,
        token: refreshToken,
        expiresAt: this.getRefreshExpireDate(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toUserResponse(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseHaveRefreshTokenDto> {
    const isNotUser = isEmail(dto.identifier);
    // find user by email or name
    const user = await this.prisma.user.findFirst({
      where: isNotUser ? { email: dto.identifier } : { name: dto.identifier },
    });
    if (!user) {
      throw new UnauthorizedException('Email or name or password is incorrect');
    }
    // create Token
    const accessToken = await this.signAccessToken(user.userId, user.email);
    const refreshToken = await this.signRefreshToken(user.userId, user.email);
    // add refresh token to db
    await this.prisma.refreshToken.create({
      data: {
        userId: user.userId,
        token: refreshToken,
        expiresAt: this.getRefreshExpireDate(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toUserResponse(user),
    };
  }

  async refresh(
    refreshToken: string,
  ): Promise<AuthResponseHaveRefreshTokenDto | null> {
    // verify signature and expiration
    let payload: { sub: string; email: string } | null = null;
    try {
      payload = await this.jwt.verifyAsync<{ sub: string; email: string }>(
        refreshToken,
        {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch (e) {
      return null;
    }
    // check token in db
    const tokenInDb = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    if (!tokenInDb) return null;
    if (tokenInDb.isRevoked) return null;
    if (tokenInDb.expiresAt < new Date()) return null;
    // generate new tokens
    const newAccessToken = await this.signAccessToken(
      tokenInDb.user.userId,
      tokenInDb.user.email,
    );
    const newRefreshToken = await this.signRefreshToken(
      tokenInDb.user.userId,
      tokenInDb.user.email,
    );
    // revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
    // add new refresh token to db
    await this.prisma.refreshToken.create({
      data: {
        userId: tokenInDb.user.userId,
        token: newRefreshToken,
        expiresAt: this.getRefreshExpireDate(),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: this.toUserResponse(tokenInDb.user),
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
  }

  private async signAccessToken(
    userId: string,
    email: string,
  ): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );
  }

  private async signRefreshToken(
    userId: string,
    email: string,
  ): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '5d',
      },
    );
  }
  private toUserResponse(user: any): AuthUserResponseDto {
    return {
      userId: user.userId,
      email: user.email,
    };
  }
  private getRefreshExpireDate(): Date {
    const numOfAliveToken = this.config.get<number>('NUM_OF_ALIVE_TOKEN') || 7;
    const d = new Date();
    d.setDate(d.getDate() + numOfAliveToken);
    return d;
  }
}
