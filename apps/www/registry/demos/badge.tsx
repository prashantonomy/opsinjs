import { Badge } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the two weights
 * beside the kind of thing a badge attaches to, a tab label with a count, so
 * the one thing worth seeing at a glance is clear: the badge is quiet neutral
 * chrome rather than a second status beside its host. It carries no clinical
 * word, no reading and no unit (ADR 0012); the counts are fictional and the
 * labels are plain.
 */
export default function BadgeDemo() {
  return (
    <div className="flex items-center gap-opsin-4 text-opsin-body [color:var(--foreground)]">
      <span className="inline-flex items-center gap-opsin-2">
        Messages
        <Badge srLabel="3 unread">3</Badge>
      </span>
      <span className="inline-flex items-center gap-opsin-2">
        Drafts
        <Badge variant="outline" srLabel="12 saved">
          12
        </Badge>
      </span>
    </div>
  )
}
