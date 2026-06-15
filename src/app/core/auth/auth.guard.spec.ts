import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { AuthService } from './auth.service';

/** Minimal AuthService stub — only exposes the isAuthenticated signal. */
function makeAuthStub(authenticated: boolean) {
  return { isAuthenticated: signal(authenticated) };
}

const EMPTY_ROUTE = {} as ActivatedRouteSnapshot;
const EMPTY_STATE = {} as RouterStateSnapshot;

describe('authGuard', () => {
  let router: jasmine.SpyObj<Router>;

  function setupWithAuth(authenticated: boolean): void {
    router = jasmine.createSpyObj<Router>('Router', ['parseUrl', 'navigate']);
    router.parseUrl.and.callFake((url: string) => ({ redirectUrl: url }) as unknown as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: makeAuthStub(authenticated) },
        { provide: Router, useValue: router },
      ],
    });
  }

  it('returns true when the user is authenticated', () => {
    setupWithAuth(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(EMPTY_ROUTE, EMPTY_STATE),
    );

    expect(result).toBeTrue();
    expect(router.parseUrl).not.toHaveBeenCalled();
  });

  it('returns a UrlTree pointing to /login when the user is not authenticated', () => {
    setupWithAuth(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(EMPTY_ROUTE, EMPTY_STATE),
    );

    expect(result).not.toBeTrue();
    expect(router.parseUrl).toHaveBeenCalledWith('/login');
  });
});

describe('guestGuard', () => {
  let router: jasmine.SpyObj<Router>;

  function setupWithAuth(authenticated: boolean): void {
    router = jasmine.createSpyObj<Router>('Router', ['parseUrl', 'navigate']);
    router.parseUrl.and.callFake((url: string) => ({ redirectUrl: url }) as unknown as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: makeAuthStub(authenticated) },
        { provide: Router, useValue: router },
      ],
    });
  }

  it('returns true when the user is a guest (not authenticated)', () => {
    setupWithAuth(false);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard(EMPTY_ROUTE, EMPTY_STATE),
    );

    expect(result).toBeTrue();
    expect(router.parseUrl).not.toHaveBeenCalled();
  });

  it('returns a UrlTree pointing to / when the user is already authenticated', () => {
    setupWithAuth(true);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard(EMPTY_ROUTE, EMPTY_STATE),
    );

    expect(result).not.toBeTrue();
    expect(router.parseUrl).toHaveBeenCalledWith('/');
  });
});
