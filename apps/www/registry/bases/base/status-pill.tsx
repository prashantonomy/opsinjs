/**
 * StatusPill shows the level of attention something needs, as a word, an icon
 * and a colour together.
 *
 * NOT COMPOSABLE, AND THAT IS THE WHOLE DESIGN. There is no `StatusPill.Icon`
 * export, no `color` prop, no `variant` prop, and no way to remove the word.
 * The specification puts it plainly: "every way of removing it that has ever
 * been offered has been used." The parts named in the anatomy are identified by
 * `data-slot`, which is enough to style them and not enough to take them apart.
 *
 * WHY THE WORD IS THE PRIMARY CARRIER, not a redundancy. The measured CVD audit
 * in `tokens/color.json` found that `steady` and `attention` are indistinguishable
 * under deuteranopia and in greyscale (Lc 0), and `steady` and `urgent` are
 * indistinguishable under tritanopia. Four ordered levels cannot be made mutually
 * distinguishable by hue alone. So the order of reliance is word, then glyph
 * shape, then colour. The glyphs are four distinct silhouettes rather than one
 * glyph in four colours, for the same reason. Those silhouettes are abstract
 * rather than pictorial: a tick beside a reading is a verdict a presentation
 * layer is not entitled to give, and a warning triangle spent below the top
 * level leaves no louder shape for the one that most needs it. See
 * `content/docs/foundations/iconography/health-glyphs.mdx`.
 *
 * StatusPill derives nothing. It has no thresholds, no ranges and no opinions:
 * `status` is assigned by the consuming product from a reference range or a
 * clinically reviewed threshold that the product owns.
 */

import { Circle, CircleDot, Diamond, Octagon } from "lucide-react"

import {
  BANNED_WORDS,
  CLINICAL_STATUS_META,
  isClinicalStatus,
  isDevelopment,
  warnOnce,
  type ClinicalStatus,
} from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The glyph for each level.
 *
 * `CLINICAL_STATUS_META[level].icon` is the source of truth for WHICH lucide
 * icon a level uses; this map is the binding from that name to the component,
 * and it has to exist because a bundler cannot resolve `lucide-react`'s exports
 * from a runtime string without pulling the entire icon set into the bundle.
 * Typing it `Record<ClinicalStatus, …>` is what makes a missing level a compile
 * error rather than a pill with no icon, and the assertion below is what catches
 * the two drifting apart.
 */
const ICONS: Record<ClinicalStatus, typeof Circle> = {
  steady: Circle,
  watch: CircleDot,
  attention: Diamond,
  urgent: Octagon,
}

/* Development-only. If somebody changes an icon name in lib/status.ts and not
   here, the pill keeps rendering a plausible glyph for the wrong level, which is
   precisely the failure the four-distinct-shapes rule exists to prevent. */
if (isDevelopment()) {
  for (const [level, Icon] of Object.entries(ICONS)) {
    const expected = CLINICAL_STATUS_META[level as ClinicalStatus].icon
    const actual = (Icon as { displayName?: string }).displayName
    if (actual && actual !== expected) {
      /* Not an OPSIN code. Those describe a mistake a CONSUMER made with the
         API; this is this file disagreeing with lib/status.ts, which is a defect
         in opsinjs itself and belongs in a different channel. */
      console.warn(
        `[opsinjs] StatusPill renders <${actual}> for status "${level}", but ` +
          `CLINICAL_STATUS_META says the icon is "${expected}". The four levels ` +
          `must be four distinct glyph shapes; fix ICONS in status-pill.tsx.`,
      )
    }
  }
}

