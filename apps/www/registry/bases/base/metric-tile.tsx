/**
 * MetricTile is one measurement, its unit and its age, at the size that fits in
 * a grid with seven others.
 *
 * WHAT IT ASSERTS, and the list is three items long: that this measurement had
 * this value, in this unit, at this time. Nothing else. It does not say whether
 * the number is where it should be, whether it has moved, or what to do about
 * it. Every one of those needs a sentence, and a tile has no room for one.
 * `label`, `value` and `now` are always required, and `measuredAt` is required
 * for a reading: an undated reading is unusable, and a reading with no instant
 * to measure its age against cannot be shown to be current or shown to be old.
 * An absent reading needs no time, so `measuredAt` may be `null` beside one.
 *
 * WHEN THERE IS NO READING THE THIRD ASSERTION IS WITHHELD. A tile whose `value`
 * is `null` or a broken number shows the absence and the label and stops there.
 * The time line is dropped, because "Measured" beside "no reading yet" claims a
 * measurement that did not happen, and no event word would make that pairing
 * honest. With no measurement there need be no measurement time, so `measuredAt`
 * may be `null` in that state, and a real timestamp passed there is still not
 * rendered, because there is no reading for it to date.
 *
 * IT DERIVES NO VERDICT. `status` is an input, assigned by the product, and it
 * is rendered by StatusPill and by nothing else here. This file contains no
 * comparison of a value against anything, because it has no range, no
 * threshold and no reader.
 *
 * THE TWO AXES, AND WHICH ELEMENT TAKES WHICH. The category tints the icon and
 * the label. That is identity, so the sleep tiles are findable among the heart
 * tiles without reading eight labels. The status appears as an embedded
 * StatusPill and never as the tile's fill: a grid of status-coloured tiles is a
 * picture of somebody's body rendered as a heat map, and it is least readable
 * at the moment it matters most. No element here carries both, so there is no
 * OPSIN-0001 to raise. `axisConflict()` is a per-ELEMENT check, and calling it
 * on this component's props would report every correct tile.
 *
 * TWO PLACES WHERE THE SPECIFICATION COULD NOT BE BUILT AS WRITTEN, both
 * resolved here and both written up on the page.
 *
 * 1. THERE IS NO `trend` PROP AND NO EMBEDDED SPARKLINE. The specification asks
 *    for `trend?: TrendPoint[]` drawn small, "decorative at tile size", hidden
 *    from assistive technology. TrendSparkline shipped with a mandatory,
 *    visible caption and a `role="img"` plot named by it, because a line
 *    through somebody's readings is a claim that a pattern exists and the
 *    sentence beside it is the only part that says which pattern. A picture of
 *    a person's health with nothing saying what it is cannot be built, so the
 *    honest options were two. One is a tile big enough for a real caption,
 *    which by then is a card. The other is no trend at all. This is no trend at
 *    all: the tile leads somewhere that can carry one. A product that wants a
 *    line in a grid cell composes TrendSparkline in its own layout, at a size
 *    where the caption fits; that arrangement is demonstrated by the
 *    sparkline's own example.
 *
 * 2. `value` IS `number | null`, NOT `number | string | null`. Every number a
 *    reader sees goes through Value, which formats it, resolves the spoken form
 *    of the unit and keeps absence apart from zero. Value takes a number.
 *    A pre-formatted string is a number somebody else has already rounded, with
 *    no spoken unit and no machine-readable datum behind it, and accepting one
 *    would put a second formatter in the system. The case the string was for is
 *    a compound reading. A compound reading is a pair rather than a number, and
 *    a pair is two measurements: it belongs in two tiles, or on a surface that
 *    can show both. A value that
 *    is not a finite number reaches Value anyway in a JavaScript project, and
 *    Value says "not available" and reports it, which is the right words in the
 *    right place.
 *
 * STALENESS IS THE PRODUCT'S NUMBER AND NOBODY ELSE'S. `staleAfterHours` has no
 * default and never will: what counts as an old reading is clinical and differs
 * by measurement. Omitted, the tile has no stale treatment at all, which is the
 * honest output when nobody has said what stale means here. Supplied, the tile
 * mutes itself AND RelativeTime says the words. The muting is the scanning
 * aid, the words are the carrier, and a treatment that survives greyscale is
 * the only kind worth having. No number is written down anywhere in this file,
 * in its demo, or in either of its examples, and none may be added: opsinjs
 * owns no staleness boundary for any measurement in any population, and a
 * number in a file `shadcn add` copies is a boundary published by whoever
 * copied it.
 *
 * WHAT THIS COMPONENT DOES NOT DO, listed here as well as on its page, because
 * this file travels and the page does not. It cannot say where a number came
 * from: `event` names the moment and the product picks it, but nothing here
 * checks that the word matches how the figure was obtained, so a self-reported
 * or device-estimated figure named "measured" is still announced as one. It has no
 * masking affordance, so a reading cannot be obscured on a shared screen
 * without the layout moving. It does not require an `href` beside a level that
 * asks for action. And it holds a second copy of RelativeTime's instant rule
 * because RelativeTime publishes neither the parser nor the verdict; the copy
 * is exact today and nothing but a reader stops it drifting. Every one of those
 * is a gap this file has, not a gap it hides.
 */

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react"

import { ChevronRight } from "lucide-react"

import {
  HEALTH_CATEGORIES,
  isDevelopment,
  isHealthCategory,
  warnOnce,
  type ClinicalStatus,
  type HealthCategory,
} from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { RelativeTime, type TimeEvent } from "@/registry/base-lyra/ui/relative-time"
import { StatusPill } from "@/registry/base-lyra/ui/status-pill"
import { Surface } from "@/registry/base-lyra/ui/surface"
import { Value } from "@/registry/base-lyra/ui/value"

