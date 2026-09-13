/**
 * `Field.Control` is a real export, and this is the reason it has to be.
 *
 * Everywhere else in opsinjs a part is internal structure named by `data-slot`,
 * because the content arrives as a prop. A control cannot: it has a type, a
 * name, an `autocomplete` token, an `inputmode`, a value and a change handler,
 * and no single prop carries that. So the slot is a component. Its `render`
 * prop puts the same generated id, the same `aria-describedby` and the same
 * invalid state onto an element opsinjs does not ship.
 *
 * A textarea and a select below. Both get the label relationship, both get the
 * hint in their description, and neither needed an id written by hand. The
 * point of the second one is that the wiring survives a control with its own
 * children.
 */

import { Field } from "@/registry/base-lyra/ui/field"

export default function FieldWithAnotherControl() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-6">
      <Field
        label="Example note"
        optionality="optional"
        hint="A few words is plenty. There is no length this has to reach."
      >
        <Field.Control
          render={<textarea rows={3} />}
          name="example-note"
          autoComplete="off"
        />
      </Field>

      <Field
        label="Example choice"
        hint="Pick whichever is closest. You can change it later."
      >
        <Field.Control render={<select />} name="example-choice" defaultValue="">
          <option value="">Choose one</option>
          <option value="first">First example option</option>
          <option value="second">Second example option</option>
          <option value="third">Third example option</option>
        </Field.Control>
      </Field>
    </div>
  )
}
