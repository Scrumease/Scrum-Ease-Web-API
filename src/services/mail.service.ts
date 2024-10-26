import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { InviteService } from './invite.service';
import { UserService } from './user.service';
import { RoleService } from './role.service';
import { jwtPayload } from 'src/config/auth/strategy/jwt.strategy';
import { sendRemindEmailDto } from 'src/dtos/notification/sendRemindEmail.dto';
import { ResponseDaily } from 'src/dtos/daily/anwser.dto';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly inviteService: InviteService,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  async sendInviteEmail(
    emails: string[],
    roleName: string,
    currentUser: jwtPayload,
  ) {
    const organizationId = currentUser.currentTenant.tenantId;
    const role = await this.roleService.findByName(currentUser, roleName);
    for (const email of emails) {
      const user = await this.userService.findByEmailAndTenant(
        email,
        organizationId,
      );
      if (user) {
        continue;
      }

      const token = await this.inviteService.generateInvite(
        email,
        organizationId,
        role,
      );
      const acceptUrl = `${process.env.FRONTEND_URL}/invite?token=${token}&email=${email}&tenant=${organizationId}`;
      await this.sendEmail(email, 'Invite', 'invite', { acceptUrl, email });
    }
  }

  async sendRemindEmail(dto: sendRemindEmailDto) {
    await this.sendEmail(
      dto.user.email,
      'Lembrete da Daily',
      'daily_reminder',
      {
        userName: dto.user.name,
        tenantName: dto.tenantName,
        projectName: dto.projectName,
        frontendUrl: process.env.FRONTEND_URL,
      },
    );
  }

  async notifyUrgent(
    tos: string[],
    dto: {
      user: {
        name: string;
        email: string;
      };
      tenantName: string;
      projectName: string;
      responses: ResponseDaily[];
    },
  ) {
    await this.sendEmail(
      tos,
      'Notificação da sobre a daiy de ' + dto.user.name,
      'urgent_notify_daily',
      dto,
    );
  }

  async sendEmail(
    to: string | string[],
    subject: string,
    template: string,
    context: any,
  ) {
    const recipients = Array.isArray(to) ? to.join(', ') : to;
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      `${template}.ejs`,
    );

    await this.mailerService.sendMail({
      to: recipients,
      subject,
      template: templatePath,
      context,
    });
  }
}
