/**
 * A count attached to a label, which is the case Badge was built for. The number
 * is a fictional unread count rather than anything measured (ADR 0012), and it
 * carries a screen-reader label so a reader hears "5 unread" rather than a lone
 * "5" with no noun. The badge draws only neutral chrome, so it reads as a count
 * on the label rather than as a status beside it.
 */

import { Badge } from "@/registry/base-lyra/ui/badge"

export default function BadgeACountOnALabel() {
  return (
    <div className="flex flex-col gap-opsin-3 text-opsin-body [color:var(--foreground)]">
      <span className="inline-flex items-center gap-opsin-2">
        Reminders
        <Badge srLabel="5 waiting">5</Badge>
      </span>
      <span className="inline-flex items-center gap-opsin-2">
        Shared with you
        <Badge srLabel="2 new">2</Badge>
      </span>
    </div>
  )
}
