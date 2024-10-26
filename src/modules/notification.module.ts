import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationService } from 'src/services/notification.service';
import { MailModule } from './mail.module';
import { UserModule } from './user.module';
import { User, UserSchema } from 'src/schemas/user';
import { Form, FormSchema } from 'src/schemas/forms';
import { DailyModule } from './daily.module';
import { Tenant, TenantSchema } from 'src/schemas/tenant';
import { Project, ProjectSchema } from 'src/schemas/project';
import { Daily, DailySchema } from 'src/schemas/daily';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Form.name, schema: FormSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Daily.name, schema: DailySchema },
    ]),
    MailModule,
    UserModule,
    DailyModule,
  ],
  providers: [NotificationService],
})
export class NotificationModule {}
