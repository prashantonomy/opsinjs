/**
 * Value — one number, its unit, and nothing else.
 *
 * The smallest component in the system and the one with the widest blast
 * radius. Every number a reader sees passes through it, so a formatting
 * decision made here is made everywhere — and so is a formatting bug.
 *
 * WHAT IT ASSERTS, and it is a short list on purpose: that this quantity has
 * this magnitude in this unit, to this many decimal places. It carries no
 * status, no colour, no band and no judgement. There is no `status` prop, no
 * `color` prop and no `variant` prop, and adding one would put the two colour
 * axes into the smallest and most-repeated element in the system, where nobody
 * could police them. A number that has to look different because of what it is
 * worth belongs inside a component that owns that verdict.
 *
 * THE ONE THING IT DOES THAT NOTHING ELSE DOES is put the unit into the
 * accessibility tree in words. `mmHg` has no pronunciation; a screen reader
 * handed it improvises, and "one twenty over eighty em em aitch gee" is a
 * failure rather than a quirk. The spoken forms live in `tokens/units.json`
 * and reach this file through the generated table in `@/lib/opsinjs`, so a
 * unit is spoken the same way in every component that renders one.
 *
 * PRECISION MEANS DECIMAL PLACES, everywhere in opsinjs, and this file is
 * where that was settled. The alternative reading — significant figures —
 * makes the same metric show a different number of decimal places at different
 * magnitudes, which is exactly what `health/numbers-units-precision` rule 2
 * forbids: "the same metric is shown to the same number of decimal places
 * every time, so a reader can compare two readings at a glance". Decimal
 * places are also what an instrument's resolution actually is: a scale reads
 * to 100 g whatever is standing on it, light or heavy.
 *
 * AND IT HAS NO DEFAULT PRECISION TO FALL BACK ON. `precision` travels with
 * the MEASUREMENT, from the product. The unit table deliberately carries none,
 * because one unit serves many metrics — glucose and cholesterol are both
 * reported in mmol/L and do not share a number of decimal places — so a
 * per-unit default would be wrong for one of them on every screen. Omit it and
 * this component rounds nothing and pads nothing: the digits it was handed are
 * the digits it shows. That is louder than a guess, and it is meant to be.
 *
 * NOTHING HERE ANIMATES. Not on first paint, not on a change. A number that
 * counts up has displayed, for every frame of the count, a figure that is not
 * true.
 */

import {
  findUnit,
  isDevelopment,
  spokenUnit,
  warnOnce,
} from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The ceiling `Intl.NumberFormat` accepts for fraction digits.
 *
 * Used as `maximumFractionDigits` when no `precision` was supplied, which is
 * how "show the digits you were handed" is expressed to a formatter whose own
 * default is to round silently at three. Rounding a reader's measurement
 * because nobody said how precise it was is the failure this constant exists
 * to prevent.
 */
const MAX_FRACTION_DIGITS = 20

/**
 * Which development warnings this session has already printed.
 *
 * Declared rather than created, the way `warnOnce` does it in the substrate: in
 * a production bundle `isDevelopment()` is statically false, every body that
 * touches this is dead code, and the set is never allocated. In development it
 * exists for the session, which is what "once" means — a column of thirty
 * readings with no `precision` prints one warning rather than thirty.
 *
 * It is not `warnOnce` itself because none of the five complaints below has an
 * OPSIN code. That table is generated from `tokens/errors.json` and allocating
 * a code in it is not this component's to do; the omission is reported upward
 * instead. The channel and the wording are the same either way. The one
 * complaint that does have a code — OPSIN-0003, a reading with no unit — goes
 * through `warnOnce` and not through here.
 *
 * EVERY KEY NAMES THE MISTAKE, NEVER THE READING. That is exactly the
 * identity/payload split `warnOnce` makes, and for the same reason: keying on
 * the value turns "warn once" into "warn every render", because the next tile
 * in the column carries a different number and the same defect. So the
 * unstated-precision key is the unit and the count of unasked-for digits, the
 * unknown-unit key is the unit as written, the out-of-range-precision key is
 * the precision as written, and the empty-`absenceLabel` key is a constant,
 * that complaint having only one shape. The broken-value key is the only one
 * that carries the value, and it can: a value reaches that branch only when it
 * is not finite, so the key ranges over NaN and the two infinities and cannot
 * grow with the data.
 *
 * Every one of these lives in a render body, so without the set they print on
 * every render and twice again under Strict Mode — and a console an author
 * filters is a channel that no longer carries its one real finding.
 */
