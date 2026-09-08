import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { TaskStatus } from '../../common/enums/role.enum';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'date', nullable: true })
  date: string | null;

  @Column({ type: 'varchar' })
  task: string;

  @Column({ type: 'varchar', nullable: true })
  url: string | null;

  @Column({ type: 'date', nullable: true })
  contentCompletionDate: string | null;

  @Column({ type: 'varchar', default: TaskStatus.NOT_STARTED })
  contentStatus: TaskStatus;

  @Column({ type: 'varchar', nullable: true })
  contentDoc: string | null;

  @Column({ type: 'date', nullable: true })
  designCompletionDate: string | null;

  @Column({ type: 'varchar', default: TaskStatus.NOT_STARTED })
  designStatus: TaskStatus;

  @Column({ type: 'varchar', nullable: true })
  figmaLink: string | null;

  @Column({ type: 'date', nullable: true })
  expectedCompletionDate: string | null;

  @Column({ type: 'date', nullable: true })
  finalReviewApprovalDate: string | null;

  @Column({ type: 'varchar', default: TaskStatus.NOT_STARTED })
  finalStatus: TaskStatus;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ type: 'simple-json', nullable: true })
  customFields: Record<string, string> | null;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
