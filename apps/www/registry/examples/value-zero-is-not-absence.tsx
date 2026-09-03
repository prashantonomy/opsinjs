/**
 * The distinction this component exists to hold: zero is a reading and a
 * missing reading is not zero.
 *
 * Both rows below are handed the same unit and the same precision. The only
 * difference is that one has a number and the other has `null`, and the
 * difference in what a reader is told is total: the first says a measurement
 * was taken and came to zero, the second says no measurement was taken at all.
 * A `null` coerced to `0` — which is what a nullish default gives you for free —
 * turns the second sentence into the first, silently, in a place nobody looks.
 *
 * The absence is an em dash AND words. The em dash alone is what most systems
 * ship and it is not enough: speech synthesis either skips it or reads it out
 * as "dash", and a reader who is listening rather than looking is told nothing.
 *
 * THE NOTE IS A SECOND <dd>, NOT A <p> BESIDE ONE. A `dl` laid out with `div`
 * wrappers may hold only `dt` and `dd` inside each wrapper — a paragraph there
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
]

export default function ValueZeroIsNotAbsence() {
  return (
    <dl className="m-0 flex w-full max-w-md flex-col gap-opsin-4 p-0 text-opsin-body">
      {ROWS.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[1fr_auto] items-baseline gap-x-opsin-4 border-b border-border pb-opsin-2"
        >
          <dt className="m-0">{row.label}</dt>
          <dd className="m-0 text-right">
            <Value value={row.value} unit="steps" precision={0} />
          </dd>
          {/* The same term, defined a second time in words. Spanning both
              columns keeps the sentence on the reading measure rather than
              squeezed into the width of the number beside it. */}
          <dd className="col-span-2 m-0 mt-opsin-1 text-opsin-footnote text-muted-foreground">
            {row.note}
          </dd>
        </div>
      ))}
    </dl>
  )
}
