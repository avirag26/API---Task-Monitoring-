import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Member } from '../members/entities/member.entity';
import { UpdateAutoReportSettingsDto } from './dto/auto-report-settings.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Member) private readonly memberRepo: Repository<Member>,
  ) {}

  async findById(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const { password, ...safe } = user;
    return safe;
  }

  async getMe(userId: string) {
    const user = await this.findById(userId);

    const memberships = await this.memberRepo.find({
      where: [{ userId }, { email: user.email }],
      relations: ['workspaceOwner'],
    });

    // One entry per workspace (invite can match both userId and email)
    const uniqueMembers = new Map<string, (typeof memberships)[0]>();
    for (const m of memberships) {
      if (!uniqueMembers.has(m.workspaceOwnerId)) {
        uniqueMembers.set(m.workspaceOwnerId, m);
      }
    }

    const sharedWorkspaces = [...uniqueMembers.values()]
      .filter((m) => m.workspaceOwnerId !== user.id)
      .map((m) => ({
        ownerId: m.workspaceOwnerId,
        ownerName: m.workspaceOwner?.name ?? 'Unknown',
        ownerEmail: m.workspaceOwner?.email ?? m.email,
        role: m.role,
        isOwn: false as const,
      }));

    const workspaces: Array<{
      ownerId: string;
      ownerName: string;
      ownerEmail: string;
      role: string;
      isOwn: boolean;
    }> = [
      {
        ownerId: user.id,
        ownerName: user.name,
        ownerEmail: user.email,
        role: 'owner',
        isOwn: true,
      },
      ...sharedWorkspaces,
    ];

    // Guests default into the first shared workspace; owners default to their own
    const defaultWorkspaceOwnerId =
      sharedWorkspaces.length > 0
        ? sharedWorkspaces[0].ownerId
        : user.id;

    return {
      ...user,
      workspaces,
      defaultWorkspaceOwnerId,
    };
  }

  async updateAutoReportSettings(
    userId: string,
    dto: UpdateAutoReportSettingsDto,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.autoDailyReportEnabled !== undefined) {
      user.autoDailyReportEnabled = dto.autoDailyReportEnabled;
    }
    if (dto.autoDailyReportTo !== undefined) {
      user.autoDailyReportTo = dto.autoDailyReportTo;
    }
    if (dto.autoDailyReportCc !== undefined) {
      user.autoDailyReportCc = dto.autoDailyReportCc;
    }

    if (
      user.autoDailyReportEnabled &&
      (!user.autoDailyReportTo || user.autoDailyReportTo.length === 0)
    ) {
      throw new BadRequestException(
        'Add at least one To email before enabling auto daily report',
      );
    }

    await this.userRepo.save(user);
    const { password, ...safe } = user;
    return safe;
  }

  async findUsersWithAutoReportEnabled() {
    return this.userRepo.find({
      where: { autoDailyReportEnabled: true },
    });
  }
}
