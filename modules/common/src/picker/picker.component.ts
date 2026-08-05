import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal
} from '@angular/core';
import { Config, IonIcon } from '@ionic/angular/standalone';
import { PickOption, PickOptionLike } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

import { IDEAPickerService, PickerInterface } from './picker.service';

/**
 * Where the component draws its own label. Default `none`: in an app with a field shell (a form row, an
 * `ion-item`), the label belongs to the shell, and a second one would only need to be undone in CSS.
 */
export type PickerLabelPlacement = 'none' | 'stacked' | 'start';

export type PickerAppearance = 'field' | 'chip';

@Component({
  selector: 'idea-picker',
  imports: [IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // resolved once from the app's mode; they are only the fallbacks of the public properties, so that an app
    // setting `--icon-color` still wins over them
    '[style.--pickerIconSizeByMode]': 'iconSizeByMode',
    '[style.--pickerIconColorByMode]': 'iconColorByMode',
    '[style.--pickerIconTransformByMode]': 'iconTransformByMode'
  },
  template: `
    @if (appearance() === 'chip') {
      <button
        type="button"
        class="pickerChip"
        role="combobox"
        aria-haspopup="listbox"
        [class.active]="hasSelection()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-label]="label()"
        [disabled]="disabled()"
        (click)="open($event)"
        (keydown)="handleKey($event)"
      >
        @if (label()) {
          <span class="pickerChipLabel">{{ label() }}:</span>
        }
        <span class="pickerChipValue">{{ preview() }}</span>
        @if (clearable() && hasSelection()) {
          <ion-icon
            class="pickerChipClear"
            icon="close-circle"
            [attr.aria-label]="clearLabel()"
            (click)="clear($event)"
          />
        }
      </button>
    } @else {
      <button
        type="button"
        class="pickerField"
        role="combobox"
        aria-haspopup="listbox"
        [class.stacked]="labelPlacement() === 'stacked'"
        [class.start]="labelPlacement() === 'start'"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-label]="label() || placeholder()"
        [disabled]="disabled()"
        (click)="open($event)"
        (keydown)="handleKey($event)"
      >
        @if (label() && labelPlacement() !== 'none') {
          <span class="pickerLabel">{{ label() }}</span>
        }
        <span class="pickerValue">
          <span class="pickerText" [class.placeholder]="!preview()">{{ preview() || placeholder() }}</span>
          <ion-icon class="pickerIcon" [class.expanded]="isOpen()" [icon]="toggleIcon" aria-hidden="true" />
        </span>
      </button>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        /* fill the box that frames it: a control that only answers to clicks on its own line of text
           leaves most of the field dead to the pointer */
        align-self: stretch;
      }
      /* The public custom properties are deliberately NOT declared on :host: with emulated encapsulation
         that compiles to an attribute selector, which would beat an app's "idea-picker { … }" rule. Each one
         is read with its default inline instead, so whoever sets it from outside always wins. */

      button {
        display: flex;
        align-items: center;
        width: 100%;
        min-width: 0;
        margin: 0;
        border: 0;
        background: none;
        font: inherit;
        color: var(--color, var(--ion-text-color));
        text-align: start;
        cursor: pointer;
      }
      button[disabled] {
        cursor: default;
        opacity: 0.38;
      }
      /* like every Ionic control: the field shell owns the focused state, so the two don't overlap */
      button:focus,
      button:focus-visible {
        outline: none;
      }

      button.pickerField {
        height: 100%;
        min-height: var(--min-height, auto);
        padding: var(--padding-top, 0px) var(--padding-end, 0px) var(--padding-bottom, 0px) var(--padding-start, 0px);
        font-size: var(--font-size, inherit);
      }
      button.pickerField.stacked {
        flex-direction: column;
        align-items: stretch;
      }
      button.pickerField.start {
        gap: 12px;
      }
      .pickerLabel {
        color: var(--label-color, var(--ion-color-medium, #92949c));
        font-size: 0.75em;
        line-height: 1.4;
      }
      button.pickerField.start .pickerLabel {
        flex: none;
        font-size: inherit;
      }
      .pickerValue {
        flex: 1;
        display: flex;
        align-items: center;
        min-width: 0;
        width: 100%;
      }
      .pickerText {
        flex: 1;
        min-width: 16px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .pickerText.placeholder {
        color: var(--placeholder-color, currentColor);
        opacity: var(--placeholder-opacity, 0.6);
      }
      /* size, colour and rotation are Ionic's own, per mode; the app can still override each of the three */
      .pickerIcon {
        flex: none;
        margin-inline-start: 4px;
        font-size: var(--icon-size, var(--pickerIconSizeByMode));
        color: var(--icon-color, var(--pickerIconColorByMode));
        transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .pickerIcon.expanded {
        transform: var(--icon-transform-expanded, var(--pickerIconTransformByMode));
      }
      @media (prefers-reduced-motion: reduce) {
        .pickerIcon {
          transition: none;
        }
      }

      button.pickerChip {
        width: auto;
        gap: 6px;
        min-height: 34px;
        padding: 0 12px;
        border: 1px solid var(--border-color, var(--ion-border-color, var(--ion-color-step-150, #e0e0e0)));
        border-radius: var(--border-radius, 999px);
        background: var(--background, transparent);
        font-size: 0.85em;
      }
      button.pickerChip.active {
        border-color: var(--color-selected, var(--ion-color-primary));
        background: var(--background-selected, transparent);
      }
      .pickerChipLabel {
        opacity: 0.6;
        font-weight: 500;
      }
      button.pickerChip.active .pickerChipLabel {
        color: var(--color-selected, var(--ion-color-primary));
        opacity: 0.85;
      }
      .pickerChipValue {
        font-weight: 600;
      }
      .pickerChipClear {
        flex: none;
        font-size: 1.05em;
        opacity: 0.55;
      }
      .pickerChipClear:hover {
        opacity: 1;
      }
    `
  ]
})
export class IDEAPickerComponent {
  private _picker = inject(IDEAPickerService);
  private _translate = inject(IDEATranslationsService);

