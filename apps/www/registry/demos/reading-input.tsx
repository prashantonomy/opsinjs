"use client"

import { useState } from "react"
import { ReadingInput } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the state a
 * reading input spends most of its life in, which is empty, with the unit
 * already on screen. It also shows the one behaviour worth watching: switch to
 * °F and the number converts by the definition of the Fahrenheit scale, with a
 * line underneath saying it did.
 *
 * The measurement is fictional and the numbers are deliberately unreal (ADR
 * 0012). °C and °F are the units, because the pair is an exact definitional
 * conversion this system owns, and no value anybody types into it can be
 * mistaken for a body temperature at the scale it starts on.
 *
 * There is no `warning` here and there is no bound anywhere in this file to
 * produce one. Deciding that a number looks like a typing mistake needs bounds,
 * bounds are clinical, and opsinjs ships none. That holds for any metric, in
 * any population, including in a demo.
 */
export default function ReadingInputDemo() {
  const [reading, setReading] = useState<number | null>(null)
  const [unit, setUnit] = useState("°C")

  return (
    <div className="w-full max-w-md">
      <ReadingInput
        hint="Whole numbers or one decimal place"
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
