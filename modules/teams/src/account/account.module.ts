import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { IDEATranslationsModule } from '@idea-ionic/common';

import { IDEAAccountPage } from './account.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IDEATranslationsModule,
    RouterModule.forChild([{ path: '', component: IDEAAccountPage }])
  ],
  declarations: [IDEAAccountPage]
})
export class IDEAAccountModule {}
