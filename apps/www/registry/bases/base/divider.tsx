/**
 * Divider is a thin line that separates two groups of content, and nothing more.
 *
 * IT CARRIES NO COLOUR, ON PURPOSE. The only colour it draws is the neutral
 * hairline `border-border`. It never takes a status tint and it never takes a
 * category tint, because a line between two peers says that they are separate,
 * and it must not also say that either one is urgent or that either one is a
 * kind of measurement. Those are the two colour axes, and a divider is on
 * neither of them. Colour that arrives through `className` is the caller's to
 * keep off both axes; this component adds none.
 *
 * THE LABELLED CASE IS A DIFFERENT STRUCTURE, AND THAT IS THE WHOLE SUBTLETY.
 * A `role="separator"` cannot hold an accessible name, so a labelled divider is
 * not a separator at all. It is a flex row of two decorative hairlines with
 * real text between them. The two rules are `aria-hidden`, and the label is an
 * ordinary text node that a screen reader reads as text rather than as a
 * boundary. A divider is therefore never the only thing that tells assistive
 * technology two groups are separate. The grouping has to be carried by
 * structure, a list, a heading, a region, and the divider is the visible echo
 * of a grouping that already exists.
 *
 * IT REFUSES A LABELLED VERTICAL DIVIDER. Centred text between two vertical
 * rules has no sound layout, so a `label` supplied with `orientation="vertical"`
 * is dropped, a development warning fires, and a plain vertical rule is drawn.
 * The least surprising repair keeps the orientation the caller asked for and
 * sheds the part that has nowhere to go.
 *
 * IT IS A SERVER COMPONENT, AND THAT IS THE DEFAULT ANSWER RATHER THAN A CHOICE
 * THAT COST ANYTHING. A line has no behaviour to hydrate. Making it a client
 * component would ship JavaScript for a border.
 *
 * IT IS NOT FOCUSABLE. A divider is not a tab stop and captures no key. The
 * unlabelled form exposes `role="separator"` so a reader that navigates by
 * region can skip past it, and the labelled form exposes no role because its
 * label is the thing worth reading.
 *
 * THE VERTICAL FORM HAS NO HEIGHT OF ITS OWN. It is a 1px-wide rule that
 * stretches to its container on the cross axis, which in practice means a flex
 * row with the default stretch alignment. In a context that gives it no height
 * it collapses to nothing, and that is documented rather than guessed at,
 * because a vertical rule that invents its own height would fight every layout
 * it is dropped into.
 */

import { cn } from "@/lib/utils"
import { isDevelopment } from "@/lib/opsinjs"

/**
 * The two accepted orientations. Kept local rather than exported, so a
 * consumer names the shape as `DividerProps["orientation"]` rather than
 * importing a fourth symbol; the registry contract fixes this file at three
 * public exports.
 */
type DividerOrientation = "horizontal" | "vertical"

/*
 * The two, as the object's own list, so the runtime check reads real keys and
 * cannot be answered "yes" by a prototype member the way `in` would be.
 */
const ORIENTATIONS: DividerOrientation[] = ["horizontal", "vertical"]

/*
 * The rule for a plain, unlabelled divider, written out per orientation
 * because Tailwind reads class names as literal strings. The horizontal rule
 * is a block whose top border is the hairline, so it fills the width of its
 * container as a block element. The vertical rule is a 1px-wide line that
 * refuses to shrink and stretches to its container's cross axis; it draws
 * nothing where the container gives it no height, which is stated in the
 * JSDoc rather than worked around.
 */
const RULE: Record<DividerOrientation, string> = {
  horizontal: "border-t border-border",
  vertical: "shrink-0 self-stretch border-l border-border",
}

