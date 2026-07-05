import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AppConfig } from '../core/config/app-config';
import {
  ImportActiveResponse,
  ImportJob,
  ImportMapping,
  ImportPreview,
} from '../shared/domain/import';

@Injectable({ providedIn: 'root' })
export class ImportsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${AppConfig.apiUrl}/api/v1/imports`;

  preview(file: File): Observable<ImportPreview> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ImportPreview>(`${this.base}/preview`, form);
  }

  /** v1: radicado-first — fileNumberMode is always 'full'. */
  execute(previewId: string, mapping: ImportMapping): Observable<{ importJobId: string }> {
    return this.http.post<{ importJobId: string }>(this.base, {
      previewId,
      mapping,
      fileNumberMode: 'full',
    });
  }

  getById(id: string): Observable<ImportJob> {
    return this.http.get<ImportJob>(`${this.base}/${id}`);
  }

  getActive(): Observable<ImportActiveResponse> {
    return this.http.get<ImportActiveResponse>(`${this.base}/active`);
  }

  /** Download errors as CSV blob for the completion popup. */
  downloadErrorsCsv(jobId: string): Observable<Blob> {
    return this.http.get(`${this.base}/${jobId}/errors`, { responseType: 'blob' });
  }
}
