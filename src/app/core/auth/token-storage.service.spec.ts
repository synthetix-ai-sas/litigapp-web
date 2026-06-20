import { TestBed } from '@angular/core/testing';
import { TokenStorageService } from './token-storage.service';
import type { User } from '../../shared/domain/user.types';

const ALICE: User = { id: 'u1', email: 'alice@law.co', fullName: 'Alice Pérez' };

describe('TokenStorageService', () => {
  let service: TokenStorageService;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    spyOn(localStorage, 'getItem').and.callFake((k: string) => store[k] ?? null);
    spyOn(localStorage, 'setItem').and.callFake((k: string, v: string) => { store[k] = v; });
    spyOn(localStorage, 'removeItem').and.callFake((k: string) => { delete store[k]; });

    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenStorageService);
  });

  describe('saveSession / getters', () => {
    it('stores access token, refresh token and user', () => {
      service.saveSession('at-1', 'rt-1', ALICE);

      expect(service.getAccessToken()).toBe('at-1');
      expect(service.getRefreshToken()).toBe('rt-1');
      expect(service.getUser()).toEqual(ALICE);
    });

    it('hasSession returns true after saving', () => {
      service.saveSession('at', 'rt', ALICE);
      expect(service.hasSession()).toBeTrue();
    });

    it('hasSession returns false when storage is empty', () => {
      expect(service.hasSession()).toBeFalse();
    });

    it('getUser returns null when nothing is stored', () => {
      expect(service.getUser()).toBeNull();
    });

    it('getUser returns null when stored JSON is corrupted', () => {
      store['litigapp_user'] = 'NOT_VALID_JSON{{';
      expect(service.getUser()).toBeNull();
    });
  });

  describe('updateTokens', () => {
    it('replaces both tokens without touching user', () => {
      service.saveSession('old-at', 'old-rt', ALICE);
      service.updateTokens('new-at', 'new-rt');

      expect(service.getAccessToken()).toBe('new-at');
      expect(service.getRefreshToken()).toBe('new-rt');
      expect(service.getUser()).toEqual(ALICE);
    });
  });

  describe('clearSession', () => {
    it('removes all stored keys', () => {
      service.saveSession('at', 'rt', ALICE);
      service.clearSession();

      expect(service.getAccessToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
      expect(service.getUser()).toBeNull();
      expect(service.hasSession()).toBeFalse();
    });
  });
});
