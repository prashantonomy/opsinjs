/**
 * The claim on the page that is easiest to state and hardest to hold: an error
 * appears IN ADDITION to the hint, never instead of it.
 *
 * The same field twice, before and after. Almost every hand-rolled form swaps
 * one for the other, because the markup is simpler and the column is shorter.
 * The result is that at the exact moment a reader has got something wrong, the
 * sentence that would have told them the right shape disappears. They are then
 * expected to work out the format from a message about the format being wrong.
 *
 * Nothing here is coloured. A mistyped year is not a clinical status, and the
 * red that means "this reading needs a decision" is not available to say "check
 * that number". The error is carried by a glyph, the left rule down the invalid
 * field, the emphasis shadow on the control and the words.
 */

import { Field } from "@/registry/base-lyra/ui/field"

export default function FieldErrorKeepsTheHint() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-8">
      <div className="flex flex-col gap-opsin-2">
        <p className="m-0 text-opsin-footnote text-muted-foreground">Before</p>
        <Field label="Example year" hint="For example, 1985">
          <Field.Control
            name="before"
            inputMode="numeric"
            autoComplete="off"
            defaultValue="2087"
          />
        </Field>
      </div>

      <div className="flex flex-col gap-opsin-2">
        <p className="m-0 text-opsin-footnote text-muted-foreground">After</p>
        <Field
          label="Example year"
          hint="For example, 1985"
          error="Enter a year in the past."
        >
          <Field.Control
            name="after"
            inputMode="numeric"
            autoComplete="off"
            defaultValue="2087"
          />
        </Field>
      </div>
    </div>
  )
}
