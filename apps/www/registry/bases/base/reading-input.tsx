"use client"

/**
 * ReadingInput — a Field for typing a measurement, with the unit beside the
 * number rather than hidden in the label.
 *
 * IT COMPOSES `Field` AND REIMPLEMENTS NOTHING. The label relationship, the
 * description list, the invalid state and the 44px floor are Field's, which is
 * Base UI's, and none of them is rewritten here. What this file adds is the
 * three things a health measurement needs that a text input does not: the unit
 * is on screen while the reader types, a compound reading is one named group of
 * separately-typable parts, and every change reports which unit the number is in.
 *
 * THERE IS NO `plausible` PROP, AND ITS ABSENCE IS THE SPECIFICATION.
 * `reading-input.mdx` proposed `{ min, max, unit }` and said the product owns
 * the bounds. This file goes one step further and gives the product the
 * COMPARISON as well, for four reasons that are each on their own sufficient:
 *
 *   1. A bound this component holds is a bound this component has to compare
 *      against, and that comparison is four clinical decisions nobody has made:
 *      whether the ends are inclusive, what happens to each part of a compound
 *      reading, which unit the bounds are stated in once the reader has switched
 *      units, and what counts as "outside" for a value the reader is halfway
 *      through typing.
 *   2. §7 of the substrate contract forbids shipping such a bound "for any
 *      metric, in any population, ever… This applies to example data too", and
 *      `check-a11y.mts` enforces it with no exemption of any kind for a name
 *      matching `plausib`. So the prop could never appear in this file's demo,
 *      in any example, or in any preview — a feature nobody could ever see
 *      working.
 *   3. The specification's own hint copy had to be corrected once for exactly
 *      this reason: it recommended a hint of "for example 128", which is a
 *      plausible systolic reading rendered as guidance by a system with no
 *      clinical owner.
 *   4. What the reader actually needs is a SENTENCE, not a bound — "that is
 *      higher than most readings, did you mean 128?" — and only the product can
 *      write it. `warning` takes that sentence. The product compares; this file
 *      renders, associates it with the control, and refuses to make it an error.
 *
 * A value nobody has told this component is impossible is a value it accepts and
 * passes on, unchanged. There is no bound anywhere in this file, and nothing is
 * ever rejected, clamped, cleared or reordered on the way through.
 *
 * UNITS: WHAT IT CONVERTS, AND THE ONE IT REFUSES BY NAME.
 * The switch offers whatever `units` lists, and on a switch it asks
 * `convertUnit()` — which is generated from `tokens/units.json` and carries only
 * conversions that are true by DEFINITION. kg↔lb↔st is the 1959 international
 * pound; °C↔°F is the definition of the Fahrenheit scale. mmol/L↔mg/dL is not
 * there and will not be: the factor is the molar mass of the substance being
 * measured, and this component does not know what was measured. ADR 0016.
 *
 * So a switch this system cannot make is a switch that CLEARS the entry and says
 * so on screen, rather than relabelling the digits — because relabelling 5.2
 * from mmol/L to mg/dL is an eighteen-fold error that looks entirely reasonable.
 * A product that needs that switch supplies the arithmetic itself: it is
 * controlled, it receives `cause: "unit"` with the unit the reader asked for, and
 * it re-renders with its own converted value. Or there is no switch.
 *
 * IT HOLDS NO VALUE, AND IT IS CONTROLLED. `value`/`segments` and `unit` are the
 * caller's; every keystroke and every switch goes out through `onChange` and
 * comes back as props. The one piece of state here is the TEXT in each box,
 * which is not the same thing as the value: a reader typing "5." has typed
 * something that parses to 5, and re-rendering "5" underneath their cursor takes
 * the full stop away again. The buffer is re-synchronised from props the moment
 * the numbers it last reported stop matching the numbers it is given.
 *
 * WHY THE VALUE IS IN THE DISPLAYED UNIT AND NOT IN A CANONICAL ONE. The
 * specification had `value` canonical with the display converted, which means
 * every keystroke round-trips display → canonical → display. `unit-systems` rule
 * 6 says a round trip is lossy and to round after conversion, so that design
 * visibly mangles digits as they are typed. Here nothing round-trips: what the
 * caller passes is what is shown, in the unit the caller names. Storing it
 * canonically is the product's job, which is where the knowledge of what
 * canonical means for this measurement already lives.
 *
 * NO COLOUR FROM EITHER AXIS, WHILE ANYBODY IS TYPING. A field that turns amber
 * because a number is outside a range is delivering a verdict during data entry,
 * before anyone has checked whether the number is even right. There is no
 * `data-status` in this file, no status class, no category class, and the
 * warning is a paragraph in the ordinary foreground colour.
 *
 * IT IS A CLIENT COMPONENT, and it has to be. It holds the text buffer, it
 * handles change events, it mints ids with `useId`, and `Field.Control` is a
 * Base UI part that carries its own `'use client'` anyway.
 */

