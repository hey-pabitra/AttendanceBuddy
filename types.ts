
export type Status = 'P' | 'A' | 'MB' | 'NC';

export interface Period {
  subject: string;
  status: Status;
  remark: string;
}

export interface DayData {
  date: string;
  dayName: string;
  periods: Period[];
}

export interface SubjectStats {
  subject: string;
  total: number;
  present: number;
  absent: number;
  massBunk: number;
  percentage: number;
}

export interface GASResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export enum Action {
  GET_LAST_DATE = 'getLastDate',
  CHECK_ATTENDANCE = 'checkAttendance',
  SAVE_ATTENDANCE = 'saveAttendance',
  GET_SUBJECT_STATS = 'getSubjectStats'
}
