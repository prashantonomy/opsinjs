/**
 * A reading part-way towards a goal the product set, which is the case GoalRing
 * was built for. The numbers are a fictional step count towards a daily step goal
 * (ADR 0012): nothing was measured from anybody, the goal is the product's own,
 * and the ring carries the activity identity tint so a reader with several rings
 * can tell this one apart. Nothing counts up or sweeps on first paint: the ring
 * is drawn where the reading sits and stops there.
 */

import { GoalRing } from "@/registry/base-lyra/ui/goal-ring"

export default function GoalRingProgressToAGoal() {
  return (
    <GoalRing
      label="Steps today"
      value={6200}
      goal={8000}
      unit="steps"
      category="activity"
    />
  )
}
