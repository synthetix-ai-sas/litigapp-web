export type ImportStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';
export type FileNumberMode = 'full' | 'compose';

export interface ImportJob {
  id: string;
  fileName: string;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  status: ImportStatus;
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

export interface ImportMapping {
  fileNumberColumn: string | null;
  filingYearColumn: string | null;
  cityColumn: string | null;
  courtColumn: string | null;
  consecutiveColumn: string | null;
  demandantColumn: string | null;
  demandadoColumn: string | null;
  aliasColumn: string | null;
}
