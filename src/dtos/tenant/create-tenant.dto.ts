import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Nome da empresa',
    example: 'TechCorp',
  })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  //TODO: Add validation for CPF/CNPJ
  @ApiProperty({
    description: 'CPF/CNPJ da empresa',
    example: '123.456.789-00',
  })
  @IsString()
  @IsNotEmpty()
  readonly identifier: string;
}
