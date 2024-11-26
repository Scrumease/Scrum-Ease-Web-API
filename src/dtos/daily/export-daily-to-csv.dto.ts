import { IsString, IsDateString, IsOptional, IsArray } from 'class-validator';

export class ExportDailyToCsvDto {
  @IsString()
  formId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsArray()
  @IsOptional()
  userIds?: string[];
}
