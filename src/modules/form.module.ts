import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FormController } from 'src/controllers/form.controller';
import { Form, FormSchema } from 'src/schemas/forms';
import { Project, ProjectSchema } from 'src/schemas/project';
import { FormService } from 'src/services/form.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Form.name, schema: FormSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [FormController],
  providers: [FormService],
})
export class FormModule {}
