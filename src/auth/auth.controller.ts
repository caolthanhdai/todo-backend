import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UnauthorizedException, // http 401
} from '@nestjs/common'; // import necessary decorators
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto';
import type { Request, Response } from 'express'; // import type

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto);
    this.setRefreshTokenCookie(res, result.refreshToken);
    const { refreshToken, ...rest } = result;
    return rest;
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto);
    this.setRefreshTokenCookie(res, result.refreshToken);
    const { refreshToken, ...rest } = result;
    return rest;
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    // check cookie
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const result = await this.authService.refresh(refreshToken);
    if (!result) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }
    // set new cookie
    this.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    await this.authService.logout(refreshToken);
    // clear cookie
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  // set cookie.httpOnly for Refresh Token
  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // dev: false, prod (https): true
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/', // để /auth/refresh đọc được
    });
  }
}
