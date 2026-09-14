"use client"

/**
 * The bar built from anchors, so a product router can act on the navigation,
 * pinned to the foot of a framed scroll container the way a product positions
 * it through className. The href on each destination is what navigates; the
 * onValueChange still reports the choice so a controlled shell can follow
 * along. The safe-area padding along the bottom of the bar is the part that
 * clears a phone's home indicator, and it is visible here as the gap below
 * the labels. The screen content is deliberately contentless prose, because
 * an opsinjs example must never be mistakable for somebody's own data.
 */

import { useState } from "react"

import { Bookmark, Compass, House, User } from "lucide-react"

import { TabBar } from "@/registry/base-lyra/ui/tab-bar"

export default function TabBarWithLinks() {
  const [section, setSection] = useState("home")
  return (
    <div className="relative h-96 w-full max-w-sm overflow-hidden rounded-opsin-lg border border-border bg-background">
      <div className="h-full overflow-y-auto p-opsin-4">
        <p className="m-0 text-opsin-body">
          Example screen content sits above the bar and scrolls beneath it.
          The bar stays pinned to the foot of the frame.
        </p>
      </div>
      <TabBar
        className="absolute inset-x-0 bottom-0"
        label="Example destinations"
        value={section}
        onValueChange={setSection}
        items={[
          { key: "home", label: "Home", icon: <House />, href: "#home" },
          { key: "explore", label: "Explore", icon: <Compass />, href: "#explore" },
          { key: "saved", label: "Saved", icon: <Bookmark />, href: "#saved" },
          { key: "profile", label: "Profile", icon: <User />, href: "#profile" },
        ]}
      />
    </div>
  )
}