/**
 * The undated-reading warning, said once per distinct offending value.
 *
 * `tokens/errors.json` states the policy, and that policy is development only,
 * once per offending call site. This warning lives in a render body. Without a
 * keyed set it repeats on every render and twice again under Strict Mode, and a
 * grid of tiles fed from one undated feed would print the same ten sentences
 * per tile per scroll until an author filters the console, at which point the
 * channel no longer carries its one real finding.
 *
 * It is a module-local set rather than the substrate's `warnOnce` because
 * `warnOnce` is keyed to an `OpsinErrorCode` and no code is allocated for an
 * instant that cannot be located. OPSIN-0010 below has one and uses it.
 * Allocating a code in `tokens/errors.json` and deleting this is a strict
 * improvement.
 *
 * The key is the rejected value rather than a constant, because two different
 * unparseable timestamps are two different mistakes and an author who has fixed
 * the first still needs to be told about the second.
 */
const warnedUndated = new Set<string>()

function warnUndatedOnce(received: string, message: string): void {
  if (!isDevelopment() || warnedUndated.has(received)) return
  warnedUndated.add(received)
  console.warn(message)
}

/**
 * The category tint, written out because Tailwind reads class names as literal
 * strings. `text-category-${category}-ink` generates no CSS and renders a tile
 * with no tint at all, which looks like a missing category rather than a
 * missing stylesheet.
 *
 * `-ink` and not the bare name. The bare `category-<name>` utility resolves the
 * ACCENT role, which is chosen for recognition rather than for contrast and is
 * never text; `-ink` is the role that clears the text floor against the surface
 * it sits on. The icon takes the same role as the label because it is drawn at
 * text size beside it and is read as part of the same phrase.
 */
const TINT: Record<HealthCategory, string> = {
  sleep: "text-category-sleep-ink",
  heart: "text-category-heart-ink",
  activity: "text-category-activity-ink",
  nutrition: "text-category-nutrition-ink",
  mind: "text-category-mind-ink",
  labs: "text-category-labs-ink",
}

/**
 * The corner and the print boundary, on the same reasoning Card gives.
 *
 * Surface draws the tile's edge as an outline carrying a negative offset, and
 * `forced-colors: active` keeps an outline while recolouring it to CanvasText,
 * so the tile's boundary survives forced colours on its own and this constant
 * adds nothing to carry it there. No forced-colours border is added here for
 * exactly that reason: D11 puts that boundary on the outline in Surface, where
 * an outline is the mechanism forced colours keeps and a border would be the
 * wrong one.
 *
 * Print is not the same story, and the outline does not close it. A printer
 * keeps the outline as a mechanism, but draws it in the rung's own edge colour,
 * and for the default `card` rung both this tile and Card sit on, that colour
 * is `--opsin-material-card-border`, a near-white hairline that resolves to
 * `oklch(0.929 0.004 250)` in the light theme and measures about 1.23:1 on
 * white paper, so it is no boundary a reader can see. The theme's `@media print`
 * block inks the chrome roles and carries every rung to its opaque fill, but it
 * leaves `--opsin-material-*-border` at its screen value, so the outline never
 * reaches paper as more than an invisible hairline. The boundary a reader on
 * paper actually sees is `print:border print:border-border`, whose `--border`
 * the same print block redeclares as printable ink. That makes this the primary
 * print rule rather than a second answer for the fill, and removing it on the
 * theory that Surface already carries the edge would return the tile to a
 * boundaryless printout. Card makes this same choice, so the two do not diverge.
 */
const SHAPE = "rounded-opsin-md [corner-shape:var(--opsin-corner-shape)]"
const PRINT_BOUNDARY = "print:border print:border-border"

/**
 * The vertical rhythm between the parts, as a class each part carries.
 *
 * Step 2 is what `tokens/space.json` publishes as the gap between tightly
 * related lines, which is what a label, a reading and a date are. It is a
 * margin on each part rather than a `gap` on a flex parent because the parent
 * is Surface's root, and that root lays out the material's four layers rather
 * than this component's content. That is the same reason Card carries its
 * rhythm on its parts. The header is always first, so nothing here needs a
 * `:not(:first-child)` guard.
 */
const RHYTHM = "mt-opsin-2"

/**
 * The stale treatment, carried by the parts rather than by the tile's root.
 *
 * IT LOOKS LIKE THE LONG WAY ROUND AND IT IS THE ONLY CORRECT ONE. This used to
 * be one class on Surface's root, with the parts inheriting it, which is shorter
 * and wrong twice over.
 *
 * A caller's `className` lands in the same `tailwind-merge` conflict group as a
 * colour. The merge cannot tell an opsin type step from an opsin colour,
 * because both are `text-*` with a key it does not know, so a class passed
 * from outside would delete the muting and leave a stale reading looking fresh.
 * That is the same defence relative-time.tsx arrived at, for the same reason.
 *
 * And the muting stays on the parts rather than on Surface's root so the
 * embedded StatusPill inherits nothing this file set. A verdict the product
 * assigned is not withdrawn because the reading has aged, so a muted root that
 * dimmed the pill's word as well would be this component retracting a claim it
 * never made. The tile keeps the muting off the root for that reason, and it
 * does not lean on how the pill defends its own colour. StatusPill writes its
 * ink as the arbitrary property `color:var(--opsin-status-<level>-ink)` in
 * square brackets, spelled without the brackets here because Tailwind's scanner
 * reads comments and a bracketed candidate carrying a `<level>` placeholder
 * compiles to CSS that does not parse. That property is grouped by
 * tailwind-merge under the CSS property rather than against a type step, so the
 * verdict colour survives the merge on its own. That is the pill's defence to
 * make, and this file neither relies on it nor speaks for it.
 *
 * The timestamp is not in the list. RelativeTime mutes its own spans past the
 * same boundary, and the two verdicts are now computed from the same parser and
 * the same comparison, so they cannot disagree about which of them applies.
 */
