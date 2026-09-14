/**
 * The distinction this component exists to hold: zero is a reading and a
 * missing reading is not zero.
 *
 * All three rows below are handed the same unit and the same precision. What
 * differs is the reading: one has a number, one has `null`, and one has a
 * number that did not survive the trip. The difference in what a reader is told
 * is total. The first says a measurement was taken and came to zero, the second
 * says no measurement was taken at all, and the third says a measurement was
 * taken and arrived broken. A nullish default coerces `null` to `0` for free,
 * and that turns the second sentence into the first, silently, in a place
 * nobody looks, which is why the first two must not be allowed to collapse.
 *
 * The absence is words and nothing else. A punctuation mark on its own is what
 * most systems ship and it is not enough: speech synthesis either skips it or
 * reads it out as punctuation, and a reader who is listening rather than
 * looking is told nothing. Nothing precedes the words here.
 *
 * THE THIRD ROW IS THE FAILURE FORM, and it is the one place a reviewer can see
 * it on screen. A non-finite reading is neither zero nor an absence: something
 * was measured and the number did not survive the trip, so the words differ
 * again. That row emits a development warning on purpose. The warning is the
 * component reporting a defect on the caller's side, not a fault in the example,
 * and it is exactly why this state lives in an example rather than in the
 * zero-prop demo, which is public shipped code kept free of states that
 * complain.
 *
 * THE NOTE IS A SECOND <dd>, NOT A <p> BESIDE ONE. A `dl` laid out with `div`
 * wrappers may hold only `dt` and `dd` inside each wrapper. A paragraph there
 * is outside the content model, and what a screen reader then announces as the
 * item count and as the term/definition pairing depends on each engine's error
 * recovery rather than on the specification. The note is the sentence that
 * carries this example's whole meaning, so it is the last thing that should be
 * left floating: it is a definition of the same term, and it says so.
 */

import { Value } from "@/registry/base-lyra/ui/value"

const ROWS = [
  {
    label: "First example measurement",
    value: 0 as number | null,
    note: "A measurement was taken. It came to zero.",
  },
  {
    label: "Second example measurement",
    value: null as number | null,
    note: "No measurement has been taken. Nothing is being claimed about it.",
  },
  {
    label: "Third example measurement",
    value: Number.NaN,
    note: "A measurement exists and did not survive the trip. This is a failure rather than an absence, and it says so in different words.",
  },
]

export default function ValueZeroIsNotAbsence() {
  return (
    <dl className="m-0 flex w-full max-w-md flex-col gap-opsin-4 p-0 text-opsin-body">
      {ROWS.map((row) => (
        /* Label and reading share a line while there is room, and stack when
           there is not. A fixed two-column grid could not do this: a `1fr`
           track never shrinks below the widest word of the label, so at 200%
           text on a narrow phone the label column plus the reading column ran
           past the viewport and pushed the whole page sideways. A wrapping flex
           row lets the reading fall onto its own line instead, held to the
           right by `ml-auto` so a column of numbers still lines up. The join
           between a number and its unit is left alone, because that join is a
           no-break space inside Value and is never the thing that wraps. */
        <div
          key={row.label}
          className="flex flex-wrap items-baseline gap-x-opsin-4 gap-y-opsin-1 border-b border-border pb-opsin-2"
        >
          <dt className="m-0 min-w-0 flex-auto">{row.label}</dt>
          <dd className="m-0 ml-auto text-right">
            <Value value={row.value} unit="steps" precision={0} />
          </dd>
          {/* The same term, defined a second time in words. It takes the full
              width of its own line so the sentence stays on the reading measure
              rather than being squeezed into the width of the number beside
              it. */}
          <dd className="basis-full m-0 text-opsin-footnote text-muted-foreground">
            {row.note}
          </dd>
        </div>
      ))}
    </dl>
  )
}
