import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

function splitEmails(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((v) => String(v).split(/[,;]/))
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[,;]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

export class UpdateAutoReportSettingsDto {
  @IsOptional()
  @IsBoolean()
  autoDailyReportEnabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => splitEmails(value))
  @IsArray()
  @ArrayUnique()
  @IsEmail({}, { each: true })
  autoDailyReportTo?: string[];

  @IsOptional()
  @Transform(({ value }) => splitEmails(value))
  @IsArray()
  @ArrayUnique()
  @IsEmail({}, { each: true })
  autoDailyReportCc?: string[];
}
