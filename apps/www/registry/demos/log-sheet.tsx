"use client"

import { useState } from "react"
import { Button, Field, LogEntry, LogSheet } from "@opsinjs/react"

/* The record stores an instant; a reader reads a time. `occurredAt` is
   `toISOString()` output, so printing it raw shows a reader who just picked
   12:29 the string 2026-09-05T11:29:00.000Z, which is a machine string, in
   UTC, and an hour wrong everywhere outside Greenwich. The formatter is built
   inside the function rather than at module scope so it resolves the reader's
   locale in the browser rather than the server's during a render. */
function readableTime(instant: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    /* 24-hour with a colon, per content/numbers-dates-and-time, which bans
       am/pm outright: LogSheet is the surface whose capture format reaches an
       export, so the demo must not teach the banned clock. */
    hourCycle: "h23",
  }).format(new Date(instant))
}

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the shape a
 * product reaches for first, which is one field, a time, a note and one save.
 * It also shows the two things that are easiest to get wrong: the field's key
 * is written beside the control rather than inferred from it, and an emptied
 * control goes back to `null` instead of to an empty string.
 *
 * The measurement is deliberately fictional (ADR 0012) and carries no unit and
 * no range. A screenshot of an opsinjs demo must never be mistakable for
 * somebody's result.
 *
 * There is no `maxBackdateDays` here. The window is a number the product owns,
 * and a demo that shipped one would be putting opsinjs's guess into every
 * product whose developer copies the demo.
 */
export default function LogSheetDemo() {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, number | string | null>>({
    "example-measurement": null,
  })
  const [saved, setSaved] = useState<LogEntry | null>(null)

  const typed = values["example-measurement"]

  return (
    <div className="flex w-full flex-col items-center gap-opsin-4 p-opsin-4">
      <p className="m-0 max-w-sm text-center text-opsin-footnote text-muted-foreground">
        Opens over the whole page. Type something, then try to close it. It
        asks before anything is lost.
      </p>

      <Button onClick={() => setOpen(true)}>Open the example log sheet</Button>

      {saved ? (
        <p className="m-0 max-w-sm text-center text-opsin-footnote">
          Saved an entry dated {readableTime(saved.occurredAt)}
          {saved.backdated ? ", which the reader re-dated." : "."}
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
        onSave={(entry) => {
          setSaved(entry)
          /* Closing the sheet and clearing the fields are both the product's
             to do. LogSheet resets the two things it renders on every open.
             Those two are the time and the note, and it has no way to reach
             into state it does not own. */
          setValues({ "example-measurement": null })
          setOpen(false)
        }}
        onDiscard={() => setValues({ "example-measurement": null })}
      >
        <Field
          label="Example measurement"
          hint="Any number. This example stores it and does nothing else with it."
        >
          <Field.Control
            name="example-measurement"
            inputMode="decimal"
            autoComplete="off"
            value={typed === null ? "" : String(typed)}
            onChange={(event) => {
              const next = event.target.value
              /* An emptied control is an absence, not a zero and not an empty
                 string. This is the line the whole `values` channel exists to
                 make possible, and it is one line of the product's own code. */
              setValues({
                "example-measurement": next === "" ? null : next,
              })
            }}
          />
        </Field>
      </LogSheet>
    </div>
  )
}
