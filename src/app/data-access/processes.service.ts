import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AppConfig } from '../core/config/app-config';
import {
  PagedResult,
  ProcessDetail,
  ProcessListFilter,
  ProcessListItem,
} from '../shared/domain/process';

/** HTTP access to the processes endpoints. No state, no components. */
@Injectable({ providedIn: 'root' })
export class ProcessesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${AppConfig.apiUrl}/api/v1/processes`;

  listNovelties(page = 1, pageSize = 20): Observable<PagedResult<ProcessListItem>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<PagedResult<ProcessListItem>>(`${this.base}/novelties`, { params });
  }

  list(filter: ProcessListFilter): Observable<PagedResult<ProcessListItem>> {
    let params = new HttpParams()
      .set('page', filter.page ?? 1)
      .set('pageSize', filter.pageSize ?? 20);

    const add = (key: keyof ProcessListFilter) => {
      const value = filter[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    };
    add('courtName');
    add('fileNumber');
    add('subjectName');
    add('status');
    add('fromDate');
    add('toDate');
    add('attended');

    return this.http.get<PagedResult<ProcessListItem>>(this.base, { params });
  }

  getById(id: string): Observable<ProcessDetail> {
    return this.http.get<ProcessDetail>(`${this.base}/${id}`);
  }

  createFromFileNumber(fileNumber: string, alias?: string): Observable<ProcessDetail> {
    return this.http.post<ProcessDetail>(`${this.base}/full-number`, { fileNumber, alias });
  }

  createFromWizard(body: {
    cityId: string;
    courtId: string;
    filingYear: number;
    consecutive: string;
    alias?: string;
  }): Observable<ProcessDetail> {
    return this.http.post<ProcessDetail>(`${this.base}/wizard`, body);
  }

  markAttended(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/mark-attended`, null);
  }

  softDelete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  downloadPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/pdf`, { responseType: 'blob' });
  }
}