let warnedDev: Set<string> | undefined

function warnDevOnce(key: string, message: string): void {
  if (warnedDev?.has(key) === true) return
  warnedDev ??= new Set<string>()
  warnedDev.add(key)
  console.warn(message)
}

/**
 * Visual weight, and only visual weight.
 *
 * Written out rather than built from the prop, because Tailwind reads class
 * names out of source as literal strings: `text-opsin-${size}` generates no CSS
 * at all and the number renders unstyled.
 *
 * `inherit` adds nothing — the value takes the size, weight and family of the
 * sentence it sits in, which is what an inline reading should do. `display`
 * is the hero treatment, and it is the only place the numeric family is asked
 * for by name: a number set apart from running text is its own typographic
 * object, while a number inside a sentence that changed family mid-line would
 * read as a mistake.
 */
const ROOT_SIZE: Record<"inherit" | "display", string> = {
  inherit: "",
  display: "font-opsin-numeric text-opsin-title1",
}

/**
 * The unit's own type treatment, one step down from the number at `display`.
 *
 * The unit is the annotation and the magnitude is the message, so the symbol
 * is smaller and a little lighter — 600 against 700 — rather than competing
 * with the digits for the reader's eye.
 */
const UNIT_SIZE: Record<"inherit" | "display", string> = {
  inherit: "",
  display: "text-opsin-title3",
}

export interface ValueProps {
  /**
   * The reading. `null` renders the absence form and is never rendered as 0:
   * zero is a real measurement for several metrics, and a missing one is not a
   * measurement at all.
   */
  value: number | null
  /**
   * Display symbol, exactly as `tokens/units.json` spells it — "kg", "mmol/L",
   * "°C". The spoken form is resolved from that table, so this is the only
   * place a unit is named. A symbol the table does not hold is rendered as
   * written rather than pronounced by guesswork.
   */
  unit?: string
  /**
   * Decimal places, from the precision of the MEASUREMENT — the resolution of
   * the device, or the number of places the laboratory reported. Never chosen
   * at render time to make a column line up.
   *
   * Omitted, the component rounds nothing and pads nothing. There is no
   * per-unit default to fall back on, deliberately: precision is a property of
   * the metric and not of the unit, and two metrics reported in the same unit
   * do not share one.
   */
  precision?: number
  /**
   * BCP 47 locale for separators and digit shaping. Distinct from `unit`:
   * locale decides how a number is written, unit systems decide which number.
   * Omitted, the reader's own environment decides.
   */
  locale?: string
  /**
   * What the absence form says when there is no reading — "no reading yet" by
   * default. It replaces the words, never the em dash, and it is not used for
   * a number that arrived broken, which is a different thing and says so.
   *
   * An empty string falls back to the default and reports itself: an em dash
   * with no words beside it is banned outright, because speech synthesis either
   * skips it or reads it out as "dash".
   */
  absenceLabel?: string
  /** Visual weight. Never changes the value, the precision or the unit. */
  size?: "inherit" | "display"
  /**
   * Merged onto the root with `tailwind-merge`, and a class you pass WINS over
   * the component's own where the two conflict. `cn("inline tabular-nums", …,
   * className)` puts yours last and `twMerge` keeps the later of a conflicting
   * pair — verified: `twMerge("inline tabular-nums", "block truncate")` returns
   * `"tabular-nums block truncate"`.
   *
   * That includes `truncate` and any fixed height. This component never shortens
   * a number on its own and sets no ellipsis and no height; passing a class that
   * does is the one way to make a reading come back to somebody with digits
   * missing off the end.
   */
  className?: string
}

