"use client"

/**
 * Two controls, one record, and the window the product owns.
 *
 * WHAT THIS EXAMPLE IS REALLY ABOUT is the `values` channel. `children` is an
 * opaque element tree and LogSheet never reads it, so the keys that end up in
 * `LogEntry.values` are written by the product beside the controls that produce
 * them — here, `example-first` and `example-second`. That is the cost of the
 * design and it is visible in eleven lines below; what it buys is that a
 * control the product wrote itself, or wrapped in a component of its own, works
 * exactly like one opsinjs shipped.
 *
 * TWO SEGMENTS ARE STILL ONE RECORD. Some measurements are a pair — a reading
 * with an upper and a lower part, a height in two units — and the pair is two
 * controls and two keys, saved together, in one entry. LogSheet has nothing to
 * say about which pairs are legitimate; it carries whatever the product keyed.
 *
 * `maxBackdateDays` IS THE PRODUCT'S NUMBER, and it is written here as an
 * `EXAMPLE_`-prefixed constant so that the authorship is explicit at the call
 * site: this example is standing in for a product, and the window is the kind
 * of thing a product decides from its own record-keeping rules. opsinjs ships
 * no default for it, and omitting it means no earliest date is offered or
 * stated. What it does NOT do is block — a time outside the window still saves,
 * because a log that refuses an entry is a log with a hole in it exactly where
 * the interesting record was.
 *
 * Both measurements are fictional and carry no unit and no range. A screenshot
 * of an opsinjs example must never be mistakable for somebody's result.
 */

import { useState } from "react"

import { Button } from "@/registry/base-lyra/ui/button"
import { Field } from "@/registry/base-lyra/ui/field"
import { LogSheet, type LogEntry } from "@/registry/base-lyra/ui/log-sheet"

/* The example standing in for the product. A window of a week is this file's
   choice and nobody else's, which is what the prefix says. */
const EXAMPLE_BACKDATE_WINDOW = 7

const EMPTY: Record<string, number | string | null> = {
  "example-first": null,
  "example-second": null,
}

export default function LogSheetTwoFieldsAndABackdateWindow() {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(EMPTY)
  const [saved, setSaved] = useState<LogEntry | null>(null)

  /* One writer for both keys, so a change to one never drops the other. */
  function set(key: string, raw: string) {
    setValues((current) => ({ ...current, [key]: raw === "" ? null : raw }))
  }

  const asText = (key: string) => {
    const held = values[key]
    return held === null || held === undefined ? "" : String(held)
  }

  return (
    <div className="flex w-full flex-col items-center gap-opsin-4 p-opsin-4">
      <p className="m-0 max-w-sm text-center text-opsin-footnote text-muted-foreground">
        Two controls write two keys into one entry. The time control offers
        nothing earlier than the window this example chose, and typing an
        earlier one still saves.
      </p>

      <Button
        onClick={() => {
          setValues({ ...EMPTY })
          setOpen(true)
        }}
      >
        Open the example log sheet
      </Button>

      {saved ? (
        <p className="m-0 max-w-sm text-center text-opsin-footnote">
          Saved {Object.keys(saved.values).length} keys, dated{" "}
          {saved.occurredAt}
          {saved.backdated ? ", re-dated by the reader." : ", as it opened."}
        </p>
      ) : null}

      <LogSheet
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
        title="An example pair"
        category="heart"
        values={values}
        saveLabel="Save the example pair"
        maxBackdateDays={EXAMPLE_BACKDATE_WINDOW}
        onSave={(entry) => {
          setSaved(entry)
          setOpen(false)
        }}
      >
        <Field label="First example part" hint="Any number.">
          <Field.Control
            name="example-first"
            inputMode="decimal"
            autoComplete="off"
            value={asText("example-first")}
            onChange={(event) => set("example-first", event.target.value)}
          />
        </Field>

        <Field label="Second example part" hint="Any number.">
          <Field.Control
            name="example-second"
            inputMode="decimal"
            autoComplete="off"
            value={asText("example-second")}
            onChange={(event) => set("example-second", event.target.value)}
          />
        </Field>
      </LogSheet>
    </div>
  )
}
