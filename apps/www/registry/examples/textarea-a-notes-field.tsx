/**
 * A standalone notes field, the case Textarea was built for. It is not inside a
 * Field here, so it names itself with `aria-label`: a screen-reader user hears
 * the prompt before the empty box rather than meeting a box with no idea what to
 * write in it. The placeholder is an example of the kind of thing to write, not
 * the prompt itself, because a placeholder disappears the moment somebody types.
 * The prompt and the placeholder are fictional and carry no reading or clinical
 * word (ADR 0012).
 */

import { Textarea } from "@/registry/base-lyra/ui/textarea"

export default function TextareaANotesField() {
  return (
    <div className="w-full max-w-md">
      <Textarea
        aria-label="Anything you want to add?"
        placeholder="A sentence or two is plenty."
        rows={4}
      />
    </div>
  )
}
