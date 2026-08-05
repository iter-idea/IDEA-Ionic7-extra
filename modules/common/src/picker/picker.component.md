# IDEAPickerComponent

## Selector

idea-picker

## Inputs

- `options` (_PickOption[]_) - The options to pick from: either `PickOption`s or the plain objects they can be built from.
  Note: keep the list in a field or a computed — an array literal written in the template is a new
  array on every change detection, and each one is normalised again.
- `value` (_any_) - The picked value: one value, or an array of them with `multiple`. With `reorder` the array is ordered.
- `multiple` (_boolean_) - Whether more than one option can be picked: it decides whether the value is one or an array.
- `label` (_string_) - What is being picked. It names the field for assistive technology, titles the overlay when that
  covers the screen, and is only drawn here when `labelPlacement` asks for it.
- `labelPlacement` (_PickerLabelPlacement_) - Where to draw the label, when the field shell around this one does not already own it.
- `placeholder` (_string_) - What to show while nothing is picked, in the muted ink of a placeholder.
- `selectedText` (_string_) - What to show when the value can't be resolved among the options: they haven't loaded yet, or they no
  longer contain it. Unlike Ionic's `selectedText` it doesn't override a value the options do resolve,
  so it can't end up contradicting the list it sits on.
- `disabled` (_boolean_) - Whether the field refuses to open.
- `appearance` (_PickerAppearance_) - The shape of the trigger: a form field, or a chip for a filter bar.
- `previewMax` (_number_) - How many names to list before the preview collapses to their number.
- `emptyText` (_string_) - What to show when nothing is picked — in the field and as the label of the row that empties it.
  Useful when "nothing" means something: a filter where no choice means every one of them.
- `allText` (_string_) - What to show when everything is picked; with `noneMeansAll`, also when nothing is.
- `noneMeansAll` (_boolean_) - Whether picking nothing means picking everything: the semantics of a filter.
- `interface` (_PickerInterface_) - How the list is presented. `auto` decides from the length of the list — see IDEAPickerService.
- `searchThreshold` (_number_) - Beyond this many options the list gets a searchbar — and, with `interface: 'auto'`, opens centered.
- `searchPlaceholder` (_string_) - What the searchbar suggests to type. It falls back to a translated "Search".
- `overlayCssClass` (_string_) - A class on the overlay, to scope its custom properties to this picker alone.
- `sortBy` (_'name' | 'none'_) - `none` keeps the options in the order they are given, like `ion-select` does with the ones you
  declare: on a hand-written list that order is a decision. Set `name` for a list that comes from
  the data, where alphabetical is what makes it scannable.
- `groupBy` (_'auto' | 'none'_) - `auto` groups the list under headings when at least two options carry a different `group`.
- `showValue` (_boolean_) - Whether to show the value below the name of each option.
- `clearable` (_boolean_) - Whether the list offers a row that empties the field, and the chip its clear button.
- `selectAll` (_boolean_) - Whether the list offers to select or deselect everything the search is showing.
- `maxSelection` (_number_) - How many options can be picked at once; beyond it the others stop responding.
- `reorder` (_boolean_) - Whether the picked options can be dragged into an order. With this, the value's order is part
  of the value, and the list stops grouping: headings would contradict it.
- `allowCustomValues` (_boolean_) - Whether a value that is not among the options can be typed in and picked.
- `customValuePrefix` (_string_) - What to write before a typed-in value in the list, to say what picking it will do.
