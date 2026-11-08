import { Field } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the three
 * states that decide whether this component is worth having: a field with
 * guidance, a field whose exception is marked, and a field with an error. With
 * the error, the point is what has NOT happened, because the hint is still
 * there underneath it.
 *
 * The labels are deliberately unreal (ADR 0012). Nothing here is a measurement
 * anybody could mistake for their own. The third field ships filled and invalid
 * on purpose: it holds a year nobody has lived in, so no reader mistakes it for
 * real data, and it carries a standing error precisely so the page can show the
 * hint holding its place underneath rather than being swapped out for the
 * message.
 *
 * `autoComplete="off"` is the one thing here NOT to copy. The accessibility
 * contract wants the reader's own stored details to be able to fill the field,
 * and `off` is the opt-out; it is used here because these fields collect
 * nothing real and a token like `bday` on "Example measurement" would be a
 * made-up answer to a made-up question. Replace it with the token for whatever
 * you are actually asking for. `inputMode` raises the number pad only where the
 * answer is digits, or digits and a single separator: `decimal` for a
 * measurement, which allows one separator, and `numeric` for a four-digit year,
 * which is digits alone. It is omitted on the free-text note, where the default
 * keyboard is the right one. A whole date is never asked for in one control here,
 * because a numeric pad cannot type the separators a date needs.
 */
export default function FieldDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-6">
      <Field label="Example measurement" hint="For example, 14">
        <Field.Control
          name="example-measurement"
          inputMode="decimal"
          autoComplete="off"
        />
      </Field>

      <Field
        label="Example note"
        optionality="optional"
        hint="Anything you want to remember about this entry"
      >
        <Field.Control name="example-note" autoComplete="off" />
      </Field>

      <Field
        label="Example year"
        hint="For example, 1985"
        error="Enter a year in the past."
      >
        <Field.Control
          name="example-year"
          inputMode="numeric"
          autoComplete="off"
          defaultValue="2087"
        />
      </Field>
    </div>
  )
}
