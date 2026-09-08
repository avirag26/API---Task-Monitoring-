import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { MembersModule } from './members/members.module';
import { DailyReportsModule } from './daily-reports/daily-reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { User } from './users/entities/user.entity';
import { Project } from './projects/entities/project.entity';
import { Task } from './tasks/entities/task.entity';
import { Member } from './members/entities/member.entity';
import { DailyReport } from './daily-reports/entities/daily-report.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/avirag-tasks.sqlite',
      entities: [User, Project, Task, Member, DailyReport],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    MembersModule,
    DailyReportsModule,
    DashboardModule,
  ],
})
export class AppModule {}
