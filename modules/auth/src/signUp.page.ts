import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NavController,
  PopoverController,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonIcon,
  IonLabel,
  IonButton,
  IonRow,
  IonCol,
  IonText,
  IonInput,
  IonCheckbox
} from '@ionic/angular/standalone';
import { isEmpty } from 'idea-toolbox';
import {
  IDEAEnvironment,
  IDEAMessageService,
  IDEALoadingService,
  IDEATranslationsService,
  IDEATranslatePipe
} from '@idea-ionic/common';

import { IDEAPasswordPolicyComponent } from './passwordPolicy.component';
import { IDEAAuthService } from './auth.service';

@Component({
  selector: 'idea-sign-up',
  imports: [
    FormsModule,
    IDEATranslatePipe,
    IonText,
    IonCol,
    IonRow,
    IonButton,
    IonLabel,
    IonIcon,
    IonItem,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonContent,
    IonInput,
    IonCheckbox
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-content>
      <form class="flexBox">
        <ion-card class="authCard">
          <ion-card-header>
            <ion-card-title color="primary">{{ 'IDEA_AUTH.NEW_ACCOUNT' | translate }}</ion-card-title>
            <ion-card-subtitle>{{ 'IDEA_AUTH.REGISTER_A_NEW_ACCOUNT_TO_THE_SYSTEM' | translate }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            @if (errorMsg()) {
              <p testId="signup.error" class="errorBox">
                <b> {{ 'IDEA_AUTH.ERROR' | translate }}. </b>
                {{ errorMsg() }}
              </p>
            }
            <ion-item>
              <ion-label position="inline">
                <ion-icon name="person-circle" color="primary" />
              </ion-label>
              <ion-input
                testId="signup.email"
                type="email"
                inputmode="email"
                pattern="[A-Za-z0-9._%+\\-]{2,}@[a-zA-Z\\-_.]{2,}[.]{1}[a-zA-Z]{2,}"
                spellcheck="false"
                autocorrect="off"
                autocomplete="off"
                [placeholder]="'IDEA_AUTH.EMAIL' | translate"
                [title]="'IDEA_AUTH.REGISTRATION_EMAIL_HINT' | translate"
                [ngModelOptions]="{ standalone: true }"
                [(ngModel)]="email"
                (keyup.enter)="register()"
              />
            </ion-item>
            <ion-item>
              <ion-label position="inline">
                <ion-icon name="key" color="primary" />
              </ion-label>
              <ion-input
                testId="signup.password"
                type="password"
                spellcheck="false"
                autocorrect="off"
                autocomplete="off"
                [pattern]="_auth.getPasswordPolicyPatternForInput()"
                [clearOnEdit]="false"
                [placeholder]="'IDEA_AUTH.PASSWORD' | translate"
                [title]="'IDEA_AUTH.CHOOSE_A_PASSWORD' | translate"
                [ngModelOptions]="{ standalone: true }"
                [(ngModel)]="password"
                (keyup.enter)="register()"
              />
              <ion-button
                testId="openPasswordPolicyButton"
                slot="end"
                fill="clear"
                color="dark"
                (click)="openPasswordPolicy($event)"
              >
                <ion-icon icon="help-circle-outline" slot="icon-only" />
              </ion-button>
            </ion-item>
            @if (
              translationExists('IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL') ||
              translationExists('IDEA_VARIABLES.PRIVACY_POLICY_URL')
            ) {
              <ion-row class="agreementsAcceptanceRow">
                <ion-col>
                  <ion-checkbox size="small" [ngModelOptions]="{ standalone: true }" [(ngModel)]="agreementsCheck" />
                  {{ 'IDEA_AUTH.AGREEMENTS_CHECK_REGISTRATION' | translate }}:
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
              testId="signUpButton"
              expand="block"
              [disabled]="!agreementsCheck"
              [title]="'IDEA_AUTH.CREATE_AN_ACCOUNT_HINT' | translate"
              (click)="register()"
            >
              {{ 'IDEA_AUTH.CREATE_AN_ACCOUNT' | translate }}
            </ion-button>
            <ion-button
              testId="resendLinkButton"
              fill="clear"
              expand="block"
              class="smallCaseButton"
              [title]="'IDEA_AUTH.HAVEN_T_RECEIVED_CONFIRMATION_LINK_HINT' | translate"
              (click)="goToResendLink()"
            >
              {{ 'IDEA_AUTH.HAVEN_T_RECEIVED_CONFIRMATION_LINK' | translate }}
            </ion-button>
            <ion-button
              testId="backToSignInButton"
              fill="clear"
              expand="block"
              class="smallCaseButton"
              [title]="'IDEA_AUTH.BACK_TO_SIGN_IN_HINT' | translate"
              (click)="goToAuth()"
            >
              {{ 'IDEA_AUTH.BACK_TO_SIGN_IN' | translate }}
            </ion-button>
          </ion-card-content>
        </ion-card>
      </form>
    </ion-content>
  `,
  styleUrls: ['auth.scss']
})
export class IDEASignUpPage implements OnInit {
  protected _env = inject(IDEAEnvironment);
  private _nav = inject(NavController);
  private _popover = inject(PopoverController);
  private _message = inject(IDEAMessageService);
  private _loading = inject(IDEALoadingService);
  private _translate = inject(IDEATranslationsService);
  public _auth = inject(IDEAAuthService);

  email: string;
  password: string;
  agreementsCheck = false;
  passwordPolicy: any;
  errorMsg = signal<string>(null);

  constructor() {
    this.passwordPolicy = this._env.idea.auth.passwordPolicy;
  }
  ngOnInit(): void {
    if (!this._env.idea.auth.registrationIsPossible) return this.goToAuth();
    this.agreementsCheck =
      this._translate._('IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL') ||
      this._translate._('IDEA_VARIABLES.PRIVACY_POLICY_URL')
        ? this.agreementsCheck
        : true;
  }

  async register(): Promise<void> {
    try {
      await this._loading.show();
      this.errorMsg.set(null);
      if (isEmpty(this.email, 'email')) this.errorMsg.set(this._translate._('IDEA_AUTH.VALID_EMAIL_OBLIGATORY'));
      else {
        const errors = this._auth.validatePasswordAgainstPolicy(this.password);
        if (errors.length === 0 && this.passwordPolicy.advancedPasswordCheck) {
          const emailParts = [...this.email?.split('@')[0].split(/\W/g)];
          errors.push(...(await this._auth.validatePasswordAgainstDatabases(this.password, emailParts)));
        }
        if (errors.length)
          this.errorMsg.set(
            [
              this._translate._('IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW'),
              ...errors.map(x =>
                this._translate._('IDEA_AUTH.PASSWORD_REQUIREMENTS.'.concat(x), { n: this.passwordPolicy.minLength })
              )
            ].join(' ')
          );
      }
      if (this.errorMsg()) return this._message.error('IDEA_AUTH.REGISTRATION_FAILED');
      await this._auth.register(this.email, this.password);
      this._message.success('IDEA_AUTH.REGISTRATION_COMPLETED');
      this.goToAuth();
    } catch (err) {
      this.errorMsg.set((err as any).message);
      this._message.error('IDEA_AUTH.REGISTRATION_FAILED');
    } finally {
      this._loading.hide();
    }
  }

  translationExists(key: string): boolean {
    return !!this._translate._(key);
  }

  async openPasswordPolicy(event: Event): Promise<void> {
    const cssClass = 'passwordPolicyPopover';
    const popover = await this._popover.create({ component: IDEAPasswordPolicyComponent, event, cssClass });
    await popover.present();
  }

  goToResendLink(): void {
    this._nav.navigateForward(['auth', 'resend-link']);
  }
  goToAuth(): void {
    this._nav.navigateBack(['auth']);
  }
}
