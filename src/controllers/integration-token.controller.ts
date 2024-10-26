import {
    Body,
    Controller,
    Post,
    HttpCode,
    Ip,
    UseGuards,
    Request,
  } from '@nestjs/common';
  import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
  } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/config/auth/guard/jwt.guard';
import { IntegrationTokenService } from 'src/services/integration-token.service';
  
  @Controller('integration-token')
  @ApiTags('integration-token')
  @ApiBearerAuth()
  export class IntegrationTokenController {
    constructor(private readonly integrationTokenService: IntegrationTokenService) {}
  
    @Post('link-user')
    @ApiOperation({ summary: 'Linkar usuário' })
    @ApiResponse({
      status: 201,
      description: 'Usuário linkado com sucesso',
    })
    @ApiBody({ schema: { type: 'object', properties: { token: { type: 'string' }, applicationName: { type: 'string' } } } })
    @HttpCode(201)
    async linkUser(@Body() body:{token: string, applicationName: string}, @Ip() ip) {
        return this.integrationTokenService.linkUser(body.token, {applicationName: body.applicationName, requestIp: ip});
    }

    @Post('generate-token')
    @ApiOperation({ summary: 'Gerar token de integração' })
    @ApiResponse({
      status: 201,
      description: 'Token gerado com sucesso',
    })
    @HttpCode(201)
    @UseGuards(JwtAuthGuard)
    async generateIntegrationToken(@Request() req) {
        return this.integrationTokenService.generateIntegrationToken(req.user.userId);
    }
  }
  