"use client"

/**
 * The one behaviour this component exists for: nothing typed is thrown away by
 * a gesture.
 *
 * Type something into the field, then try to leave by every route there is.
 * Those routes are the escape key, a tap on the dimmed background, a downward
 * drag, and the close control in the header. All four ask, and they ask the
 * same question, in the same place, because a reader who brushed the scrim by
 * accident and one who reached for Close on purpose lose exactly the same
 * typing.
 *
 * THE QUESTION IS ASKED IN PLACE, in the sheet's own footer. A confirmation
 * dialogue would be a second modal surface stacked on the first, which Sheet's
 * page calls a composition error and which produces a focus order nobody can
 * predict and an escape key with two plausible meanings. The footer swaps
 * instead: the save action is replaced by the question and its two answers, and
 * the entry is still there behind it.
 *
 * WHILE THE QUESTION IS UP, escape and a background tap answer it with "keep
 * editing". That is the safe one. The way out is the Discard control, which is
 * a real button two tab stops away, so the sheet is never a trap.
 *
 * `onDiscard` RECEIVES THE ENTRY that was about to be lost, which is what makes
 * "the product decides whether to keep a draft" possible rather than merely
 * stated. This example keeps it and shows it underneath, which is the smallest
 * demonstration of a draft there is; a real product would put it somewhere it
 * survives the page.
 *
 * The measurement is fictional and has no unit, no range and no meaning. A
 * screenshot of an opsinjs example must never be mistakable for somebody's
 * result.
 */

import { useState } from "react"

import { Button } from "@/registry/base-lyra/ui/button"
import { Field } from "@/registry/base-lyra/ui/field"
import { LogSheet, type LogEntry } from "@/registry/base-lyra/ui/log-sheet"

const EMPTY: Record<string, number | string | null> = {
  "example-measurement": null,
}

export default function LogSheetLeavingWithUnsavedInput() {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(EMPTY)
  const [draft, setDraft] = useState<LogEntry | null>(null)

  const typed = values["example-measurement"]

  return (
    <div className="flex w-full flex-col items-center gap-opsin-4 p-opsin-4">
      <p className="m-0 max-w-sm text-center text-opsin-footnote text-muted-foreground">
        Open the sheet, type something, and then try to leave it. Every route
        out asks first.
      </p>

      <Button
        onClick={() => {
          setValues({ ...EMPTY })
          setOpen(true)
        }}
      >
        Open the example log sheet
      </Button>

      {draft ? (
        <p className="m-0 max-w-sm text-center text-opsin-footnote">
          A draft was kept: the entry was dated {draft.occurredAt} and its note
          was {draft.note ?? "left empty"}.
        </p>
      ) : null}

      <LogSheet
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
        title="An example entry"
        category="labs"
        values={values}
        saveLabel="Save the example entry"
        noteLabel="Anything worth remembering"
        onSave={() => {
          setDraft(null)
          setOpen(false)
        }}
        /* The entry that was about to be lost, handed over whole. Ignoring it
           is a discard; keeping it, as here, is a draft. */
        onDiscard={(entry) => {
          setDraft(entry)
          setOpen(false)
        }}
      >
        <Field
          label="Example measurement"
          hint="Any number. Nothing is stored and nothing is interpreted."
        >
          <Field.Control
            name="example-measurement"
            inputMode="decimal"
            autoComplete="off"
            value={typed === null ? "" : String(typed)}
            /* An emptied control goes back to `null`, not to an empty string.
               `null` is an absence, `0` is a measurement, and a channel that
               cannot tell them apart puts one of them in somebody's record
               under the other's name. */
            onChange={(event) =>
              setValues({
                "example-measurement":
                  event.target.value === "" ? null : event.target.value,
              })
            }
          />
        </Field>
      </LogSheet>
    </div>
  )
}
