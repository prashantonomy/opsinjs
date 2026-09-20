/**
 * lib/opsinjs.ts is the shared substrate every opsinjs component imports.
 *
 * WHY THIS FILE EXISTS
 * A component under `registry/bases/<base>/` is distributed by `shadcn add`,
 * which copies source files into somebody else's project. Anything a component
 * imports has to travel with it or the copy will not compile, and a component
 * that compiles here and breaks there is worse than no component at all. So the
 * import surface of a registry file is exactly two modules: `@/lib/utils` for
 * `cn`, which `shadcn init` writes into every consumer, and this one, which
 * `scripts/build-registry.mts` appends to every component's `files[]` as a
 * `registry:lib` entry carrying real `content`. There is no third. Not
 * `@/components/*`, not `@/registry/*`, not `@/app/*`, not `@/tokens/*`. Those
 * paths exist in this repository and nowhere else.
 *
 * `type: "registry:lib"` resolves through the consumer's `components.json`
 * `aliases.lib`, and shadcn 4.20 rewrites a `@/lib/...` import specifier to the
 * same alias, so `@/lib/opsinjs` names the same file in this repository and in a
 * project that installed from it. Nothing is rewritten by hand at either end.
 *
 * IT RE-EXPORTS AND IT NEVER RE-DECLARES. The clinical vocabulary lives in
 * `lib/status.ts`, which is the module the documentation chrome, the section
 * contracts and `assert-ia.mts` already read. A second copy of `CLINICAL_STATUSES`
 * here would be a second copy that can drift, and the two axes are the one thing
 * in this system that must never say two different things. `lib/status.ts` ships
 * beside this file for the same reason, as a second `registry:lib` entry.
 *
 * WHAT IS DECLARED HERE, AND WHY IT IS HERE RATHER THAN IN A COMPONENT
 * Only the shapes that more than one component has to agree on: a reference
 * range, a point on a trend, a sheet detent, a material rung, and the one string
 * every example is allowed to cite as its source. A shape used by exactly one
 * component belongs in that component's own file, because a type nobody else
 * consumes is not substrate, it is that component's API.
 *
 * CONSTRAINTS THIS FILE IS UNDER
 * No JSX and no non-erasable TypeScript, so no `enum`, no parameter properties
 * and no `namespace`. Every relative import carries an explicit `.ts` extension,
 * because `scripts/*.mts` run under plain Node 24 with native type stripping and
 * some of them import `lib/` modules directly, with no resolver hook. The same
 * rule holds for `lib/status.ts`, `lib/catalogue.ts`, `lib/routes.ts` and
 * `registry/catalogue.ts`.
 *
 * `scripts/build-reference.mts` scans `lib/` and turns every exported type and
 * interface into a page under `content/docs/reference/api/`, taking the first
 * sentence of the doc comment directly above the declaration as the summary. The
 * comments below are therefore published documentation, not notes to the next
 * reader of the source.
 *
 * THREE REGIONS OF THIS FILE ARE GENERATED, each between a marker pair that
 * `scripts/build-tokens.mts` replaces wholesale on `pnpm run generate`. The
 * `OPSIN_ERRORS` table sits between the `opsinjs:errors` markers near the bottom
 * and is emitted from `tokens/errors.json`. The unit table sits between the
 * `opsinjs:units` markers and is emitted from `tokens/units.json`. The
 * banned-word table sits between the `opsinjs:banned` markers, which do not
 * exist yet: the reserved comment above the example data is the anchor the
 * emitter grows into that pair on its first run, splicing rows from
 * `tokens/glossary.json`. Edit the JSON, never a region.
 *
 * Everything outside those three marker pairs is hand-written, `warnOnce()`
 * included, and the generator leaves it alone. The one thing that is not safe to
 * fill by hand is that reserved anchor comment: the emitter deletes it and
 * writes the `opsinjs:banned` region in its place, so leave it where it stands.
 *
 * It is generated INTO this file rather than into `lib/generated/` for the
 * reason the first paragraph gives: `lib/generated/` does not travel with
 * `shadcn add`, so `warnOnce()` importing the error table from there would
 * compile in this repository and fail in every project that installed a
 * component. The same table is also emitted into `lib/generated/tokens.ts` as
 * `OPSIN_ERROR_CODES` for the documentation site, which is not a second copy
 * anybody maintains: both are written by one script, from one source, in one
 * run, and `node scripts/build-tokens.mts --check` fails on either drifting.
 */

import type { ClinicalStatus } from "./status.ts"

/* ------------------------------------------------------------------ *
 * The clinical vocabulary, re-exported from lib/status.ts             *
 *                                                                     *
 * A component imports these from `@/lib/opsinjs` and never from       *
 * `@/lib/status` directly. Both files ship, so either specifier would  *
 * resolve in a consumer, but one import surface is what makes the      *
 * substrate reviewable, and it is the specifier every specification    *
 * page's `## Usage` block prints.                                      *
 * ------------------------------------------------------------------ */

export {
  CLINICAL_STATUSES,
  CLINICAL_STATUS_META,
  HEALTH_CATEGORIES,
  HEALTH_CATEGORY_LABELS,
  isClinicalStatus,
  isHealthCategory,
  axisConflict,
} from "./status.ts"

export type {
  ClinicalStatus,
  UnknownStatus,
  ClinicalStatusOrUnknown,
  ClinicalStatusMeta,
  HealthCategory,
  AxisConflict,
} from "./status.ts"

/* ------------------------------------------------------------------ *
 * The words a component's copy may not use                            *
 * ------------------------------------------------------------------ */

/**
 * One banned word: the word a component's copy must not use, what to write in
 * its place, and why the word is barred.
 *
 * The shape lives here, in the shipped substrate, rather than in lib/generated,
 * because a component that reads this list has to compile inside a consumer's
 * project. build-registry ships exactly two library files, this one and
 * lib/status.ts, so a list a component imports can live in one of those two and
 * nowhere else, and lib/generated is a documentation-site artefact that never
 * leaves this repository.
 *
 * The rows themselves are generated rather than typed by hand. The space below
 * is reserved and not yet filled. Once scripts/build-tokens.mts emits its
 * banned-word region, the rows will arrive there from tokens/glossary.json, the
 * single source for the banned list and the plain-language glossary alike, and
 * `node scripts/build-tokens.mts --check` will then hold the generated copy and
 * that source in step, failing the build the moment one drifts. Only the shape
 * is stated here, so the generated region can carry data alone.
 */
