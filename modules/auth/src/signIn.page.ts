import { Component, inject } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { IDEAEnvironment, IDEAMessageService, IDEALoadingService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAAuthService, LoginOutcomeActions } from './auth.service';

@Component({
  selector: 'idea-sign-in',
  templateUrl: 'signIn.page.html',
  styleUrls: ['auth.scss']
})
export class IDEASignInPage {
  protected env = inject(IDEAEnvironment);

  title: string;
  registrationPossible: boolean;
  hasIntroPage: boolean;
  website: string;

  email: string;
  password: string;
  agreementsCheck = true;
  newAccountRegistered = false;
  errorMsg: string;
  darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  constructor(
    private navCtrl: NavController,
    private message: IDEAMessageService,
    private loading: IDEALoadingService,
    private t: IDEATranslationsService,
    private auth: IDEAAuthService
  ) {
    this.title = this.env.idea.auth.title;
    this.registrationPossible = this.env.idea.auth.registrationIsPossible;
    this.hasIntroPage = this.env.idea.auth.hasIntroPage;
    this.website = this.env.idea.auth.website;
  }
  ionViewDidEnter(): void {
    // manage the scenario in which we just created a new account (show a explanatory message: email must be confirmed)
    this.newAccountRegistered = !!this.auth.getNewAccountJustRegistered();
    if (this.newAccountRegistered) this.email = this.auth.getNewAccountJustRegistered();
  }

  async login(): Promise<void> {
    if (!this.agreementsCheck) return;
    try {
      this.errorMsg = null;
      await this.loading.show();
      const loginAction = await this.auth.login(this.email, this.password);
      if (loginAction === LoginOutcomeActions.NEW_PASSWORD) this.navCtrl.navigateForward(['auth', 'new-password']);
      else if (loginAction === LoginOutcomeActions.MFA_CHALLENGE)
        this.navCtrl.navigateForward(['auth', 'mfa-challenge']);
      else if (loginAction === LoginOutcomeActions.MFA_SETUP) this.navCtrl.navigateForward(['auth', 'setup-mfa']);
      else window.location.assign('');
    } catch (err) {
      if ((err as any).name === 'UserNotConfirmedException')
        this.errorMsg = this.t._('IDEA_AUTH.CONFIRM_YOUR_EMAIL_TO_LOGIN');
      else if (
        (err as any).name === 'UserLambdaValidationException' &&
        (err as any).message?.includes('@IDEA_COGNITO_TRANSITION')
      )
        this.errorMsg = this.t._('IDEA_AUTH.CHANGE_YOUR_PASSWORD_TO_LOGIN');
      this.message.error('IDEA_AUTH.AUTHENTICATION_FAILED');
    } finally {
      this.loading.hide();
    }
  }

  goToIntro(): void {
    this.navCtrl.navigateBack(['intro']);
  }
  goToForgotPassword(): void {
    this.navCtrl.navigateForward(['auth/forgot-password']);
  }
  goToRegistration(): void {
    this.navCtrl.navigateForward(['auth', 'sign-up']);
  }

  translationExists(key: string): boolean {
    return !!this.t._(key);
  }

  async openLink(url: string): Promise<void> {
    await Browser.open({ url });
  }
}
