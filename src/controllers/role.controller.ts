import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
  Patch,
  HttpCode,
} from '@nestjs/common';
import { RoleService } from '../services/role.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateRoleDto } from 'src/dtos/role/create-role.dto';
import { Role } from 'src/schemas/role';
import { PermissionsEnum } from 'src/enums/permissions.enum';
import { IRole } from 'src/schemas/interfaces/role.interface';
import { FindPaginated } from 'src/dtos/common/findPaginatel.interface';
import { PermissionsGuard } from 'src/config/auth/guard/permission.guard';
import { Permissions } from 'src/config/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/config/auth/guard/jwt.guard';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo cargo' })
  @ApiBody({
    type: CreateRoleDto,
    examples: {
      example1: {
        summary: 'Exemplo de criação de cargo',
        value: {
          name: 'admin',
          permissions: [PermissionsEnum.CREATE_ROLE],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'cargo criado com sucesso.',
    type: Role,
  })
  @ApiResponse({ status: 400, description: 'Requisição inválida.' })
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionsEnum.CREATE_ROLE)
  async create(@Request() req: any, @Body() createRoleDto: CreateRoleDto): Promise<IRole> {
    return this.roleService.create(req.user, createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os cargos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cargos retornada com sucesso.',
    type: [Role],
  })
  @ApiQuery({ name: 'page', description: 'Página' })
  @ApiQuery({ name: 'limit', description: 'Limite de itens por página' })
  @ApiQuery({ name: 'search', description: 'Filtro de busca (Nome)', required: false })
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionsEnum.VIEW_ROLE)
  async findAll(@Request() req: any, @Query('page', ParseIntPipe) page: number, @Query('limit', ParseIntPipe) limit: number, @Query('search') search?: string): Promise<FindPaginated<IRole>> {
    return this.roleService.findAll(req.user, page, limit, search);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Listar todas as permissões disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Lista de permissões retornada com sucesso.',
    type: [String],
  })
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionsEnum.VIEW_ROLE)
  async getPermissions(): Promise<Record<string, string>> {
    return this.roleService.getPermissions();
  }

  @Get('find-by-name/:name')
  @ApiOperation({ summary: 'Buscar um cargo pelo nome' })
  @ApiParam({ name: 'name', description: 'Nome do cargo' })
  @ApiResponse({
    status: 200,
    description: 'Cargo retornado com sucesso.',
    type: Role,
  })
  @ApiResponse({ status: 404, description: 'Cargo não encontrado.' })
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionsEnum.VIEW_ROLE)
  async findByName(@Request() req: any, @Param('name') name: string): Promise<Role> {
    return this.roleService.findByName(req.user, name);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um cargo' })
  @ApiParam({ name: 'id', description: 'ID do cargo' })
  @ApiResponse({
    status: 204,
  })
  @ApiResponse({ status: 404, description: 'Cargo não encontrado.' })
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionsEnum.UPDATE_ROLE)
  @HttpCode(204)
  async update(@Param('id') id: string, @Body() dto: {permissions: string[]}): Promise<void> {
    this.roleService.update(id, dto);
    return
  }
}
