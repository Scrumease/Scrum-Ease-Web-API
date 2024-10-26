import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { BaseSchema, createSchema } from './baseSchema';
import { RoleDocument } from './role';
import { TenantDocument } from './tenant';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User extends BaseSchema {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, default: false })
  country: string;

  @Prop({ type: String, default: false })
  state: string;

  @Prop({ type: String, default: false })
  city: string;

  @Prop({
    type: {
      value: { type: String, required: true },
      offset: { type: Number, required: true },
    },
  })
  timezone: {
    value: string;
    offset: number;
  };

  @Prop([
    {
      tenant: { type: SchemaTypes.ObjectId, ref: 'Tenant', required: true },
      role: { type: SchemaTypes.ObjectId, ref: 'Role', required: true },
    },
  ])
  tenantRoles: {
    tenant: Types.ObjectId | TenantDocument;
    role: Types.ObjectId | RoleDocument;
  }[];
}

export const UserSchema = createSchema(User);

UserSchema.index({ email: 1, 'tenantRoles.tenant': 1 }, { unique: true });

// UserSchema.methods.toJSON = function () {
//   const user = this.toObject();
//   delete user.password;
//   return user;
// };
