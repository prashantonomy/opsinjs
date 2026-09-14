/**
 * Value is one number, its unit, and nothing else.
 *
 * The smallest component in the system and the one with the widest blast
 * radius. Every number a reader sees passes through it, so a formatting
 * decision made here is made everywhere. So is a formatting bug.
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
 * where that was settled. Significant figures are the alternative reading,
 * and they make the same metric show a different number of decimal places at
 * different magnitudes, which is exactly what `health/numbers-units-precision`
 * rule 2 forbids: "the same metric is shown to the same number of decimal
 * places every time, so a reader can compare two readings at a glance".
 * Decimal places are also what an instrument's resolution actually is: a scale
 * reads to 100 g whatever is standing on it, light or heavy.
 *
 * PRECISION IS REQUIRED, AND IT HAS NO DEFAULT TO FALL BACK ON. `precision`
 * travels with the MEASUREMENT, from the product, so `ValueProps` declares it
 * `precision: number` and a TypeScript caller cannot omit it. The omission is a
 * compile error rather than a runtime guess, which is where the doctrine's "no
 * default float rendering anywhere" belongs. The unit table deliberately
 * carries no default either, because one unit serves many metrics and a
 * per-unit default would be wrong for one of them on every screen. Glucose and
 * cholesterol are both reported in mmol/L and do not share a number of decimal
 * places. This file ships as source into JavaScript projects where a required
 * prop is advice rather than a guarantee, so a caller who omits it there still
 * reaches the runtime path below: this component rounds nothing and pads
 * nothing, the digits it was handed are the digits it shows, and it warns. That
 * is louder than a guess, and it is meant to be.
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
 * exists for the session, which is what "once" means. A column of thirty
 * readings with no `precision` prints one warning rather than thirty.
 *
 * It is not `warnOnce` itself because none of the seven complaints below has an
 * OPSIN code. That table is generated from `tokens/errors.json` and allocating
 * a code in it is not this component's to do; the omission is reported upward
 * instead. The channel and the wording are the same either way. The one
 * complaint that does have a code is OPSIN-0003, which fires for a reading
 * with no unit, and it goes through `warnOnce` rather than through here.
 *
 * EVERY KEY NAMES THE MISTAKE, NEVER THE READING. That is exactly the
 * identity/payload split `warnOnce` makes, and for the same reason: keying on
 * the value turns "warn once" into "warn every render", because the next tile
 * in the column carries a different number and the same defect. So the
 * unstated-precision key is the unit and the count of unasked-for digits, the
 * unknown-unit key is the unit as written, the out-of-range-precision key is
 * the precision as written, and the empty-`absenceLabel` key is a constant,
 * that complaint having only one shape. The spoken-without-unit key is a
 * constant for the same reason, that complaint too having only one shape. The
 * malformed-locale key is the tag as
 * written, which is the mistake, and it cannot grow with the data because a
 * product has one wrong setting rather than one per reading. The broken-value
 * key is the only one that carries the value, and it can: a value reaches that
 * branch only when it is not finite, so the key ranges over NaN and the two
 * infinities and cannot grow with the data.
 *
 * Every one of these lives in a render body, so without the set they print on
 * every render and twice again under Strict Mode. A console an author filters
 * is a channel that no longer carries its one real finding.
 */
let warnedDev: Set<string> | undefined

function warnDevOnce(key: string, message: string): void {
  if (warnedDev?.has(key) === true) return
  warnedDev ??= new Set<string>()
  warnedDev.add(key)
  console.warn(message)
}

/**
 * The caller's language tag, or `undefined` where it is not a language tag.
 *
 * `Intl` throws a `RangeError` on a malformed tag, and it throws it during
 * render. A component that takes a screen down because a locale arrived as
 * `"en_GB"` from a settings table has turned a cosmetic defect into an outage,
 * so the tag is checked once and the runtime's own default is used instead.
 * That is the same argument the `precision` range guard below makes, applied to
 * the other prop that can be written wrong.
 */
