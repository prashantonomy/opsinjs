"use client"

/**
 * The busy state, where it actually happens: the submit control at the foot of
 * a form, mid-save, on a phone.
 *
 * There is a real <form> here, and there has to be. An earlier version of this
 * example was two buttons in a <div> while the prose called it a form, which
 * hid the one thing about this component that surprises everybody:
 *
 * `type="submit"` IS NOT THE DEFAULT AND HAS TO BE WRITTEN. A bare <button>
 * inside a form submits it. This component does not: Base UI's `useButton`
 * merges `type: "button"` into every native button, so a Button at the foot of
 * a form is inert as a submitter until somebody types the attribute. That is a
 * reversal of the platform default, it is invisible in a preview, and the way
 * you find out is a form that silently does nothing. So the primary control
 * below carries `type="submit"` and the escape hatch carries `type="button"`.
 * The second is already the default, and writing it anyway is the habit that
 * survives somebody swapping this for a plain <button> later.
 *
 * Three more things are worth watching, and all three are the same decision
 * seen from different angles.
 *
 * THE LABEL DOES NOT CHANGE. It still says "Save note" while it saves. The
 * common alternative changes the control's width, jumps the layout under the
 * reader's thumb, and makes its accessible name disappear and reappear. It
 * swaps the label for a spinner, or rewrites it to "Saving…". The reader's
 * record of what they pressed is the label; it stays put.
 *
 * A VISIBLE WORD CARRIES THE STATE WHEN MOTION IS OFF. The control passes
 * `busyLabel="Saving"`, which does not replace the label: "Save note" stays and
 * "Saving" appears beside the busy glyph. A reader who turned rotation off sees
 * a still glyph rather than a spin, so the word is what tells them the save is
 * in flight, and a reader who cannot see the glyph is told the same, because
 * unlike the glyph the word is left in the accessibility tree. The word is the
 * product's own, never invented or translated here.
 *
 * THE BUTTON DOES NOT DISAPPEAR. It is not `disabled`: it keeps its tab stop
 * and its place in the accessibility tree, and it is exposed as busy and
 * unavailable rather than removed. A control that vanishes mid-save takes the
 * reader's place in the form with it. What that state SOUNDS like is a separate
 * question and an open one. `aria-busy` on a control is a hint rather than an
 * announcement, and no screen reader has been run against this.
 *
 * THE BUSY GLYPH TAKES THE ICON'S SEAT, so a glyph swap on its own moves no
 * width when a control has an icon, and grows it by a glyph when it does not.
 * That is not the whole story here, though, because this control also passes
 * `busyLabel`: the word "Saving" appears beside the glyph and would widen the
 * control on its own whatever the icon does. What actually holds the width
 * steady while it saves is `fullWidth`, which pins the control to its row
 * whatever the busy slot carries. The same control without `fullWidth`, and
 * without a container that fixed its width, would grow when the save began.
 *
 * `fullWidth` on the primary and not on the escape hatch beneath it is the
 * hierarchy again. Two full-width buttons stacked read as two primary actions,
 * and this form has one. So the escape hatch takes neither `fullWidth` nor the
 * full row: it is `self-center`, a target the width of its own label, and a
 * thumb that lands in the band beside the word "Cancel" abandons nothing. The
 * two controls sit in their own column at `gap-opsin-4`, one step wider than
 * the form's own `gap-opsin-3` rhythm, because `density-and-touch` separates
 * two controls of asymmetric consequence, a save next to a cancel, by more
 * than the one step it asks of ordinary neighbours.
 *
 * The field is a plain labelled input rather than the Field component, so that
 * this example depends on nothing but Button, and it is deliberately about
 * nothing: a note, no units, no number, nothing a screenshot could be mistaken
 * for. The submit handler stops the browser rather than sending anywhere.
 *
 * IT STILL CARRIES THE TARGET FLOOR, and depending on nothing is exactly why it
 * has to. `app/product.css` backstops `button`, `[role="button"]`,
 * `a[data-opsin-target]`, checkboxes and radios. It does not backstop text
 * inputs, so a hand-rolled input has nothing holding it open, and this one
 * measured 40px beside a 44px Button. `shadcn add` copies this file into
 * somebody else's project as the worked answer to "what does an opsinjs form
 * look like", so a short box here is a short box in a patient-facing app. The
 * class is the same one every control in the registry carries, fallback
 * included; it adds a utility, not a dependency.
 *
 * IT ALSO CARRIES THE HINT'S WIRING, for the same reason it carries the floor.
 * The hint below the field is a fact about what to type, and a screen-reader
 * user who reaches the input never hears it unless the two are associated, so
 * the `<p>` takes an `id` and the input points `aria-describedby` at it.
 * `app/product.css` backstops target sizes; it does not backstop
 * `aria-describedby`, and nothing else will. In a real form the Field component
 * owns this wiring. This example hand-rolls it precisely because it depends on
 * nothing but Button, and a description a reader cannot hear is the same kind of
 * gap as a box a thumb cannot hit.
 */

import { ArrowRight } from "lucide-react"

import { Button } from "@/registry/base-lyra/ui/button"

export default function ButtonBusyAtTheFootOfAForm() {
  return (
    <form
      className="flex w-full max-w-xs flex-col gap-opsin-3"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex flex-col gap-opsin-1">
        <label
          htmlFor="button-example-note"
          className="text-opsin-subheadline text-foreground"
        >
          Example note
        </label>
        <input
          id="button-example-note"
          name="example-note"
          type="text"
          autoComplete="off"
          aria-describedby="button-example-note-hint"
          className="min-h-(--opsin-target-minimum,2.75rem) rounded-opsin-md border border-border bg-card px-opsin-3 py-opsin-2 text-opsin-body text-foreground"
        />
        <p
          id="button-example-note-hint"
          className="m-0 text-opsin-footnote text-muted-foreground"
        >
          Anything at all. Nothing here is stored or sent.
        </p>
      </div>

      <div className="flex flex-col gap-opsin-4">
        <Button
          type="submit"
          variant="primary"
          icon={<ArrowRight />}
          iconPosition="trailing"
          busy
          busyLabel="Saving"
          fullWidth
        >
          Save note
        </Button>
        <Button type="button" variant="quiet" className="self-center">
          Cancel
        </Button>
      </div>
    </form>
  )
}
