import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('daily_reports')
@Unique(['userId', 'date'])
export class DailyReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne(() => User, (user) => user.dailyReports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date' })
  date: string;

  /** Full report text (generated summary + comments) */
  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  generatedSummary: string | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
