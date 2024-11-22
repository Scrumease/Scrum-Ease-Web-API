import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  HttpCode,
  Get,
  ParseIntPipe,
  Query,
  Put,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/config/auth/guard/jwt.guard';
import { jwtPayload } from 'src/config/auth/strategy/jwt.strategy';
import { FindPaginated } from 'src/dtos/common/findPaginatel.interface';
import { CreateProjectDto } from 'src/dtos/project/create-dto';
import { ProjectCountByUser } from 'src/dtos/project/project-count-by-user';
import { IProject } from 'src/schemas/interfaces/project.interface';
import { ProjectService } from 'src/services/project.service';

@Controller('project')
@ApiTags('project')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get('count-by-user')
  @ApiResponse({
    status: 200,
    description: 'Contagem de projetos por usuário',
  })
  async getProjectCountByUser(
    @Request() req: { user: jwtPayload },
  ): Promise<ProjectCountByUser[]> {
    const result = await this.projectService.getProjectCountByUser(
      req.user.currentTenant.tenantId,
    );
    return result;
  }

  @Post()
  @ApiOperation({ summary: 'Cria um projeto' })
  @ApiResponse({
    status: 201,
  })
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async anwserDaily(
    @Body() dto: CreateProjectDto,
    @Request() req,
  ): Promise<IProject> {
    return await this.projectService.create(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Buscar todos os Projetos do tenant atual' })
  @ApiResponse({
    status: 200,
    description: 'Projetos encontrados com sucesso',
  })
  @ApiQuery({ name: 'page', description: 'Página' })
  @ApiQuery({ name: 'limit', description: 'Limite de itens por página' })
  @ApiQuery({
    name: 'search',
    description: 'Filtro de busca (Nome)',
    required: false,
  })
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Request() req: any,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<FindPaginated<IProject>> {
    return this.projectService.findAll(req.user, page, limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um projeto pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Projeto encontrado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Projeto não encontrado',
  })
  @UseGuards(JwtAuthGuard)
  async findById(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<IProject> {
    return await this.projectService.findById(req.user, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um projeto pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Projeto atualizado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Projeto não encontrado',
  })
  @UseGuards(JwtAuthGuard)
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateProjectDto,
  ): Promise<IProject> {
    return await this.projectService.update(id, dto, req.user);
  }

  @Put(':id/toggle-active')
  @ApiOperation({ summary: 'Ativar/Desativar um projeto' })
  @ApiResponse({
    status: 200,
    description: 'Projeto atualizado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Projeto não encontrado',
  })
  @UseGuards(JwtAuthGuard)
  async toggleActive(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<IProject> {
    return await this.projectService.toggleActive(id, req.user);
  }
}
