import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { MemberRole } from '../enums/role.enum';

export interface AccessContext {
  role: MemberRole;
  canEdit: boolean;
  canManageMembers: boolean;
  /** null = all projects */
  projectIds: string[] | null;
}

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
  ) {}

  private normalizeProjectIds(ids: string[] | null | undefined): string[] | null {
    if (!ids || ids.length === 0) return null;
    return ids;
  }

  canAccessProject(access: AccessContext, projectId: string): boolean {
    if (!access.projectIds) return true;
    return access.projectIds.includes(projectId);
  }

  filterProjectIds<T extends { id: string }>(
    access: AccessContext,
    projects: T[],
  ): T[] {
    if (!access.projectIds) return projects;
    const allowed = new Set(access.projectIds);
    return projects.filter((p) => allowed.has(p.id));
  }

  async resolveAccess(
    workspaceOwnerId: string,
    userId: string,
    email: string,
  ): Promise<AccessContext | null> {
    if (userId === workspaceOwnerId) {
      return {
        role: MemberRole.OWNER,
        canEdit: true,
        canManageMembers: true,
        projectIds: null,
      };
    }

    const member = await this.memberRepo.findOne({
      where: [
        { workspaceOwnerId, userId },
        { workspaceOwnerId, email },
      ],
    });

    if (!member) return null;

    return {
      role: member.role,
      canEdit:
        member.role === MemberRole.EDITOR || member.role === MemberRole.OWNER,
      canManageMembers: false,
      projectIds: this.normalizeProjectIds(member.projectIds),
    };
  }

  async assertCanView(
    workspaceOwnerId: string,
    userId: string,
    email: string,
  ): Promise<AccessContext> {
    const access = await this.resolveAccess(workspaceOwnerId, userId, email);
    if (!access) {
      throw new ForbiddenException('No access to this workspace');
    }
    return access;
  }

  async assertCanEdit(
    workspaceOwnerId: string,
    userId: string,
    email: string,
  ): Promise<AccessContext> {
    const access = await this.assertCanView(workspaceOwnerId, userId, email);
    if (!access.canEdit) {
      throw new ForbiddenException('View-only role cannot edit');
    }
    return access;
  }

  async assertCanViewProject(
    workspaceOwnerId: string,
    projectId: string,
    userId: string,
    email: string,
  ): Promise<AccessContext> {
    const access = await this.assertCanView(workspaceOwnerId, userId, email);
    if (!this.canAccessProject(access, projectId)) {
      throw new ForbiddenException('No access to this project');
    }
    return access;
  }

  async assertCanEditProject(
    workspaceOwnerId: string,
    projectId: string,
    userId: string,
    email: string,
  ): Promise<AccessContext> {
    const access = await this.assertCanEdit(workspaceOwnerId, userId, email);
    if (!this.canAccessProject(access, projectId)) {
      throw new ForbiddenException('No access to edit this project');
    }
    return access;
  }
}
