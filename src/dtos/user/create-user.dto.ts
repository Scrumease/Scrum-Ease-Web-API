import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsArray } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome do usuário', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'strongPassword123',
  })
  @IsString()
  @IsNotEmpty()
  readonly password: string;

  @ApiProperty({
    description: 'Lista de IDs de papéis do usuário',
    example: ['60d0fe4f5311236168a109ca', '60d0fe4f5311236168a109cb'],
  })
  @IsArray()
  @IsNotEmpty()
  readonly roles: string[];

  @ApiProperty({
    description: 'ID do tenant do usuário',
    example: '60d0fe4f5311236168a109cb',
  })
  @IsString()
  @IsNotEmpty()
  readonly tenantId: string;
}
