import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { Member } from '../members/entities/member.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AccessService } from '../common/services/access.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Task, Member])],
  controllers: [DashboardController],
  providers: [DashboardService, AccessService],
})
export class DashboardModule {}
