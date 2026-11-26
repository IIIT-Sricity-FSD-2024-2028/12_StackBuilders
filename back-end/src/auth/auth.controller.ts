import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ChangeDemoPasswordDto } from './dto/change-demo-password.dto';
import { CompletePasswordResetDto } from './dto/complete-password-reset.dto';
import { DemoLoginDto } from './dto/demo-login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('demo-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a built-in demo account login' })
  demoLogin(@Body() dto: DemoLoginDto) {
    return this.authService.authenticateDemoAccount(dto.email, dto.password);
  }

  @Post('demo-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change a demo admin or supervisor password' })
  changeDemoPassword(@Body() dto: ChangeDemoPasswordDto) {
    return this.authService.changeDemoPassword(
      dto.email,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('password-recovery/request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send a password recovery code by email' })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('password-recovery/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a recovery code and set a new password' })
  resetPassword(@Body() dto: CompletePasswordResetDto) {
    return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
  }
}
