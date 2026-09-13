/**
 * Mark the exception, not the rule.
 *
 * Four fields, three of them needed and one not, so the one that is optional is
 * the one that carries a marker. The reverse form puts a marker on every field
 * except one. It says the same thing four times and leaves the reader counting
 * asterisks to work out which field is the odd one.
 *
 * The sentence above the fields is doing real work and is not decoration. A
 * marker is only information if the reader knows what the unmarked state means,
 * and that is a claim about the whole form rather than about any one field, so
 * no Field can make it. It is the caller's line to write, which is why
 * `optionality` marks in words rather than shipping a symbol and a legend.
 *
 * `autoComplete` and `inputMode` are set here rather than by the component. The
 * right token depends on what is being asked for, and a component that guessed
 * would put somebody's postcode in a field asking for something else.
 *
 * Do not copy the VALUE. `autocomplete="off"` is the opt-out of the win the
 * accessibility contract names, which is the reader's own stored details
 * filling the field. It is used here only because these fields collect
 * nothing real, so any genuine token would be a made-up answer to a made-up
 * question. A real form names a real token. `inputMode` is omitted on the
 * note for a different reason: it is free text, and the default keyboard is
 * the right one.
 */

import { Field } from "@/registry/base-lyra/ui/field"

export default function FieldMarkingTheException() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-5">
      <p className="m-0 text-opsin-body text-muted-foreground">
        We need all of these unless the field says otherwise.
      </p>

      <Field label="Example measurement" hint="For example, 14.">
        <Field.Control
          name="example-measurement"
          inputMode="decimal"
          autoComplete="off"
        />
      </Field>

      <Field label="Example date" hint="For example, 27 3 1985.">
        <Field.Control
          name="example-date"
          inputMode="numeric"
          autoComplete="off"
        />
      </Field>

      <Field label="Example time" hint="For example, 9 15 in the morning.">
        <Field.Control name="example-time" inputMode="numeric" autoComplete="off" />
      </Field>

      <Field
        label="Example note"
        optionality="optional"
        hint="Anything you want to remember about this entry."
      >
        <Field.Control name="example-note" autoComplete="off" />
      </Field>
    </div>
  )
}
