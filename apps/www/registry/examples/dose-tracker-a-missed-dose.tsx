/**
 * A single missed dose, shown as a fact and left there. This is the example the
 * roster's safety objection turns on: a missed dose displayed is one product
 * decision away from implying what to do about it. So the row states the miss in
 * a neutral marker with a word and a shape, carries the time, and stops. There is
 * no red, no "act now", no next step and no adherence figure, because whether a
 * missed medicine matters and what to do about it are the product's to decide and
 * to say in a component built for that, never here.
 *
 * The name is a plain placeholder and the times are fixed synthetic instants
 * (ADR 0012). `now` is fixed so the example says the same thing every time.
 */

import { DoseTracker } from "@/registry/base-lyra/ui/dose-tracker"

const NOW = "2026-03-14T20:00:00+00:00"

export default function DoseTrackerAMissedDose() {
  return (
    <DoseTracker
      label="Recent doses"
      now={NOW}
      entries={[
        { name: "Morning tablet", time: "2026-03-14T08:00:00+00:00", state: "taken" },
        {
          name: "Afternoon tablet",
          time: "2026-03-14T15:00:00+00:00",
          state: "missed",
          note: "Marked by you",
        },
      ]}
    />
  )
}
