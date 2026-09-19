/**
 * A notes field with a length ceiling. `maxLength` caps the text at two hundred
 * characters, and the footnote below the box states the limit in words, because
 * the native attribute refuses the next keystroke in silence and a reader stopped
 * mid-word with no warning has been let down by the box. The field names itself
 * through a real `<label htmlFor>` pointed at the box's `id`, which is the other
 * honest way to label a standalone Textarea. The prompt and the limit are
 * fictional and carry no reading or clinical word (ADR 0012).
 */

import { Textarea } from "@/registry/base-lyra/ui/textarea"

export default function TextareaWithACharacterLimit() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-2">
      <label
        htmlFor="textarea-limit"
        className="text-opsin-headline [color:var(--foreground)]"
      >
        Add a short note
      </label>
      <Textarea
        id="textarea-limit"
        name="short-note"
        maxLength={200}
        rows={3}
        placeholder="Keep it brief."
      />
      <p className="m-0 text-opsin-footnote [color:var(--muted-foreground)]">
        Up to 200 characters.
      </p>
    </div>
  )
}
