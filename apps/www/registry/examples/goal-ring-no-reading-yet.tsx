/**
 * The honest empty state. `value` is null, so nothing has been measured yet, and
 * the ring is drawn empty with words that say so rather than as a value of zero:
 * an empty ring that meant zero and an empty ring that meant "nothing measured"
 * would be the same picture telling two different truths, and only the words keep
 * them apart. The goal and the label are the product's own, and the numbers are
 * fictional (ADR 0012).
 */

import { GoalRing } from "@/registry/base-lyra/ui/goal-ring"

export default function GoalRingNoReadingYet() {
  return (
    <GoalRing
      label="Water today"
      value={null}
      goal={2000}
      unit="ml"
      category="nutrition"
    />
  )
}