function usableLocale(locale: string | undefined): string | undefined {
  if (locale === undefined) return undefined
  try {
    Intl.getCanonicalLocales(locale)
    return locale
  } catch {
    if (isDevelopment()) {
      warnDevOnce(
        `malformed-locale:${locale}`,
        `[opsinjs] <Value> received locale="${locale}", which is not a BCP 47 ` +
          "language tag, so the number was formatted with the runtime's default " +
          'instead. A tag looks like "en-GB", with a hyphen.',
      )
    }
    return undefined
  }
}

/**
 * Whether the spoken form in the unit table is a language this reader's voice
 * will say correctly.
 *
 * `tokens/units.json` holds British English and nothing else. Substituting
 * "kilograms" for "kg" helps an English reader and hurts a Spanish one, whose
 * voice pronounces an English word with Spanish phonetics while the symbol it
 * could have spelled has been hidden. So the substitution happens only where
 * the words are in the reader's language. An absent `locale` keeps the
 * substitution, because "the reader's environment decides" is not a reason to
 * drop the one thing this component does that nothing else does.
 *
 * The language subtag is taken by splitting on the first hyphen rather than
 * through `Intl.Locale`, which would add an ES2020 lib requirement to a file
 * that ships as source into projects this repository does not control. The tag
 * has already been through `usableLocale`, so it parses.
 */
function speaksEnglish(locale: string | undefined): boolean {
  if (locale === undefined) return true
  return locale.split("-")[0].toLowerCase() === "en"
}

/**
 * Visual weight, and only visual weight.
 *
 * Written out rather than built from the prop, because Tailwind reads class
 * names out of source as literal strings: `text-opsin-${size}` generates no CSS
 * at all and the number renders unstyled.
 *
 * `inherit` adds nothing. The value takes the size, weight and family of the
 * sentence it sits in, which is what an inline reading should do. `display`
 * is the hero treatment, and it is the only place the numeric family is asked
 * for by name: a number set apart from running text is its own typographic
 * object, while a number inside a sentence that changed family mid-line would
 * read as a mistake.
 *
 * AN ABSENCE IS NEVER DRAWN AT THE WEIGHT OF A READING. When there is no
 * reading and `size` is `display`, the root drops the hero treatment and takes
 * `text-opsin-headline` in the muted role instead, so "no reading yet" is never
 * the largest and boldest text on a surface. `foundations/data-states` exists
 * so that a statement of not knowing is never drawn as an ordinary reading, and
 * an absence set at the same size and weight as a hero number is drawn as the
 * loudest reading on the screen, which is the opposite of what it is. This
 * matches ScoreDial, whose band name sits at the headline step when there is no
 * band to show. The `inherit` size is left as it is: an inline absence inside
 * running prose already takes the surrounding colour, and forcing it muted
 * would fade it below the sentence it sits in.
 */
const ROOT_SIZE: Record<"inherit" | "display", string> = {
  inherit: "",
  display: "font-opsin-numeric text-opsin-title1",
}

