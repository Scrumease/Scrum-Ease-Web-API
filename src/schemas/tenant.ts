import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { BaseSchema, createSchema } from './baseSchema';

export type TenantDocument = HydratedDocument<Tenant>;

// TODO: salvar dono da organização 
@Schema()
export class Tenant extends BaseSchema {
  @Prop({ unique: true })
  name: string;

  @Prop({ unique: true })
  identifier: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: false })
  adminId: Types.ObjectId; 
}

export const TenantSchema = createSchema(Tenant);