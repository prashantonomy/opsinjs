/**
 * Callout — a short piece of set-apart information that carries no clinical
 * level at all.
 *
 * WHAT IT REFUSES IS THE COMPONENT. There is no `status` prop, no `severity`
 * prop, no `color` prop, and no fourth variant called "warning". AlertBanner is
 * the component that carries a clinical level: it is counted against the
 * escalation budget, it is answerable to the two-axis rule, and a reviewer
 * looking at a screen can find every one of them. A Callout that could be
 * tinted amber would inherit all of that attention and none of the obligations,
 * and nothing in review catches the difference, because the two render
 * identically. So the refusal is the API rather than a paragraph in the
 * documentation.
 *
 * WHICH IS WHY THE THREE VARIANTS SHARE ONE TREATMENT AND DIFFER ONLY BY GLYPH.
 * The temptation with an admonition component is a tint per variant — blue for
 * a note, green for a tip, yellow for a caveat — and yellow-for-a-caveat is the
 * exact colour a reader has been taught means *watch* by every status surface
 * on the screen. The product theme has no non-axis accent to reach for anyway:
 * `app/product.css` bridges eleven neutral surface roles plus the two axes, and
 * nothing else exists. One neutral fill for all three is therefore both the
 * available answer and the correct one — a variant buys a distinct glyph, and
 * that is the whole of what it buys.
 *
 * IT STAMPS NO `data-variant`, DELIBERATELY. The data-attribute vocabulary is
 * closed at four — `data-slot`, `data-status`, `data-opsinjs-value`,
 * `data-category` — and spending a fifth on a distinction the specification
 * itself describes as one whose loss "loses nothing" would be the wrong trade.
 * A product that needs to style the note case differently from the tip case has
 * `className`, and the reason it should not is the paragraph above.
 *
 * IT IS A SERVER COMPONENT. No state, no timers, no event handlers, no Base UI
 * primitive. There is no dismiss control — a dismissible callout needs a name,
 * a target floor and a memory that outlives the render, and none of those three
 * has been designed. Its absence is why this file has no client boundary.
 */

