import { Prop, Schema } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { UserDocument } from './user';
import { TenantDocument } from './tenant';
import { BaseSchema, createSchema } from './baseSchema';
import { Form, FormDocument } from './forms';

export type DailyDocument = HydratedDocument<Daily>;

@Schema()
export class Daily extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId | UserDocument;

  @Prop({ type: String, required: true })
  date: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId | TenantDocument;

  @Prop({ type: Form, required: true })
  formSnapshot: FormDocument;

  @Prop({
    type: [
      {
        textQuestion: { type: String, required: true },
        orderQuestion: { type: Number, required: true },
        answer: { type: SchemaTypes.Mixed, required: true },
        urgencyThreshold: { type: Number, required: false },
      },
    ],
    required: true,
  })
  formResponses: Array<{
    textQuestion: string;
    orderQuestion: number;
    answer: any;
    urgencyThreshold?: number;
  }>;
}

export const DailySchema = createSchema(Daily);