export function Value({
  value,
  unit,
  precision,
  locale,
  absenceLabel,
  size = "inherit",
  className,
}: ValueProps) {
  /* THE THREE STATES, and keeping them three is the whole of the null handling.
     `0 steps` is a measurement. "No reading yet" is an absence. "Not available"
     is a failure. `health/numbers-units-precision` rule 13 names all three and
     says never to collapse them, and collapsing the last two is the tempting
     one: a reader told "no reading yet" about a number that DID exist and
     arrived broken has been told something untrue about their own record. */
  const broken = value !== null && !Number.isFinite(value)

  /* Narrowed to a real reading, so nothing below has to assert its way past
     the type. A value outside the finite range can only have come from a
     caller's pipeline — a parse that produced nothing, a division with no
     divisor — and this file ships as source into JavaScript projects where
     `number | null` is advice rather than a guarantee. Rendering the literal
     text "NaN" beside somebody's own measurements is not an option, and
     neither is quietly calling it an absence. */
  const reading: number | null = value === null || broken ? null : value

  if (broken && isDevelopment()) {
    console.warn(
      `[opsinjs] <Value> received ${String(value)}, which is not a finite number. ` +
        'The words "not available" were rendered in its place, because a broken ' +
        "number is a failure rather than a reading that was never taken, and the " +
        "reader is entitled to know which of the two happened. Check where the " +
        "value is produced.",
    )
  }

  /* OPSIN-0003. The same digits are one reading in mmol/L and a very different
     one in mg/dL, and nothing on the surface tells the reader which was meant. */
  if (reading !== null && unit === undefined) {
    warnOnce("OPSIN-0003", { value: String(reading) })
  }

  if (unit !== undefined && findUnit(unit) === undefined && isDevelopment()) {
    console.warn(
      `[opsinjs] <Value> was given the unit "${unit}", which is not in the unit ` +
        "table. It has been rendered as written and has NOT been given a spoken " +
        'form, because guessing at a pronunciation is how "mmHg" becomes "em em ' +
        'aitch gee". Add the unit — its symbol, its spoken form and its plural — ' +
        "to tokens/units.json and run `pnpm run generate`.",
    )
  }

  /* `Intl.NumberFormat` throws a RangeError outside 0 to 100, and a component
     that takes a health product down over a documentation-quality mistake is a
     worse defect than the mistake. Reported and ignored, which leaves the
     honest fallback: the digits as supplied. */
  const usable =
    precision === undefined ||
    (Number.isInteger(precision) && precision >= 0 && precision <= MAX_FRACTION_DIGITS)
  if (!usable && isDevelopment()) {
    console.warn(
      `[opsinjs] <Value> received precision={${String(precision)}}. Precision is a ` +
        `count of decimal places: a whole number from 0 to ${MAX_FRACTION_DIGITS}. ` +
        "It was ignored, so the number below is showing exactly the digits it was " +
        "handed rather than a precision nobody asked for.",
    )
  }
  const places = usable ? precision : undefined

  /* An empty `absenceLabel` is the only way this component can be made to
     render an em dash with nothing beside it, and `numbers-units-precision`
     rule 13 bans exactly that: "never render an absence as `0` or as an em dash
     with no explanation". Falling back to the default wording is the honest
     repair — a lone dash is either skipped by speech synthesis or read out as
     "dash", so a reader who is listening is told nothing at all. */
  const emptyLabel = absenceLabel !== undefined && absenceLabel.trim() === ""
  if (emptyLabel && isDevelopment()) {
    console.warn(
      "[opsinjs] <Value> received absenceLabel=\"\", which would render an em dash " +
        'with no words. The default wording was used instead. An absence is said in ' +
        "words, and the words are the part a screen reader can hear.",
    )
  }
  const absenceWords =
    absenceLabel !== undefined && !emptyLabel ? absenceLabel : "no reading yet"

  /* Rounding is `halfExpand` — round-half-away-from-zero, which is
     `numbers-units-precision` rule 3. It is INHERITED rather than named, and
     that is a portability decision rather than a preference: `roundingMode` is
     an ES2023 addition to `Intl.NumberFormatOptions`, so writing it out made
     this file fail to typecheck in any consumer whose `lib` stops at ES2022 —
     found by installing it into one. `halfExpand` is this formatter's own
     default, so the behaviour is identical and only the documentation moved,
     which is where it now is. Rounded ONCE, here, at the point of display —
     never before a comparison, and never over an already-rounded value.

     With no `places`, `maximumFractionDigits` is opened all the way rather than
     left at the formatter's default of three, which would round a reader's
     measurement because nobody had said how precise it was. */
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: places,
    maximumFractionDigits: places ?? MAX_FRACTION_DIGITS,
  })
  const formatted = reading === null ? "" : formatter.format(reading)

  /* THE SILENT CASE, MADE AUDIBLE. Opening `maximumFractionDigits` all the way
     is right for a measurement whose resolution nobody stated, and it stops
     being right the moment the number arrived from arithmetic rather than from
     an instrument: every IEEE-754 double holds `0.1 + 0.2` as
     0.30000000000000004, and seventeen digits printed beside somebody's own
     readings assert an accuracy no device has. The specification calls the long
     float "a visible prompt to go and find out what the measurement's
     resolution actually is", and a prompt nobody is told about is not one.

     The test is exact rather than a guess at how many digits are too many: ask
     the formatter whether it is about to print a fraction the caller never
     asked for. `formatToParts` rather than a regular expression on the string,
     because `\d` matches only ASCII and a locale with its own digit shapes
     would come back empty — the same trap the plural rule below avoids.

     Development only, and it stays a warning. `precision` remains optional and
     no default is invented: precision belongs to the metric rather than to the
     unit, so there is no honest number for this file to fall back on. */
  if (places === undefined && reading !== null && isDevelopment()) {
    const fraction = formatter
      .formatToParts(reading)
      .find((part) => part.type === "fraction")
    const key = `${unit ?? ""}:${String(fraction?.value.length ?? 0)}`
    if (fraction !== undefined && !warnedUnstatedPrecision?.has(key)) {
      warnedUnstatedPrecision ??= new Set<string>()
      warnedUnstatedPrecision.add(key)
      console.warn(
        `[opsinjs] <Value> is showing ${String(fraction.value.length)} decimal ` +
          `places and was given no \`precision\` to show them to: "${formatted}". ` +
          "With no precision this component rounds nothing and pads nothing, so " +
          "the digits are whatever the double happened to hold rather than what " +
          "anybody measured. Pass the precision the measurement was reported to " +
          "— the resolution of the device, or the number of places the laboratory " +
          "gave. There is deliberately no default to fall back on: precision is a " +
          "property of the metric and not of the unit, so nothing here can supply " +
          "one for you.",
      )
    }
  }

  /* THE PLURAL FOLLOWS WHAT IS ON THE SCREEN, and it is decided by asking the
     same formatter what one looks like rather than by inspecting the number or
     the string. Parsing the digits back out would be wrong twice over: `\d`
     matches only ASCII, so a locale with its own digit shapes would come back
     empty, and a locale that groups with a full stop would come back as a
     different number entirely. Comparing against `format(1)` is exact in every
     locale, and it also settles the "1.0" case — a reading shown to one decimal
     place matches `format(1)`, which is "1.0", and is spoken in the singular. */
  const singular =
    reading !== null && (formatted === formatter.format(1) || formatted === formatter.format(-1))
  const spoken =
    reading === null || unit === undefined
      ? undefined
      : spokenUnit(unit, singular ? 1 : reading)

  return (
    <span
      data-slot="value"
      /* The machine-readable reading, unrounded, because rounding is a display
         decision and whatever reads this attribute wants the datum. Empty for
         both non-states: there is no number to publish for a reading that was
         never taken, and none for one that did not survive the trip. The
         product theme also hangs tabular figures off the attribute's presence,
         which is why it sits on the wrapper holding both parts rather than on
         the digits alone.

         IT IS A MAGNITUDE, AND A MAGNITUDE IS NOT A READING. Nothing beside it
         says what the number is measured in, which is precisely the ambiguity
         OPSIN-0003 fires about a few lines above: the same digits are one
         reading in mmol/L and a very different one in mg/dL. Whatever reads
         this attribute must take the unit from the same place the caller did,
         and must never export, share or print what it finds here on its own. A
         companion `data-opsinjs-unit` would close that, and the attribute
         vocabulary is fixed at four by the substrate contract — a fifth is a
         contract edit rather than this file's to make. Reported upward.

         IT ALSO CANNOT TELL THE TWO NON-STATES APART. The contract specifies ""
         for `null` and says nothing about a number that arrived broken, so both
         land on "". The visible words do keep them apart, which is where it
         matters most; a machine reading the DOM cannot. Also reported upward. */
      data-opsinjs-value={reading === null ? "" : String(reading)}
      className={cn(
        /* `tabular-nums` is set here as well as by the theme, and the
           duplication is deliberate: `[data-opsinjs-value]` is a rule in
           app/product.css, which does not travel with `shadcn add`. Without
           this class an installed Value in somebody else's project would
           re-kern every time a digit changed, and a reading that shifts sideways
           as it updates is a reading that looks like it is moving. */
        "inline tabular-nums",
        ROOT_SIZE[size],
        className
      )}
    >
      {reading === null ? (
        <span data-slot="value-absence">
          {/* Decorative, and hidden for the reason the specification gives: a
              punctuation mark is either skipped by speech synthesis or read out
              as "dash", and neither of those is the message. The words beside it
              are the message, and they are visible as well as spoken —
              `numbers-units-precision` rule 13 bans an em dash with no
              explanation, not an em dash. */}
          <span aria-hidden="true">—</span>{" "}
          {broken ? "not available" : absenceWords}
        </span>
      ) : (
        <>
          <span data-slot="value-number">{formatted}</span>
          {unit === undefined ? null : (
            <>
              {/* A no-break space, not a CSS rule. It keeps the number and its
                  unit on one line through copy, paste, print and a reader's own
                  text size, and it does it without `whitespace-nowrap`, which
                  would stop the phrase wrapping at 200% text in a narrow column
                  and push the page sideways instead. */}
              {"\u00A0"}
              <span
                data-slot="value-unit"
                /* Hidden only when there is a spoken form to hear instead. With
                   no entry in the unit table the symbol stays in the
                   accessibility tree: awkward to listen to, and true. */
                aria-hidden={spoken === undefined ? undefined : "true"}
                /* `undefined` rather than an empty string, so an inline value
                   does not ship a `class=""` attribute on every unit in the
                   product. */
                className={UNIT_SIZE[size] || undefined}
              >
                {unit}
              </span>
              {/* The unit in words, adjacent to the digits so the two are one
                  phrase. A screen reader must hear "1000.2 kilograms", not
                  "1000.2" and then, some distance later, "kg".

                  IT IS A NAMED PART, not an anonymous span. `data-slot` is the
                  whole DOM contract in this system, and this element carries the
                  entire accessibility payload: a consumer whose surrounding
                  sentence already says the unit needs something to select in
                  order to suppress it, and a test asserting the substitution
                  happened needs something to find. It is in the page's anatomy
                  and composition tree alongside the other four.

                  THE CONSTRAINT THIS CREATES, stated rather than left to be
                  discovered. The visible text is "kg" and the accessible text is
                  "kilograms", and the two share no substring. WCAG 2.2 SC 2.5.3
                  asks that a control with a visible text label have that text in
                  its accessible name, so a Value must never be the only thing
                  naming a control: a product that makes a reading tappable owes
                  that control its own accessible name carrying the symbol as
                  written. The substitution stays, because the alternative — the
                  symbol spoken and the words dropped — is the failure this
                  component exists to prevent, on every surface rather than on
                  the few that are tappable. */}
              {spoken === undefined ? null : (
                <span data-slot="value-spoken" className="sr-only">
                  {" "}
                  {spoken}
                </span>
              )}
            </>
          )}
        </>
      )}
    </span>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the three states side by
 * side, because the distinction between them is the thing this component is
 * most often got wrong about: a missing reading is not zero, and a reading that
 * did not survive its journey is not a missing reading.
 *
 * The numbers are obviously unreal (ADR 0012), and the magnitude is chosen
 * rather than convenient: over a tonne is not a person, and a count of zero is
 * a count. An earlier draft of this demo used a two-digit weight in kilograms,
 * which is a plausible reading for a small child — and this file is one
 * `shadcn add` away from somebody else's project and one screenshot away from
 * outliving the page it was written for, so a number a reader could take for
 * their own is the one thing it must never ship. There is no reference range in
 * sight either; this component has never seen one and never will.
 */
export default function ValueDemo() {
  return (
    <div className="flex flex-col gap-opsin-3 text-opsin-body">
      {/* The same reading at both weights, so it is visible that `size` moves
          nothing but the type: same digits, same decimal place, same unit. */}
      <Value value={1000.2} unit="kg" precision={1} size="display" />
      <Value value={1000.2} unit="kg" precision={1} />
      {/* A reading of zero — a measurement that was taken and came to nothing. */}
      <Value value={0} unit="steps" precision={0} />
      {/* No reading at all, which is a different sentence and says so. */}
      <Value value={null} unit="steps" />
    </div>
  )
}
