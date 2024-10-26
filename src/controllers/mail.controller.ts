import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { MailService } from '../services/mail.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/config/auth/guard/jwt.guard';
import { PermissionsGuard } from 'src/config/auth/guard/permission.guard';
import { PermissionsEnum } from 'src/enums/permissions.enum';
import { Permissions } from 'src/config/decorators/permissions.decorator';

@Controller('mail')
@ApiTags('mail')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MailController {
  constructor(private readonly emailService: MailService) {}

  @Post('invite')
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiResponse({
    status: 400,
    description: 'Sends an invitation email',
  })
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionsEnum.INVITE_USERS)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tos: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async sendEmail(@Body() dto: { tos: string[], roleName: string }, @Request() req) {
    await this.emailService.sendInviteEmail(dto.tos, dto.roleName, req.user);
    return;
  }
}
