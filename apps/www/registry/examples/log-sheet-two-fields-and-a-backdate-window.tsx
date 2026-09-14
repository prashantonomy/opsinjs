"use client"

/**
 * Two controls, one record, and the window the product owns.
 *
 * WHAT THIS EXAMPLE IS REALLY ABOUT is the `values` channel. `children` is an
 * opaque element tree and LogSheet never reads it, so the keys that end up in
 * `LogEntry.values` are written by the product beside the controls that produce
 * them. In this example they are `example-first` and `example-second`. That is
 * the cost of the design and it is visible in eleven lines below; what it buys
 * is that a control the product wrote itself, or wrapped in a component of its
 * own, works exactly like one opsinjs shipped.
 *
 * TWO SEGMENTS ARE STILL ONE RECORD. Some measurements are a pair, and a pair
 * is two controls and two keys, saved together, in one entry. A reading with
 * an upper and a lower part is one, and a height in two units is another.
 * LogSheet has nothing to say about which pairs are legitimate; it carries
 * whatever the product keyed.
 *
 * `maxBackdateDays` IS THE PRODUCT'S NUMBER, and it is written here as an
 * `EXAMPLE_`-prefixed constant so that the authorship is explicit at the call
 * site: this example is standing in for a product, and the window is the kind
 * of thing a product decides from its own record-keeping rules. opsinjs ships
 * no default for it, and omitting it means no earliest date is offered or
 * stated. What it does NOT do is refuse a save. The sheet blocks no save for
 * any reason, so where the platform lets a time be typed rather than picked, a
 * time outside the window still saves. On a touch device the picker will not
 * offer a time below the window, so the platform enforces there what the sheet
 * never does. A log that refuses an entry is a log with a hole in it exactly
 * where the interesting record was.
 *
 * Both measurements are fictional and carry no unit and no range. A screenshot
 * of an opsinjs example must never be mistakable for somebody's result.
 *
 * THE EMPTINESS CHECK BELONGS TO THE PRODUCT. LogSheet blocks no save, so an
 * entry with every value null and no note reaches `onSave` like any other. This
 * example puts the check where a product would put it, in the first lines of
 * `onSave`, and drops the empty record rather than storing a phantom entry. The
 * component makes no such check, because an emptiness test is a validation and
 * this sheet validates nothing.
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

/* The record stores an instant; a reader reads a time. `occurredAt` is
   `toISOString()` output, so printing it raw shows a reader who just picked
   12:29 the string 2026-09-05T11:29:00.000Z, which is a machine string, in
   UTC, and an hour wrong everywhere outside Greenwich. The formatter is built
   inside the function rather than at module scope so it resolves the reader's
   locale in the browser rather than the server's during a render. This example
   ships on its own through `shadcn add`, so it carries its own copy rather
   than importing one. */
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

export default function LogSheetTwoFieldsAndABackdateWindow() {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(EMPTY)
  const [saved, setSaved] = useState<LogEntry | null>(null)
  const [droppedEmpty, setDroppedEmpty] = useState(false)

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
        nothing earlier than the window this example chose. Where the platform
        lets a time be typed rather than picked, an earlier one still saves,
        and the sheet itself never refuses one.
      </p>

      <Button
        onClick={() => {
          setValues({ ...EMPTY })
          setDroppedEmpty(false)
          setOpen(true)
        }}
      >
        Open the example log sheet
      </Button>

      {saved ? (
        <p className="m-0 max-w-sm text-center text-opsin-footnote">
          Saved {Object.keys(saved.values).length} keys, dated{" "}
          {readableTime(saved.occurredAt)}
          {saved.backdated ? ", re-dated by the reader." : ", as it opened."}
        </p>
      ) : null}

      {droppedEmpty ? (
        <p className="m-0 max-w-sm text-center text-opsin-footnote">
          Nothing was typed, so this example kept nothing.
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
          /* THE ONE CHECK THIS COMPONENT WILL NOT MAKE FOR YOU. LogSheet blocks
             no save, so an entry with every value null and no note arrives here
             like any other. Whether that is a record worth keeping is the
             product's call and nobody else's, and this is the line where a
             product makes it. This example drops it and says so, which is the
             smallest honest demonstration; a real product might instead keep
             it, or return the reader to the field. What it must not do is store
             it silently. */
          const holdsNothing =
            Object.values(entry.values).every((held) => held === null) &&
            entry.note === undefined
          setDroppedEmpty(holdsNothing)
          setSaved(holdsNothing ? null : entry)
          setOpen(false)
        }}
      >
        <Field label="First example part" hint="Any number">
          <Field.Control
            name="example-first"
            inputMode="decimal"
            autoComplete="off"
            value={asText("example-first")}
            onChange={(event) => set("example-first", event.target.value)}
          />
        </Field>

        <Field label="Second example part" hint="Any number">
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