/*
 * Development warnings for uncoded mistakes, said once per distinct offender.
 * Nothing here has an OpsinErrorCode: a divider asserts nothing clinical, so
 * the codes in `tokens/errors.json` do not apply, and minting one is not this
 * file's to do.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface DividerProps {
  /**
   * Which way the line runs. `horizontal` is a full-width rule between stacked
   * groups; `vertical` is a full-height rule between side-by-side groups. A
   * value outside the two is drawn horizontal, which is the form that needs
   * nothing from its container, and a development warning names the mistake.
   * Defaults to `horizontal`.
   */
  orientation?: "horizontal" | "vertical"
  /**
   * An optional short label centred on a horizontal rule, for a named boundary
   * such as "Earlier" or "Today". A label changes the structure: the rule
   * stops being a `role="separator"` element, because a separator cannot carry
   * an accessible name, and becomes two decorative hairlines with the label as
   * plain text between them. A whitespace-only label is treated as no label. A
   * label with `orientation="vertical"` has no sound layout, so it is dropped
   * with a development warning and the vertical rule is drawn plain. The label
   * is the visible echo of a grouping that structure must also carry, never
   * the only thing a screen reader has to tell the two groups apart.
   */
  label?: string
  /**
   * Merged onto the root. This is where a vertical rule is given its height
   * when its container does not, and where the caller controls the spacing
   * around a horizontal rule. It is unrestricted, so it is the one route by
   * which colour can reach a divider, and the two-colour-axes rule applies to
   * it in full: a divider takes neither a status nor a category tint. `cn`
   * merges whatever it is handed and cannot detect a class from either axis.
   */
  className?: string
}

export function Divider({ orientation = "horizontal", label, className }: DividerProps) {
  // A value outside the two is drawn horizontal, the form that needs nothing
  // from its container. This file ships as source into JavaScript projects
  // where the union is only advice.
  const resolved: DividerOrientation = ORIENTATIONS.includes(orientation as DividerOrientation)
    ? (orientation as DividerOrientation)
    : "horizontal"
  if (resolved !== orientation) {
    warnDev(
      "orientation",
      `[opsinjs] Divider received orientation="${String(orientation)}", which is not "horizontal" or "vertical". It was drawn horizontal.`,
    )
  }

  const trimmed = typeof label === "string" ? label.trim() : ""
  const hasLabel = trimmed.length > 0

  // A centred label has no sound vertical layout, so it is dropped and the
  // vertical rule is drawn plain.
  if (hasLabel && resolved === "vertical") {
    warnDev(
      "vertical-label",
      '[opsinjs] Divider received a label with orientation="vertical". A centred label needs the horizontal form, so the label was dropped and a plain vertical rule was drawn.',
    )
  }
  const showLabel = hasLabel && resolved === "horizontal"

  if (showLabel) {
    return (
      <div data-slot="divider" className={cn("flex items-center gap-opsin-3", className)}>
        {/* Decorative. The two rules are aria-hidden because the label is the
            thing worth reading, and a separator cannot carry a name anyway.
            They get no data-slot: the closed set for this component is
            divider and divider-label. */}
        <span aria-hidden="true" className="h-0 flex-1 border-t border-border" />
        <span
          data-slot="divider-label"
          className="text-opsin-footnote [color:var(--muted-foreground)]"
        >
          {label}
        </span>
        <span aria-hidden="true" className="h-0 flex-1 border-t border-border" />
      </div>
    )
  }

  return (
    <div
      data-slot="divider"
      role="separator"
      aria-orientation={resolved}
      className={cn(RULE[resolved], className)}
    />
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is
 * public, reviewed code rather than a scratch demo. It shows the three forms
 * worth seeing at a glance, a plain rule, a labelled rule and a vertical rule,
 * triggers no development warning, and carries no number, no unit and no
 * interactive element (ADR 0012): every string is a fictional label, not a
 * reading.
 */
export default function DividerDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-opsin-4">
      <p className="m-0 text-opsin-body [color:var(--foreground)]">
        A plain rule between two groups.
      </p>
      <Divider />
      <p className="m-0 text-opsin-body [color:var(--foreground)]">
        A labelled rule marks a named boundary.
      </p>
      <Divider label="Earlier" />
      <div className="flex items-center gap-opsin-3 text-opsin-footnote [color:var(--muted-foreground)]">
        <span>Left group</span>
        <Divider orientation="vertical" />
        <span>Right group</span>
      </div>
    </div>
  )
}
