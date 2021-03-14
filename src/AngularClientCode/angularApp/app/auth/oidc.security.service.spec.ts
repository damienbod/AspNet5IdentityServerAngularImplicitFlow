import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of } from 'rxjs';
import { AuthModule } from './auth.module';
import { AuthStateService } from './authState/auth-state.service';
import { AuthStateServiceMock } from './authState/auth-state.service-mock';
import { CallbackService } from './callback/callback.service';
import { CallbackServiceMock } from './callback/callback.service-mock';
import { RefreshSessionService } from './callback/refresh-session.service';
import { RefreshSessionServiceMock } from './callback/refresh-session.service.mock';
import { CheckAuthService } from './check-auth.service';
import { CheckAuthServiceMock } from './check-auth.service-mock';
import { ConfigurationProvider } from './config/config.provider';
import { FlowsDataService } from './flows/flows-data.service';
import { FlowsDataServiceMock } from './flows/flows-data.service-mock';
import { CheckSessionService } from './iframe/check-session.service';
import { CheckSessionServiceMock } from './iframe/check-session.service-mock';
import { LoginService } from './login/login.service';
import { LoginServiceMock } from './login/login.service-mock';
import { LogoffRevocationService } from './logoffRevoke/logoff-revocation.service';
import { LogoffRevocationServiceMock } from './logoffRevoke/logoff-revocation.service-mock';
import { OidcSecurityService } from './oidc.security.service';
import { StoragePersistanceService } from './storage/storage-persistance.service';
import { StoragePersistanceServiceMock } from './storage/storage-persistance.service-mock';
import { UserService } from './userData/user-service';
import { UserServiceMock } from './userData/user-service-mock';
import { TokenHelperService } from './utils/tokenHelper/oidc-token-helper.service';
import { TokenHelperServiceMock } from './utils/tokenHelper/oidc-token-helper.service-mock';

