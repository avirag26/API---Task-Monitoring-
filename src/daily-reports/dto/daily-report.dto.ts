import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDailyReportDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  generatedSummary?: string;

  @IsOptional()
  @IsString()
  comments?: string;

  /** Final combined content; built from summary + comments if omitted */
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;
}

export class UpdateDailyReportDto {
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
