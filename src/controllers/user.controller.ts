import {
  Controller,
  Get,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  Patch,
  Req,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UpdateUserDto } from 'src/dtos/user/update-user.dto';
import { User } from 'src/schemas/user';
import { JwtAuthGuard } from 'src/config/auth/guard/jwt.guard';
import { PermissionsGuard } from 'src/config/auth/guard/permission.guard';
import { Permissions } from 'src/config/decorators/permissions.decorator';
import { PermissionsEnum } from 'src/enums/permissions.enum';
import { IUser } from 'src/schemas/interfaces/user.interface';
import { FindPaginated } from 'src/dtos/common/findPaginatel.interface';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Buscar informações do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Usuário retornado com sucesso.',
    type: User,
  })
  async me(@Request() req: any): Promise<IUser> {
    return this.userService.findOne(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um usuário pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Usuário retornado com sucesso.',
    type: () => User,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async findOne(@Param('id') id: string): Promise<IUser> {
    return this.userService.findOne(id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Atualizar o usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado com sucesso.',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async update(
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ): Promise<User> {
    return this.userService.update(req.user.userId, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir um usuário pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Usuário excluído com sucesso.',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async delete(@Param('id') id: string): Promise<User> {
    return this.userService.delete(id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários do tenant' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso.',
    type: [User],
  })
  @ApiQuery({ name: 'page', description: 'Página' })
  @ApiQuery({ name: 'limit', description: 'Limite de itens por página' })
  @ApiQuery({
    name: 'search',
    description: 'Filtro de busca (Nome)',
    required: false,
  })
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionsEnum.LIST_USERS)
  async findAll(
    @Request() req: any,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<FindPaginated<IUser>> {
    return this.userService.findAll(req.user, page, limit, search);
  }

  @Patch('role')
  @ApiOperation({ summary: 'Atualizar o papel de um usuário' })
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionsEnum.UPDATE_USER_ROLE)
  async updateRole(
    @Body() body: { userId: string; roleId: string },
    @Request() req,
  ): Promise<void> {
    await this.userService.updateUserRole(body.userId, body.roleId, req.user);
  }
}