describe('OidcSecurityService', () => {
  let oidcSecurityService: OidcSecurityService;
  let configurationProvider: ConfigurationProvider;
  let authStateService: AuthStateService;
  let userService: UserService;
  let checkSessionService: CheckSessionService;
  let tokenHelperService: TokenHelperService;
  let flowsDataService: FlowsDataService;
  let logoffRevocationService: LogoffRevocationService;
  let loginService: LoginService;
  let refreshSessionService: RefreshSessionService;
  let storagePersistanceService: StoragePersistanceService;
  let checkAuthService: CheckAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule, HttpClientTestingModule, RouterTestingModule, AuthModule.forRoot()],
      providers: [
        OidcSecurityService,
        {
          provide: CheckSessionService,
          useClass: CheckSessionServiceMock,
        },
        {
          provide: CheckAuthService,
          useClass: CheckAuthServiceMock,
        },
        {
          provide: UserService,
          useClass: UserServiceMock,
        },
        {
          provide: TokenHelperService,
          useClass: TokenHelperServiceMock,
        },
        ConfigurationProvider,
        {
          provide: AuthStateService,
          useClass: AuthStateServiceMock,
        },
        { provide: FlowsDataService, useClass: FlowsDataServiceMock },
        { provide: CallbackService, useClass: CallbackServiceMock },
        { provide: LogoffRevocationService, useClass: LogoffRevocationServiceMock },
        { provide: LoginService, useClass: LoginServiceMock },
        {
          provide: StoragePersistanceService,
          useClass: StoragePersistanceServiceMock,
        },
        { provide: RefreshSessionService, useClass: RefreshSessionServiceMock },
      ],
    });
  });

  beforeEach(() => {
    oidcSecurityService = TestBed.inject(OidcSecurityService);
    checkSessionService = TestBed.inject(CheckSessionService);
    userService = TestBed.inject(UserService);
    tokenHelperService = TestBed.inject(TokenHelperService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    authStateService = TestBed.inject(AuthStateService);
    flowsDataService = TestBed.inject(FlowsDataService);
    logoffRevocationService = TestBed.inject(LogoffRevocationService);
    loginService = TestBed.inject(LoginService);
    storagePersistanceService = TestBed.inject(StoragePersistanceService);
    refreshSessionService = TestBed.inject(RefreshSessionService);
    checkAuthService = TestBed.inject(CheckAuthService);
  });

  it('should create', () => {
    expect(oidcSecurityService).toBeTruthy();
  });

  describe('checkAuth', () => {
    it(
      'calls checkAuthService.checkAuth() without url if none is passed',
      waitForAsync(() => {
        const spy = spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
        oidcSecurityService.checkAuth().subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith(undefined);
        });
      })
    );

    it('calls checkAuthService.checkAuth() with url if is passed', () => {
      const spy = spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
      oidcSecurityService.checkAuth('any-thing-url-like').subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith('any-thing-url-like');
      });
    });
  });

  describe('checkAuthIncludingServer', () => {
    it(
      'calls checkAuthService.checkAuthIncludingServer()',
      waitForAsync(() => {
        const spy = spyOn(checkAuthService, 'checkAuthIncludingServer').and.returnValue(of(null));
        oidcSecurityService.checkAuthIncludingServer().subscribe(() => {
          expect(spy).toHaveBeenCalledTimes(1);
        });
      })
    );
  });

  describe('configuration', () => {
    it('is not of type observable', () => {
      expect(oidcSecurityService.configuration).not.toEqual(jasmine.any(Observable));
    });

    it('returns configProvider.configuration', () => {
      const spy = spyOn(configurationProvider, 'getOpenIDConfiguration');
      oidcSecurityService.configuration;
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('userData', () => {
    it('is of type observable', () => {
      expect(oidcSecurityService.userData$).toEqual(jasmine.any(Observable));
    });

    it('returns userService.userData$', () => {
      const spy = spyOnProperty(userService, 'userData$', 'get');
      oidcSecurityService.userData$;
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('forceRefreshSession', () => {
    it(
      'calls refreshSessionService forceRefreshSession',
      waitForAsync(() => {
        const spy = spyOn(refreshSessionService, 'forceRefreshSession').and.returnValue(of(null));
        oidcSecurityService.forceRefreshSession().subscribe(() => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'calls storagePersistanceService.write when customParams are given',
      waitForAsync(() => {
        const spy = spyOn(refreshSessionService, 'forceRefreshSession').and.returnValue(of(null));
        const writeSpy = spyOn(storagePersistanceService, 'write');
        oidcSecurityService.forceRefreshSession({ my: 'custom', params: 1 }).subscribe(() => {
          expect(spy).toHaveBeenCalled();
          expect(writeSpy).toHaveBeenCalledWith('storageCustomRequestParams', { my: 'custom', params: 1 });
        });
      })
    );
  });

  describe('authorize', () => {
    it('calls login service login', () => {
      const spy = spyOn(loginService, 'login');
      oidcSecurityService.authorize();
      expect(spy).toHaveBeenCalled();
    });

    it('calls login service login with params if given', () => {
      const spy = spyOn(loginService, 'login');
      oidcSecurityService.authorize({ customParams: { any: 'thing' } });
      expect(spy).toHaveBeenCalledWith({ customParams: { any: 'thing' } });
    });
  });

  describe('authorizeWithPopUp', () => {
    it(
      'calls login service loginWithPopUp',
      waitForAsync(() => {
        const spy = spyOn(loginService, 'loginWithPopUp').and.callFake(() => of(null));
        oidcSecurityService.authorizeWithPopUp().subscribe(() => {
          expect(spy).toHaveBeenCalledTimes(1);
        });
      })
    );

    it(
      'calls login service loginWithPopUp with params if given',
      waitForAsync(() => {
        const spy = spyOn(loginService, 'loginWithPopUp').and.callFake(() => of(null));
        oidcSecurityService.authorizeWithPopUp({ customParams: { any: 'thing' } }).subscribe(() => {
          expect(spy).toHaveBeenCalledWith({ customParams: { any: 'thing' } });
        });
      })
    );
  });

  describe('isAuthenticated', () => {
    it('is of type observable', () => {
      expect(oidcSecurityService.isAuthenticated$).toEqual(jasmine.any(Observable));
    });

    it(
      'returns authStateService.authorized$',
      waitForAsync(() => {
        const spy = spyOnProperty(authStateService, 'authorized$', 'get').and.returnValue(of(null));
        oidcSecurityService.isAuthenticated$.subscribe(() => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );
  });

  describe('checkSessionChanged', () => {
    it('is of type observable', () => {
      expect(oidcSecurityService.checkSessionChanged$).toEqual(jasmine.any(Observable));
    });

    it(
      'emits false initially',
      waitForAsync(() => {
        spyOnProperty(oidcSecurityService, 'checkSessionChanged$', 'get').and.callThrough();
        oidcSecurityService.checkSessionChanged$.subscribe((result) => {
          expect(result).toBe(false);
        });
      })
    );

    it(
      'emits false then true when emitted',
      waitForAsync(() => {
        const expectedResultsInOrder = [false, true];
        let counter = 0;
        oidcSecurityService.checkSessionChanged$.subscribe((result) => {
          expect(result).toBe(expectedResultsInOrder[counter]);
          counter++;
        });

        (checkSessionService as any).checkSessionChangedInternal$.next(true);
      })
    );
  });

  describe('stsCallback', () => {
    it('is of type observable', () => {
      expect(oidcSecurityService.stsCallback$).toEqual(jasmine.any(Observable));
    });
  });

  describe('getToken', () => {
    it(
      'calls authStateService.getAccessToken()',
      waitForAsync(() => {
        const spy = spyOn(authStateService, 'getAccessToken');

        oidcSecurityService.getToken();
        expect(spy).toHaveBeenCalled();
      })
    );
  });

  describe('getIdToken', () => {
    it(
      'calls authStateService.getIdToken()',
      waitForAsync(() => {
        const spy = spyOn(authStateService, 'getIdToken');

        oidcSecurityService.getIdToken();
        expect(spy).toHaveBeenCalled();
      })
    );
  });

  describe('getRefreshToken', () => {
    it(
      'calls authStateService.getRefreshToken()',
      waitForAsync(() => {
        const spy = spyOn(authStateService, 'getRefreshToken');

        oidcSecurityService.getRefreshToken();
        expect(spy).toHaveBeenCalled();
      })
    );
  });

  describe('getPayloadFromIdToken', () => {
    it(
      'calls `getIdToken` method',
      waitForAsync(() => {
        const spy = spyOn(oidcSecurityService, 'getIdToken');

        oidcSecurityService.getPayloadFromIdToken();
        expect(spy).toHaveBeenCalled();
      })
    );

    it(
      'without parameters calls with encode = false (default)',
      waitForAsync(() => {
        spyOn(oidcSecurityService, 'getIdToken').and.returnValue('aaa');
        const spy = spyOn(tokenHelperService, 'getPayloadFromToken');

        oidcSecurityService.getPayloadFromIdToken();
        expect(spy).toHaveBeenCalledWith('aaa', false);
      })
    );

    it(
      'with parameters calls with encode = true',
      waitForAsync(() => {
        spyOn(oidcSecurityService, 'getIdToken').and.returnValue('aaa');
        const spy = spyOn(tokenHelperService, 'getPayloadFromToken');

        oidcSecurityService.getPayloadFromIdToken(true);
        expect(spy).toHaveBeenCalledWith('aaa', true);
      })
    );
  });

  describe('setState', () => {
    it(
      'calls flowsDataService.setAuthStateControl with param',
      waitForAsync(() => {
        const spy = spyOn(flowsDataService, 'setAuthStateControl');

        oidcSecurityService.setState('anyString');
        expect(spy).toHaveBeenCalledWith('anyString');
      })
    );
  });

  describe('setState', () => {
    it(
      'calls flowsDataService.getAuthStateControl',
      waitForAsync(() => {
        const spy = spyOn(flowsDataService, 'getAuthStateControl');

        oidcSecurityService.getState();
        expect(spy).toHaveBeenCalled();
      })
    );
  });

  describe('logoffAndRevokeTokens', () => {
    it(
      'calls logoffRevocationService.logoffAndRevokeTokens if no urlHandler is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'logoffAndRevokeTokens');

        oidcSecurityService.logoffAndRevokeTokens();
        expect(spy).toHaveBeenCalledWith(undefined);
      })
    );

    it(
      'calls logoffRevocationService.logoffAndRevokeTokens with urlHandler if it is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'logoffAndRevokeTokens');

        const urlHandler = () => {};

        oidcSecurityService.logoffAndRevokeTokens(urlHandler);
        expect(spy).toHaveBeenCalledWith(urlHandler);
      })
    );
  });

  describe('logoff', () => {
    it(
      'calls logoffRevocationService.logoff if no urlHandler is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'logoff');

        oidcSecurityService.logoff();
        expect(spy).toHaveBeenCalledWith(undefined);
      })
    );

    it(
      'calls logoffRevocationService.logoff with urlHandler if it is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'logoff');

        const urlHandler = () => {};

        oidcSecurityService.logoff(urlHandler);
        expect(spy).toHaveBeenCalledWith(urlHandler);
      })
    );
  });

  describe('logoffLocal', () => {
    it(
      'calls logoffRevocationService.logoffLocal ',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'logoffLocal');

        oidcSecurityService.logoffLocal();
        expect(spy).toHaveBeenCalled();
      })
    );
  });

  describe('revokeAccessToken', () => {
    it(
      'calls logoffRevocationService.revokeAccessToken without param if non is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'revokeAccessToken');

        oidcSecurityService.revokeAccessToken();
        expect(spy).toHaveBeenCalledWith(undefined);
      })
    );

    it(
      'calls logoffRevocationService.revokeAccessToken without param if non is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'revokeAccessToken');

        oidcSecurityService.revokeAccessToken('aParam');
        expect(spy).toHaveBeenCalledWith('aParam');
      })
    );
  });

  describe('revokeRefreshToken', () => {
    it(
      'calls logoffRevocationService.revokeRefreshToken without param if non is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'revokeRefreshToken');

        oidcSecurityService.revokeRefreshToken();
        expect(spy).toHaveBeenCalledWith(undefined);
      })
    );

    it(
      'calls logoffRevocationService.revokeRefreshToken without param if non is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'revokeRefreshToken');

        oidcSecurityService.revokeRefreshToken('aParam');
        expect(spy).toHaveBeenCalledWith('aParam');
      })
    );
  });

  describe('getEndSessionUrl', () => {
    it('calls logoffRevocationService.getEndSessionUrl ', () => {
      const spy = spyOn(logoffRevocationService, 'getEndSessionUrl');

      oidcSecurityService.getEndSessionUrl();
      expect(spy).toHaveBeenCalled();
    });
  });
});
