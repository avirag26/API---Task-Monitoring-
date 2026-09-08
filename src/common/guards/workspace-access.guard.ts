import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { MemberRole } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Ensures the current user can access a workspace (owner or invited member).
 * Optional @Roles() restricts to editor/owner for mutating operations.
 * Expects workspaceOwnerId in params, query, or body.
 */
@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId: string; email: string };
    const workspaceOwnerId =
      request.params.workspaceOwnerId ||
      request.query.workspaceOwnerId ||
      request.body?.workspaceOwnerId;

    if (!workspaceOwnerId) {
      // If no workspace specified, allow — controllers handle own resources
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (user.userId === workspaceOwnerId) {
      request.workspaceRole = MemberRole.OWNER;
      return true;
    }

    const member = await this.memberRepo.findOne({
      where: [
        { workspaceOwnerId, userId: user.userId },
        { workspaceOwnerId, email: user.email },
      ],
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    request.workspaceRole = member.role;

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const allowed =
      requiredRoles.includes(member.role) ||
      member.role === MemberRole.OWNER;

    // Editors can do editor+viewer; viewers only viewer
    if (requiredRoles.includes(MemberRole.EDITOR)) {
      if (
        member.role === MemberRole.EDITOR ||
        member.role === MemberRole.OWNER
      ) {
        return true;
      }
      throw new ForbiddenException('Editor access required');
    }

    if (!allowed) {
      throw new ForbiddenException('Insufficient role permissions');
    }

    return true;
  }
}
