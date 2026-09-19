/**
 * Textarea is a styled multi-line text input: a plain HTML `<textarea>` wearing
 * the opsinjs tokens, for a free-text note a reader writes in their own words.
 *
 * IT IS A NATIVE ELEMENT, NOT A BASE UI PRIMITIVE, AND THAT IS THE WHOLE REASON
 * IT EXISTS. Base UI ships no textarea, because a multi-line box has no roving
 * focus, no popup and no composite behaviour for a primitive to own. What it
 * lacked was the tokens: left to the browser it draws a grey box in the system
 * font at a pixel size, off every scale the rest of the system keeps. So this
 * component is not a wrapper around a primitive, it is the native control with
 * the border, the radius, the type step, the padding and the focus ring pulled
 * onto the opsinjs axes, and nothing more. A consumer who reaches for the raw
 * element gets the browser default; a consumer who reaches for this one gets a
 * box that matches the input beside it.
 *
 * IT IS A SERVER COMPONENT, BECAUSE A TEXT BOX HAS NO STATE TO HYDRATE OF ITS
 * OWN. It carries no `"use client"` directive and calls no hook: it holds no
 * selection, opens no layer and reads no ref. The value lives with the caller,
 * as `value` and `onChange` for a controlled box or `defaultValue` for an
 * uncontrolled one, exactly as the native element hands it over. Rendered in a
 * server tree it ships no JavaScript; rendered inside a caller's client form it
 * takes their change handler like any other element, so it is a server
 * component in the sense that matters, it adds no client boundary of its own.
 *
 * IT NEEDS AN ACCESSIBLE NAME, AND IT WILL NOT INVENT ONE. A textarea with no
 * name is a box a screen-reader user meets with no idea what to write in it.
 * There are two honest ways to give it one, and this component takes neither for
 * granted. Inside a [Field](./field.mdx) the field's label is the name and the
 * textarea is simply the control, so nothing extra is needed. Standalone, pass
 * `aria-label` with the prompt, or give the box an `id` and point a real
 * `<label htmlFor>` at it. When none of `aria-label`, `id` or `name` is present
 * a development warning names the gap rather than letting an unlabelled box
 * ship, because a placeholder is not a label and disappears the moment somebody
 * types.
 *
 * IT TAKES NEITHER COLOUR AXIS, INCLUDING FOR VALIDITY. A note is content the
 * reader writes, not a measurement and not a status, so the box draws only
 * neutral chrome and carries neither `data-status` nor `data-category`. The
 * trap worth naming is validity: it is tempting to paint an invalid box in the
 * urgent red, but that red is the clinical status axis, and a form error is not
 * a clinical level. So `invalid` sets `aria-invalid` and leaves the border on
 * the neutral `--border` role. The message that tells the reader what to fix is
 * Field's to own and to place, beside the label, in words a reader can read
 * whether or not they can see the colour.
 *
 * THE INTERFACE IS CURATED ON PURPOSE. It is not `ComponentProps<"textarea">`
 * and not a spread of every HTML attribute a textarea will accept: it names the
 * dozen props a note field actually uses, each with a line on what it is for, so
 * the prop table reads as a short list of decisions rather than the whole DOM
 * surface. The named props are spread onto the element, so a `name`, a
 * `maxLength` or an `autoComplete` token reaches the box unchanged, but the
 * shape a consumer reads is the curated one.
 */

import type { ChangeEventHandler, FocusEventHandler } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The box, spelled once.
 *
 * `min-h-` floors the height at the 44pt target minimum in rem, so a box a
 * reader has dragged shorter still clears the touch floor and grows with their
 * text size, while `rows` sets the resting height. `resize-y` keeps the reader's
 * grip on the vertical axis and takes away the horizontal one, because a box
 * that widens past its column breaks the layout it sits in rather than helping.
 *
 * The ink is the arbitrary property `[color:var(--foreground)]` and not
 * `text-foreground`, for the reason `field.tsx` records at length: tailwind-merge
 * files a `text-*` colour in the same conflict group as the `text-opsin-*` type
 * step and silently drops one of them. The arbitrary property lands in the
 * `color` group instead, so the ink and the size both survive. The placeholder
 * ink is the same trick against the muted role, so a hint sits quieter than the
 * text a reader types over it.
 *
 * A disabled box takes the muted surface and the not-allowed cursor rather than
 * an opacity wash: `opacity` would composite the text and the fill together and
 * drift both towards the page, which is the contrast trap the sibling controls
 * record, whereas the muted fill reads as unavailable while the words stay
 * legible. The focus ring is carried here rather than left to the product
 * stylesheet, so a project installed without that sheet does not lose it.
 */
