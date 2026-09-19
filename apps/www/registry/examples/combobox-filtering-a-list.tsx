"use client"

/**
 * Filtering a long list as you type, which is the case Combobox was built for.
 * The items are a fictional set of cities (ADR 0012), the kind of list a product
 * owns rather than a clinical vocabulary opsinjs would have to ship. Type a
 * letter or two and the list narrows to the matches; the example holds its own
 * state because the control is controlled, and it starts with one city chosen so
 * the input shows a value and the list marks it with a tick.
 */

import { useState } from "react"

import { Combobox } from "@/registry/base-lyra/ui/combobox"

export default function ComboboxFilteringAList() {
  const [city, setCity] = useState<string | null>("berlin")
  return (
    <div className="w-full max-w-xs">
      <Combobox
        label="City"
        placeholder="Search cities"
        value={city}
        onValueChange={setCity}
        items={[
          { value: "amsterdam", label: "Amsterdam" },
          { value: "berlin", label: "Berlin" },
          { value: "bogota", label: "Bogota" },
          { value: "cairo", label: "Cairo" },
          { value: "dakar", label: "Dakar" },
          { value: "helsinki", label: "Helsinki" },
          { value: "lisbon", label: "Lisbon" },
          { value: "manila", label: "Manila" },
          { value: "mumbai", label: "Mumbai" },
          { value: "nairobi", label: "Nairobi" },
          { value: "osaka", label: "Osaka" },
          { value: "quito", label: "Quito" },
          { value: "reykjavik", label: "Reykjavik" },
          { value: "santiago", label: "Santiago" },
          { value: "tokyo", label: "Tokyo" },
          { value: "warsaw", label: "Warsaw" },
        ]}
      />
    </div>
  )
}
