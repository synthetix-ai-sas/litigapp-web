import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  FileNumberMode,
  ImportActiveResponse,
  ImportJob,
  ImportMapping,
  ImportPreview,
} from '../shared/domain/import';

@Injectable({ providedIn: 'root' })
export class ImportsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/imports`;

  preview(file: File): Observable<ImportPreview> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ImportPreview>(`${this.base}/preview`, form);
  }

  execute(
    previewId: string,
    mapping: ImportMapping,
    fileNumberMode: FileNumberMode,
  ): Observable<{ importJobId: string }> {
    return this.http.post<{ importJobId: string }>(this.base, {
      previewId,
      mapping,
      fileNumberMode,
    });
  }

  getById(id: string): Observable<ImportJob> {
    return this.http.get<ImportJob>(`${this.base}/${id}`);
  }

  getActive(): Observable<ImportActiveResponse> {
    return this.http.get<ImportActiveResponse>(`${this.base}/active`);
  }
}
