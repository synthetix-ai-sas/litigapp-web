export type ImportStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

export interface ImportError {
  row: number;
  message: string;
}

export interface ImportJob {
  id: string;
  fileName: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  status: ImportStatus;
  errors: ImportError[];
  createdAt: string;
  completedAt: string | null;
}

export interface ImportActiveResponse {
  hasActive: boolean;
  importJob: ImportJob | null;
}

export interface ExecuteImportResponse {
  importJobId: string;
  status: string;
}

export interface ImportColumn {
  key: string;
  header: string | null;
}

export interface ImportPreview {
  previewId: string;
  columns: ImportColumn[];
  rows: Record<string, string>[];
  totalRows: number;
}

/** Matches backend ColumnMappingRequest exactly — v1 has no other fields. */
export interface ImportMapping {
  radicadoCol: string;
  notesCol: string | null;
}
