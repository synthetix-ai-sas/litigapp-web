import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TokenStorageService } from './token-storage.service';
import { AuthDataAccessService } from '../../data-access/auth.service';
import type { AuthTokensDto, User } from '../../shared/domain/user.types';

interface JwtPayload {
  sub: string;
  email: string;
  name?: string;
  fullName?: string;
  role?: string;
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(TokenStorageService);
  private readonly authData = inject(AuthDataAccessService);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<User | null>(this.storage.getUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());

  private _refreshPromise: Promise<boolean> | null = null;

  async login(email: string, password: string): Promise<void> {
    try {
      const tokens = await firstValueFrom(this.authData.login({ email, password }));
      this._applySession(tokens);
    } catch (err) {
      throw this._toError(err, 'Error al iniciar sesión. Por favor intenta de nuevo.');
    }
  }

  async register(fullName: string, email: string, password: string): Promise<void> {
    try {
      const tokens = await firstValueFrom(this.authData.register({ fullName, email, password }));
      this._applySession(tokens);
    } catch (err) {
      throw this._toError(err, 'Error al crear la cuenta. Por favor intenta de nuevo.');
    }
  }

  async tryRefresh(): Promise<boolean> {
    if (this._refreshPromise) {
      return this._refreshPromise;
    }

    this._refreshPromise = this._doRefresh().finally(() => {
      this._refreshPromise = null;
    });

    return this._refreshPromise;
  }

  logout(): void {
    this.storage.clearSession();
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private async _doRefresh(): Promise<boolean> {
    const accessToken = this.storage.getAccessToken();
    const refreshToken = this.storage.getRefreshToken();
    if (!refreshToken || !accessToken) return false;

    try {
      const tokens = await firstValueFrom(
        this.authData.refresh({ accessToken, refreshToken }),
      );
      this._applySession(tokens);
      return true;
    } catch {
      this.storage.clearSession();
      this._currentUser.set(null);
      return false;
    }
  }

  private _applySession(tokens: AuthTokensDto): void {
    const user = this._decodeUser(tokens.accessToken);
    this.storage.saveSession(tokens.accessToken, tokens.refreshToken, user);
    this._currentUser.set(user);
  }

  private _decodeUser(token: string): User {
    try {
      const payloadB64 = token.split('.')[1];
      const decoded = JSON.parse(
        atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')),
      ) as JwtPayload;
      return {
        id: decoded.sub,
        email: decoded.email,
        fullName: decoded.fullName ?? decoded.name ?? decoded.email,
      };
    } catch {
      return { id: '', email: '', fullName: '' };
    }
  }

  /** Extracts the user-facing message from a ProblemDetails error or re-throws as-is. */
  private _toError(err: unknown, fallback: string): Error {
    if (err instanceof HttpErrorResponse) {
      const detail: string | undefined = err.error?.detail ?? err.error?.title;
      return new Error(detail ?? fallback);
    }
    return err instanceof Error ? err : new Error(fallback);
  }
}