const MUTED = "text-muted-foreground"

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS

/**
 * The shape of an instant this component is willing to locate in time.
 *
 * IT IS A SECOND COPY OF RelativeTime's RULE, and saying so is the only honest
 * description of it. The comment that used to sit here said this was "not a
 * second parser"; it was one, and it was a stricter one, and the two directions
 * of that divergence produced the two defects this file now exists not to have.
 * Too strict, and a timestamp RelativeTime renders happily made the whole tile
 * disappear from a grid with only a development warning to say why. Too
 * forgiving is the opposite failure. `Date.parse` rolls 31 February forward
 * to 3 March without a complaint, so the tile drew somebody's reading while
 * RelativeTime refused the same string and drew no time at all.
 *
 * So this accepts and refuses exactly what `parseInstant` in relative-time.tsx
 * accepts and refuses: the same pattern, the same field range checks, the same
 * round trip through `Date.UTC` that rejects a day that does not exist. A space
 * in place of the `T`, a lower-case `z` and a `+0100` offset are accepted
 * because databases emit all three. A timestamp with no offset is refused: it
 * is read in whichever zone the code happens to be running in, which makes one
 * reading two different ages on a server and on a phone, and a tile that muted
 * itself on the server and not in the browser would be worse than one that
 * never muted at all.
 *
 * The duplication is real and it is reported upward rather than worked around.
 * RelativeTime does not export its parser and a component cannot read another
 * component's internals; one shared instant parser belongs in the substrate,
 * where both files would call it and neither could drift. Until that lands, the
 * invariant a reader can check by eye is that these lines are `parseInstant`
 * with the offset thrown away.
 */
const RFC_3339 =
  /^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(?:([Zz])|([+-])(\d{2}):?(\d{2}))$/

/**
 * The instant a timestamp names, in epoch milliseconds, or `null` where this
 * component will not claim to know.
 *
 * ONE GATE, USED TWICE, and that is the point of extracting it. The same answer
 * decides whether the tile renders at all and whether its age can be measured,
 * so the two can never disagree. A tile that refused the timestamp and then
 * muted itself against it would be reasoning from a date it had already
 * rejected.
 *
 * The fields are read out rather than handed to `Date.parse`, because
 * `Date.parse` is where the forgiveness lives: it accepts a date that does not
 * exist and silently moves it to one that does, so a reading dated 31 February
 * came back here as 3 March and reached the screen with no time beside it. The
 * round trip at the end is the check that refuses it, and it is the same check
 * relative-time.tsx makes.
 */
function instantOf(text: string): number | null {
  const match = RFC_3339.exec(text)
  if (match === null) return null
  /* Widened on purpose, and for the reason relative-time.tsx gives: a
     `RegExpExecArray` is typed as an array of strings, so an optional group
     reads as `string` and `=== undefined` is a type error on a value that is
     undefined at run time roughly half the time. */
  const fields: (string | undefined)[] = match

  const year = Number(fields[1])
  const month = Number(fields[2])
  const day = Number(fields[3])
  const hour = Number(fields[4])
  const minute = Number(fields[5])
  const second = fields[6] === undefined ? 0 : Number(fields[6])
  /* Truncated to milliseconds, which is all `Date` can hold. Nothing this
     component renders is finer than a minute; it is parsed so that a timestamp
     carrying sub-second precision is not refused for carrying it. */
  const ms = fields[7] === undefined ? 0 : Number(`${fields[7]}000`.slice(0, 3))

  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  if (hour > 23 || minute > 59 || second > 59) return null

  let offsetMinutes = 0
  if (fields[8] === undefined) {
    const offsetHours = Number(fields[10])
    const offsetRest = Number(fields[11])
    if (offsetHours > 23 || offsetRest > 59) return null
    offsetMinutes = (fields[9] === "-" ? -1 : 1) * (offsetHours * 60 + offsetRest)
  }

  const wallClock = Date.UTC(year, month - 1, day, hour, minute, second, ms)
  if (!Number.isFinite(wallClock)) return null
  const check = new Date(wallClock)
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null
  }

  return wallClock - offsetMinutes * MINUTE_MS
}

