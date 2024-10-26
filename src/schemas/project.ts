import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { BaseSchema, createSchema } from './baseSchema';
import { Tenant, TenantDocument } from './tenant';
import { User, UserDocument } from './user';

export type ProjectDocument = HydratedDocument<Project>;

@Schema()
export class Project extends BaseSchema {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Boolean, required: true, default: true })
  isActive: boolean;

  @Prop({ type: String, required: false })
  description?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: Tenant.name, required: true })
  tenantId: Types.ObjectId | TenantDocument;

  @Prop([{ type: SchemaTypes.ObjectId, ref: User.name }])
  users: Types.ObjectId[] | UserDocument[];
}

export const ProjectSchema = createSchema(Project);
ProjectSchema.index({ name: 1, tenantId: 1 }, { unique: true });