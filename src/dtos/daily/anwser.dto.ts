export interface ResponseDaily {
  answer: string | string[] | boolean;
  orderQuestion: number;
  textQuestion: string;
  urgencyThreshold?: number;
}

export interface AnwserDailyDto {
  date: string;
  formId: string;
  formResposes: ResponseDaily[];
}