export interface MetricTileProps {
  /**
   * What was measured, in the reader's words. Use two or three of them, not an
   * acronym and not an internal code: a dashboard that has to be learnt before
   * it can be read is a dashboard that is read wrong.
   */
  label: string
  /**
   * The reading. `null` renders the no-reading state, which is not zero. Zero
   * is a real measurement for several metrics and a missing one is not a
   * measurement at all.
   *
   * A number and not a string. A pre-formatted reading has already been rounded
   * by somebody, carries no spoken unit and leaves nothing machine-readable
   * behind it; a compound reading such as a pair is two measurements and takes
   * two tiles.
   */
  value: number | null
  /**
   * Display symbol, exactly as `tokens/units.json` spells it, as in "kg",
   * "mmol/L" or "steps". The spoken form is resolved from that table by Value,
   * so this is the only place the unit is named. Optional by type and all but
   * mandatory in practice: a bare number is ambiguous between unit systems, and
   * Value raises OPSIN-0003 when one arrives without a unit rather than this
   * file raising a second copy of the same complaint.
   */
  unit?: string
  /**
   * Decimal places, from the precision of the measurement. That is the
   * resolution of the device, or the number of places the laboratory reported.
   * Required, so a TypeScript caller cannot omit it: a bare number that arrived
   * from arithmetic can carry seventeen digits, which on a tile is also a
   * layout problem. Forwarded to Value untouched. A JavaScript caller who omits
   * it still gets the digits it was handed plus a development warning from
   * Value.
   */
  precision: number
  /**
   * When the reading was taken, ISO 8601 with an offset. The time of
   * MEASUREMENT, never of retrieval, sync or render. A tile that timestamps
   * itself with the moment the screen was drawn tells every reader that every
   * reading is current. The word this instant is announced with is `event`,
   * which defaults to "measured".
   *
   * A reading must be dated. A value with no locatable time is undated, and for
   * health data undated is the same as wrong, so a reading passed with a time
   * this component cannot locate is refused and nothing is drawn.
   *
   * `null` is allowed, and it means one thing only: there is no measurement
   * time because there was no measurement. It is legal solely beside an absent
   * `value`, where the tile shows the absence and no time at all. A reading
   * present beside `measuredAt={null}` is the undated reading above and is
   * refused the same way. A tile that has a value it cannot date is not a tile.
   */
  measuredAt: string | null
  /**
   * The word the time line is announced with. It names the moment rather than
   * the origin of the number. The five events RelativeTime publishes are
   * "measured", "recorded", "received", "synced" and "issued"; this defaults to
   * "measured" so an existing caller is unchanged, and a product measuring off a
   * device or reading a laboratory value names the one that is true.
   *
   * It names the moment and not the provenance. This component cannot check that
   * the word matches how the number was obtained, so a self-reported figure
   * routed through here with `event="measured"` is still announced as a
   * measurement. The product owns that word. Data provenance and device accuracy
   * asks for the provenance class to be shown in plain words, which this
   * component still does not carry, and the page records that as an open gap.
   */
  event?: TimeEvent
  /**
   * The instant the age is measured against, in the same form as `measuredAt`.
   * Required for the same reason RelativeTime requires it: a component that
   * read the clock itself would be impure, would read it once per tile rather
   * than once per screen, and would let a grid of eight disagree with itself
   * across a minute boundary. Read it once where the screen is rendered. Use
   * `new Date().toISOString()` and pass the same value to every tile on it.
   */
  now: string
  /**
   * Hours after which the tile shows its stale treatment. Supplied by the
   * product, and by nobody else: what counts as an old reading is clinical, it
   * differs completely from one measurement to the next, and opsinjs holds no
   * such number for any measurement in any population. Writing one here would
   * publish a boundary this system has no standing to publish. The same is true
   * of writing one in an example, or in a comment as an illustration.
   *
   * There is no default and there will not be one. Omitted, there is no stale
   * treatment at all. That is the honest output when nobody has said what stale
   * means here, and never a substituted number.
   */
  staleAfterHours?: number
  /**
   * The level the product assigned to this reading. Rendered as an embedded
   * StatusPill and never as the tile's fill. Omitted, no pill is rendered at
   * all: there is no neutral level to fall back on, and a pill invented to fill
   * a gap would be a verdict nobody gave.
   *
   * PAIR `attention` AND `urgent` WITH AN `href`. Clinical status semantics
   * says of `attention` that there is always a named action, and a tile has no
   * room for a sentence. So on a tile the action is the tile itself, and a
   * level on a tile that leads nowhere leaves a reader a verdict and no way to
   * act on it. Nothing here enforces the pairing: the check belongs in the
   * shared warning channel, which this file cannot add a code to, and it is
   * recorded as an open gap on the component's page rather than left silent.
   */
  status?: ClinicalStatus
  /**
   * Tints the icon and the label, and nothing else. Identity rather than
   * meaning: in greyscale the tint is lost and not one fact goes with it.
   */
  category?: HealthCategory
  /**
   * The category glyph, supplied by the product. opsinjs ships no category icon
   * set. [category identity](https://opsinjs.pensievelabs.org/docs/health/category-identity)
   * says an icon is governed separately. So this is a slot rather than a
   * lookup, and a tile with no icon is a complete tile.
   *
   * Rendered decorative: the label beside it says the same thing in words, and
   * a glyph announced as well would make a screen reader say the subject twice.
   * It must not be interactive; the tile is one target and nothing nests inside
   * it. Because the wrapper is `aria-hidden`, a control passed here would
   * be reachable by Tab and absent from the accessibility tree at the same
   * time. Nothing here checks that, so this sentence is the whole guard, and
   * the page's claim that nothing inside a tile is focusable is scoped to what
   * this component controls.
   */
  icon?: ReactNode
  /**
   * Where the tile leads. With it the whole tile is one link, meeting the
   * target floor on both axes; without it the tile is a static readout. A
   * clinical tile with nowhere to go raises a question the product refuses to
   * answer, so most tiles should have one.
   *
   * With an `href` the tile renders a trailing chevron and underlines its label
   * on hover and on keyboard focus, so a reader on a touch screen can see the
   * tile is a door without hovering it. A static tile shows neither.
   *
   * ONE CONSTRAINT COMES WITH THE LINK, and it is named here because a product
   * choosing a unit is the one who meets it. A link takes its accessible name
   * from its content, and Value hides the unit SYMBOL from assistive technology
   * and substitutes the spoken form. So a tile whose visible text reads "kg" is
   * announced "kilograms", and the link's visible label shares no substring with
   * its name. That is WCAG 2.2 SC 2.5.3, and this component cannot repair it: an
   * `aria-label` would replace the whole sentence rather than mend one clause of
   * it, so none is offered. It does not arise for a unit whose symbol and spoken
   * form are the same word. It is recorded on the component's page rather than
   * left to be discovered.
   */
  href?: string
  /**
   * The product's own router link element, rendered in place of the plain
   * anchor while keeping the tile's `href`, its `data-slot="metric-tile"`, its
   * shape and its target floor on it. Pass a Next or React Router link here so
   * a tap navigates client-side rather than reloading the page. Inert without
   * an `href`, because the tile is a static readout with nowhere to go and
   * nothing to route.
   *
   * WHY THE TILE TAKES THE SLOT RATHER THAN THE Link COMPONENT. Link is the
   * seventh actions-and-forms component and the five action-bearing cards route
   * their action anchors through it, but a tile is not one of those cases. Its
   * anchor is a WRAPPER: it carries the tile's own `data-slot`, its shape and
   * `text-inherit no-underline`, so the whole tile is one target and one object
   * in the accessibility tree. Wrapping the tile in a `Link` would move
   * `data-slot="link"` onto a foreign root and put an action link's box around a
   * whole card, so this file keeps its own anchor and takes the escape hatch
   * `Field.Control` offers instead: the element is the tile, not a control
   * inside it. The merge follows Link's: the tile's attributes win over the
   * router element's and the class lists are joined so neither deletes the
   * other.
   */
  render?: ReactElement
  /**
   * BCP 47 locale for the number, its separators and the date. Passed through
   * to Value and to RelativeTime together, so the reading and its timestamp
   * cannot show two conventions on one tile. Omitted, the reader's own
   * environment decides.
   */
  locale?: string
  /**
   * IANA time zone name, for example `"Europe/London"`, for the exact date the
   * timestamp carries. Passed straight to RelativeTime, so the tile does not
   * read it itself. Give the reader's own zone to put the reading on their wall
   * clock; omitted, RelativeTime keeps the stored instant and labels its offset
   * rather than guessing a zone. A name RelativeTime does not recognise is
   * refused rather than approximated, on the same rule that governs it there.
   */
  timeZone?: string
  /**
   * Forwarded to the RelativeTime on the time line, which owns the offset
   * label. A tile whose reading the reader's own device took passes `false`,
   * because a zone that cannot differ from the reader's own is not worth naming
   * and "UTC+1" is not a phrase a layperson reaches for. Omitted, RelativeTime's
   * default stands and the offset is labelled, which is right for a reading that
   * may have crossed zones. This component sets no default of its own and makes
   * no such claim, because it cannot tell where the number came from, so the
   * caller decides.
   */
  showOffset?: boolean
  /**
   * Merged onto the root with `tailwind-merge`, and a class passed here wins
   * where the two conflict. That includes `truncate` and a fixed height, either
   * of which can take digits off the end of a reading at 200% text. This
   * component sets neither and never shortens a number on its own.
   */
  className?: string
}