import { useId, useState } from "react"

import { ChevronDown } from "lucide-react"

import {
  convertUnit,
  findUnit,
  isDevelopment,
  REFUSED_CONVERSIONS,
} from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { Field } from "@/registry/base-lyra/ui/field"

/**
 * Once per cause, not once per render — the same policy `field.tsx` implements
 * and for the same reason, doubled here because this is a controlled input
 * inside somebody's form. A complaint printed on every keystroke, twice under
 * Strict Mode, buries whatever else the console had to say.
 *
 * None of these gets an OPSIN code. `tokens/errors.json` has no entry for any of
 * them and a component may not mint one: the table is generated from that file
 * and the codes are a versioned contract.
 */
const warnedCauses = new Set<string>()

function warnDevelopmentOnce(cause: string, message: string): void {
  if (!isDevelopment() || warnedCauses.has(cause)) {
    return
  }
  warnedCauses.add(cause)
  console.warn(message)
}

/**
 * What this component will accept into a box, before it will call it a number.
 *
 * Deliberately permissive on both sides of the point and on the leading minus:
 * a reader typing "-" or "12." or "." has typed something incomplete rather than
 * something wrong, and a field that erases an incomplete entry erases the
 * keystroke that was going to complete it. Anything that does not match is still
 * KEPT in the box and reported as no reading — see `parseReading`.
 */
const NUMERIC = /^-?\d*\.?\d*$/

/**
 * The text in a box, as a number, or `null` when there is no number in it.
 *
 * A COMMA IS A DECIMAL POINT. `patterns/forms/units-and-numeric-entry` requires
 * both forms to be accepted, because a reader with a European keyboard layout
 * types a comma and a field that silently drops it turns 7,5 into 75. Exactly
 * one separator is swapped, so "1,234" is not quietly read as one thousand two
 * hundred and thirty-four — a thousands separator is ambiguous between the two
 * conventions and guessing which was meant is how a reading moves by a factor of
 * a thousand.
 *
 * `null` here means "there is no number in this box". It does NOT mean zero, and
 * it does not mean the reader has not started: those three are different states
 * and the last is not expressible in a number at all. `ReadingInputChange.text`
 * carries the raw box contents for the caller that needs to tell them apart, and
 * Base UI stamps `data-touched`, `data-dirty` and `data-filled` on the control
 * for the caller that would rather read the DOM.
 */
