"use client"

/**
 * The primary case: four peer destinations with one current. It holds its own
 * selection state because TabBar is controlled, and it shows the one thing
 * worth seeing, that the current destination is lifted by weight, an
 * indicator and an ink change rather than by a colour. The labels name
 * fictional app sections (ADR 0012), so there is no number or reading anybody
 * could mistake for their own, and no two destinations share a name.
 */

import { useState } from "react"

import { Activity, GraduationCap, House, User } from "lucide-react"

import { TabBar } from "@/registry/base-lyra/ui/tab-bar"

export default function TabBarFourDestinations() {
  const [section, setSection] = useState("home")
  return (
    <div className="w-full max-w-sm">
      <TabBar
        label="Example sections"
        value={section}
        onValueChange={setSection}
        items={[
          { key: "home", label: "Home", icon: <House /> },
          { key: "trends", label: "Trends", icon: <Activity /> },
          { key: "learn", label: "Learn", icon: <GraduationCap /> },
          { key: "profile", label: "Profile", icon: <User /> },
        ]}
      />
    </div>
  )
}
