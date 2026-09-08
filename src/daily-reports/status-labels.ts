import { TaskStatus } from '../common/enums/role.enum';

export const STATUS_LABEL: Record<TaskStatus, string> = {
  [TaskStatus.NOT_STARTED]: 'Not Started',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.PENDING_REVIEW]: 'Pending Review',
  [TaskStatus.COMPLETED]: 'Completed',
  [TaskStatus.BLOCKED]: 'Blocked',
};
