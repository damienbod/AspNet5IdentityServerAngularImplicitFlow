import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthStateService } from '../authState/auth-state.service';
import { ConfigurationProvider } from '../config/config.provider';
import { FlowsDataService } from '../flows/flows-data.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { RefreshSessionIframeService } from '../iframe/refresh-session-iframe.service';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { UserService } from '../userData/user-service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { IntervallService } from './intervall.service';
import { RefreshSessionRefreshTokenService } from './refresh-session-refresh-token.service';

@Injectable({ providedIn: 'root' })
export class PeriodicallyTokenCheckService {
  constructor(
    private resetAuthDataService: ResetAuthDataService,
    private flowHelper: FlowHelper,
    private configurationProvider: ConfigurationProvider,
    private flowsDataService: FlowsDataService,
    private loggerService: LoggerService,
    private userService: UserService,
    private authStateService: AuthStateService,
    private refreshSessionIframeService: RefreshSessionIframeService,
    private refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService,
    private intervalService: IntervallService,
    private storagePersistanceService: StoragePersistanceService
  ) {}

  startTokenValidationPeriodically(repeatAfterSeconds: number) {
    const { silentRenew } = this.configurationProvider.getOpenIDConfiguration();

    if (!!this.intervalService.runTokenValidationRunning || !silentRenew) {
      return;
    }

    this.loggerService.logDebug(`starting token validation check every ${repeatAfterSeconds}s`);

    const periodicallyCheck$ = this.intervalService.startPeriodicTokenCheck(repeatAfterSeconds).pipe(
      switchMap(() => {
        const idToken = this.authStateService.getIdToken();
        const isSilentRenewRunning = this.flowsDataService.isSilentRenewRunning();
        const userDataFromStore = this.userService.getUserDataFromStore();

        this.loggerService.logDebug(
          `Checking: silentRenewRunning: ${isSilentRenewRunning} id_token: ${!!idToken} userData: ${!!userDataFromStore}`
        );

        const shouldBeExecuted = userDataFromStore && !isSilentRenewRunning && idToken;

        if (!shouldBeExecuted) {
          return of(null);
        }

        const idTokenHasExpired = this.authStateService.hasIdTokenExpired();
        const accessTokenHasExpired = this.authStateService.hasAccessTokenExpiredIfExpiryExists();

        if (!idTokenHasExpired && !accessTokenHasExpired) {
          return of(null);
        }

        const config = this.configurationProvider.getOpenIDConfiguration();

        if (!config?.silentRenew) {
          this.resetAuthDataService.resetAuthorizationData();
          return of(null);
        }

        this.loggerService.logDebug('starting silent renew...');

        this.flowsDataService.setSilentRenewRunning();

        // Retrieve Dynamically Set Custom Params
        const customParams: { [key: string]: string | number | boolean } = this.storagePersistanceService.read(
          'storageCustomRequestParams'
        );

        if (this.flowHelper.isCurrentFlowCodeFlowWithRefreshTokens()) {
          // Refresh Session using Refresh tokens
          return this.refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(customParams);
        }

        return this.refreshSessionIframeService.refreshSessionWithIframe(customParams);
      })
    );

    this.intervalService.runTokenValidationRunning = periodicallyCheck$
      .pipe(
        catchError(() => {
          this.flowsDataService.resetSilentRenewRunning();
          return throwError('periodically check failed');
        })
      )
      .subscribe(
        () => {
          this.loggerService.logDebug('silent renew, periodic check finished!');
          if (this.flowHelper.isCurrentFlowCodeFlowWithRefreshTokens()) {
            this.flowsDataService.resetSilentRenewRunning();
          }
        },
        (err) => {
          this.loggerService.logError('silent renew failed!', err);
        }
      );
  }
}
