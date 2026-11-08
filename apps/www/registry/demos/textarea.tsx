import { Textarea } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It renders one
 * uncontrolled box with an `aria-label` and a plain-language prompt, so the one
 * thing worth seeing at a glance is clear: the box wears the same border,
 * radius and type step as the input beside it rather than the browser's grey
 * default, and it resizes on the vertical axis. The prompt and the starting
 * text are fictional and carry no reading, no unit and no clinical word (ADR
 * 0012).
 */
export default function TextareaDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-2">
      <label
        htmlFor="textarea-demo"
        className="text-opsin-headline [color:var(--foreground)]"
      >
        Anything you want to add?
      </label>
      <Textarea
        id="textarea-demo"
        name="textarea-demo"
        placeholder="A sentence or two is plenty."
        defaultValue=""
      />
    </div>
  )
}
