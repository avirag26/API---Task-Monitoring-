import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
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

export class SendDailyReportEmailDto {
  @Transform(({ value }) => splitEmails(value))
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  to: string[];

  @IsOptional()
  @Transform(({ value }) => splitEmails(value))
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsString()
  generatedSummary?: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;
}