/**
 * Tailwind reads class names out of source as literal strings, so these cannot
 * be built from the level at runtime. `bg-status-${status}-surface` generates
 * no CSS at all and the pill renders unstyled. Written out, once.
 *
 * Note which role does which job. `-surface` is the tinted background, `-ink` is
 * the text that is guaranteed legible on it, and the bare `-<level>` name is the
 * LINE role, which is the boundary. `-accent` is deliberately absent: it is the
 * identity fill, chosen for recognition rather than contrast, and it is never
 * text and never a sole boundary.
 *
 * AND THE INK IS AN ARBITRARY PROPERTY, WHICH IS NOT A STYLE CHOICE. `cn` is
 * `twMerge(clsx(…))` and tailwind-merge is unconfigured: it has never been told
 * that `--text-opsin-*` is a font-size namespace, so it files
 * `text-opsin-caption1` and `text-status-watch-ink` in the SAME conflict group
 * and keeps whichever comes last. Spelled `text-status-<level>-ink`, the ink was
 * deleted by `SIZE[size]` on the line after it in the `cn()` call below, at
 * every size and for all four levels. The word took its colour from whatever
 * ancestor happened to supply one, on a status-tinted surface, in a pairing
 * nothing has measured. Reordering rescues nothing: `TONE` last keeps
 * the ink and drops the type step and its weight instead, which is the
 * regression `care-card.tsx` records at its own action list, and `field.tsx`
 * states flatly that there is no ordering that keeps both.
 *
 * `[color:…]` is grouped by tailwind-merge under the CSS property rather than
 * under the `text-` prefix, so the size and the colour no longer meet and both
 * survive. `button.tsx` and `disclaimer-note.tsx` answer the identical trap the
 * same way. `range-bar.tsx`, `score-dial.tsx`, `result-card.tsx` and
 * `metric-tile.tsx` set a type step beside a colour on an element `cn` never
 * touches, and they join the two strings instead; that answer works only
 * outside a `cn()` call, so it is not available on this root. A Tailwind editor
 * plugin will offer to rewrite these four lines as `text-status-<level>-ink`;
 * do not accept it, because that is the spelling that loses.
 *
 * TEACHING `lib/utils.ts` THE NAMESPACE WOULD NOT FIX THIS COMPONENT, which is
 * why the repair is here rather than reported upward a second time.
 * `scripts/build-registry.mts` leaves `@/lib/utils` out of the shipped
 * substrate on purpose, because `shadcn init` has already written it. So an
 * installed pill merges its classes with whatever `cn` the consuming app owns,
 * and a component that renders its own colours only under this repository's
 * build is not repaired.
 *
 * The variable is `--opsin-status-<level>-ink` and not the theme's
 * `--color-status-<level>-ink`, because the `@theme inline` block that declares
 * the colour namespace inlines its values into utilities and emits no custom
 * property to read back. No literal fallback is written beside it: in an app
 * without the token sheet the declaration resolves to nothing and the word
 * inherits, which is the same ground on which `bg-status-<level>-surface` is
 * also absent, and inventing a colour value here would be worse than inheriting
 * one.
 *
 * WHAT IT COSTS, STATED RATHER THAN SOFTENED: because the two no longer
 * conflict, a `text-*` class passed in `className` can no longer recolour the
 * word. Both declarations are emitted and source order decides. The surface
 * and the boundary are still overridable that way, and there is no `style`
 * prop and no spread here to reach past a class with, so the remaining way to
 * recolour the ink is a rule of your own on `[data-slot="status-pill"]`, which
 * is what the slots are for. `field.tsx` documents the same trap from the other
 * side and answers it by declining to set a colour at all; that answer is not
 * available to a component whose fill is the point.
 */
const TONE: Record<ClinicalStatus, string> = {
  steady:
    "border-status-steady bg-status-steady-surface [color:var(--opsin-status-steady-ink)]",
  watch:
    "border-status-watch bg-status-watch-surface [color:var(--opsin-status-watch-ink)]",
  attention:
    "border-status-attention bg-status-attention-surface [color:var(--opsin-status-attention-ink)]",
  urgent:
    "border-status-urgent bg-status-urgent-surface [color:var(--opsin-status-urgent-ink)]",
}

/* The ladder is the type step the word and its glyph sit at: sm at footnote,
   md at subheadline, lg at headline. md stops at subheadline rather than
   headline on purpose. A 17px weight-600 status word on every row of a results
   list would spend the urgency budget the system keeps scarce, whereas 15px at
   weight 400 lifts the label off the caption floor and out of the provenance
   step without turning a label into an alarm. */