export interface GeneratedBannedWord {
  /** The word a component's copy must not use, lower case. */
  word: string
  /** What to write in its place. */
  instead: string
  /** Why the word is barred, in one sentence a reader could be shown. */
  reason: string
}

/* opsinjs:banned:begin. Replaced by scripts/build-tokens.mts from tokens/glossary.json */

/** Words a component's copy must not use, with the replacement and the reason. Generated from `tokens/glossary.json`. */
export const BANNED_WORDS: GeneratedBannedWord[] = [
  {
    word: "abnormal",
    instead: "outside the usual range",
    reason: "The counterpart of the same problem, and the version that frightens people.",
  },
  {
    word: "bad",
    instead: "the specific finding, stated plainly",
    reason: "Carries a verdict the system is not entitled to give.",
  },
  {
    word: "diagnosis",
    instead: "say what the reading is and who can interpret it",
    reason: "opsinjs components never diagnose. Using the word implies they do.",
  },
  {
    word: "don't worry",
    instead: "state what the reading means and what happens next",
    reason: "Reassurance the system cannot back up, and it reads as a reason to worry.",
  },
  {
    word: "elevated",
    instead: "higher than",
    reason: "Clinical register; means little to a lay reader, and it sounds like a verdict to the readers who do recognise it.",
  },
  {
    word: "failed",
    instead: "outside the range we expected",
    reason: "A reading is not a test the reader sat.",
  },
  {
    word: "good",
    instead: "say the direction - higher, or lower",
    reason: "Moral framing of something largely outside the reader's control.",
  },
  {
    word: "healthy",
    instead: "in the usual range",
    reason: "A verdict on a life, from one number. A reading can sit inside a range while the person is unwell, and outside it while they are fine.",
  },
  {
    word: "just",
    instead: "delete it",
    reason: "'Just a bit high' minimises a reading the reader may need to act on.",
  },
  {
    word: "negative",
    instead: "the test did not find <what it looked for>",
    reason: "Same collision, in the other direction.",
  },
  {
    word: "normal",
    instead: "in the usual range, or the expected range for you",
    reason: "Outside a reference range is not abnormal in the everyday sense of the word, and inside one is not a clean bill of health. 'Normal' also carries a judgement about the person rather than about the reading. This word is banned outright across the system, including in code identifiers.",
  },
  {
    word: "optimal",
    instead: "in the usual range",
    reason: "Sets up every future reading as a decline, in the register of a fitness tracker rather than a clinic.",
  },
  {
    word: "perfect",
    instead: "in the usual range",
    reason: "Sets up every future reading as a decline.",
  },
  {
    word: "poor",
    instead: "lower than the range for you",
    reason: "Judges the person, not the measurement.",
  },
  {
    word: "positive",
    instead: "the test found <what it found>",
    reason: "In everyday English 'positive' means good news. In a test result it usually means the opposite, and the collision is dangerous.",
  },
  {
    word: "unhealthy",
    instead: "higher than the usual range",
    reason: "The same verdict in the other direction. Say which way the reading sits and against whose range; the replacement wording assumes the common case, so where the reading is low, say 'lower than the usual range'.",
  },
]

/* opsinjs:banned:end */

/* ------------------------------------------------------------------ *
 * Example data                                                        *
 * ------------------------------------------------------------------ */

/**
 * The only citation an opsinjs example, demo or preview may carry.
 *
 * Every component ships a zero-prop default export that renders in the docs and
 * in a consumer's editor, and every one of those renders a measurement. A
 * plausible reference range in a demo is a reference range somebody will read as
 * theirs, so the demos cite this string instead: one literal, shared by all of
 * them, saying in the reader's own language that the numbers beside it mean
 * nothing. `ReferenceRange.source` in an example is always this and never a
 * laboratory, a guideline body, a device manufacturer or a study.
 */
export const EXAMPLE_SOURCE = "Example data. Not a reference range"

/* ------------------------------------------------------------------ *
 * Shapes more than one component agrees on                            *
 * ------------------------------------------------------------------ */

/**
 * The interval a reading is being compared against, and who says so.
 *
 * Both bounds are optional because a one-sided range is a real range: some
 * measurements have a floor and no ceiling, and rendering a bound the product
 * did not supply would invent a threshold. An omitted bound renders as an open
 * end, never as zero and never as an assumed limit.
 *
 * `source` is required, and it is required because opsinjs does not own a single
 * clinical number. A range arriving with no attribution is the consuming
 * product asking this system to vouch for a threshold it has never seen, which
 * is the one thing it must not do; a component handed a range with no `source`
 * reports OPSIN-0004 rather than drawing it.
 */
export interface ReferenceRange {
  /** Lower bound, in the reading's own unit. Omitted means the range is open below. */
  low?: number
  /** Upper bound, in the reading's own unit. Omitted means the range is open above. */
  high?: number
  /** Who this interval came from. Never opsinjs, and never omitted. */
  source: string
  /**
   * When the range was published or last reviewed, ISO 8601. Omitted when the
   * product does not know, which is rendered as "we do not know", never as
   * today's date.
   */
  asOf?: string
}

/**
 * One reading in a series, for the components that draw change over time.
 *
 * `value` is `number | null` rather than `number` because a gap in a series is
 * information: a day with no reading is not a day with a reading of zero, and
 * charting it as zero invents a measurement. A `null` point is drawn as a break
 * in the line and described in words by the chart's text twin.
 *
 * `status` is optional and is an input, never a derivation. opsinjs does not
 * compare a point to a range and decide what it means, because it does not know
 * the reader; a point carries a verdict only when the consuming product attached
 * one.
 */
export interface TrendPoint {
  /** When this reading was taken, ISO 8601. */
  at: string
  /** The reading, or `null` where there is no reading for this point. */
  value: number | null
  /** The verdict the product assigned to this point, if it assigned one. */
  status?: ClinicalStatus
}

/**
 * How far a sheet is open.
 *
 * Three stops rather than a continuous height, because a sheet a reader can
 * leave at an arbitrary position is a sheet that will be left half over the
 * value it is explaining. `content` is as tall as what is inside it, `half` is
 * the resting stop that keeps the screen behind it readable, and `full` is the
 * whole surface.
 */
export type Detent = "content" | "half" | "full"

