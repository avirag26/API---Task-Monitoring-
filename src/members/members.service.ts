import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Member } from './entities/member.entity';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { InviteMemberDto, UpdateMemberDto } from './dto/member.dto';
import { MemberRole } from '../common/enums/role.enum';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  private async validateProjectIds(
    workspaceOwnerId: string,
    projectIds?: string[],
  ): Promise<string[] | null> {
    if (!projectIds || projectIds.length === 0) {
      return null; // all projects
    }

    const projects = await this.projectRepo.find({
      where: { ownerId: workspaceOwnerId, id: In(projectIds) },
    });

    if (projects.length !== projectIds.length) {
      throw new BadRequestException(
        'One or more selected projects are invalid',
      );
    }

    return projectIds;
  }

  private async withProjectNames(members: Member[]) {
    const allIds = [
      ...new Set(members.flatMap((m) => m.projectIds || [])),
    ];
    const projects =
      allIds.length > 0
        ? await this.projectRepo.find({ where: { id: In(allIds) } })
        : [];
    const nameMap = new Map(projects.map((p) => [p.id, p.name]));

    return members.map((m) => ({
      ...m,
      projectsAccess:
        !m.projectIds || m.projectIds.length === 0
          ? { all: true as const, projects: [] as { id: string; name: string }[] }
          : {
              all: false as const,
              projects: m.projectIds.map((id) => ({
                id,
                name: nameMap.get(id) || 'Unknown project',
              })),
            },
    }));
  }

  async invite(ownerUserId: string, dto: InviteMemberDto) {
    const workspaceOwnerId = dto.workspaceOwnerId || ownerUserId;

    if (workspaceOwnerId !== ownerUserId) {
      throw new ForbiddenException('Only the workspace owner can invite people');
    }

    if (dto.role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot assign owner role via invite');
    }

    const email = dto.email.toLowerCase();
    if (
      email ===
      (await this.userRepo.findOne({ where: { id: ownerUserId } }))?.email
    ) {
      throw new BadRequestException('Cannot invite yourself');
    }

    const existing = await this.memberRepo.findOne({
      where: { workspaceOwnerId, email },
    });
    if (existing) {
      throw new ConflictException('This person is already invited');
    }

    const projectIds = await this.validateProjectIds(
      workspaceOwnerId,
      dto.projectIds,
    );

    const existingUser = await this.userRepo.findOne({ where: { email } });

    const member = this.memberRepo.create({
      workspaceOwnerId,
      email,
      role: dto.role,
      projectIds,
      userId: existingUser?.id ?? null,
    });

    const saved = await this.memberRepo.save(member);
    const [enriched] = await this.withProjectNames([saved]);
    return enriched;
  }

  async list(ownerUserId: string, workspaceOwnerId?: string) {
    const ownerId = workspaceOwnerId || ownerUserId;
    if (ownerId !== ownerUserId) {
      const self = await this.memberRepo.findOne({
        where: [
          { workspaceOwnerId: ownerId, userId: ownerUserId },
          {
            workspaceOwnerId: ownerId,
            email: (
              await this.userRepo.findOne({ where: { id: ownerUserId } })
            )?.email,
          },
        ],
      });
      if (!self) {
        throw new ForbiddenException('No access');
      }
    }

    const members = await this.memberRepo.find({
      where: { workspaceOwnerId: ownerId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return this.withProjectNames(members);
  }

  async updateMember(
    memberId: string,
    ownerUserId: string,
    dto: UpdateMemberDto,
  ) {
    const member = await this.memberRepo.findOne({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Member not found');
    if (member.workspaceOwnerId !== ownerUserId) {
      throw new ForbiddenException('Only owner can update members');
    }

    if (dto.role !== undefined) {
      if (dto.role === MemberRole.OWNER) {
        throw new BadRequestException('Cannot assign owner role');
      }
      member.role = dto.role;
    }

    if (dto.projectIds !== undefined) {
      member.projectIds = await this.validateProjectIds(
        member.workspaceOwnerId,
        dto.projectIds,
      );
    }

    const saved = await this.memberRepo.save(member);
    const [enriched] = await this.withProjectNames([saved]);
    return enriched;
  }

  async remove(memberId: string, ownerUserId: string) {
    const member = await this.memberRepo.findOne({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Member not found');
    if (member.workspaceOwnerId !== ownerUserId) {
      throw new ForbiddenException('Only owner can remove members');
    }
    await this.memberRepo.remove(member);
    return { deleted: true };
  }
}
