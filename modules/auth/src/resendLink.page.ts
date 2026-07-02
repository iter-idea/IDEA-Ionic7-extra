import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NavController,
  IonContent,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonCardSubtitle,
  IonInput,
  IonItem,
  IonLabel,
  IonButton
} from '@ionic/angular/standalone';
import { IDEAMessageService, IDEALoadingService, IDEATranslationsService, IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';

@Component({
  selector: 'idea-resend-link',
  imports: [
    FormsModule,
    IDEATranslatePipe,
    IonButton,
    IonLabel,
    IonItem,
    IonInput,
    IonCardSubtitle,
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonIcon,
    IonContent,
    IonInput
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-content>
      <form class="flexBox">
        <ion-card class="authCard">
          <ion-card-header>
            <ion-card-title color="primary">{{ 'IDEA_AUTH.CONFIRM_ACCOUNT' | translate }}</ion-card-title>
            <ion-card-subtitle>{{ 'IDEA_AUTH.RESEND_CONFIRMATION_LINK_HINT' | translate }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            @if (errorMsg()) {
              <p testId="resendlink.error" class="errorBox">
                <b> {{ 'IDEA_AUTH.ERROR' | translate }}. </b>
                {{ errorMsg() }}
              </p>
            }
            <ion-item>
              <ion-label position="inline">
                <ion-icon name="person-circle" color="primary" />
              </ion-label>
              <ion-input
                testId="resendlink.email"
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
                (keyup.enter)="resendConfirmationLink()"
              />
            </ion-item>
            <ion-button
              testId="resendLinkButton"
              expand="block"
              [title]="'IDEA_AUTH.RESEND_LINK_HINT' | translate"
              (click)="resendConfirmationLink()"
            >
              {{ 'IDEA_AUTH.RESEND_LINK' | translate }}
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
export class IDEAResendLinkPage {
  private _nav = inject(NavController);
  private _message = inject(IDEAMessageService);
  private _loading = inject(IDEALoadingService);
  private _auth = inject(IDEAAuthService);
  private _translate = inject(IDEATranslationsService);

  email: string;
  errorMsg = signal<string>(null);

  async resendConfirmationLink(): Promise<void> {
    this.errorMsg.set(null);
    if (!this.email) {
      this.errorMsg.set(this._translate._('IDEA_AUTH.VALID_EMAIL_OBLIGATORY'));
      this._message.error('IDEA_AUTH.SENDING_FAILED');
      return;
    }
    try {
      await this._loading.show();
      await this._auth.resendConfirmationCode(this.email);
      this._message.success('IDEA_AUTH.CONFIRMATION_LINK_SENT');
      this.goToAuth();
    } catch (error) {
      this.errorMsg.set(this._translate._('IDEA_AUTH.IS_THE_EMAIL_CORRECT'));
      this._message.error('IDEA_AUTH.SENDING_FAILED');
    } finally {
      this._loading.hide();
    }
  }

  goToAuth(): void {
    this._nav.navigateBack(['auth']);
  }
}