/**
 * A rung of the material ladder, meaning how a surface sits above what is
 * behind it.
 *
 * These six names are the token names: every rung resolves a matching set of
 * `--opsin-material-<rung>-*` custom properties for blur, tint, shadow and
 * border. Where a specification page names a different set, the tokens win,
 * because the tokens are what actually renders.
 */
export type MaterialRung =
  | "canvas"
  | "card"
  | "raised"
  | "sheet"
  | "overlay"
  | "scrim"

/**
 * The state a data surface is in, named once so the surfaces converge on one vocabulary, though no component accepts it yet.
 *
 * These are the five states of ../content/docs/foundations/data-states.mdx,
 * loading, error, empty, partial and stale, plus the resolved case where the
 * value is real, current and simply rendered. The members are listed with the
 * five doctrine states first and resolved last; the order a surface actually
 * moves through them is the resolution order the foundation's flow diagram
 * fixes, which is error first, then loading, empty, partial, stale and finally
 * resolved.
 *
 * No component accepts this type yet. It exists so that when the data surfaces
 * do converge on a single state input they converge on one set of names rather
 * than six, and because lib/opsinjs.ts is the substrate `shadcn add` copies into
 * a consumer's project, a type declared here already travels with every
 * installed component and costs nothing at runtime. Turning this alias into a
 * running state machine, with a prop, a guard and a default, is a larger change
 * this name does not stand in for.
 */
export type DataState =
  | "loading"
  | "error"
  | "empty"
  | "partial"
  | "stale"
  | "resolved"

/* opsinjs:units:begin - replaced by scripts/build-tokens.mts from tokens/units.json */

/**
 * One unit: what it is called, what a reader sees, and how it is SPOKEN.
 *
 * The spoken form is the whole reason this table exists. A screen reader handed
 * `mmHg` improvises a pronunciation, and "one twenty over eighty em em aitch
 * gee" is a failure rather than a quirk.
 *
 * There is no reference range here, no threshold, no plausibility bound and no
 * default precision. A unit table says what a number is measured in; it never
 * says what a number should be. Decimal places belong to the MEASUREMENT and
 * travel with it from the product - health/numbers-units-precision, rule 2.
 *
 * `joined` is typography, not a claim about a reading: it records that a symbol
 * sits against the number with no space, as everyday English writes 98% and
 * 36.8°C. Which symbols take it is settled by
 * content/docs/content/grammar-and-mechanics.mdx, not by this table.
 */
export interface Unit {
  /** Stable key. Never the display symbol: `°C` is `celsius`. */
  id: string
  /** What a reader sees beside the number. Looked up by exactly this string. */
  symbol: string
  /** How to say it for exactly one of the thing. British English. */
  spoken: string
  /** How to say it for every other count, zero included. British English. */
  plural: string
  /** What is being measured, dimensionally. Never what a reading should be. */
  measures: string
  /** Whether the symbol attaches to the number with no space, as in 98% and 36.8°C. Absent means a space. */
  joined?: true
}

/** Every unit this system can speak, sorted by id. Generated from `tokens/units.json`. */
export const UNITS: Unit[] = [
  {
    id: "beat-per-minute",
    symbol: "bpm",
    spoken: "beat per minute",
    plural: "beats per minute",
    measures: "rate",
  },
  {
    id: "celsius",
    symbol: "°C",
    spoken: "degree Celsius",
    plural: "degrees Celsius",
    measures: "temperature",
    joined: true,
  },
  {
    id: "centimetre",
    symbol: "cm",
    spoken: "centimetre",
    plural: "centimetres",
    measures: "length",
  },
  {
    id: "fahrenheit",
    symbol: "°F",
    spoken: "degree Fahrenheit",
    plural: "degrees Fahrenheit",
    measures: "temperature",
    joined: true,
  },
  {
    id: "foot",
    symbol: "ft",
    spoken: "foot",
    plural: "feet",
    measures: "length",
  },
  {
    id: "gram",
    symbol: "g",
    spoken: "gram",
    plural: "grams",
    measures: "mass",
  },
  {
    id: "inch",
    symbol: "in",
    spoken: "inch",
    plural: "inches",
    measures: "length",
  },
  {
    id: "kilocalorie",
    symbol: "kcal",
    spoken: "kilocalorie",
    plural: "kilocalories",
    measures: "energy",
  },
  {
    id: "kilogram",
    symbol: "kg",
    spoken: "kilogram",
    plural: "kilograms",
    measures: "mass",
  },
  {
    id: "kilojoule",
    symbol: "kJ",
    spoken: "kilojoule",
    plural: "kilojoules",
    measures: "energy",
  },
  {
    id: "kilometre",
    symbol: "km",
    spoken: "kilometre",
    plural: "kilometres",
    measures: "length",
  },
  {
    id: "metre",
    symbol: "m",
    spoken: "metre",
    plural: "metres",
    measures: "length",
  },
  {
    id: "microgram-per-litre",
    symbol: "µg/L",
    spoken: "microgram per litre",
    plural: "micrograms per litre",
    measures: "mass concentration",
  },
  {
    id: "mile",
    symbol: "mi",
    spoken: "mile",
    plural: "miles",
    measures: "length",
  },
  {
    id: "milligram-per-decilitre",
    symbol: "mg/dL",
    spoken: "milligram per decilitre",
    plural: "milligrams per decilitre",
    measures: "mass concentration",
  },
  {
    id: "millimetre-of-mercury",
    symbol: "mmHg",
    spoken: "millimetre of mercury",
    plural: "millimetres of mercury",
    measures: "pressure",
  },
  {
    id: "millimole-per-litre",
    symbol: "mmol/L",
    spoken: "millimole per litre",
    plural: "millimoles per litre",
    measures: "amount-of-substance concentration",
  },
  {
    id: "millimole-per-mole",
    symbol: "mmol/mol",
    spoken: "millimole per mole",
    plural: "millimoles per mole",
    measures: "amount-of-substance ratio",
  },
  {
    id: "per-cent",
    symbol: "%",
    spoken: "per cent",
    plural: "per cent",
    measures: "proportion",
    joined: true,
  },
  {
    id: "pound",
    symbol: "lb",
    spoken: "pound",
    plural: "pounds",
    measures: "mass",
  },
  {
    id: "step",
    symbol: "steps",
    spoken: "step",
    plural: "steps",
    measures: "count",
  },
  {
    id: "stone",
    symbol: "st",
    spoken: "stone",
    plural: "stone",
    measures: "mass",
  },
]

