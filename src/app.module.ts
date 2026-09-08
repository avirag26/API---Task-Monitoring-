import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const sslEnabled =
          config.get<string>('DB_SSL') === 'true' ||
          config.get<string>('NODE_ENV') === 'production' ||
          !!databaseUrl?.includes('sslmode=require') ||
          !!databaseUrl?.includes('neon.tech');

        const entities = [User, Project, Task, Member, DailyReport];
        const common = {
          type: 'postgres' as const,
          entities,
          synchronize: config.get<string>('DB_SYNC') !== 'false',
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
        };

        if (databaseUrl) {
          return {
            ...common,
            url: databaseUrl,
          };
        }

        return {
          ...common,
          host: config.get<string>('DB_HOST') || 'localhost',
          port: Number(config.get<string>('DB_PORT') || 5432),
          username: config.get<string>('DB_USER') || 'postgres',
          password: config.get<string>('DB_PASS') || 'postgres',
          database: config.get<string>('DB_NAME') || 'avirag_tasks',
        };
      },
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
