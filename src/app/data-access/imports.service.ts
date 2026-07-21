import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { AppConfig } from '../core/config/app-config';
import { ExecuteImportResponse, ImportError, ImportJob, ImportMapping, ImportPreview } from '../shared/domain/import';

/**
 * Wire shape of backend `ImportJobResponse` (GET /imports/active, GET /imports/{id}).
 * `errors` is a raw jsonb string on the wire — NOT an array — and must be parsed.
 */
interface ImportJobWire {
  id: string;
  fileName: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  errors: string | null;
}

function toImportJob(wire: ImportJobWire): ImportJob {
  let errors: ImportError[] = [];
  if (wire.errors) {
    try {
      errors = JSON.parse(wire.errors) as ImportError[];
    } catch {
      errors = [];
    }
  }
  return {
    id: wire.id,
    fileName: wire.fileName,
    totalRows: wire.totalRows,
    processedRows: wire.processedRows,
    successCount: wire.successCount,
    errorCount: wire.errorCount,
    status: wire.status as ImportJob['status'],
    createdAt: wire.createdAt,
    completedAt: wire.completedAt,
    errors,
  };
}

@Injectable({ providedIn: 'root' })
export class ImportsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${AppConfig.apiUrl}/api/v1/imports`;

  preview(file: File): Observable<ImportPreview> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ImportPreview>(`${this.base}/preview`, form);
  }

  execute(
    previewId: string,
    mapping: ImportMapping,
    fileName?: string,
  ): Observable<ExecuteImportResponse> {
    return this.http.post<ExecuteImportResponse>(this.base, {
      previewId,
      mapping,
      fileName: fileName ?? null,
    });
  }

  getById(id: string): Observable<ImportJob> {
    return this.http.get<ImportJobWire>(`${this.base}/${id}`).pipe(map(toImportJob));
  }

  /**
   * GET /imports/active — NOT `{ hasActive, importJob }`. The backend returns
   * 204 No Content (empty body → null) when there's no active/recent job, or
   * 200 with the ImportJobResponse body directly otherwise.
   */
  getActive(): Observable<ImportJob | null> {
    return this.http
      .get<ImportJobWire | null>(`${this.base}/active`)
      .pipe(map((wire) => (wire ? toImportJob(wire) : null)));
  }

  /**
   * CSV of the rows that failed to import — same builder as the ImportComplete
   * email attachment, so the file is byte-identical either way (UTF-8 BOM, correct
   * accents). Goes through HttpClient (not a bare <a href>) so the JWT interceptor
   * attaches the Bearer token; the caller must save the blob manually.
   */
  downloadErrorsCsv(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/errors.csv`, { responseType: 'blob' });
  }
}
