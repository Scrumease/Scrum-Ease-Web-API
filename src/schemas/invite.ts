import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { BaseSchema, createSchema } from './baseSchema';
import { TenantDocument } from './tenant';
import { RoleDocument } from './role';

export type InviteDocument = HydratedDocument<Invite>;

@Schema()
export class Invite extends BaseSchema {
  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: Date, required: true })
  validity: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId | TenantDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Role', required: true })
  roleId: Types.ObjectId | RoleDocument;

  @Prop({ type: Boolean, default: false })
  newUser: boolean;
}

export const InviteSchema = createSchema(Invite);
