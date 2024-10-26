import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { CreateTenantDto } from '../dtos/tenant/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/tenant/update-tenant.dto';
import { Tenant } from 'src/schemas/tenant';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo tenant' })
  @ApiBody({
    type: CreateTenantDto,
    examples: {
      example1: {
        summary: 'Exemplo de criação de tenant',
        value: {
          name: 'TechCorp',
          domain: 'techcorp.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant criado com sucesso.',
    type: Tenant,
  })
  @ApiResponse({ status: 400, description: 'Requisição inválida.' })
  async create(@Body() createTenantDto: CreateTenantDto): Promise<Tenant> {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os tenants' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tenants retornada com sucesso.',
    type: [Tenant],
  })
  async findAll(): Promise<Tenant[]> {
    return this.tenantService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um tenant pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant retornado com sucesso.',
    type: Tenant,
  })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado.' })
  async findOne(@Param('id') id: string): Promise<Tenant> {
    return this.tenantService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um tenant pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do tenant' })
  @ApiBody({
    type: UpdateTenantDto,
    examples: {
      example1: {
        summary: 'Exemplo de atualização de tenant',
        value: {
          name: 'TechCorp Updated',
          domain: 'techcorpupdated.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant atualizado com sucesso.',
    type: Tenant,
  })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado.' })
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<Tenant> {
    return this.tenantService.update(id, updateTenantDto);
  }
}
