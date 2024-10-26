import { Module } from '@nestjs/common';
import { MailService } from '../services/mail.service';
import { MailController } from '../controllers/mail.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { join } from 'path';
import { InviteModule } from './invite.module';
import { UserModule } from './user.module';
import { ConfigService } from '@nestjs/config';
import { RoleModule } from './role.module';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: config.get('MAIL_PORT'),
          secure: false,
          auth: {
            user: config.get('SMTP_USERNAME'),
            pass: config.get('SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: `"No Reply" <${config.get('SMTP_USERNAME')}>`,
        },
        template: {
          dir: join(__dirname, '..', 'src', 'templates'),
          adapter: new EjsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
      inject: [ConfigService],
    }),
    InviteModule,
    UserModule,
    RoleModule,
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