/**
 * The unit's own type treatment, one step down from the number at `display`.
 *
 * The unit is the annotation and the magnitude is the message, so the symbol
 * is smaller and a little lighter rather than competing with the digits for
 * the reader's eye. The weights are 600 against 700.
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
   * Display symbol, exactly as `tokens/units.json` spells it, such as "kg",
   * "mmol/L" or "°C". The spoken form is resolved from that table, so this is
   * the only place a unit is named. A symbol the table does not hold is
   * rendered as written rather than pronounced by guesswork.
   *
   * Three states, and they are distinct on purpose. `undefined` means nobody
   * said, which is the ambiguity OPSIN-0003 fires about: the same digits are one
   * reading in mmol/L and a very different one in mg/dL. `null` means this
   * number has no unit by design, which a composite score, a count already named
   * by its label, or a ratio all are, and it renders the digits alone and warns
   * about nothing. A string is the symbol.
   */
  unit?: string | null
  /**
   * Where the unit is shown. The default is `symbol`, which prints the symbol
   * beside the number and speaks the words in the accessibility tree, the form
   * every reading has always taken.
   *
   * `spoken` keeps the unit in the accessibility tree and takes it off the
   * screen, for the one case where the visible sentence already prints the unit
   * once for a pair of readings, as "10 to 20 mg/dL" does. A screen reader still
   * hears "10 milligrams per decilitre" so no reading is spoken bare. It is
   * never a way to render a number with no unit at all, which is what OPSIN-0003
   * exists to prevent, so it is meaningless without `unit` and reports itself
   * when it is asked for with none.
   */
  unitDisplay?: "symbol" | "spoken"
  /**
   * Decimal places, from the precision of the MEASUREMENT, which is the
   * resolution of the device, or the number of places the laboratory reported.
   * Never chosen at render time to make a column line up. A whole number from 0
   * to 20.
   *
   * Required, and required rather than defaulted on purpose. There is no
   * per-unit default to fall back on: precision is a property of the metric and
   * not of the unit, and two metrics reported in the same unit do not share one,
   * so the honest place for the number is the caller's, and the honest place for
   * the omission is a compile error. A TypeScript caller that forgets it does
   * not ship a raw double to a reader; it fails to build.
   *
   * The type is a guarantee only where TypeScript is enforced. This file ships
   * as source into JavaScript projects, where a required prop is advice, so a
   * caller who omits it there prints the digits the double happened to hold. The
   * component then rounds nothing and pads nothing and warns in development,
   * naming the unit and the count of unasked-for digits. The warning is the
   * honest signal, because there is no number this file could supply in place of
   * the one nobody stated.
   */
  precision: number
  /**
   * BCP 47 locale for separators and digit shaping. Distinct from `unit`:
   * locale decides how a number is written, unit systems decide which number.
   * Omitted on the client, the reader's own environment decides. Under server
   * rendering there is no reader's environment, so the server process's own
   * default formats the first paint. A de-DE reader then sees "1,000.2" before
   * hydration and "1.000,2" after it, with a React text mismatch in between,
   * and rule 10 of `health/numbers-units-precision` is about exactly that
   * confusion of separators being a hundredfold error. On any surface that
   * renders on a server, pass `locale` explicitly, from the request or from the
   * reader's stored setting. A tag `Intl` cannot parse,
   * such as "en_GB" with an underscore, is reported in development and ignored,
   * and the runtime's default formats the number, because a malformed setting
   * must not take a screen down.
   */
  locale?: string
  /**
   * What the absence form says when there is no reading. The default is "no
   * reading yet". It is not used for a number that arrived broken, which is a
   * different thing and says so in different words.
   *
   * An empty string falls back to the default and reports itself. The absence
   * form is words and nothing else, so an empty label would leave an empty
   * element where a reader expects to be told something.
   */
  absenceLabel?: string
  /** Visual weight. Never changes the value, the precision or the unit. */
  size?: "inherit" | "display"
  /**
   * Merged onto the root with `tailwind-merge`, and a class you pass WINS over
   * the component's own where the two conflict. `cn("inline tabular-nums", …,
   * className)` puts yours last and `twMerge` keeps the later of a conflicting
   * pair. That was verified: `twMerge("inline tabular-nums", "block truncate")`
   * returns `"tabular-nums block truncate"`.
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
  unitDisplay = "symbol",
  precision: declaredPrecision,
  locale,
  absenceLabel,
  size = "inherit",
  className,
}: ValueProps) {
  /* `precision` is required on `ValueProps`, so a TypeScript caller cannot omit
     it and cannot reach the unstated-precision path below. It is re-widened to
     `number | undefined` here for the one caller the type cannot reach: this
     file ships as source into JavaScript projects, where a required prop is
     advice rather than a guarantee, and a JS caller who omits it lands on
     `undefined`. Every guard below reads this local and keeps working
     unaltered, which is why the `precision === undefined` test that follows is
     live code rather than a branch the compiler has proved dead. */
  const precision: number | undefined = declaredPrecision

  /* THE THREE STATES, and keeping them three is the whole of the null handling.
     `0 steps` is a measurement. "No reading yet" is an absence. "Not available"
     is a failure. `health/numbers-units-precision` rule 13 names all three and
     says never to collapse them, and collapsing the last two is the tempting
     one: a reader told "no reading yet" about a number that DID exist and
     arrived broken has been told something untrue about their own record. */
  const broken = value !== null && !Number.isFinite(value)

  /* Narrowed to a real reading, so nothing below has to assert its way past
     the type. A value outside the finite range can only have come from a
     caller's pipeline, and this file ships as source into JavaScript projects
     where `number | null` is advice rather than a guarantee. A parse that
     produced nothing and a division with no divisor are two of the ways such a
     value arrives. Rendering the literal text "NaN" beside somebody's own
     measurements is not an option, and neither is quietly calling it an
     absence. */
  const reading: number | null = value === null || broken ? null : value

  if (broken && isDevelopment()) {
    warnDevOnce(
      `broken:${String(value)}`,
      `[opsinjs] <Value> received ${String(value)}, which is not a finite number. ` +
        'The words "not available" were rendered in its place, because a broken ' +
        "number is a failure rather than a reading that was never taken, and the " +
        "reader is entitled to know which of the two happened. Check where the " +
        "value is produced.",
    )
  }

  /* OPSIN-0003. The same digits are one reading in mmol/L and a very different
     one in mg/dL, and nothing on the surface tells the reader which was meant.
     It fires only for `undefined`, which is a unit nobody supplied. A `null`
     unit is a caller saying this number has no unit by design, and a deliberate
     absence is not the mistake this warning exists to catch. */
  if (reading !== null && unit === undefined) {
    warnOnce("OPSIN-0003", { value: String(reading) })
  }

  /* One lookup, read by the unknown-unit warning here and the separator below.
     A unit the table has never heard of returns `undefined` and so keeps its
     no-break space, which is the right default for something nobody declared. */
  const unitRow = unit == null ? undefined : findUnit(unit)

  if (unit != null && unitRow === undefined && isDevelopment()) {
    warnDevOnce(
      `unknown-unit:${unit}`,
      `[opsinjs] <Value> was given the unit "${unit}", which is not in the unit ` +
        "table. It has been rendered as written and has NOT been given a spoken " +
        'form, because guessing at a pronunciation is how "mmHg" becomes "em em ' +
        'aitch gee". Add the unit to tokens/units.json with its symbol, its ' +
        "spoken form and its plural, then run `pnpm run generate`.",
    )
  }

  /* `unitDisplay="spoken"` asks for the unit to be heard and not seen, which is
     only meaningful when there is a unit to hear. Asked for with no unit it is a
     caller mistake, so it is reported and carried on with rather than thrown,
     the same rule this file follows everywhere else. */
  if (unitDisplay === "spoken" && unit == null && isDevelopment()) {
    warnDevOnce(
      "spoken-without-unit",
      '[opsinjs] <Value> received unitDisplay="spoken" with no unit to speak. The ' +
        "prop takes a unit off the screen and keeps it in the accessibility tree, " +
        "so it needs a unit to move. It was ignored. Pass the unit, or drop the " +
        "prop for a number that has no unit by design.",
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
    warnDevOnce(
      `precision-range:${String(precision)}`,
      `[opsinjs] <Value> received precision={${String(precision)}}. Precision is a ` +
        `count of decimal places: a whole number from 0 to ${MAX_FRACTION_DIGITS}. ` +
        "It was ignored, so the number below is showing exactly the digits it was " +
        "handed rather than a precision nobody asked for.",
    )
  }
  const places = usable ? precision : undefined

  /* An empty `absenceLabel` is the only way this component can be made to
     render nothing at all where an absence belongs, and `numbers-units-
     precision` rule 13 requires an absence to be said in words. Falling back to
     the default wording is the honest repair: a blank slot is
     indistinguishable from a component that failed to render. */
  const emptyLabel = absenceLabel !== undefined && absenceLabel.trim() === ""
  if (emptyLabel && isDevelopment()) {
    warnDevOnce(
      "empty-absence-label",
      '[opsinjs] <Value> received absenceLabel="", which would leave the absence ' +
        "slot empty. The default wording was used instead. An absence is said in " +
        "words, and a blank is indistinguishable from a component that rendered " +
        "nothing.",
    )
  }
  const absenceWords =
    absenceLabel !== undefined && !emptyLabel ? absenceLabel : "no reading yet"

  /* The locale is validated once, here, and the validated tag is what both the
     formatter and the spoken-form gate read below. A raw `en_GB` from a
     settings table is not a BCP 47 tag: it splits on the underscore rather than
     a hyphen, so a language check run against it would decide an English
     product does not speak English and would silently take the spoken unit off.
     `usableLocale` reports the malformed tag and returns `undefined`, which is
     the runtime default for the formatter and, for the language gate, the same
     "the reader's environment decides" that keeps the spoken form. */
  const tag = usableLocale(locale)

  /* Rounding is `halfExpand`, which rounds half away from zero and is
     `numbers-units-precision` rule 3. It is INHERITED rather than named, and
     that is a portability decision rather than a preference: `roundingMode` is
     an ES2023 addition to `Intl.NumberFormatOptions`, so writing it out made
     this file fail to typecheck in any consumer whose `lib` stops at ES2022.
     That was found by installing it into one. `halfExpand` is this formatter's
     own default, so the behaviour is identical and only the documentation
     moved, which is where it now is. Rounded ONCE, here, at the point of
     display. It is never rounded before a comparison, and never over an
     already-rounded value.

     With no `places`, `maximumFractionDigits` is opened all the way rather than
     left at the formatter's default of three, which would round a reader's
     measurement because nobody had said how precise it was. */
  const formatter = new Intl.NumberFormat(tag, {
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
     would come back empty. The plural rule below avoids the same trap.

     Development only, and it stays a warning. `precision` is required at the
     type level, so a TypeScript caller never reaches here; this branch serves a
     JavaScript caller who omitted it, for whom the required type was advice. No
     default is invented for that caller either: precision belongs to the metric
     rather than to the unit, so there is no honest number for this file to fall
     back on. */
  if (places === undefined && reading !== null && isDevelopment()) {
    const fraction = formatter
      .formatToParts(reading)
      .find((part) => part.type === "fraction")
    const key = `${unit ?? ""}:${String(fraction?.value.length ?? 0)}`
    if (fraction !== undefined) {
      warnDevOnce(
        `precision-unstated:${key}`,
        `[opsinjs] <Value> is showing ${String(fraction.value.length)} decimal ` +
          `places and was given no \`precision\` to show them to: "${formatted}". ` +
          "With no precision this component rounds nothing and pads nothing, so " +
          "the digits are whatever the double happened to hold rather than what " +
          "anybody measured. Pass the precision the measurement was reported " +
          "to. That is the resolution of the device, or the number of places " +
          "the laboratory gave. There is deliberately no default to fall back " +
          "on: precision is a property of the metric and not of the unit, so " +
          "nothing here can supply one for you.",
      )
    }
  }

  /* THE PLURAL FOLLOWS WHAT IS ON THE SCREEN, and it is decided by asking the
     same formatter what one looks like rather than by inspecting the number or
     the string. Parsing the digits back out would be wrong twice over: `\d`
     matches only ASCII, so a locale with its own digit shapes would come back
     empty, and a locale that groups with a full stop would come back as a
     different number entirely. Comparing against `format(1)` is exact in every
     locale, and it also settles the "1.0" case. A reading shown to one decimal
     place matches `format(1)`, which is "1.0", and is spoken in the singular.

     THE WORDS ARE ENGLISH, and they are now offered only to an English reader.
     The table holds British English and nothing else, so a non-English locale
     leaves the symbol audible rather than hearing an English word pronounced
     with its own phonetics. */
  const singular =
    reading !== null && (formatted === formatter.format(1) || formatted === formatter.format(-1))
  const spoken =
    reading === null || unit == null || !speaksEnglish(tag)
      ? undefined
      : spokenUnit(unit, singular ? 1 : reading)

  /* An absence at the hero size comes down to the headline step in the muted
     role, so a surface with no reading does not shout louder than one with a
     steady reading. See the note on ROOT_SIZE. Everything else keeps the size
     it asked for, including an inline absence, which inherits the surrounding
     colour and must not be dimmed below the sentence it sits in.

     The muted colour is written as `[color:var(--muted-foreground)]` and not as
     `text-muted-foreground`, because this class is merged through `cn`, which is
     `twMerge`, and `text-muted-foreground` and `text-opsin-headline` land in one
     `text-*` conflict group where the later one deletes the earlier. Spelled as
     an arbitrary property the colour is its own group and the headline step
     survives. `button.tsx` and `disclaimer-note.tsx` spell an ink this way for
     the same reason. */
  const rootSizeClass =
    reading === null && size === "display"
      ? "text-opsin-headline [color:var(--muted-foreground)]"
      : ROOT_SIZE[size]

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
         vocabulary is fixed at four by the substrate contract. A fifth is a
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
        rootSizeClass,
        className
      )}
    >
      {reading === null ? (
        <span data-slot="value-absence">
          {/* Words, and nothing but words. An absence has to be SAID:
              `numbers-units-precision` rule 13 requires the explanation, and a
              punctuation mark in a value slot is either skipped by speech
              synthesis or read out as punctuation, so it never carried any part
              of the message and was always hidden from the accessibility tree.
              With it gone, the visible string and the accessible string are the
              same string. The slot is never empty and never a glyph:
              `absenceWords` falls back to the default wording precisely so that
              it cannot be. */}
          {broken ? "not available" : absenceWords}
        </span>
      ) : (
        <>
          <span data-slot="value-number">{formatted}</span>
          {unit == null ? null : (
            <>
              {/* The visible symbol, unless the caller asked for `spoken`, which
                  takes it off the screen and leaves only the spoken form below.
                  That is for a sentence that already prints the unit once for a
                  pair of readings, as "10 to 20 mg/dL" does, and it is why this
                  is a named part rather than something the caller has to hide by
                  hand: the whole accessibility payload sits in the spoken span,
                  so removing the symbol here changes nothing a screen reader
                  hears. */}
              {unitDisplay === "spoken" ? null : (
                <span
                  data-slot="value-unit"
                  /* Hidden only when there is a spoken form to hear instead. The
                     symbol stays in the accessibility tree, awkward to listen to
                     and true, in two cases: the unit table has no entry for it,
                     and the reader's language is not one the table speaks, so
                     the English words would be worse than the symbol. */
                  aria-hidden={spoken === undefined ? undefined : "true"}
                  /* `undefined` rather than an empty string, so an inline value
                     does not ship a `class=""` attribute on every unit in the
                     product. */
                  className={UNIT_SIZE[size] || undefined}
                >
                  {/* A no-break space, not a CSS rule, so the join between the
                      number and its unit survives copy, paste, print and the
                      reader's own text size. A symbol marked `joined` in
                      tokens/units.json takes no separator at all, because
                      content/docs/content/grammar-and-mechanics.mdx names the
                      degree symbol and the percent sign as the closed set that
                      attaches to the digits, so a percentage and a temperature
                      in Celsius are written with nothing between the number and
                      the symbol, and value.mdx lists that page in `governedBy`.
                      With nothing
                      between the two spans the browser cannot break there, so a
                      joined symbol needs no `whitespace-nowrap` either.
                      `whitespace-nowrap` stays deliberately absent in both cases,
                      so a phrase can still wrap between other things at 200% text
                      instead of pushing the page sideways. This separator lives
                      inside this part, not before it, so that a caller who
                      suppresses the symbol by selecting `[data-slot=value-unit]`,
                      which is what ResultCard's compound reading does at
                      result-card.tsx, suppresses the separator with it and does
                      not leave a space with nothing to separate. */}
                  {unitRow?.joined === true ? null : "\u00A0"}
                  {unit}
                </span>
              )}
              {/* The unit in words, adjacent to the digits so the two are one
                  phrase. A screen reader must hear "1000.2 kilograms", not
                  "1000.2" and then, some distance later, "kg".

                  IT IS A NAMED PART, not an anonymous span. `data-slot` is the
                  whole DOM contract in this system, and this element carries the
                  no-break separator and the visible symbol together, so a
                  consumer whose surrounding sentence already says the unit has
                  something to select in order to suppress both at once, and a
                  test asserting the substitution happened has something to find.
                  The built-in way to ask for that is `unitDisplay="spoken"`,
                  which drops this span and keeps the spoken one; selecting the
                  slot in CSS is the route for a consumer that needs the symbol
                  gone on some surfaces and not others. It is in the page's
                  anatomy and composition tree alongside the other four.

                  THE CONSTRAINT THIS CREATES, stated rather than left to be
                  discovered. The visible text is "kg" and the accessible text is
                  "kilograms", and the two share no substring. WCAG 2.2 SC 2.5.3
                  asks that a control with a visible text label have that text in
                  its accessible name, so a Value must never be the only thing
                  naming a control: a product that makes a reading tappable owes
                  that control its own accessible name carrying the symbol as
                  written. The substitution stays, because the alternative is
                  the symbol spoken and the words dropped, and that is the
                  failure this component exists to prevent, on every surface
                  rather than on the few that are tappable.

                  IT IS NOT SELECTABLE, which is what stops a copied reading
                  reading "1,000.2 kg kilograms". `sr-only` clips the element
                  rather than removing it, so it stays in the document and
                  reaches the clipboard when a selection crosses it.
                  `select-none` takes it out of that selection while leaving it
                  in the accessibility tree, which is the one repair that does
                  not trade the spoken form away. It is a browser behaviour
                  rather than a specification guarantee, so the page books it as
                  argued until somebody runs a copy test. Tailwind emits both
                  `-webkit-user-select` and `user-select` for the utility, so no
                  theme rule is needed and none would travel with `shadcn add`
                  anyway. */}
              {spoken === undefined ? null : (
                <span
                  data-slot="value-spoken"
                  className="sr-only select-none"
                  /* The words are English whatever the surrounding page is set
                     to, and `lang` describes the content rather than the reader,
                     so a screen reader switches to an English voice for them.
                     Correct unconditionally, including when `locale` is absent. */
                  lang="en"
                >
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
 * reviewed code rather than a scratch demo. It shows one reading at both
 * weights, a reading of zero, an absence, and that same absence at the hero
 * size. The distinction it is built to hold is the one this component is most
 * often got wrong about: a missing reading is not zero, and coercing one to the
 * other turns a sentence about not knowing into a false claim of zero.
 *
 * The failure form is deliberately not among these rows. A non-finite reading
 * emits a development warning, because it reports a defect on the caller's side,
 * and this zero-prop demo is public shipped code that ADR 0009 keeps free of
 * states that complain. That state is shown in the `value-zero-is-not-absence`
 * example instead, where it renders beside the absence it must never be mistaken
 * for.
 *
 * The numbers are obviously unreal (ADR 0012), and the magnitude is chosen
 * rather than convenient: over a tonne is not a person, and a count of zero is
 * a count. An earlier draft of this demo used a two-digit weight in kilograms,
 * which is a plausible reading for a small child. This file is one `shadcn add`
 * away from somebody else's project and one screenshot away from outliving the
 * page it was written for, so a number a reader could take for their own is the
 * one thing it must never ship. There is no reference range in sight either;
 * this component has never seen one and never will.
 */
export default function ValueDemo() {
  return (
    <div className="flex flex-col gap-opsin-3 text-opsin-body">
      {/* The same reading at both weights, so it is visible that `size` moves
          nothing but the type: same digits, same decimal place, same unit. */}
      <Value value={1000.2} unit="kg" precision={1} size="display" />
      <Value value={1000.2} unit="kg" precision={1} />
      {/* A reading of zero is a measurement that was taken and came to
          nothing. */}
      <Value value={0} unit="steps" precision={0} />
      {/* No reading at all, which is a different sentence and says so. The
          precision is never used on an absence, and that is the point: a reading
          that was never taken still has a precision it would have been reported
          to. */}
      <Value value={null} unit="steps" precision={0} />
      {/* The same absence at the hero size, so the display-size treatment is on
          screen and reviewable. It is deliberately not set at the hero weight: a
          statement of not knowing drops to the headline step in the muted role
          rather than shouting louder than a steady reading would. */}
      <Value value={null} unit="steps" precision={0} size="display" />
    </div>
  )
}