import { Asterisk, Info, Lightbulb } from "lucide-react"
import type { ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * Three variants, chosen so that none of them maps onto a clinical status
 * level.
 *
 * `warning` is deliberately absent. A warning about a person's health is an
 * AlertBanner; a warning about anything else is a caveat, which is what that
 * third member is for.
 *
 * DECLARED, NOT EXPORTED, and the specification page writes `export type` here.
 * A registry file ships exactly three public symbols — the props interface, the
 * component and its zero-prop demo (ADR 0009) — so a fourth would be a fourth
 * thing a consumer's `shadcn add` puts in their project and a fourth thing this
 * system has to keep stable. A wrapper that needs to name the three values
 * writes `CalloutProps["variant"]`, which is the same union and cannot drift
 * from it. `button.tsx` declares its own variant union the same way for the
 * same reason.
 */
type CalloutVariant = "note" | "tip" | "caveat"

/**
 * The glyph for each variant.
 *
 * Three distinct silhouettes rather than one glyph in three colours, for the
 * same reason the four status levels are four distinct shapes: colour is the
 * carrier that fails first, and here it is not carrying anything at all.
 *
 * None of the three is a status glyph. `Check`, `Eye`, `TriangleAlert` and
 * `OctagonAlert` belong to the status axis and appear on this component under
 * no circumstances — a triangle in a Callout is the axis leaking back in
 * through the icon set after it has been kept out of the palette. `Asterisk` is
 * the printer's mark for a footnote, which is exactly what a caveat is, and it
 * carries no alarm.
 *
 * Typed `Record<CalloutVariant, …>` so that adding a fourth variant without a
 * glyph is a compile error rather than a callout with an empty gutter.
 */
const VARIANT_ICONS: Record<CalloutVariant, typeof Info> = {
  note: Info,
  tip: Lightbulb,
  caveat: Asterisk,
}

/**
 * The one treatment, written out rather than built per variant.
 *
 * `bg-muted` is the fill and `text-foreground` is the body ink, both from the
 * eleven neutral roles `app/product.css` bridges. The boundary is
 * `border-border`, and it is never the only thing setting the callout apart on
 * screen, because it is a hairline. The fill does the work; the border draws
 * the edge.
 *
 * NO CONTRAST FIGURE IS QUOTED HERE, AND THAT IS DELIBERATE. `tokens/color.json`
 * says the measured numbers "are never written by hand and never quoted in
 * prose", and a figure typed into a comment drifts silently the next time the
 * ramps are re-tuned. None of the pairs this component actually paints — body
 * ink on the fill, the fill against the page, the hairline against the fill —
 * is in `lib/generated/contrast.json` at all.
 * The nearest measured neighbour is `neutral.hairline-on-page`, which is
 * advisory-failing in both themes; it measures the neutral ramp against the
 * neutral page rather than `--border` against `--muted`, so it is a different
 * pair and its figures are not this component's to borrow. The measured set
 * for this component is what `<ContrastReport component="callout" />` prints on
 * the specification page, and today that is empty.
 *
 * `rounded-opsin-md` is what `tokens/shape.json` publishes as the default for a
 * box of this size, and `corner-shape` rides on it as a progressive
 * enhancement — an engine without it drops the declaration and draws an
 * ordinary rounded corner, which is the fallback that file specifies. It is
 * written as a property rather than through the product theme's
 * `data-opsin-shape` attribute, because that attribute is a fifth member of a
 * closed vocabulary and the stylesheet declaring it does not travel with this
 * file into a consumer's project.
 */
const SURFACE =
  "bg-muted text-foreground border border-border rounded-opsin-md " +
  "[corner-shape:var(--opsin-corner-shape)]"

/**
 * Print, where the fill is gone and the boundary is the whole of the
 * treatment.
 *
 * A browser drops background colours when it prints unless the reader has gone
 * looking for the setting that keeps them, so a callout on paper is a box
 * defined by its border alone. A hairline is not enough for that job, so the
 * boundary steps up from the hairline role to the ink role. The fill is dropped
 * explicitly rather than left to the browser, so the page looks the same
 * whichever way that setting is left.
 *
 * THIS WORKS IN THE LIGHT THEME AND NOT IN THE DARK ONE, AND NOTHING IN THIS
 * FILE CAN CLOSE THE GAP. `--foreground` is near-black in the light theme and
 * near-white in the dark one, and `app/product.css` — the only stylesheet a
 * component renders under at `/view` — carries no `@media print` block, so
 * nothing forces ink to black on paper. A reader printing from the dark theme
 * therefore gets a near-white boundary, near-white body text and a near-white
 * glyph on white paper. The repair is a print block in the theme layer, which
 * belongs to every component rather than to this one; a component could only
 * do it here by writing a raw colour literal, which this system forbids in
 * `registry/**`. Recorded on the specification page among the things nobody
 * has checked, rather than left for a reader to discover at the printer.
 */
const PRINT = "print:bg-transparent print:border-foreground"

export interface CalloutProps {
  /**
   * Which of the three the callout is. Changes the glyph and nothing else: the
   * fill, the ink and the boundary are identical for all three, so the variant
   * survives greyscale by never having depended on colour.
   *
   * @default "note"
   */
  variant?: CalloutVariant
  /**
   * An optional short heading. It renders as styled text and not as an `h1`-`h6`
   * element, so it never appears in the page's outline: a component cannot know
   * which level it is nested at, and one that guessed would produce an outline
   * that skips a level on some screens and repeats one on others. If the
   * callout is a section a reader needs to navigate to, it needs a real heading
   * outside it — and at that point it is probably a section rather than a
   * callout.
   *
   * An empty or whitespace-only string is treated exactly like no title at
   * all: the element leaves the DOM rather than rendering an empty line of
   * heading-weight space.
   */
  title?: string
  /**
   * The body: one short paragraph. There is no actions slot and no `action`
   * prop. A callout that needs a button is asking the reader to do something,
   * and an instruction with somebody behind it is a CareCard.
   */
  children: ReactNode
  /**
   * Merged onto the root. Layout belongs here — a callout sets no width and no
   * margin, because both are decisions of the content it sits in.
   *
   * It is also the one hole in this component's refusal to carry a status, and
   * the component says so rather than pretending otherwise: a colour utility
   * from either axis passed through here reaches the root, and in development
   * it raises a warning that names what to use instead.
   */
  className?: string
}

/**
 * The axis names, and the pattern that finds one in a class list.
 *
 * Built from two pieces on purpose. `scripts/check-a11y.mts` reads this file as
 * text and treats any file that spells a complete axis utility as a status
 * surface owing a word, a glyph and a `data-status`; a detector written the
 * obvious way would report itself and there would be no repair short of
 * deleting the check. Split like this, the file contains the axis names and the
 * axis prefixes and never the two joined, which is the thing the gate looks
 * for — and the pattern still matches every joined form at runtime.
 */
const AXIS_NAMES =
  "steady|watch|attention|urgent|unknown|sleep|heart|activity|nutrition|mind|labs"

const AXIS_TINT = new RegExp(
  `(?:^|[\\s:-])(?:status|category)-(?:${AXIS_NAMES})(?![a-z])`,
)

/**
 * The escape hatch, reported rather than closed.
 *
 * Not an OPSIN code: `tokens/errors.json` has no entry for a component outside
 * both axes being handed a colour from one of them, and a component may not
 * mint one — the codes are a versioned contract and the table on the errors
 * page is generated from that file. A development warning is the honest channel
 * until an entry exists.
 *
 * The cost of not having a code is that this does not go through `warnOnce`,
 * which is keyed on one — so it repeats on every render that carries the
 * offending class rather than printing once per session. That is worse than
 * `warnOnce` and better than silence, and it goes away the day the table gains
 * an entry for it.
 *
 * It warns and renders. The class list is the caller's and the content is the
 * reader's; taking a paragraph off the screen over a styling mistake would be
 * the larger error, and a Callout with the wrong fill still says what it says.
 */
function warnIfTintedFromAnAxis(className: string | undefined): void {
  if (!isDevelopment() || className === undefined) return
  if (!AXIS_TINT.test(className)) return
  console.warn(
    `[opsinjs] <Callout className="${className}"> takes a colour from one of the ` +
      "two axes. Callout sits outside both, and that is the component: a callout " +
      "that can be tinted from the status ramps hands a product a second, " +
      "ungoverned way to raise the level of a reading, and a reader has no way to " +
      "tell it apart from the component that is answerable for saying so. If the " +
      "message is about this reader's own data and carries a level, the component " +
      "is <AlertBanner> or <StatusPill>. If it is about the category a reading " +
      "belongs to, the tint goes on the surface around the callout and not on the " +
      "callout. See /docs/health/two-colour-axes.",
  )
}

export function Callout({
  variant = "note",
  title,
  children,
  className,
}: CalloutProps) {
  warnIfTintedFromAnAxis(className)

  const Icon = VARIANT_ICONS[variant]

  /* An empty or whitespace-only title is the ABSENCE of a title, not a title
     with nothing in it. `""` is what a caller gets from an empty field or a
     lookup that missed, and testing `!== undefined` rendered it as a
     headline-sized empty paragraph with a row of gap above the body — an
     absence drawn as a blank space, which is the one shape this system's
     absences may never take. The element leaves the DOM instead, which is the
     `0..1` cardinality the anatomy publishes. */
  const hasTitle = title !== undefined && title.trim() !== ""

  return (
    /* A grid rather than a flex row with a wrapper around the text, because the
       anatomy has Icon, Title and Body as three siblings under the root and a
       wrapper would be a fourth element that the part tree does not name. The
       glyph is placed explicitly at row 1 of column 1; the title and the body
       are placed in column 2 and fall into successive rows, so a callout with
       no title puts its body on row 1 beside the glyph and needs no second
       layout.

       `p-4` is the density-scaled step and not `p-opsin-4`. app/product.css
       names the inside of a box as the canonical use of the scaled scale, so a
       reader who has asked for a denser interface gets one here — and padding
       is the measurement that may tighten, unlike the gutter below.

       No role, and the cost of that is real rather than nil. "Ordinary content
       in the reading order" is a plain element, so nothing is announced over
       what the reader is doing and nothing is announced twice — `role="alert"`
       is the thing this component exists not to be. What a plain element also
       means is that a screen-reader user gets no boundary: no start, no end,
       no accessible name, and no programmatic link between the title and the
       body it belongs to. The fill, the hairline, the gutter glyph and the
       heavier title are presentation with no equivalent anywhere in the tree.
       `role="note"`, or `role="group"` with `aria-labelledby` pointing at the
       title, would supply that boundary — and neither says anything about the
       variant either way, so "the variant loses nothing when it is lost" is
       not an argument against them. Neither is adopted here because nobody has
       listened to this component in a screen reader, and picking one on a
       guess is how a container that announces itself four times down a screen
       gets shipped. It is an open question on the specification page rather
       than a settled decision. */
    <div
      data-slot="callout"
      className={cn(
        "grid grid-cols-[auto_1fr] items-start p-4",
        /* The gutter and the line gap are FIXED steps, not scaled ones. Their
           job is to keep the glyph out of the text and the title off the body,
           and neither should close up because somebody asked for a denser list.
           Step 2 is the tightly-related step in tokens/space.json. */
        "gap-x-opsin-2 gap-y-opsin-2",
        SURFACE,
        PRINT,
        className,
      )}
    >
      {/* Decorative, and hidden because it is a duplicate rather than because
          it is unimportant. The glyph is a scanning aid: a sighted reader picks
          a caveat out of a page of prose without reading it first. Hiding it
          costs nothing only where the words already carry the sense of the
          variant, which is a rule for the copy — the demo below and both
          examples are written to it, and a caller who is not writing to it has
          a callout whose variant reaches sighted readers alone. Announcing the
          glyph instead would not fix that: an icon name is not the sense of a
          caveat either. Sized in `em` so it grows with the text at 200% instead of
          staying put beside a word that has doubled, and nudged down by a
          fraction of an em so it sits on the first line's cap height rather
          than on its ascender — an em nudge stays proportionate when the text
          scales, where a pixel one would drift. */}
      <Icon
        data-slot="callout-icon"
        aria-hidden="true"
        className="col-start-1 row-start-1 mt-[0.2em] size-[1em] shrink-0"
      />

      {hasTitle ? (
        <p
          data-slot="callout-title"
          className="col-start-2 m-0 min-w-0 text-opsin-headline"
        >
          {title}
        </p>
      ) : null}

      {/* `text-opsin-body` rather than a smaller step. A callout is set apart by
          its box, not by being harder to read: shrinking the type is how an
          aside becomes small print, and small print is where the limitation
          nobody read was written down. The two child rules trim the outer
          margins off a caller's paragraph so the padding above stays the
          padding, whether the body arrives as a string or as a <p>.

          `min-w-0 wrap-break-word` is the reflow repair, and it is here
          because "no fixed height and no overflow container" is not the whole
          story. `1fr` is `minmax(auto, 1fr)`, so the text track's floor is its
          own min-content width — the longest unbreakable token in `children`.
          At 200% text on a phone one long word or a bare URL would exceed the
          column and widen the grid past the viewport, which is horizontal
          scroll on the document and an SC 1.4.10 failure. `min-w-0` lets the
          track shrink below that floor and `wrap-break-word` breaks the token
          instead of the layout. The title cell carries `min-w-0` for the same
          reason. Reasoned from the CSS and not yet measured in a browser; the
          measurement is the nightly layout job's. */}
      <div
        data-slot="callout-body"
        className="col-start-2 min-w-0 wrap-break-word text-opsin-body *:first:mt-0 *:last:mb-0"
      >
        {children}
      </div>
    </div>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is
 * public, reviewed code rather than a scratch demo. It shows all three variants
 * because the one thing worth seeing about this component is that they are one
 * treatment and three glyphs. Greyscale changes nothing about telling them
 * apart, and that is a fact about the source rather than something a control
 * on the documentation site demonstrates: all three resolve the same three
 * tokens, so there is no hue for a filter, a photocopier or a colour vision
 * deficiency to take away.
 *
 * EACH BODY NAMES ITS OWN VARIANT, and that is a rule rather than a
 * coincidence. The glyph is `aria-hidden`, so it reaches nobody who is not
 * looking at it; if the words do not carry the sense of the variant, a
 * non-visual reader has no way to tell a caveat from a note. The component
 * cannot enforce that on a caller's copy, so the demo teaches it instead.
 *
 * Not a number, not a unit, not a reading anywhere in it (ADR 0012). A callout
 * is for something that would still be true if this reader had never opened the
 * app, and the demo copy is written to that test.
 */
export default function CalloutDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-4">
      <Callout title="How this example is put together">
        A note explains the content around it. It is set apart by its box, and
        by nothing else — no tint, no level, no claim about anybody.
      </Callout>

      <Callout variant="tip">
        A tip has no title, which is the common case. One short paragraph, next
        to the thing it is about.
      </Callout>

      <Callout variant="caveat" title="What this example leaves out">
        A caveat names a specific, checkable limitation of what is on screen —
        how a figure was worked out, or what it does not include.
      </Callout>
    </div>
  )
}
