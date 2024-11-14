import {
  Controller,
  Request,
  Post,
  UseGuards,
  Body,
  HttpCode,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/config/auth/guard/jwt.guard';
import { LocalAuthGuard } from 'src/config/auth/guard/local.guard';
import { jwtPayload } from 'src/config/auth/strategy/jwt.strategy';
import { RegisterAdminDto } from 'src/dtos/auth/register-admin.dto';
import { RegisterUserDto } from 'src/dtos/auth/register-user.dto';
import { verifyInviteTokenDto } from 'src/dtos/auth/verify.dto';
import { IUser } from 'src/schemas/interfaces/user.interface';
import { AuthService } from 'src/services/auth.service';
import { InviteService } from 'src/services/invite.service';
import { MailService } from 'src/services/mail.service';
import { UserService } from 'src/services/user.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly inviteService: InviteService,
  ) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Realiza login do usuário' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'john.doe@example.com' },
        password: { type: 'string', example: 'strongPassword123' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'token gerado com sucesso',
  })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register-admin')
  @ApiOperation({ summary: 'Criar um novo administrador' })
  @ApiBody({
    type: RegisterAdminDto,
    examples: {
      example1: {
        summary: 'Exemplo de criação de administrador',
        value: {
          tenantName: 'My Organization',
          tenantIdentifier: '123.456.789-00',
          adminName: 'John Doe',
          adminEmail: 'Admin',
          password: 'strongPassword123',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Administrador criado com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Requisição inválida.' })
  async createAdmin(
    @Body() registerAdminDto: RegisterAdminDto,
  ): Promise<IUser> {
    return this.userService.createAdmin(registerAdminDto);
  }

  @Post('register-by-invite/:tenantId')
  @ApiParam({ name: 'tenantId', example: '669f02354355439b28784a2d' })
  @ApiOperation({ summary: 'Criar um novo usuário' })
  @ApiBody({
    type: RegisterUserDto,
    examples: {
      example1: {
        summary: 'Exemplo de criação de usuário',
        value: {
          tenantId: '669f02354355439b28784a2d',
          name: 'John Doe',
          userEmail: 'joehdoe@gmail.com',
          token: 'token',
          password: 'strongPassword123',
          country: 'Brazil',
          state: 'São Paulo',
          city: 'São Paulo',
          timezone: {
            value: 'America/Sao_Paulo',
            offset: -3,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Requisição inválida.' })
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @Param('tenantId') tenantId: string,
  ): Promise<IUser> {
    return this.userService.registerByInvite(registerUserDto, tenantId);
  }

  @Post('register-by-invite/:tenantId/:email')
  @ApiParam({
    name: 'example1',
    example: {
      tenantId: '669f02354355439b28784a2d',
      email: 'joedoe@gmail.com',
    },
  })
  @ApiOperation({ summary: 'Criar um novo usuário' })
  @HttpCode(200)
  async addOrganizationByInvite(
    @Param('tenantId') tenantId: string,
    @Param('email') email: string,
  ) {
    return this.userService.addOrganizationByInvite(email, tenantId);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Atualiza o JWT token com base no Refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(@Request() req) {
    const token = req.headers.authorization.split(' ')[1];
    await this.authService.logout(req.user.userId, token);
  }

  @Post('verify-invite-token')
  @ApiOperation({ summary: 'Verifica se o token de convite é válido' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'token' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token válido',
  })
  @ApiResponse({ status: 400, description: 'Token inválido' })
  async verifyInviteToken(@Body('verifyDto') dto: verifyInviteTokenDto) {
    return this.inviteService.verifyInviteToken(
      dto.token,
      dto.email,
      dto.tenantId,
    );
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicita a recuperação de senha' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: '' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Email enviado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Email inválido' })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reseta a senha do usuário' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: '' },
        password: { type: 'string', example: '' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Token inválido' })
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
    @Body('email') email: string,
    @Body('validity') validity: string,
  ) {
    return this.authService.resetPassword(token, password, email, validity);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Altera a senha do usuário' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        oldPassword: { type: 'string', example: '' },
        newPassword: { type: 'string', example: '' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Senha inválida' })
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req,
    @Body('currentPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.changePassword(
      oldPassword,
      newPassword,
      (req.user as jwtPayload).userId,
    );
  }
}
