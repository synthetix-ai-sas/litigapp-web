import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { AuthDataAccessService } from '../../data-access/auth.service';
import type { AuthTokensDto, User } from '../../shared/domain/user.types';

function makeJwt(payload: Record<string, unknown>): string {
  const b64url = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64url({ alg: 'HS256' })}.${b64url(payload)}.fakesig`;
}

function makeTokens(payload: Record<string, unknown>, rt = 'rt-1'): AuthTokensDto {
  return { accessToken: makeJwt(payload), refreshToken: rt, expiresInSeconds: 900 };
}

const ALICE: User = { id: 'u1', email: 'alice@law.co', fullName: 'Alice Smith' };

describe('AuthService', () => {
  let service: AuthService;
  let tokenStorage: jasmine.SpyObj<TokenStorageService>;
  let authData: jasmine.SpyObj<AuthDataAccessService>;
  let router: jasmine.SpyObj<Router>;

  function setup(storedUser: User | null = null): void {
    tokenStorage = jasmine.createSpyObj<TokenStorageService>('TokenStorageService', [
      'getAccessToken',
      'getRefreshToken',
      'getUser',
      'saveSession',
      'updateTokens',
      'clearSession',
      'hasSession',
    ]);
    tokenStorage.getUser.and.returnValue(storedUser);

    authData = jasmine.createSpyObj<AuthDataAccessService>('AuthDataAccessService', [
      'login',
      'register',
      'refresh',
      'requestPasswordReset',
      'confirmPasswordReset',
    ]);

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: TokenStorageService, useValue: tokenStorage },
        { provide: AuthDataAccessService, useValue: authData },
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(AuthService);
  }

  beforeEach(() => setup());

  // ──────────────────────────────────────────────────
  // Initial state
  // ──────────────────────────────────────────────────

  describe('initial state', () => {
    it('is unauthenticated when storage is empty', () => {
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.currentUser()).toBeNull();
    });

    it('restores an authenticated session from storage', () => {
      TestBed.resetTestingModule();
      setup(ALICE);

      expect(service.isAuthenticated()).toBeTrue();
      expect(service.currentUser()).toEqual(ALICE);
    });
  });

  // ──────────────────────────────────────────────────
  // login()
  // ──────────────────────────────────────────────────

  describe('login()', () => {
    it('sets authenticated and saves session after success', async () => {
      const tokens = makeTokens({ sub: 'u1', email: 'alice@law.co', fullName: 'Alice Smith' });
      authData.login.and.returnValue(of(tokens));

      await service.login('alice@law.co', 'secret');

      expect(service.isAuthenticated()).toBeTrue();
      expect(service.currentUser()?.email).toBe('alice@law.co');
      expect(tokenStorage.saveSession).toHaveBeenCalledWith(
        tokens.accessToken,
        tokens.refreshToken,
        jasmine.objectContaining({ email: 'alice@law.co' }),
      );
    });

    it('falls back to email as fullName when JWT has no name claims', async () => {
      const tokens = makeTokens({ sub: 'u2', email: 'no-name@law.co' });
      authData.login.and.returnValue(of(tokens));

      await service.login('no-name@law.co', 'secret');

      expect(service.currentUser()?.fullName).toBe('no-name@law.co');
    });

    it('uses name claim when fullName is absent', async () => {
      const tokens = makeTokens({ sub: 'u3', email: 'x@x.co', name: 'Carlos' });
      authData.login.and.returnValue(of(tokens));

      await service.login('x@x.co', 'secret');

      expect(service.currentUser()?.fullName).toBe('Carlos');
    });

    it('throws with the detail message from a 401 ProblemDetails response', async () => {
      const httpError = new HttpErrorResponse({
        status: 401,
        error: { title: 'Authentication failed.', detail: 'Invalid credentials' },
      });
      authData.login.and.returnValue(throwError(() => httpError));

      await expectAsync(service.login('a@b.co', 'wrong')).toBeRejectedWithError('Invalid credentials');
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('throws a fallback message when the HTTP error has no detail', async () => {
      const httpError = new HttpErrorResponse({ status: 500, error: {} });
      authData.login.and.returnValue(throwError(() => httpError));

      await expectAsync(service.login('a@b.co', 'pw')).toBeRejectedWithError(
        'Error logging in. Please try again.',
      );
    });

    it('handles a malformed JWT gracefully (empty user, no crash)', async () => {
      const tokens: AuthTokensDto = { accessToken: 'not.a.jwt', refreshToken: 'rt', expiresInSeconds: 900 };
      authData.login.and.returnValue(of(tokens));

      await service.login('a@b.co', 'secret');

      expect(service.currentUser()).toEqual({ id: '', email: '', fullName: '' });
    });
  });

  // ──────────────────────────────────────────────────
  // register()
  // ──────────────────────────────────────────────────

  describe('register()', () => {
    it('applies session directly from the tokens returned by register (no second login call)', async () => {
      const tokens = makeTokens({ sub: 'u5', email: 'new@law.co', fullName: 'New User' });
      authData.register.and.returnValue(of(tokens));

      await service.register('New User', 'new@law.co', 'Password1');

      expect(service.isAuthenticated()).toBeTrue();
      expect(service.currentUser()?.email).toBe('new@law.co');
      expect(authData.login).not.toHaveBeenCalled();
    });

    it('throws when registration returns an HTTP error', async () => {
      const httpError = new HttpErrorResponse({
        status: 409,
        error: { detail: 'Email is already registered' },
      });
      authData.register.and.returnValue(throwError(() => httpError));

      await expectAsync(service.register('X', 'taken@law.co', 'pass')).toBeRejectedWithError(
        'Email is already registered',
      );
    });
  });

  // ──────────────────────────────────────────────────
  // logout()
  // ──────────────────────────────────────────────────

  describe('logout()', () => {
    it('clears session, sets unauthenticated, and navigates to /login', () => {
      service.logout();

      expect(tokenStorage.clearSession).toHaveBeenCalled();
      expect(service.isAuthenticated()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // ──────────────────────────────────────────────────
  // tryRefresh()
  // ──────────────────────────────────────────────────

  describe('tryRefresh()', () => {
    it('returns false immediately when no refresh token is stored', async () => {
      tokenStorage.getAccessToken.and.returnValue('at');
      tokenStorage.getRefreshToken.and.returnValue(null);

      const result = await service.tryRefresh();

      expect(result).toBeFalse();
      expect(authData.refresh).not.toHaveBeenCalled();
    });

    it('returns false immediately when no access token is stored', async () => {
      tokenStorage.getAccessToken.and.returnValue(null);
      tokenStorage.getRefreshToken.and.returnValue('rt');

      const result = await service.tryRefresh();

      expect(result).toBeFalse();
      expect(authData.refresh).not.toHaveBeenCalled();
    });

    it('sends both accessToken and refreshToken to the refresh endpoint', async () => {
      const newTokens = makeTokens({ sub: 'u1', email: 'alice@law.co', fullName: 'Alice' });
      tokenStorage.getAccessToken.and.returnValue('old-at');
      tokenStorage.getRefreshToken.and.returnValue('old-rt');
      authData.refresh.and.returnValue(of(newTokens));

      await service.tryRefresh();

      expect(authData.refresh).toHaveBeenCalledWith({ accessToken: 'old-at', refreshToken: 'old-rt' });
    });

    it('saves new tokens, updates currentUser, and returns true on success', async () => {
      const newTokens = makeTokens({ sub: 'u1', email: 'alice@law.co', fullName: 'Alice' });
      tokenStorage.getAccessToken.and.returnValue('old-at');
      tokenStorage.getRefreshToken.and.returnValue('old-rt');
      authData.refresh.and.returnValue(of(newTokens));

      const result = await service.tryRefresh();

      expect(result).toBeTrue();
      expect(tokenStorage.saveSession).toHaveBeenCalledWith(
        newTokens.accessToken,
        newTokens.refreshToken,
        jasmine.objectContaining({ email: 'alice@law.co' }),
      );
      expect(service.currentUser()?.email).toBe('alice@law.co');
    });

    it('clears session and returns false when refresh HTTP call fails', async () => {
      tokenStorage.getAccessToken.and.returnValue('at');
      tokenStorage.getRefreshToken.and.returnValue('expired-rt');
      authData.refresh.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 401 })),
      );

      const result = await service.tryRefresh();

      expect(result).toBeFalse();
      expect(tokenStorage.clearSession).toHaveBeenCalled();
    });

    it('deduplicates concurrent calls — refresh API is called exactly once', async () => {
      const newTokens = makeTokens({ sub: 'u1', email: 'alice@law.co', fullName: 'Alice' });
      tokenStorage.getAccessToken.and.returnValue('at');
      tokenStorage.getRefreshToken.and.returnValue('rt');
      authData.refresh.and.returnValue(of(newTokens));

      const [r1, r2, r3] = await Promise.all([
        service.tryRefresh(),
        service.tryRefresh(),
        service.tryRefresh(),
      ]);

      expect(authData.refresh).toHaveBeenCalledTimes(1);
      expect(r1).toBeTrue();
      expect(r2).toBeTrue();
      expect(r3).toBeTrue();
    });

    it('after a completed refresh, a new call starts a fresh refresh', async () => {
      const tokens = makeTokens({ sub: 'u1', email: 'alice@law.co', fullName: 'Alice' });
      tokenStorage.getAccessToken.and.returnValue('at');
      tokenStorage.getRefreshToken.and.returnValue('rt');
      authData.refresh.and.returnValue(of(tokens));

      await service.tryRefresh();
      await service.tryRefresh();

      expect(authData.refresh).toHaveBeenCalledTimes(2);
    });
  });
});
