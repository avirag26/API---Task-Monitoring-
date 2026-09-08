import {
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { TaskStatus } from '../../common/enums/role.enum';

export class CreateTaskDto {
  @IsString()
  projectId: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsString()
  @MinLength(1)
  task: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsDateString()
  contentCompletionDate?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  contentStatus?: TaskStatus;

  @IsOptional()
  @IsString()
  contentDoc?: string;

  @IsOptional()
  @IsDateString()
  designCompletionDate?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  designStatus?: TaskStatus;

  @IsOptional()
  @IsString()
  figmaLink?: string;

  @IsOptional()
  @IsDateString()
  expectedCompletionDate?: string;

  @IsOptional()
  @IsDateString()
  finalReviewApprovalDate?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  finalStatus?: TaskStatus;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, string>;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsDateString()
  date?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  task?: string;

  @IsOptional()
  @IsString()
  url?: string | null;

  @IsOptional()
  @IsDateString()
  contentCompletionDate?: string | null;

  @IsOptional()
  @IsEnum(TaskStatus)
  contentStatus?: TaskStatus;

  @IsOptional()
  @IsString()
  contentDoc?: string | null;

  @IsOptional()
  @IsDateString()
  designCompletionDate?: string | null;

  @IsOptional()
  @IsEnum(TaskStatus)
  designStatus?: TaskStatus;

  @IsOptional()
  @IsString()
  figmaLink?: string | null;

  @IsOptional()
  @IsDateString()
  expectedCompletionDate?: string | null;

  @IsOptional()
  @IsDateString()
  finalReviewApprovalDate?: string | null;

  @IsOptional()
  @IsEnum(TaskStatus)
  finalStatus?: TaskStatus;

  @IsOptional()
  @IsString()
  comments?: string | null;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, string> | null;

  @IsOptional()
  sortOrder?: number;
}
