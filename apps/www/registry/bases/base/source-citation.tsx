/**
 * SourceCitation says where a piece of health information came from, in the
 * reader's own plain words, with an optional link to the fuller citation and an
 * optional date for when it was last checked.
 *
 * THERE IS NO DEFAULT SOURCE IN THIS FILE AND THERE NEVER WILL BE. Not a
 * placeholder, not a vetted variant, not a specimen DOI, not a URL, not a study
 * name, not a date. Provenance is a claim about where a number came from, and a
 * design system knows the number of no product and the source of none. A
 * citation shipped from here would arrive beside a reading its author never
 * measured, attributing that reading to an instrument the product may not own,
 * and it would arrive looking checked because it came from a library. So the
 * missing case says so: a citation with no source supplied renders one unlovely
 * admission line, which is the same refusal `disclaimer-note` makes and for the
 * same reason.
 *
 * IT CARRIES ONLY TWO OF THE TEN PROVENANCE RULES, AND THE PAGE SAYS WHICH.
 * `health/data-provenance-and-device-accuracy` sets ten rules. This component
 * renders rule 2, the plain words of where a value came from, at the value and
 * in the reader's own language, and it gives rule 6 a home, a manufacturer's
 * accuracy claim attributed and linked rather than restated as the product's
 * own. It keeps neither for the caller: it holds no provenance class, it checks
 * no wording against the four classes, and it cannot tell a measurement from a
 * guess. The other eight rules stay the caller's, in the caller's data layer and
 * content, and this component would render a wrong provenance string as readily
 * as a right one. It reports where it can and asserts nothing it cannot.
 *
 * IT CARRIES NEITHER COLOUR AXIS, LIKE DISCLAIMERNOTE. Category colour would
 * make a statement about where a number came from read as a statement about what
 * the number is; status colour would make it read as a level. Provenance is
 * neither. There is no `status` prop, no `category` prop, no fill and no radius,
 * the root carries neither `data-status` nor `data-category`, and the whole
 * treatment is the type step, the ink and the space around it. `data-opsinjs-value`
 * is absent too, because this renders no measurement.
 *
 * IT INVENTS NO DATE. `checkedOn` is formatted from what the caller supplied and
 * from nothing else. A value that does not resolve to a real calendar date is
 * refused rather than guessed at, so the component never prints a confidently
 * wrong "last checked" date, and it never reads the clock to fill one in.
 *
 * IT IS A SERVER COMPONENT. No state, no hook, no timer, no event handler and no
 * Base UI primitive. The one interactive part is the composed `Link`, present
 * only when the caller supplies a destination and a name for it together.
 */

