import { Module } from '@nestjs/common';
import { TenantModule } from './modules/tenant.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user.module';
import { RoleModule } from './modules/role.module';
import { AuthModule } from './modules/auth.module';
import { MailModule } from './modules/mail.module';
import { InviteModule } from './modules/invite.module';
import { DailyModule } from './modules/daily.module';
import { IntegrationTokenModule } from './modules/integration-token.module';
import { ProjectModule } from './modules/project.module';
import { FormModule } from './modules/form.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from './modules/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    TenantModule,
    UserModule,
    RoleModule,
    AuthModule,
    MailModule,
    InviteModule,
    DailyModule,
    IntegrationTokenModule,
    ProjectModule,
    FormModule,
    NotificationModule,
  ],
})
export class AppModule {}
