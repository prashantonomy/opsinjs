import { Bell, Plus, Search } from "lucide-react"
import { IconButton } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is reviewed public code. It shows three variants as icon-only controls,
 * because the one thing worth seeing at a glance is that each reads as a
 * control without a word inside it while still carrying a name. Each label is
 * distinct, so a voice-control user saying one of them gets one control rather
 * than a disambiguation prompt, and none of the three triggers the missing-name
 * warning. The labels name a fictional action (ADR 0012): no number, no unit,
 * nothing a screenshot could be mistaken for a reading.
 */
export default function IconButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-opsin-2">
      <IconButton variant="primary" icon={<Plus />} label="Add an example reading" />
      <IconButton variant="secondary" icon={<Search />} label="Search example readings" />
      <IconButton variant="quiet" icon={<Bell />} label="Example reminders" />
    </div>
  )
}
