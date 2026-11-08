"use client"

/**
 * One small settings card, drawn under whichever accent theme and accent the
 * page has chosen (ADR 0029).
 *
 * It sets no accent attribute of its own, on purpose. The documentation's
 * picker stamps `data-accent-theme` and `data-accent` on the preview's `<html>`,
 * and everything here reads the roles that follow from them, so switching the
 * picker is the whole demonstration: the filled action, the switch that is on,
 * the ticked box, the progress fill, the quiet action in the accent ink and the
 * focus ring all change together, and nothing that reports a result changes at
 * all, because nothing here reports one.
 *
 * The two controls hold their own state because both are controlled, and a demo
 * has to close that loop somewhere. Every word is about a fictional reminder and
 * carries no number a reader could take for their own (ADR 0012).
 */

import { useState } from "react"

import { Button } from "@/registry/base-lyra/ui/button"
import { Checkbox } from "@/registry/base-lyra/ui/checkbox"
import { Progress } from "@/registry/base-lyra/ui/progress"
import { Switch } from "@/registry/base-lyra/ui/switch"

export default function AccentThemesASettingsCard() {
  const [remind, setRemind] = useState(true)
  const [summary, setSummary] = useState(true)

  return (
    <section
      aria-labelledby="accent-settings-heading"
      className="flex w-full max-w-md flex-col gap-opsin-4 rounded-opsin-lg border border-edge bg-card p-opsin-5 shadow-card [corner-shape:var(--opsin-corner-shape)]"
    >
      <h2 id="accent-settings-heading" className="m-0 text-opsin-title3">
        Example reminders
      </h2>
      <Switch
        label="Remind me about the example reading"
        checked={remind}
        onCheckedChange={setRemind}
      />
      <Checkbox
        label="Send the example summary to my email"
        checked={summary}
        onCheckedChange={setSummary}
      />
      <Progress label="Example set-up" value={60} />
      <div className="flex flex-wrap items-center gap-opsin-2">
        <Button variant="primary">Save example settings</Button>
        <Button variant="quiet">Not now</Button>
      </div>
    </section>
  )
}