/**
 * The lookup `findUnit()` reads, derived from `UNITS` rather than emitted twice.
 *
 * Keyed by the exact symbol, case included. There is no fuzzy matching, because
 * a table that guesses which unit somebody meant is a table that will one day
 * guess wrong about a concentration.
 */
export const UNITS_BY_SYMBOL: Record<string, Unit> = Object.fromEntries(
  UNITS.map((unit) => [unit.symbol, unit]),
)

/**
 * An exact conversion between two units of the same kind.
 *
 * Applied as `to = from * numerator / denominator + offsetNumerator /
 * offsetDenominator`. Every field is an integer, and that is deliberate: these
 * are definitions rather than measurements, and a definition stored as a
 * rounded decimal is an approximation wearing a definition's provenance.
 *
 * `basis` names the definition each factor comes from. A conversion with no
 * basis does not belong in this system: opsinjs does not own a clinical number,
 * and the ones it does carry are the ones that are true by definition rather
 * than by measurement.
 */
export interface UnitConversion {
  /** Symbol converted from. */
  from: string
  /** Symbol converted to. */
  to: string
  numerator: number
  denominator: number
  offsetNumerator: number
  offsetDenominator: number
  /** Where each factor comes from, in the order they were composed. */
  basis: string[]
}

/** Every convertible ordered pair, composed by the generator. Never authored by hand. */
export const UNIT_CONVERSIONS: UnitConversion[] = [
  {
    from: "°C",
    to: "°F",
    numerator: 9,
    denominator: 5,
    offsetNumerator: 32,
    offsetDenominator: 1,
    basis: ["The Fahrenheit scale is defined against Celsius: a Fahrenheit degree is exactly five ninths of a Celsius degree and the scales meet where 32 °F is 0 °C, so °C = °F × 5/9 − 160/9. This conversion is affine rather than a ratio, which is why a temperature and a temperature DIFFERENCE do not convert the same way. 2 °C of change is 3.6 °F of change, not 35.6 °F."],
  },
  {
    from: "°F",
    to: "°C",
    numerator: 5,
    denominator: 9,
    offsetNumerator: -160,
    offsetDenominator: 9,
    basis: ["The Fahrenheit scale is defined against Celsius: a Fahrenheit degree is exactly five ninths of a Celsius degree and the scales meet where 32 °F is 0 °C, so °C = °F × 5/9 − 160/9. This conversion is affine rather than a ratio, which is why a temperature and a temperature DIFFERENCE do not convert the same way. 2 °C of change is 3.6 °F of change, not 35.6 °F."],
  },
  {
    from: "g",
    to: "kg",
    numerator: 1,
    denominator: 1000,
    offsetNumerator: 0,
    offsetDenominator: 1,
    basis: ["The SI prefix 'kilo' is exactly one thousand. This is a definition of the prefix, not a measurement of anything."],
  },
  {
    from: "g",
    to: "lb",
    numerator: 100000,
    denominator: 45359237,
    offsetNumerator: 0,
    offsetDenominator: 1,
    basis: ["The SI prefix 'kilo' is exactly one thousand. This is a definition of the prefix, not a measurement of anything.", "The international avoirdupois pound is defined as exactly 0.45359237 kilograms by the 1959 international yard and pound agreement. An exact definition, adopted by every signatory, and not a rounded measurement."],
  },
  {
    from: "g",
    to: "st",
    numerator: 50000,
    denominator: 317514659,
    offsetNumerator: 0,
    offsetDenominator: 1,
    basis: ["The SI prefix 'kilo' is exactly one thousand. This is a definition of the prefix, not a measurement of anything.", "One stone is exactly fourteen avoirdupois pounds, and one pound is exactly 0.45359237 kilograms; fourteen times that is 6.35029318 kilograms exactly. Two definitions composed, no measurement involved. Note the plural: British body weight is 'eleven stone', not 'eleven stones'."],
  },
  {
    from: "kg",
    to: "g",
    numerator: 1000,
    denominator: 1,
    offsetNumerator: 0,
    offsetDenominator: 1,
    basis: ["The SI prefix 'kilo' is exactly one thousand. This is a definition of the prefix, not a measurement of anything."],
  },
  {
    from: "kg",
    to: "lb",
    numerator: 100000000,
    denominator: 45359237,
    offsetNumerator: 0,
    offsetDenominator: 1,
    basis: ["The international avoirdupois pound is defined as exactly 0.45359237 kilograms by the 1959 international yard and pound agreement. An exact definition, adopted by every signatory, and not a rounded measurement."],
  },
  {
    from: "kg",
    to: "st",
    numerator: 50000000,
    denominator: 317514659,
    offsetNumerator: 0,
    offsetDenominator: 1,
    basis: ["One stone is exactly fourteen avoirdupois pounds, and one pound is exactly 0.45359237 kilograms; fourteen times that is 6.35029318 kilograms exactly. Two definitions composed, no measurement involved. Note the plural: British body weight is 'eleven stone', not 'eleven stones'."],
  },
  {
    from: "lb",
    to: "g",
    numerator: 45359237,
    denominator: 100000,
    offsetNumerator: 0,
    offsetDenominator: 1,
    basis: ["The international avoirdupois pound is defined as exactly 0.45359237 kilograms by the 1959 international yard and pound agreement. An exact definition, adopted by every signatory, and not a rounded measurement.", "The SI prefix 'kilo' is exactly one thousand. This is a definition of the prefix, not a measurement of anything."],
  },
  {
    from: "lb",
    to: "kg",
    numerator: 45359237,
    denominator: 100000000,
    offsetNumerator: 0,
    offsetDenominator: 1,
    basis: ["The international avoirdupois pound is defined as exactly 0.45359237 kilograms by the 1959 international yard and pound agreement. An exact definition, adopted by every signatory, and not a rounded measurement."],
  },
  {
    from: "lb",
    to: "st",
    numerator: 1,
    denominator: 14,
    offsetNumerator: 0,
    offsetDenominator: 1,
    basis: ["The international avoirdupois pound is defined as exactly 0.45359237 kilograms by the 1959 international yard and pound agreement. An exact definition, adopted by every signatory, and not a rounded measurement.", "One stone is exactly fourteen avoirdupois pounds, and one pound is exactly 0.45359237 kilograms; fourteen times that is 6.35029318 kilograms exactly. Two definitions composed, no measurement involved. Note the plural: British body weight is 'eleven stone', not 'eleven stones'."],
  },
  {
    from: "st",
    to: "g",
    numerator: 317514659,
    denominator: 50000,
    offsetNumerator: 0,
    offsetDenominator: 1,
    basis: ["One stone is exactly fourteen avoirdupois pounds, and one pound is exactly 0.45359237 kilograms; fourteen times that is 6.35029318 kilograms exactly. Two definitions composed, no measurement involved. Note the plural: British body weight is 'eleven stone', not 'eleven stones'.", "The SI prefix 'kilo' is exactly one thousand. This is a definition of the prefix, not a measurement of anything."],
  },
  {
    from: "st",
    to: "kg",
    numerator: 317514659,
    denominator: 50000000,
    offsetNumerator: 0,
    offsetDenominator: 1,
    basis: ["One stone is exactly fourteen avoirdupois pounds, and one pound is exactly 0.45359237 kilograms; fourteen times that is 6.35029318 kilograms exactly. Two definitions composed, no measurement involved. Note the plural: British body weight is 'eleven stone', not 'eleven stones'."],
  },
  {
    from: "st",
    to: "lb",
    numerator: 14,
    denominator: 1,
    offsetNumerator: 0,
    offsetDenominator: 1,
    basis: ["One stone is exactly fourteen avoirdupois pounds, and one pound is exactly 0.45359237 kilograms; fourteen times that is 6.35029318 kilograms exactly. Two definitions composed, no measurement involved. Note the plural: British body weight is 'eleven stone', not 'eleven stones'.", "The international avoirdupois pound is defined as exactly 0.45359237 kilograms by the 1959 international yard and pound agreement. An exact definition, adopted by every signatory, and not a rounded measurement."],
  },
]