export function MetricTile({
  label,
  value,
  unit,
  precision,
  measuredAt,
  event = "measured",
  now,
  staleAfterHours,
  status,
  category,
  icon,
  href,
  render,
  locale,
  timeZone,
  showOffset,
  className,
}: MetricTileProps) {
  /* WHETHER THERE IS A READING TO DATE, asked once. This is Value's own split:
     a finite number is a reading, `null` is an absence, and a non-finite number
     is a failure. The time line names the instant at which a reading was taken,
     so it belongs to the reading state alone. Beside an absence it would say
     "Measured" about a figure that was never taken, and beside a broken number
     it would date a reading that never arrived. Both are the exact ambiguity
     uncertainty-and-staleness forbids, so the time line renders only when this
     is true. An absence needs no time, so `measuredAt` may be null there; a
     reading with no locatable time is refused just below. */
  const hasReading = value !== null && Number.isFinite(value)

  /* THE UNDATED READING IS REFUSED, NOT DRAWN, AND null IS THE ONE EXCEPTION.
     A reading needs a locatable instant: this file ships as source into
     JavaScript projects where a type is advice, RelativeTime renders nothing at
     all for an instant it cannot locate, and drawing the rest would put
     somebody's number on screen with no time beside it. The page's own words
     are that a number without a time is undated, "which for health data is the
     same as being wrong", and a tile has no room to explain the omission.
     `measuredAt={null}` is the single legal way to say "no time", and it is
     legal only beside an absent value: there was no measurement, so there is no
     measurement time. A null time beside a real reading is that undated reading
     and is refused the same way. Nothing is rendered and the console says so. */
  const taken = measuredAt === null ? null : instantOf(measuredAt)
  if (taken === null && (hasReading || measuredAt !== null)) {
    warnUndatedOnce(
      String(measuredAt),
      `[opsinjs] <MetricTile> received measuredAt="${String(measuredAt)}", which ` +
        "is not an instant this component can locate. Either it carries no " +
        "offset, or it names a date that does not exist. The age of the " +
        "reading could not be established and nothing was rendered. The forms " +
        'accepted are the ones RelativeTime accepts: "2026-03-14T08:12:00+01:00", ' +
        '"2026-03-14 08:12:00+0100" and "2026-03-14T07:12:00Z". A tile carries ' +
        "three claims: the value, the unit and the time. It has no room to " +
        "explain a missing one, so it renders none of them rather than a number " +
        "a reader would take for today's.",
    )
    return null
  }

  /* An unknown category is reported and dropped rather than approximated. A
     `text-category-cycle-ink` class generates no CSS, so the tile would come out
     untinted with nothing saying why. There is no seventh ramp to fall
     back on. Untinted is honest; a borrowed tint is not. */
  const tinted: HealthCategory | undefined = isHealthCategory(category)
    ? category
    : undefined
  if (category !== undefined && tinted === undefined) {
    warnOnce("OPSIN-0010", {
      category: String(category),
      known: HEALTH_CATEGORIES.join(", "),
    })
  }

  /* THE VERDICT, AND WHY IT IS COMPUTED HERE AS WELL AS INSIDE RelativeTime.
     The muted treatment belongs to the whole tile and RelativeTime cannot reach
     the whole tile, so the tile has to know. The three branches are the same
     three RelativeTime uses, in the same order, on purpose: inside the
     boundary, past it, or the question could not be answered. The third
     hedges rather than falls silent, because a product that asked for a
     threshold and was told nothing never finds out it was told nothing.

     THE COMPARISON IS RelativeTime's, CHARACTER FOR CHARACTER, and that is not
     a stylistic choice. Dividing the elapsed milliseconds into hours and
     comparing those is not the same expression in floating point as comparing
     milliseconds against hours multiplied out, and the two disagree on
     boundary-adjacent readings with a fractional-hour threshold. They always
     disagree in the direction where the words say the reading may be out of
     date and the tile is not muted, which is the one combination
     uncertainty-and-staleness forbids. So the elapsed count stays in
     milliseconds and the threshold is multiplied out, exactly as
     relative-time.tsx does it.

     The duplication is still real: RelativeTime does not publish its verdict,
     and a component cannot read another component's internals. Reported upward
     rather than worked around. The alternative would mute from a descendant's
     `data-slot` with `:has()`, which makes a safety treatment depend on a
     selector no gate checks and no test would catch losing.

     A TILE WITH NO READING HAS NOTHING TO AGE. Staleness is gated on
     `hasReading`, not on whether an instant could be parsed, so an absent tile
     takes no muted treatment. Beside an absence `taken` is null by design and
     `elapsedMs` is null with it, and the middle branch reads a null elapsed as
     stale; without this gate a legal `measuredAt={null}` plus any
     `staleAfterHours` would mute the label and the category icon while the time
     line that carries the reason is not rendered, leaving the colour change as
     the sole and unexplained signal. There is no reading to be old and no words
     to explain an oldness, so there is no treatment. */
  const reference = instantOf(now)
  const elapsedMs =
    reference === null || taken === null ? null : reference - taken
  const stale =
    staleAfterHours === undefined || !hasReading
      ? false
      : !(Number.isFinite(staleAfterHours) && staleAfterHours >= 0) ||
          elapsedMs === null
        ? true
        : elapsedMs > staleAfterHours * HOUR_MS

  const tint = tinted === undefined ? undefined : TINT[tinted]

  const body = (
    <Surface
      rung="card"
      /* PADDING AND SHAPE ON THE SURFACE ROOT, RHYTHM ON THE PARTS. The root is
         not a layout box for this component's content: it holds four layers,
         three of them absolutely positioned, and the content lives inside
         `surface-content`. A flex column here would lay out the BACKDROP and
         the SCRIM, not the label and the reading. So the gaps between the
         parts are margins the parts carry, which is the same answer Card
         arrived at. `h-full` is what makes the material reach the bottom of a
         root the target floor is holding open.

         NO STALE TREATMENT HERE. It used to be one class on this root; the
         reason it moved onto the parts is written where MUTED is declared, and
         the short version is that the pill inherited it.

         `p-4` is the density-scaled step and not `p-opsin-4`. app/product.css
         names the inside of a box as the canonical use of the scaled scale, so
         a reader who has asked for a denser interface gets a tighter tile here,
         the way Card and ResultCard already do. At the default density it
         still renders 16px, so the reading is unchanged; only the response to
         `[data-density]` changes. The gaps between the parts stay fixed steps
         and do not close up. */
      className="h-full rounded-[inherit] p-4"
    >
      <div
        data-slot="metric-tile-header"
        className="flex items-center gap-opsin-2"
      >
        {icon === undefined ? null : (
          <span
            data-slot="metric-tile-icon"
            data-category={tinted}
            /* Decorative, always. The label beside it carries the subject in
               words, and an announced glyph would say it twice. */
            aria-hidden="true"
            className={cn(
              /* Sized in `em` so the glyph grows with the label rather than
                 staying put while the words around it get larger. */
              "inline-flex shrink-0 items-center [&_svg]:size-[1em]",
              /* One or the other, never both: past the boundary the identity
                 tint gives way to the muted treatment, and the label beside it
                 still carries the identity in words. */
              stale ? MUTED : tint,
            )}
          >
            {icon}
          </span>
        )}
        {/* CONCATENATION, NOT `cn`, AND IT IS NOT A STYLE PREFERENCE.
            `tailwind-merge` cannot tell `text-opsin-subheadline` (a step from
            the theme's own type ramp) from `text-category-heart-ink` (a
            colour): both are `text-*` with a key it does not know, so it files
            them under one property and silently drops the earlier one, and the
            label loses its type size. The two declarations set different CSS
            properties and do not conflict, so joining them is correct. The
            merge is what would be wrong. Verified in range-bar, which hit the
            same edge first. */}
        <span
          data-slot="metric-tile-label"
          data-category={tinted}
          className={
            "text-opsin-subheadline" +
            (stale ? " " + MUTED : tint === undefined ? "" : " " + tint) +
            /* The hover and focus-visible underline is the pointer's answer, and
               it is declared as its own class rather than through `cn` for the
               reason the label already uses concatenation: `text-decoration` is
               a different property from the type step and the tint, so the three
               never share a `tailwind-merge` conflict group. The `group/tile`
               these variants name lives only on the link anchor, so a static
               tile carries these classes inertly and never underlines. */
            " group-hover/tile:underline group-focus-visible/tile:underline"
          }
        >
          {label}
        </span>
        {/* THE RESTING AFFORDANCE, AND IT IS ONLY ON THE LINK. A trailing
            chevron pinned to the end of the header row is the one cue the whole
            audience reads with no pointer and no keyboard: a person scanning a
            list on a phone can tell a tappable tile from a static one before
            touching anything, and it survives touch, dark theme, greyscale and
            print. `ml-auto` pushes it to the trailing edge and `shrink-0` keeps
            it there when the label wraps. It is `aria-hidden` because the
            anchor's accessible name is already the whole tile's text, so an
            announced glyph would only repeat it. `size-[1em]` grows with the
            label, and `text-muted-foreground` keeps it clear of both colour
            axes. The hover and focus-visible underline on the label, declared
            through `group/tile` on the anchor, is the addition that answers the
            pointer; the chevron is not the only signal. The static tile gets
            none of this, because it leads nowhere. */}
        {href === undefined ? null : (
          <ChevronRight
            data-slot="metric-tile-affordance"
            aria-hidden="true"
            className="ml-auto size-[1em] shrink-0 text-muted-foreground"
          />
        )}
      </div>

      {/* `cn` is safe here and concatenation is not needed: RHYTHM is a margin
          and the muted class is a colour, so the two cannot land in one
          conflict group. Value sets no colour of its own, so the number and the
          unit take this one. */}
      <div data-slot="metric-tile-reading" className={cn(RHYTHM, stale && MUTED)}>
        {/* The comma is the whole reason this span exists. A link takes its
            accessible name from its content, and the parts concatenate with
            spaces. So without punctuation a tile announces as a run of
            fragments rather than as the sentence the specification asks for.
            With it, and with a status and a locale that spells dates this way:
            "Example measurement, 14 steps, Measured 3 hours ago, on 6 April
            2026 at 06:00 UTC, Watch". The level is last, after the instant it
            qualifies, per D8. */}
        <span className="sr-only">, </span>
        <Value
          value={value}
          unit={unit}
          precision={precision}
          locale={locale}
          /* The reading is the largest thing on the tile, by contract. `display`
             is the only size that satisfies it and it is set here rather than
             exposed as a prop, because a tile whose number is not the biggest
             element on it is a composition error rather than a variant.

             That contract holds for a reading and is deliberately not held for
             an absence. `value.tsx` decides the absence branch: at `size="display"`
             a real reading is the `title1` hero, but a null value drops to the
             `headline` step in the muted role, so the loudest thing on a
             dashboard is never the reading that is missing. The size stays
             `display` because Value, not this tile, chooses what an absent
             reading weighs, which is why a reader of this file meets a quieter
             absence under a comment that promises the largest element. */
          size="display"
        />
      </div>

      {/* By the guard near the top, a reading always has a locatable time, so
          `measuredAt` is non-null in this branch; naming it in the condition is
          what narrows the type. The absence state fell out at `hasReading` and
          renders no time line at all. */}
      {hasReading && measuredAt !== null ? (
        <div
          data-slot="metric-tile-time"
          className={cn(RHYTHM, "text-opsin-footnote")}
        >
          <span className="sr-only">, </span>
          <RelativeTime
            at={measuredAt}
            /* Named, never inferred. `event` says which moment the time belongs
               to, defaulting to `measured`, which is when a reading was taken as
               opposed to `recorded`, `received`, `synced` or `issued`. The
               difference between those is the difference between a fact about a
               person and a fact about a network, so the product names the one
               that is true rather than the component guessing.

               WHAT THIS TILE STILL CANNOT TELL YOU, stated here because it is
               asserted here. The five events name the moment, not the origin of
               the number, and this component cannot check that the word matches
               how the figure was obtained: a self-reported or a device-estimated
               value routed through here with `event="measured"` is still
               announced as a measurement. Data provenance and device accuracy
               asks for the provenance class to be shown in plain words; this
               component does not carry it, the page records that as an open gap
               rather than leaving it silent, and a product must not lean on the
               event word to stand in for a provenance it has not shown. */
            event={event}
            now={now}
            staleAfterHours={staleAfterHours}
            locale={locale}
            timeZone={timeZone}
            showOffset={showOffset}
          />
        </div>
      ) : null}

      {/* THE LEVEL IS LAST, AFTER THE INSTANT IT QUALIFIES. D8 fixes placement
          in reading order: the subject first, then any timestamp for that
          subject, then the level, and it names ResultCard's name, time, level
          order as the model. So the pill sits below the time line and closes the
          reading order rather than splitting the subject from its instant. */}
      {status === undefined ? null : (
        <>
          <span className="sr-only">, </span>
          {/* `describes` ON THE STATIC TILE AND NOT ON THE LINKED ONE, and the
              difference is the accessible name. With an `href` the tile is one
              object whose name concatenates its content, so the label above is
              already the pill's subject and passing it again would make the tile
              announce its subject twice. With no `href` there is no such object:
              the pill is read on its own in the reading order, and StatusPill's
              own documentation says that without `describes` a screen-reader user
              hears a level with no subject. No `size`, so the pill takes
              StatusPill's `md` default and its word is footnote rather than
              caption1. A status word is never set at the type scale's floor,
              which type-scale.mdx reserves for axis labels, legends and legal
              text; the tile's hierarchy is carried by the display-size reading
              above it, not by shrinking the level.

              The rhythm goes through `className` rather than a wrapper. The
              pill is `inline-flex`, which is an atomic inline-level box and
              takes a top margin, and a wrapper here would be an element with no
              part behind it. */}
          <StatusPill
            status={status}
            describes={href === undefined ? label : undefined}
            className={RHYTHM}
          />
        </>
      )}
    </Surface>
  )

  const shell = cn(
    /* `grid` rather than `block` is what makes the Surface fill a root the
       target floor is holding open; a single grid item stretches on both axes.
       As `block` the material would be content-sized inside a taller root and
       the boundary would stop short of the focus ring drawn around all of it. */
    "grid",
    SHAPE,
    PRINT_BOUNDARY,
    className,
  )

  if (href === undefined) {
    return (
      <div data-slot="metric-tile" className={shell}>
        {body}
      </div>
    )
  }

  /* ONE CONTROL, AND NOTHING NESTED INSIDE IT. The whole tile is the target,
     which is what makes the 44pt floor reachable on a tile whose visible
     content is a short label and a number.

     Both axes carry the floor, and the token is a rem so it grows when a
     reader raises their text size instead of pinning at 44 device pixels. A
     tile is usually wider than the floor; a tile dropped into a narrow grid
     column is not, and a floor that holds on one axis is not a floor. The
     fallback is in the class because `--opsin-target-minimum` is declared in
     app/tokens.generated.css, which does not travel with this file into
     somebody else's project.

     The focus ring is declared here rather than left to the product
     stylesheet for the same reason: a tile whose focus ring depends on a file
     it was not installed with is a tile that loses it silently. The press cue
     is declared here on the same principle. `active:translate-y-px` is the
     transform Button uses, and it is the one acknowledgement touch can show:
     a tile installed without app/product.css has no state fill to fall back
     on, so without this line a one-handed tap on a phone would register no
     change at all and read as lag. */
  const linkClassName = cn(
    /* `group/tile` is NAMED rather than the bare `group`, and that is not
       cosmetic: an unnamed `group-*` variant matches any ancestor carrying
       `.group`, and `group` is one of the most common class names in a
       consumer's layout, so a bare group here would make the label underline
       whenever some outer wrapper was hovered. `group/tile` matches only
       this anchor, and it is what lets the label answer the pointer without
       the label knowing it sits inside a link. */
    "group/tile",
    "min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem)",
    "text-inherit no-underline",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "active:translate-y-px",
    shell,
  )

  /* THE PRODUCT'S ROUTER ELEMENT, IF IT PASSED ONE, ELSE A PLAIN ANCHOR. The
     merge follows Link's `render` slot: the tile's own attributes win over the
     router element's and the two class lists are joined so neither deletes the
     other, while `cloneElement` puts the tile body inside the router element so
     the whole tile stays one target and one object. The tile keeps its own
     anchor rather than delegating to Link, for the reason the prop's JSDoc
     gives: this element is the tile, not a control inside it. */
  if (render && isValidElement(render)) {
    const renderClassName = (render.props as { className?: string }).className
    return cloneElement(
      render as ReactElement<Record<string, unknown>>,
      {
        href,
        "data-slot": "metric-tile",
        className: cn(renderClassName, linkClassName),
      },
      body,
    )
  }

  return (
    <a href={href} data-slot="metric-tile" className={linkClassName}>
      {body}
    </a>
  )
}

