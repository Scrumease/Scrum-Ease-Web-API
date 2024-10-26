import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, isArray } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: 'Nome do projeto', example: 'Meu Projeto 1' })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty({ description: 'Id dos usuários do projeto'})
  @IsArray()
  @IsString({ each: true }) 
  readonly users: string[];

  @ApiProperty({ description: 'Descrição do projeto', required: false })
  @IsString()
  readonly description: string;
}
