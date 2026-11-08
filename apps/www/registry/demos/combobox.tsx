"use client"

import { useState } from "react"
import { Combobox } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It holds its own
 * selection state, because the control is controlled and a demo has to close
 * that loop somewhere, and it shows a field over a list long enough that typing
 * beats scrolling, which is the one thing worth seeing at a glance: that the
 * control is neutral chrome, the list filters as you type, and the chosen item
 * is marked by a tick rather than a colour. Open it, type a letter, and read
 * the matches in greyscale to check that.
 *
 * The items name a fictional set of cities (ADR 0012), the kind of list a product
 * owns rather than a clinical vocabulary opsinjs would have to ship. No number,
 * no unit and no measurement anybody could mistake for their own reading.
 */
export default function ComboboxDemo() {
  const [city, setCity] = useState<string | null>("lisbon")
  return (
    <div className="w-full max-w-xs">
      <Combobox
        label="Example city"
        placeholder="Search cities"
        emptyMessage="No city matches that."
        value={city}
        onValueChange={setCity}
        items={[
          { value: "amsterdam", label: "Amsterdam" },
          { value: "berlin", label: "Berlin" },
          { value: "cairo", label: "Cairo" },
          { value: "dakar", label: "Dakar" },
          { value: "lisbon", label: "Lisbon" },
          { value: "mumbai", label: "Mumbai" },
          { value: "nairobi", label: "Nairobi" },
          { value: "osaka", label: "Osaka" },
          { value: "quito", label: "Quito" },
          { value: "reykjavik", label: "Reykjavik" },
          { value: "santiago", label: "Santiago" },
          { value: "tokyo", label: "Tokyo" },
        ]}
      />
    </div>
  )
}
