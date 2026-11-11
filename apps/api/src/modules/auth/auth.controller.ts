import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginRequestDto, RefreshTokenRequestDto } from '@edusaas/api-contracts';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login with identifier and password' })
  @SwaggerResponse({ status: 200, description: 'Authentication successful' })
  async login(@Body() dto: LoginRequestDto) {
    return this.authService.validateAndLogin(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token' })
  @SwaggerResponse({ status: 200, description: 'Token refreshed successfully' })
  async refresh(@Body() dto: RefreshTokenRequestDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }
}
