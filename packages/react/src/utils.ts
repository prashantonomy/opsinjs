import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * The twelve opsin type steps, as the suffix each one carries after `text-`.
 *
 * These are bridged in `packages/react/styles/theme.css` through the
 * `--text-opsin-*` custom properties, so `text-opsin-headline` and its siblings
 * are real font-size utilities that set size, leading, tracking and weight
 * together. Keep this list in step with that bridge: it is the twelve
 * `--text-opsin-*` names, and it exists only so tailwind-merge can be told
 * these are sizes rather than colours.
 */
const OPSIN_TYPE_STEPS = [
  "opsin-large-title",
  "opsin-title1",
  "opsin-title2",
  "opsin-title3",
  "opsin-headline",
  "opsin-body",
  "opsin-callout",
  "opsin-subheadline",
  "opsin-subheadline-emphasis",
  "opsin-footnote",
  "opsin-caption1",
  "opsin-caption2",
]

/**
 * A tailwind-merge instance that knows the opsin type ramp is its own axis.
 *
 * A bare `twMerge` classes `text-opsin-headline` as a text colour, because its
 * fallback for an unrecognised `text-*` class is the colour group, and that
 * group also holds `text-foreground` and `text-muted-foreground`. The two then
 * share one conflict group, so `cn("text-opsin-headline", "text-foreground")`
 * quietly dropped the size step and kept only the colour. Size and colour are
 * different axes and both have to survive on one element, so the size ramp is
 * registered here as the group `opsin-font-size`.
 *
 * Two consequences follow, and both are the intended behaviour. The type ramp
 * no longer conflicts with any colour utility, so a step and an ink class now
 * coexist. Two steps still share the `opsin-font-size` group, so the later of
 * `text-opsin-headline text-opsin-body` wins, which is the last-wins a size
 * override needs. The group is kept separate from Tailwind's built-in
 * `font-size` group so this bridge changes nothing about how the stock
 * `text-lg` scale merges.
 */
const twMerge = extendTailwindMerge<"opsin-font-size">({
  extend: {
    classGroups: {
      "opsin-font-size": [{ text: OPSIN_TYPE_STEPS }],
    },
  },
})

/**
 * Join and de-duplicate class names, resolving Tailwind conflicts last-wins.
 *
 * This is the common `cn` helper, published in @opsinjs/react on the clsx and
 * tailwind-merge the package already depends on, so it adds no dependency, and
 * it stays erasable-syntax TypeScript. The only departure from the stock helper
 * is the configured merge above, which teaches it that the opsin type ramp is a
 * size axis rather than a colour one.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * `value` with any run of the given characters, and of whitespace, removed
 * from its end. A loop rather than a `/[…\s]+$/` pattern, because that pattern
 * backtracks polynomially on a long run of whitespace that does not reach the
 * end, and a component that publishes it would let an app's own string slow a
 * render down. Not exported from @opsinjs/react.
 */
export function trimTrailing(value: string, characters: string): string {
  let end = value.length
  while (end > 0) {
    const last = value[end - 1] as string
    if (!characters.includes(last) && last.trim() !== "") break
    end -= 1
  }
  return value.slice(0, end)
}
