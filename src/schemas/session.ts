import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { BaseSchema, createSchema } from './baseSchema';

export type SessionDocument = HydratedDocument<Session>;

@Schema()
export class Session extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  refreshToken: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const SessionSchema = createSchema(Session);
