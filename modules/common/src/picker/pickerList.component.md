# IDEAPickerListComponent

## Selector

idea-picker-list

## Inputs

- `options` (_(PickOption<any> | PickOptionLike<any>)[]_) - Note: the overlay is created through `componentProps`, which can't feed signal inputs.
- `value` (_any_)
- `multiple` (_boolean_)
- `searchPlaceholder` (_string_)
- `searchThreshold` (_number_)
- `sortBy` (_"name" | "none"_)
- `groupBy` (_"none" | "auto"_)
- `showValue` (_boolean_)
- `clearable` (_boolean_)
- `selectAll` (_boolean_)
- `maxSelection` (_number_)
- `reorder` (_boolean_)
- `allowCustomValues` (_boolean_)
- `customValuePrefix` (_string_)
- `presentation` (_"popover" | "modal" | "sheet"_) - How the overlay was presented: it decides which controller dismisses it, and whether the header is
  needed at all — only an anchored popover can be left by tapping outside it.
- `title` (_string_) - What is being picked. It titles the overlay when this covers the screen, where the field that opened
  it is no longer visible to say so.
- `onSelectionChange` (_(picked: PickOption<any>[]) => void_) - Called on every change. The picker applies as it goes, in every presentation: a list that commits on
  Done in one shape and as-you-click in another is two controls wearing the same name.