  /**
   * The options to pick from: either `PickOption`s or the plain objects they can be built from.
   * Note: keep the list in a field or a computed — an array literal written in the template is a new
   * array on every change detection, and each one is normalised again.
   */
  readonly options = input<PickOption[], (PickOption | PickOptionLike)[]>([], { transform: PickOption.list });
  /**
   * The picked value: one value, or an array of them with `multiple`. With `reorder` the array is ordered.
   */
  readonly value = model<any>(null);
  readonly multiple = input(false, { transform: booleanAttribute });

  readonly label = input<string>('');
  readonly labelPlacement = input<PickerLabelPlacement>('none');
  readonly placeholder = input<string>('');
  /**
   * What to show when the value can't be resolved among the options: they haven't loaded yet, or they no
   * longer contain it. Unlike Ionic's `selectedText` it doesn't override a value the options do resolve,
   * so it can't end up contradicting the list it sits on.
   */
  readonly selectedText = input<string>('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly appearance = input<PickerAppearance>('field');
  /**
   * How many names to list before the preview collapses to their number.
   */
  readonly previewMax = input(2);

  /**
   * What to show when nothing is picked.
   */
  readonly emptyText = input<string>('');
  /**
   * What to show when everything is picked; with `noneMeansAll`, also when nothing is.
   */
  readonly allText = input<string>('');
  /**
   * Whether picking nothing means picking everything: the semantics of a filter.
   */
  readonly noneMeansAll = input(false, { transform: booleanAttribute });

  readonly interface = input<PickerInterface>('auto');
  /**
   * Beyond this many options the list gets a searchbar — and, with `interface: 'auto'`, opens centered.
   */
  readonly searchThreshold = input(10);
  readonly searchPlaceholder = input<string>('');
  readonly overlayCssClass = input<string>('');

  readonly sortBy = input<'name' | 'none'>('name');
  readonly groupBy = input<'auto' | 'none'>('auto');
  /**
   * Whether to show the value below the name of each option.
   */
  readonly showValue = input(false, { transform: booleanAttribute });
  readonly clearable = input(true, { transform: booleanAttribute });
  readonly selectAll = input(false, { transform: booleanAttribute });
  readonly maxSelection = input<number>(undefined);
  readonly reorder = input(false, { transform: booleanAttribute });
  readonly allowCustomValues = input(false, { transform: booleanAttribute });
  readonly customValuePrefix = input<string>('');

  isOpen = signal(false);

  protected readonly toggleIcon: string;
  protected readonly iconSizeByMode: string;
  protected readonly iconColorByMode: string;
  protected readonly iconTransformByMode: string;

  constructor() {
    // the mode is fixed at the root of each app, so the four values Ionic resolves per element are resolved once
    const isIOS = inject(Config).get('mode') === 'ios';
    this.toggleIcon = isIOS ? 'chevron-expand' : 'caret-down-sharp';
    this.iconSizeByMode = isIOS ? '1.125rem' : '0.8125rem';
    this.iconColorByMode = isIOS ? 'var(--ion-text-color-step-350, gray)' : 'var(--ion-text-color-step-500, gray)';
    this.iconTransformByMode = isIOS ? 'none' : 'rotate(180deg)';
  }

  private valueAsArray = computed((): any[] => {
    const value = this.value();
    if (value === undefined || value === null || value === '') return [];
    return Array.isArray(value) ? value : [value];
  });
  private selectedOptions = computed((): PickOption[] => {
    const options = this.options() ?? [];
    // the value dictates the order, so that a reordered selection reads back the way it was left
    return this.valueAsArray()
      .map(v => options.find(o => String(o.value) === String(v)))
      .filter(x => x);
  });

  hasSelection = computed((): boolean => this.valueAsArray().length > 0);
  clearLabel = computed((): string => this._translate._('IDEA_COMMON.PICKER.CLEAR'));

  preview = computed((): string => {
    const values = this.valueAsArray();
    if (!this.multiple()) {
      const picked = this.selectedOptions()[0];
      if (picked) return picked.name;
      if (!values.length) return '';
      // the options can't name this value: either they aren't loaded, or it was typed in as a custom one
      return this.selectedText() || String(values[0]);
    }

    const options = this.options() ?? [];
    const allText = this.allText();
    if (allText && options.length && values.length === options.length) return allText;
    if (allText && !values.length && this.noneMeansAll()) return allText;
    if (!values.length) return this.emptyText();

    const selected = this.selectedOptions();
    if (!selected.length && this.selectedText()) return this.selectedText();
    const names = selected.length ? selected.map(x => x.name) : values.map(x => String(x));
    if (names.length <= this.previewMax()) return names.join(', ');
    return this._translate._('IDEA_COMMON.PICKER.NUM_SELECTED', { num: values.length });
  });

  async open(event?: Event): Promise<void> {
    if (this.disabled() || this.isOpen()) return;
    this.isOpen.set(true);
    try {
      const picked = await this._picker.pick({
        options: this.options() ?? [],
        value: this.value(),
        multiple: this.multiple(),
        title: this.label() || this.searchPlaceholder(),
        searchPlaceholder: this.searchPlaceholder(),
        searchThreshold: this.searchThreshold(),
        sortBy: this.sortBy(),
        groupBy: this.groupBy(),
        showValue: this.showValue(),
        clearable: this.clearable(),
        selectAll: this.selectAll(),
        maxSelection: this.maxSelection(),
        reorder: this.reorder(),
        allowCustomValues: this.allowCustomValues(),
        customValuePrefix: this.customValuePrefix(),
        interface: this.interface(),
        overlayCssClass: this.overlayCssClass(),
        event
      });
      // `undefined` is a dismissal: the value doesn't change
      if (picked === undefined) return;
      if (picked === null) return this.value.set(this.multiple() ? [] : null);
      if (Array.isArray(picked)) this.value.set(picked.map(x => x.value));
      else this.value.set(picked.value);
    } finally {
      this.isOpen.set(false);
    }
  }

  clear(event?: Event): void {
    if (event) event.stopPropagation();
    if (this.disabled()) return;
    this.value.set(this.multiple() ? [] : null);
  }

  handleKey(event: KeyboardEvent): void {
    // Enter and Space already reach the click handler: the trigger is a native button
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.open(event);
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      if (!this.clearable() || !this.valueAsArray().length) return;
      event.preventDefault();
      // the list's "none" row can't be reached with the arrows, so emptying has its own key here
      if (this.multiple()) this.value.set(this.valueAsArray().slice(0, -1));
      else this.value.set(null);
    }
  }
}