const SIZE = {
  sm: "gap-opsin-1 px-opsin-2 py-opsin-0-5 text-opsin-footnote",
  md: "gap-opsin-1 px-opsin-3 py-opsin-1 text-opsin-subheadline",
  lg: "gap-opsin-1 px-opsin-3 py-opsin-1 text-opsin-headline",
} as const

export interface StatusPillProps {
  /** Required. There is no neutral default and no "unknown" level. */
  status: ClinicalStatus
  /**
   * Overrides the default word for this level. Use it for translation, or for
   * a product whose readers use different language. It may not change the
   * meaning, and it may not be an empty string.
   *
   * A banned word in `label` raises OPSIN-0006 once in development. The list is
   * `BANNED_WORDS` in the substrate ("normal", "healthy", "good" and the rest),
   * matched case-insensitively on word boundaries. The component renders the
   * label anyway, because the product owns its copy; the warning names the word
   * and its replacement so the copy can be fixed at source.
   */
  label?: string
  /**
   * Visual weight only, and it changes exactly two things: the type step the
   * word and its glyph are set at, and the padding around them. Every size
   * renders icon, word and colour, and none of them drops the word. `lg` exists
   * so a pill composed inside a heading can carry the heading's own step rather
   * than sitting a step below the sentence it qualifies.
   */
  size?: "sm" | "md" | "lg"
  /**
   * What the pill applies to, for the accessible name: "HbA1c result". Without
   * it a screen-reader user hears a level with no subject.
   *
   * Pass it when the pill is read on its own: a table cell reached by column
   * navigation, a card corner, or any pill that floats free of its subject. Do
   * not pass it when the subject is visible text in the same reading unit, such
   * as a list item whose row already names the measurement. The subject rides
   * an sr-only span appended inside the pill, so there a screen reader would
   * read the subject once as visible text and then a second time inside the
   * pill.
   */
  describes?: string
  /**
   * Merged onto the root with `tailwind-merge`, and a class you pass WINS over
   * the pill's own where the two conflict: `cn(…, TONE[status], SIZE[size],
   * className)` puts yours last and `twMerge` keeps the later of a conflicting
   * pair.
   *
   * That includes the level's fill and its boundary. A class that removes
   * either of them leaves the word and the glyph carrying the status on their
   * own, so if you need the pill to sit quietly in a dense row, change `size`
   * rather than stripping the surface.
   *
   * THE INK IS THE ONE EXCEPTION, and the comment above `TONE` says why: it is
   * written as the arbitrary property `color:var(--opsin-status-<level>-ink)`
   * in square brackets, so `tailwind-merge` does not file it against a `text-*`
   * class, and a `text-*` class you pass does not replace it. It is spelled out
   * that way here because Tailwind's scanner reads comments too, and a
   * bracketed candidate with a `<level>` placeholder in it compiles to CSS that
   * does not parse. Both declarations are emitted and source order decides.
   * Recolour it with a rule of your own on `[data-slot="status-pill"]` instead.
   * Read `tokens/color.json` first, because the ink you would be replacing is
   * the half of the pairing that was tuned to stay legible on the surface
   * underneath it.
   */
  className?: string
}

