import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { PermissionsEnum } from 'src/enums/permissions.enum';

// TODO: validar se minhas permissões são realmente PermissionsEnum
export class CreateRoleDto {
  @ApiProperty({ description: 'Nome do papel', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty({
    description: 'Lista de permissões',
    isArray: true,
    enum: PermissionsEnum,
    example: [PermissionsEnum.CREATE_ROLE],
  })
  @IsArray()
  @IsNotEmpty()
  readonly permissions: PermissionsEnum[];
}
