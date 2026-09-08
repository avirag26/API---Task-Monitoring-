import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DailyReportsService } from './daily-reports.service';
import {
  CreateDailyReportDto,
  UpdateDailyReportDto,
} from './dto/daily-report.dto';
import { SendDailyReportEmailDto } from './dto/send-email.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';

@Controller('daily-reports')
@UseGuards(JwtAuthGuard)
export class DailyReportsController {
  constructor(private readonly reportsService: DailyReportsService) {}

  @Post()
  upsert(@CurrentUser() user: AuthUser, @Body() dto: CreateDailyReportDto) {
    return this.reportsService.upsert(user.userId, dto);
  }

  @Post('send-email')
  sendEmail(
    @CurrentUser() user: AuthUser,
    @Body() dto: SendDailyReportEmailDto,
  ) {
    return this.reportsService.sendEmail(user.userId, user.email, dto);
  }

  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.reportsService.findMine(user.userId);
  }

  @Get('today')
  findToday(@CurrentUser() user: AuthUser) {
    return this.reportsService.findToday(user.userId);
  }

  @Get('generate')
  generate(
    @CurrentUser() user: AuthUser,
    @Query('workspaceOwnerId') workspaceOwnerId?: string,
  ) {
    return this.reportsService.generateFromTasks(
      user.userId,
      user.email,
      workspaceOwnerId,
    );
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDailyReportDto,
  ) {
    return this.reportsService.update(id, user.userId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reportsService.remove(id, user.userId);
  }
}
