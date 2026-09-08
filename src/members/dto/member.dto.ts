import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { MemberRole } from '../../common/enums/role.enum';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(MemberRole)
  role: MemberRole;

  @IsOptional()
  @IsString()
  workspaceOwnerId?: string;

  /** Empty / omitted = all projects. Otherwise only these project IDs. */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  projectIds?: string[];
}

export class UpdateMemberDto {
  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  projectIds?: string[];
}
