import { Document, Types } from 'mongoose';
import { IBase } from './baseSchema.interface';
import { RoleDocument } from '../role';
import { TenantDocument } from '../tenant';

export interface IUser extends Document, IBase {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly country: string;
  readonly state: string;
  readonly city: string;
  readonly timezone: {
    value: string;
    offset: number;
  };
  readonly tenantRoles: { tenant: Types.ObjectId | TenantDocument, role: Types.ObjectId | RoleDocument }[];
}