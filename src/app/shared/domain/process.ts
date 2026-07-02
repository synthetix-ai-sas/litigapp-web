/** Contracts mirroring the backend DTOs (blueprint §5). */

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProcessListItem {
  id: string;
  fileNumber: string;
  alias: string | null;
  currentStatus: string | null;
  lastCourtActionAt: string | null;
  courtName: string | null;
  attended: boolean;
}

export interface CourtSummary {
  id: string;
  name: string;
  cityName: string | null;
  departmentName: string | null;
}

export interface ProcessSubject {
  type: string;
  name: string;
  identification: string | null;
  isSummoned: boolean;
}

export interface ProcessAction {
  id: string;
  consecutiveNumber: number;
  actionDate: string | null;
  action: string | null;
  annotation: string | null;
  termStartDate: string | null;
  termEndDate: string | null;
  groupedWithId: string | null;
}

export type SyncStatus = 'ok' | 'partial' | 'pending' | 'error' | 'not_found' | 'blocked';

export interface ProcessDetail {
  id: string;
  fileNumber: string;
  alias: string | null;
  court: CourtSummary | null;
  filingYear: number | null;
  processType: string | null;
  processClass: string | null;
  judgeName: string | null;
  currentStatus: string | null;
  lastCourtActionAt: string | null;
  attended: boolean;
  syncStatus: SyncStatus;
  syncPhase: string;
  canDownloadPdf: boolean;
  subjects: ProcessSubject[];
  actions: ProcessAction[];
}

export interface ProcessListFilter {
  page?: number;
  pageSize?: number;
  courtName?: string;
  fileNumber?: string;
  subjectName?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  attended?: boolean;
}
