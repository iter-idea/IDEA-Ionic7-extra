import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

import { IDEATranslationsService } from './translations/translations.service';

@Injectable()
export class IDEAMessageService {
  constructor(public toastCtrl: ToastController, public t: IDEATranslationsService) {}

  /**
   * Show a generic message toast.
   * @param message message to show
   * @param color Ionic colors defined in the theme
   */
  protected show(message: string, color: string, dontTranslate: boolean) {
    this.toastCtrl
      .create({
        message: dontTranslate ? message : this.t._(message),
        duration: 3000,
        position: 'bottom',
        color,
        buttons: [{ text: 'X', role: 'cancel' }]
      })
      .then(toast => toast.present());
  }
  /**
   * Show an info message toast.
   * @param message message to show
   */
  public info(message: string, dontTranslate?: boolean) {
    this.show(message, 'dark', dontTranslate);
  }
  /**
   * Show a success message toast.
   * @param message message to show
   */
  public success(message: string, dontTranslate?: boolean) {
    this.show(message, 'success', dontTranslate);
  }
  /**
   * Show an error message toast.
   * @param message message to show
   */
  public error(message: string, dontTranslate?: boolean) {
    this.show(message, 'danger', dontTranslate);
  }
  /**
   * Show an warning message toast.
   * @param message message to show
   */
  public warning(message: string, dontTranslate?: boolean) {
    this.show(message, 'warning', dontTranslate);
  }
}