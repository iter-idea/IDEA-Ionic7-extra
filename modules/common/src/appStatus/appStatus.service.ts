import { ApplicationRef, Injectable, inject } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular/standalone';
import { AppStatus, markdown } from 'idea-toolbox';

import { IDEAEnvironment } from '../../environment';
import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAApiService } from '../api.service';
import { IDEAStorageService } from '../storage.service';
import { refreshVisibleIonicPages } from '../cdRefresh';
import { compareVersions } from '../versions';

/**
 * Check whether the app has some status message or update to handle.
 */
@Injectable({ providedIn: 'root' })
export class IDEAAppStatusService {
  protected _env = inject(IDEAEnvironment);
  private _nav = inject(NavController);
  private _toast = inject(ToastController);
  private _translate = inject(IDEATranslationsService);
  private _api = inject(IDEAApiService);
  private _storage = inject(IDEAStorageService);
  private _appRef = inject(ApplicationRef);

  appStatus: AppStatus;

  storageKey: string;
  statusFileURL: string;

  constructor() {
    this.storageKey = (this._env.idea.project || 'app').concat('_LAST_MESSAGE');
    this.statusFileURL =
      this._env.idea.app?.statusFileURL ??
      `${window.location.hostname === 'localhost' ? '' : window.location.origin}/assets/status.json`;
  }

  /**
   * Check the app's status and take according actions.
   */
  async check(options: { viaApi?: boolean; toastColor?: string; toastPosition?: string } = {}): Promise<AppStatus> {
    let appStatus: AppStatus;
    try {
      appStatus = await this.getStatus(options.viaApi);
    } catch (error) {
      return new AppStatus({ version: this._env.idea.app.version, latestVersion: this._env.idea.app.version });
    }
    if (appStatus.inMaintenance || appStatus.mustUpdate) await this._nav.navigateRoot(['app-status']);
    else await this.presentToast(appStatus, { color: options.toastColor, position: options.toastPosition });
    return appStatus;
  }
  private async getStatus(viaApi = false): Promise<AppStatus> {
    if (this.appStatus) return this.appStatus;
    this.appStatus = await (viaApi ? this.getStatusFromApi() : this.getStatusFromAsset());
    return this.appStatus;
  }
  private async getStatusFromApi(): Promise<AppStatus> {
    return new AppStatus(await this._api.getResource(['status']));
  }
  private async getStatusFromAsset(): Promise<AppStatus> {
    try {
      const res = await fetch(this.statusFileURL, { method: 'GET', cache: 'no-cache' });
      if (res.status !== 200) throw new Error('Status not found');
      const statusFromS3: InternalAppVersionStatusViaAsset = await res.json();
      return new AppStatus({
        version: this._env.idea.app.version,
        inMaintenance: statusFromS3.maintenance,
        mustUpdate: statusFromS3.minVersion
          ? compareVersions(statusFromS3.minVersion, this._env.idea.app.version) > 0
          : false,
        content: this.pickMessageLanguage(statusFromS3.messages?.[this._env.idea.app.version]),
        latestVersion: statusFromS3.latestVersion
      });
    } finally {
      // The native `fetch` settles outside the Angular zone; on the next macrotask refresh the visible
      // Ionic page(s) and tick the app shell so the caller's post-`await` state change renders on
      // Zone-based apps. See IDEAApiService.
      setTimeout(() => {
        refreshVisibleIonicPages();
        this._appRef.tick();
      });
    }
  }
  /**
   * The message of a version, in the user's language.
   *
   * A message has always been a single string, and it stays valid: the multi-language form is a map of language to
   * message (`{ "en": "…", "it": "…" }`), resolved on the current language, then on the default one, and finally on
   * whatever the file does carry — for an announcement, the wrong language is still better than silence.
   */
  private pickMessageLanguage(message: markdown | { [language: string]: markdown }): markdown {
    if (!message || typeof message === 'string') return message as markdown;

    return (
      message[this._translate.getCurrentLang()] ??
      message[this._translate.getDefaultLang()] ??
      Object.values(message)[0] ??
      ''
    );
  }

  private async presentToast(appStatus: AppStatus, options: { color?: string; position?: string } = {}): Promise<void> {
    let message = appStatus.content || '';
    if (!message && compareVersions(this._env.idea.app.version, appStatus.latestVersion) < 0)
      message = this._translate._('IDEA_COMMON.APP_STATUS.NEW_VERSION', { newVersion: appStatus.latestVersion });

    if (!message) return;

    const messageAlreadyRead = await this._storage.get(this.storageKey);
    if (messageAlreadyRead === message) return; // user already saw this message

    const dismissMessage = (): Promise<void> => this._storage.set(this.storageKey, message);
    const buttons: any = [
      { text: this._translate._('IDEA_COMMON.APP_STATUS.GOT_IT'), role: 'cancel', handler: dismissMessage }
    ];
    const color = options.color || 'dark';
    const position: any = options.position || 'bottom';

    const toast = await this._toast.create({ message, buttons, position, color });
    await toast.present();
  }
}

interface InternalAppVersionStatusViaAsset {
  /**
   * Whether the app is in maintenance mode.
   */
  maintenance: boolean;
  /**
   * The latest version of the app.
   */
  latestVersion: string;
  /**
   * The minimum required version to access the app.
   */
  minVersion: string;
  /**
   * The optional messages for each of the app's versions.
   *
   * A message is either a single string, in whatever language the app was written for, or a map of language to
   * message — `{ "4.6.0": { "en": "…", "it": "…" } }` — shown in the user's own language.
   */
  messages: { [version: string]: markdown | { [language: string]: markdown } };
}
