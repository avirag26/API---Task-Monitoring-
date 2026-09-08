import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyReport } from './entities/daily-report.entity';
import {
  CreateDailyReportDto,
  UpdateDailyReportDto,
} from './dto/daily-report.dto';
import { SendDailyReportEmailDto } from './dto/send-email.dto';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { AccessService } from '../common/services/access.service';
import { TaskStatus } from '../common/enums/role.enum';
import { STATUS_LABEL } from './status-labels';
import { MailService } from '../mail/mail.service';

@Injectable()
export class DailyReportsService {
  constructor(
    @InjectRepository(DailyReport)
    private readonly reportRepo: Repository<DailyReport>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly accessService: AccessService,
    private readonly mailService: MailService,
  ) {}

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private composeContent(summary?: string | null, comments?: string | null) {
    const parts: string[] = [];
    if (summary?.trim()) parts.push(summary.trim());
    if (comments?.trim()) {
      parts.push(`Additional comments:\n${comments.trim()}`);
    }
    return parts.join('\n\n');
  }

  async generateFromTasks(
    userId: string,
    email: string,
    workspaceOwnerId?: string,
  ) {
    const ownerId = workspaceOwnerId || userId;
    const access = await this.accessService.assertCanView(
      ownerId,
      userId,
      email,
    );

    const today = this.today();
    const allProjects = await this.projectRepo.find({
      where: { ownerId },
      relations: ['tasks'],
      order: { sortOrder: 'ASC' },
    });
    const projects = this.accessService.filterProjectIds(access, allProjects);

    const startOfDay = new Date(`${today}T00:00:00.000Z`);
    const endOfDay = new Date(`${today}T23:59:59.999Z`);

    type Activity = {
      projectName: string;
      task: string;
      notes: string[];
    };

    const activities: Activity[] = [];

    for (const project of projects) {
      for (const task of project.tasks || []) {
        const notes: string[] = [];
        const updatedAt = task.updatedAt ? new Date(task.updatedAt) : null;
        const updatedToday =
          updatedAt !== null &&
          updatedAt >= startOfDay &&
          updatedAt <= endOfDay;

        if (task.date === today) {
          notes.push('logged / started today');
        }
        if (task.contentCompletionDate === today) {
          notes.push('content completed');
        }
        if (task.designCompletionDate === today) {
          notes.push('design completed');
        }
        if (task.finalReviewApprovalDate === today) {
          notes.push('final review & approval done');
        }
        if (task.contentStatus === TaskStatus.COMPLETED) {
          notes.push(`content: ${STATUS_LABEL[task.contentStatus]}`);
        } else if (
          updatedToday &&
          task.contentStatus !== TaskStatus.NOT_STARTED
        ) {
          notes.push(`content: ${STATUS_LABEL[task.contentStatus]}`);
        }
        if (task.designStatus === TaskStatus.COMPLETED) {
          notes.push(`design: ${STATUS_LABEL[task.designStatus]}`);
        } else if (
          updatedToday &&
          task.designStatus !== TaskStatus.NOT_STARTED
        ) {
          notes.push(`design: ${STATUS_LABEL[task.designStatus]}`);
        }
        if (task.finalStatus === TaskStatus.COMPLETED) {
          notes.push(`final: ${STATUS_LABEL[task.finalStatus]}`);
        } else if (
          updatedToday &&
          task.finalStatus !== TaskStatus.NOT_STARTED
        ) {
          notes.push(`final: ${STATUS_LABEL[task.finalStatus]}`);
        }

        // Include if any date-based signal OR updated today with meaningful progress
        const dateHit =
          task.date === today ||
          task.contentCompletionDate === today ||
          task.designCompletionDate === today ||
          task.finalReviewApprovalDate === today;

        const progressHit =
          updatedToday &&
          (task.contentStatus !== TaskStatus.NOT_STARTED ||
            task.designStatus !== TaskStatus.NOT_STARTED ||
            task.finalStatus !== TaskStatus.NOT_STARTED);

        if (dateHit || progressHit) {
          // Deduplicate notes
          const uniqueNotes = [...new Set(notes)];
          activities.push({
            projectName: project.name,
            task: task.task,
            notes: uniqueNotes,
          });
        }
      }
    }

    const byProject = new Map<string, Activity[]>();
    for (const a of activities) {
      const list = byProject.get(a.projectName) || [];
      list.push(a);
      byProject.set(a.projectName, list);
    }

    const lines: string[] = [];
    lines.push(`Daily summary — ${today}`);
    lines.push('');

    if (activities.length === 0) {
      lines.push(
        'No task activity detected for today yet. Update task statuses or completion dates, then generate again.',
      );
    } else {
      lines.push(`What I worked on today (${activities.length} task${activities.length === 1 ? '' : 's'}):`);
      lines.push('');
      for (const [projectName, items] of byProject) {
        lines.push(`${projectName}`);
        for (const item of items) {
          const detail =
            item.notes.length > 0 ? ` — ${item.notes.join('; ')}` : '';
          lines.push(`  • ${item.task}${detail}`);
        }
        lines.push('');
      }
    }

    const summary = lines.join('\n').trim();

    return {
      date: today,
      generatedSummary: summary,
      activityCount: activities.length,
      projects: [...byProject.keys()],
    };
  }