/**
 * The instant the demo is measured against.
 *
 * A literal rather than a clock read. `now` is required of every caller, so a
 * demo that quietly read the clock would be documenting a different component.
 * A fixed instant is what makes this deterministic, so one screenshot is
 * comparable with the last.
 */
const DEMO_NOW = "2026-04-06T09:00:00+00:00"

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows two tiles because the pair
 * is the thing worth seeing: one with a reading and one with none at all. The
 * second is the state most often got wrong. An absent reading is not a reading
 * of zero, so it says so in words rather than printing a 0 a reader would take
 * for a measurement somebody took.
 *
 * NEITHER TILE CARRIES A STALENESS NUMBER OF ITS OWN. `staleAfterHours` is
 * absent here on purpose: a number in the file `shadcn add` copies is a
 * staleness default shipped verbatim into every repository that installs this
 * component, and no comment beside it undoes that. The number is the part that
 * gets copied. The cost is stated rather than hidden: the tile's one visual
 * state is demonstrated by the example beside this component's page and not by
 * the demo, and the page says so in the same words.
 *
 * The measurements are fictional and the unit is one nobody holds a range for
 * (ADR 0012). No number here is one a reader could take for their own.
 */
export default function MetricTileDemo() {
  return (
    // Both tiles fix `locale="en-GB"` so this reference capture spells the date
    // day-first, the order the content page mandates. The prop is optional and a
    // product passes its own BCP 47 tag; it is set here only so the screenshot
    // does not teach a month-first order the docs reject.
    <div className="grid w-full max-w-md gap-opsin-3 sm:grid-cols-2">
      <MetricTile
        label="First example measurement"
        value={14}
        unit="steps"
        precision={0}
        category="activity"
        status="steady"
        measuredAt="2026-04-06T07:30:00+00:00"
        now={DEMO_NOW}
        locale="en-GB"
        href="#example"
      />
      <MetricTile
        label="Second example measurement"
        value={null}
        unit="steps"
        precision={0}
        category="activity"
        measuredAt={null}
        now={DEMO_NOW}
        locale="en-GB"
        href="#example"
      />
    </div>
  )
}
