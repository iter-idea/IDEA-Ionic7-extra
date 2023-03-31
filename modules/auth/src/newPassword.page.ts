import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { IDEAMessageService, IDEALoadingService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';

@Component({
  selector: 'idea-new-password',
  templateUrl: 'newPassword.page.html',
  styleUrls: ['auth.scss']
})
export class IDEANewPasswordPage implements OnInit {
  newPassword: string;
  errorMsg: string;

  constructor(
    private navCtrl: NavController,
    private message: IDEAMessageService,
    private loading: IDEALoadingService,
    private auth: IDEAAuthService,
    private t: IDEATranslationsService
  ) {}
  ngOnInit(): void {
    if (!this.auth.challengeUsername) this.goToAuth();
  }

  async confirmNewPassword(): Promise<void> {
    try {
      this.errorMsg = null;
      await this.loading.show();
      await this.auth.confirmNewPassword(this.newPassword);
      window.location.assign('');
    } catch (error) {
      this.errorMsg = this.t._('IDEA_AUTH.PASSWORD_POLICY_VIOLATION', { n: 8 });
      this.message.error(this.errorMsg, true);
    } finally {
      this.loading.hide();
    }
  }

  goToAuth(): void {
    this.navCtrl.navigateBack(['auth']);
  }
}
