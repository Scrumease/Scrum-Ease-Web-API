import { Document, Types } from 'mongoose';
import { IBase } from './baseSchema.interface';
import { TenantDocument } from '../tenant';
import { UserDocument } from '../user';

export interface IProject extends Document, IBase {
  readonly name: string;
  readonly tenantId: Types.ObjectId | TenantDocument;
  readonly users: Types.ObjectId[] | UserDocument[];
  readonly isActive: boolean;
  readonly description?: string;
}
