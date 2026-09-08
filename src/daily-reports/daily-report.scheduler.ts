import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UsersService } from '../users/users.service';
import { DailyReportsService } from './daily-reports.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class DailyReportScheduler {
  private readonly logger = new Logger(DailyReportScheduler.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly dailyReportsService: DailyReportsService,
    private readonly mailService: MailService,
  ) {}

  /** Every day at 6:10 PM India time */
  @Cron('10 18 * * *', { timeZone: 'Asia/Kolkata' })
  async handleEveningAutoSend() {
    this.logger.log('Running 6:10 PM auto daily report job…');

    if (!this.mailService.isConfigured()) {
      this.logger.warn('SMTP not configured — skipping auto daily reports');
      return;
    }

    const users = await this.usersService.findUsersWithAutoReportEnabled();
    this.logger.log(`Found ${users.length} user(s) with auto-send enabled`);

    for (const user of users) {
      try {
        if (!user.autoDailyReportTo?.length) {
          this.logger.warn(
            `Skipping ${user.email}: no To recipients configured`,
          );
          continue;
        }

        const generated = await this.dailyReportsService.generateFromTasks(
          user.id,
          user.email,
          user.id,
        );

        await this.dailyReportsService.sendEmail(user.id, user.email, {
          to: user.autoDailyReportTo,
          cc: user.autoDailyReportCc || [],
          generatedSummary: generated.generatedSummary,
          comments: '',
          content: generated.generatedSummary,
        });

        this.logger.log(`Auto daily report sent for ${user.email}`);
      } catch (err) {
        this.logger.error(
          `Failed auto daily report for ${user.email}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
  }
}
