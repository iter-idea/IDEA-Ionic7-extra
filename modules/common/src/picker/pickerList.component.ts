import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Input,
  OnInit,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import {
  IonCheckbox,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonReorder,
  IonReorderGroup,
  IonSearchbar,
  ItemReorderEventDetail,
  ModalController,
  PopoverController
} from '@ionic/angular/standalone';
import { PickOption, PickOptionLike } from 'idea-toolbox';

import { IDEATranslatePipe } from '../translations/translate.pipe';

/** How many options enter the DOM at a time. */
const PAGE_SIZE = 60;

/**
 * A row of the list: either a group heading or a pickable option.
 * Headings aren't reachable by keyboard, so only the options carry an index.
 */
interface Row {
  group?: string;
  option?: PickOption;
  index?: number;
}

@Component({
  selector: 'idea-picker-list',
  imports: [
    IDEATranslatePipe,
    IonIcon,
    IonSearchbar,
    IonContent,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonReorder,
    IonReorderGroup
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showHeader()) {
      <div class="pickerHeader">
        @if (showTitleRow()) {
          <div class="pickerHeaderMain">
            <button
              type="button"
              class="pickerHeaderBtn"
              [title]="'IDEA_COMMON.PICKER.CLOSE' | translate"
              (click)="cancel()"
            >
              <ion-icon icon="chevron-down" aria-hidden="true" />
            </button>
            <span class="pickerHeaderTitle">{{ title }}</span>
          </div>
          @if (withSearch) {
            <div class="pickerHeaderSearch">
              <ion-searchbar
                #searchbar
                [debounce]="100"
                [placeholder]="searchPlaceholder || ('IDEA_COMMON.PICKER.SEARCH' | translate)"
                (ionInput)="search($event.target.value)"
              />
            </div>
          }
        } @else {
          <div class="pickerHeaderMain">
            <button
              type="button"
              class="pickerHeaderBtn"
              [title]="'IDEA_COMMON.PICKER.CLOSE' | translate"
              (click)="cancel()"
            >
              <ion-icon icon="chevron-down" aria-hidden="true" />
            </button>
            <ion-searchbar
              #searchbar
              [debounce]="100"
              [placeholder]="searchPlaceholder || ('IDEA_COMMON.PICKER.SEARCH' | translate)"
              (ionInput)="search($event.target.value)"
            />
          </div>
        }
        @if (multiple) {
          <div class="pickerHeaderMeta">
            <span class="pickerHeaderCount">
              {{ 'IDEA_COMMON.PICKER.NUM_SELECTED' | translate: { num: selected().length } }}
              @if (maxSelection) {
                {{ 'IDEA_COMMON.PICKER.LIMIT_OF_NUM' | translate: { num: maxSelection } }}
              }
            </span>
            @if (selectAll && !maxSelection) {
              <span class="pickerHeaderActions">
                <button type="button" (click)="checkAll(true)">
                  {{ 'IDEA_COMMON.PICKER.SELECT_ALL' | translate }}
                </button>
                <button type="button" (click)="checkAll(false)">
                  {{ 'IDEA_COMMON.PICKER.DESELECT_ALL' | translate }}
                </button>
              </span>
            }
          </div>
        }
      </div>
    }
    <ion-content [scrollEvents]="true" (ionScroll)="onScroll($event)">
      @if (canClear()) {
        <ion-item
          class="pickerOption clear"
          button
          role="option"
          [id]="rowId(0)"
          [detail]="false"
          [class.active]="activeIndex() === 0"
          [class.selected]="!selected().length"
          (click)="clear()"
        >
          <ion-label>{{ emptyText || ('IDEA_COMMON.PICKER.NONE' | translate) }}</ion-label>
          @if (!selected().length) {
            <ion-icon slot="end" icon="checkmark" color="primary" size="small" />
          }
        </ion-item>
      }
      @if (allowCustomValues && query() && !exactMatchExists()) {
        <ion-item class="pickerOption custom" button [detail]="false" (click)="pickCustomValue()">
          <ion-icon slot="start" icon="add" size="small" />
          <ion-label>
            @if (customValuePrefix) {
              <span class="customValuePrefix">{{ customValuePrefix }}</span>
            }
            <i>{{ query() }}</i>
          </ion-label>
        </ion-item>
      }
      @if (reorder && selected().length) {
        <ion-reorder-group class="pickerReorderGroup" [disabled]="false" (ionItemReorder)="handleReorder($event)">
          @for (option of selected(); track option.value) {
            <ion-item class="pickerOption selected">
              <ion-reorder slot="start" />
              <ion-checkbox labelPlacement="end" justify="start" [checked]="true" (ionChange)="toggle(option)">
                {{ option.name }}
              </ion-checkbox>
            </ion-item>
          }
        </ion-reorder-group>
      }
      <div class="pickerList" role="listbox" [attr.aria-multiselectable]="multiple">
        @for (row of rows(); track $index) {
          @if (row.group) {
            <div class="pickerGroup" role="group" [attr.aria-label]="row.group">{{ row.group }}</div>
          } @else {
            <ion-item
              class="pickerOption"
              role="option"
              lines="inset"
              [id]="rowId(row.index)"
              [class.active]="row.index === activeIndex()"
              [class.selected]="isSelected(row.option)"
              [attr.aria-selected]="isSelected(row.option)"
              [button]="!multiple"
              [detail]="false"
              (click)="pickIfSingle(row.option)"
            >
              @if (multiple) {
                <ion-checkbox
                  labelPlacement="end"
                  justify="start"
                  [checked]="isSelected(row.option)"
                  [disabled]="isBlockedByLimit(row.option)"
                  (ionChange)="toggle(row.option)"
                >
                  <span class="pickerOptionName">{{ row.option.name }}</span>
                  @if (showValue && row.option.name !== String(row.option.value)) {
                    <p class="pickerOptionMeta">{{ row.option.value }}</p>
                  }
                  @if (row.option.description) {
                    <p class="pickerOptionMeta">{{ row.option.description }}</p>
                  }
                </ion-checkbox>
              } @else {
                <ion-label>
                  <span class="pickerOptionName">{{ row.option.name }}</span>
                  @if (showValue && row.option.name !== String(row.option.value)) {
                    <p class="pickerOptionMeta">{{ row.option.value }}</p>
                  }
                  @if (row.option.description) {
                    <p class="pickerOptionMeta">{{ row.option.description }}</p>
                  }
                </ion-label>
                @if (isSelected(row.option)) {
                  <ion-icon slot="end" icon="checkmark" color="primary" size="small" />
                }
              }
            </ion-item>
          }
        } @empty {
          @if (showEmptyMessage()) {
            <ion-item class="pickerOption" lines="none">
              <ion-label class="ion-text-center">
                <i>{{ 'IDEA_COMMON.PICKER.NO_ELEMENTS_FOUND' | translate }}</i>
              </ion-label>
            </ion-item>
          }
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      /* The public custom properties are deliberately NOT declared here: with emulated encapsulation
         :host compiles to an attribute selector, which would beat an app's "idea-picker-list { … }" rule.
         Each one is read with its default inline instead, so whoever sets it from outside always wins.
         The surface is resolved once into a private name: reading --background inside the value of
         --background would be a circular reference, which CSS throws away. */
      :host {
        --pickerSurface: var(--background, var(--ion-item-background, var(--ion-background-color, #fff)));
      }
      /* a plain header, not an ion-toolbar: a toolbar picks up the app's (usually dark) toolbar theme,
         which on a small anchored popover reads as a different component altogether */
      /* a tinted header needs its own ink: a dark background under the page's dark text is unreadable */
      .pickerHeader {
        /* an opaque header clipped by the overlay's rounded corner leaves a hairline of the surface
           beneath showing along the curve: it has to carry the same curve, not be cut by it */
        border-radius: var(--header-radius, 0);
        background: var(--header-background, var(--pickerSurface));
        color: var(--header-color, inherit);
        border-bottom: 1px solid var(--option-border-color, var(--ion-border-color, var(--ion-color-step-150, #e0e0e0)));
      }
      .pickerHeaderMain {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
      }
      .pickerHeaderTitle {
        flex: 1;
        min-width: 0;
        padding: 0 6px;
        font-weight: 600;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .pickerHeaderBtn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        min-width: 44px;
        height: 44px;
        padding: 0 10px;
        font-size: 0.95em;
        border: 0;
        border-radius: 4px;
        background: none;
        color: inherit;
        font: inherit;
        font-size: 0.85em;
        opacity: 0.7;
        cursor: pointer;
      }
      .pickerHeaderBtn:hover,
      .pickerHeaderBtn:focus-visible {
        opacity: 1;
        background: var(--option-background-selected, rgba(var(--ion-color-primary-rgb), 0.09));
      }
      .pickerHeaderBtn ion-icon {
        font-size: 20px;
      }
      .pickerHeaderBtn.wide {
        font-weight: 600;
        text-transform: uppercase;
      }
      /* the searchbar is a field resting on the header, not a slab filling it: it needs a margin to read
         as one, and a corner that isn't the overlay's own */
      .pickerHeaderSearch {
        padding: 0 14px 10px;
      }
      /* emptying the field is a choice like the others, so it reads like one: same row, muted ink */
      ion-item.pickerOption.clear {
        --color: var(--ion-color-medium);
      }
      .pickerHeaderMeta {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 14px;
        padding: 0 10px 6px 14px;
        font-size: 0.75em;
      }
      .pickerHeaderCount {
        opacity: 0.65;
      }
      .pickerHeaderActions {
        display: flex;
        gap: 4px;
      }
      .pickerHeaderActions button {
        border: 0;
        border-radius: 4px;
        background: none;
        color: inherit;
        font: inherit;
        padding: 3px 8px;
        cursor: pointer;
        opacity: 0.8;
      }
      .pickerHeaderActions button:hover,
      .pickerHeaderActions button:focus-visible {
        opacity: 1;
        background: var(--option-background-selected, rgba(var(--ion-color-primary-rgb), 0.09));
      }
      ion-content {
        --background: var(--pickerSurface);
      }
      ion-searchbar {
        --box-shadow: var(--search-box-shadow, none);
        --border-radius: var(--search-border-radius, 8px);
        flex: 1;
        min-width: 0;
        min-height: 38px;
        padding: 0;
      }
      /* in a popover the searchbar shares the row with the close button, so it keeps its own gap */
      .pickerHeaderMain ion-searchbar {
        margin: 2px 4px 2px 0;
      }
      .pickerGroup {
        position: sticky;
        top: 0;
        z-index: 1;
        padding: 7px var(--option-padding-start, 16px);
        font-size: 0.72em;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--group-color, var(--ion-color-medium, #92949c));
        /* the tint is layered over an opaque surface: a sticky heading must not let rows show through */
        background-color: var(--group-background, var(--option-background, var(--pickerSurface)));
        background-image: linear-gradient(
          var(--group-tint, rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.05)),
          var(--group-tint, rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.05))
        );
      }
      /* room to breathe where one group ends and the next begins */
      ion-item.pickerOption + .pickerGroup {
        margin-top: 6px;
      }
      /* the last row of a group carries no divider: the next heading is already the separation, and
         drawing both reads as a double border */
      ion-item.pickerOption:has(+ .pickerGroup),
      ion-item.pickerOption:last-child,
      .pickerReorderGroup ion-item:last-child {
        --inner-border-width: 0;
      }
      ion-item.pickerOption {
        --background: var(--option-background, var(--pickerSurface));
        --min-height: var(--option-min-height, 48px);
        --padding-start: var(--option-padding-start, 16px);
        --inner-padding-end: 14px;
        --border-color: var(--option-border-color, var(--ion-border-color, var(--ion-color-step-150, #e0e0e0)));
        font-size: var(--option-font-size, inherit);
      }
      ion-item.pickerOption.selected {
        --background: var(--option-background-selected, rgba(var(--ion-color-primary-rgb), 0.09));
      }
      /* the option the arrow keys are on: it must read as "here", without looking selected */
      ion-item.pickerOption.active {
        --background: var(--option-background-selected, rgba(var(--ion-color-primary-rgb), 0.09));
        box-shadow: inset 3px 0 0 var(--ion-color-primary);
      }
      ion-item.pickerOption ion-checkbox {
        margin-inline-end: 12px;
      }
      .pickerOptionMeta {
        font-size: 0.8em;
        color: var(--ion-color-medium);
        margin: 1px 0 0;
      }
      /* in the list the whole name has to be readable: you can't choose what you can't read.
         Ionic's label truncates by default, so the wrapping is asked for explicitly */
      .pickerOptionName,
      .pickerOptionMeta {
        display: block;
        white-space: normal;
        overflow-wrap: anywhere;
      }
      ion-item.pickerOption ion-label {
        white-space: normal;
      }
      .customValuePrefix {
        font-weight: 600;
        padding-right: 6px;
      }
    `
  ]
})
export class IDEAPickerListComponent implements OnInit {
  private _modal = inject(ModalController);
  private _popover = inject(PopoverController);

  /**
   * Note: the overlay is created through `componentProps`, which can't feed signal inputs.
   */
  @Input() options: (PickOption | PickOptionLike)[] = [];
  /**
   * The current value: it pre-selects the options, and with `reorder` it dictates their order.
   */
  @Input() value: any;
  /**
   * Whether more than one option can be picked.
   */
  @Input() multiple = false;
  /**
   * What the searchbar suggests to type.
   */
  @Input() searchPlaceholder?: string;
  /**
   * Beyond this many options the list gets a searchbar.
   */
  @Input() searchThreshold = 10;
  /**
   * `none` keeps the options in the order they are given; `name` sorts them alphabetically.
   */
  @Input() sortBy: 'name' | 'none' = 'none';
  /**
   * `auto` groups the list under headings when at least two options carry a different `group`.
   */
  @Input() groupBy: 'auto' | 'none' = 'auto';
  /**
   * Whether to show each option's value below its name.
   */
  @Input() showValue = false;
  /**
   * Whether the list offers a row that empties the selection.
   */
  @Input() clearable = true;
  /**
   * Whether to offer selecting or deselecting everything the search is showing.
   */
  @Input() selectAll = false;
  /**
   * How many options can be picked at once.
   */
  @Input() maxSelection?: number;
  /**
   * Whether the picked options can be dragged into an order.
   */
  @Input() reorder = false;
  /**
   * Whether a value that is not among the options can be typed in and picked.
   */
  @Input() allowCustomValues = false;
  /**
   * What to write before a typed-in value in the list.
   */
  @Input() customValuePrefix?: string;
  /** The label of the row that empties the selection. */
  @Input() emptyText?: string;
  /**
   * How the overlay was presented: it decides which controller dismisses it, and whether the header is
   * needed at all — only an anchored popover can be left by tapping outside it.
   */
  @Input() presentation: 'popover' | 'modal' | 'sheet' = 'modal';
  /**
   * What is being picked. It titles the overlay when this covers the screen, where the field that opened
   * it is no longer visible to say so.
   */
  @Input() title?: string;
  /**
   * Called on every change. The picker applies as it goes, in every presentation: a list that commits on
   * Done in one shape and as-you-click in another is two controls wearing the same name.
   */
  @Input() onSelectionChange?: (picked: PickOption[]) => void;

  /**
   * The selection, in the order it was made: with `reorder` the order is part of the value.
   */
  selected = signal<PickOption[]>([]);
  query = signal<string>('');
  activeIndex = signal<number>(-1);
  withSearch = false;
  showHeader = computed((): boolean => this.withSearch || this.presentation !== 'popover');
  /* an anchored popover sits next to its field, which is still on screen and already says what this is */
  showTitleRow = computed((): boolean => this.presentation !== 'popover' && !!this.title);
  /* with `multiple` the same job is done by "deselect all", in the row that counts the selection */
  canClear = computed((): boolean => this.clearable && !this.multiple && !this.query());
  /**
   * With `reorder` the rows below hold only what isn't chosen yet, so an empty run of rows means
   * "everything is already in your order above" — not that the list found nothing.
   */
  showEmptyMessage = computed((): boolean => !this.matching().length && (!this.allowCustomValues || !this.query()));
  /**
   * How many options are in the DOM. It grows on scroll and whenever the keyboard walks close to the end,
   * so a long list stays light without the arrows hitting an invisible wall — which is what the old
   * components did, where the infinite scroll only ever answered to the mouse.
   */
  renderLimit = signal(PAGE_SIZE);

  /** The clear row takes index 0 when it's there, so the options start after it. */
  private optionOffset = computed((): number => (this.canClear() ? 1 : 0));
  private navigableCount = computed((): number => this.matching().length + this.optionOffset());
  readonly searchbar = viewChild<IonSearchbar>('searchbar');
  readonly content = viewChild(IonContent);

  protected readonly String = String;

  private sorted: PickOption[] = [];
  /** The options as the class, whatever shape they came in. */
  private allOptions: PickOption[] = [];
  /** Ids must be unique per instance: a picker opened over another one would otherwise collide. */
  protected readonly instanceId = 'ideaPicker'.concat(String(Math.round(Math.random() * 1e9)));

  /**
   * The options that survive the search, in the order the arrow keys walk them.
   */
  matching = computed((): PickOption[] => {
    const query = this.query();
    return this.sorted.filter(x => x.matches(query));
  });
  /**
   * Headings are interleaved here, so the template renders one list and the keyboard still sees indexes.
   */
  rows = computed((): Row[] => {
    const matching = (this.reorder ? this.matching().filter(o => !this.isSelected(o)) : this.matching()).slice(
      0,
      this.renderLimit()
    );
    const rows: Row[] = [];
    let lastGroup: string = null;
    matching.forEach((option, index): void => {
      if (this.shouldGroup() && option.group && option.group !== lastGroup) {
        lastGroup = option.group;
        rows.push({ group: option.group });
      }
      rows.push({ option, index: index + this.optionOffset() });
    });
    return rows;
  });
  exactMatchExists = computed((): boolean => {
    const query = this.query().trim().toLowerCase();
    return this.sorted.some(x => x.name.toLowerCase() === query || String(x.value).toLowerCase() === query);
  });

  ngOnInit(): void {
    /* the service already normalises, but the overlay can be presented directly too */
    this.allOptions = PickOption.list(this.options);
    this.withSearch = this.allOptions.length > this.searchThreshold;

    const values = this.valueAsArray();
    // the selection follows the order of the value, so that `reorder` round-trips
    this.selected.set(values.map(v => this.allOptions.find(o => String(o.value) === String(v))).filter(x => x));

    this.sorted = this.sortOptions(this.allOptions);
  }
  ionViewDidEnter(): void {
    if (this.withSearch) setTimeout((): void => this.focusSearchbar(), 100);
  }

  private focusSearchbar(): void {
    this.searchbar()?.setFocus();
  }

  private sortOptions(options: PickOption[]): PickOption[] {
    const byName = (a: PickOption, b: PickOption): number => a.name.localeCompare(b.name);
    const sorted = this.sortBy === 'none' ? options.slice() : options.slice().sort(byName);
    if (!this.shouldGroup()) return sorted;
    // options without a group close the list, so the headings don't get interrupted
    return sorted.sort((a, b): number => {
      if (!a.group && !b.group) return 0;
      if (!a.group) return 1;
      if (!b.group) return -1;
      return a.group === b.group ? 0 : a.group.localeCompare(b.group);
    });
  }
  private shouldGroup(): boolean {
    if (this.groupBy === 'none' || this.reorder) return false;
    const groups = new Set(this.allOptions.map(x => x.group).filter(x => x));
    return groups.size > 1;
  }

  private valueAsArray(): any[] {
    if (this.value === undefined || this.value === null || this.value === '') return [];
    return Array.isArray(this.value) ? this.value : [this.value];
  }

  rowId(index: number): string {
    return this.instanceId.concat('-option-', String(index));
  }
  isSelected(option: PickOption): boolean {
    return this.selected().some(x => String(x.value) === String(option.value));
  }
  isBlockedByLimit(option: PickOption): boolean {
    return !!this.maxSelection && !this.isSelected(option) && this.selected().length >= this.maxSelection;
  }

  search(toSearch?: string): void {
    this.query.set(toSearch ?? '');
    this.renderLimit.set(PAGE_SIZE);
    /* the results start from the top; leaving the scroll where it was would also sit it at the end of a
       now-shorter list, where every scroll event asks for another page */
    this.content()?.scrollToTop();
    /* while typing, the top result is the one Enter confirms */
    this.activeIndex.set(this.query() && this.matching().length ? this.optionOffset() : -1);
  }

  toggle(option: PickOption): void {
    if (!option) return;
    if (this.isSelected(option)) this.selected.update(x => x.filter(y => String(y.value) !== String(option.value)));
    else {
      if (this.isBlockedByLimit(option)) return;
      this.selected.update(x => [...x, option]);
    }
    this.reportSelection();
  }
  /**
   * Select or deselect what the search is currently showing — not the whole list.
   * With no search running the two coincide, so the plain case is unchanged; with one running, "all"
   * meaning "everything, including what you filtered out" is never what's being asked for.
   */
  checkAll(check: boolean): void {
    const matching = this.matching();
    if (check) {
      const already = new Set(this.selected().map(x => String(x.value)));
      this.selected.update(x => [...x, ...matching.filter(o => !already.has(String(o.value)))]);
    } else {
      const toRemove = new Set(matching.map(x => String(x.value)));
      this.selected.update(x => x.filter(o => !toRemove.has(String(o.value))));
    }
    this.reportSelection();
  }
  private reportSelection(): void {
    if (this.multiple) this.onSelectionChange?.(this.selected());
  }

  handleReorder(event: CustomEvent<ItemReorderEventDetail>): void {
    this.selected.update(x => event.detail.complete(x.slice()));
    this.reportSelection();
  }
  private moveActive(direction: -1 | 1): void {
    const option = this.matching()[this.activeIndex()];
    if (!option || !this.isSelected(option)) return;
    this.selected.update(selection => {
      const from = selection.findIndex(x => String(x.value) === String(option.value));
      const to = from + direction;
      if (from === -1 || to < 0 || to >= selection.length) return selection;
      const reordered = selection.slice();
      reordered.splice(to, 0, reordered.splice(from, 1)[0]);
      return reordered;
    });
  }

  pick(option: PickOption): void {
    this.dismiss(option);
  }
  /**
   * With `multiple` the checkbox owns the row: a click here as well would toggle the option twice.
   */
  pickIfSingle(option: PickOption): void {
    if (!this.multiple) this.pick(option);
  }
  pickCustomValue(): void {
    const query = this.query().trim();
    if (!query) return;
    const option = new PickOption({ value: query, name: query });
    if (this.multiple) {
      this.toggle(option);
      this.search('');
    } else this.dismiss(option);
  }
  confirm(): void {
    this.dismiss(this.selected());
  }
  clear(): void {
    this.dismiss(null);
  }
  cancel(): void {
    this.dismiss(undefined);
  }
  /**
   * `undefined` is a cancel, `null` is a clear, anything else is a choice.
   */
  private dismiss(data?: PickOption | PickOption[] | null): void {
    if (this.presentation === 'popover') this._popover.dismiss(data);
    else this._modal.dismiss(data);
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent): void {
    const matching = this.matching();
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        if (this.reorder && event.altKey) return this.moveActive(direction);
        const count = this.navigableCount();
        if (!count) return;
        // the first key press lands on an end of the list rather than moving from a phantom position
        if (this.activeIndex() === -1) this.activeIndex.set(direction === 1 ? 0 : count - 1);
        else this.activeIndex.set((this.activeIndex() + direction + count) % count);
        this.growToReach(this.activeIndex());
        this.scrollToActive();
        break;
      }
      case 'Home':
        event.preventDefault();
        this.activeIndex.set(this.navigableCount() ? 0 : -1);
        this.growToReach(this.activeIndex());
        this.scrollToActive();
        break;
      case 'End':
        event.preventDefault();
        this.activeIndex.set(this.navigableCount() - 1);
        this.growToReach(this.activeIndex());
        this.scrollToActive();
        break;
      case 'Enter': {
        event.preventDefault();
        if (this.multiple) return this.confirm();
        if (this.canClear() && this.activeIndex() === 0) return this.clear();
        const active = matching[this.activeIndex() - this.optionOffset()];
        if (active) this.pick(active);
        else if (this.allowCustomValues && this.query()) this.pickCustomValue();
        break;
      }
      case ' ': {
        // in a searchable list the space bar belongs to the query
        if (!this.multiple || this.withSearch) return;
        event.preventDefault();
        this.toggle(matching[this.activeIndex() - this.optionOffset()]);
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.cancel();
        break;
    }
  }
  /** Keep the rendered window ahead of wherever the keyboard has got to. */
  private growToReach(index: number): void {
    if (index + 10 >= this.renderLimit()) this.renderLimit.set(Math.max(index + 1 + PAGE_SIZE, PAGE_SIZE));
  }
  onScroll(event: any): void {
    const d = event?.detail;
    if (!d) return;
    const el = event.target as HTMLIonContentElement & { scrollHeight?: number; clientHeight?: number };
    const scrollEl = (el as any).scrollEl ?? el;
    const remaining = (scrollEl.scrollHeight ?? 0) - (d.scrollTop ?? 0) - (scrollEl.clientHeight ?? 0);
    if (remaining < 200) this.loadMore();
  }
  loadMore(): void {
    if (this.renderLimit() < this.matching().length) this.renderLimit.update(x => x + PAGE_SIZE);
  }
  private scrollToActive(): void {
    setTimeout((): void => {
      const element = document.getElementById(this.rowId(this.activeIndex()));
      if (element) element.scrollIntoView({ block: 'nearest' });
    });
  }
}
