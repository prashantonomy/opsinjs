/**
 * A reading made of two numbers.
 *
 * This is the example that exists because of a contradiction in the
 * specification. The proposed interface let `value` be a string so that a pair
 * could be passed as "128/78", while the part tree routed every reading through
 * `Value`, whose value is a number or nothing. A string cannot be rounded to
 * the measurement's precision, cannot be shaped for a locale, cannot have its
 * unit spoken and cannot be published as a machine-readable datum — so the pair
 * is a list of numbers instead, each of which is a real `Value` and gets all
 * four.
 *
 * WHAT THE READER SEES AND WHAT A LISTENER HEARS ARE DIFFERENT, ON PURPOSE. On
 * screen the two numbers are separated by a solidus and the unit is printed
 * once, which is how the measurement is written. Read aloud, each part is named
 * and each number keeps its own spoken unit, because a solidus is either
 * skipped by speech synthesis or said as "slash" and neither of those is the
 * measurement.
 *
 * The labels here are placeholders for the words a product would use. opsinjs
 * does not know which measurements are compound or what their parts are called,
 * and a built-in list of them would be a clinical vocabulary shipped as a
 * default. The numbers keep the unit and are nothing anybody would act on.
 */

import { ResultCard } from "@/registry/base-lyra/ui/result-card"

const EXAMPLE_NOW = "2026-03-14T11:12:00+00:00"

export default function ResultCardACompoundReading() {
  return (
    <div className="w-full max-w-lg">
      <ResultCard
        title="Example paired measurement"
        segments={[
          { label: "first part", value: 12 },
          { label: "second part", value: 8 },
        ]}
        unit="mmHg"
        precision={0}
        measuredAt="2026-03-14T07:40:00+00:00"
        now={EXAMPLE_NOW}
        category="heart"
        meaning="A pair is one measurement and is shown as one. There is no bar underneath it: two numbers have no single position on one line, and drawing one would mean choosing which half of the reading the picture is about."
        provenance="Example provenance — the two parts came from one measurement, taken by one device."
      />
    </div>
  )
}
