"use client"

/**
 * The default `validateOn` actually firing, which needs the one thing no other
 * example on the page mounts: Base UI's `<Field.Form>`.
 *
 * Field defaults `validateOn` to `submit-then-change`, and that default has a
 * catch the name hides. Base UI maps it to `onSubmit`, and `onSubmit` is gated
 * on a flag that only Base UI's own Form primitive ever sets. Inside a plain
 * `<form>` the control's own constraints are checked on Enter in a text input
 * and at no other moment, so a reader who fills nothing and presses the submit
 * button gets no in-page message at all. Wrapping the fields in `<Field.Form>`
 * is what makes the default fire on submit, and this is the only example that
 * does it. Without this wrapper there is nothing on the page that shows the
 * default working, which is exactly the gap the page has been admitting.
 *
 * WHAT TO WATCH. Press Save with a field empty. The message that appears in the
 * error slot is the browser's own sentence, not opsinjs copy, because neither
 * Field here passes `error`. Then type into that field and watch the message
 * clear on the next change, which is the "then-change" half of the mode. Watch
 * the focus too: on submit Base UI's `Field.Form` moves focus to the first
 * invalid control and selects its text, so the reader is put straight into the
 * field they need to fix. That is `Field.Form` doing it, not `Field`, which
 * moves focus nowhere. The page does not navigate away, because `Field.Form`
 * calls `preventDefault()` on the native submit event whenever an `onFormSubmit`
 * handler is present.
 *
 * WHY THIS IS THE BRANCH THE PAGE CALLS "ALMOST NEVER APPEARS". A shipped
 * product should pass `error` with its own words, which marks the control
 * invalid directly and never goes through a validation mode at all. The reason
 * to prefer that path is on show here: the fallback speaks in the browser's
 * tone rather than the product's, and it says "Please fill in this field"
 * rather than a sentence written for the person reading it. This example exists
 * to prove the default is not inert, and to make the case for reaching past it.
 *
 * The labels are deliberately unreal (ADR 0012) and nothing here is a
 * measurement anybody could mistake for their own. Neither hint shows a run of
 * digits, so neither control raises a number pad with `inputMode`. Both carry
 * `autoComplete="off"` because these fields collect nothing real, and the same
 * "do not copy this value" note the other examples carry applies: replace it
 * with the token for whatever you are actually asking for.
 */

import { Button } from "@/registry/base-lyra/ui/button"
import { Field } from "@/registry/base-lyra/ui/field"

export default function FieldValidatingOnSubmit() {
  return (
    <Field.Form
      className="flex w-full max-w-md flex-col gap-opsin-6"
      onFormSubmit={() => {
        /* Stops the browser navigating so the demo stays on the page. Base UI
           calls preventDefault() on the native event once this handler is set,
           so there is nothing to call here; a real product would send the
           values from this handler instead. */
      }}
    >
      <Field label="Example name" hint="For example, a nickname for this entry">
        <Field.Control name="example-name" required autoComplete="off" />
      </Field>

      <Field
        label="Example note"
        hint="Anything you want to remember about this entry"
      >
        <Field.Control name="example-note" required autoComplete="off" />
      </Field>

      <Button type="submit" variant="primary" fullWidth>
        Save
      </Button>
    </Field.Form>
  )
}
