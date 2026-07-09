export type ImportStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

/** One entry of the per-row error array backend stores as jsonb: [{row, radicado, code, message}, ...]. */
export interface ImportError {
  row: number;
  radicado?: string;
  code?: string;
  message: string;
}

/**
 * Matches backend ImportJobResponse (GET /imports/active, GET /imports/{id}).
 * `errors` here is the ALREADY-PARSED array — the wire format sends it as a raw
 * JSON string (`errors: string | null`); ImportsService parses it before this
 * type reaches the rest of the app. See ImportsService for the wire type.
 */
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
  rows: Record<string, string | null>[];
  totalRows: number;
}

/** Matches backend ColumnMappingRequest exactly — v1 has no other fields. */
export interface ImportMapping {
  radicadoCol: string;
  notesCol: string | null;
}
