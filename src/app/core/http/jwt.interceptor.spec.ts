import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { jwtInterceptor } from './jwt.interceptor';
import { TokenStorageService } from '../auth/token-storage.service';
import { AuthService } from '../auth/auth.service';

const API = '/api/v1';
const PROTECTED = `${API}/processes`;
const AUTH_ENDPOINT = `${API}/auth/login`;

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let tokenStorage: jasmine.SpyObj<TokenStorageService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    tokenStorage = jasmine.createSpyObj<TokenStorageService>('TokenStorageService', [
      'getAccessToken',
      'getRefreshToken',
    ]);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['tryRefresh', 'logout']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: TokenStorageService, useValue: tokenStorage },
        { provide: AuthService, useValue: authService },
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ──────────────────────────────────────────────────
  // Token injection
  // ──────────────────────────────────────────────────

  it('adds Authorization: Bearer header when an access token is stored', () => {
    tokenStorage.getAccessToken.and.returnValue('my-access-token');

    http.get(PROTECTED).subscribe();

    const req = controller.expectOne(PROTECTED);
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-access-token');
    req.flush({});
  });

  it('sends the request without Authorization when no token is stored', () => {
    tokenStorage.getAccessToken.and.returnValue(null);

    http.get(PROTECTED).subscribe();

    const req = controller.expectOne(PROTECTED);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('skips token injection for auth endpoints that include /api/v1/auth/', () => {
    tokenStorage.getAccessToken.and.returnValue('my-token');

    http.post(AUTH_ENDPOINT, {}).subscribe();

    const req = controller.expectOne(AUTH_ENDPOINT);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  // ──────────────────────────────────────────────────
  // 401 handling — successful refresh
  // ──────────────────────────────────────────────────

  it('retries with a new token after a 401 when refresh succeeds', fakeAsync(() => {
    tokenStorage.getAccessToken.and.returnValues('old-token', 'new-token');
    authService.tryRefresh.and.returnValue(Promise.resolve(true));

    let responseBody: unknown;
    http.get<{ ok: boolean }>(PROTECTED).subscribe(r => { responseBody = r; });

    // Initial request arrives with old token
    const req1 = controller.expectOne(PROTECTED);
    expect(req1.request.headers.get('Authorization')).toBe('Bearer old-token');
    req1.flush({}, { status: 401, statusText: 'Unauthorized' });

    // Let the refresh Promise resolve
    flushMicrotasks();

    // Retry request arrives with new token
    const req2 = controller.expectOne(PROTECTED);
    expect(req2.request.headers.get('Authorization')).toBe('Bearer new-token');
    req2.flush({ ok: true });

    expect(responseBody).toEqual({ ok: true });
    expect(authService.tryRefresh).toHaveBeenCalledTimes(1);
    expect(authService.logout).not.toHaveBeenCalled();
  }));

  // ──────────────────────────────────────────────────
  // 401 handling — failed refresh
  // ──────────────────────────────────────────────────

  it('calls logout and re-throws the 401 error when refresh fails', fakeAsync(() => {
    tokenStorage.getAccessToken.and.returnValue('expired-token');
    authService.tryRefresh.and.returnValue(Promise.resolve(false));

    let thrownError: HttpErrorResponse | undefined;
    http.get(PROTECTED).subscribe({
      next: () => fail('expected an error'),
      error: (e: HttpErrorResponse) => { thrownError = e; },
    });

    const req = controller.expectOne(PROTECTED);
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    flushMicrotasks();

    expect(authService.logout).toHaveBeenCalled();
    expect(thrownError?.status).toBe(401);
  }));

  // ──────────────────────────────────────────────────
  // Non-401 errors pass through unchanged
  // ──────────────────────────────────────────────────

  it('does not intercept non-401 errors', fakeAsync(() => {
    tokenStorage.getAccessToken.and.returnValue('token');

    let thrownError: HttpErrorResponse | undefined;
    http.get(PROTECTED).subscribe({
      next: () => fail('expected an error'),
      error: (e: HttpErrorResponse) => { thrownError = e; },
    });

    const req = controller.expectOne(PROTECTED);
    req.flush({}, { status: 403, statusText: 'Forbidden' });

    flushMicrotasks();

    expect(thrownError?.status).toBe(403);
    expect(authService.tryRefresh).not.toHaveBeenCalled();
  }));
});
