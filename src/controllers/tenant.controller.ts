import { AuthService } from './../services/auth.service';
import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  Param,
  UseGuards,
  Put,
  Delete,
} from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { CreateTenantDto } from '../dtos/tenant/create-tenant.dto';
import { Tenant } from 'src/schemas/tenant';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/config/auth/guard/jwt.guard';
import { FindAllTenantsResponseDto } from 'src/dtos/tenant/find-all-response.dto';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
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
  async create(
    @Request() req,
    @Body() createTenantDto: CreateTenantDto,
  ): Promise<Tenant> {
    return this.tenantService.create(createTenantDto, req.user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Listar todas as organizações do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de organizações retornadas com sucesso.',
    type: Tenant,
  })
  async findAll(@Request() req): Promise<FindAllTenantsResponseDto[]> {
    return this.tenantService.findAll(req.user);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Sai de um tenant' })
  @ApiParam({ name: 'id', description: 'ID do tenant' })
  @ApiResponse({
    status: 200,
    description: 'Usuário saiu do tenant com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado.' })
  async leave(@Param('id') id: string, @Request() req): Promise<void> {
    await this.tenantService.leave(id, req.user);
  }
}
