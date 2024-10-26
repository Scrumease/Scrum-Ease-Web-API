import { Document, Types } from 'mongoose';
import { IBase } from './baseSchema.interface';
import { UserDocument } from '../user';

export interface ISession extends Document, IBase {
  readonly userId: Types.ObjectId | UserDocument;
  readonly refreshToken: string;
  readonly expiredAt: Date;
}