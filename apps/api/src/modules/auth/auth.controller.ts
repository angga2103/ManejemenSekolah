import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginRequestDto,
  RefreshTokenRequestDto,
  SwitchRoleRequestDto,
} from '@edusaas/api-contracts';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login with identifier and password' })
  @SwaggerResponse({ status: 200, description: 'Authentication successful' })
  async login(@Body() dto: LoginRequestDto, @Req() req: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];
    const tenantId = req.headers['x-tenant-id'];
    return this.authService.validateAndLogin(dto, tenantId, ipAddress, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token' })
  @SwaggerResponse({ status: 200, description: 'Token refreshed successfully' })
  async refresh(@Body() dto: RefreshTokenRequestDto, @Req() req: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];
    return this.authService.refreshToken(dto, ipAddress, userAgent);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile, active role, and permissions' })
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('switch-role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch active role for multi-role account' })
  async switchRole(
    @CurrentUser() user: any,
    @Body() dto: SwitchRoleRequestDto,
  ) {
    return this.authService.switchRole(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(
    @CurrentUser() user: any,
    @Body() body?: { refreshToken?: string },
  ) {
    return this.authService.logout(user.id, body?.refreshToken);
  }
}
