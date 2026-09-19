"use client"

/**
 * What the reader meets when nothing matches. The point worth checking is that a
 * search which filters everything away shows a short, useful line inside the
 * popup rather than a blank space, and that Base UI announces that line politely
 * so a screen-reader user hears the list went empty. Type something the short
 * list does not contain, such as "xyz", to see it. The items are a fictional set
 * of colours (ADR 0012), a list a product owns, not a reading or a unit.
 */

import { useState } from "react"

import { Combobox } from "@/registry/base-lyra/ui/combobox"

export default function ComboboxNoMatch() {
  const [swatch, setSwatch] = useState<string | null>(null)
  return (
    <div className="w-full max-w-xs">
      <Combobox
        label="Swatch name"
        placeholder="Search swatches"
        emptyMessage="No swatch matches that. Check the spelling."
        value={swatch}
        onValueChange={setSwatch}
        items={[
          { value: "amber", label: "Amber" },
          { value: "indigo", label: "Indigo" },
          { value: "sage", label: "Sage" },
          { value: "slate", label: "Slate" },
          { value: "teal", label: "Teal" },
        ]}
      />
    </div>
  )
}
