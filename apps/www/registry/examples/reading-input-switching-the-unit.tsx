"use client"

/**
 * The unit switch, and the sentence that has to follow it.
 *
 * SWITCH IT AND WATCH THE LINE UNDERNEATH. Changing the unit here converts
 * the entered value and says so. The line underneath reads *Converted from
 * 10 kg.* The specification is blunt about why: a switch must never silently
 * change the stored value and must never silently keep the typed digits,
 * because both behaviours are right in some real situation and the reader is
 * the only person who knows which one this is. Whichever happens, they are
 * told.
 *
 * THE FACTORS ARE DEFINITIONS, NOT MEASUREMENTS. kg, lb and st convert
 * through `tokens/units.json`. It carries the 1959 international pound, which
 * fixes one pound at exactly 0.45359237 kg and one stone at exactly fourteen
 * pounds, and it carries nothing that was arrived at by measuring something.
 * That is the whole test for whether a conversion may live in this system,
 * and it is why mmol/L and mg/dL are not in that list: their factor is the
 * molar mass of the substance being measured, which is a property of the
 * substance rather than of either unit.
 *
 * `precision` IS WHY THE RESULT IS READABLE. It is the decimal places of the
 * MEASUREMENT, which is what the instrument resolves, or what the laboratory
 * reports. `unit-systems` rule 6 says to round after conversion at the
 * destination's precision and to accept that the round trip is lossy. Take
 * it away and 10 kg becomes 22.046226218487757 lb, which is the honest
 * arithmetic and is unusable. There is no per-unit default anywhere in
 * opsinjs to fall back on: decimal places belong to the measurement, not to
 * the unit.
 *
 * NOTE WHAT THE UNIT IS NOT. It is not in the label, and it is not a
 * placeholder. A reader who thinks in pounds and meets a field labelled
 * "Weight (kg)" types pounds, and nothing on screen stops them or records what
 * they meant. It is a control beside the number, at the same 44px floor as
 * everything else, with a name that says what it switches.
 *
 * The measurement is fictional and the number is deliberately unreal: 10 kg is
 * nobody's weight, and the label names no real measurement at all.
 */

import { useState } from "react"

import { ReadingInput } from "@/registry/base-lyra/ui/reading-input"

export default function ReadingInputSwitchingTheUnit() {
  const [reading, setReading] = useState<number | null>(10)
  const [unit, setUnit] = useState("kg")

  return (
    <div className="w-full max-w-md">
      <ReadingInput
        hint="To one decimal place."
        label="Example measurement"
        name="example-measurement"
        onChange={(next) => {
          setReading(next.value)
          setUnit(next.unit)
        }}
        precision={1}
        unit={unit}
        units={["kg", "lb", "st"]}
        value={reading}
      />
    </div>
  )
}
