import { Component, inject, ChangeDetectionStrategy, signal, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NavController,
  IonItem,
  IonContent,
  IonCard,
  IonCardContent,
  IonImg,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonLabel,
  IonIcon,
  IonRow,
  IonCol,
  IonText,
  IonButton,
  IonInput,
  IonCheckbox
} from '@ionic/angular/standalone';
import { Browser } from '@capacitor/browser';
import { isEmpty } from 'idea-toolbox';
import {
  IDEAEnvironment,
  IDEAMessageService,
  IDEALoadingService,
  IDEATranslationsService,
  IDEATranslatePipe
} from '@idea-ionic/common';

import { IDEAAuthService, LoginOutcomeActions } from './auth.service';

@Component({
  selector: 'idea-sign-in',
  imports: [
    FormsModule,
    IDEATranslatePipe,
    IonButton,
    IonText,
    IonCol,
    IonRow,
    IonIcon,
    IonLabel,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonImg,
    IonCardContent,
    IonCard,
    IonContent,
    IonItem,
    IonInput,
    IonCheckbox
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-content>
      @if (newAccountRegistered()) {
        <ion-card color="warning">
          <ion-card-content>{{ 'IDEA_AUTH.CONFIRM_YOUR_EMAIL_TO_LOGIN' | translate }}</ion-card-content>
        </ion-card>
      }
      <form class="flexBox">
        <div>
          <ion-card class="authCard">
            <ion-img
              [title]="'IDEA_AUTH.SERVICE_LOGO' | translate"
              [src]="darkMode ? 'assets/icons/icon-auth-alt.svg' : 'assets/icons/icon-auth.svg'"
            />
            <ion-card-header>
              @if (title) {
                <ion-card-title color="primary">{{ title }}</ion-card-title>
              }
              @if (translationExists('IDEA_VARIABLES.TAGLINE')) {
                <ion-card-subtitle> {{ 'IDEA_VARIABLES.TAGLINE' | translate }} </ion-card-subtitle>
              }
            </ion-card-header>
            <ion-card-content>
              @if (errorMsg()) {
                <p testId="signin.error" class="errorBox">
                  <b>{{ 'IDEA_AUTH.WARNING' | translate }}.</b> {{ errorMsg() }}
                </p>
              }
              <ion-item>
                <ion-label position="inline">
                  <ion-icon name="person-circle" color="primary" />
                </ion-label>
                <ion-input
                  testId="signin.email"
                  type="email"
                  inputmode="email"
                  pattern="[A-Za-z0-9._%+\\-]{2,}@[a-zA-Z\\-_.]{2,}[.]{1}[a-zA-Z]{2,}"
                  spellcheck="false"
                  autocorrect="off"
                  autocomplete="email"
                  [placeholder]="'IDEA_AUTH.EMAIL' | translate"
                  [title]="'IDEA_AUTH.EMAIL_HINT' | translate"
                  [disabled]="externalProviders.length && doneExternalProviderCheck"
                  [ngModelOptions]="{ standalone: true }"
                  [(ngModel)]="email"
                  (keyup.enter)="externalProviders.length ? checkForExternalProviderEmail() : login()"
                />
                @if (externalProviders.length && doneExternalProviderCheck) {
                  <ion-button
                    slot="end"
                    fill="clear"
                    [title]="'IDEA_AUTH.EDIT_EMAIL' | translate"
                    (click)="doneExternalProviderCheck = false"
                  >
                    <ion-icon icon="pencil" slot="icon-only" />
                  </ion-button>
                }
              </ion-item>
              @if (externalProviders.length && !doneExternalProviderCheck) {
                <ion-button
                  testId="continueButton"
                  expand="block"
                  [disabled]="!agreementsCheck"
                  [title]="'IDEA_AUTH.CONTINUE_HINT' | translate"
                  (click)="checkForExternalProviderEmail()"
                >
                  {{ 'IDEA_AUTH.CONTINUE' | translate }}
                </ion-button>
              } @else {
                <ion-item>
                  <ion-label position="inline">
                    <ion-icon name="key" color="primary" />
                  </ion-label>
                  <ion-input
                    testId="signin.password"
                    id="current-password"
                    type="password"
                    spellcheck="false"
                    autocorrect="off"
                    autocomplete="current-password"
                    [clearOnEdit]="false"
                    [placeholder]="'IDEA_AUTH.PASSWORD' | translate"
                    [title]="'IDEA_AUTH.PASSWORD_HINT' | translate"
                    [ngModelOptions]="{ standalone: true }"
                    [(ngModel)]="password"
                    (keyup.enter)="login()"
                  />
                </ion-item>
                @if (
                  !registrationPossible &&
                  (translationExists('IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL') ||
                    translationExists('IDEA_VARIABLES.PRIVACY_POLICY_URL'))
                ) {
                  <ion-row class="agreementsAcceptanceRow">
                    <ion-col>
                      <ion-checkbox
                        size="small"
                        [ngModelOptions]="{ standalone: true }"
                        [(ngModel)]="agreementsCheck"
                      />
                      {{ 'IDEA_AUTH.AGREEMENTS_CHECK_LOGIN' | translate }}:
                      @if (translationExists('IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL')) {
                        <a
                          ion-text
                          testId="openTermsAndConditionsButton"
                          color="primary"
                          target="_blank"
                          [title]="'IDEA_AUTH.TERMS_AND_CONDITIONS_HINT' | translate"
                          [href]="'IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL' | translate"
                        >
                          {{ 'IDEA_AUTH.TERMS_AND_CONDITIONS' | translate }}
                        </a>
                      }
                      @if (
                        translationExists('IDEA_VARIABLES.PRIVACY_POLICY_URL') &&
                        translationExists('IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL')
                      ) {
                        <ion-text> & </ion-text>
                      }
                      @if (translationExists('IDEA_VARIABLES.PRIVACY_POLICY_URL')) {
                        <a
                          ion-text
                          testId="openPrivacyPolicyButton"
                          color="primary"
                          target="_blank"
                          [title]="'IDEA_AUTH.PRIVACY_POLICY_HINT' | translate"
                          [href]="'IDEA_VARIABLES.PRIVACY_POLICY_URL' | translate"
                        >
                          {{ 'IDEA_AUTH.PRIVACY_POLICY' | translate }}
                        </a>
                      }
                    </ion-col>
                  </ion-row>
                }
                <ion-button
                  testId="signInButton"
                  expand="block"
                  [disabled]="!agreementsCheck"
                  [title]="'IDEA_AUTH.SIGN_IN_HINT' | translate"
                  (click)="login()"
                >
                  {{ 'IDEA_AUTH.SIGN_IN' | translate }}
                </ion-button>
                @if (registrationPossible) {
                  <ion-button
                    testId="createAnAccountButton"
                    fill="clear"
                    expand="block"
                    class="smallCaseButton"
                    [title]="'IDEA_AUTH.CREATE_AN_ACCOUNT_HINT' | translate"
                    (click)="goToRegistration()"
                  >
                    {{ 'IDEA_AUTH.CREATE_AN_ACCOUNT' | translate }}
                  </ion-button>
                }
                <ion-button
                  testId="forgotPasswordButton"
                  fill="clear"
                  expand="block"
                  class="smallCaseButton"
                  [title]="'IDEA_AUTH.I_FORGOT_MY_PASSWORD_HINT' | translate"
                  (click)="goToForgotPassword()"
                >
                  {{ 'IDEA_AUTH.I_FORGOT_MY_PASSWORD' | translate }}
                </ion-button>
              }
              @if (hasIntroPage) {
                <ion-button
                  testId="backToIntroButton"
                  fill="clear"
                  expand="block"
                  color="medium"
                  class="smallCaseButton"
                  [title]="'IDEA_AUTH.BACK_TO_INTRO_HINT' | translate"
                  (click)="goToIntro()"
                >
                  {{ 'IDEA_AUTH.BACK_TO_INTRO' | translate }}
                </ion-button>
              }
            </ion-card-content>
          </ion-card>
          @if (website) {
            <ion-img
              class="ideaLogo"
              [src]="darkMode ? './assets/icons/idea-alt.png' : './assets/icons/idea.png'"
              [title]="'IDEA_AUTH.IDEA_TAGLINE' | translate"
              (click)="openLink(website)"
            />
          }
        </div>
      </form>
    </ion-content>
  `,
  styleUrls: ['auth.scss']
})
export class IDEASignInPage {
  protected _env = inject(IDEAEnvironment);
  private _nav = inject(NavController);
  private _message = inject(IDEAMessageService);
  private _loading = inject(IDEALoadingService);
  private _translate = inject(IDEATranslationsService);
  private _auth = inject(IDEAAuthService);

  title: string;
  registrationPossible: boolean;
  hasIntroPage: boolean;
  website: string;
  externalProviders: { type: string; name: string; emailDomains: string[] }[];
  doneExternalProviderCheck = false;

  email = model<string>();
  password: string;
  agreementsCheck = true;
  newAccountRegistered = signal<boolean>(false);
  errorMsg = signal<string>(null);
  darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  constructor() {
    this.title = this._env.idea.auth.title;
    this.registrationPossible = this._env.idea.auth.registrationIsPossible;
    this.hasIntroPage = this._env.idea.auth.hasIntroPage;
    this.website = this._env.idea.auth.website;
    this.externalProviders = this._env.aws.cognito?.externalProviders || [];
  }
  ionViewDidEnter(): void {
    // manage the scenario in which we just created a new account (show a explanatory message: email must be confirmed)
    this.newAccountRegistered.set(!!this._auth.getNewAccountJustRegistered());
    if (this.newAccountRegistered()) this.email.set(this._auth.getNewAccountJustRegistered());
  }

  async login(): Promise<void> {
    if (!this.agreementsCheck) return;
    try {
      this.errorMsg.set(null);
      await this._loading.show();
      const loginAction = await this._auth.login(this.email(), this.password);
      if (loginAction === LoginOutcomeActions.NEW_PASSWORD) this._nav.navigateForward(['auth', 'new-password']);
      else if (loginAction === LoginOutcomeActions.MFA_CHALLENGE) this._nav.navigateForward(['auth', 'mfa-challenge']);
      else if (loginAction === LoginOutcomeActions.MFA_SETUP) this._nav.navigateForward(['auth', 'setup-mfa']);
      else window.location.assign('');
    } catch (err) {
      if ((err as any).name === 'UserNotConfirmedException')
        this.errorMsg.set(this._translate._('IDEA_AUTH.CONFIRM_YOUR_EMAIL_TO_LOGIN'));
      else if (
        (err as any).name === 'UserLambdaValidationException' &&
        (err as any).message?.includes('@IDEA_COGNITO_TRANSITION')
      )
        this.errorMsg.set(this._translate._('IDEA_AUTH.CHANGE_YOUR_PASSWORD_TO_LOGIN'));
      this._message.error('IDEA_AUTH.AUTHENTICATION_FAILED');
    } finally {
      this._loading.hide();
    }
  }

  checkForExternalProviderEmail(): void {
    if (isEmpty(this.email(), 'email')) return;
    const emailDomain = this.email().split('@')[1];
    this.doneExternalProviderCheck = true;
    const provider = this.externalProviders.find(p => p.emailDomains.includes(emailDomain));
    if (provider)
      this._nav.navigateForward(['auth', provider.type], { queryParams: { provider: provider.name, go: true } });
  }

  goToIntro(): void {
    this._nav.navigateBack(['intro']);
  }
  goToForgotPassword(): void {
    this._nav.navigateForward(['auth', 'forgot-password']);
  }
  goToRegistration(): void {
    this._nav.navigateForward(['auth', 'sign-up']);
  }

  translationExists(key: string): boolean {
    return !!this._translate._(key);
  }

  async openLink(url: string): Promise<void> {
    await Browser.open({ url });
  }
}
