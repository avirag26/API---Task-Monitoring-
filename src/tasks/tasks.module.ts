import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { Member } from '../members/entities/member.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AccessService } from '../common/services/access.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Project, Member])],
  controllers: [TasksController],
  providers: [TasksService, AccessService],
  exports: [TasksService],
})
export class TasksModule {}
