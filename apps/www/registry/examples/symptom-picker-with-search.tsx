"use client"

/**
 * The same picker with `searchable` turned on, for a list long enough that
 * scanning it is work. The filter input narrows the visible rows by a match on
 * their label, and it is kept separate from the selection: type into it and the
 * ticked rows stay ticked, clear it and every option comes back untouched.
 *
 * The options are fictional placeholders (ADR 0012), named with the phonetic
 * alphabet so the filter is easy to try: type "ch" and only Charlie remains.
 * opsinjs ships no list of its own; a product supplies the real one.
 */

import { useState } from "react"

import { SymptomPicker } from "@/registry/base-lyra/ui/symptom-picker"

const OPTIONS = [
  { value: "alpha", label: "Example option Alpha" },
  { value: "bravo", label: "Example option Bravo" },
  { value: "charlie", label: "Example option Charlie" },
  { value: "delta", label: "Example option Delta" },
  { value: "echo", label: "Example option Echo" },
  { value: "foxtrot", label: "Example option Foxtrot" },
]

export default function SymptomPickerWithSearch() {
  const [value, setValue] = useState<string[]>(["bravo", "echo"])
  return (
    <div className="w-full max-w-md">
      <SymptomPicker
        label="Which of these apply to you right now?"
        value={value}
        onValueChange={setValue}
        options={OPTIONS}
        searchable
      />
    </div>
  )
}
