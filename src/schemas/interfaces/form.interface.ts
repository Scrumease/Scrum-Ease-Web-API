import { Document, Types } from 'mongoose';
import { IBase } from './baseSchema.interface';
import { TenantDocument } from '../tenant';
import { ProjectDocument } from '../project';
import { UserDocument } from '../user';

interface IQuestion {
  text: string;
  answerType: 'text' | 'yes/no' | 'multiple choice';
  order: number;
  choices?: string[];
  advancedSettings: {
    urgencyRequired: boolean;
    urgencyRecipients: Types.ObjectId[] | UserDocument[];
    urgencyThreshold: number;
  };
}

export interface IForm extends Document, IBase {
  readonly tenantId: Types.ObjectId | TenantDocument;
  readonly projectId: Types.ObjectId | ProjectDocument;
  readonly questions: IQuestion[];
  readonly isCurrentForm: boolean;
  readonly notifyDays: string[];
  readonly notifyTime: string;
}
