/**
 * The status rides the pill, and the entry stays neutral.
 *
 * Two entries that are identical but for the status: the first carries one and
 * the second does not. The rail, the marker and the entry are the same neutral
 * chrome in both, and only the pill beside the title changes. That is what
 * keeps a record of an event out of the two colour axes.
 *
 * The titles and bodies are synthetic (ADR 0012), and `now` is fixed so the
 * example is the same every render.
 */
import { TimelineEntry } from "@/registry/base-lyra/ui/timeline-entry"

const NOW = "2026-03-14T11:12:00+00:00"

export default function TimelineEntryWithAStatus() {
  return (
    <ol className="m-0 flex w-full max-w-md list-none flex-col p-0">
      <TimelineEntry
        when="2026-03-14T08:12:00+00:00"
        now={NOW}
        title="Example result filed"
        status="attention"
      >
        The status rides the pill. The entry, its rail and its marker stay
        neutral.
      </TimelineEntry>
      <TimelineEntry when="2026-03-11T08:12:00+00:00" now={NOW} title="Example result filed" isLast>
        The same entry with no status. Nothing about the rail or the marker
        changes.
      </TimelineEntry>
    </ol>
  )
}
