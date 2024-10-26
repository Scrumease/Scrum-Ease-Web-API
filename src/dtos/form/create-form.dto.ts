import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
} from 'class-validator';
import { Types } from 'mongoose';

class AdvancedSettingsDto {
  @ApiProperty({
    description: 'Indicates if urgency is required',
    default: false,
  })
  @IsBoolean()
  urgencyRequired: boolean;

  @ApiProperty({ description: 'Recipients in case of urgency', type: [String] })
  @Transform(({ value }: { value: string[] }) =>
    value.map((v) => new Types.ObjectId(v)),
  )
  @IsArray()
  urgencyRecipients: Types.ObjectId[];

  @ApiProperty({ description: 'Urgency threshold (0-10)', default: 0 })
  @IsOptional()
  @IsNotEmpty()
  urgencyThreshold: number;
}

class QuestionDto {
  @ApiProperty({ description: 'The text of the question' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Answer type (text, yes/no, multiple choice)',
    enum: ['text', 'yes/no', 'multiple choice'],
  })
  @IsString()
  answerType: string;

  @ApiProperty({ description: 'Order of the question' })
  @IsNotEmpty()
  order: number;

  @ApiProperty({ description: 'Choices for multiple choice', required: false })
  @IsOptional()
  @IsArray()
  choices?: string[];

  @ApiProperty({
    description: 'Advanced settings for the question',
    type: AdvancedSettingsDto,
  })
  advancedSettings: AdvancedSettingsDto;
}

export class CreateFormDto {
  @ApiProperty({ description: 'Project ID' })
  @Transform(({ value }: { value: string }) => new Types.ObjectId(value))
  @IsMongoId()
  projectId: Types.ObjectId;

  @ApiProperty({ description: 'Array of questions', type: [QuestionDto] })
  @IsArray()
  questions: QuestionDto[];

  @ApiProperty({ description: 'Marks the form as current', default: false })
  @IsBoolean()
  isCurrentForm: boolean;

  @ApiProperty({ description: 'Days to notify', type: [String] })
  @IsArray()
  notifyDays: string[];

  @ApiProperty({ description: 'Time of notification (e.g., 09:00)' })
  @IsString()
  notifyTime: string;
}
