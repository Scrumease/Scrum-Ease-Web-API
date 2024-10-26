import { Document, Types } from 'mongoose';
import { IBase } from './baseSchema.interface';

export interface ITenant extends Document, IBase {
  readonly identifier: string;
  readonly name: string;
  adminId: Types.ObjectId;
}