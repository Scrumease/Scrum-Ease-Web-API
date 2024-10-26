import { Document, Types } from 'mongoose';
import { IBase } from './baseSchema.interface';
import { TenantDocument } from '../tenant';
import { RoleDocument } from '../role';

export interface IInvite extends Document, IBase {
  readonly email: string;
  readonly validity: Date;
  readonly tenantId: Types.ObjectId | TenantDocument;
  readonly roleId: Types.ObjectId | RoleDocument;
}