import { Children, type ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { Link } from "@/registry/base-lyra/ui/link"

/**
 * Development warnings, said once per distinct offender.
 *
 * Nothing this file complains about has an `OpsinErrorCode`. The codes in
 * `tokens/errors.json` describe mistakes a consumer makes with the CLINICAL API,
 * they are a versioned contract, and a component may not mint one. What this
 * keeps is the discipline the substrate is right about: a warning printed on
 * every render, and twice per render under Strict Mode, becomes noise, and a
 * noisy channel is one somebody switches off. `disclaimer-note.tsx` carries the
 * same lines for the same reason, and the shared repair belongs in
 * `lib/opsinjs.ts` rather than in this component's file.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/**
 * Whether any provenance words actually arrived.
 *
 * TypeScript cannot answer this. `{reading.source}` resolving to `undefined`
 * from a data layer, a content table returning a whitespace-only string for a
 * locale nobody filled in, and `{isCited && "..."}` evaluating to `false` on the
 * day the citation lapsed are the three ways provenance actually goes missing,
 * and none of them is caught by testing for `""` alone. `Children.toArray` drops
 * `null`, `undefined`, booleans and empty arrays; a string of spaces is what it
 * keeps and what must still be refused, and so is a bare number.
 *
 * An element is not text and is not resolvable from here, so a source containing
 * one is taken at its word. That is the right way round: printing "no source was
 * supplied" over a caller's own `<strong>` would be a false accusation on
 * somebody's screen. It is also the one route to a silently sourceless citation
 * that stays open, and the page says so rather than promising a guarantee this
 * function does not make.
 */
function hasSuppliedSource(source: ReactNode): boolean {
  const parts = Children.toArray(source)
  if (parts.length === 0) return false
  if (!parts.every((part) => typeof part === "string" || typeof part === "number")) {
    return true
  }
  const text = parts.map((part) => String(part)).join("").trim()
  return text !== "" && !isBareNumber(text)
}

/**
 * Whether the whole source is a number rather than words.
 *
 * `{sources.length && sources.text}` on an empty collection passes `0`, and
 * React renders the digit, so a citation's entire statement of where a reading
 * came from becomes the character `0` with no warning. A source that is only a
 * number states no provenance at any value and not at zero alone, so it is
 * refused rather than printed, and the admission line takes its place. `NaN`
 * reaches here the same way from a count that did not parse. `disclaimer-note`
 * refuses a bare-number body in exactly this shape.
 */
function isBareNumber(text: string): boolean {
  return text === "NaN" || /^-?\d+(?:[.,]\d+)?$/.test(text)
}

/**
 * Link labels that name no destination.
 *
 * A reader using a screen reader can list every link on a page with no sentence
 * around any of them, and this is the one link on the citation that points at
 * the fuller source. "Learn more" and "here" name nowhere in that list. The
 * component warns and still renders: the destination is right even when the
 * label is lazy, and taking somebody's citation link off the screen over its
 * wording would be the larger mistake. Compared case-insensitively against the
 * trimmed label with trailing punctuation removed.
 */
const UNHELPFUL_LABELS = [
  "learn more",
  "read more",
  "find out more",
  "more",
  "more information",
  "click here",
  "here",
  "details",
  "this link",
  "source",
  "citation",
  "reference",
]

/**
 * The axis names, and the pattern that finds one in a class list.
 *
 * Built from two pieces on purpose, exactly as `disclaimer-note.tsx` and
 * `callout.tsx` build theirs. `scripts/check-a11y.mts` reads this file as text
 * and treats a file that spells a complete axis utility as a status surface
 * owing a word, a glyph and a `data-status`; a detector written the obvious way
 * would report itself. Split like this, the file contains the axis names and the
 * axis prefixes and never the two joined, which is the thing the gate looks for.
 * The pattern still matches every joined form at runtime.
 */
const AXIS_NAMES =
  "steady|watch|attention|urgent|unknown|sleep|heart|activity|nutrition|mind|labs"

const AXIS_TINT = new RegExp(
  `(?:^|[\\s:-])(?:status|category)-(?:${AXIS_NAMES})(?![a-z])`,
)

/**
 * The grid-item floor for the link to the fuller citation.
 *
 * THE LINK TREATMENT ITSELF LIVES IN `Link`, NOT HERE, so this citation's link
 * and any other inline link cannot drift apart: the underline, the `0.25em`
 * offset, the one-pixel press and the focus ring are all `Link`'s. What is left
 * here is the part that was never about the link and always about the citation,
 * which is how large a target the link must be when it stands on its own line.
 *
 * THE FLOOR IS HERE BECAUSE `emphasis="inline"` DROPS IT. `Link`'s inline form is
 * a link inside a sentence, and SC 2.5.8 exempts an inline target, so it carries
 * no floor: a 2.75rem minimum would inflate the line box of any paragraph the
 * link sat in. This link is not inside a sentence. It is a control of its own on
 * its own line, the standing "read the full citation" affordance a reader taps,
 * so it keeps the floor the inline form sheds. The floor is
 * `--opsin-target-minimum` in rem rather than 44px, so it grows when a reader
 * raises their text size. The fallback inside the `var()` is load-bearing: written
 * without one, the declaration is invalid at computed-value time in a project
 * installed without `tokens.generated.css`, `min-height` reverts to `auto`, and
 * the floor vanishes with no error anywhere. Both axes, because SC 2.5.8 is a
 * 44x44 region and a short label in a language with shorter words would otherwise
 * sit under the floor on the inline axis.
 *
 * `justify-self-start` stops the anchor stretching to the width of its row, so a
 * reader tapping the empty space beside a short label is not navigated somewhere
 * they did not aim at. `inline-flex` is what `Link`'s `wrap-anywhere` needs to
 * bite on a long compound label.
 */
const LINK_FLOOR =
  "inline-flex min-h-(--opsin-target-minimum,2.75rem) " +
  "min-w-(--opsin-target-minimum,2.75rem) max-w-full items-center " +
  "justify-self-start"

/**
 * A strict calendar date, `YYYY-MM-DD`.
 *
 * Nothing looser is accepted as a string, because a looser form is where a wrong
 * "last checked" date comes from. `new Date("2026-03-14")` is read as UTC
 * midnight and then formatted in whatever zone the code runs in, so the same
 * string is 14 March on a London server and 13 March for a reader in the
 * Americas. A calendar date pinned to UTC has no such drift.
 */
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** The date to render, in the reader's words and in machine form, or null. */
interface CheckedDate {
  /** The formatted date a reader sees, in their locale. */
  display: string
  /** The `YYYY-MM-DD` form for the `<time>` element's `dateTime`. */
  machine: string
}

/** Two-digit, for the machine `dateTime` attribute. */
function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

/**
 * The caller's language tag, or `undefined` where it is not a language tag.
 *
 * `Intl` throws a `RangeError` on a malformed tag, and it throws it during
 * render. A component that takes a health screen down because a locale arrived
 * as `"en_GB"` from a settings table has turned a cosmetic defect into an
 * outage, so the tag is checked once and the runtime's own default is used
 * instead. `relative-time.tsx` guards the same way.
 */
function usableLocale(locale: string | undefined): string | undefined {
  if (locale === undefined) return undefined
  try {
    Intl.getCanonicalLocales(locale)
    return locale
  } catch {
    warnDev(
      `locale-malformed:${locale}`,
      `[opsinjs] <SourceCitation locale="${locale}"> is not a BCP 47 language ` +
        'tag, so the last-checked date was formatted with the runtime default ' +
        'instead. A tag looks like "en-GB", with a hyphen.',
    )
    return undefined
  }
}

/**
 * The last-checked date as a reader's phrase and a machine string, or null.
 *
 * IT INVENTS NOTHING. A number is read as epoch milliseconds, and its own UTC
 * calendar day is rebuilt at UTC midnight so the same instant is the same day on
 * every runtime. A string is a strict `YYYY-MM-DD` calendar date, pinned to UTC
 * for the drift reason above. Anything else, a full timestamp, a free-text date,
 * a value that does not resolve to a real day, is refused rather than rendered as
 * a plausible but wrong date, and the caller is told in development. The round
 * trip through `Date.UTC` is what rejects 31 February: `Date.UTC` rolls an
 * impossible date forward without complaint, and a "last checked" date silently
 * moved is worse than one that did not render.
 */
function formatChecked(
  checkedOn: string | number,
  locale: string | undefined,
): CheckedDate | null {
  let year: number
  let month: number
  let day: number

  if (typeof checkedOn === "number") {
    if (!Number.isFinite(checkedOn)) return null
    const instant = new Date(checkedOn)
    if (Number.isNaN(instant.getTime())) return null
    year = instant.getUTCFullYear()
    month = instant.getUTCMonth() + 1
    day = instant.getUTCDate()
  } else {
    const match = CALENDAR_DATE.exec(checkedOn.trim())
    if (match === null) return null
    year = Number(match[1])
    month = Number(match[2])
    day = Number(match[3])
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const midnight = new Date(Date.UTC(year, month - 1, day))
  if (
    midnight.getUTCFullYear() !== year ||
    midnight.getUTCMonth() !== month - 1 ||
    midnight.getUTCDate() !== day
  ) {
    return null
  }

  const display = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(midnight)
  return { display, machine: `${year}-${pad2(month)}-${pad2(day)}` }
}

export interface SourceCitationProps {
  /**
   * Where this piece of health information came from, in the reader's own plain
   * words: "from your cuff", "estimated by your watch from movement and heart
   * rate", "you entered this". It renders inline content rather than a block
   * element.
   *
   * THERE IS NO DEFAULT AND THERE WILL NOT BE ONE. Provenance shipped from a
   * design system attributes a reading to an instrument the product may not own,
   * and it arrives looking checked because it came from a library. Supply none
   * and the citation says on screen that none was supplied, rather than inventing
   * a source. `false` from a `&&` branch, `0` from the same branch on an empty
   * collection, an empty array and a whitespace-only string all count as
   * supplying none. The boundary is words: a caller who wraps the provenance in
   * an element is taken at their word, so an empty string inside a `<strong>` is
   * the one route to a silently sourceless citation.
   *
   * TYPED OPTIONAL AND REQUIRED BY THE CONTRACT, which is the same shape
   * `DisclaimerNote.children` has. Marking it required buys nothing, because
   * `{reading.source}` with an undefined `reading.source` type-checks either way.
   * It costs the ability to render the missing state at all, which is the state a
   * product is most likely to ship by accident and the one that most needs
   * seeing.
   */
  source?: ReactNode
  /**
   * The fuller citation, for readers who want it: a manufacturer's accuracy
   * document, a reference range's own source, a study you have read. This is
   * where rule 6 of data provenance lands. A manufacturer's accuracy claim is
   * attributed and linked here rather than restated as the product's own, and it
   * is never paraphrased into a stronger claim.
   *
   * BOTH HALVES TOGETHER, and that is why this is one object rather than a bare
   * href. A destination with no label would need a label written here, and the
   * label this system would have to invent is exactly the one the requirement
   * refuses: "learn more" names nothing, and a screen reader's list of links is
   * where that costs somebody the citation they were looking for. The product
   * names its own destination in its own words. `more` mirrors
   * `DisclaimerNote.more` for that reason.
   */
  more?: { label: string; href: string }
  /**
   * When this provenance was last checked, as a calendar date. A string is a
   * strict `YYYY-MM-DD`; a number is epoch milliseconds. It renders as a plain
   * date in the reader's locale, pinned to UTC so the day does not drift, inside
   * a `<time>` element that carries the machine date. There is no live timer and
   * no clock read: a date not supplied is a date not shown, and a value that is
   * not a real calendar date is refused rather than rendered as a plausible wrong
   * one.
   *
   * It is not a freshness verdict. This component holds no staleness boundary and
   * says nothing about whether the source can still be relied on; it reports the
   * date the product recorded and no more. Deciding a source is out of date
   * belongs to the product.
   */
  checkedOn?: string | number
  /**
   * BCP 47 language tag for the last-checked date, as in `en-GB`. It formats the
   * date and nothing else, because the source words and the link label are the
   * product's own text in the product's own language and this component neither
   * writes nor translates them. Omit it and the date takes the runtime's default
   * locale, which on a server is the server's language rather than the reader's.
   * A malformed tag is reported in development and falls back to that default.
   */
  locale?: string
  /**
   * Merged onto the root. Width, margin and place in a layout belong here: they
   * are decisions of the surface the citation stands on rather than of the
   * citation.
   *
   * It is also the one hole in this component's refusal to carry a colour, and
   * the component says so rather than pretending otherwise: a utility from either
   * axis passed through here reaches the root, and in development it raises a
   * warning naming what to use instead.
   */
  className?: string
}

/**
 * The escape hatch, reported rather than closed.
 *
 * Not an OPSIN code, for the reason given on `warnDev`. It warns and renders: the
 * class list is the caller's and the words are the product's, and taking a
 * citation off a screen over a styling mistake would be the larger error.
 * `disclaimer-note.tsx` and `callout.tsx` guard the same hole the same way.
 */
function warnIfTintedFromAnAxis(className: string | undefined): void {
  if (!isDevelopment() || className === undefined) return
  if (!AXIS_TINT.test(className)) return
  warnDev(
    `axis-tint:${className}`,
    `[opsinjs] <SourceCitation className="${className}"> takes a colour from one ` +
      "of the two axes. This component sits outside both. A category tint makes a " +
      "statement about where a number came from read as a statement about what the " +
      "number is, and a status tint makes it read as a level; provenance is " +
      "neither. See /docs/health/two-colour-axes.",
  )
}

/**
 * One link, as a control or as nothing.
 *
 * Returning `null` rather than rendering something is the point. A link with no
 * name is announced as "link"; a link with no destination is a promise the
 * citation cannot keep. `disclaimer-note.tsx` renders its `more` link the same
 * way.
 */
function citationLink(
  more: NonNullable<SourceCitationProps["more"]>,
): ReactNode {
  const label = typeof more.label === "string" ? more.label.trim() : ""
  const href = typeof more.href === "string" ? more.href.trim() : ""

  if (label === "" || href === "") {
    warnDev(
      `link-incomplete:${label}|${href}`,
      "[opsinjs] <SourceCitation> was given `more` without both a label and an " +
        "href, so nothing was rendered for it. The two travel together on " +
        "purpose: a destination with no label would need one invented here, and " +
        "the label a design system would invent names nowhere.",
    )
    return null
  }

  const plain = label.toLowerCase().replace(/[.…!?:>»\s]+$/u, "")
  if (UNHELPFUL_LABELS.includes(plain)) {
    warnDev(
      `link-unhelpful:${plain}`,
      `[opsinjs] <SourceCitation> has a link labelled "${label}", which names no ` +
        "destination. A screen reader can list every link on a page with no " +
        "sentence around them, and this is the one link that points at the fuller " +
        'citation. Name it in the reader\'s own language, with a label like "read ' +
        'how this estimate is worked out" or "see the accuracy document". It was ' +
        "rendered as written.",
    )
  }

  return (
    <Link
      href={href}
      emphasis="inline"
      data-slot="source-citation-link"
      className={LINK_FLOOR}
    >
      {label}
    </Link>
  )
}

export function SourceCitation({
  source,
  more,
  checkedOn,
  locale,
  className,
}: SourceCitationProps) {
  warnIfTintedFromAnAxis(className)

  /* THE ONE PLACE THIS COMPONENT REFUSES TO BE HELPFUL, and the reason it exists
     in a design system rather than in each product's own codebase. A citation
     that quietly rendered empty would pass review, pass every gate here, and ship
     a reading whose provenance had silently gone missing. So the missing case
     prints, in the reader's own words rather than the component's, about the app
     rather than about this component. */
  const supplied = hasSuppliedSource(source)
  if (!supplied) {
    warnDev(
      "source-missing",
      "[opsinjs] <SourceCitation> was rendered with no `source`, so it says on " +
        "screen that none was supplied. opsinjs ships no provenance: no default, " +
        "no placeholder citation, no specimen DOI and no date. The words are a " +
        "claim about where a reading came from, and a design system knows neither " +
        "the reading nor its source. Write the product's own plain words: \"from " +
        "your cuff\", \"estimated by your watch\", \"you entered this\". `false` " +
        "or `0` from a `&&` branch, an empty array and a whitespace-only string " +
        "all count as writing none.",
    )
  }

  const link = more ? citationLink(more) : null
  const checked =
    checkedOn === undefined ? null : formatChecked(checkedOn, usableLocale(locale))

  if (checkedOn !== undefined && checked === null) {
    warnDev(
      `checked-unparsed:${String(checkedOn)}`,
      `[opsinjs] <SourceCitation checkedOn={${JSON.stringify(checkedOn)}}> is not ` +
        "a calendar date, so no last-checked date was rendered rather than a " +
        'guessed one. Pass a string as "2026-03-14" (YYYY-MM-DD) or a number of ' +
        "milliseconds since the epoch. A date this component cannot resolve is one " +
        "it will not invent.",
    )
  }

  return (
    /* NO ROLE, NO FILL, NO BOUNDARY. The citation is ordinary text in the reading
       order, sitting under the value it belongs to: nothing is announced over
       what the reader is doing, and the whole treatment is the type step, the ink
       and the space. A fill or a boundary would be a claim to attention this
       caption does not make, and either would have to be measured on a surface
       nobody has measured it on. Whether a screen-reader user should meet the
       provenance as a named group rather than as loose lines is an open question
       on the page rather than a settled decision here.

       BODY INK AT THE FOOTNOTE STEP FOR THE SOURCE, AND THE STEP IS NOT
       NEGOTIABLE DOWN INTO A PALER ONE. Rule 2 asks that provenance be visible in
       plain words, so the source is the message and takes the readable foreground
       ink; the smaller step is what keeps it secondary to the value above it
       without making it a paler grey that complies with the letter of the rule
       and none of its purpose. The date takes the quieter secondary ink one line
       down, because it is metadata about the source rather than the source
       itself.

       THE INK IS AN ARBITRARY PROPERTY AND THAT IS NOT A STYLE CHOICE. `cn` is
       `twMerge(clsx(...))`, tailwind-merge is unconfigured, and it has never been
       told that `--text-opsin-*` is a font-size namespace. So it files
       `text-opsin-footnote` and `text-foreground` in one conflict group and
       silently drops whichever comes first, which would leave the citation at
       whatever size it inherited. `[color:var(--foreground)]` is a different
       conflict group, resolves the same custom property the `text-foreground`
       utility resolves, and keeps both the size and the ink. A Tailwind editor
       plugin will offer to rewrite it as `text-foreground`; do not accept that,
       for the reason `button.tsx` and `disclaimer-note.tsx` give at length.

       `min-w-0` with `wrap-break-word` and a comfortable measure are the reflow
       repair: at 200% text a long device name or a bare word must break rather
       than widen the citation past the viewport into horizontal scroll. The
       `66ch` inside the `var()` is the cap's only guarantee outside this
       repository, for the reason the fallback on the target floor already
       gives. */
    <div
      data-slot="source-citation"
      className={cn(
        "flex min-w-0 max-w-(--opsin-measure-comfortable,66ch) flex-col gap-y-opsin-1 text-opsin-footnote [color:var(--foreground)]",
        className,
      )}
    >
      <p
        data-slot="source-citation-source"
        className="m-0 min-w-0 wrap-break-word"
      >
        {/* Unlovely on purpose, and in the reader's own words rather than the
            component's: it names no part a reader cannot see and it makes its
            plain admission in the active voice, about the app rather than about
            this component. An author who sees this line writes the product's own
            provenance; a reader who sees it has been told that something is
            missing rather than told a source that nobody stands behind.

            This one sentence is English, and there is no prop through which a
            product can translate it, for the reason `disclaimer-note.tsx` gives:
            a `missingSourceLabel` prop is one keystroke from a prop that accepts
            the citation, which is the thing this file exists to refuse. A product
            shipping in another language guards the missing case upstream instead,
            and never lets the component be the one that speaks. ADR 0005 (no
            [lang] segment yet) is why there is no language seam to hang a
            translation on. */}
        {supplied
          ? source
          : "This app has not said where this information came from."}
      </p>

      {checked ? (
        /* The date is metadata about the source, so it takes the quieter
           secondary ink one step down from the source line. It is a `<time>` so
           the machine date travels with the reader's phrase, and "Last checked
           on" is the component's own English chrome, in the same position as the
           event words `relative-time.tsx` owns and translates for no caller. It
           carries no staleness treatment and no tint, because this component
           holds no boundary to compare the date against. */
        <p
          data-slot="source-citation-checked"
          className="m-0 min-w-0 wrap-break-word [color:var(--muted-foreground)]"
        >
          Last checked on{" "}
          <time dateTime={checked.machine}>{checked.display}</time>
        </p>
      ) : null}

      {link}
    </div>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the citation carrying
 * everything it can hold: the plain-words provenance of a device estimate, the
 * link to the fuller source, and the date it was last checked.
 *
 * THE PROVENANCE IS OBVIOUSLY SYNTHETIC AND SAYS SO OF ITSELF (ADR 0012). It
 * names a device that could belong to no product, "your Example Watch", and the
 * link points at "#example" rather than a real DOI or URL, so a reader who
 * screenshots this has screenshotted nothing quotable and a developer who copies
 * it has copied nothing usable. No real citation, no real accuracy figure, no
 * real study. The demo passes a locale so the date formats in one language and
 * the demo renders warning-free, which is the standard ADR 0009 holds it to; the
 * missing-source case, which is what a product is most likely to ship by
 * accident, is shown in its own example rather than here.
 */
export default function SourceCitationDemo() {
  return (
    <div className="w-full max-w-(--opsin-measure-comfortable,66ch)">
      <SourceCitation
        source="Estimated by your Example Watch from movement and heart rate, so read it as an estimate rather than an exact measure."
        more={{
          label: "Read how this example estimate is worked out",
          href: "#example",
        }}
        checkedOn="2026-03-14"
        locale="en-GB"
      />
    </div>
  )
}
