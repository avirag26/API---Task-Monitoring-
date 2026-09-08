import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyReport } from './entities/daily-report.entity';
import { Project } from '../projects/entities/project.entity';
import { Member } from '../members/entities/member.entity';
import { User } from '../users/entities/user.entity';
import { DailyReportsService } from './daily-reports.service';
import { DailyReportsController } from './daily-reports.controller';
import { DailyReportScheduler } from './daily-report.scheduler';
import { AccessService } from '../common/services/access.service';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyReport, Project, Member, User]),
    MailModule,
    UsersModule,
  ],
  controllers: [DailyReportsController],
  providers: [DailyReportsService, AccessService, DailyReportScheduler],
  exports: [DailyReportsService],
})
export class DailyReportsModule {}
