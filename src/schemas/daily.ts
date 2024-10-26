// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
// import { BaseSchema, createSchema } from './baseSchema';
// import { UserDocument } from './user';
// import { TenantDocument } from './tenant';

// export type DailyDocument = HydratedDocument<Daily>;

// class DailyEntry {
//   @Prop({ type: String, required: true })
//   text: string;

//   @Prop({ type: String, required: false })
//   project: string | null;
// }

// @Schema()
// export class Daily extends BaseSchema {
//   @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
//   user: Types.ObjectId | UserDocument;

//   @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true })
//   tenant: Types.ObjectId | TenantDocument;

//   @Prop([{ type: DailyEntry, required: true }])
//   yesterday: DailyEntry[];

//   @Prop([{ type: DailyEntry, required: true }])
//   today: DailyEntry[];

//   @Prop([{ type: DailyEntry, required: false }])
//   blockers: DailyEntry[];

//   @Prop({ type: Date, required: true })
//   date: Date;
// }

// export const DailySchema = createSchema(Daily);

// DailySchema.index({ user: 1, tenant:1, date: 1 }, { unique: true });

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
