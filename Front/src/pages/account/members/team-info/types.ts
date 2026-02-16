export interface TeamInfoData {
  commercialName: string;
  codeClient: string;
  address: string;
  country: string;
  department: string;
  accountManager: string;
  types: string[];
}

export type EditableField =
  | 'commercialName'
  | 'address'
  | 'country'
  | 'department'
  | 'accountManager'
  | 'types';

export type EditableStringField = Exclude<EditableField, 'types'>;