function parseReading(text: string): number | null {
  const trimmed = text.trim().replace(",", ".")
  if (trimmed === "" || !NUMERIC.test(trimmed)) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

/** A number as the digits that go in a box. `null` is an empty box, never "0". */
function toText(value: number | null): string {
  return value === null ? "" : String(value)
}

/**
 * A CONVERTED number as the digits that go in a box, padded to the precision the
 * field promised.
 *
 * `roundTo` returns a Number and `String()` drops a trailing zero, so a field
 * carrying `precision={1}` and the hint "To one decimal place." converted 12.5 kg
 * to stone and printed "2" — one significant figure fewer than the sentence
 * above the box had just guaranteed. A reader cannot tell a rounded 1.97 from an
 * exact 2, which is the whole point of stating a precision.
 *
 * It is used ONLY on the conversion path, and that restriction is the design.
 * `toText` also renders the caller's own digits and re-seeds the buffer from
 * props, and padding there would rewrite a number under somebody's cursor as
 * they type — "5." would become "5.0" mid-keystroke and the reader could never
 * reach "5.2". `reported` stays Numbers either way, so `onChange` and
 * `data-opsinjs-value` are untouched.
 *
 * With no `places` nothing is padded, because there is nothing to pad to and a
 * made-up decimal place is the false precision `roundTo` already refuses. The
 * range check is not decoration: `toFixed` throws a RangeError outside 0 to 100
 * where `String()` never threw, and this component does not validate `precision`
 * the way `Value` does — turning a formatting defect into a crash would be the
 * larger mistake.
 */
function toConvertedText(value: number | null, places: number | undefined): string {
  if (value === null) return ""
  if (places === undefined || !Number.isInteger(places) || places < 0 || places > 100) {
    return toText(value)
  }
  return value.toFixed(places)
}

/**
 * A converted number at the caller's precision.
 *
 * `unit-systems` rule 6: round AFTER conversion, at the destination's precision,
 * and accept that the round trip is lossy. With no precision nothing is rounded,
 * which is the honest arithmetic and is also unreadable — 5 kg is
 * 11.023113109243878 lb — so the caller is told once, in development, that the
 * component has no basis for choosing decimal places and they have not supplied
 * one. There is no per-unit default here and there is none in `Value` either:
 * precision belongs to the measurement, not to the unit, and two measurements
 * reported in the same unit do not share one.
 */
function roundTo(value: number, places: number | undefined): number {
  if (places === undefined) return value
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

/** Why a pair is not arithmetic, for a developer. Never shown to a reader. */
function refusalReason(from: string, to: string): string | undefined {
  const row = REFUSED_CONVERSIONS.find(
    (entry) =>
      (entry.between[0] === from && entry.between[1] === to) ||
      (entry.between[0] === to && entry.between[1] === from),
  )
  return row?.reason
}

/**
 * One part of a reading, and the same shape `ResultCard` and `MetricTile`
 * already take.
 *
 * It is deliberately identical to `ResultSegment`: what comes out of
 * `onChange` can be handed straight to a card without a mapping step, which is
 * the whole point of the two components agreeing. The specification proposed
 * `{ name, label }` with no value at all, which cannot carry a reading in either
 * direction.
 */
export interface ReadingSegment {
  /**
   * What this part is, in the reader's language. It is a real visible label on
   * its own box, because a reader typing two numbers has to know which box is
   * which — this is the entry side of a measurement, where `ResultCard` only has
   * to announce it.
   */
  label: string
  /**
   * This part's number, in the displayed unit. `null` is a first-class absence
   * meaning there is no number in this box, and it is never rendered as `0`.
   */
  value: number | null
}

/** What the reader did, and what the reading is now. */
export interface ReadingInputChange {
  /**
   * Every part of the reading, in `unit`. One entry for a simple reading, one
   * per box for a compound one. Interchangeable with `ResultCard`'s `segments`.
   */
  segments: ReadingSegment[]
  /**
   * The number, for a simple reading. `null` for a compound one — half of a
   * pair is not the reading, and returning the first part as though it were is
   * how a systolic ends up stored as a whole blood pressure.
   */
  value: number | null
  /** The unit the numbers above are in — the one the reader is looking at. */
  unit: string
  /**
   * Exactly what is in each box, unparsed and in order. It is the only way to
   * tell an empty box from one holding something that is not a number: both
   * report a `value` of `null`, and they are not the same thing.
   */
  text: string[]
  /** Whether the reader typed in a box or moved the unit switch. */
  cause: "value" | "unit"
  /**
   * On a unit switch, what happened to the numbers: `"converted"` by an exact
   * definitional factor, `"cleared"` because this system does not own that
   * factor, or `"unchanged"` because no number had been typed. `null` when the
   * reader was typing.
   *
   * A `"cleared"` change is the one to intercept. It is the component saying it
   * cannot do this arithmetic and will not guess: re-render with your own
   * converted value and the reader keeps their entry.
   */
  unitEffect: "converted" | "cleared" | "unchanged" | null
}

export interface ReadingInputProps {
  /**
   * The measurement, in the reader's words. Required, visible and persistent —
   * a placeholder is not a label and disappears the moment somebody types.
   *
   * Put the unit in `unit`, not in here. The label names WHAT is being measured;
   * a label reading "Weight (kg)" leaves readers who think in pounds typing
   * pounds, with nothing on screen to stop them or to record what they meant.
   */
  label: string
  /**
   * The unit shown beside the number, and the unit `value` and every segment's
   * value are in. Required: a bare number in a health context is ambiguous
   * between unit systems, and the same digits are one reading in mmol/L and a
   * very different one in mg/dL.
   *
   * Use the display symbol exactly as `tokens/units.json` spells it — "kg",
   * "°C", "mmHg". The spoken form comes from that table, so a listener hears
   * "in kilograms" rather than the letters. A symbol the table does not hold is
   * spoken as written rather than pronounced by guesswork.
   */
  unit: string
  /**
   * The reading, in `unit`. Controlled: what you pass is what is shown, and a
   * change reaches the screen only when you apply it. Omitted, or `null`, is an
   * empty field — never a zero.
   *
   * Ignored when `segments` is supplied, because a compound reading has no
   * single number.
   */
  value?: number | null
  /**
   * A compound reading — two or more numbers that are one measurement, such as
   * a blood pressure. Each becomes its own labelled box inside one named group,
   * which is what makes them separately typable and separately announced.
   *
   * `numbers-units-precision` rule 11 says a compound value is DISPLAYED in its
   * conventional form — 118/76, one string, not two fields — and that rule is
   * about display. This is entry, where `patterns/forms/units-and-numeric-entry`
   * requires the opposite: separate fields under one legend, because asking
   * somebody to type a solidus is asking them to format their own record. Both
   * are right about their own half; the page says so.
   */
  segments?: ReadingSegment[]
  /**
   * Every change: a typed digit, a cleared box, a unit switch. There is no
   * uncontrolled mode and no internal value — a caller that does not apply the
   * change gets a field that will not accept typing, which is the ordinary
   * behaviour of a controlled input rather than a fault.
   */
  onChange: (next: ReadingInputChange) => void
  /**
   * Units the reader may switch between. Two or more makes the unit a real
   * control with its own name and a 44px target; fewer leaves it as text beside
   * the number, which is where it has to be either way.
   *
   * Every pair the reader can reach should be one this system can convert:
   * kg/lb/st and °C/°F are exact definitions and are converted for you.
   * mmol/L and mg/dL are refused by name — the factor is the molar mass of the
   * substance being measured, which is a property of the substance and not of
   * either unit — so a switch between them clears the entry and says so, and a
   * product that needs it supplies its own arithmetic on `cause: "unit"`.
   */
  units?: string[]
  /**
   * The shape of an answer, shown before anything is typed. Passed to `Field`,
   * so it stays on screen when a warning appears.
   *
   * Write the SHAPE, never a bound and never a sample reading. "Two digits" or
   * "to one decimal place" helps; "for example 128" hands the reader a plausible
   * systolic to anchor on, and "must be between 70 and 250" is a threshold with
   * no clinical owner presented as a rule the reader has broken.
   */
  hint?: string
  /**
   * An advisory sentence about what has been typed, in the product's own words.
   *
   * The product decides when to show it, because deciding when a number looks
   * like a typing mistake needs bounds, and bounds are clinical and belong to
   * whoever owns them. This component performs no comparison of any kind. What
   * it guarantees is what happens to the sentence once you pass it: it is tied
   * to the control's description so a screen reader reaches it, it does NOT mark
   * the field invalid, it does not move focus, it does not clear the entry and
   * it does not stop a form being submitted. The reader always wins the argument.
   *
   * Ask a question and offer the likely fix. Never "invalid", never "error", and
   * never a bound for the reader to satisfy: most of the time they have typed
   * exactly what they meant, and real readings fall outside plausible ranges
   * precisely when they matter most.
   */
  warning?: string
  /**
   * Decimal places, from the precision of the MEASUREMENT — the resolution of
   * the instrument, or the places the laboratory reports.
   *
   * It is used for one thing only: rounding a number this component converted
   * when the reader switched units. It never reformats, rounds or pads what the
   * caller passed or what the reader typed, because rewriting digits underneath
   * somebody's cursor is how a field loses a keystroke. Omitted, a conversion is
   * not rounded at all and 5 kg becomes 11.023113109243878 lb.
   */
  precision?: number
  /**
   * The form control name, put on every box. For a compound reading each box
   * gets the name with its index appended, so the parts stay distinguishable in
   * a `FormData`.
   */
  name?: string
  /**
   * Which keypad appears. `"decimal"` for a measurement that can be fractional,
   * `"numeric"` for one that cannot. Defaults to `"decimal"`: a decimal keypad
   * can type a whole number and a numeric one cannot type a fraction, so the
   * default is the one that fails safely.
   */
  inputMode?: "decimal" | "numeric"
  /** What the return key says it will do. Only the form around this knows. */
  enterKeyHint?: "done" | "enter" | "go" | "next" | "previous" | "search" | "send"
  /**
   * Which state is marked, in words, inside the label. Passed to `Field`: mark
   * the exception, because marking both is the same as marking neither.
   */
  optionality?: "required" | "optional" | "none"
  /** Disables every box and the unit switch. */
  disabled?: boolean
  /** Merged onto the root. Layout is the caller's. */
  className?: string
}

/**
 * Written out rather than assembled: Tailwind reads class names as literal
 * strings, and anything built at runtime generates no CSS at all.
 *
 * `flex-wrap` on the control row is the whole of the 200%-text requirement for
 * this component. At the reader's largest text size the unit has to wrap
 * BENEATH the number rather than overlapping it or pushing the page sideways,
 * and a row that cannot wrap does one of those two things. `items-end` keeps the
 * unit on the boxes' bottom edge while a compound reading's per-box labels sit
 * above them at different heights.
 */
const CONTROL_ROW = "flex flex-wrap items-end gap-opsin-2"

/**
 * The unit switch, when there is one.
 *
 * A native `<select>`, and the reasons are all the same reason. It is one tab
 * stop, it is keyboard-operable everywhere without a roving-tabindex
 * implementation to get wrong, it announces its own value, and on a phone it
 * opens the platform's own picker — which is a bigger target than anything drawn
 * in CSS. `appearance-none` removes only the platform's arrow, which is redrawn
 * beside it so the control still reads as a control.
 *
 * The 44px floor is set in both axes and with a rem fallback, exactly as
 * `field.tsx` sets it and for the same reason: `app/tokens.generated.css` does
 * not travel with `shadcn add`, and without the fallback the declaration is
 * invalid in a consumer app that has not wired the token sheet and the control
 * is simply short.
 */
const UNIT_SELECT = [
  "min-h-[var(--opsin-target-minimum,2.75rem)]",
  "min-w-[var(--opsin-target-minimum,2.75rem)]",
  "appearance-none rounded-opsin-sm border border-input bg-background",
  "py-opsin-2 pl-opsin-3 pr-opsin-8 text-opsin-body",
  "disabled:opacity-70",
].join(" ")

export function ReadingInput({
  label,
  unit,
  value = null,
  segments,
  onChange,
  units,
  hint,
  warning,
  precision,
  name,
  inputMode = "decimal",
  enterKeyHint,
  optionality = "none",
  disabled = false,
  className,
}: ReadingInputProps) {
  const unitId = useId()
  const hintId = useId()
  const warningId = useId()
  const effectId = useId()

  if (label.trim() === "") {
    warnDevelopmentOnce(
      "empty-label",
      "[opsinjs] <ReadingInput> was given an empty `label`. The control now has " +
        "no accessible name, which is the one thing composing <Field> was " +
        "supposed to guarantee. Nothing is substituted on purpose: a made-up " +
        'name like "Measurement" would silence the audit that would otherwise ' +
        "catch this. See /docs/components/reading-input.",
    )
  }

  if (unit.trim() === "") {
    warnDevelopmentOnce(
      "empty-unit:" + label,
      '[opsinjs] <ReadingInput label="' +
        label +
        '"> was given an empty `unit`. A ' +
        "number a person is typing about themselves is ambiguous between unit " +
        "systems without one, and nothing on the surface says which was meant. " +
        "Pass the unit the reading is measured in.",
    )
  }

  if (segments !== undefined && segments.length === 0) {
    warnDevelopmentOnce(
      "empty-segments:" + label,
      '[opsinjs] <ReadingInput label="' +
        label +
        '"> was given an empty `segments` ' +
        "array. A compound reading with no parts has no boxes to type in, so " +
        "the field fell back to a single one. Pass one entry per part, or omit " +
        "the prop.",
    )
  }

  if (segments !== undefined && segments.length > 0 && value !== null) {
    warnDevelopmentOnce(
      "value-and-segments:" + label,
      '[opsinjs] <ReadingInput label="' +
        label +
        '"> was given both `value` and ' +
        "`segments`. A compound reading has no single number, so `value` was " +
        "ignored. Pass the parts in `segments` and read them back from " +
        "`onChange`'s `segments`.",
    )
  }

  /* ONE INTERNAL SHAPE, TWO PUBLIC ONES. Everything below works on an array of
     parts, so the simple and the compound reading share every code path that
     could otherwise drift — the parsing, the conversion, the change payload and
     the described-by wiring. The simple reading is a one-part array whose part
     is named by the field's own label, which is also what `onChange` reports, so
     a caller can hand `segments` straight to a ResultCard either way. */
  const compound = segments !== undefined && segments.length > 0
  const parts: ReadingSegment[] = compound
    ? (segments as ReadingSegment[])
    : [{ label, value }]

  /* A NUMBER THAT DID NOT SURVIVE ITS JOURNEY IS NOT A READING, AND THE CRASH IS
     WHY THIS IS HERE RATHER THAN IN THE PROP TYPES. `value` and
     `segments[].value` are typed `number | null`, and NaN is a `number`:
     `Number(row.weight)` on "—", "" or `undefined` produces one, TypeScript
     accepts it, and nothing else in this file narrows it. Two things then go
     wrong at once. `toText(NaN)` puts the literal string "NaN" in the box — and
     `NaN === NaN` is false, so the buffer below never reconciles with the props,
     the render-phase `setEntry` fires on every pass, and React aborts the whole
     tree with "Too many re-renders", taking the form and everything around it
     off the screen. A degradation is arguable; a crash is not.

     So it is narrowed once, here, at the boundary where the two public shapes
     become one internal one, and `null` is what it becomes: the empty box every
     path below already knows how to render, with `toText` returning "" for it
     unchanged. Every other numeric component in this registry narrows a
     non-finite number to an explicit third state rather than drawing it — this
     is that rule, arriving late. The caller is told in development, because a
     silently emptied box is a reading a product thinks it passed. */
  const incoming = parts.map((part) =>
    part.value !== null && Number.isFinite(part.value) ? part.value : null,
  )
  if (parts.some((part) => part.value !== null && !Number.isFinite(part.value))) {
    warnDevelopmentOnce(
      "non-finite-value:" + label,
      '[opsinjs] <ReadingInput label="' +
        label +
        '"> was given a value that is not a ' +
        "finite number — NaN or an infinity, which is what `Number(x)` returns " +
        "for an em dash, an empty string or `undefined`. That is not a reading, " +
        'so the box was left empty rather than filled with the word "NaN". ' +
        "Pass `null` for a measurement you do not have; the field already says " +
        "so in the reader's own words.",
    )
  }

  /* THE TEXT BUFFER, AND WHY IT IS NOT THE VALUE.
     "5." parses to 5. If the box were rendered from the parsed number the full
     stop would vanish under the cursor the instant it was typed, and the reader
     could never reach "5.2". So the boxes render text, the caller gets numbers,
     and `reported` remembers the numbers this component last sent out.

     The buffer is re-synchronised from props whenever `reported` and the props
     disagree — which happens when the caller changes the reading itself, when it
     REFUSES a change and passes the old value back, and on the first render.
     Both are the same event from here: what the caller says is now on screen has
     stopped matching what this component last said was on screen. Derived during
     render rather than in an effect, so the boxes never paint one frame of a
     value the caller has already replaced. */
  const [entry, setEntry] = useState<{
    text: string[]
    reported: (number | null)[]
    effect: { kind: "converted" | "cleared"; from: string; to: string; was: string } | null
  }>(() => ({
    text: incoming.map(toText),
    reported: incoming,
    effect: null,
  }))

  /* `Object.is` rather than `===`, and it is not a stylistic swap. The values
     reaching here are already narrowed, so the two agree on every one of them
     today; the point is that the comparison stays correct if a non-finite value
     ever reaches this line again, because that is the comparison whose failure
     is an infinite render loop rather than a wrong string. */
  const inSync =
    entry.reported.length === incoming.length &&
    entry.reported.every((reported, index) => reported === incoming[index])

  if (!inSync) {
    setEntry({
      text: incoming.map(toText),
      reported: incoming,
      effect: null,
    })
  }

  /* This render's values, not the state's: `setEntry` above schedules a second
     render pass, and painting the stale buffer in this one would show the
     previous reading for a frame. */
  const text = inSync ? entry.text : incoming.map(toText)
  const effect = inSync ? entry.effect : null

  const spoken = findUnit(unit)
  const switchable = units !== undefined && units.length > 1

  if (compound && optionality !== "none") {
    warnDevelopmentOnce(
      "optionality-on-compound:" + label,
      '[opsinjs] <ReadingInput label="' +
        label +
        '"> is a compound reading and was ' +
        "given `optionality`. The marker is a word inside a Field's label, and a " +
        "compound reading's name is a `<legend>` rather than a label, so it was " +
        "not applied to anything. Say it in the `label` itself until this " +
        "component has somewhere to put it.",
    )
  }

  if (units !== undefined && units.length > 0 && !units.includes(unit)) {
    warnDevelopmentOnce(
      "unit-not-in-units:" + unit,
      '[opsinjs] <ReadingInput label="' +
        label +
        '"> has `unit="' +
        unit +
        '"`, which is not one of the `units` it offers. The switch cannot show ' +
        "the unit the number is actually in, so a reader is looking at one unit " +
        "and being told another. Include the current unit in the list.",
    )
  }

  function emit(
    nextText: string[],
    nextUnit: string,
    cause: "value" | "unit",
    unitEffect: ReadingInputChange["unitEffect"],
  ): void {
    const values = nextText.map(parseReading)
    const nextSegments = parts.map((part, index) => ({
      label: part.label,
      value: values[index] ?? null,
    }))
    onChange({
      segments: nextSegments,
      value: compound ? null : (nextSegments[0]?.value ?? null),
      unit: nextUnit,
      text: nextText,
      cause,
      unitEffect,
    })
  }

  function handleText(index: number, next: string): void {
    const nextText = text.map((current, position) => (position === index ? next : current))
    /* The effect line is cleared the moment the reader touches a box. It
       describes what happened to an entry that no longer exists. */
    setEntry({ text: nextText, reported: nextText.map(parseReading), effect: null })
    emit(nextText, unit, "value", null)
  }

  function handleUnit(next: string): void {
    if (next === unit) return

    const current = text.map(parseReading)
    const anyTyped = current.some((reading) => reading !== null)

    /* Nothing has been typed, so nothing can have happened to it. The switch is
       reported and no sentence is drawn — a line saying an empty field stayed
       empty is noise in the description of every control on the row. */
    if (!anyTyped) {
      setEntry({ text, reported: current, effect: null })
      emit(text, next, "unit", "unchanged")
      return
    }

    const converted = current.map((reading) =>
      reading === null ? null : convertUnit(reading, unit, next),
    )
    const unconvertible = converted.some(
      (result, index) => current[index] !== null && result === undefined,
    )

    /* THE REFUSAL, AND IT IS THE POINT OF THE WHOLE UNIT SURFACE.
       `convertUnit` returns undefined when this system does not own the factor,
       and it does not own mmol/L↔mg/dL, HbA1c mmol/mol↔%, or kcal↔kJ. Keeping
       the digits and changing the label under them would be an eighteen-fold
       error that looks entirely reasonable on screen, so the entry goes and the
       reader is told. A product that owns the arithmetic re-renders with its own
       number on `unitEffect: "cleared"` and the reader keeps their entry. */
    if (unconvertible) {
      const reason = refusalReason(unit, next)
      warnDevelopmentOnce(
        "no-conversion:" + unit + ">" + next,
        '[opsinjs] <ReadingInput> cannot convert from "' +
          unit +
          '" to "' +
          next +
          '", so the entry was cleared rather than relabelled. ' +
          (reason ??
            "tokens/units.json carries only conversions that are true by " +
              "definition, and there is no authored factor for this pair.") +
          " Supply the converted value yourself when `onChange` reports " +
          '`unitEffect: "cleared"`, or do not offer this pair in `units`.',
      )
      const cleared = text.map(() => "")
      setEntry({
        text: cleared,
        reported: cleared.map(() => null),
        effect: { kind: "cleared", from: unit, to: next, was: text.join(" / ") },
      })
      emit(cleared, next, "unit", "cleared")
      return
    }

    if (precision === undefined) {
      warnDevelopmentOnce(
        "conversion-without-precision:" + label,
        '[opsinjs] <ReadingInput label="' +
          label +
          '"> converted a reading and has ' +
          "no `precision`, so the result was not rounded and the reader is " +
          "looking at every decimal place the arithmetic produced. There is no " +
          "per-unit default to fall back on: decimal places belong to the " +
          "measurement rather than to the unit. Pass the precision the " +
          "measurement is reported to.",
      )
    }

    const rounded = converted.map((result) =>
      result === undefined || result === null ? null : roundTo(result, precision),
    )
    const nextText = rounded.map(toText)
    setEntry({
      text: nextText,
      reported: rounded,
      effect: { kind: "converted", from: unit, to: next, was: text.join(" / ") },
    })
    emit(nextText, next, "unit", "converted")
  }

  /* THE DESCRIPTION LIST, ASSEMBLED HERE AND MERGED BY BASE UI.
     `Field.Control` runs whatever `aria-describedby` it is given through the
     labelable context, which appends the ids Field registered for the hint and
     the error rather than replacing them. So these four ids are added to that
     list, never substituted for it — verified against `LabelableProvider`, which
     splits the incoming attribute and concatenates.

     The unit is in the DESCRIPTION rather than in the name, so the field
     announces as "Example measurement, edit, 12, in kilograms" and the unit is
     still available to somebody who arrived by touch exploration. In a compound
     reading the hint is here too, because the group's guidance belongs to every
     box in it rather than to the first. */
  const describedBy = [
    unit.trim() === "" ? undefined : unitId,
    compound && hint !== undefined && hint.trim() !== "" ? hintId : undefined,
    warning !== undefined && warning.trim() !== "" ? warningId : undefined,
    effect === null ? undefined : effectId,
  ]
    .filter((id): id is string => id !== undefined)
    .join(" ")

  const unitBlock = (
    <div className="flex shrink-0 items-center" data-slot="reading-input-unit">
      {switchable ? (
        <span className="relative inline-flex items-center">
          <select
            /* The name says what it switches, which is what makes it usable
               from a list of controls: "Unit for Example measurement", not
               "Unit". There is no visible label because the selected option IS
               the visible label — the symbol, on screen, beside the number. */
            aria-label={`Unit for ${label}`}
            aria-describedby={describedBy === "" ? undefined : describedBy}
            className={UNIT_SELECT}
            disabled={disabled}
            onChange={(event) => handleUnit(event.currentTarget.value)}
            value={unit}
          >
            {(units ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {/* Decorative: the select announces itself as a control without it.
              Sized in em so it grows with the reader's own text size rather
              than sitting still while the symbol beside it gets bigger. */}
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-opsin-3 size-[1em]"
          />
        </span>
      ) : (
        /* Hidden from speech only when there is a spoken form to hear instead.
           With no entry in the unit table the symbol stays in the accessibility
           tree: awkward to listen to, and true. */
        <span aria-hidden={spoken !== undefined} className="text-opsin-body">
          {unit}
        </span>
      )}
      {unit.trim() === "" ? null : (
        <span className="sr-only" id={unitId}>
          {spoken === undefined ? unit : `in ${spoken.plural}`}
        </span>
      )}
    </div>
  )

  const boxes = parts.map((part, index) => {
    const control = (
      <Field.Control
        aria-describedby={describedBy === "" ? undefined : describedBy}
        autoComplete="off"
        disabled={disabled}
        enterKeyHint={enterKeyHint}
        inputMode={inputMode}
        name={name === undefined ? undefined : compound ? `${name}-${index}` : name}
        onChange={(event) => handleText(index, event.currentTarget.value)}
        /* `type="text"` and not `type="number"`, deliberately. A number input
           silently discards what it cannot parse — so a reader who types a
           comma on a European keyboard watches their entry disappear with no
           message — it exposes spin buttons the specification refuses as a sole
           means of entry, and it scrolls the value on a trackpad. `inputMode`
           brings up the same keypad without any of that. */
        type="text"
        value={text[index] ?? ""}
      />
    )

    return (
      <div
        className="flex min-w-0 flex-1 flex-col"
        /* The machine-readable reading, and `""` for an absent one. Read off the
           box rather than off the prop, because the box is what is on screen;
           and it is on this wrapper rather than on the input because
           `Field.Control` stamps its own `data-slot` and one element cannot
           carry two. */
        data-opsinjs-value={toText(parseReading(text[index] ?? ""))}
        data-slot="reading-input-segment"
        key={part.label + String(index)}
      >
        {compound ? (
          /* Each part is its own Field, so each box has its own visible,
             persistent, programmatically associated label. The group's name is
             the legend above them; the part's name is here. That is what makes
             a compound reading announce as its group and then its part, rather
             than as two unrelated numbers. */
          <Field label={part.label}>{control}</Field>
        ) : (
          control
        )}
      </div>
    )
  })

  const warningBlock =
    warning === undefined || warning.trim() === "" ? null : (
      /* NOT `Field`'s `error` PROP, and that is the whole design of this part.
         `error` marks the control invalid, and an invalid control is a control a
         form refuses to submit and a screen reader announces as wrong. This
         sentence is advisory: the product thinks the number might be a typing
         mistake, and it might equally be a true reading that matters precisely
         because it is unusual. So it is a description, in the ordinary
         foreground colour, with no glyph, no status colour and no aria-invalid
         anywhere near it. Nothing here moves focus and nothing here blocks. */
      <p className="m-0 text-opsin-body text-foreground" data-slot="reading-input-warning" id={warningId}>
        {warning}
      </p>
    )

  const effectBlock =
    effect === null ? null : (
      /* WHAT HAPPENED TO THE TYPED VALUE, ON SCREEN. The specification is
         explicit that a unit switch must never silently convert and never
         silently keep the digits, and that whichever it does it has to say so.
         These two sentences are the only reader-facing copy this component owns,
         and there is no prop to translate them — a real gap, listed on the page
         rather than hidden here.

         It is NOT a live region. The substrate contract forbids a component
         mounting one on the caller's behalf, so this joins the description of
         every control on the row and is read when focus reaches one, rather than
         interrupting. What that costs is on the page too. */
      <p
        className="m-0 text-opsin-body text-muted-foreground"
        data-slot="reading-input-effect"
        id={effectId}
      >
        {effect.kind === "converted"
          ? `Converted from ${effect.was} ${effect.from}.`
          : `Cleared — enter the reading again in ${effect.to}.`}
      </p>
    )

  if (!compound) {
    return (
      <div className={cn("w-full", className)} data-slot="reading-input">
        <Field hint={hint} label={label} optionality={optionality}>
          <div className={CONTROL_ROW} data-slot="reading-input-control">
            {boxes}
            {unitBlock}
          </div>
          {warningBlock}
          {effectBlock}
        </Field>
      </div>
    )
  }

  return (
    /* A real `<fieldset>` and a real `<legend>`, because a compound reading is
       one measurement made of separately-typable parts and that is the only
       native construct that says so. The browser resets are explicit: a fieldset
       ships with a border, padding and a `min-inline-size: min-content` that
       stops it shrinking inside a flex column. */
    <fieldset
      className={cn("m-0 w-full min-w-0 border-0 p-0", className)}
      data-slot="reading-input"
      disabled={disabled}
    >
      <legend
        className="mb-opsin-2 p-0 text-opsin-headline text-foreground"
        data-slot="reading-input-legend"
      >
        {label}
      </legend>
      {hint === undefined || hint.trim() === "" ? null : (
        <p
          className="m-0 mb-opsin-2 text-opsin-body text-muted-foreground"
          data-slot="reading-input-hint"
          id={hintId}
        >
          {hint}
        </p>
      )}
      <div className={CONTROL_ROW} data-slot="reading-input-control">
        {boxes}
        {unitBlock}
      </div>
      {warningBlock}
      {effectBlock}
    </fieldset>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the state a reading input
 * spends most of its life in — empty, with the unit already on screen — and the
 * one behaviour worth watching: switch to °F and the number converts by the
 * definition of the Fahrenheit scale, with a line underneath saying it did.
 *
 * The measurement is fictional and the numbers are deliberately unreal (ADR
 * 0012). °C and °F are the units, because the pair is an exact definitional
 * conversion this system owns, and no value anybody types into it can be
 * mistaken for a body temperature at the scale it starts on.
 *
 * There is no `warning` here and there is no bound anywhere in this file to
 * produce one. Deciding that a number looks like a typing mistake needs bounds,
 * bounds are clinical, and opsinjs ships none — for any metric, in any
 * population, including in a demo.
 */
export default function ReadingInputDemo() {
  const [reading, setReading] = useState<number | null>(null)
  const [unit, setUnit] = useState("°C")

  return (
    <div className="w-full max-w-md">
      <ReadingInput
        hint="Whole numbers or one decimal place."
        label="Example measurement"
        name="example-measurement"
        onChange={(next) => {
          setReading(next.value)
          setUnit(next.unit)
        }}
        precision={1}
        unit={unit}
        units={["°C", "°F"]}
        value={reading}
      />
    </div>
  )
}
