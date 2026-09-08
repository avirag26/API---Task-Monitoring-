import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { AccessService } from '../common/services/access.service';
import { TaskStatus } from '../common/enums/role.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    private readonly accessService: AccessService,
  ) {}

  async getSummary(userId: string, email: string, workspaceOwnerId?: string) {
    const ownerId = workspaceOwnerId || userId;
    const access = await this.accessService.assertCanView(
      ownerId,
      userId,
      email,
    );

    const allProjects = await this.projectRepo.find({
      where: { ownerId },
      relations: ['tasks'],
      order: { sortOrder: 'ASC' },
    });

    const projects = this.accessService.filterProjectIds(access, allProjects);

    const allTasks = projects.flatMap((p) =>
      (p.tasks || []).map((t) => ({
        ...t,
        projectName: p.name,
        projectId: p.id,
      })),
    );

    const isPending = (status: TaskStatus) =>
      status !== TaskStatus.COMPLETED;

    const pendingTasks = allTasks.filter(
      (t) =>
        isPending(t.contentStatus) ||
        isPending(t.designStatus) ||
        isPending(t.finalStatus),
    );

    const completedTasks = allTasks.filter(
      (t) =>
        t.contentStatus === TaskStatus.COMPLETED &&
        t.designStatus === TaskStatus.COMPLETED &&
        t.finalStatus === TaskStatus.COMPLETED,
    );

    const byProject = projects.map((p) => {
      const tasks = p.tasks || [];
      const pending = tasks.filter(
        (t) =>
          isPending(t.contentStatus) ||
          isPending(t.designStatus) ||
          isPending(t.finalStatus),
      );
      return {
        projectId: p.id,
        projectName: p.name,
        total: tasks.length,
        pending: pending.length,
        completed: tasks.length - pending.length,
        pendingTasks: pending.map((t) => ({
          id: t.id,
          task: t.task,
          contentStatus: t.contentStatus,
          designStatus: t.designStatus,
          finalStatus: t.finalStatus,
          expectedCompletionDate: t.expectedCompletionDate,
        })),
      };
    });

    return {
      totals: {
        projects: projects.length,
        tasks: allTasks.length,
        pending: pendingTasks.length,
        completed: completedTasks.length,
      },
      byProject,
      pendingTasks: pendingTasks.map((t) => ({
        id: t.id,
        task: t.task,
        projectName: t.projectName,
        projectId: t.projectId,
        contentStatus: t.contentStatus,
        designStatus: t.designStatus,
        finalStatus: t.finalStatus,
        expectedCompletionDate: t.expectedCompletionDate,
        date: t.date,
      })),
    };
  }
}
