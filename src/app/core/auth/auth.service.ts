import { Injectable, computed, signal } from '@angular/core';

/**
 * TEMPORARY auth stub (Persona B).
 *
 * Owns only token storage + auth state so the dashboard can run and call the
 * backend behind the JwtInterceptor. The real auth flow (login/register/refresh
 * screens + AuthService) is task 2.A (Cristian). When 2.A lands, this is replaced.
 *
 * Coordinated contract to keep the swap clean:
 *   - public surface: `token()`, `isAuthenticated()`, `setToken()`, `logout()`
 *   - storage key:    'litigapp.accessToken'
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly StorageKey = 'litigapp.accessToken';

  private readonly _token = signal<string | null>(this.readToken());

  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  setToken(token: string | null): void {
    if (token) {
      localStorage.setItem(AuthService.StorageKey, token);
    } else {
      localStorage.removeItem(AuthService.StorageKey);
    }
    this._token.set(token);
  }

  logout(): void {
    this.setToken(null);
  }

  private readToken(): string | null {
    try {
      return localStorage.getItem(AuthService.StorageKey);
    } catch {
      return null;
    }
  }
}
