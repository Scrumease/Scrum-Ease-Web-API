import { Prop, Schema } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';
import { BaseSchema, createSchema } from './baseSchema';

export type IntegrationTokenDocument = HydratedDocument<IntegrationToken>;

@Schema()
export class IntegrationToken extends BaseSchema {
  @Prop({ type: String, required: true, unique: true })
  token: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true },)
  userId: string;

  @Prop({ type: String, default: null})
  applicationName: string;

  @Prop({ type: String, default: null})
  requestIp: string;

  @Prop({ type: Boolean, default: false})
  isRevoked: boolean;
}

export const IntegrationTokenSchema = createSchema(IntegrationToken);
