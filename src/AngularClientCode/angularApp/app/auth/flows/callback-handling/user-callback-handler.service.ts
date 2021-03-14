import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthStateService } from '../../authState/auth-state.service';
import { AuthorizedState } from '../../authState/authorized-state';
import { ConfigurationProvider } from '../../config/config.provider';
import { LoggerService } from '../../logging/logger.service';
import { UserService } from '../../userData/user-service';
import { StateValidationResult } from '../../validation/state-validation-result';
import { CallbackContext } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';
import { ResetAuthDataService } from '../reset-auth-data.service';

@Injectable()
export class UserCallbackHandlerService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly configurationProvider: ConfigurationProvider,
    private readonly authStateService: AuthStateService,
    private readonly flowsDataService: FlowsDataService,
    private readonly userService: UserService,
    private readonly resetAuthDataService: ResetAuthDataService
  ) {}

  // STEP 5 userData
  callbackUser(callbackContext: CallbackContext): Observable<CallbackContext> {
    const { isRenewProcess, validationResult, authResult, refreshToken } = callbackContext;
    const { autoUserinfo, renewUserInfoAfterTokenRenew } = this.configurationProvider.getOpenIDConfiguration();

    if (!autoUserinfo) {
      if (!isRenewProcess || renewUserInfoAfterTokenRenew) {
        // userData is set to the id_token decoded, auto get user data set to false
        if (validationResult.decodedIdToken) {
          this.userService.setUserDataToStore(validationResult.decodedIdToken);
        }
      }

      if (!isRenewProcess && !refreshToken) {
        this.flowsDataService.setSessionState(authResult.session_state);
      }

      this.publishAuthorizedState(validationResult, isRenewProcess);
      return of(callbackContext);
    }

    return this.userService.getAndPersistUserDataInStore(isRenewProcess, validationResult.idToken, validationResult.decodedIdToken).pipe(
      switchMap((userData) => {
        if (!!userData) {
          if (!refreshToken) {
            this.flowsDataService.setSessionState(authResult.session_state);
          }

          this.publishAuthorizedState(validationResult, isRenewProcess);

          return of(callbackContext);
        } else {
          this.resetAuthDataService.resetAuthorizationData();
          this.publishUnauthorizedState(validationResult, isRenewProcess);
          const errorMessage = `Called for userData but they were ${userData}`;
          this.loggerService.logWarning(errorMessage);
          return throwError(errorMessage);
        }
      }),
      catchError((err) => {
        const errorMessage = `Failed to retrieve user info with error:  ${err}`;
        this.loggerService.logWarning(errorMessage);
        return throwError(errorMessage);
      })
    );
  }

  private publishAuthorizedState(stateValidationResult: StateValidationResult, isRenewProcess: boolean) {
    this.authStateService.updateAndPublishAuthState({
      authorizationState: AuthorizedState.Authorized,
      validationResult: stateValidationResult.state,
      isRenewProcess,
    });
  }

  private publishUnauthorizedState(stateValidationResult: StateValidationResult, isRenewProcess: boolean) {
    this.authStateService.updateAndPublishAuthState({
      authorizationState: AuthorizedState.Unauthorized,
      validationResult: stateValidationResult.state,
      isRenewProcess,
    });
  }
}
