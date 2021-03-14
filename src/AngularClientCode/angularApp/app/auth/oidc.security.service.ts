import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthStateService } from './authState/auth-state.service';
import { CallbackService } from './callback/callback.service';
import { RefreshSessionService } from './callback/refresh-session.service';
import { CheckAuthService } from './check-auth.service';
import { ConfigurationProvider } from './config/config.provider';
import { PublicConfiguration } from './config/public-configuration';
import { FlowsDataService } from './flows/flows-data.service';
import { CheckSessionService } from './iframe/check-session.service';
import { AuthOptions } from './login/auth-options';
import { LoginService } from './login/login.service';
import { LogoffRevocationService } from './logoffRevoke/logoff-revocation.service';
import { StoragePersistanceService } from './storage/storage-persistance.service';
import { UserService } from './userData/user-service';
import { TokenHelperService } from './utils/tokenHelper/oidc-token-helper.service';

@Injectable()
export class OidcSecurityService {
  get configuration(): PublicConfiguration {
    const openIDConfiguration = this.configurationProvider.getOpenIDConfiguration();

    return {
      configuration: openIDConfiguration,
      wellknown: this.storagePersistanceService.read('authWellKnownEndPoints'),
    };
  }

  get userData$() {
    return this.userService.userData$;
  }

  get isAuthenticated$() {
    return this.authStateService.authorized$;
  }

  get checkSessionChanged$() {
    return this.checkSessionService.checkSessionChanged$;
  }

  get stsCallback$() {
    return this.callbackService.stsCallback$;
  }

  constructor(
    private checkSessionService: CheckSessionService,
    private checkAuthService: CheckAuthService,
    private userService: UserService,
    private tokenHelperService: TokenHelperService,
    private configurationProvider: ConfigurationProvider,
    private authStateService: AuthStateService,
    private flowsDataService: FlowsDataService,
    private callbackService: CallbackService,
    private logoffRevocationService: LogoffRevocationService,
    private loginService: LoginService,
    private storagePersistanceService: StoragePersistanceService,
    private refreshSessionService: RefreshSessionService
  ) {}

  checkAuth(url?: string): Observable<boolean> {
    return this.checkAuthService.checkAuth(url);
  }

  checkAuthIncludingServer(): Observable<boolean> {
    return this.checkAuthService.checkAuthIncludingServer();
  }

  getToken(): string {
    return this.authStateService.getAccessToken();
  }

  getIdToken(): string {
    return this.authStateService.getIdToken();
  }

  getRefreshToken(): string {
    return this.authStateService.getRefreshToken();
  }

  getPayloadFromIdToken(encode = false): any {
    const token = this.getIdToken();
    return this.tokenHelperService.getPayloadFromToken(token, encode);
  }

  setState(state: string): void {
    this.flowsDataService.setAuthStateControl(state);
  }

  getState(): string {
    return this.flowsDataService.getAuthStateControl();
  }

  // Code Flow with PCKE or Implicit Flow
  authorize(authOptions?: AuthOptions) {
    if (authOptions?.customParams) {
      this.storagePersistanceService.write('storageCustomRequestParams', authOptions.customParams);
    }

    this.loginService.login(authOptions);
  }

  authorizeWithPopUp(authOptions?: AuthOptions) {
    if (authOptions?.customParams) {
      this.storagePersistanceService.write('storageCustomRequestParams', authOptions.customParams);
    }

    return this.loginService.loginWithPopUp(authOptions);
  }

  forceRefreshSession(customParams?: { [key: string]: string | number | boolean }) {
    if (customParams) {
      this.storagePersistanceService.write('storageCustomRequestParams', customParams);
    }

    return this.refreshSessionService.forceRefreshSession(customParams);
  }

  // The refresh token and and the access token are revoked on the server. If the refresh token does not exist
  // only the access token is revoked. Then the logout run.
  logoffAndRevokeTokens(urlHandler?: (url: string) => any) {
    return this.logoffRevocationService.logoffAndRevokeTokens(urlHandler);
  }

  // Logs out on the server and the local client.
  // If the server state has changed, checksession, then only a local logout.
  logoff(urlHandler?: (url: string) => any) {
    return this.logoffRevocationService.logoff(urlHandler);
  }

  logoffLocal() {
    return this.logoffRevocationService.logoffLocal();
  }

  // https://tools.ietf.org/html/rfc7009
  // revokes an access token on the STS. This is only required in the code flow with refresh tokens.
  // If no token is provided, then the token from the storage is revoked. You can pass any token to revoke.
  // This makes it possible to manage your own tokens.
  revokeAccessToken(accessToken?: any) {
    return this.logoffRevocationService.revokeAccessToken(accessToken);
  }

  // https://tools.ietf.org/html/rfc7009
  // revokes a refresh token on the STS. This is only required in the code flow with refresh tokens.
  // If no token is provided, then the token from the storage is revoked. You can pass any token to revoke.
  // This makes it possible to manage your own tokens.
  revokeRefreshToken(refreshToken?: any) {
    return this.logoffRevocationService.revokeRefreshToken(refreshToken);
  }

  getEndSessionUrl(): string | null {
    return this.logoffRevocationService.getEndSessionUrl();
  }
}
