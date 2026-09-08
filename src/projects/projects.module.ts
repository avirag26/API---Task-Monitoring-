import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Member } from '../members/entities/member.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { AccessService } from '../common/services/access.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Member])],
  controllers: [ProjectsController],
  providers: [ProjectsService, AccessService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
