"use client"

/**
 * The accessibility pairing the page recommends. The map and a plain
 * checkbox list are bound to one selection, so a reader answers with
 * whichever suits them and a keyboard or assistive-technology user has a
 * robust path to the identical value. The region words are generic and
 * neutral (ADR 0012).
 */

import { useState } from "react"

import { BodyMap } from "@/registry/base-lyra/ui/body-map"

const REGIONS = [
  { key: "head", label: "Head" },
  { key: "chest", label: "Chest" },
  { key: "abdomen", label: "Abdomen" },
  { key: "left-arm", label: "Left arm" },
  { key: "right-arm", label: "Right arm" },
  { key: "left-leg", label: "Left leg" },
  { key: "right-leg", label: "Right leg" },
  { key: "upper-back", label: "Upper back" },
  { key: "lower-back", label: "Lower back" },
]

export default function BodyMapWithACheckboxList() {
  const [value, setValue] = useState<string[]>([])
  function toggle(key: string) {
    setValue((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }
  return (
    <div className="flex w-full max-w-2xl flex-col gap-opsin-6 sm:flex-row sm:items-start">
      <BodyMap
        label="Example: mark where something is"
        regions={REGIONS}
        value={value}
        onValueChange={setValue}
        view="both"
      />
      <fieldset className="flex flex-col gap-opsin-2 border-0 p-0">
        <legend className="text-opsin-headline text-foreground">
          The same regions as a list
        </legend>
        {REGIONS.map((r) => (
          <label
            key={r.key}
            className="flex items-center gap-opsin-2 text-opsin-body text-foreground"
          >
            <input
              type="checkbox"
              checked={value.includes(r.key)}
              onChange={() => toggle(r.key)}
              className="size-5"
            />
            {r.label}
          </label>
        ))}
      </fieldset>
    </div>
  )
}
