/**
 * Badge is a small neutral label attached to something else: a count on a tab,
 * a short word marking a list row, a bare number on an icon. It is the plainest
 * component in the system, and the plainness is the whole point.
 *
 * IT TAKES NEITHER COLOUR AXIS, AND THAT IS THE REASON IT WAS DECLINED FOR SO
 * LONG. A generic badge that could be tinted is exactly how the two colour axes
 * get mixed: a red badge beside a StatusPill reads as a second status, and a
 * heart-tinted badge reads as a category the surface has not claimed. So this
 * component draws only neutral chrome, carries neither `data-status` nor
 * `data-category`, and offers no colour prop at all. Colour that arrives through
 * `className` is the caller's to keep off both axes, and the two-colour-axes
 * rule applies to it in full. When a label has to carry a clinical level, the
 * component is StatusPill, which carries the colour, the icon and the word
 * together; a Badge never stands in for one.
 *
 * IT IS NOT A STATUS SURFACE. It renders no word from the clinical vocabulary of
 * its own accord, reads no reference range, and reaches no verdict. Whatever text
 * a caller places inside it is ordinary content, and a caller who writes a
 * clinical status word into a Badge has reached for the wrong component. The word
 * belongs in StatusPill's `label`, beside the colour and the glyph that make it
 * survive greyscale.
 *
 * IT IS A SERVER COMPONENT, BECAUSE A LABEL HAS NO BEHAVIOUR TO HYDRATE. Making
 * it a client component would ship JavaScript for a piece of text. It takes no
 * focus and captures no key: a badge is content, not a control, and a reader
 * meets it as part of the thing it is attached to rather than as a stop of its
 * own.
 *
 * IT IS DECORATIVE ONLY WHEN ITS CONTENT IS REDUNDANT. A count that repeats a
 * number already spoken beside it is noise to a screen reader, so the caller may
 * label the badge for assistive technology through `srLabel`, which either names
 * what the bare number counts or, set to an empty string, hides a decorative
 * badge from the accessibility tree entirely. The visible text is never hidden by
 * this component on the caller's behalf, because a badge that removed its own
 * words for a sighted reader would be a badge that says nothing.
 *
 * A NAMED BADGE ALSO TAKES `role="img"`, THE SAME PAIRING `avatar.tsx` USES FOR
 * ITS OWN `aria-label`. The root is a plain span, and a plain span carries the
 * ARIA "generic" role, whose accessible name is computed from author markup
 * only when a role that allows naming is present, so an `aria-label` sitting
 * alone on a bare span is not reliably read by assistive technology. Pairing it
 * with `role="img"` makes the override the name a reader actually hears rather
 * than an attribute a screen reader is free to ignore.
 */

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * The two neutral weights. Kept as a local type rather than a fourth public
 * export, for the reason `divider.tsx` gives about its own orientation union:
 * the registry contract fixes this file at three public exports, so a consumer
 * names this shape as `BadgeProps["variant"]` rather than importing a fourth
 * symbol. Both weights are neutral; neither is on either colour axis.
 */
type BadgeVariant = "soft" | "outline"

/**
 * The chip per weight, written out as literal class strings because Tailwind
 * reads class names out of source as text and a computed `bg-${x}` generates no
 * CSS. `soft` is a filled muted chip for a count that should read as quiet;
 * `outline` is a hairline chip for a label that should sit lighter still. Both
 * draw only the neutral chrome roles, so neither can be mistaken for a status.
 */
const VARIANT: Record<BadgeVariant, string> = {
  soft: "bg-muted [color:var(--muted-foreground)]",
  outline: "border border-border [color:var(--foreground)]",
}

/**
 * The chip, spelled once. Inline so it sits on the same line as the thing it is
 * attached to, small so it does not compete with it, and pill-shaped with
 * `rounded-full`, which resolves to the same radius under the docs chrome and at
 * `/view` because it is a Tailwind theme default rather than one of the three
 * radius keys the product theme overrides. The type step is `caption1`, one of
 * the eleven semantic steps, so a reader who has turned their text size up gets a
 * larger badge rather than a pinned pixel size.
 */
const BADGE =
  "inline-flex items-center justify-center gap-opsin-1 rounded-full " +
  "px-opsin-2 py-opsin-0-5 align-middle text-opsin-caption1 font-medium " +
  "whitespace-nowrap leading-none"

export interface BadgeProps {
  /**
   * The badge's content: a count, a short word, or a small icon-and-count pair.
   * Keep it to a few characters. A badge is a label attached to something else,
   * not a sentence, and long content in a pill wraps into an unreadable lozenge.
   */
  children: ReactNode
  /**
   * Visual weight only, and both weights are neutral. `soft` is a filled muted
   * chip; `outline` is a hairline chip that sits lighter. Neither takes a status
   * or a category colour, because a Badge is on neither axis. Defaults to `soft`.
   */
  variant?: "soft" | "outline"
  /**
   * What a screen reader should announce in place of the visible content. Give
   * the bare number a noun, "3 unread", so a reader does not hear a lone "3"
   * with no idea what it counts. Set it to an empty string to hide a purely
   * decorative badge, one whose count is already spoken beside it, from the
   * accessibility tree. Omitted, the visible content is what is announced.
   */
  srLabel?: string
  /**
   * Merged onto the root. Placement, margin and the space around the badge
   * belong here. It is the one route by which colour can reach a Badge, and the
   * two-colour-axes rule applies to it in full: a badge takes neither a status
   * nor a category tint. A class you pass wins over the chip's own where the two
   * conflict, because it is merged last.
   */
  className?: string
}

export function Badge({ children, variant = "soft", srLabel, className }: BadgeProps) {
  const resolved: BadgeVariant = variant === "outline" ? "outline" : "soft"
  const decorative = srLabel === ""
  const labelled = typeof srLabel === "string" && srLabel !== ""

  return (
    <span
      data-slot="badge"
      role={labelled ? "img" : undefined}
      aria-hidden={decorative ? "true" : undefined}
      aria-label={labelled ? srLabel : undefined}
      className={cn(BADGE, VARIANT[resolved], className)}
    >
      {children}
    </span>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the two weights beside the
 * kind of thing a badge attaches to, a tab label with a count, so the one thing
 * worth seeing at a glance is clear: the badge is quiet neutral chrome rather
 * than a second status beside its host. It carries no clinical word, no reading
 * and no unit (ADR 0012); the counts are fictional and the labels are plain.
 */
export default function BadgeDemo() {
  return (
    <div className="flex items-center gap-opsin-4 text-opsin-body [color:var(--foreground)]">
      <span className="inline-flex items-center gap-opsin-2">
        Messages
        <Badge srLabel="3 unread">3</Badge>
      </span>
      <span className="inline-flex items-center gap-opsin-2">
        Drafts
        <Badge variant="outline" srLabel="12 saved">
          12
        </Badge>
      </span>
    </div>
  )
}
