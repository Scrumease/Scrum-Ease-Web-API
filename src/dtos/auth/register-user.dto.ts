import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ description: 'User name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty({
    description: 'User email',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({
    description: 'Invitation token',
    example: 'token',
  })

  @ApiProperty({
    description: 'User password',
    example: 'strongPassword123',
  })
  @IsString()
  @IsNotEmpty()
  readonly password: string;

  @ApiProperty({ description: 'timezone', example: {
    value: 'America/Sao_Paulo',
    offset: -3,
  } })
  @IsNotEmpty()

  readonly timezone: {
    value: string;
    offset?: number | undefined;
  }

  @ApiProperty({ description: 'country', example: 'Brazil' })
  @IsString()
  @IsNotEmpty()
  readonly country: string;

  @ApiProperty({ description: 'state', example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  readonly state: string;

  @ApiProperty({ description: 'city', example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  readonly city: string;
}