/**
 * A pair people expect to be arithmetic and is not, with the reason.
 *
 * This list is the load-bearing half of the unit table. An omitted conversion
 * has to render as an explicit "we do not have this", never as a substituted
 * default, and a component that wants to explain WHY reads its reason here.
 */
export interface RefusedConversion {
  /** The two symbols, as authored. */
  between: [string, string]
  /** Why the pair is not a mathematical fact. Shown to a developer, not to a reader. */
  reason: string
  /** The docs page id that sets out the non-goal. */
  docs: string
}

/** Conversions this system refuses to publish, and why. Generated from `tokens/units.json`. */
export const REFUSED_CONVERSIONS: RefusedConversion[] = [
  {
    between: ["kcal", "kJ"],
    reason: "There is more than one calorie. The thermochemical calorie is exactly 4.184 joules and the fifteen-degree calorie is not, and food energy labelling picks one by regulation rather than by physics. Naming a single factor here would hide which calorie was meant, so the pair is refused until this file can carry the choice explicitly.",
    docs: "health/unit-systems",
  },
  {
    between: ["mmol/L", "mg/dL"],
    reason: "Molar concentration and mass concentration are related by the molar mass of the substance being measured, which is a property of the SUBSTANCE and not of either unit. Glucose, cholesterol and creatinine each carry a different factor, and this table does not know which analyte a reading is. A single published factor here would be applied to all three by somebody in a hurry, and the answer would be wrong by a multiple rather than by a rounding.",
    docs: "health/unit-systems",
  },
  {
    between: ["mmol/mol", "%"],
    reason: "The two ways of reporting HbA1c are related by a fitted regression between two assay standardisations, not by an exact definition. A regression is a measurement with a residual, it is periodically re-fitted, and it belongs to the laboratory that reports the result. This table carries definitions only.",
    docs: "health/unit-systems",
  },
]

/**
 * The unit a symbol names, or `undefined` when this system has never heard of it.
 *
 * `undefined` rather than a fabricated entry, because the caller's honest
 * response to an unknown symbol is to render it as written - awkward to listen
 * to, but true - and never to guess at a pronunciation.
 */
export function findUnit(symbol: string): Unit | undefined {
  return Object.prototype.hasOwnProperty.call(UNITS_BY_SYMBOL, symbol)
    ? UNITS_BY_SYMBOL[symbol]
    : undefined
}

/**
 * How a screen reader should say this unit for this count.
 *
 * `count` is the value as DISPLAYED, after any rounding, because the words
 * follow what is on the screen rather than what was in the database. English
 * takes the singular for exactly one and the plural for everything else, zero
 * included: "0 kilograms", "1 kilogram", "1.5 kilograms".
 *
 * The known limit, stated rather than hidden: a value shown as "1.0" because
 * its measurement has one decimal place is still counted as one and is spoken
 * "1.0 kilogram". Both wordings are defensible in English and neither is
 * unsafe. The larger limit is that these words are British English in every
 * locale; `tokens/units.json` has no translations yet and does not pretend to.
 */
export function spokenUnit(symbol: string, count: number): string | undefined {
  const unit = findUnit(symbol)
  if (unit === undefined) return undefined
  return Math.abs(count) === 1 ? unit.spoken : unit.plural
}

/** The authored conversion between two symbols, or `undefined` when there is none. */
export function unitConversion(from: string, to: string): UnitConversion | undefined {
  return UNIT_CONVERSIONS.find((row) => row.from === from && row.to === to)
}

/**
 * One value in another unit, or `undefined` when this system does not own the factor.
 *
 * `undefined` is the whole contract. mmol/L to mg/dL is not here, and it is
 * not here because the factor depends on the molar mass of the substance being
 * measured rather than on either unit - so a component that substituted a
 * default would be converting cholesterol with the factor for glucose. Render
 * "we do not have this"; never a number.
 */
export function convertUnit(value: number, from: string, to: string): number | undefined {
  const conversion = unitConversion(from, to)
  if (conversion === undefined) return undefined
  return (
    (value * conversion.numerator) / conversion.denominator +
    conversion.offsetNumerator / conversion.offsetDenominator
  )
}

/* opsinjs:units:end */

/* ------------------------------------------------------------------ *
 * Error codes, GENERATED from tokens/errors.json                      *
 *                                                                     *
 * Everything between the two markers below is written by              *
 * `scripts/build-tokens.mts`. An edit here survives until the next     *
 * `pnpm run generate` and no longer; the source is `tokens/errors.json`*
 * and the drift gate is `node scripts/build-tokens.mts --check`.       *
 * ------------------------------------------------------------------ */

/* opsinjs:errors:begin - replaced by scripts/build-tokens.mts from tokens/errors.json */

