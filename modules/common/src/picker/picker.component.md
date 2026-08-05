# IDEAPickerComponent

## Selector

idea-picker

## Inputs

- `options` (_PickOption[]_) - The options to pick from: either `PickOption`s or the plain objects they can be built from.
  Note: keep the list in a field or a computed — an array literal written in the template is a new
  array on every change detection, and each one is normalised again.
- `value` (_any_) - The picked value: one value, or an array of them with `multiple`. With `reorder` the array is ordered.
- `multiple` (_boolean_)
- `label` (_string_)
- `labelPlacement` (_PickerLabelPlacement_)
- `placeholder` (_string_)
- `selectedText` (_string_) - What to show when the value can't be resolved among the options: they haven't loaded yet, or they no
  longer contain it. Unlike Ionic's `selectedText` it doesn't override a value the options do resolve,
  so it can't end up contradicting the list it sits on.
- `disabled` (_boolean_)
- `appearance` (_PickerAppearance_)
- `previewMax` (_number_) - How many names to list before the preview collapses to their number.
- `emptyText` (_string_) - What to show when nothing is picked.
- `allText` (_string_) - What to show when everything is picked; with `noneMeansAll`, also when nothing is.
- `noneMeansAll` (_boolean_) - Whether picking nothing means picking everything: the semantics of a filter.
- `interface` (_PickerInterface_)
- `searchThreshold` (_number_) - Beyond this many options the list gets a searchbar — and, with `interface: 'auto'`, opens centered.
- `searchPlaceholder` (_string_)
- `overlayCssClass` (_string_)
- `sortBy` (_'name' | 'none'_)
- `groupBy` (_'auto' | 'none'_)
- `showValue` (_boolean_) - Whether to show the value below the name of each option.
- `clearable` (_boolean_)
- `selectAll` (_boolean_)
- `maxSelection` (_number_)
- `reorder` (_boolean_)
- `allowCustomValues` (_boolean_)
- `customValuePrefix` (_string_)
