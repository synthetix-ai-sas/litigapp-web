import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../core/config/app-config';
import type { AuthTokensDto } from '../shared/domain/user.types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  whatsAppPhone?: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
}

export interface RefreshRequest {
  accessToken: string;
  refreshToken: string;
}

export interface ConfirmPasswordResetRequest {
  uid: string;
  token: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AuthDataAccessService {
  private readonly http = inject(HttpClient);
  private readonly base = `${AppConfig.apiUrl}/api/v1/auth`;

  login(body: LoginRequest): Observable<AuthTokensDto> {
    return this.http.post<AuthTokensDto>(`${this.base}/login`, body);
  }

  register(body: RegisterRequest): Observable<AuthTokensDto> {
    return this.http.post<AuthTokensDto>(`${this.base}/register`, body);
  }

  refresh(body: RefreshRequest): Observable<AuthTokensDto> {
    return this.http.post<AuthTokensDto>(`${this.base}/refresh`, body);
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(`${this.base}/password-reset/request`, { email });
  }

  confirmPasswordReset(body: ConfirmPasswordResetRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/password-reset/confirm`, body);
  }
}
