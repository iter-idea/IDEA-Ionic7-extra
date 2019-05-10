import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEALanguagePickerComponent } from './languagePicker.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild()
  ],
  declarations: [
    IDEALanguagePickerComponent
  ],
  entryComponents: [
    IDEALanguagePickerComponent
  ],
  exports: [
    IDEALanguagePickerComponent
  ]
})
export class IDEALanguagePickerModule {}