  async upsert(userId: string, dto: CreateDailyReportDto) {
    const date = dto.date || this.today();
    const generatedSummary = dto.generatedSummary ?? null;
    const comments = dto.comments ?? null;
    const content =
      dto.content?.trim() ||
      this.composeContent(generatedSummary, comments);

    if (!content) {
      throw new BadRequestException('Report content is empty');
    }

    let report = await this.reportRepo.findOne({ where: { userId, date } });

    if (report) {
      report.content = content;
      if (dto.generatedSummary !== undefined) {
        report.generatedSummary = generatedSummary;
      }
      if (dto.comments !== undefined) {
        report.comments = comments;
      }
      return this.reportRepo.save(report);
    }

    report = this.reportRepo.create({
      userId,
      date,
      content,
      generatedSummary,
      comments,
    });
    return this.reportRepo.save(report);
  }

  async findMine(userId: string) {
    return this.reportRepo.find({
      where: { userId },
      order: { date: 'DESC' },
    });
  }

  async findToday(userId: string) {
    return this.reportRepo.findOne({
      where: { userId, date: this.today() },
    });
  }

  async update(id: string, userId: string, dto: UpdateDailyReportDto) {
    const report = await this.reportRepo.findOne({ where: { id, userId } });
    if (!report) throw new NotFoundException('Report not found');

    if (dto.generatedSummary !== undefined) {
      report.generatedSummary = dto.generatedSummary;
    }
    if (dto.comments !== undefined) {
      report.comments = dto.comments;
    }
    if (dto.content !== undefined) {
      report.content = dto.content;
    } else if (
      dto.generatedSummary !== undefined ||
      dto.comments !== undefined
    ) {
      report.content = this.composeContent(
        report.generatedSummary,
        report.comments,
      );
    }

    return this.reportRepo.save(report);
  }

  async remove(id: string, userId: string) {
    const report = await this.reportRepo.findOne({ where: { id, userId } });
    if (!report) throw new NotFoundException('Report not found');
    await this.reportRepo.remove(report);
    return { deleted: true };
  }

  async sendEmail(
    userId: string,
    email: string,
    dto: SendDailyReportEmailDto,
  ) {
    const summary = dto.generatedSummary?.trim() || '';
    const comments = dto.comments?.trim() || '';
    const content =
      dto.content?.trim() || this.composeContent(summary, comments);

    if (!content) {
      throw new BadRequestException(
        'Nothing to send. Generate a summary or add comments first.',
      );
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    const senderName = user?.name || email;
    const date = this.today();

    const text = [
      `Daily Report — ${date}`,
      `From: ${senderName} <${email}>`,
      '',
      content,
    ].join('\n');

    const htmlSummary = (summary || content)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');

    const htmlComments = comments
      ? `<div style="margin-top:20px;padding:14px 16px;border-radius:10px;background:#f4f8f7;border:1px solid #c9d6d2">
          <div style="font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#5a6f6a;margin-bottom:8px">Additional comments</div>
          <div style="white-space:pre-wrap;line-height:1.55">${comments
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br/>')}</div>
        </div>`
      : '';

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#eef4f2;font-family:Segoe UI,Arial,sans-serif;color:#0f1c1a">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border:1px solid #c9d6d2;border-radius:16px;overflow:hidden">
    <div style="padding:20px 24px;background:#1a6b5c;color:#fff">
      <div style="font-size:13px;opacity:.85">${senderName}'s Tasks</div>
      <div style="font-size:22px;font-weight:700;margin-top:4px">Daily Report — ${date}</div>
      <div style="font-size:13px;margin-top:8px;opacity:.9">From ${senderName}</div>
    </div>
    <div style="padding:22px 24px;font-size:14px;line-height:1.55">
      <div style="white-space:pre-wrap">${summary ? htmlSummary : htmlSummary}</div>
      ${htmlComments}
    </div>
  </div>
</body>
</html>`.trim();

    // Also persist today's report when sending
    await this.upsert(userId, {
      generatedSummary: summary || undefined,
      comments: comments || undefined,
      content,
    });

    const result = await this.mailService.sendMail({
      to: dto.to,
      cc: dto.cc,
      subject: `Daily Report — ${date} (${senderName})`,
      text,
      html,
      replyTo: email,
    });

    return {
      sent: true,
      messageId: result.messageId,
      to: dto.to,
      cc: dto.cc || [],
    };
  }
}
