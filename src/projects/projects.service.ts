import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { AccessService } from '../common/services/access.service';
import { MemberRole } from '../common/enums/role.enum';

const DEFAULT_COLUMNS = [
  'Date',
  'Task',
  'URL',
  'Content Completion Date',
  'Content Status',
  'Content Doc',
  'Design Completion Date',
  'Design Status',
  'Figma Link',
  'Expected Completion Date',
  'Final Review & Approval Date',
  'Final Status',
  'Comments',
];

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly accessService: AccessService,
  ) {}

  async create(
    userId: string,
    email: string,
    dto: CreateProjectDto,
  ) {
    const ownerId = dto.workspaceOwnerId || userId;
    const access = await this.accessService.assertCanEdit(ownerId, userId, email);
    // Only owner can create new projects (not limited editors)
    if (access.role !== MemberRole.OWNER && ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can create projects');
    }

    const count = await this.projectRepo.count({ where: { ownerId } });
    const project = this.projectRepo.create({
      name: dto.name,
      description: dto.description ?? null,
      ownerId,
      sortOrder: count,
      customColumns: DEFAULT_COLUMNS,
    });
    return this.projectRepo.save(project);
  }

  async findAll(userId: string, email: string, workspaceOwnerId?: string) {
    const ownerId = workspaceOwnerId || userId;
    const access = await this.accessService.assertCanView(
      ownerId,
      userId,
      email,
    );

    const projects = await this.projectRepo.find({
      where: { ownerId },
      relations: ['tasks'],
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    return this.accessService.filterProjectIds(access, projects);
  }

  async findOne(id: string, userId: string, email: string) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['tasks'],
      order: { tasks: { sortOrder: 'ASC', createdAt: 'ASC' } },
    });
    if (!project) throw new NotFoundException('Project not found');
    await this.accessService.assertCanViewProject(
      project.ownerId,
      project.id,
      userId,
      email,
    );
    return project;
  }

  async update(
    id: string,
    userId: string,
    email: string,
    dto: UpdateProjectDto,
  ) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    await this.accessService.assertCanEditProject(
      project.ownerId,
      project.id,
      userId,
      email,
    );

    Object.assign(project, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.customColumns !== undefined && {
        customColumns: dto.customColumns,
      }),
    });
    return this.projectRepo.save(project);
  }

  async remove(id: string, userId: string, email: string) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    const access = await this.accessService.assertCanEditProject(
      project.ownerId,
      project.id,
      userId,
      email,
    );
    if (access.role !== MemberRole.OWNER && project.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can delete projects');
    }
    await this.projectRepo.remove(project);
    return { deleted: true };
  }
}