const TEXTAREA =
  "block w-full min-h-(--opsin-target-minimum,2.75rem) resize-y " +
  "rounded-opsin-md border border-border bg-background " +
  "px-opsin-3 py-opsin-2 text-opsin-body [color:var(--foreground)] " +
  "placeholder:[color:var(--muted-foreground)] " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "disabled:cursor-not-allowed disabled:bg-muted " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] " +
  "focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and a note field asserts nothing
 * clinical. `divider.tsx` and `segmented-control.tsx` keep the same small set
 * for the same reason, and minting a real code is not this file's to do.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface TextareaProps {
  /**
   * The current text, for a controlled box. Pass it with `onChange` and the
   * caller owns the value; pass `defaultValue` instead and the box owns it.
   * Passing both makes the box controlled and the default is ignored, which is
   * the native element's own rule rather than one this component adds.
   */
  value?: string
  /**
   * The starting text for an uncontrolled box, which then keeps its own value.
   * Use this when the caller does not need every keystroke, only the final text
   * read off the form on submit.
   */
  defaultValue?: string
  /**
   * Called on every edit with the change event, so the caller can store the new
   * value and pass it back as `value`. Read the text from
   * `event.target.value`. Omitted, the box is uncontrolled.
   */
  onChange?: ChangeEventHandler<HTMLTextAreaElement>
  /**
   * Called when focus leaves the box, the natural moment to validate a note
   * without nagging on every keystroke. Field owns the message; this is only
   * the event.
   */
  onBlur?: FocusEventHandler<HTMLTextAreaElement>
  /**
   * A short hint shown in the empty box, in the muted ink. It is not a label and
   * never a substitute for one: it disappears the moment a reader types, so the
   * name of the field has to live in a real label or `aria-label`. Use it for an
   * example of the kind of thing to write, not for the question itself.
   */
  placeholder?: string
  /**
   * The resting height in text rows. It sets how tall the empty box looks before
   * anyone drags it; the reader can still resize it on the vertical axis, and
   * the target floor keeps it tappable however short they make it. Defaults to
   * three, enough to read as a place for a sentence or two rather than a single
   * line.
   */
  rows?: number
  /**
   * Whether the box cannot be edited. A disabled box takes the muted surface and
   * the not-allowed cursor, so it reads as unavailable while its text stays
   * legible, rather than being faded with opacity. Defaults to `false`.
   */
  disabled?: boolean
  /**
   * Whether the box must be filled before the form is submitted. It sets the
   * native `required` attribute; the visible marking of an optional or required
   * field, and the message when an empty box is submitted, are Field's to own.
   */
  required?: boolean
  /**
   * Whether the current text has not passed validation. It sets `aria-invalid` and
   * nothing on the colour axis: a form error is not a clinical status, so the
   * border stays the neutral role and the message that says what to fix belongs
   * to Field, in words rather than in a hue. Defaults to `false`.
   */
  invalid?: boolean
  /**
   * The form field name, submitted with the text. It also serves, with `id`, as
   * one of the signals that the box has been given an accessible name, so a
   * named field does not raise the unlabelled warning.
   */
  name?: string
  /**
   * The element id, the hook a real `<label htmlFor>` points at to name the box
   * for assistive technology. Inside a Field the field supplies this; standalone
   * it is one of the two honest ways to label the box, the other being
   * `aria-label`.
   */
  id?: string
  /**
   * The autofill token the browser may use to prefill the box, such as
   * `"off"` for a note nobody should have suggested to them. It maps straight to
   * the native `autocomplete` attribute.
   */
  autoComplete?: string
  /**
   * The most characters the box will accept. Pair it with a visible count near
   * the box so a reader is not stopped mid-word by a limit they could not see
   * coming, because the native attribute silently refuses the next keystroke.
   */
  maxLength?: number
  /**
   * The accessible name for a standalone box, applied as `aria-label`. Give it
   * the prompt the reader is answering. Inside a Field the label names the box
   * and this is not needed; standalone, pass this or an `id` with a matching
   * `<label htmlFor>`, or the box ships without a name.
   */
  "aria-label"?: string
  /**
   * Merged onto the box. Width, margin and place in a layout belong here. It is
   * also the one route by which colour can reach the box, and the
   * two-colour-axes rule applies to it in full: a note field takes neither a
   * status nor a category tint. A class you pass wins over the box's own where
   * the two conflict, because it is merged last.
   */
  className?: string
}

export function Textarea({
  rows = 3,
  disabled = false,
  required = false,
  invalid = false,
  className,
  ...rest
}: TextareaProps) {
  if (isDevelopment()) {
    const hasName =
      (typeof rest["aria-label"] === "string" && rest["aria-label"].trim() !== "") ||
      (typeof rest.id === "string" && rest.id.trim() !== "") ||
      (typeof rest.name === "string" && rest.name.trim() !== "")
    if (!hasName) {
      warnDev(
        "no-name",
        "[opsinjs] <Textarea> was rendered with no aria-label, id or name, so it " +
          "has no accessible name. A screen-reader user then meets a box with no " +
          "idea what to write in it, and a placeholder is not a label because it " +
          "disappears the moment somebody types. Render it inside a Field, or pass " +
          "aria-label with the prompt, or give it an id and point a <label htmlFor> " +
          "at it.",
      )
    }
  }

  return (
    <textarea
      {...rest}
      data-slot="textarea"
      rows={rows}
      disabled={disabled}
      required={required}
      aria-invalid={invalid ? true : undefined}
      className={cn(TEXTAREA, className)}
    />
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It renders one uncontrolled box with
 * an `aria-label` and a plain-language prompt, so the one thing worth seeing at a
 * glance is clear: the box wears the same border, radius and type step as the
 * input beside it rather than the browser's grey default, and it resizes on the
 * vertical axis. The prompt and the starting text are fictional and carry no
 * reading, no unit and no clinical word (ADR 0012).
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
