import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyController } from 'src/controllers/daily.controller';
import { Daily, DailySchema } from 'src/schemas/daily';
import { Form, FormSchema } from 'src/schemas/forms';
import { User, UserSchema } from 'src/schemas/user';
import { DailyService } from 'src/services/daily.service';
import { MailModule } from './mail.module';
import { Project, ProjectSchema } from 'src/schemas/project';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Daily.name, schema: DailySchema },
      { name: User.name, schema: UserSchema },
      { name: Form.name, schema: FormSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    MailModule,
  ],
  providers: [DailyService],
  exports: [DailyService],
  controllers: [DailyController],
})
export class DailyModule {}
