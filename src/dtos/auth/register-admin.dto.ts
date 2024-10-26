import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class RegisterAdminDto {
  @ApiProperty({ description: 'Tenant Name', example: 'My Organization' })
  @IsString()
  @IsNotEmpty()
  readonly tenantName: string;

  @ApiProperty({
    description: 'Document linked to the tenant owner',
    example: '123.456.789-00',
  })
  @IsString()
  @IsNotEmpty()
  readonly tenantIdentifier: string;

  @ApiProperty({ description: 'User name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  readonly adminName: string;

  @ApiProperty({
    description: 'Administrator email',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  readonly adminEmail: string;

  @ApiProperty({
    description: 'Administrator password',
    example: 'strongPassword123',
  })
  @IsString()
  @IsNotEmpty()
  readonly password: string;

  @ApiProperty({ description: 'Administrator timezone', example: {
    value: 'America/Sao_Paulo',
    offset: -3,
  } })
  @IsNotEmpty()

  readonly timezone: {
    value: string;
    offset?: number | undefined;
  }

  @ApiProperty({ description: 'Administrator country', example: 'Brazil' })
  @IsString()
  @IsNotEmpty()
  readonly country: string;

  @ApiProperty({ description: 'Administrator state', example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  readonly state: string;

  @ApiProperty({ description: 'Administrator city', example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  readonly city: string;
}