/**
 * How severe a warning is.
 *
 * The three classes are declared in `tokens/errors.json`'s `policy.severity`
 * block, which also carries the sentence that says what each one means:
 *   safety - A defect that can mislead a reader about their own health. Treat as a bug, not as a lint warning.
 *   correctness - The component will render something, but not what the author meant.
 *   hygiene - Works today, will not survive an upgrade.
 */
export type OpsinErrorSeverity = "safety" | "correctness" | "hygiene"

/**
 * Every warning code opsinjs can emit.
 *
 * Flat, allocated in sequence, and permanent: a code is never reused, never
 * renumbered and never removed. The union is what makes `warnOnce("OPSIN-0004")`
 * a compile error when the code does not exist, which is the difference between
 * a stable code and a string somebody typed.
 */
export type OpsinErrorCode =
  | "OPSIN-0001"
  | "OPSIN-0002"
  | "OPSIN-0003"
  | "OPSIN-0004"
  | "OPSIN-0005"
  | "OPSIN-0006"
  | "OPSIN-0007"
  | "OPSIN-0008"
  | "OPSIN-0009"
  | "OPSIN-0010"
  | "OPSIN-0011"
  | "OPSIN-0012"
  | "OPSIN-0013"
  | "OPSIN-0014"
  | "OPSIN-0015"
  | "OPSIN-0016"
  | "OPSIN-0017"
  | "OPSIN-0018"
  | "OPSIN-0019"
  | "OPSIN-0020"
  | "OPSIN-0021"

/** One warning code: what it is called, how severe it is, and the page that prevents it. */
export interface OpsinError {
  /** The stable code. Search by this, never by the message text. */
  code: OpsinErrorCode
  severity: OpsinErrorSeverity
  /** One line naming the mistake. */
  title: string
  /** The message template. `{name}` spans are filled from `warnOnce`'s `params`. */
  message: string
  /** The docs page id that prevents the mistake, without a leading slash. */
  docs: string
  /** The `{name}` spans in `message`, first appearance first. */
  params: string[]
}

/** The table `warnOnce()` reads. Generated from `tokens/errors.json`. */
export const OPSIN_ERRORS: Record<OpsinErrorCode, OpsinError> = {
  "OPSIN-0001": {
    code: "OPSIN-0001",
    severity: "safety",
    title: "Both a category and a status were given to one surface",
    message: "<{component}> received both `category=\"{category}\"` and `status=\"{status}\"`. A surface carries one axis. Set the category on the surface and render the status as a StatusPill inside it.",
    docs: "health/two-colour-axes",
    params: ["component", "category", "status"],
  },
  "OPSIN-0002": {
    code: "OPSIN-0002",
    severity: "safety",
    title: "A status was rendered without a word",
    message: "<{component}> has `status=\"{status}\"` and no accessible label. Status is carried by colour, icon and word together; colour alone does not survive grayscale, colour-vision deficiency or a black-and-white printout.",
    docs: "health/clinical-status-semantics",
    params: ["component", "status"],
  },
  "OPSIN-0003": {
    code: "OPSIN-0003",
    severity: "safety",
    title: "A value was rendered without a unit",
    message: "<Value> received `{value}` with no `unit`. A bare number in a health context is ambiguous between unit systems: the same digits are one reading in mmol/L and a very different one in mg/dL, and nothing on the surface tells the reader which was meant. Pass the unit the reading was measured in. If the number has no unit by design, such as a composite score, pass `unit={null}` to say so; the warning stays for a caller who simply forgot.",
    docs: "health/unit-systems",
    params: ["value", "null"],
  },
  "OPSIN-0004": {
    code: "OPSIN-0004",
    severity: "safety",
    title: "A reference range was rendered without a source",
    message: "<{component}> was given a `range` with no `range.source`. Name whose range it is: a laboratory, a device maker, or a clinician. A range is a comparison somebody chose and not a fact about the reader.",
    docs: "health/reference-ranges",
    params: ["component"],
  },
  "OPSIN-0005": {
    code: "OPSIN-0005",
    severity: "safety",
    title: "More than one urgent surface on a screen",
    message: "{count} surfaces on this screen have `status=\"urgent\"`. The escalation budget is one. When everything is urgent, nothing is.",
    docs: "health/alarm-fatigue",
    params: ["count"],
  },
  "OPSIN-0006": {
    code: "OPSIN-0006",
    severity: "safety",
    title: "A banned word appeared in a component's copy",
    message: "The string \"{text}\" contains \"{word}\", which this system does not use. Write \"{replacement}\" instead.",
    docs: "content/plain-english-a-z",
    params: ["text", "word", "replacement"],
  },
  "OPSIN-0007": {
    code: "OPSIN-0007",
    severity: "safety",
    title: "A health value was animated",
    message: "<{component}> is animating a health value with `{token}`. A value that overshoots has displayed, for one frame, a number that is not true. Use `spring-calm`, or render the final value immediately.",
    docs: "health/motion-in-health-ui",
    params: ["component", "token"],
  },
  "OPSIN-0008": {
    code: "OPSIN-0008",
    severity: "correctness",
    title: "A raw colour value was passed where a token is required",
    message: "<{component}> received `{prop}=\"{value}\"`. Components take a category or a status, never a colour. A raw value cannot be re-derived for dark mode, for Display-P3, or for a reader who has asked for more contrast.",
    docs: "foundations/token-architecture",
    params: ["component", "prop", "value"],
  },
  "OPSIN-0009": {
    code: "OPSIN-0009",
    severity: "correctness",
    title: "A primitive token was referenced from a component",
    message: "`{token}` is a primitive-tier token. Components consume roles. Primitives may be re-tuned in a minor release; roles are covered by the versioning policy.",
    docs: "foundations/token-architecture",
    params: ["token"],
  },
  "OPSIN-0010": {
    code: "OPSIN-0010",
    severity: "correctness",
    title: "An unknown category was requested",
    message: "`category=\"{category}\"` is not one of {known}. Adding a category means adding a ramp, not passing a new string.",
    docs: "theming/category-palettes",
    params: ["category", "known"],
  },
  "OPSIN-0011": {
    code: "OPSIN-0011",
    severity: "correctness",
    title: "`unknown` was used as a status level",
    message: "`unknown` is the absence of an assertion, not a fifth level. Use it when there is no reading or no range; do not use it to mean 'probably fine'.",
    docs: "health/uncertainty-and-staleness",
    params: [],
  },
  "OPSIN-0012": {
    code: "OPSIN-0012",
    severity: "correctness",
    title: "A trend was drawn from too few points",
    message: "<TrendSparkline> received {count} points and `minimumPoints` is {minimum}. Two readings are not a trend, and drawing one implies a direction the data does not support.",
    docs: "health/trends-and-change",
    params: ["count", "minimum"],
  },
  "OPSIN-0013": {
    code: "OPSIN-0013",
    severity: "correctness",
    title: "A chart's y-axis was truncated",
    message: "<{component}> has `yAxisMin={min}` on a health value. Truncating the axis exaggerates change; a 2% move drawn across the full height of a card reads as a crisis.",
    docs: "foundations/data-visualisation/chart-anatomy",
    params: ["component", "min"],
  },
  "OPSIN-0014": {
    code: "OPSIN-0014",
    severity: "correctness",
    title: "Category colours were used as chart series colours",
    message: "This chart is colouring {count} series from the category ramps. Category colours identify what a reading is about; using them for series turns an identity into an arbitrary label.",
    docs: "foundations/data-visualisation/chart-colour",
    params: ["count"],
  },
  "OPSIN-0015": {
    code: "OPSIN-0015",
    severity: "correctness",
    title: "A touch target is below the floor",
    message: "<{component}> renders a {width}x{height} hit area. The floor is 44x44, applied to the hit area rather than to the visible box.",
    docs: "accessibility/target-size-and-motor",
    params: ["component", "width", "height"],
  },
  "OPSIN-0016": {
    code: "OPSIN-0016",
    severity: "correctness",
    title: "A stale reading was rendered as current",
    message: "<{component}> was given a reading from {age} ago with no staleness treatment. A number with no time attached is read as 'now'.",
    docs: "health/uncertainty-and-staleness",
    params: ["component", "age"],
  },
  "OPSIN-0017": {
    code: "OPSIN-0017",
    severity: "hygiene",
    title: "More than three translucent surfaces are composited",
    message: "{count} translucent material rungs are visible at once; the budget is 3. Beyond three the blur cost is measurable on mid-range devices and the backdrop is unreadable anyway.",
    docs: "foundations/materials/performance-budget",
    params: ["count"],
  },
  "OPSIN-0018": {
    code: "OPSIN-0018",
    severity: "hygiene",
    title: "A deprecated token was referenced",
    message: "`{token}` was deprecated in {version} and is replaced by `{replacement}`. It will be removed in {removal}.",
    docs: "project/deprecations",
    params: ["token", "version", "replacement", "removal"],
  },
  "OPSIN-0019": {
    code: "OPSIN-0019",
    severity: "hygiene",
    title: "The token stylesheet was not loaded",
    message: "`--opsin-tokens-generated` is not set on :root. app/tokens.generated.css has not been imported, or `pnpm run generate` has not run, and every component is falling back to authored defaults.",
    docs: "theming/tailwind-v4",
    params: [],
  },
  "OPSIN-0020": {
    code: "OPSIN-0020",
    severity: "hygiene",
    title: "Two theme providers are mounted",
    message: "More than one theme provider is writing the `dark` class. Two providers race on first paint and produce a flash of the wrong theme.",
    docs: "handbook/dark-mode",
    params: [],
  },
  "OPSIN-0021": {
    code: "OPSIN-0021",
    severity: "safety",
    title: "A status outside the four levels was passed",
    message: "<{component}> received `status=\"{status}\"`, which is not one of the four levels. The vocabulary is fixed at steady, watch, attention and urgent; a component that accepted a fifth would be inventing a verdict. Nothing was rendered.",
    docs: "health/clinical-status-semantics",
    params: ["component", "status"],
  },
}

