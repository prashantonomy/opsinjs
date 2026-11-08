"use client"

import { Activity, BookOpen, House, Settings } from "lucide-react"
import { useState } from "react"
import { TabBar } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code. It shows a four-destination bar with one current,
 * which is the one thing worth seeing at a glance: the destinations read as
 * siblings and the current one is lifted by weight, a top indicator and an ink
 * change rather than by a colour. Read it in greyscale to check that. It holds
 * its own selection state because the bar is controlled and a demo has to close
 * that loop somewhere.
 *
 * The labels name fictional app sections (ADR 0012). No number, no unit and
 * no measurement anybody could mistake for their own reading, and no two
 * destinations share a name.
 */
export default function TabBarDemo() {
  const [section, setSection] = useState("home")
  return (
    <div className="w-full max-w-sm">
      <TabBar
        label="Example app sections"
        value={section}
        onValueChange={setSection}
        items={[
          { key: "home", label: "Home", icon: <House /> },
          { key: "trends", label: "Trends", icon: <Activity /> },
          { key: "library", label: "Library", icon: <BookOpen /> },
          { key: "settings", label: "Settings", icon: <Settings /> },
        ]}
      />
    </div>
  )
}
