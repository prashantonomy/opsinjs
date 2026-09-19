/**
 * A day's doses as the product logged them, which is the case DoseTracker was
 * built for. Each row names a medicine, marks its state with a word and a shape,
 * and carries the time RelativeTime renders. The states read together as a plain
 * record: some taken, one missed, one skipped, with no figure computed across
 * them and no verdict on any of them.
 *
 * The medicine names are plain placeholders and the times are fixed synthetic
 * instants (ADR 0012), so no row is a real drug, a real dose or a real record.
 * `now` is fixed so the example says the same thing every time it is rendered.
 */

import { DoseTracker } from "@/registry/base-lyra/ui/dose-tracker"

const NOW = "2026-03-14T20:00:00+00:00"

export default function DoseTrackerADaysDoses() {
  return (
    <DoseTracker
      label="A day's doses"
      now={NOW}
      entries={[
        { name: "Morning tablet", time: "2026-03-14T08:00:00+00:00", state: "taken" },
        { name: "Midday capsule", time: "2026-03-14T12:30:00+00:00", state: "taken" },
        { name: "Afternoon tablet", time: "2026-03-14T15:00:00+00:00", state: "missed" },
        { name: "Evening drops", time: "2026-03-14T19:00:00+00:00", state: "skipped" },
      ]}
    />
  )
}