/* opsinjs:errors:end */

/* ------------------------------------------------------------------ *
 * warnOnce, the development-mode warning channel                      *
 * ------------------------------------------------------------------ */

/**
 * The values a message template asks for, keyed by placeholder name.
 *
 * Values are stringified as they are: a number arrives as a number so the
 * message does not have to decide how to format it, and no value is ever
 * rounded, unit-converted or localised on its way into a warning. A warning
 * that reformats what it was given is a warning that can disagree with the
 * screen it is complaining about.
 */
export type OpsinErrorParams = Record<string, string | number>

/**
 * Where a code's page lives. The canonical origin, hardcoded on purpose: this
 * file ships to projects that have no `lib/routes.ts` and no way to resolve a
 * page id, and a warning whose link is a bare slug sends the reader nowhere.
 */
const OPSIN_DOCS_ORIGIN = "https://opsinjs.pensievelabs.org/"

/**
 * Every message already emitted this session.
 *
 * Declared but not created. In a production bundle the guard at the top of
 * `warnOnce` is statically false, the body is dead code, and this stays
 * `undefined`, so the set is not merely unused in production. It is never
 * allocated and can never retain a string. In development it is created on the
 * first warning and lives for the session, which is what "once" means.
 */
let warnedKeys: Set<string> | undefined

/**
 * The parameters that identify WHO raised a warning, as opposed to what they
 * happened to be holding when they raised it. Only these take part in the
 * de-duplication key.
 *
 * `count`, `value`, `text`, `width`, `height`, `age`, `minimum`, `min`, `known`,
 * `version`, `removal` and `replacement` are all deliberately absent: each of
 * them either varies per render or is derived from the table itself, and
 * including any one of them turns "warn once" into "warn every frame".
 */
const IDENTITY_PARAMS = [
  "component",
  "prop",
  "slot",
  "token",
  "category",
  "status",
  "word",
] as const

/**
 * `process`, declared locally rather than borrowed from `@types/node`.
 *
 * This file ships into consumer projects, and a browser-only or Deno project
 * has no Node types. Referencing the global directly made
 * `Cannot find name 'process'` the first thing a consumer saw after installing
 * a component. That is a typecheck failure caused entirely by opsinjs, in a file they
 * did not write. A module-scoped `declare const` shadows the global where one
 * exists, emits nothing, and asks for exactly the two properties actually read.
 *
 * Every bundler this system supports substitutes the literal member expression
 * `process.env.NODE_ENV` at build time, which is what makes `isDevelopment()`
 * fold to `false` in a production bundle.
 */
declare const process: { env?: { NODE_ENV?: string } } | undefined

