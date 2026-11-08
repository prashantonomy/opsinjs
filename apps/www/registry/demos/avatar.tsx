"use client"

import { Avatar } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the one
 * distinction worth seeing: that the mark is initials at three sizes, circular
 * and neutral, and stands for a person. The people are fictional (ADR 0012),
 * the sizes are all valid and no `src` is passed, so it triggers no development
 * warning, and no two avatars share an accessible name. The glyph tier is left
 * to the fallback-chain example, because reaching it needs an empty name, which
 * would warn.
 */
const DEMO_PEOPLE = [
  { name: "Ada Vance", size: "sm" as const, caption: "Small, in a dense list" },
  { name: "Bruno Sol", size: "md" as const, caption: "Medium, the default" },
  { name: "Mei Ling", size: "lg" as const, caption: "Large, on a profile" },
]

export default function AvatarDemo() {
  return (
    <div className="flex flex-wrap items-end gap-opsin-6">
      {DEMO_PEOPLE.map((person) => (
        <div
          key={person.name}
          className="flex flex-col items-center gap-opsin-2"
        >
          <Avatar name={person.name} size={person.size} />
          <p className="m-0 text-opsin-caption1 text-muted-foreground">
            {person.caption}
          </p>
        </div>
      ))}
    </div>
  )
}
