import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(
    @CurrentUser() user: AuthUser,
    @Query('workspaceOwnerId') workspaceOwnerId?: string,
  ) {
    return this.dashboardService.getSummary(
      user.userId,
      user.email,
      workspaceOwnerId,
    );
  }
}
