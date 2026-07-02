import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AppConfig } from '../core/config/app-config';
import { City, CourtItem, Department, Specialty } from '../shared/domain/catalog';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${AppConfig.apiUrl}/api/v1/catalog`;

  listDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.base}/departments`);
  }

  listCities(departmentId: string): Observable<City[]> {
    return this.http.get<City[]>(`${this.base}/departments/${departmentId}/cities`);
  }

  listSpecialties(): Observable<Specialty[]> {
    return this.http.get<Specialty[]>(`${this.base}/specialties`);
  }

  listCourts(cityId: string, specialtyId?: string): Observable<CourtItem[]> {
    let params = new HttpParams();
    if (specialtyId) params = params.set('specialtyId', specialtyId);
    return this.http.get<CourtItem[]>(`${this.base}/cities/${cityId}/courts`, { params });
  }
}
