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
import { MemberRole } from '../../common/enums/role.enum';

@Entity('members')
@Unique(['workspaceOwnerId', 'email'])
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  workspaceOwnerId: string;

  @ManyToOne(() => User, (user) => user.invitedMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceOwnerId' })
  workspaceOwner: User;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar' })
  role: MemberRole;

  /**
   * Project IDs this member can access.
   * null / empty = all projects in the workspace.
   */
  @Column({ type: 'simple-json', nullable: true })
  projectIds: string[] | null;

  @Column({ type: 'varchar', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