/**
 * True in development, and false wherever that cannot be established.
 *
 * Exported because a component must never reach for `process` itself: this is
 * the one place in the shipped substrate that knows how the environment is
 * detected, and a component that guessed differently would log in production.
 *
 * WRITE THE LAST TERM AS A PLAIN MEMBER EXPRESSION. `process.env.NODE_ENV` is
 * the exact text a bundler's define plugin substitutes; `process?.env?.NODE_ENV`
 * and `process.env?.NODE_ENV` are not, so they survive into the browser bundle
 * and are then evaluated against a bundler's empty `process` shim, which says
 * "not production" and turns every development reproach into console output an
 * end user sees. That is not hypothetical: it is what this line did until it was
 * written this way. The two `typeof` guards ahead of it are for the environment
 * a bundler never touched, meaning a plain ESM import with no build step, where
 * `process` really is absent and the bare member expression would throw.
 */
export function isDevelopment(): boolean {
  return (
    typeof process !== "undefined" &&
    typeof process.env !== "undefined" &&
    process.env.NODE_ENV !== "production"
  )
}

/** The point at which the warning channel stops rather than grows. */
const MAX_WARNED_KEYS = 500

/** Not a real key. It only records that the cap notice has been printed. */
const CAP_KEY = "\u0000cap"

/**
 * Report a defect in development, once, and never do anything else.
 *
 * `tokens/errors.json`'s own policy block is the specification, and it is
 * quoted here so the next reader does not have to relitigate it:
 *
 *   "Warnings are emitted in development only, once per offending call site,
 *   through console.warn. Nothing in this list throws, and nothing in this list
 *   is emitted in production: a health product must not be made to crash by a
 *   documentation-quality complaint."
 *
 * So: several component specifications say a violation "should fail loudly in
 * development". Loudly, yes. Fail, no. This function warns and returns, in
 * every case, including the cases where it has itself been called wrongly.
 *
 * WHAT "ONCE PER CALL SITE" MEANS AT RUNTIME. A call site is not observable
 * from inside a function. The only handle on one is a stack trace, and a stack
 * trace is minified in one build, source-mapped in another and absent on the
 * server, which would make the de-duplication key differ between environments
 * that are meant to behave the same. The key used instead is the code plus the
 * IDENTIFYING parameters listed in `IDENTITY_PARAMS` below.
 *
 * It is deliberately NOT the filled message. A third of the codes in the table
 * carry a parameter that changes on every render, such as `{count}` in
 * OPSIN-0005, `{value}` in OPSIN-0003 and `{age}` in OPSIN-0016, so keying on the message
 * would make a `safety` warning fire on every frame of a screen that is already
 * misbehaving, and would grow the key set without bound in a long session. The
 * identifying parameters are the ones that name WHO is at fault rather than what
 * they happened to be holding at the time.
 *
 * Two consequences worth stating rather than leaving to be discovered. A caller
 * may pass `component` even for a code whose message never interpolates it, and
 * doing so buys per-component granularity for free, so components should. And for
 * the three codes that take no parameters, and for any caller that supplies
 * none, the key collapses to the code alone: one warning per session for the
 * whole application. That is coarser than "per call site". It is the most this
 * function can honestly promise without a call site to key on, and it is still
 * the right trade, because a repeated identical complaint teaches nothing and
 * drowns the next one.
 *
 * It survives React's Strict Mode, which invokes a render twice on purpose: the
 * second invocation computes the same key, finds it, and returns without
 * printing.
 *
 * AN UNFILLED PLACEHOLDER IS A DEFECT, AND IT IS NOT THIS FUNCTION'S. A missing
 * parameter leaves its `{brace}` in the message and adds a line saying which
 * ones were not supplied. It does not throw, and it does not swallow the
 * warning: the underlying complaint may be about a reading a person is about to
 * act on, and losing it to a second bug in the component that raised it is the
 * worse of the two outcomes. The visible `{brace}` is the report.
 */
export function warnOnce(code: OpsinErrorCode, params: OpsinErrorParams = {}): void {
  /* Fail closed. Every bundler this system supports replaces
     `process.env.NODE_ENV` at build time, so in a production bundle the whole
     body below is dead code and is removed. Where `process` does not exist at
     all, the answer is silence rather than a guess: an environment this file
     cannot identify is not one it may decide to log in. */
  if (!isDevelopment()) return

  const error = OPSIN_ERRORS[code]
  if (error === undefined) return

  /* The default parameter covers `undefined` and nothing else, and this file
     ships into JavaScript projects where the types are advice rather than a
     guarantee. A caller who passes `null` gets a warning with its braces
     unfilled, which is the report; a TypeError raised inside the warning
     channel would be the channel breaking the product it is complaining to. */
  const supplied: OpsinErrorParams = params ?? {}

  /* The same pattern `placeholders()` in scripts/build-tokens.mts extracts
     with, so what the table says a message needs is what this fills. */
  const missing: string[] = []
  const message = error.message.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (span, name: string) => {
    const value: string | number | undefined = supplied[name]
    if (value === undefined) {
      missing.push(name)
      return span
    }
    return String(value)
  })

  const key = [code, ...IDENTITY_PARAMS.map((name) => supplied[name] ?? "")].join("\u0000")
  if (warnedKeys === undefined) warnedKeys = new Set<string>()
  if (warnedKeys.has(key)) return

  /* Bounded, because this set is never cleared and a development session can run
     for days. At the cap the channel says so once and then goes quiet, rather
     than either leaking or reverting to warning on every render. A warning
     channel that degrades into noise is one somebody switches off. */
  if (warnedKeys.size >= MAX_WARNED_KEYS) {
    if (!warnedKeys.has(CAP_KEY)) {
      warnedKeys.add(CAP_KEY)
      try {
        console.warn(
          `[opsinjs] ${MAX_WARNED_KEYS} distinct warnings have been reported in this ` +
            "session, so this channel is now quiet. Fix what is already reported, or " +
            "reload to start counting again.",
        )
      } catch {
        /* A patched console is not a reason to take a health product down. */
      }
    }
    return
  }
  warnedKeys.add(key)

  const lines = [`[opsinjs] ${code} (${error.severity}): ${message}`]
  if (error.docs !== "") lines.push(`  → ${OPSIN_DOCS_ORIGIN}${error.docs}`)
  if (missing.length > 0) {
    lines.push(
      `  No value was supplied for ${missing.map((name) => `{${name}}`).join(", ")}. ` +
        "That is a defect in the component that raised this warning, not in the " +
        "code the warning is about.",
    )
  }

  try {
    console.warn(lines.join("\n"))
  } catch {
    /* A patched or absent console is not a reason to take a health product
       down. Nothing in this channel throws, including the part that reports
       that the channel is broken. */
  }
}
