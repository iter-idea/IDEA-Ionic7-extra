# IDEAPickerListComponent

## Selector

idea-picker-list

## Inputs

- `options` (_(PickOption<any> | PickOptionLike<any>)[]_) - Note: the overlay is created through `componentProps`, which can't feed signal inputs.
- `value` (_any_) - The current value: it pre-selects the options, and with `reorder` it dictates their order.
- `multiple` (_boolean_) - Whether more than one option can be picked.
- `searchPlaceholder` (_string_) - What the searchbar suggests to type.
- `searchThreshold` (_number_) - Beyond this many options the list gets a searchbar.
- `sortBy` (_"name" | "none"_) - `none` keeps the options in the order they are given; `name` sorts them alphabetically.
- `groupBy` (_"none" | "auto"_) - `auto` groups the list under headings when at least two options carry a different `group`.
- `showValue` (_boolean_) - Whether to show each option's value below its name.
- `clearable` (_boolean_) - Whether the list offers a row that empties the selection.
- `selectAll` (_boolean_) - Whether to offer selecting or deselecting everything the search is showing.
- `maxSelection` (_number_) - How many options can be picked at once.
- `reorder` (_boolean_) - Whether the picked options can be dragged into an order.
- `pinSelected` (_"none" | "auto"_) - `auto` opens a long list on what is already picked, in a band above the rest.
- `allowCustomValues` (_boolean_) - Whether a value that is not among the options can be typed in and picked.
- `customValuePrefix` (_string_) - What to write before a typed-in value in the list.
- `emptyText` (_string_) - The label of the row that empties the selection.
- `presentation` (_"popover" | "modal" | "sheet"_) - How the overlay was presented: it decides which controller dismisses it, and whether the header is
  needed at all — only an anchored popover can be left by tapping outside it.
- `title` (_string_) - What is being picked. It titles the overlay when this covers the screen, where the field that opened
  it is no longer visible to say so.
- `onSelectionChange` (_(picked: PickOption<any>[]) => void_) - Called on every change. The picker applies as it goes, in every presentation: a list that commits on
  Done in one shape and as-you-click in another is two controls wearing the same name.
