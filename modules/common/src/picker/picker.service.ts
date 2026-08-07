import { Injectable, inject } from '@angular/core';
import { ModalController, PopoverController, Platform } from '@ionic/angular/standalone';
import { PickOption, PickOptionLike } from 'idea-toolbox';

import { IDEAPickerListComponent } from './pickerList.component';

/**
 * How the list is presented.
 *  - `auto`: a sheet on mobile; anchored to the trigger when the list is short enough not to need a search;
 *    centered otherwise, so that a long list always opens in the same place whatever the field's position.
 *  - the others force one of the three.
 */
export type PickerInterface = 'auto' | 'popover' | 'modal' | 'sheet';

/**
 * Below this many pixels of free space above and below the trigger an anchored popover would be squashed,
 * so it falls back to the centered overlay.
 */
const MIN_ANCHORED_SPACE = 240;
const MOBILE_MAX_WIDTH = 767;

export interface IDEAPickerParams {
  /**
   * The options to pick from: either `PickOption`s or the plain objects they can be built from.
   */
  options: (PickOption | PickOptionLike)[];
  /**
   * What is being picked: it titles the overlay when this covers the screen.
   */
  title?: string;
  /**
   * The current value: it pre-selects the options, and with `reorder` it dictates their order.
   */
  value?: any;
  multiple?: boolean;
  searchPlaceholder?: string;
  /**
   * Beyond this many options the list gets a searchbar — and, with `interface: 'auto'`, opens centered.
   * With `allowCustomValues` the searchbar is always there.
   */
  searchThreshold?: number;
  sortBy?: 'name' | 'none';
  groupBy?: 'auto' | 'none';
  showValue?: boolean;
  clearable?: boolean;
  selectAll?: boolean;
  maxSelection?: number;
  reorder?: boolean;
  /**
   * `auto` opens a long list on what is already picked, in a band above the rest.
   */
  pinSelected?: 'auto' | 'none';
  allowCustomValues?: boolean;
  customValuePrefix?: string;
  /**
   * The label of the row that empties the selection, when "nothing" has a name of its own.
   */
  emptyText?: string;
  interface?: PickerInterface;
  /**
   * A class on the overlay, to set its custom properties.
   */
  overlayCssClass?: string;
  /**
   * The event that opened the picker: it anchors the popover.
   */
  event?: Event;
}

/**
 * Open a list of options and get back the pick, without needing a field.
 */
@Injectable({ providedIn: 'root' })
export class IDEAPickerService {
  private _modal = inject(ModalController);
  private _popover = inject(PopoverController);
  private _platform = inject(Platform);

  /**
   * Pick one option (or several, with `multiple`).
   * @returns the option(s) picked, `null` if the selection was cleared, `undefined` if the picker was dismissed.
   */
  async pick(params: IDEAPickerParams): Promise<PickOption | PickOption[] | null | undefined> {
    const searchThreshold = params.searchThreshold ?? 10;
    const presentation = this.resolveInterface(params, searchThreshold);

    const options = PickOption.list(params.options);
    /* one rule, in every presentation: a multiple selection applies as it's made, so leaving the list
       never loses anything and "Done" only ever means "close" */
    let lastReported: PickOption[];

    const componentProps = {
      options,
      onSelectionChange: (picked: PickOption[]): void => void (lastReported = picked),
      title: params.title,
      value: params.value,
      multiple: !!params.multiple,
      searchPlaceholder: params.searchPlaceholder,
      searchThreshold,
      sortBy: params.sortBy ?? 'none',
      groupBy: params.groupBy ?? 'auto',
      showValue: !!params.showValue,
      clearable: params.clearable ?? true,
      selectAll: !!params.selectAll,
      maxSelection: params.maxSelection,
      reorder: !!params.reorder,
      pinSelected: params.pinSelected ?? 'auto',
      allowCustomValues: !!params.allowCustomValues,
      customValuePrefix: params.customValuePrefix,
      emptyText: params.emptyText,
      presentation
    };

    const cssClass = [
      'ideaPicker'.concat(presentation === 'popover' ? 'Popover' : presentation === 'sheet' ? 'Sheet' : 'Modal')
    ];
    if (params.overlayCssClass) cssClass.push(params.overlayCssClass);

    const overlay =
      presentation === 'popover'
        ? await this._popover.create({
            component: IDEAPickerListComponent,
            componentProps,
            cssClass,
            event: params.event,
            showBackdrop: true
          })
        : await this._modal.create({
            component: IDEAPickerListComponent,
            componentProps,
            cssClass,
            ...(presentation === 'sheet' ? { breakpoints: [0, 1], initialBreakpoint: 1, handle: false } : {})
          });

    await overlay.present();
    const { data } = await overlay.onDidDismiss();
    if (data === undefined && lastReported) return lastReported;
    return data;
  }

  private resolveInterface(params: IDEAPickerParams, searchThreshold: number): Exclude<PickerInterface, 'auto'> {
    const requested = params.interface ?? 'auto';
    if (requested !== 'auto') return requested;

    if (this._platform.width() <= MOBILE_MAX_WIDTH) return 'sheet';
    // a list that needs a search is tall: anchoring it means risking it gets squashed against a screen edge
    if ((params.options?.length ?? 0) > searchThreshold) return 'modal';
    if (!params.event) return 'modal';
    return this.hasRoomToAnchor(params.event) ? 'popover' : 'modal';
  }
  private hasRoomToAnchor(event: Event): boolean {
    const target = event.target as HTMLElement;
    if (!target?.getBoundingClientRect) return false;
    const { top, bottom } = target.getBoundingClientRect();
    return Math.max(top, window.innerHeight - bottom) >= MIN_ANCHORED_SPACE;
  }
}
