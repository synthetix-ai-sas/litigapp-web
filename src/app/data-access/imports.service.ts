import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AppConfig } from '../core/config/app-config';
import {
  ExecuteImportResponse,
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
    return this.http.get<ImportJob>(`${this.base}/${id}`);
  }

  getActive(): Observable<ImportActiveResponse> {
    return this.http.get<ImportActiveResponse>(`${this.base}/active`);
  }
}
