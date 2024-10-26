import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { BaseSchema, createSchema } from './baseSchema';
import { PermissionsEnum } from 'src/enums/permissions.enum';

export type RoleDocument = HydratedDocument<Role>;

@Schema()
export class Role extends BaseSchema {
  @Prop({ type: String, required: true })
  name: string;

  @Prop([{ type: String, required: true }])
  permissions: PermissionsEnum[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;
}

export const RoleSchema = createSchema(Role);