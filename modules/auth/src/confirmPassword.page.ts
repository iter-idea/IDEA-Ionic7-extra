import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NavController,
  PopoverController,
  IonContent,
  IonCardHeader,
  IonCard,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonInput
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
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
  selector: 'idea-confirm-password',
  imports: [
    FormsModule,
    IDEATranslatePipe,
    IonButton,
    IonIcon,
    IonLabel,
    IonItem,
    IonCardContent,
    IonCardTitle,
    IonCard,
    IonCardHeader,
    IonContent,
    IonInput
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-content>
      <form class="flexBox">
        <ion-card class="authCard">
          <ion-card-header>
            <ion-card-title color="primary">{{ 'IDEA_AUTH.CHANGE_THE_PASSWORD' | translate }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @if (errorMsg()) {
              <p testId="confirmpassword.error" class="errorBox">
                <b> {{ 'IDEA_AUTH.ERROR' | translate }}. </b>
                {{ errorMsg() }}
              </p>
            }
            <ion-item>
              <ion-label position="inline">
                <ion-icon name="person-circle" color="primary" />
              </ion-label>
              <ion-input
                testId="confirmpassword.email"
                type="email"
                inputmode="email"
                pattern="[A-Za-z0-9._%+\\-]{2,}@[a-zA-Z\\-_.]{2,}[.]{1}[a-zA-Z]{2,}"
                spellcheck="false"
                autocorrect="off"
                autocomplete="email"
                [placeholder]="'IDEA_AUTH.EMAIL' | translate"
                [title]="'IDEA_AUTH.EMAIL_HINT' | translate"
                [ngModelOptions]="{ standalone: true }"
                [(ngModel)]="email"
                (keyup.enter)="confirmPassword()"
              />
            </ion-item>
            <ion-item>
              <ion-label position="inline">
                <ion-icon name="disc" color="primary" />
              </ion-label>
              <ion-input
                testId="confirmpassword.code"
                type="text"
                spellcheck="false"
                autocorrect="off"
                autocomplete="off"
                [placeholder]="'IDEA_AUTH.RESET_CODE' | translate"
                [title]="'IDEA_AUTH.RESET_CODE_HINT' | translate"
                [ngModelOptions]="{ standalone: true }"
                [(ngModel)]="code"
                (keyup.enter)="confirmPassword()"
              />
            </ion-item>
            <ion-item>
              <ion-label position="inline">
                <ion-icon name="key" color="primary" />
              </ion-label>
              <ion-input
                testId="confirmpassword.password"
                type="password"
                spellcheck="false"
                autocorrect="off"
                autocomplete="new-password"
                [pattern]="_auth.getPasswordPolicyPatternForInput()"
                [clearOnEdit]="false"
                [placeholder]="'IDEA_AUTH.NEW_PASSWORD' | translate"
                [title]="'IDEA_AUTH.CHOOSE_A_PASSWORD' | translate"
                [ngModelOptions]="{ standalone: true }"
                [(ngModel)]="newPassword"
                (keyup.enter)="confirmPassword()"
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
            <ion-button
              testId="changePasswordButton"
              expand="block"
              [title]="'IDEA_AUTH.CHANGE_MY_PASSWORD_HINT' | translate"
              (click)="confirmPassword()"
            >
              {{ 'IDEA_AUTH.CHANGE_MY_PASSWORD' | translate }}
            </ion-button>
            <ion-button
              testId="haventReceivedResetCodeButton"
              fill="clear"
              expand="block"
              class="smallCaseButton"
              [title]="'IDEA_AUTH.HAVEN_T_RECEIVED_A_RESET_CODE_HINT' | translate"
              (click)="goToForgotPassword()"
            >
              {{ 'IDEA_AUTH.HAVEN_T_RECEIVED_A_RESET_CODE' | translate }}
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
export class IDEAConfirmPasswordPage implements OnInit {
  protected _env = inject(IDEAEnvironment);
  private _nav = inject(NavController);
  private _route = inject(ActivatedRoute);
  private _popover = inject(PopoverController);
  private _message = inject(IDEAMessageService);
  private _loading = inject(IDEALoadingService);
  private _translate = inject(IDEATranslationsService);
  _auth = inject(IDEAAuthService);

  email: string;
  newPassword: string;
  code: string;
  passwordPolicy: any;
  errorMsg = signal<string>(null);

  constructor() {
    this.passwordPolicy = this._env.idea.auth.passwordPolicy;
  }
  ngOnInit(): void {
    this.email = this._route.snapshot.queryParamMap.get('email') || null;
    if (!this.email && this._route.snapshot.queryParams.user)
      this.email = decodeURIComponent(this._route.snapshot.queryParams.user);
    this.code = this._route.snapshot.queryParams.code;
  }

  async confirmPassword(): Promise<void> {
    try {
      await this._loading.show();
      this.errorMsg.set(null);
      const errors = this._auth.validatePasswordAgainstPolicy(this.newPassword);
      if (errors.length === 0 && this.passwordPolicy.advancedPasswordCheck) {
        const emailParts = [...this.email?.split('@')[0].split(/\W/g)];
        errors.push(...(await this._auth.validatePasswordAgainstDatabases(this.newPassword, emailParts)));
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
      if (this.errorMsg()) return this._message.error('IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW');
      await this._auth.confirmPassword(this.email, this.code, this.newPassword);
      this._message.success('IDEA_AUTH.PASSWORD_CHANGED');
      this.goToAuth();
    } catch (error) {
      this.errorMsg.set((error as any).message);
      this._message.error('IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW');
    } finally {
      this._loading.hide();
    }
  }

  async openPasswordPolicy(event: Event): Promise<void> {
    const cssClass = 'passwordPolicyPopover';
    const popover = await this._popover.create({ component: IDEAPasswordPolicyComponent, event, cssClass });
    await popover.present();
  }

  goToForgotPassword(): void {
    this._nav.navigateBack(['auth', 'forgot-password']);
  }
  goToAuth(): void {
    this._nav.navigateBack(['auth']);
  }
}
