"use client"

/**
 * Two numbers that are one measurement, entered under one name.
 *
 * THE SHAPE IS THE EXAMPLE. `segments` turns the field into a real `<fieldset>`
 * with a `<legend>`, and each part into its own `<Field>` with its own visible,
 * persistent label. So the group has a name, each box has a name, and a listener
 * hears "Example measurement, First part, edit" rather than two unrelated
 * numbers on a row.
 *
 * WHY ENTRY LOOKS DIFFERENT FROM DISPLAY, which is the thing worth taking
 * away. `health/numbers-units-precision` rule 11 says a compound value is
 * written in its conventional form, which is one string with a solidus, not
 * two fields. That rule is about DISPLAY, where ResultCard obeys it. This
 * is entry, where `patterns/forms/units-and-numeric-entry` requires the
 * opposite: separate fields under one legend. Asking somebody to type a
 * solidus is asking them to format their own record, and a single box cannot
 * tell you which half is missing when only one number arrives.
 *
 * The unit belongs to the whole group and is shown once, after the last box.
 * Both parts of a compound reading are in the same unit by definition; a pair in
 * two different units is two measurements.
 *
 * WHAT COMES BACK IS A ResultCard's `segments`. `onChange` hands over the same
 * `{ label, value }[]` shape ResultCard and MetricTile already take, so what was
 * typed here goes straight to the surface that displays it with no mapping step
 * in between. That is the only reason the two components agree on a shape.
 *
 * The measurement is fictional and the numbers are deliberately unreal. The
 * parts are "First part" and "Second part" rather than the names of a real
 * paired reading, because a real name beside a number is a screenshot somebody
 * can mistake for their own result.
 */

import { useState } from "react"

import { ReadingInput, type ReadingSegment } from "@/registry/base-lyra/ui/reading-input"

export default function ReadingInputACompoundReading() {
  const [parts, setParts] = useState<ReadingSegment[]>([
    { label: "First part", value: 10 },
    { label: "Second part", value: 20 },
  ])

  return (
    <div className="w-full max-w-md">
      <ReadingInput
        hint="Both parts, in whole numbers."
        label="Example measurement"
        name="example-measurement"
        onChange={(next) => setParts(next.segments)}
        segments={parts}
        unit="mmHg"
      />
    </div>
  )
}
