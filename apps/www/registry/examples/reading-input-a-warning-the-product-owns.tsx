"use client"

/**
 * A sentence the product wrote about a number, and everything the field does not
 * do about it.
 *
 * THE COMPARISON IS THE PRODUCT'S, AND IT IS NOT IN THIS FILE EITHER. There
 * is no `plausible` prop on ReadingInput and no bound anywhere in it. There
 * is none here, either, and that is the more interesting half: an example
 * that compared a reading against a number would be opsinjs shipping a
 * plausibility bound, and those are forbidden for any metric in any
 * population. That prohibition includes examples, and it holds however the
 * constant is named. So this example shows the component's side of the
 * contract and stops exactly where the clinical decision starts. In a real
 * product the sentence below is produced by comparing the entry against
 * bounds that product owns; here it appears as soon as there is anything in
 * the box.
 *
 * WHAT IT GUARANTEES ONCE YOU PASS ONE. The sentence is tied to the control's
 * description, so a screen reader reaches it. It does NOT mark the field
 * invalid, so a form will still submit. It does not move focus, it does not
 * clear the box, and it does not change a digit. Clear the box and it goes;
 * leave it and the reading is saved exactly as typed. Real readings fall
 * outside plausible ranges, and that is often precisely when they matter most.
 * The reader therefore always wins the argument.
 *
 * NO STATUS COLOUR, AND THAT IS DELIBERATE. The four clinical levels say how
 * much attention a READING needs. A field that turned amber while somebody was
 * still typing would be delivering a verdict before anyone had checked whether
 * the number was even right, and it would teach a reader that the colour meaning
 * "this measurement needs a decision" also means "you may have mistyped". The
 * warning is a paragraph in the ordinary foreground colour, and there is no
 * `data-status` on this surface at all.
 *
 * THE SENTENCE OFFERS NO CORRECTED NUMBER, and a real product's should. The
 * guidance is to ask a question and offer the likely fix, such as *did you
 * mean 128?* But any number suggested here would be a plausible reading
 * shipped by opsinjs. So the tone is the part to copy: a question, a reason,
 * no blame and no word that tells somebody they have made a mistake, because
 * most of the time they have not.
 *
 * The measurement is fictional and 1400 kg is nobody's anything.
 */

import { useState } from "react"

import { ReadingInput } from "@/registry/base-lyra/ui/reading-input"

export default function ReadingInputAWarningTheProductOwns() {
  const [reading, setReading] = useState<number | null>(1400)

  return (
    <div className="w-full max-w-md">
      <ReadingInput
        hint="To one decimal place"
        label="Example measurement"
        name="example-measurement"
        onChange={(next) => setReading(next.value)}
        unit="kg"
        value={reading}
        warning={
          reading === null
            ? undefined
            : "That is a long way above most readings. It is worth checking the number before you save it."
        }
      />
    </div>
  )
}