export function StatusPill({
  status,
  label,
  size = "md",
  describes,
  className,
}: StatusPillProps) {
  /* THE FIFTH LEVEL IS REFUSED, NOT APPROXIMATED.
     `status` is typed to the four, and this file ships as source into JavaScript
     projects where a type is advice. A value outside the vocabulary has no
     entry in CLINICAL_STATUS_META and no glyph, so there is no honest pill to
     draw. Drawing a plausible one would be the component inventing a verdict
     about somebody's health, which is the single thing it exists not to do.
     `unknown` gets its own code because it is the likeliest wrong answer
     and the most dangerous: it is the absence of an assertion, and a reader who
     sees it rendered as a level will read it as "probably fine". */
  if (!isClinicalStatus(status)) {
    warnOnce(status === "unknown" ? "OPSIN-0011" : "OPSIN-0021", {
      component: "StatusPill",
      status: String(status),
    })
    return null
  }

  const meta = CLINICAL_STATUS_META[status]
  const Icon = ICONS[status]

  /* OPSIN-0002, at its enforcement point. `label=""` is the only way this
     component can be made to render a status with no word, and the specification
     forbids it in prose that the type cannot express. Falling back to the
     level's own word is the honest repair: a coloured pill with no word is a
     status carried by colour alone, which does not survive greyscale, colour
     vision deficiency or a black-and-white printout. */
  if (label !== undefined && label.trim() === "") {
    warnOnce("OPSIN-0002", { component: "StatusPill", status })
  }

  /* OPSIN-0006, in development only. The product owns its copy, so a banned
     word still renders: this is a presentation layer, and warning is the whole
     of what it is entitled to do about the caller's own words. But
     `<StatusPill status="steady" label="Normal" />` renders reference-ranges.mdx's
     own Don't verbatim, and a reader who sees "Normal" on three rows and nothing
     on the fourth has been told they are abnormal. The test is case-insensitive
     and on word boundaries so "Normalise" is left alone, `warnOnce` deduplicates
     so a column of fifty pills warns once, and the whole block is dead code in
     production. */
  if (isDevelopment() && label !== undefined && label.trim() !== "") {
    for (const row of BANNED_WORDS) {
      const escaped = row.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      if (new RegExp(`\\b${escaped}\\b`, "i").test(label)) {
        warnOnce("OPSIN-0006", {
          text: label,
          word: row.word,
          replacement: row.instead,
        })
        break
      }
    }
  }

  const word = label?.trim() ? label : meta.word

  return (
    <span
      data-slot="status-pill"
      data-status={status}
      className={cn(
        /* `inline-flex` with `items-center` rather than a fixed height: at 200%
           text the pill has to grow with the word, and a height would truncate
           it. `whitespace-normal` is explicit for the same reason, so the word
           is never shortened to an ellipsis and never replaced by the icon
           alone. `shrink-0` holds the pill's own width in a flex row, so the
           flex algorithm cannot squeeze it below its content and break the
           status word across two lines, which is slower to read at exactly the
           level that asks for an action. Holding that width means a row too
           narrow for both the pill and its subject has to wrap, and D8 makes the
           pill the element that moves to its own line: a container placing a
           pill beside prose sets `flex-wrap` so the subject keeps the full width
           and the pill drops below it, which is what `status-pill-in-a-list`
           does. `max-w-full` caps the pill at its containing block so it never
           overflows the column. */
        "inline-flex max-w-full shrink-0 items-center whitespace-normal rounded-full border align-middle",
        TONE[status],
        SIZE[size],
        className
      )}
    >
      {/* Decorative. The word beside it carries the meaning, so announcing the
          glyph as well would make a screen reader say the level twice. */}
      <Icon
        data-slot="status-pill-icon"
        aria-hidden="true"
        className="size-[1em] shrink-0"
      />
      <span data-slot="status-pill-label">{word}</span>
      {/* The subject, for the accessible name only. A sighted reader sees
          "Needs attention" next to the thing it describes; a screen-reader user
          hears "Needs attention, HbA1c result" and does not have to hold a
          floating level in their head until they reach whatever it applies to. */}
      {describes ? <span className="sr-only">, {describes}</span> : null}
    </span>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows all four levels because the
 * one thing a reader needs to see about this component is that the four are
 * distinguishable without colour. That is also why the page's preview is worth
 * looking at in greyscale.
 *
 * It shows the four levels and nothing else. Size is demonstrated in the
 * labelled sizes example embedded on the component page, not here: a demo that
 * ships through `shadcn add` should not carry an unlabelled sample a reader has
 * to decode, and a lone smaller pill beside the four reads as a stray repeat
 * rather than a size sample.
 *
 * The subjects are deliberately unreal (ADR 0012). No number, no unit, no
 * measurement anybody could mistake for their own.
 */
export default function StatusPillDemo() {
  return (
    <div className="flex flex-wrap items-center gap-opsin-3">
      <StatusPill status="steady" describes="example measurement" />
      <StatusPill status="watch" describes="example measurement" />
      <StatusPill status="attention" describes="example measurement" />
      <StatusPill status="urgent" describes="example measurement" />
    </div>
  )
}
