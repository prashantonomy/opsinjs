/**
 * The busy state, where it actually happens: the submit control at the foot of
 * a form, mid-save, on a phone.
 *
 * Three things are worth watching here, and all three are the same decision
 * seen from different angles.
 *
 * THE LABEL DOES NOT CHANGE. It still says "Save reading" while it saves. The
 * common alternative — swapping the label for a spinner, or rewriting it to
 * "Saving…" — changes the control's width, jumps the layout under the reader's
 * thumb, and makes its accessible name disappear and reappear. The reader's
 * record of what they pressed is the label; it stays put.
 *
 * THE BUTTON DOES NOT DISAPPEAR. It is not `disabled`: it keeps its tab stop
 * and its place in the accessibility tree, and it is announced as busy and
 * unavailable rather than removed. A control that vanishes mid-save takes the
 * reader's place in the form with it.
 *
 * THE BUSY GLYPH TAKES THE ICON'S SEAT. Which is why the primary control here
 * has an icon in the first place: with one, the button does not change width
 * when it becomes busy. Without one, it grows by a glyph.
 *
 * `fullWidth` on the primary and not on the escape hatch beneath it is the
 * hierarchy again. Two full-width buttons stacked read as two primary actions,
 * and this form has one.
 */

import { ArrowRight } from "lucide-react"

import { Button } from "@/registry/base-lyra/ui/button"

export default function ButtonBusyAtTheFootOfAForm() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-opsin-2">
      <Button variant="primary" icon={<ArrowRight />} iconPosition="trailing" busy fullWidth>
        Save reading
      </Button>
      <Button variant="quiet" fullWidth>
        Cancel
      </Button>
    </div>
  )
}
