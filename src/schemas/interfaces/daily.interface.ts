// import { Document, Types } from 'mongoose';
// import { IBase } from './baseSchema.interface';
// import { UserDocument } from '../user';
// import { TenantDocument } from '../tenant';

// interface IDailyEntry {
//   text: string;
//   project: string | null;
// }

// export interface IDaily extends Document, IBase {
//   readonly user: Types.ObjectId | UserDocument;
//   readonly tenant: Types.ObjectId | TenantDocument;
//   readonly yesterday: IDailyEntry[];
//   readonly today: IDailyEntry[];
//   readonly blockers: IDailyEntry[];
//   readonly date: Date;
// }

import { Types } from 'mongoose';
import { IBase } from './baseSchema.interface';
import { TenantDocument } from '../tenant';
import { UserDocument } from '../user';
import { IForm } from './form.interface';

interface IFormResponse {
  textQuestion: string;
  orderQuestion: number;
  answer: any;
  urgencyThreshold?: number;
}

export interface IDaily extends IBase {
  readonly userId: Types.ObjectId | UserDocument;
  readonly date: Date;
  readonly tenantId: Types.ObjectId | TenantDocument;
  readonly formSnapshot: IForm;
  readonly formResponses: IFormResponse[];
}
