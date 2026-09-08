import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { UpdateAutoReportSettingsDto } from './dto/auto-report-settings.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.userId);
  }

  @Patch('me/auto-report')
  updateAutoReport(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateAutoReportSettingsDto,
  ) {
    return this.usersService.updateAutoReportSettings(user.userId, dto);
  }
}
