import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Member } from '../../members/entities/member.entity';
import { DailyReport } from '../../daily-reports/entities/daily-report.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar' })
  name: string;

  /** Auto-send daily report at 6:10 PM */
  @Column({ type: 'boolean', default: false })
  autoDailyReportEnabled: boolean;

  /** Comma-separated or JSON list of To emails for auto send */
  @Column({ type: 'simple-json', nullable: true })
  autoDailyReportTo: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  autoDailyReportCc: string[] | null;

  @OneToMany(() => Project, (project) => project.owner)
  projects: Project[];

  @OneToMany(() => Member, (member) => member.workspaceOwner)
  invitedMembers: Member[];

  @OneToMany(() => DailyReport, (report) => report.user)
  dailyReports: DailyReport[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
