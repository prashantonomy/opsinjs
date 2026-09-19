"use client"

/**
 * A parent box over a short list, showing the mixed state the lone Checkbox
 * offers so that a set built from these boxes has a head to render. The parent
 * is ticked when every child is ticked, unticked when none is, and mixed when
 * some but not all are, which is the `checked="indeterminate"` state drawn with
 * a Minus rather than a Check. Ticking or unticking the parent sets every child
 * to match.
 *
 * The relationship is wired up here, in the example, rather than inside the
 * component: the lone Checkbox is one box and knows nothing of a group, and a
 * product that wants a real checkbox group reaches for the group primitive. The
 * list items are fictional export options with no reading in them (ADR 0012).
 */

import { useState } from "react"

import { Checkbox } from "@/registry/base-lyra/ui/checkbox"

const ITEMS = [
  { id: "notes", label: "Recent notes" },
  { id: "files", label: "Shared files" },
  { id: "reminders", label: "Reminders" },
]

export default function CheckboxAThreeStateParent() {
  const [checkedIds, setCheckedIds] = useState<string[]>(["notes"])

  const allChecked = checkedIds.length === ITEMS.length
  const noneChecked = checkedIds.length === 0
  const parentChecked: boolean | "indeterminate" = allChecked
    ? true
    : noneChecked
      ? false
      : "indeterminate"

  const setParent = (next: boolean) => {
    setCheckedIds(next ? ITEMS.map((item) => item.id) : [])
  }

  const setChild = (id: string, next: boolean) => {
    setCheckedIds((current) =>
      next ? [...current, id] : current.filter((existing) => existing !== id),
    )
  }

  return (
    <div className="flex flex-col gap-opsin-2">
      <Checkbox
        label="Include in export"
        checked={parentChecked}
        onCheckedChange={setParent}
      />
      <div className="flex flex-col gap-opsin-1 ps-opsin-6">
        {ITEMS.map((item) => (
          <Checkbox
            key={item.id}
            label={item.label}
            checked={checkedIds.includes(item.id)}
            onCheckedChange={(next) => setChild(item.id, next)}
          />
        ))}
      </div>
    </div>
  )
}
