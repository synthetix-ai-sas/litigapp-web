export type ImportStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';
export type FileNumberMode = 'full' | 'compose';

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

export interface ImportPreview {
  previewId: string;
  columns: string[];
  rowCount: number;
  previewRows: Record<string, string>[];
}

/** v1 mapping: only radicado (required) + notes/alias (optional). All other fields null. */
export interface ImportMapping {
  fileNumberColumn: string | null;
  notesColumn: string | null;
  /** v2 compose fields — always null in v1 */
  filingYearColumn: string | null;
  cityColumn: string | null;
  courtColumn: string | null;
  consecutiveColumn: string | null;
  demandantColumn: string | null;
  demandadoColumn: string | null;
  aliasColumn: string | null;
}
