import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { AccessService } from '../common/services/access.service';
import { TaskStatus } from '../common/enums/role.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly accessService: AccessService,
  ) {}

  private async getProjectOrFail(projectId: string) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(userId: string, email: string, dto: CreateTaskDto) {
    const project = await this.getProjectOrFail(dto.projectId);
    await this.accessService.assertCanEditProject(
      project.ownerId,
      project.id,
      userId,
      email,
    );

    const count = await this.taskRepo.count({
      where: { projectId: dto.projectId },
    });

    const task = this.taskRepo.create({
      projectId: dto.projectId,
      date: dto.date ?? null,
      task: dto.task,
      url: dto.url ?? null,
      contentCompletionDate: dto.contentCompletionDate ?? null,
      contentStatus: dto.contentStatus ?? TaskStatus.NOT_STARTED,
      contentDoc: dto.contentDoc ?? null,
      designCompletionDate: dto.designCompletionDate ?? null,
      designStatus: dto.designStatus ?? TaskStatus.NOT_STARTED,
      figmaLink: dto.figmaLink ?? null,
      expectedCompletionDate: dto.expectedCompletionDate ?? null,
      finalReviewApprovalDate: dto.finalReviewApprovalDate ?? null,
      finalStatus: dto.finalStatus ?? TaskStatus.NOT_STARTED,
      comments: dto.comments ?? null,
      customFields: dto.customFields ?? null,
      sortOrder: count,
    });

    return this.taskRepo.save(task);
  }

  async findByProject(projectId: string, userId: string, email: string) {
    const project = await this.getProjectOrFail(projectId);
    await this.accessService.assertCanViewProject(
      project.ownerId,
      project.id,
      userId,
      email,
    );

    return this.taskRepo.find({
      where: { projectId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async update(
    id: string,
    userId: string,
    email: string,
    dto: UpdateTaskDto,
  ) {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.accessService.assertCanEditProject(
      task.project.ownerId,
      task.project.id,
      userId,
      email,
    );

    Object.assign(task, dto);
    return this.taskRepo.save(task);
  }

  async remove(id: string, userId: string, email: string) {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.accessService.assertCanEditProject(
      task.project.ownerId,
      task.project.id,
      userId,
      email,
    );
    await this.taskRepo.remove(task);
    return { deleted: true };
  }
}
