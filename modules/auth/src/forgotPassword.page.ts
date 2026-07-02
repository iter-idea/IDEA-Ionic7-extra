import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NavController,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonInput
} from '@ionic/angular/standalone';
import { IDEAMessageService, IDEALoadingService, IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';

@Component({
  selector: 'idea-forgot-password',
  imports: [
    FormsModule,
    IDEATranslatePipe,
    IonButton,
    IonIcon,
    IonLabel,
    IonItem,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonContent,
    IonInput
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-content>
      <form class="flexBox">
        <ion-card class="authCard">
          <ion-card-header>
            <ion-card-title color="primary">{{ 'IDEA_AUTH.PASSWORD_RESET' | translate }}</ion-card-title>
            <ion-card-subtitle>{{ 'IDEA_AUTH.PASSWORD_RESET_HINT' | translate }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="inline">
                <ion-icon name="person-circle" color="primary" />
              </ion-label>
              <ion-input
                testId="forgotpassword.email"
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
                (keyup.enter)="forgotPassword()"
              />
            </ion-item>
            <ion-button
              testId="resetPasswordButton"
              expand="block"
              [title]="'IDEA_AUTH.RESET_MY_PASSWORD_HINT' | translate"
              (click)="forgotPassword()"
            >
              {{ 'IDEA_AUTH.RESET_MY_PASSWORD' | translate }}
            </ion-button>
            <ion-button
              testId="insertResetCodeButton"
              fill="clear"
              expand="block"
              class="smallCaseButton"
              [title]="'IDEA_AUTH.ALREADY_HAVE_A_RESET_CODE_HINT' | translate"
              (click)="goToConfirmPassword()"
            >
              {{ 'IDEA_AUTH.ALREADY_HAVE_A_RESET_CODE' | translate }}
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
export class IDEAForgotPasswordPage {
  private _nav = inject(NavController);
  private _message = inject(IDEAMessageService);
  private _loading = inject(IDEALoadingService);
  private _auth = inject(IDEAAuthService);

  email: string;

  async forgotPassword(): Promise<void> {
    try {
      await this._loading.show();
      await this._auth.forgotPassword(this.email);
      this._message.success('IDEA_AUTH.PASSWORD_RESET_CODE_SENT');
      this.goToConfirmPassword();
    } catch (error) {
      this._message.error('IDEA_AUTH.USER_NOT_FOUND');
    } finally {
      this._loading.hide();
    }
  }

  goToConfirmPassword(): void {
    this._nav.navigateForward(['auth', 'confirm-password'], { queryParams: { email: this.email || null } });
  }
  goToAuth(): void {
    this._nav.navigateBack(['auth']);
  }
}
