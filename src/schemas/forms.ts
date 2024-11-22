import { Prop, Schema } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { BaseSchema, createSchema } from './baseSchema';
import { TenantDocument } from './tenant';
import { Project, ProjectDocument } from './project';
import { UserDocument } from './user';

export type FormDocument = HydratedDocument<Form>;

@Schema()
export class Form extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId | TenantDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: Project.name, required: true })
  projectId: Types.ObjectId | ProjectDocument;

  @Prop({
    type: [
      {
        text: { type: String, required: true },
        answerType: {
          type: String,
          enum: ['text', 'yes/no', 'multiple choice'],
          required: true,
        },
        order: { type: Number, required: true },
        choices: {
          type: [String],
          required: function () {
            return this.answerType === 'multiple choice';
          },
        },
        advancedSettings: {
          urgencyRequired: { type: Boolean, default: false },
          urgencyRecipients: [{ type: SchemaTypes.ObjectId, ref: 'User' }],
          urgencyThreshold: { type: Number, min: 0, max: 10, default: 0 },
        },
        dependencies: {
          questionTitle: { type: String },
          expectedAnswer: { type: String },
        },
      },
    ],
    required: true,
  })
  questions: Array<{
    text: string;
    answerType: 'text' | 'yes/no' | 'multiple choice';
    order: number;
    choices?: string[];
    advancedSettings: {
      urgencyRequired: boolean;
      urgencyRecipients: Types.ObjectId[] | UserDocument[];
      urgencyThreshold: number;
    };
    dependencies?: {
      questionTitle: string;
      expectedAnswer: string;
    };
  }>;

  @Prop({ type: Boolean, default: false })
  isCurrentForm: boolean;

  @Prop({ type: [String], required: true })
  notifyDays: string[];

  @Prop({ type: String, required: true })
  notifyTime: string;
}

export const FormSchema = createSchema(Form);
