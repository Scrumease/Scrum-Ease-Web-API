import { Document, Types } from 'mongoose';
import { IBase } from './baseSchema.interface';
import { PermissionsEnum } from 'src/enums/permissions.enum';

export interface IRole extends Document, IBase {
  readonly name: string;
  readonly permissions: PermissionsEnum[];
  readonly tenantId: Types.ObjectId;
}